export function normalizeDesignation(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    // Unit normalization BEFORE punctuation strip (² and ³ are not combining chars)
    .replace(/m²/g, 'm2')
    .replace(/m³/g, 'm3')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function parseNumber(v: string | number | boolean | null | undefined): number | null {
  if (v == null) return null
  if (typeof v === 'boolean') return null
  if (typeof v === 'number') return isFinite(v) ? v : null
  const cleaned = String(v).replace(/\s/g, '').replace(',', '.')
  const n = parseFloat(cleaned)
  return isNaN(n) ? null : n
}

export function similarity(a: string, b: string): number {
  const wa = new Set(normalizeDesignation(a).split(/\s+/).filter(w => w.length > 2))
  const wb = new Set(normalizeDesignation(b).split(/\s+/).filter(w => w.length > 2))
  if (wa.size === 0 && wb.size === 0) return 1
  if (wa.size === 0 || wb.size === 0) return 0
  let inter = 0
  wa.forEach(w => { if (wb.has(w)) inter++ })
  // Overlap coefficient: penalizes only on the smaller set, handles subset designations
  return inter / Math.min(wa.size, wb.size)
}
