import { NextRequest, NextResponse } from 'next/server'
import ExcelJS from 'exceljs'
import { createClient } from '@/lib/supabase/server'
import { parseNumber } from '@/lib/chiffrage/normalize'
import type { FileAnalysis, ColumnMapping } from '@/lib/chiffrage/types'

export const maxDuration = 60

type MatchInput = { rowId: string; pu_ht: number | null; qty_crm?: number | null }

function getColLetter(colIdx: number): string {
  // Handles first 26 columns (A–Z)
  return String.fromCharCode(65 + colIdx)
}

function parseFormulaRowRefs(formulaStr: string, colLetter: string): Set<number> {
  const regex = new RegExp(colLetter.toUpperCase() + '(\\d+)', 'gi')
  const refs = new Set<number>()
  let m
  while ((m = regex.exec(formulaStr)) !== null) {
    refs.add(parseInt(m[1]))
  }
  return refs
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

    const { data: aboData } = await supabase.from('abonnements').select('plan').maybeSingle()
    const plan: string = (aboData as { plan: string } | null)?.plan ?? 'gratuit'
    if (plan !== 'pro' && !plan.startsWith('essai_pro') && plan !== 'fondateurs') {
      return NextResponse.json({ error: 'Fonctionnalité réservée au plan Pro.' }, { status: 403 })
    }

    const formData = await req.formData()
    const acheteurFile = formData.get('acheteur') as File | null
    const matchesStr = formData.get('matches') as string | null
    const mappingsStr = formData.get('acheteurMappings') as string | null
    const structureStr = formData.get('acheteurStructure') as string | null
    const crmFileName = formData.get('crmFileName') as string | null

    if (!acheteurFile || !matchesStr || !mappingsStr || !structureStr) {
      return NextResponse.json({ error: 'Paramètres manquants.' }, { status: 400 })
    }

    const matches = JSON.parse(matchesStr) as MatchInput[]
    const acheteurMappings = JSON.parse(mappingsStr) as Record<string, ColumnMapping>
    const structure = JSON.parse(structureStr) as FileAnalysis

    if (matches.length === 0) {
      const firstSheet = structure.sheets.find(s => !s.isHidden)
      console.error('[chiffrage/generer] nb_lignes=0', {
        sheetName: firstSheet?.sheetName ?? 'inconnu',
        headerRow: firstSheet?.headerRowIndex ?? null,
        columns: firstSheet ? (acheteurMappings[firstSheet.sheetName] ?? firstSheet.mapping) : null,
      })
      // Do NOT save a record with 0 lines
      return NextResponse.json({ error: 'Aucune ligne de prix à générer. Vérifiez le mapping des colonnes.' }, { status: 400 })
    }

    // Build lookup: rowId → MatchInput
    const matchByRowId = new Map<string, MatchInput>()
    for (const m of matches) {
      if (m.pu_ht != null) matchByRowId.set(m.rowId, m)
    }

    // Build sheet meta: column indices per sheet
    type SheetMeta = { puColIdx: number | undefined; totalColIdx: number | undefined; qtyColIdx: number | undefined }
    const sheetMeta = new Map<string, SheetMeta>()
    for (const sheet of structure.sheets) {
      const mapping = acheteurMappings[sheet.sheetName] ?? sheet.mapping
      sheetMeta.set(sheet.sheetName, {
        puColIdx: mapping.pu_ht,
        totalColIdx: mapping.total_ht,
        qtyColIdx: mapping.quantity,
      })
    }

    // Build formula lookup: sheetName__rowIndex → formulaCols
    const formulaLookup = new Map<string, number[]>()
    for (const sheet of structure.sheets) {
      for (const raw of sheet.rawRows) {
        formulaLookup.set(`${sheet.sheetName}__${raw.rowIndex}`, raw.formulaCols)
      }
    }

    // Build designation lookup for warnings
    const designationByRowId = new Map<string, string>()
    for (const sheet of structure.sheets) {
      const mapping = acheteurMappings[sheet.sheetName] ?? sheet.mapping
      const desigIdx = mapping.designation
      if (desigIdx === undefined) continue
      for (const raw of sheet.rawRows) {
        const desig = raw.values[desigIdx]
        if (desig != null) designationByRowId.set(`${sheet.sheetName}__${raw.rowIndex}`, String(desig))
      }
    }

    // Load workbook
    const arrayBuffer = await acheteurFile.arrayBuffer()
    const workbook = new ExcelJS.Workbook()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await workbook.xlsx.load(new Uint8Array(arrayBuffer) as any)

    let nbRapprochees = 0
    let montantTotalHt = 0
    const avertissements: string[] = []

    // Track per-sheet: rowNumber → computed line total (for formula coverage check)
    const lineBySheetRow = new Map<string, number>() // key: "sheetName__rowNumber"

    workbook.eachSheet((worksheet) => {
      const sheetName = worksheet.name
      const meta = sheetMeta.get(sheetName)
      if (!meta || meta.puColIdx === undefined) return

      worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
        const rowId = `${sheetName}__${rowNumber}`
        const match = matchByRowId.get(rowId)
        if (!match || match.pu_ht == null) return

        const pu = match.pu_ht

        // Write PU HT
        const puCell = row.getCell(meta.puColIdx! + 1)
        puCell.value = pu
        nbRapprochees++

        // Determine quantity: use existing cell value, fall back to CRM qty if empty
        let qty: number | null = null
        if (meta.qtyColIdx !== undefined) {
          qty = parseNumber(row.getCell(meta.qtyColIdx + 1).value as string | number | null)
          if (qty == null && match.qty_crm != null) {
            qty = match.qty_crm
            const qtyCell = row.getCell(meta.qtyColIdx + 1)
            if (qtyCell.value == null || qtyCell.value === '') {
              qtyCell.value = qty
            }
          }
        }

        if (qty != null) {
          const lineTotal = Math.round(pu * qty * 100) / 100
          montantTotalHt += lineTotal
          lineBySheetRow.set(rowId, lineTotal)
        }

        // Write total HT only for non-formula cells
        if (meta.totalColIdx !== undefined && qty != null) {
          const formulaCols = formulaLookup.get(rowId) ?? []
          const totalHasFormula = formulaCols.includes(meta.totalColIdx)
          if (!totalHasFormula) {
            const totalCell = row.getCell(meta.totalColIdx + 1)
            const currentTotal = parseNumber(totalCell.value as string | number | null)
            if (currentTotal == null || currentTotal === 0) {
              totalCell.value = Math.round(pu * qty * 100) / 100
            }
          }
        }
      })
    })

    // Formula coverage check: detect total formulas that miss filled price rows
    workbook.eachSheet((worksheet) => {
      const sheetName = worksheet.name
      const meta = sheetMeta.get(sheetName)
      if (!meta || meta.totalColIdx === undefined) return

      const totalColNum = meta.totalColIdx + 1
      const colLetter = getColLetter(meta.totalColIdx)

      worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
        const cell = row.getCell(totalColNum)
        const cv = cell.value
        if (!cv || typeof cv !== 'object') return

        let formulaStr = ''
        if ('formula' in cv) formulaStr = (cv as { formula?: string }).formula ?? ''
        if (!formulaStr.toUpperCase().includes('SUM')) return

        const referenced = parseFormulaRowRefs(formulaStr, colLetter)
        if (referenced.size === 0) return
        const minRef = Math.min(...referenced)
        const maxRef = Math.max(...referenced)

        const missingRows: number[] = []
        for (const [key, lineTotal] of lineBySheetRow) {
          const [rowSheet, rowNumStr] = key.split('__')
          if (rowSheet !== sheetName) continue
          const rowNum = parseInt(rowNumStr)
          // Only flag rows within the range of this formula (avoids flagging PSE rows)
          if (rowNum >= minRef && rowNum <= maxRef && !referenced.has(rowNum) && lineTotal > 0) {
            missingRows.push(rowNum)
          }
        }

        if (missingRows.length > 0) {
          const gapEuros = missingRows.reduce((s, rn) => s + (lineBySheetRow.get(`${sheetName}__${rn}`) ?? 0), 0)
          const desigs = missingRows.map(rn => {
            const d = designationByRowId.get(`${sheetName}__${rn}`)
            return d ? `ligne ${rn} (${d.slice(0, 40)})` : `ligne ${rn}`
          }).join(', ')
          avertissements.push(
            `Feuille "${sheetName}" : la formule du total (ligne ${rowNumber}) omet ${desigs}. ` +
            `Écart : ${gapEuros.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €.`
          )
        }
      })
    })

    if (matchByRowId.size > nbRapprochees) {
      avertissements.push(`${matchByRowId.size - nbRapprochees} ligne(s) non trouvée(s) dans le fichier original.`)
    }

    const buffer = await workbook.xlsx.writeBuffer()
    const baseName = acheteurFile.name.replace(/\.xlsx$/i, '')
    const outputName = `${baseName}_chiffré.xlsx`

    // Save record — only when at least one line was filled
    if (nbRapprochees > 0) {
      await supabase.from('chiffrages').insert({
        user_id: user.id,
        nom_fichier_acheteur: acheteurFile.name,
        nom_fichier_crm: crmFileName ?? 'N/A',
        nb_lignes: matches.length,
        nb_rapprochees: nbRapprochees,
        montant_total_ht: montantTotalHt > 0 ? montantTotalHt : null,
        statut: 'ok',
      })
    }

    return new NextResponse(Buffer.from(buffer as ArrayBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(outputName)}`,
        'X-Montant-Total-Ht': String(montantTotalHt),
        'X-Nb-Rapprochees': String(nbRapprochees),
        'X-Nb-Lignes': String(matches.length),
        'X-Avertissements': encodeURIComponent(JSON.stringify(avertissements)),
      },
    })
  } catch (err) {
    console.error('[chiffrage/generer]', err)
    return NextResponse.json({ error: 'Erreur lors de la génération du fichier.' }, { status: 500 })
  }
}
