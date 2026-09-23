import { NextRequest, NextResponse } from 'next/server'
import ExcelJS from 'exceljs'
import { createClient } from '@/lib/supabase/server'
import { parseNumber } from '@/lib/chiffrage/normalize'
import type { FileAnalysis, ColumnMapping } from '@/lib/chiffrage/types'

export const maxDuration = 60

type MatchInput = { rowId: string; pu_ht: number | null }

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

    if (!acheteurFile || !matchesStr || !mappingsStr || !structureStr) {
      return NextResponse.json({ error: 'Paramètres manquants.' }, { status: 400 })
    }

    const matches = JSON.parse(matchesStr) as MatchInput[]
    const acheteurMappings = JSON.parse(mappingsStr) as Record<string, ColumnMapping>
    const structure = JSON.parse(structureStr) as FileAnalysis

    // Build lookup: rowId → pu_ht
    const puByRowId = new Map<string, number | null>()
    for (const m of matches) {
      if (m.pu_ht != null) puByRowId.set(m.rowId, m.pu_ht)
    }

    // Build lookup: `sheetName__rowIndex` → { puColIdx, totalColIdx, qtyColIdx }
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

    // Build lookup for formula detection: `sheetName__rowIndex` → formulaCols
    const formulaLookup = new Map<string, number[]>()
    for (const sheet of structure.sheets) {
      for (const raw of sheet.rawRows) {
        formulaLookup.set(`${sheet.sheetName}__${raw.rowIndex}`, raw.formulaCols)
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

    workbook.eachSheet((worksheet) => {
      const sheetName = worksheet.name
      const meta = sheetMeta.get(sheetName)
      if (!meta || meta.puColIdx === undefined) return

      worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
        const rowId = `${sheetName}__${rowNumber}`
        const pu = puByRowId.get(rowId)
        if (pu == null) return

        // Write PU HT
        const puCell = row.getCell(meta.puColIdx! + 1) // ExcelJS is 1-based
        puCell.value = pu
        nbRapprochees++

        // Write total HT only if cell is empty (no formula)
        if (meta.totalColIdx !== undefined) {
          const formulaCols = formulaLookup.get(rowId) ?? []
          const totalHasFormula = formulaCols.includes(meta.totalColIdx)
          if (!totalHasFormula) {
            // Check if currently empty
            const totalCell = row.getCell(meta.totalColIdx + 1)
            const currentTotal = parseNumber(totalCell.value as string | number | null)
            if (currentTotal == null || currentTotal === 0) {
              // Compute quantity from the sheet
              let qty: number | null = null
              if (meta.qtyColIdx !== undefined) {
                const qtyCell = row.getCell(meta.qtyColIdx + 1)
                qty = parseNumber(qtyCell.value as string | number | null)
              }
              if (qty != null) {
                const total = Math.round(pu * qty * 100) / 100
                totalCell.value = total
                montantTotalHt += total
              } else {
                montantTotalHt += pu
              }
            } else {
              montantTotalHt += currentTotal
            }
          }
        }
      })

      // Also sum up existing totals from formula cells (they compute based on what we wrote)
    })

    if (puByRowId.size > nbRapprochees) {
      avertissements.push(`${puByRowId.size - nbRapprochees} ligne(s) non trouvée(s) dans le fichier original.`)
    }

    const buffer = await workbook.xlsx.writeBuffer()

    const baseName = acheteurFile.name.replace(/\.xlsx$/i, '')
    const outputName = `${baseName}_chiffré.xlsx`

    // Save record to DB
    await supabase.from('chiffrages').insert({
      user_id: user.id,
      nom_fichier_acheteur: acheteurFile.name,
      nom_fichier_crm: 'N/A',
      nb_lignes: matches.length,
      nb_rapprochees: nbRapprochees,
      montant_total_ht: montantTotalHt > 0 ? montantTotalHt : null,
      statut: 'ok',
    })

    return new NextResponse(Buffer.from(buffer as ArrayBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(outputName)}`,
        'X-Montant-Total-Ht': String(montantTotalHt),
        'X-Nb-Rapprochees': String(nbRapprochees),
        'X-Nb-Lignes': String(matches.length),
      },
    })
  } catch (err) {
    console.error('[chiffrage/generer]', err)
    return NextResponse.json({ error: 'Erreur lors de la génération du fichier.' }, { status: 500 })
  }
}
