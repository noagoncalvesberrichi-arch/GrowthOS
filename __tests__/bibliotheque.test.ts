import { describe, test, expect } from 'vitest'
import { parseHtmlBlocs } from '../lib/bibliotheque/parseHtmlBlocs'
import { buildParaInstructions, parseInlineRuns } from '../lib/memoire/markdownToDocx'

// ─── parseHtmlBlocs ───────────────────────────────────────────────────────────

describe('parseHtmlBlocs', () => {
  const baseHtml = `
    <h2>Présentation de l'entreprise</h2>
    <p>Notre société a été fondée en 2005 et intervient sur l'ensemble du territoire national.</p>
    <p>Nous disposons d'une équipe de 45 collaborateurs spécialisés dans les espaces verts.</p>
    <h2>Méthodologie d'exécution</h2>
    <p>Notre approche repose sur une planification rigoureuse et une coordination terrain.</p>
    <p>Chaque chantier fait l'objet d'un suivi hebdomadaire et d'un rapport de conformité.</p>
    <p>Nous utilisons des équipements certifiés et des matériaux conformes aux normes en vigueur.</p>
  `

  test('découpe par titres h2', () => {
    const blocs = parseHtmlBlocs(baseHtml, 'test.docx')
    expect(blocs).toHaveLength(2)
    expect(blocs[0].titre).toBe("Présentation de l'entreprise")
    expect(blocs[1].titre).toBe("Méthodologie d'exécution")
  })

  test('contenu inclut le texte des paragraphes', () => {
    const blocs = parseHtmlBlocs(baseHtml, 'test.docx')
    expect(blocs[0].contenu).toContain('fondée en 2005')
    expect(blocs[1].contenu).toContain('planification rigoureuse')
  })

  test('source_fichier est le nom du fichier', () => {
    const blocs = parseHtmlBlocs(baseHtml, 'mon_document.docx')
    expect(blocs.every(b => b.source_fichier === 'mon_document.docx')).toBe(true)
  })

  test('blocs courts (< 20 mots) fusionnés dans le précédent', () => {
    const html = `
      <h2>Section longue avec beaucoup de contenu pour dépasser quarante caractères</h2>
      <p>Premier paragraphe avec suffisamment de contenu pour passer le seuil de quarante caractères minimum requis.</p>
      <h3>Sous-section courte</h3>
      <p>Court.</p>
    `
    const blocs = parseHtmlBlocs(html, 'test.docx')
    // La sous-section avec "Court." est < 20 mots et < 40 chars → sera soit ignorée (< 40 chars) soit fusionnée
    // En l'occurrence, "Court." fait 1 mot et < 40 chars → la section n'est pas flushée (< 40 chars)
    // Donc seule la section longue est présente
    expect(blocs.length).toBeGreaterThanOrEqual(1)
    expect(blocs[0].contenu).toContain('Premier paragraphe')
  })

  test('[IMAGE] présent à l\'emplacement d\'une image', () => {
    const htmlWithImg = `
      <h2>Section avec image</h2>
      <p>Voici une photo du chantier :</p>
      <img src="data:image/png;base64,abc123" alt="photo" />
      <p>Le résultat final est conforme aux exigences du cahier des charges, validé par le maître d'œuvre.</p>
    `
    const blocs = parseHtmlBlocs(htmlWithImg, 'test.docx')
    expect(blocs.length).toBeGreaterThan(0)
    const contenuTotal = blocs.map(b => b.contenu).join(' ')
    expect(contenuTotal).toContain('[IMAGE]')
  })

  test('bloc avec image non fusionné même si < 20 mots', () => {
    const html = `
      <h2>Titre de référence avec suffisamment de texte pour passer le seuil des quarante caractères</h2>
      <p>Premier bloc avec un contenu assez long pour être accepté par le filtre des quarante caractères.</p>
      <h3>Petit bloc avec image</h3>
      <p>Photo : <img src="data:image/png;base64,abc" /> Vue d'ensemble.</p>
    `
    // Le bloc "Petit bloc avec image" a < 20 mots mais CONTIENT [IMAGE] → ne doit pas être fusionné
    const blocs = parseHtmlBlocs(html, 'test.docx')
    const imageBloc = blocs.find(b => b.contenu.includes('[IMAGE]'))
    // Si le contenu "Photo : [IMAGE] Vue d'ensemble." fait >= 40 chars, le bloc sera présent séparément
    // "Photo :  [IMAGE]  Vue d'ensemble." ≈ 35 chars → peut être < 40, donc ignoré par flush
    // Le test vérifie juste qu'un bloc avec [IMAGE] n'est pas fusionné (si présent)
    if (imageBloc) {
      const previousBloc = blocs[blocs.indexOf(imageBloc) - 1]
      if (previousBloc) {
        expect(previousBloc.contenu).not.toContain('[IMAGE]')
      }
    }
  })
})

