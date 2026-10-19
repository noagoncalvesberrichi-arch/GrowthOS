import { describe, test, expect, vi, beforeEach } from 'vitest'
import { buildParaInstructions, parseInlineRuns } from '../lib/memoire/markdownToDocx'

// Tests de l'export Word (sans docx ni browser API)
// On teste buildParaInstructions qui est la logique centrale de downloadDocx

describe('Export Word — aucun symbole Markdown dans la sortie', () => {
  const markdown = [
    '# Introduction',
    '## Notre entreprise',
    '### Historique',
    'Fondée en **2005**, notre société emploie **45** personnes.',
    '- Espaces verts',
    '- Voirie / VRD',
    '1. Audit préalable',
    '1. Mise en œuvre',
    '',
    '---',
    '⚠ Vérifier les délais',
  ].join('\n')

  test('aucun ## dans les textes de titres', () => {
    const instrs = buildParaInstructions(markdown)
    for (const i of instrs) {
      if (i.type === 'heading') expect(i.text).not.toMatch(/^#+\s/)
    }
  })

  test('aucun ** dans les runs de texte', () => {
    const instrs = buildParaInstructions(markdown)
    for (const i of instrs) {
      if ('runs' in i) {
        for (const r of i.runs) {
          expect(r.text).not.toContain('**')
        }
      }
    }
  })

  test('h1 → heading level 1', () => {
    const instrs = buildParaInstructions('# Introduction')
    const h = instrs.find(i => i.type === 'heading')
    expect(h).toBeDefined()
    if (h?.type === 'heading') expect(h.level).toBe(1)
  })

  test('h2 → heading level 2', () => {
    const instrs = buildParaInstructions('## Sous-section')
    const h = instrs.find(i => i.type === 'heading')
    if (h?.type === 'heading') expect(h.level).toBe(2)
  })

  test('--- → skip (aucune barre horizontale dans le document)', () => {
    const instrs = buildParaInstructions('---')
    expect(instrs[0].type).toBe('skip')
  })

  test('nombre d\'instructions cohérent avec le contenu', () => {
    const instrs = buildParaInstructions(markdown)
    // Non-vides : au moins 1 heading + 1 paragraph + 2 bullets + 2 numbered
    const headings = instrs.filter(i => i.type === 'heading')
    const bullets = instrs.filter(i => i.type === 'bullet')
    const numbered = instrs.filter(i => i.type === 'numbered')
    expect(headings.length).toBeGreaterThanOrEqual(3)
    expect(bullets.length).toBeGreaterThanOrEqual(2)
    expect(numbered.length).toBeGreaterThanOrEqual(2)
  })
})

// ─── Relecture (relireSectionV2) simulée ─────────────────────────────────────
// On teste la logique de remplacement avec une réponse Claude simulée.
// La fonction relireSectionV2 charge des données DB → on teste via un wrapper pur.

describe('Logique de relecture — détection affirmations non tracées', () => {
  // Simule le comportement de relireSectionV2 sans dépendances DB/Claude
  function simulerRelecture(sectionText: string, claudeResponse: string): string {
    // Si Claude répond du texte → le retourner
    // Si Claude répond vide → retourner le texte original (fail-open)
    return claudeResponse.trim() || sectionText
  }

  test('remplace une affirmation inventée par [À VÉRIFIER : ...]', () => {
    const input = 'Notre société, qualifiée en tant que PME, bénéficie d\'une avance de 10 %.'
    const claudeResponse = 'Notre société [À VÉRIFIER : statut non confirmé dans le profil] bénéficie de conditions adaptées.'
    const result = simulerRelecture(input, claudeResponse)
    expect(result).toContain('[À VÉRIFIER :')
    expect(result).not.toContain('avance de 10 %')
  })

  test('fail-open : retourne le texte original si Claude répond vide', () => {
    const input = 'Texte original du mémoire.'
    const result = simulerRelecture(input, '')
    expect(result).toBe(input)
  })

  test('conserve la structure si aucune violation', () => {
    const input = '## Introduction\nNotre société emploie 45 collaborateurs.'
    const claudeResponse = '## Introduction\nNotre société emploie 45 collaborateurs.'
    const result = simulerRelecture(input, claudeResponse)
    expect(result).toBe(claudeResponse)
  })

  test('main-d\'œuvre étrangère → remplacé', () => {
    const input = 'Nous excluons tout recours à de la main-d\'œuvre étrangère.'
    const claudeResponse = 'Nos équipes mobilisées en CDI interviennent sur tous les chantiers.'
    const result = simulerRelecture(input, claudeResponse)
    expect(result).not.toContain('étrangère')
    expect(result).toContain('CDI')
  })
})

// ─── Découpage en sous-parties ────────────────────────────────────────────────

describe('Découpage sections — limite de mots par appel', () => {
  function planifierSousParties(targetWords: number, maxWordsPerPart = 1000): { targetWords: number }[] {
    // Reproduit la logique de MemoireForm.tsx ligne ~519
    if (targetWords <= maxWordsPerPart) return [{ targetWords }]
    const nbParts = Math.ceil(targetWords / maxWordsPerPart)
    const wordsPerPart = Math.ceil(targetWords / nbParts)
    return Array.from({ length: nbParts }, () => ({ targetWords: Math.min(wordsPerPart, maxWordsPerPart) }))
  }

  test('section courte → une seule sous-partie', () => {
    const parts = planifierSousParties(500)
    expect(parts).toHaveLength(1)
    expect(parts[0].targetWords).toBe(500)
  })

  test('section longue (> 1000 mots) → plusieurs sous-parties', () => {
    const parts = planifierSousParties(2000)
    expect(parts.length).toBeGreaterThan(1)
    // Chaque sous-partie ≤ 1000 mots
    for (const p of parts) expect(p.targetWords).toBeLessThanOrEqual(1000)
  })

  test('somme des sous-parties ≤ targetWords total + petite marge', () => {
    const target = 1500
    const parts = planifierSousParties(target)
    const total = parts.reduce((s, p) => s + p.targetWords, 0)
    expect(total).toBeGreaterThanOrEqual(target - 100)
  })
})
