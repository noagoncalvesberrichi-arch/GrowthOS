export function normalizeDesignation(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
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
  return inter / Math.min(wa.size, wb.size)
}

// Normalize a numero value: convert floats to consistent string (2.10 → "2.1")
export function normalizeNumero(s: string): string {
  const n = parseFloat(s.replace(',', '.'))
  if (!isNaN(n)) return String(n)
  return s.toLowerCase().trim()
}

// Normalize a unit value for comparison
export function normalizeUnit(u: string): string {
  return u.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim()
    .replace(/\bforfait\b/g, 'f')
    .replace(/\s+/g, '')
}
