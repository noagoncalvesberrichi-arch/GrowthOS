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

    // Gather all rows as arrays of values (up to 2000 total)
    const allCellRows: (string | number | null)[][] = []
    const formulaRowMap: Map<number, number[]> = new Map()

    worksheet.eachRow({ includeEmpty: false }, (row, rIdx) => {
      if (totalRows + allCellRows.length >= MAX_ROWS_TOTAL) return
      const rowArr: (string | number | null)[] = []
      const formulaCols: number[] = []
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        const colIdx = colNumber - 1
        // For merged cells that aren't master, use master value
        const masterCell = cell.isMerged && cell.master !== cell ? cell.master : cell
        rowArr[colIdx] = extractCellValue(masterCell) as string | number | null
        if (masterCell.type === ExcelJS.ValueType.Formula) {
          formulaCols.push(colIdx)
        }
      })
      allCellRows.push(rowArr)
      formulaRowMap.set(rIdx - 1, formulaCols)
    })

    if (allCellRows.length === 0) {
      sheetIdx++
      return
    }

    const headerRowIndex = detectHeaderRow(allCellRows)
    const headerRow = allCellRows[headerRowIndex] ?? []
    const headerValues = headerRow.map(v => (v != null ? String(v) : ''))
    const mapping = detectColumns(headerValues)
    const ambiguous = isAmbiguous(mapping)

    // Build RawRows for data rows (after header)
    const rawRows: RawRow[] = []
    for (let i = headerRowIndex + 1; i < allCellRows.length; i++) {
      const vals = allCellRows[i]
      // Skip completely empty rows
      if (vals.every(v => v == null || v === '')) continue
      const { isTitle, isSubtotal } = classifyRow(
        vals as (string | number | boolean | null)[],
        mapping
      )
      rawRows.push({
        rowIndex: i + 1, // 1-based row index as in Excel
        values: vals as (string | number | boolean | null)[],
        isTitle,
        isSubtotal,
        formulaCols: formulaRowMap.get(i) ?? [],
      })
      totalRows++
    }

    sheets.push({
      sheetName: worksheet.name,
      sheetIndex: sheetIdx,
      isHidden,
      headerRowIndex,
      headerValues,
      mapping,
      mappingAmbiguous: ambiguous,
      rawRows,
    })
    sheetIdx++
  })

  return { fileName, sheets }
}
