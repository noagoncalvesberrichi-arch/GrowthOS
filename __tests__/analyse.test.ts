import { describe, test, expect } from 'vitest'
import { detecterDossierIncomplet, extensionFichier, extraireTexte, expandZip } from '../lib/analyse/extraire'
import JSZip from 'jszip'
import ExcelJS from 'exceljs'

// ─── extensionFichier ─────────────────────────────────────────────────────────

describe('extensionFichier', () => {
  test('retourne l\'extension en minuscules', () => {
    expect(extensionFichier('document.PDF')).toBe('.pdf')
    expect(extensionFichier('fichier.XLSX')).toBe('.xlsx')
    expect(extensionFichier('archive.zip')).toBe('.zip')
  })
  test('retourne chaîne vide si pas d\'extension', () => {
    expect(extensionFichier('sanextension')).toBe('')
  })
})

// ─── detecterDossierIncomplet ─────────────────────────────────────────────────

describe('detecterDossierIncomplet', () => {
  test('RC et CCTP présents → dossier complet', () => {
    const r = detecterDossierIncomplet(['Reglement_consultation.pdf', 'CCTP_lot1.pdf', 'CCAP.pdf'])
    expect(r.incomplet).toBe(false)
    expect(r.manquants).toHaveLength(0)
  })

  test('RC absent → dossier incomplet', () => {
    const r = detecterDossierIncomplet(['CCTP_technique.pdf'])
    expect(r.incomplet).toBe(true)
    expect(r.manquants.some(m => m.includes('RC'))).toBe(true)
  })

  test('CCTP absent → dossier incomplet', () => {
    const r = detecterDossierIncomplet(['RC_final.pdf'])
    expect(r.incomplet).toBe(true)
    expect(r.manquants.some(m => m.includes('CCTP'))).toBe(true)
  })

  test('RC et CCTP absents → deux manquants', () => {
    const r = detecterDossierIncomplet(['CCAP.pdf', 'DPGF.xlsx'])
    expect(r.manquants).toHaveLength(2)
  })

  test('rc avec pattern rc_ détecté', () => {
    const r = detecterDossierIncomplet(['rc_marche.pdf', 'cctp.docx'])
    expect(r.incomplet).toBe(false)
  })

  test('liste vide → deux manquants', () => {
    const r = detecterDossierIncomplet([])
    expect(r.manquants).toHaveLength(2)
  })
})

// ─── extraireTexte : CSV ──────────────────────────────────────────────────────

describe('extraireTexte CSV', () => {
  test('extrait un CSV valide', async () => {
    const csv = 'N°;Désignation;Unité;Quantité;PU HT\n1.1;Pose de clôture;ml;100;25\n1.2;Fourniture gazon;m²;50;40'
    const buf = Buffer.from(csv, 'utf-8')
    const result = await extraireTexte('test.csv', buf)
    expect('texte' in result).toBe(true)
    if ('texte' in result) {
      expect(result.texte).toContain('Pose de clôture')
    }
  })

  test('CSV trop court → ignoré', async () => {
    const buf = Buffer.from('a,b', 'utf-8')
    const result = await extraireTexte('vide.csv', buf)
    expect('ignore' in result).toBe(true)
  })

  test('format non supporté → ignoré avec raison', async () => {
    const buf = Buffer.from('data', 'utf-8')
    const result = await extraireTexte('image.bmp', buf)
    expect('ignore' in result).toBe(true)
    if ('ignore' in result) {
      expect(result.raison).toMatch(/non pris en charge/)
    }
  })
})

// ─── extraireTexte : XLSX ─────────────────────────────────────────────────────

describe('extraireTexte XLSX', () => {
  async function buildXlsxBuffer(): Promise<Buffer> {
    const wb = new ExcelJS.Workbook()
    const ws = wb.addWorksheet('Feuille principale')
    ws.addRow(['N°', 'Désignation', 'Unité', 'Quantité', 'PU HT'])
    ws.addRow(['1.1', 'Pose de clôture', 'ml', 100, 25])
    ws.addRow(['1.2', 'Fourniture gazon synthétique', 'm²', 50, 40])
    const ws2 = wb.addWorksheet('Feuille secondaire')
    ws2.addRow(['Ref', 'Description'])
    ws2.addRow(['REF001', 'Matériau de pose'])
    const buf = Buffer.from(await wb.xlsx.writeBuffer() as ArrayBuffer)
    return buf
  }

  test('extrait chaque feuille avec son nom', async () => {
    const buf = await buildXlsxBuffer()
    const result = await extraireTexte('devis.xlsx', buf)
    expect('texte' in result).toBe(true)
    if ('texte' in result) {
      expect(result.texte).toContain('Feuille principale')
      expect(result.texte).toContain('Feuille secondaire')
      expect(result.texte).toContain('Pose de clôture')
    }
  })

  test('données présentes dans le texte extrait', async () => {
    const buf = await buildXlsxBuffer()
    const result = await extraireTexte('devis.xlsx', buf)
    if ('texte' in result) {
      expect(result.texte).toContain('100')
      expect(result.texte).toContain('25')
    }
  })
})

// ─── expandZip ────────────────────────────────────────────────────────────────

describe('expandZip', () => {
  async function buildZipBuffer(): Promise<Buffer> {
    const zip = new JSZip()
    const csv = 'N°;Désignation\n1.1;Pose de clôture\n1.2;Fourniture gazon synthétique'
    zip.file('documents/RC.csv', csv)
    zip.file('documents/CCTP.csv', 'Cahier des clauses techniques\n' + 'a'.repeat(50))
    zip.file('.DS_Store', 'system file')  // doit être ignoré
    zip.file('image.png', 'binary data')  // format non supporté, ignoré
    return Buffer.from(await zip.generateAsync({ type: 'arraybuffer' }))
  }

  test('extrait les fichiers supportés du ZIP', async () => {
    const buf = await buildZipBuffer()
    const files = await expandZip(buf)
    const names = files.map(f => f.name)
    expect(names).toContain('RC.csv')
    expect(names).toContain('CCTP.csv')
  })

  test('ignore les fichiers système et formats non supportés', async () => {
    const buf = await buildZipBuffer()
    const files = await expandZip(buf)
    const names = files.map(f => f.name)
    expect(names).not.toContain('.DS_Store')
    expect(names).not.toContain('image.png')
  })

  test('les fichiers extraits ont un contenu non vide', async () => {
    const buf = await buildZipBuffer()
    const files = await expandZip(buf)
    for (const f of files) {
      expect(f.buffer.length).toBeGreaterThan(0)
    }
  })

  test('extraction puis traitement CSV : texte correct', async () => {
    const buf = await buildZipBuffer()
    const files = await expandZip(buf)
    const csvFile = files.find(f => f.name === 'RC.csv')
    expect(csvFile).toBeDefined()
    if (csvFile) {
      const result = await extraireTexte(csvFile.name, csvFile.buffer)
      expect('texte' in result).toBe(true)
      if ('texte' in result) expect(result.texte).toContain('Pose de clôture')
    }
  })
})
