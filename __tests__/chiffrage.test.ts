import { describe, test, expect, beforeAll } from 'vitest'
import ExcelJS from 'exceljs'
import {
  classifySheet,
  parseFormulaRowRefs,
  appliquerChiffrage,
  type MatchInput,
  type SheetMeta,
  type ApplyResult,
} from '../lib/chiffrage/matching'
import { matchRows } from '../lib/chiffrage/rowMatching'
import type { ParsedRow } from '../lib/chiffrage/types'

// ---------------------------------------------------------------------------
// Helper pour construire des ParsedRow fictives sans ExcelJS
// ---------------------------------------------------------------------------

function makeRow(overrides: Partial<ParsedRow> & { id: string }): ParsedRow {
  const parts = overrides.id.split('__')
  return {
    sheetName: parts[0] ?? 'Sheet',
    rowIndex: parseInt(parts[1] ?? '1'),
    isTitle: false,
    isSubtotal: false,
    numero: null,
    designation: null,
    unit: 'u',
    quantity: 1,
    pu_ht: null,
    total_ht: null,
    totalHasFormula: false,
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildWorkbook(): ExcelJS.Workbook {
  const wb = new ExcelJS.Workbook()

  // ---- Feuille "Offre de base" -------------------------------------------
  const wsBase = wb.addWorksheet('Offre de base')

  // Row 3 : en-têtes
  wsBase.getRow(3).getCell(1).value = 'N°'
  wsBase.getRow(3).getCell(2).value = 'Désignation'
  wsBase.getRow(3).getCell(3).value = 'Unité'
  wsBase.getRow(3).getCell(4).value = 'Quantité'
  wsBase.getRow(3).getCell(5).value = 'PU HT'
  wsBase.getRow(3).getCell(6).value = 'Total HT'

  // Row 4 : section fusionnée
  wsBase.mergeCells('A4:F4')
  wsBase.getCell('A4').value = 'PRESTATIONS PRINCIPALES'

  // Row 5 : 1.1 Pose de clôture — D=100, E=null, F=null
  wsBase.getRow(5).getCell(1).value = '1.1'
  wsBase.getRow(5).getCell(2).value = 'Pose de clôture'
  wsBase.getRow(5).getCell(3).value = 'ml'
  wsBase.getRow(5).getCell(4).value = 100

  // Row 6 : 1.2 Fourniture de gazon — D=50 (délibérément omis par la formule)
  wsBase.getRow(6).getCell(1).value = '1.2'
  wsBase.getRow(6).getCell(2).value = 'Fourniture de gazon'
  wsBase.getRow(6).getCell(3).value = 'm²'
  wsBase.getRow(6).getCell(4).value = 50

  // Row 7 : 2.1 Terrassement — D=10
  wsBase.getRow(7).getCell(1).value = '2.1'
  wsBase.getRow(7).getCell(2).value = 'Terrassement'
  wsBase.getRow(7).getCell(3).value = 'm³'
  wsBase.getRow(7).getCell(4).value = 10

  // Row 8 : PSE1 — D=null (qty viendra de qty_crm=5)
  wsBase.getRow(8).getCell(1).value = 'PSE1'
  wsBase.getRow(8).getCell(2).value = 'Option supplémentaire'
  wsBase.getRow(8).getCell(3).value = 'ENS'
  // D8 intentionnellement absent

  // Row 9 : TOTAL avec formule qui omet F6
  wsBase.getRow(9).getCell(6).value = { formula: 'SUM(F5,F7:F8)', result: 0 }

  // Row 10 : label PSE (présent dans la feuille base, pas une feuille PSE)
  wsBase.getRow(10).getCell(1).value = 'PRESTATIONS SUPPLEMENTAIRES EVENTUELLES'

  // ---- Feuille "Variante" ------------------------------------------------
  const wsVar = wb.addWorksheet('Variante')

  wsVar.getRow(3).getCell(1).value = 'N°'
  wsVar.getRow(3).getCell(2).value = 'Désignation'
  wsVar.getRow(3).getCell(3).value = 'Unité'
  wsVar.getRow(3).getCell(4).value = 'Quantité'
  wsVar.getRow(3).getCell(5).value = 'PU HT'
  wsVar.getRow(3).getCell(6).value = 'Total HT'

  wsVar.getRow(5).getCell(1).value = '1.1'
  wsVar.getRow(5).getCell(2).value = 'Pose de clôture variante'
  wsVar.getRow(5).getCell(3).value = 'ml'
  wsVar.getRow(5).getCell(4).value = 100

  return wb
}

// ---------------------------------------------------------------------------
// Données de test partagées
// ---------------------------------------------------------------------------

const matches: MatchInput[] = [
  { rowId: 'Offre de base__5', pu_ht: 25,  qty_crm: null, unit_acheteur: 'ml',  unit_crm: 'ml' },
  { rowId: 'Offre de base__6', pu_ht: 40,  qty_crm: null, unit_acheteur: 'm²',  unit_crm: 'm²' },
  { rowId: 'Offre de base__7', pu_ht: 30,  qty_crm: null, unit_acheteur: 'm³',  unit_crm: 'm³' },
  { rowId: 'Offre de base__8', pu_ht: 100, qty_crm: 5,    unit_acheteur: 'ENS', unit_crm: 'Forfait' },
  { rowId: 'Variante__5',      pu_ht: 22,  qty_crm: null, unit_acheteur: 'ml',  unit_crm: 'ml' },
]

const sheetMetaMap = new Map<string, SheetMeta>([
  ['Offre de base', { puColIdx: 4, totalColIdx: 5, qtyColIdx: 3 }],
  ['Variante',      { puColIdx: 4, totalColIdx: 5, qtyColIdx: 3 }],
])

// La cellule F9 contient une formule → ne pas écraser
const formulaLookupMap = new Map<string, number[]>([
  ['Offre de base__9', [5]],
])

const designationByRowIdMap = new Map<string, string>([
  ['Offre de base__5', 'Pose de clôture'],
  ['Offre de base__6', 'Fourniture de gazon'],
  ['Offre de base__7', 'Terrassement'],
  ['Offre de base__8', 'Option supplémentaire'],
  ['Variante__5',      'Pose de clôture variante'],
])

// ---------------------------------------------------------------------------
// 1. classifySheet
// ---------------------------------------------------------------------------

describe('classifySheet : noms courants', () => {
  test("'Offre de base' → base", () => {
    expect(classifySheet('Offre de base')).toBe('base')
  })

  test("'PSE' → pse", () => {
    expect(classifySheet('PSE')).toBe('pse')
  })

  test("'PRESTATIONS SUPPL EVENTUELLES' → pse", () => {
    expect(classifySheet('PRESTATIONS SUPPL EVENTUELLES')).toBe('pse')
  })

  test("'Variante' → variante", () => {
    expect(classifySheet('Variante')).toBe('variante')
  })

  test("'LOT 1 VAR' → variante (suffixe VAR)", () => {
    expect(classifySheet('LOT 1 VAR')).toBe('variante')
  })
})

// ---------------------------------------------------------------------------
// 2. parseFormulaRowRefs
// ---------------------------------------------------------------------------

describe('parseFormulaRowRefs : extraction des lignes', () => {
  test('SUM avec virgule et plage → {5, 7, 8}', () => {
    expect(parseFormulaRowRefs('SUM(F5,F7:F8)', 'F')).toEqual(new Set([5, 7, 8]))
  })

  test('addition simple → {3, 5, 7}', () => {
    expect(parseFormulaRowRefs('F3+F5+F7', 'F')).toEqual(new Set([3, 5, 7]))
  })
})

// ---------------------------------------------------------------------------
// 3. appliquerChiffrage — scénario principal
// ---------------------------------------------------------------------------

describe('appliquerChiffrage', () => {
  let wb: ExcelJS.Workbook
  let result: ApplyResult

  beforeAll(async () => {
    wb = buildWorkbook()
    result = await appliquerChiffrage(
      wb,
      matches,
      sheetMetaMap,
      formulaLookupMap,
      designationByRowIdMap
    )
  })

  test('prix écrits dans les bonnes cellules', () => {
    const wsBase = wb.getWorksheet('Offre de base')!
    expect(wsBase.getRow(5).getCell(5).value).toBe(25)   // E5
    expect(wsBase.getRow(6).getCell(5).value).toBe(40)   // E6
    expect(wsBase.getRow(7).getCell(5).value).toBe(30)   // E7
    expect(wsBase.getRow(8).getCell(5).value).toBe(100)  // E8
    const wsVar = wb.getWorksheet('Variante')!
    expect(wsVar.getRow(5).getCell(5).value).toBe(22)    // Variante E5
  })

  test('montants séparés base/variante/PSE', () => {
    // base = 25×100 + 40×50 + 30×10 + 100×5 = 2500+2000+300+500 = 5300
    expect(result.montantBaseHt).toBe(5300)
    // variante = 22×100 = 2200
    expect(result.montantVarianteHt).toBe(2200)
    // aucune feuille PSE dans le workbook de test
    expect(result.montantPseHt).toBe(0)
  })

  test('variante non additionnée à la base', () => {
    expect(result.montantBaseHt + result.montantVarianteHt).not.toBe(result.montantBaseHt)
  })

  test('formule omise → avertissement avec écart en euros', () => {
    const warn = result.avertissements.find(a => a.includes('formule'))
    expect(warn).toBeDefined()
    // F6 (40×50=2000) est omis par SUM(F5,F7:F8) → écart = 2000 €
    const expectedGap =
      (2000).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'
    expect(warn).toContain(expectedGap)
  })

  test("avertissement d'unité ENS ≠ Forfait", () => {
    const warn = result.avertissements.find(a => a.includes('ENS') && a.includes('Forfait'))
    expect(warn).toBeDefined()
  })

  test('cellule F9 (formule) non modifiée', () => {
    const wsBase = wb.getWorksheet('Offre de base')!
    const f9 = wsBase.getRow(9).getCell(6).value
    expect(f9).toBeDefined()
    expect(typeof f9).toBe('object')
    // La valeur doit toujours être un objet formule
    expect(f9).toHaveProperty('formula', 'SUM(F5,F7:F8)')
  })

  test('qty de la feuille utilisée si disponible (row 5 : D=100 → total F5=2500)', () => {
    const wsBase = wb.getWorksheet('Offre de base')!
    expect(wsBase.getRow(5).getCell(6).value).toBe(2500)  // F5 = 25×100
  })

  test('qty_crm utilisée si cellule D vide (row 8 : qty_crm=5 → D8 mis à 5)', () => {
    const wsBase = wb.getWorksheet('Offre de base')!
    expect(wsBase.getRow(8).getCell(4).value).toBe(5)     // D8
  })
})

// ---------------------------------------------------------------------------
// 4. Piège production : numéros de postes inversés entre CRM et acheteur
//    CRM : 2.1 = grillages, 2.09 = contrôle labo
//    Acheteur : 2.09 = grillages, 2.10 (stocké 2.1) = contrôle
//    Sans matching par désignation, les prix s'inversent.
// ---------------------------------------------------------------------------

describe('Piège 1 : numéros de postes inversés — le matching par désignation protège', () => {
  const crmRows: ParsedRow[] = [
    makeRow({ id: 'CRM__5', designation: 'Fourniture et pose de 2 grillages', numero: '2.1', pu_ht: 150 }),
    makeRow({ id: 'CRM__6', designation: 'Contrôle par un laboratoire indépendant', numero: '2.09', pu_ht: 300 }),
  ]

  // Acheteur : numéros inversés vs CRM. 2.10 est stocké comme le nombre 2.1 dans Excel.
  const acheteurRows: ParsedRow[] = [
    makeRow({ id: 'Acheteur__5', designation: 'Fourniture et pose de 2 grillages', numero: '2.09' }),
    makeRow({ id: 'Acheteur__6', designation: 'Contrôle par un laboratoire indépendant', numero: '2.10' }),
  ]

  const { matched, unmatched } = matchRows(acheteurRows, crmRows)

  test('les deux lignes sont rapprochées (aucune non-matchée)', () => {
    expect(unmatched).toHaveLength(0)
    expect(matched).toHaveLength(2)
  })

  test('grillages (acheteur 2.09) reçoivent le prix grillages CRM = 150, pas 300', () => {
    const m = matched.find(r => r.acheteurRowId === 'Acheteur__5')
    expect(m).toBeDefined()
    expect(m?.pu_ht_crm).toBe(150)
  })

  test('contrôle labo (acheteur 2.10) reçoit le prix contrôle CRM = 300, pas 150', () => {
    const m = matched.find(r => r.acheteurRowId === 'Acheteur__6')
    expect(m).toBeDefined()
    expect(m?.pu_ht_crm).toBe(300)
  })

  test('numeroMismatch=true signale le conflit pour les deux lignes', () => {
    // Acheteur 2.09 ≠ CRM 2.1 ; acheteur 2.10 (→2.1) ≠ CRM 2.09
    expect(matched.every(m => m.numeroMismatch)).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// 5. Piège production : feuille non chiffrée présente avant la feuille chiffrée
//    Export CRM contient "Devis chiffré" (avec prix) ET "Devis Non Chiffré" (sans prix).
//    Si la feuille sans prix est traitée en premier, le matching retourne pu_ht=null.
// ---------------------------------------------------------------------------

describe('Piège 2 : feuille non chiffrée — les prix viennent toujours de la feuille chiffrée', () => {
  const crmPriced: ParsedRow[] = [
    makeRow({ id: 'Devis chiffré__5', sheetName: 'Devis chiffré', designation: 'Pose de clôture', numero: '1.1', pu_ht: 120 }),
    makeRow({ id: 'Devis chiffré__6', sheetName: 'Devis chiffré', designation: 'Fourniture gazon synthétique', numero: '1.2', pu_ht: 200 }),
  ]

  const crmUnpriced: ParsedRow[] = [
    makeRow({ id: 'Devis Non Chiffré__5', sheetName: 'Devis Non Chiffré', designation: 'Pose de clôture', numero: '1.1', pu_ht: null }),
    makeRow({ id: 'Devis Non Chiffré__6', sheetName: 'Devis Non Chiffré', designation: 'Fourniture gazon synthétique', numero: '1.2', pu_ht: null }),
  ]

  const acheteurRows: ParsedRow[] = [
    makeRow({ id: 'Acheteur__5', designation: 'Pose de clôture', numero: '1.1' }),
    makeRow({ id: 'Acheteur__6', designation: 'Fourniture gazon synthétique', numero: '1.2' }),
  ]

  test('ordre naturel (chiffrée en premier) → prix non null', () => {
    const { matched } = matchRows(acheteurRows, [...crmPriced, ...crmUnpriced])
    expect(matched).toHaveLength(2)
    expect(matched.every(m => m.pu_ht_crm != null)).toBe(true)
  })

  test('ordre inversé (non chiffrée en premier) → prix non null (ne doit pas prendre la feuille vide)', () => {
    const { matched } = matchRows(acheteurRows, [...crmUnpriced, ...crmPriced])
    expect(matched).toHaveLength(2)
    expect(matched.every(m => m.pu_ht_crm != null)).toBe(true)
  })

  test('prix corrects dans les deux ordres de feuilles', () => {
    for (const crmRows of [[...crmPriced, ...crmUnpriced], [...crmUnpriced, ...crmPriced]]) {
      const { matched } = matchRows(acheteurRows, crmRows)
      expect(matched.find(m => m.acheteurRowId === 'Acheteur__5')?.pu_ht_crm).toBe(120)
      expect(matched.find(m => m.acheteurRowId === 'Acheteur__6')?.pu_ht_crm).toBe(200)
    }
  })
})

// ---------------------------------------------------------------------------
// 6. Piège production : numéro en double dans deux sections distinctes
//    "1.01" dans "Dispositions générales" ET dans "Prestations supplémentaires"
//    avec des désignations différentes et des prix différents.
// ---------------------------------------------------------------------------

describe('Piège 3 : numéro en double — chaque ligne reçoit son propre prix', () => {
  const crmRows: ParsedRow[] = [
    makeRow({ id: 'CRM__3', designation: 'Installation de chantier', numero: '1.01', pu_ht: 500, quantity: 1 }),
    makeRow({ id: 'CRM__7', designation: 'Essais de réception par laboratoire agréé', numero: '1.01', pu_ht: 800, quantity: 1 }),
  ]

  const acheteurRows: ParsedRow[] = [
    makeRow({ id: 'Acheteur__3', designation: 'Installation de chantier', numero: '1.01' }),
    makeRow({ id: 'Acheteur__7', designation: 'Essais de réception par laboratoire agréé', numero: '1.01' }),
  ]

  const { matched, unmatched } = matchRows(acheteurRows, crmRows)

  test('les deux lignes sont rapprochées (aucune non-matchée)', () => {
    expect(unmatched).toHaveLength(0)
    expect(matched).toHaveLength(2)
  })

  test('Installation de chantier reçoit pu=500 (pas 800)', () => {
    const m = matched.find(r => r.acheteurRowId === 'Acheteur__3')
    expect(m?.pu_ht_crm).toBe(500)
  })

  test('Essais de réception reçoivent pu=800 (pas 500)', () => {
    const m = matched.find(r => r.acheteurRowId === 'Acheteur__7')
    expect(m?.pu_ht_crm).toBe(800)
  })

  test('le fallback numéro seul ne crée pas de faux rapprochement (2 candidats → skip)', () => {
    // Si on force une ligne sans désignation avec numero=1.01, elle doit rester non-matchée
    const rowSansDesig = makeRow({ id: 'Acheteur__99', designation: null, numero: '1.01' })
    const { unmatched: u2 } = matchRows([rowSansDesig], crmRows)
    expect(u2).toHaveLength(1)
  })
})
