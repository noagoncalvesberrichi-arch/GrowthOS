/**
 * Run with: npx tsx tests/chiffrage.test.ts
 */
import ExcelJS from 'exceljs'
import { normalizeDesignation, parseNumber, similarity } from '../lib/chiffrage/normalize'
import { detectColumns, detectHeaderRow, classifyRow, isAmbiguous } from '../lib/chiffrage/columnDetection'
import { applyMapping, matchRows } from '../lib/chiffrage/rowMatching'
import { montantEnLettres } from '../lib/montantEnLettres'
import type { RawRow, ColumnMapping } from '../lib/chiffrage/types'

let passed = 0
let failed = 0

function test(name: string, fn: () => void) {
  try {
    fn()
    console.log(`  ✓ ${name}`)
    passed++
  } catch (e) {
    console.log(`  ✗ ${name}: ${e instanceof Error ? e.message : e}`)
    failed++
  }
}

function assert(condition: boolean, msg?: string) {
  if (!condition) throw new Error(msg ?? 'Assertion failed')
}

function assertEq<T>(actual: T, expected: T, msg?: string) {
  if (actual !== expected) throw new Error(`${msg ?? ''} Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`)
}

function assertApprox(actual: number, expected: number, tolerance = 0.01, msg?: string) {
  if (Math.abs(actual - expected) > tolerance) throw new Error(`${msg ?? ''} Expected ~${expected}, got ${actual}`)
}

// ─── normalizeDesignation ─────────────────────────────────────────────────────
console.log('\nnormalizeDesignation')
test('lowercases and removes accents', () => {
  assertEq(normalizeDesignation('Béton ARMÉ'), 'beton arme')
})
test('replaces m² with m2', () => {
  assertEq(normalizeDesignation('carrelage m² sol'), 'carrelage m2 sol')
})
test('removes punctuation', () => {
  assertEq(normalizeDesignation('enduit (lissé), 2 couches'), 'enduit lisse 2 couches')
})
test('normalizes multiple spaces', () => {
  assertEq(normalizeDesignation('  peinture   acrylique  '), 'peinture acrylique')
})

// ─── parseNumber ─────────────────────────────────────────────────────────────
console.log('\nparseNumber')
test('"1 250,50" → 1250.5', () => assertApprox(parseNumber('1 250,50')!, 1250.5))
test('"1250.50" → 1250.5', () => assertApprox(parseNumber('1250.50')!, 1250.5))
test('null → null', () => assertEq(parseNumber(null), null))
test('boolean → null', () => assertEq(parseNumber(false), null))
test('number passthrough', () => assertApprox(parseNumber(123.45)!, 123.45))

// ─── similarity ──────────────────────────────────────────────────────────────
console.log('\nsimilarity')
test('identical strings → 1.0', () => assertApprox(similarity('béton armé', 'béton armé'), 1.0))
test('accent variation ≥ 0.85', () => assert(similarity('beton arme', 'Béton Armé') >= 0.85))
test('abbreviation match ≥ 0.5', () => assert(similarity('enduit béton lissé murs', 'endt béton lissé') >= 0.50))
test('completely different < 0.2', () => assert(similarity('carrelage sol', 'peinture plafond') < 0.2))
test('known match fouilles ≥ 0.7', () => assert(similarity('Fouilles en rigole pour semelles filantes', 'Fouilles en rigole - semelles filantes') >= 0.7))

// ─── detectColumns ────────────────────────────────────────────────────────────
console.log('\ndetectColumns')
test('standard DPGF headers', () => {
  const headers = ['N°', 'Désignation des travaux', 'Unité', 'Quantité', 'Prix Unitaire HT', 'Montant HT']
  const m = detectColumns(headers)
  assertEq(m.designation, 1)
  assertEq(m.unit, 2)
  assertEq(m.quantity, 3)
  assertEq(m.pu_ht, 4)
  assertEq(m.total_ht, 5)
  assertEq(m.numero, 0)
})
test('CRM headers', () => {
  const headers = ['Référence', 'Désignation', 'Unité', 'Qté', 'PU HT']
  const m = detectColumns(headers)
  assertEq(m.designation, 1)
  assertEq(m.quantity, 3)
  assertEq(m.pu_ht, 4)
})
test('ambiguous when missing designation', () => {
  assert(isAmbiguous({ pu_ht: 4, total_ht: 5 }))
})
test('not ambiguous when both present', () => {
  assert(!isAmbiguous({ designation: 1, pu_ht: 4 }))
})

