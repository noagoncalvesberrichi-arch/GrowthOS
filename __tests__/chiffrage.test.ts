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
