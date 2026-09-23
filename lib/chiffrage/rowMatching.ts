import type { ColumnMapping, ParsedRow, MatchedRow, RawRow } from './types'
import { parseNumber, normalizeDesignation, similarity } from './normalize'

export function applyMapping(rawRow: RawRow, mapping: ColumnMapping, sheetName: string): ParsedRow {
  const v = rawRow.values
  const get = (role: keyof ColumnMapping) => {
    const idx = mapping[role]
    if (idx === undefined || idx >= v.length) return null
    const val = v[idx]
    return val != null ? val : null
  }
  const desigIdx = mapping.designation
  const totalIdx = mapping.total_ht

  return {
    id: `${sheetName}__${rawRow.rowIndex}`,
    sheetName,
    rowIndex: rawRow.rowIndex,
    isTitle: rawRow.isTitle,
    isSubtotal: rawRow.isSubtotal,
    numero: get('numero') != null ? String(get('numero')) : null,
    designation: desigIdx !== undefined && v[desigIdx] != null ? String(v[desigIdx]) : null,
    unit: get('unit') != null ? String(get('unit')) : null,
    quantity: parseNumber(get('quantity') as string | number | null),
    pu_ht: parseNumber(get('pu_ht') as string | number | null),
    total_ht: parseNumber(get('total_ht') as string | number | null),
    totalHasFormula: totalIdx !== undefined ? rawRow.formulaCols.includes(totalIdx) : false,
  }
}

const SIMILARITY_THRESHOLD = 0.85

export function matchRows(
  acheteurRows: ParsedRow[],
  crmRows: ParsedRow[]
): { matched: MatchedRow[]; unmatched: ParsedRow[] } {
  const matched: MatchedRow[] = []
  const unmatched: ParsedRow[] = []

  // Build lookup maps for CRM
  const crmByNumero = new Map<string, ParsedRow>()
  const crmByNorm = new Map<string, ParsedRow>()
  for (const row of crmRows) {
    if (row.numero) crmByNumero.set(row.numero.trim(), row)
    if (row.designation) crmByNorm.set(normalizeDesignation(row.designation), row)
  }

  for (const aRow of acheteurRows) {
    if (aRow.isTitle || aRow.isSubtotal) continue

    let found: ParsedRow | null = null
    let confidence = 0

    // Phase (a): exact numero match
    if (aRow.numero && crmByNumero.has(aRow.numero.trim())) {
      found = crmByNumero.get(aRow.numero.trim())!
      confidence = 1.0
    }

    // Phase (b): exact normalized designation match
    if (!found && aRow.designation) {
      const norm = normalizeDesignation(aRow.designation)
      if (crmByNorm.has(norm)) {
        found = crmByNorm.get(norm)!
        confidence = 0.95
      }
    }

    // Phase (c): best similarity ≥ threshold
    if (!found && aRow.designation) {
      let bestScore = 0
      let bestRow: ParsedRow | null = null
      for (const cRow of crmRows) {
        if (!cRow.designation) continue
        const score = similarity(aRow.designation, cRow.designation)
        if (score > bestScore) { bestScore = score; bestRow = cRow }
      }
      if (bestScore >= SIMILARITY_THRESHOLD) {
        found = bestRow
        confidence = bestScore
      }
    }

    if (found) {
      const quantityMismatch =
        aRow.quantity != null && found.quantity != null && aRow.quantity !== found.quantity
      matched.push({
        acheteurRowId: aRow.id,
        crmRowId: found.id,
        confidence,
        pu_ht_crm: found.pu_ht,
        quantityMismatch,
      })
    } else {
      unmatched.push(aRow)
    }
  }

  return { matched, unmatched }
}