// ─── classifyRow ──────────────────────────────────────────────────────────────
console.log('\nclassifyRow')
test('price row is neither title nor subtotal', () => {
  const m: ColumnMapping = { designation: 1, unit: 2, quantity: 3, pu_ht: 4 }
  const { isTitle, isSubtotal } = classifyRow(['1.1', 'Béton de propreté', 'm³', 12, null, null], m)
  assert(!isTitle && !isSubtotal)
})
test('title row detected', () => {
  const m: ColumnMapping = { designation: 1, unit: 2, quantity: 3, pu_ht: 4 }
  const { isTitle } = classifyRow(['1', '1 - TERRASSEMENTS', '', '', '', ''], m)
  assert(isTitle)
})
test('subtotal row detected', () => {
  const m: ColumnMapping = { designation: 1, unit: 2, quantity: 3, pu_ht: 4, total_ht: 5 }
  const { isSubtotal } = classifyRow(['', 'Total lot 1', '', '', '', 1234], m)
  assert(isSubtotal)
})

// ─── matchRows ────────────────────────────────────────────────────────────────
console.log('\nmatchRows')

function makeRow(id: string, designation: string, pu: number | null = null, numero: string | null = null): import('../lib/chiffrage/types').ParsedRow {
  return { id, sheetName: 'test', rowIndex: 0, isTitle: false, isSubtotal: false,
    numero, designation, unit: 'm²', quantity: 10, pu_ht: pu, total_ht: null, totalHasFormula: false }
}

test('exact normalized match', () => {
  const acheteur = [makeRow('a1', 'Béton armé pour semelles')]
  const crm = [makeRow('c1', 'beton arme pour semelles', 285)]
  const { matched } = matchRows(acheteur, crm)
  assert(matched.length === 1 && matched[0].confidence >= 0.85)
})
test('numero match', () => {
  const acheteur = [makeRow('a1', 'Quelque chose', null, '2.1')]
  const crm = [makeRow('c1', 'Autre désignation', 95, '2.1')]
  const { matched } = matchRows(acheteur, crm)
  assertEq(matched.length, 1)
  assertApprox(matched[0].confidence, 1.0)
})
test('unmatched when too different', () => {
  const acheteur = [makeRow('a1', 'Carrelage sol 60x60')]
  const crm = [makeRow('c1', 'Peinture plafonds', 9)]
  const { unmatched } = matchRows(acheteur, crm)
  assertEq(unmatched.length, 1)
})

// ─── Integration: parse + match fixtures ─────────────────────────────────────
console.log('\nIntegration: generate fixtures in-memory and test matching')

async function buildInMemoryDPGF(): Promise<Buffer> {
  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet('Lot 1')
  ws.addRow(['N°', 'Désignation', 'Unité', 'Quantité', 'Prix Unitaire HT', 'Montant HT'])
  const items = [
    ['1.1', 'Fouilles en rigole pour semelles filantes', 'm³', 45, null],
    ['1.2', 'Béton armé pour semelles filantes', 'm³', 28, null],
    ['1.3', 'Parpaings creux 20x20x50 cm', 'm²', 120, null],
    ['1.4', 'Enduit béton lissé sur murs', 'm²', 320, null],
    ['1.5', 'Carrelage grès cérame 60x60 cm', 'm²', 150, null],
  ]
  for (let i = 0; i < items.length; i++) {
    const rowNum = i + 2
    const r = ws.addRow([...items[i], { formula: `D${rowNum}*E${rowNum}`, result: 0 }])
    void r
  }
  ws.addRow(['', 'TOTAL', '', '', '', { formula: 'SUM(F2:F6)', result: 0 }])
  const buf = await wb.xlsx.writeBuffer()
  return Buffer.from(buf as ArrayBuffer)
}

async function buildInMemoryCRM(): Promise<Buffer> {
  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet('CRM')
  ws.addRow(['Ref', 'Désignation', 'U', 'Qté', 'PU HT'])
  ws.addRow(['C1', 'Fouilles en rigole - semelles filantes', 'm³', 45, 28.50])
  ws.addRow(['C2', 'Beton arme semelles filantes', 'm³', 28, 285.00])
  ws.addRow(['C3', 'Parpaings creux 20x20x50', 'm²', 120, 38.00])
  ws.addRow(['C4', 'Enduit beton lisse murs', 'm²', 320, 14.50])
  ws.addRow(['C5', 'Carrelage grès 60x60', 'm²', 150, 58.00])
  const buf = await wb.xlsx.writeBuffer()
  return Buffer.from(buf as ArrayBuffer)
}

