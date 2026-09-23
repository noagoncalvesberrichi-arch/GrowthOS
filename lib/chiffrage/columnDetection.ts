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

function headerScore(header: string, role: ColumnRole): number {
  const h = header.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  const priority = PRIORITY_KEYWORDS[role]
  for (const kw of priority) {
    if (h.includes(kw)) return 2
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

  // Two passes: first priority keywords, then regular
  for (const pass of [2, 1] as const) {
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
  const qtyIdx = mapping.quantity
  const puIdx = mapping.pu_ht
  const totalIdx = mapping.total_ht

  const hasQty = qtyIdx !== undefined && rawValues[qtyIdx] != null && rawValues[qtyIdx] !== ''
  const hasPu = puIdx !== undefined && rawValues[puIdx] != null && rawValues[puIdx] !== ''
  const hasTotal = totalIdx !== undefined && rawValues[totalIdx] != null && rawValues[totalIdx] !== ''

  const desigLower = desig.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  const isSubtotal =
    desigLower.includes('total') ||
    desigLower.includes('sous-total') ||
    desigLower.includes('sous total') ||
    desigLower.includes('total general') ||
    (hasTotal && !hasPu && !hasQty)

  const nonEmpty = rawValues.filter(v => v != null && v !== '').length
  const isTitle = !isSubtotal && desig.length > 0 && nonEmpty <= 2 && !hasPu && !hasQty && !hasTotal

  return { isTitle, isSubtotal }
}

export function isAmbiguous(mapping: ColumnMapping): boolean {
  return mapping.designation === undefined || mapping.pu_ht === undefined
}
