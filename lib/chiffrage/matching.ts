import ExcelJS from 'exceljs'
import { parseNumber } from './normalize'

export type MatchInput = {
  rowId: string
  pu_ht: number | null
  qty_crm?: number | null
  unit_acheteur?: string | null
  unit_crm?: string | null
}

export type SheetMeta = {
  puColIdx: number | undefined
  totalColIdx: number | undefined
  qtyColIdx: number | undefined
}

export type ApplyResult = {
  nbRapprochees: number
  montantBaseHt: number
  montantPseHt: number
  montantVarianteHt: number
  avertissements: string[]
}

export function classifySheet(name: string): 'base' | 'pse' | 'variante' {
  const n = name.toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  if (n.includes('VARIANTE') || / VAR$/.test(n) || /^VAR /.test(n)) return 'variante'
  if (n.includes('PSE') || (n.includes('SUPPL') && n.includes('EVENT'))) return 'pse'
  return 'base'
}

export function getColLetter(colIdx: number): string {
  return String.fromCharCode(65 + colIdx)
}

export function parseFormulaRowRefs(formulaStr: string, colLetter: string): Set<number> {
  const regex = new RegExp(colLetter.toUpperCase() + '(\\d+)', 'gi')
  const refs = new Set<number>()
  let m
  while ((m = regex.exec(formulaStr)) !== null) refs.add(parseInt(m[1]))
  return refs
}

export async function appliquerChiffrage(
  workbook: ExcelJS.Workbook,
  matches: MatchInput[],
  sheetMeta: Map<string, SheetMeta>,
  formulaLookup: Map<string, number[]>,
  designationByRowId: Map<string, string>
): Promise<ApplyResult> {
  const matchByRowId = new Map<string, MatchInput>()
  for (const m of matches) matchByRowId.set(m.rowId, m)

  let nbRapprochees = 0
  let montantBaseHt = 0
  let montantPseHt = 0
  let montantVarianteHt = 0
  const avertissements: string[] = []
  const lineBySheetRow = new Map<string, number>()

  workbook.eachSheet((worksheet) => {
    const sheetName = worksheet.name
    const sheetType = classifySheet(sheetName)
    const meta = sheetMeta.get(sheetName)
    if (!meta || meta.puColIdx === undefined) return

    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      const rowId = `${sheetName}__${rowNumber}`
      const match = matchByRowId.get(rowId)
      if (!match || match.pu_ht == null) return
      const pu = match.pu_ht
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const puCell = row.getCell(meta.puColIdx! + 1)
      puCell.value = pu
      nbRapprochees++

      let qty: number | null = null
      if (meta.qtyColIdx !== undefined) {
        qty = parseNumber(row.getCell(meta.qtyColIdx + 1).value as string | number | null)
        if (qty == null && match.qty_crm != null) {
          qty = match.qty_crm
          const qtyCell = row.getCell(meta.qtyColIdx + 1)
          if (qtyCell.value == null || qtyCell.value === '') qtyCell.value = qty
        }
      }

      if (qty != null) {
        const lineTotal = Math.round(pu * qty * 100) / 100
        if (sheetType === 'pse') montantPseHt += lineTotal
        else if (sheetType === 'variante') montantVarianteHt += lineTotal
        else montantBaseHt += lineTotal
        lineBySheetRow.set(rowId, lineTotal)
      }

      // Unit warning
      if (
        match.unit_acheteur && match.unit_crm &&
        match.unit_acheteur.toLowerCase().trim() !== match.unit_crm.toLowerCase().trim()
      ) {
        const desig = designationByRowId.get(rowId) ?? rowId
        avertissements.push(
          `Unité différente pour "${desig.slice(0, 40)}" : acheteur "${match.unit_acheteur}" / devis "${match.unit_crm}"`
        )
      }

      // Write total only for non-formula cells
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

  // Formula coverage check
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
        if (rowNum >= minRef && rowNum <= maxRef && !referenced.has(rowNum) && lineTotal > 0) {
          missingRows.push(rowNum)
        }
      }

      if (missingRows.length > 0) {
        const gapEuros = missingRows.reduce(
          (s, rn) => s + (lineBySheetRow.get(`${sheetName}__${rn}`) ?? 0),
          0
        )
        const desigs = missingRows
          .map(rn => {
            const d = designationByRowId.get(`${sheetName}__${rn}`)
            return d ? `ligne ${rn} (${d.slice(0, 40)})` : `ligne ${rn}`
          })
          .join(', ')
        avertissements.push(
          `Feuille "${sheetName}" : la formule du total (ligne ${rowNumber}) omet ${desigs}. Écart : ${gapEuros.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €.`
        )
      }
    })
  })

  return { nbRapprochees, montantBaseHt, montantPseHt, montantVarianteHt, avertissements }
}
