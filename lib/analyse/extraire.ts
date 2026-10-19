import { extractText, getDocumentProxy } from 'unpdf'
import JSZip from 'jszip'

export const FORMATS_SUPPORTES = ['.pdf', '.docx', '.doc', '.xlsx', '.xls', '.csv', '.odt', '.zip']

export function extensionFichier(name: string): string {
  return name.toLowerCase().match(/\.[^.]+$/)?.[0] ?? ''
}

export type ExtractionResult = { texte: string } | { ignore: true; raison: string }

export async function extraireTexte(
  name: string,
  buffer: Buffer
): Promise<ExtractionResult> {
  const ext = extensionFichier(name)

  if (ext === '.pdf') {
    try {
      const pdf = await getDocumentProxy(new Uint8Array(buffer))
      const { text } = await extractText(pdf, { mergePages: true })
      const t = text?.trim() ?? ''
      if (t.length < 80) return { ignore: true, raison: 'PDF sans texte sélectionnable (scan image ?)' }
      return { texte: t }
    } catch {
      return { ignore: true, raison: 'Erreur de lecture PDF' }
    }
  }

  if (ext === '.docx' || ext === '.doc') {
    try {
      const mammoth = await import('mammoth')
      const res = await (mammoth as unknown as { extractRawText: (o: { buffer: Buffer }) => Promise<{ value: string }> }).extractRawText({ buffer })
      const t = res.value?.trim() ?? ''
      if (t.length < 80) return { ignore: true, raison: 'Fichier Word vide ou illisible' }
      return { texte: t }
    } catch {
      return { ignore: true, raison: 'Erreur de lecture Word' }
    }
  }

  if (ext === '.xlsx' || ext === '.xls') {
    try {
      const XLSX = await import('xlsx')
      const wb = XLSX.read(buffer, { type: 'buffer' })
      const parts: string[] = []
      for (const sheetName of wb.SheetNames) {
        const ws = wb.Sheets[sheetName]
        const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: '' })
        const lines = (rows as (string | number)[][])
          .filter(row => row.some(cell => cell !== '' && cell !== null && cell !== undefined))
          .map(row => row.map(cell => String(cell ?? '')).join('\t'))
        if (lines.length > 0) {
          parts.push(`--- Feuille : ${sheetName} ---\n${lines.join('\n')}`)
        }
      }
      const t = parts.join('\n\n').trim()
      if (t.length < 20) return { ignore: true, raison: 'Fichier Excel vide' }
      return { texte: t }
    } catch {
      return { ignore: true, raison: 'Erreur de lecture Excel' }
    }
  }

  if (ext === '.csv') {
    try {
      const t = buffer.toString('utf-8').trim()
      if (t.length < 20) return { ignore: true, raison: 'Fichier CSV vide' }
      return { texte: t }
    } catch {
      return { ignore: true, raison: 'Erreur de lecture CSV' }
    }
  }

  if (ext === '.odt') {
    try {
      const zip = await JSZip.loadAsync(buffer)
      const content = zip.file('content.xml')
      if (!content) return { ignore: true, raison: 'Fichier ODT invalide' }
      const xml = await content.async('text')
      const t = xml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
      if (t.length < 80) return { ignore: true, raison: 'Fichier ODT vide' }
      return { texte: t }
    } catch {
      return { ignore: true, raison: 'Erreur de lecture ODT' }
    }
  }

  return { ignore: true, raison: `Format non pris en charge (${ext || 'inconnu'})` }
}

export async function expandZip(buffer: Buffer): Promise<{ name: string; buffer: Buffer }[]> {
  const zip = await JSZip.loadAsync(buffer)
  const result: { name: string; buffer: Buffer }[] = []
  for (const [path, entry] of Object.entries(zip.files)) {
    if (entry.dir) continue
    const fname = path.split('/').pop() ?? path
    if (fname.startsWith('.') || fname.startsWith('__MACOSX')) continue
    const subExt = extensionFichier(fname)
    if (!FORMATS_SUPPORTES.includes(subExt)) continue
    const subBuf = Buffer.from(await entry.async('arraybuffer'))
    result.push({ name: fname, buffer: subBuf })
  }
  return result
}

export type DossierCheck = { incomplet: boolean; manquants: string[] }

export function detecterDossierIncomplet(fichiersLus: string[]): DossierCheck {
  const all = fichiersLus.map(n => n.toLowerCase())
  const hasRC = all.some(n => /r[eèé]glement|r\.c\.|rc[_\s-]|reglement.consult/i.test(n))
  const hasCCTP = all.some(n => /cctp|cahier.*(clauses|technique)|technique.*prestations/i.test(n))
  const manquants: string[] = []
  if (!hasRC) manquants.push('Règlement de consultation (RC)')
  if (!hasCCTP) manquants.push('Cahier des clauses techniques particulières (CCTP)')
  return { incomplet: manquants.length > 0, manquants }
}
