/**
 * Run once with: npx tsx tests/fixtures/generateFixtures.ts
 * Generates dpgf_acheteur_test.xlsx and crm_export_test.xlsx
 */
import ExcelJS from 'exceljs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const DPGF_ROWS = [
  // Lot 1 — Gros œuvre
  { type: 'header', values: ['N°', 'Désignation des travaux', 'Unité', 'Quantité', 'Prix Unitaire HT', 'Montant HT'] },
  { type: 'title',  values: ['1', '1 - TERRASSEMENTS', '', '', '', ''] },
  { type: 'title',  values: ['1.1', '1.1 - Fouilles en rigole', '', '', '', ''] },
  { type: 'price',  values: ['1.1.1', 'Fouilles en rigole pour semelles filantes', 'm³', 45, null, null], pu: 28.50 },
  { type: 'price',  values: ['1.1.2', 'Evacuation des terres excédentaires', 'm³', 30, null, null], pu: 15.00 },
  { type: 'price',  values: ['1.1.3', 'Remblaiement et compactage', 'm³', 20, null, null], pu: 12.50 },
  { type: 'subtotal', values: ['', 'Sous-total Terrassements', '', '', '', null], formula: true },
  { type: 'title',  values: ['2', '2 - MAÇONNERIE', '', '', '', ''] },
  { type: 'price',  values: ['2.1', 'Béton de propreté dosé à 150 kg/m³', 'm³', 12, null, null], pu: 95.00 },
  { type: 'price',  values: ['2.2', 'Béton armé pour semelles filantes', 'm³', 28, null, null], pu: 285.00 },
  { type: 'price',  values: ['2.3', 'Parpaings creux 20x20x50 cm', 'm²', 120, null, null], pu: 38.00 },
  { type: 'price',  values: ['2.4', 'Chaînages horizontaux', 'ml', 85, null, null], pu: 25.00 },
  { type: 'subtotal', values: ['', 'Sous-total Maçonnerie', '', '', '', null], formula: true },
  { type: 'title',  values: ['3', '3 - DALLAGE', '', '', '', ''] },
  { type: 'price',  values: ['3.1', 'Forme de sable 10 cm', 'm²', 200, null, null], pu: 8.50 },
  { type: 'price',  values: ['3.2', 'Hérisson en grave 15 cm', 'm²', 200, null, null], pu: 12.00 },
  { type: 'price',  values: ['3.3', 'Dallage béton armé ep. 12 cm', 'm²', 200, null, null], pu: 45.00 },
  { type: 'price',  values: ['3.4', 'Polissage et finition surface', 'm²', 180, null, null], pu: 18.00 },
  { type: 'price',  values: ['3.5', 'Joint de dilatation', 'ml', 60, null, null], pu: 22.00 },
  { type: 'subtotal', values: ['', 'Sous-total Dallage', '', '', '', null], formula: true },
  { type: 'subtotal', values: ['', 'TOTAL LOT 1 - GROS OEUVRE', '', '', '', null], formula: true },
]

const REVÊTEMENTS_ROWS = [
  { type: 'header', values: ['N°', 'Désignation', 'Unité', 'Quantité', 'PU HT', 'Total HT'] },
  { type: 'title',  values: ['4', '4 - REVÊTEMENTS DE SOL', '', '', '', ''] },
  { type: 'price',  values: ['4.1', 'Carrelage grès cérame 60x60 cm', 'm²', 150, null, null], pu: 58.00 },
  { type: 'price',  values: ['4.2', 'Plinthe carrelage H.8 cm', 'ml', 120, null, null], pu: 12.00 },
  { type: 'price',  values: ['4.3', 'Faïence murale 20x20 cm', 'm²', 80, null, null], pu: 48.00 },
  { type: 'price',  values: ['4.4', 'Parquet stratifié 8 mm', 'm²', 75, null, null], pu: 38.00 },
  { type: 'price',  values: ['4.5', 'Plinthes bois peint', 'ml', 80, null, null], pu: 9.50 },
  { type: 'subtotal', values: ['', 'Sous-total Revêtements sol', '', '', '', null], formula: true },
  { type: 'title',  values: ['5', '5 - PEINTURE', '', '', '', ''] },
  { type: 'price',  values: ['5.1', 'Enduit béton lissé sur murs', 'm²', 320, null, null], pu: 14.50 },
  { type: 'price',  values: ['5.2', 'Peinture acrylique 2 couches murs', 'm²', 320, null, null], pu: 8.00 },
  { type: 'price',  values: ['5.3', 'Peinture plafonds 2 couches', 'm²', 110, null, null], pu: 9.50 },
  { type: 'price',  values: ['5.4', 'Lasure bois menuiseries ext.', 'm²', 45, null, null], pu: 22.00 },
  { type: 'price',  values: ['5.5', 'Peinture antirouille sur métallerie', 'm²', 30, null, null], pu: 18.00 },
  { type: 'subtotal', values: ['', 'Sous-total Peinture', '', '', '', null], formula: true },
  { type: 'title',  values: ['6', '6 - REVÊTEMENTS EXTÉRIEURS', '', '', '', ''] },
  { type: 'price',  values: ['6.1', 'Pavage granit 15x15 cm', 'm²', 95, null, null], pu: 145.00 },
  { type: 'price',  values: ['6.2', 'Bordures béton T2', 'ml', 120, null, null], pu: 28.00 },
  { type: 'price',  values: ['6.3', 'Enrobé bitumineux ep. 4 cm', 'm²', 200, null, null], pu: 35.00 },
  { type: 'price',  values: ['6.4', 'Marquage au sol', 'ml', 80, null, null], pu: 7.50 },
  { type: 'subtotal', values: ['', 'Total Lot 2 - Revêtements', '', '', '', null], formula: true },
]