async function runIntegrationTest() {
  const [dpgfBuf, crmBuf] = await Promise.all([buildInMemoryDPGF(), buildInMemoryCRM()])

  // Load DPGF
  const dpgfWb = new ExcelJS.Workbook()
  await dpgfWb.xlsx.load(dpgfBuf)

  // Parse manually (mimic excelParser logic)
  const dpgfRows: RawRow[] = []
  const mapping: ColumnMapping = { numero: 0, designation: 1, unit: 2, quantity: 3, pu_ht: 4, total_ht: 5 }
  dpgfWb.getWorksheet('Lot 1')!.eachRow({ includeEmpty: false }, (row, rIdx) => {
    if (rIdx === 1) return // header
    const vals = (row.values as (string | number | null)[]).slice(1) // ExcelJS row.values is 1-indexed with undefined at [0]
    const formulaCols: number[] = []
    row.eachCell((cell, colNumber) => {
      if (cell.type === ExcelJS.ValueType.Formula) formulaCols.push(colNumber - 1)
    })
    // Normalize formula values
    const normalized = vals.map(v => {
      if (v != null && typeof v === 'object' && 'result' in (v as object)) return (v as { result: unknown }).result as string | number | null
      return v
    })
    dpgfRows.push({ rowIndex: rIdx, values: normalized as (string | number | boolean | null)[], isTitle: false, isSubtotal: false, formulaCols })
  })

  // Load CRM
  const crmWb = new ExcelJS.Workbook()
  await crmWb.xlsx.load(crmBuf)
  const crmRows: RawRow[] = []
  const crmMapping: ColumnMapping = { numero: 0, designation: 1, unit: 2, quantity: 3, pu_ht: 4 }
  crmWb.getWorksheet('CRM')!.eachRow({ includeEmpty: false }, (row, rIdx) => {
    if (rIdx === 1) return
    const vals = (row.values as (string | number | null)[]).slice(1)
    crmRows.push({ rowIndex: rIdx, values: vals as (string | number | boolean | null)[], isTitle: false, isSubtotal: false, formulaCols: [] })
  })

  const acheteurParsed = dpgfRows.slice(0, 5).map(r => applyMapping(r, mapping, 'Lot 1'))
  const crmParsed = crmRows.map(r => applyMapping(r, crmMapping, 'CRM'))

  const { matched, unmatched } = matchRows(acheteurParsed, crmParsed)
  const matchRatio = matched.length / acheteurParsed.length

  test(`≥ 90% rows matched without Claude (${matched.length}/${acheteurParsed.length})`, () => {
    assert(matchRatio >= 0.9, `Match ratio ${(matchRatio * 100).toFixed(0)}% < 90%`)
  })

  test('formulas detected in DPGF total column', () => {
    // Rows 1-5 (rIdx 2-6) should have formula at col 5 (total_ht)
    const rowsWithFormulas = dpgfRows.filter(r => r.formulaCols.includes(5))
    assert(rowsWithFormulas.length >= 5, `Expected ≥5 rows with formula at col5, got ${rowsWithFormulas.length}`)
  })

  test('matched rows have correct PU from CRM', () => {
    const fouilles = matched.find(m => m.acheteurRowId.includes('__2')) // first data row
    if (!fouilles) throw new Error('Fouilles row not found in matches')
    assertApprox(fouilles.pu_ht_crm ?? 0, 28.50, 0.01)
  })
}

// ─── montantEnLettres ──────────────────────────────────────────────────────────
console.log('\nmontantEnLettres')
test('0 → zéro euro', () => assertEq(montantEnLettres(0), 'zéro euro'))
test('1 → un euro', () => assertEq(montantEnLettres(1), 'un euro'))
test('1000 → mille euros', () => assertEq(montantEnLettres(1000), 'mille euros'))
test('80000 → quatre-vingt mille euros', () => assertEq(montantEnLettres(80000), 'quatre-vingt mille euros'))
test('1250.75 → mille deux cent cinquante euros et soixante-quinze centimes', () => {
  assertEq(montantEnLettres(1250.75), 'mille deux cent cinquante euros et soixante-quinze centimes')
})

// ─── Run async tests ──────────────────────────────────────────────────────────
runIntegrationTest()
  .then(() => {
    console.log(`\n${passed + failed} tests — ${passed} passed, ${failed} failed`)
    if (failed > 0) process.exit(1)
  })
  .catch(e => {
    console.error('Integration test error:', e)
    process.exit(1)
  })
