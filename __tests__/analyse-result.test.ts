import { describe, test, expect } from 'vitest'
import { calculateCountdown, classifyDocument, parseNotationWeight, getNextActions } from '../lib/analyse/resultUtils'
import type { AOResult } from '../app/(dashboard)/dashboard/analyser/actions'

// ─── calculateCountdown ───────────────────────────────────────────────────────

describe('calculateCountdown', () => {
  const REF = new Date('2025-11-15') // reference "today"

  test('renvoie le nombre de jours restants pour une date ISO future', () => {
    expect(calculateCountdown('2025-11-20', REF)).toBe(5)
  })

  test('renvoie 0 si la date est aujourd\'hui', () => {
    expect(calculateCountdown('2025-11-15', REF)).toBe(0)
  })

  test('renvoie un nombre négatif pour une date passée', () => {
    expect(calculateCountdown('2025-11-10', REF)).toBe(-5)
  })

  test('accepte le format DD/MM/YYYY', () => {
    expect(calculateCountdown('20/11/2025', REF)).toBe(5)
  })

  test('accepte le format "15 novembre 2025"', () => {
    expect(calculateCountdown('15 novembre 2025', REF)).toBe(0)
  })

  test('accepte le format "3 janvier 2026"', () => {
    expect(calculateCountdown('3 janvier 2026', REF)).toBe(49)
  })

  test('renvoie null pour une chaîne vide', () => {
    expect(calculateCountdown('')).toBeNull()
  })

  test('renvoie null pour null', () => {
    expect(calculateCountdown(null)).toBeNull()
  })

  test('renvoie null pour une date invalide', () => {
    expect(calculateCountdown('pas une date')).toBeNull()
  })
})

// ─── classifyDocument ─────────────────────────────────────────────────────────

describe('classifyDocument', () => {
  test('mémoire technique → stratly', () => {
    expect(classifyDocument('Mémoire technique')).toBe('stratly')
    expect(classifyDocument('mémoire_technique_lot2.docx')).toBe('stratly')
  })

  test('acte d\'engagement → stratly', () => {
    expect(classifyDocument('Acte d\'engagement.pdf')).toBe('stratly')
    expect(classifyDocument('ACTE ENGAGEMENT')).toBe('stratly')
  })

  test('DPGF → stratly', () => {
    expect(classifyDocument('DPGF_lot3.xlsx')).toBe('stratly')
    expect(classifyDocument('décomposition du prix global')).toBe('stratly')
  })

  test('BPU, DQE → stratly', () => {
    expect(classifyDocument('BPU_chiffrage.xlsx')).toBe('stratly')
    expect(classifyDocument('DQE_lot2.xlsx')).toBe('stratly')
  })

  test('Kbis → ready', () => {
    expect(classifyDocument('Extrait Kbis.pdf')).toBe('ready')
  })

  test('qualification → ready', () => {
    expect(classifyDocument('Qualibat 3521.pdf')).toBe('ready')
  })

  test('attestation assurance → ready', () => {
    expect(classifyDocument('Attestation assurance décennale')).toBe('ready')
  })

  test('DC1 DC2 → ready', () => {
    expect(classifyDocument('DC1.pdf')).toBe('ready')
    expect(classifyDocument('DC2_rempli.pdf')).toBe('ready')
  })

  test('document inconnu → todo', () => {
    expect(classifyDocument('Proposition technique.pdf')).toBe('todo')
    expect(classifyDocument('note_methodologique.pdf')).toBe('todo')
  })

  test('case-insensitive', () => {
    expect(classifyDocument('MÉMOIRE TECHNIQUE')).toBe('stratly')
    expect(classifyDocument('KBIS')).toBe('ready')
  })
})

// ─── parseNotationWeight ──────────────────────────────────────────────────────

describe('parseNotationWeight', () => {
  test('parse "40 %"', () => {
    expect(parseNotationWeight('40 %')).toBe(40)
  })

  test('parse "40%"', () => {
    expect(parseNotationWeight('40%')).toBe(40)
  })

  test('parse "40"', () => {
    expect(parseNotationWeight('40')).toBe(40)
  })

  test('parse "33,3 %"', () => {
    expect(parseNotationWeight('33,3 %')).toBeCloseTo(33.3)
  })

  test('parse "25 points"', () => {
    expect(parseNotationWeight('25 points')).toBe(25)
  })

  test('renvoie null pour une chaîne sans nombre', () => {
    expect(parseNotationWeight('non précisé')).toBeNull()
  })

  test('renvoie null pour chaîne vide', () => {
    expect(parseNotationWeight('')).toBeNull()
  })
})

// ─── getNextActions ───────────────────────────────────────────────────────────

function makeResult(overrides: Partial<AOResult> = {}): AOResult {
  return {
    objet: 'Marché test',
    type_procedure: 'MAPA',
    acheteur: 'Mairie de Lyon',
    lieu_execution: null,
    siret_acheteur: null,
    code_cpv: null,
    montant_estime: null,
    lots: [],
    criteres_notation: [],
    pieces_a_fournir: [],
    dates_cles: { date_limite_offres: null, visite: null, validite_offres: null, autres_dates: [] },
    points_de_vigilance: [],
    go_no_go: null,
    documents_a_remplir: [],
    ...overrides,
  }
}

describe('getNextActions', () => {
  test('toujours inclut mémoire et envoi', () => {
    const actions = getNextActions(makeResult(), 'id-123')
    const icons = actions.map(a => a.icon)
    expect(icons).toContain('memoire')
    expect(icons).toContain('envoi')
  })

  test('inclut visite si dates_cles.visite est renseigné', () => {
    const result = makeResult({ dates_cles: { date_limite_offres: null, visite: '20/11/2025', validite_offres: null, autres_dates: [] } })
    const actions = getNextActions(result, 'id-123')
    expect(actions[0].icon).toBe('visite')
  })

  test('n\'inclut pas visite si absent', () => {
    const actions = getNextActions(makeResult(), 'id-123')
    expect(actions.map(a => a.icon)).not.toContain('visite')
  })

  test('inclut chiffrage si documents_a_remplir contient un DPGF', () => {
    const result = makeResult({
      documents_a_remplir: [{ nom_fichier: 'DPGF_lot1.xlsx', type_document: 'DPGF' }],
    })
    const actions = getNextActions(result, 'id-123')
    expect(actions.map(a => a.icon)).toContain('chiffrage')
  })

  test('lien mémoire contient l\'analyseId', () => {
    const actions = getNextActions(makeResult(), 'abc-456')
    const memoire = actions.find(a => a.icon === 'memoire')
    expect(memoire?.href).toContain('abc-456')
  })

  test('envoi mentionne la date limite si disponible', () => {
    const result = makeResult({ dates_cles: { date_limite_offres: '15/01/2025', visite: null, validite_offres: null, autres_dates: [] } })
    const actions = getNextActions(result, 'id-123')
    const envoi = actions.find(a => a.icon === 'envoi')
    expect(envoi?.detail).toContain('15/01/2025')
  })
})