// CRM rows: same items with slight variations, 3 absent, some in different order
const CRM_ROWS = [
  // Present but with slight differences
  { ref: 'CRM-001', designation: 'Fouilles en rigole - semelles filantes', unite: 'm³', qty: 45, pu: 28.50 },
  { ref: 'CRM-002', designation: 'Evacuation terres excédentaires', unite: 'm³', qty: 30, pu: 15.00 },
  // CRM-003 absent (Remblaiement) — no entry
  { ref: 'CRM-004', designation: 'beton de propreté 150kg', unite: 'm³', qty: 12, pu: 95.00 },
  { ref: 'CRM-005', designation: 'Béton armé semelles', unite: 'm³', qty: 28, pu: 285.00 },
  // Different order
  { ref: 'CRM-010', designation: 'Forme sable 10cm', unite: 'm²', qty: 200, pu: 8.50 },
  { ref: 'CRM-006', designation: 'Parpaings creux 20x20x50', unite: 'm²', qty: 120, pu: 38.00 },
  { ref: 'CRM-007', designation: 'chainage horizontal', unite: 'ml', qty: 85, pu: 25.00 },
  { ref: 'CRM-011', designation: 'Herisson grave 15 cm', unite: 'm²', qty: 200, pu: 12.00 },
  { ref: 'CRM-012', designation: 'Dallage beton armé ep 12cm', unite: 'm²', qty: 200, pu: 45.00 },
  // CRM-013 absent (Polissage)
  { ref: 'CRM-014', designation: 'Joint de dilatation sol', unite: 'ml', qty: 60, pu: 22.00 },
  { ref: 'CRM-015', designation: 'Carrelage grès cérame 60x60', unite: 'm²', qty: 150, pu: 58.00 },
  { ref: 'CRM-016', designation: 'Plinthe carrelage H8', unite: 'ml', qty: 120, pu: 12.00 },
  { ref: 'CRM-017', designation: 'Faience murale 20x20cm', unite: 'm²', qty: 80, pu: 48.00 },
  { ref: 'CRM-018', designation: 'Parquet stratifié 8mm', unite: 'm²', qty: 75, pu: 38.00 },
  // CRM-019 absent (Plinthes bois)
  { ref: 'CRM-020', designation: 'Endt béton lissé murs', unite: 'm²', qty: 320, pu: 14.50 },
  { ref: 'CRM-021', designation: 'peinture acrylique 2c murs', unite: 'm²', qty: 320, pu: 8.00 },
  { ref: 'CRM-022', designation: 'Peinture plafonds', unite: 'm²', qty: 110, pu: 9.50 },
  { ref: 'CRM-023', designation: 'Lasure bois menuiseries extérieures', unite: 'm²', qty: 45, pu: 22.00 },
  { ref: 'CRM-024', designation: 'peinture antirouille métallerie', unite: 'm²', qty: 30, pu: 18.00 },
  { ref: 'CRM-025', designation: 'Pavage granit 15x15', unite: 'm²', qty: 95, pu: 145.00 },
  { ref: 'CRM-026', designation: 'Bordures béton T2', unite: 'ml', qty: 120, pu: 28.00 },
  { ref: 'CRM-027', designation: 'Enrobé bitumineux 4cm', unite: 'm²', qty: 200, pu: 35.00 },
  { ref: 'CRM-028', designation: 'Marquage sol', unite: 'ml', qty: 80, pu: 7.50 },
]

