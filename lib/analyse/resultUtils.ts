import type { AOResult } from '@/app/(dashboard)/dashboard/analyser/actions'

// ─── Countdown ────────────────────────────────────────────────────────────────

/** Returns days remaining until deadline (negative = past). null if unparseable. */
export function calculateCountdown(dateStr: string | null, now = new Date()): number | null {
  if (!dateStr) return null
  // Accepts ISO dates and French formats like "15/01/2025" or "15 janvier 2025"
  let d: Date | null = null

  // Try ISO first
  const iso = new Date(dateStr)
  if (!isNaN(iso.getTime())) {
    d = iso
  } else {
    // Try DD/MM/YYYY
    const slashMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
    if (slashMatch) {
      d = new Date(Number(slashMatch[3]), Number(slashMatch[2]) - 1, Number(slashMatch[1]))
    } else {
      // Try "15 janvier 2025" style
      const MONTHS: Record<string, number> = {
        janvier: 0, février: 1, mars: 2, avril: 3, mai: 4, juin: 5,
        juillet: 6, août: 7, septembre: 8, octobre: 9, novembre: 10, décembre: 11,
      }
      const wordMatch = dateStr.match(/^(\d{1,2})\s+(\w+)\s+(\d{4})$/)
      if (wordMatch) {
        const month = MONTHS[wordMatch[2].toLowerCase()]
        if (month !== undefined) {
          d = new Date(Number(wordMatch[3]), month, Number(wordMatch[1]))
        }
      }
    }
  }

  if (!d || isNaN(d.getTime())) return null
  const todayMs = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
  const targetMs = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())
  return Math.round((targetMs - todayMs) / (1000 * 60 * 60 * 24))
}

// ─── Document classification ──────────────────────────────────────────────────

export type DocCategory = 'stratly' | 'ready' | 'todo'

const STRATLY_KEYWORDS = [
  'mémoire technique', 'mémoire', 'acte d\'engagement', 'acte engagement',
  'dpgf', 'décomposition du prix', 'decomposition du prix', 'bpu', 'bordereau de prix',
  'dqe', 'détail quantitatif', 'detail quantitatif',
]

const READY_KEYWORDS = [
  'kbis', 'extrait kbis', 'k-bis', 'qualification', 'qualibat', 'qualifelec',
  'certification', 'attestation', 'assurance', 'décennale', 'decennale',
  'chiffre d\'affaires', 'bilan', 'liasse fiscale',
  'dc1', 'dc2', 'dume', 'références', 'references', 'référence chantier',
  'organigramme', 'curriculum vitae', 'cv',
]

/** Classify a document name into Stratly-generated, ready from profile, or to-do */
export function classifyDocument(docName: string): DocCategory {
  const lower = docName.toLowerCase()
  if (STRATLY_KEYWORDS.some(k => lower.includes(k))) return 'stratly'
  if (READY_KEYWORDS.some(k => lower.includes(k))) return 'ready'
  return 'todo'
}

// ─── Parse notation ponderation ───────────────────────────────────────────────

/** Parse "40 %" → 40. Returns null if unparseable. */
export function parseNotationWeight(pondStr: string): number | null {
  const m = pondStr.match(/(\d+(?:[.,]\d+)?)\s*%?/)
  if (!m) return null
  const n = parseFloat(m[1].replace(',', '.'))
  return isNaN(n) ? null : n
}

// ─── Next action ─────────────────────────────────────────────────────────────

export type NextAction = {
  label: string
  detail: string
  href: string
  icon: 'visite' | 'memoire' | 'chiffrage' | 'envoi'
}

/** Returns ordered list of applicable next actions for this analysis */
export function getNextActions(result: AOResult, analyseId: string): NextAction[] {
  const actions: NextAction[] = []

  // 1. Visit (if scheduled)
  const visite = result.dates_cles?.visite
  if (visite) {
    actions.push({
      label: 'Planifier la visite obligatoire',
      detail: visite,
      href: '#visite',
      icon: 'visite',
    })
  }

  // 2. Mémoire technique
  actions.push({
    label: 'Générer le mémoire technique',
    detail: 'Trame pré-remplie depuis votre profil',
    href: `/dashboard/memoire?analyse=${analyseId}`,
    icon: 'memoire',
  })

  // 3. Chiffrage (if DPGF/documents present)
  const hasChiffrage = result.documents_a_remplir?.some(d =>
    classifyDocument(d.nom_fichier) === 'stratly' &&
    ['dpgf', 'décomposition du prix', 'bpu', 'dqe'].some(k => d.nom_fichier.toLowerCase().includes(k))
  )
  if (hasChiffrage || (result.documents_a_remplir?.length ?? 0) > 0) {
    actions.push({
      label: 'Compléter le chiffrage',
      detail: 'DPGF / BPU à remplir',
      href: '/dashboard/chiffrage',
      icon: 'chiffrage',
    })
  }

  // 4. Send dossier
  const dateLimite = result.dates_cles?.date_limite_offres
  actions.push({
    label: 'Envoyer le dossier',
    detail: dateLimite ? `Avant le ${dateLimite}` : 'Vérifier la date limite',
    href: '#envoi',
    icon: 'envoi',
  })

  return actions
}