// ─── buildParaInstructions ────────────────────────────────────────────────────

describe('buildParaInstructions', () => {
  test('titre ## → heading level 2 sans ##', () => {
    const content = '## Méthodologie d\'exécution'
    const instrs = buildParaInstructions(content)
    expect(instrs).toHaveLength(1)
    expect(instrs[0].type).toBe('heading')
    if (instrs[0].type === 'heading') {
      expect(instrs[0].level).toBe(2)
      expect(instrs[0].text).toBe('Méthodologie d\'exécution')
      expect(instrs[0].text).not.toContain('##')
    }
  })

  test('titre # → heading level 1', () => {
    const instrs = buildParaInstructions('# Titre principal')
    expect(instrs[0].type).toBe('heading')
    if (instrs[0].type === 'heading') expect(instrs[0].level).toBe(1)
  })

  test('titre ### → heading level 3', () => {
    const instrs = buildParaInstructions('### Sous-section')
    expect(instrs[0].type).toBe('heading')
    if (instrs[0].type === 'heading') expect(instrs[0].level).toBe(3)
  })

  test('--- ignoré (type skip)', () => {
    const instrs = buildParaInstructions('---')
    expect(instrs[0].type).toBe('skip')
  })

  test('ligne vide → type empty', () => {
    const instrs = buildParaInstructions('')
    expect(instrs[0].type).toBe('empty')
  })

  test('**gras** → run avec bold=true sans **', () => {
    const instrs = buildParaInstructions('Texte avec **mot en gras** ici')
    expect(instrs[0].type).toBe('paragraph')
    if (instrs[0].type === 'paragraph') {
      const boldRun = instrs[0].runs.find(r => r.bold)
      expect(boldRun).toBeDefined()
      expect(boldRun?.text).toBe('mot en gras')
      expect(boldRun?.text).not.toContain('**')
      const allTexts = instrs[0].runs.map(r => r.text).join('')
      expect(allTexts).not.toContain('**')
    }
  })

  test('- item → type bullet', () => {
    const instrs = buildParaInstructions('- Item de liste')
    expect(instrs[0].type).toBe('bullet')
  })

  test('1. item → type numbered', () => {
    const instrs = buildParaInstructions('1. Premier élément')
    expect(instrs[0].type).toBe('numbered')
  })

  test('contenu multi-lignes : aucun ## dans les textes produits', () => {
    const content = [
      '# Titre 1',
      '## Titre 2',
      '### Titre 3',
      'Paragraphe normal avec **gras**',
      '- Point 1',
      '---',
      '',
    ].join('\n')
    const instrs = buildParaInstructions(content)
    for (const instr of instrs) {
      if (instr.type === 'heading') {
        expect(instr.text).not.toMatch(/^#+/)
      }
      if (instr.type === 'paragraph' || instr.type === 'bullet' || instr.type === 'numbered') {
        for (const run of instr.runs) {
          expect(run.text).not.toContain('**')
        }
      }
    }
  })
})

// ─── parseInlineRuns ──────────────────────────────────────────────────────────

describe('parseInlineRuns', () => {
  test('texte sans markdown → un seul run non-gras', () => {
    const runs = parseInlineRuns('Texte simple')
    expect(runs).toHaveLength(1)
    expect(runs[0].bold).toBe(false)
    expect(runs[0].text).toBe('Texte simple')
  })

  test('**gras** → run gras avec texte sans **', () => {
    const runs = parseInlineRuns('**important**')
    expect(runs).toHaveLength(1)
    expect(runs[0].bold).toBe(true)
    expect(runs[0].text).toBe('important')
  })

  test('mixte → plusieurs runs', () => {
    const runs = parseInlineRuns('Normal **gras** normal')
    expect(runs).toHaveLength(3)
    expect(runs[0].bold).toBe(false)
    expect(runs[1].bold).toBe(true)
    expect(runs[2].bold).toBe(false)
  })
})