async function generateDPGF() {
  const wb = new ExcelJS.Workbook()

  function addSheet(name: string, rows: typeof DPGF_ROWS) {
    const ws = wb.addWorksheet(name)
    ws.columns = [
      { width: 10 }, { width: 50 }, { width: 10 }, { width: 12 }, { width: 16 }, { width: 16 },
    ]

    // Title row (merged)
    ws.mergeCells('A1:F1')
    const titleCell = ws.getCell('A1')
    titleCell.value = `Bordereau des prix — ${name}`
    titleCell.font = { bold: true, size: 13 }
    titleCell.alignment = { horizontal: 'center' }

    let rowNum = 2
    let priceRowStart = -1

    for (const row of rows) {
      if (row.type === 'header') {
        const exRow = ws.getRow(rowNum)
        for (let i = 0; i < row.values.length; i++) {
          exRow.getCell(i + 1).value = row.values[i]
          exRow.getCell(i + 1).font = { bold: true }
          exRow.getCell(i + 1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD3D3D3' } }
        }
        exRow.commit()
        priceRowStart = rowNum + 1
        rowNum++
      } else if (row.type === 'title') {
        const exRow = ws.getRow(rowNum)
        for (let i = 0; i < row.values.length; i++) exRow.getCell(i + 1).value = row.values[i]
        exRow.getCell(2).font = { bold: true, italic: true }
        exRow.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEEEEEE' } }
        exRow.commit()
        rowNum++
      } else if (row.type === 'price') {
        const exRow = ws.getRow(rowNum)
        const vals = [...row.values]
        vals[4] = null // PU HT is empty (to be filled)
        vals[5] = null
        for (let i = 0; i < vals.length; i++) exRow.getCell(i + 1).value = vals[i] as ExcelJS.CellValue
        // Montant HT = quantity (col D=4) × PU HT (col E=5)
        exRow.getCell(6).value = { formula: `D${rowNum}*E${rowNum}`, result: 0 }
        exRow.commit()
        rowNum++
      } else if (row.type === 'subtotal') {
        const exRow = ws.getRow(rowNum)
        for (let i = 0; i < row.values.length; i++) {
          const v = row.values[i]
          if (i > 0 && v === null && row.formula && priceRowStart > 0) {
            exRow.getCell(i + 1).value = { formula: `SUM(F${priceRowStart}:F${rowNum - 1})`, result: 0 }
          } else {
            exRow.getCell(i + 1).value = v as ExcelJS.CellValue
          }
        }
        exRow.getCell(2).font = { bold: true }
        exRow.getCell(6).font = { bold: true }
        exRow.commit()
        priceRowStart = rowNum + 1
        rowNum++
      }
    }
  }

  addSheet('Lot 1 - Gros oeuvre', DPGF_ROWS)
  addSheet('Lot 2 - Revetements', REVÊTEMENTS_ROWS)

  const outPath = path.join(__dirname, 'dpgf_acheteur_test.xlsx')
  await wb.xlsx.writeFile(outPath)
  console.log('Generated:', outPath)
}

async function generateCRM() {
  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet('Export prix')

  ws.columns = [
    { header: 'Référence', width: 12 },
    { header: 'Désignation', width: 55 },
    { header: 'Unité', width: 10 },
    { header: 'Qté', width: 10 },
    { header: 'PU HT', width: 14 },
  ]

  // Style header
  const headerRow = ws.getRow(1)
  for (let i = 1; i <= 5; i++) {
    headerRow.getCell(i).font = { bold: true }
    headerRow.getCell(i).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0C1647' } }
    headerRow.getCell(i).font = { bold: true, color: { argb: 'FFFFFFFF' } }
  }
  headerRow.commit()

  for (const row of CRM_ROWS) {
    ws.addRow([row.ref, row.designation, row.unite, row.qty, row.pu])
  }

  const outPath = path.join(__dirname, 'crm_export_test.xlsx')
  await wb.xlsx.writeFile(outPath)
  console.log('Generated:', outPath)
}

async function main() {
  await generateDPGF()
  await generateCRM()
  console.log('Done.')
}

main().catch(console.error)
