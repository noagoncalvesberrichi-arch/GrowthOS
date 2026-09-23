import ExcelJS from 'exceljs'
import type { FileAnalysis, RawRow, SheetAnalysis } from './types'
import { detectColumns, detectHeaderRow, classifyRow, isAmbiguous } from './columnDetection'

const MAX_SHEETS = 5
const MAX_ROWS_TOTAL = 2000

function extractCellValue(cell: ExcelJS.Cell): string | number | boolean | null {
  const v = cell.value
  if (v == null) return null
  if (typeof v === 'object' && 'result' in v) {
    const r = (v as { result?: unknown }).result
    if (r == null) return null
    if (typeof r === 'number' || typeof r === 'string' || typeof r === 'boolean') return r
    return String(r)
  }
  if (typeof v === 'object' && 'text' in v) return (v as { text?: string }).text ?? null
  if (typeof v === 'object' && v instanceof Date) return v.getFullYear() || null
  if (typeof v === 'number' || typeof v === 'string' || typeof v === 'boolean') return v
  return null
}

function isMasterCell(cell: ExcelJS.Cell): boolean {
  return !cell.isMerged || (cell.master === cell)
}

type RowEntry = {
  rIdx: number  // actual 1-based Excel row number from eachRow callback
  values: (string | number | null)[]
  formulaCols: number[]
}

export async function parseXlsx(buffer: ArrayBuffer, fileName: string): Promise<FileAnalysis> {
  const workbook = new ExcelJS.Workbook()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await workbook.xlsx.load(new Uint8Array(buffer) as any)

  const sheets: SheetAnalysis[] = []
  let totalRows = 0
  let sheetIdx = 0

  workbook.eachSheet((worksheet) => {
    if (sheets.length >= MAX_SHEETS) return
    if (totalRows >= MAX_ROWS_TOTAL) return

    const isHidden = worksheet.state === 'hidden' || worksheet.state === 'veryHidden'

    // Gather all non-empty rows, preserving actual Excel row numbers (rIdx)
    const allRows: RowEntry[] = []

    worksheet.eachRow({ includeEmpty: false }, (row, rIdx) => {
      if (totalRows + allRows.length >= MAX_ROWS_TOTAL) return
      const values: (string | number | null)[] = []
      const formulaCols: number[] = []
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        const colIdx = colNumber - 1
        // For merged cells that aren't master, use master value
        const masterCell = cell.isMerged && cell.master !== cell ? cell.master : cell
        values[colIdx] = extractCellValue(masterCell) as string | number | null
        if (masterCell.type === ExcelJS.ValueType.Formula) {
          formulaCols.push(colIdx)
        }
      })
      allRows.push({ rIdx, values, formulaCols })
    })

    if (allRows.length === 0) {
      sheetIdx++
      return
    }

    const headerIdx = detectHeaderRow(allRows.map(r => r.values))
    const headerRow = allRows[headerIdx] ?? { values: [] }
    const headerValues = headerRow.values.map(v => (v != null ? String(v) : ''))
    const mapping = detectColumns(headerValues)
    const ambiguous = isAmbiguous(mapping)

    // Build RawRows for data rows (after header), using actual Excel row numbers
    const rawRows: RawRow[] = []
    for (let i = headerIdx + 1; i < allRows.length; i++) {
      const { rIdx, values, formulaCols } = allRows[i]
      if (values.every(v => v == null || v === '')) continue
      const { isTitle, isSubtotal } = classifyRow(
        values as (string | number | boolean | null)[],
        mapping
      )
      rawRows.push({
        rowIndex: rIdx,  // actual 1-based Excel row number, not array index
        values: values as (string | number | boolean | null)[],
        isTitle,
        isSubtotal,
        formulaCols,
      })
      totalRows++
    }

    sheets.push({
      sheetName: worksheet.name,
      sheetIndex: sheetIdx,
      isHidden,
      headerRowIndex: allRows[headerIdx]?.rIdx ?? headerIdx + 1,
      headerValues,
      mapping,
      mappingAmbiguous: ambiguous,
      rawRows,
    })
    sheetIdx++
  })

  return { fileName, sheets }
}
