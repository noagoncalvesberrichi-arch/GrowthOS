import type { ColumnMapping, ColumnRole } from './types'

const KEYWORDS: Record<ColumnRole, string[]> = {
  numero:      ['n°', 'num', 'poste', 'réf', 'ref', 'article', 'code'],
  designation: ['désignation', 'designation', 'libellé', 'libelle', 'description', 'intitulé', 'intitule', 'prestation', 'ouvrage', 'travaux'],
  unit:        ['unité', 'unite', 'u.', ' u ', 'unit'],
  quantity:    ['quantité', 'quantite', 'qté', 'qte', 'qt.', 'nbre', 'nb '],
  pu_ht:       ['prix unitaire', 'p.u. ht', 'pu ht', 'pht', 'prix unit', 'p.u.'],
  total_ht:    ['total ht', 'montant ht', 'total_ht', 'montant'],
}

const PRIORITY_KEYWORDS: Record<ColumnRole, string[]> = {
  numero:      [],
  designation: [],
  unit:        [],
  quantity:    [],
  pu_ht:       ['prix unitaire', 'p.u. ht', 'pu ht'],
  total_ht:    ['total ht', 'montant ht'],
}

// Exact-match abbreviations common in French BTP spreadsheets
const EXACT_MATCH: Partial<Record<ColumnRole, string[]>> = {
  pu_ht:    ['pu', 'p.u.'],
  unit:     ['u'],
  quantity: ['q', 'qt', 'qte'],
}

function normalizeHeader(h: string): string {
  return h.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim()
}

function headerScore(header: string, role: ColumnRole): number {
  const h = normalizeHeader(header)
  // Exact match for short abbreviations (highest priority)
  const exact = EXACT_MATCH[role] ?? []
  if (exact.includes(h)) return 2

  const priority = PRIORITY_KEYWORDS[role]
  for (const kw of priority) {
    if (h.includes(kw)) return 3
  }
  for (const kw of KEYWORDS[role]) {
    if (h.includes(kw)) return 1
  }
  return 0
}

export function detectColumns(headerValues: string[]): ColumnMapping {
  const mapping: ColumnMapping = {}
  const roles: ColumnRole[] = ['numero', 'designation', 'unit', 'quantity', 'pu_ht', 'total_ht']
  const assigned = new Set<number>()

  // Three passes: priority keywords (3), exact abbreviations (2), regular (1)
  for (const pass of [3, 2, 1] as const) {
    for (const role of roles) {
      if (mapping[role] !== undefined) continue
      let bestIdx = -1
      let bestScore = 0
      for (let i = 0; i < headerValues.length; i++) {
        if (assigned.has(i)) continue
        const s = headerScore(headerValues[i], role)
        if (s >= pass && s > bestScore) { bestScore = s; bestIdx = i }
      }
      if (bestIdx >= 0) {
        mapping[role] = bestIdx
        assigned.add(bestIdx)
      }
    }
  }
  return mapping
}

export function detectHeaderRow(rows: (string | number | null)[][]): number {
  let bestRow = 0
  let bestScore = 0
  const roles: ColumnRole[] = ['designation', 'unit', 'quantity', 'pu_ht', 'total_ht']
  for (let i = 0; i < Math.min(rows.length, 12); i++) {
    const row = rows[i]
    let score = 0
    for (const cell of row) {
      if (cell == null) continue
      const s = String(cell)
      for (const role of roles) {
        if (headerScore(s, role) > 0) score++
      }
    }
    if (score > bestScore) { bestScore = score; bestRow = i }
  }
  return bestRow
}

export function classifyRow(
  rawValues: (string | number | boolean | null)[],
  mapping: ColumnMapping
): { isTitle: boolean; isSubtotal: boolean } {
  const desigIdx = mapping.designation
  const desig = desigIdx !== undefined ? String(rawValues[desigIdx] ?? '').trim() : ''
  const desigVal = desigIdx !== undefined ? rawValues[desigIdx] : null
  const qtyIdx = mapping.quantity
  const puIdx = mapping.pu_ht
  const totalIdx = mapping.total_ht

  // Detect merged-cell section headers: the designation text is repeated across multiple columns
  const allSameAsDesig =
    desigVal != null &&
    desigVal !== '' &&
    rawValues.filter(v => v != null && v !== '' && String(v) === String(desigVal)).length >= 3

  // Treat value as "real" only if it's different from the designation (not a merged artefact)
  const isRealValue = (v: string | number | boolean | null | undefined) =>
    v != null && v !== '' && String(v) !== String(desigVal ?? '')

  const hasQty   = qtyIdx   !== undefined && isRealValue(rawValues[qtyIdx])
  const hasPu    = puIdx    !== undefined && isRealValue(rawValues[puIdx])
  const hasTotal = totalIdx !== undefined && isRealValue(rawValues[totalIdx])

  const desigLower = desig.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  const isSubtotal =
    desigLower.includes('total') ||
    desigLower.includes('sous-total') ||
    desigLower.includes('sous total') ||
    desigLower.includes('total general') ||
    (hasTotal && !hasPu && !hasQty)

  const nonEmpty = rawValues.filter(v => v != null && v !== '').length
  const isTitle = !isSubtotal && desig.length > 0 && (nonEmpty <= 2 || allSameAsDesig) && !hasPu && !hasQty && !hasTotal

  return { isTitle, isSubtotal }
}

export function isAmbiguous(mapping: ColumnMapping): boolean {
  return mapping.designation === undefined || mapping.pu_ht === undefined
}
