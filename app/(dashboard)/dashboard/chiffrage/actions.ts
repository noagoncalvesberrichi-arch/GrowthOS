'use server'

import { extractText, getDocumentProxy } from 'unpdf'
import { anthropic } from '@/lib/anthropic'

export type LigneNomenclature = {
  repere: string
  quantite: string
  designation: string
  reference: string
  fabricant: string
}

export type ExtractionNomenclatureState =
  | { data: LigneNomenclature[]; fichiers_lus: string[]; fichiers_illisibles: string[]; mode_vision: boolean }
  | { error: string }
  | null

const SYSTEM_PROMPT = `Tu es un expert en lecture de nomenclatures électriques et techniques. Tu extrais des données de tableaux de matériel sous forme de JSON strict.
Tu réponds UNIQUEMENT avec un tableau JSON valide, sans markdown, sans backticks, sans texte autour.`

const EXTRACTION_PROMPT = `Extrais TOUTES les lignes de la nomenclature de ce document sous forme de JSON structuré.

Pour chaque ligne, retourne un objet avec exactement ces clés :
- "repere" : repère ou identifiant de l'équipement (ex: Q1, KM2, -F1). Chaîne vide si absent.
- "quantite" : la quantité (ex: "1", "2", "3 m"). Chaîne vide si absente.
- "designation" : description complète du composant ou de l'article.
- "reference" : référence fabricant / code produit. Chaîne vide si absente.
- "fabricant" : nom du fabricant ou marque. Chaîne vide si absent.

Retourne UNIQUEMENT un tableau JSON (array d'objets). Sans texte avant, sans backticks, sans markdown.
Si une information est absente pour une ligne, utilise une chaîne vide "".
Si tu ne trouves aucune nomenclature, retourne un tableau vide [].
Ne retourne pas les lignes d'en-tête du tableau.`

// 3 MB — above this, Claude PDF vision would likely timeout on Vercel Hobby (10s)
const MAX_VISION_SIZE = 3 * 1024 * 1024
// Limit concurrent vision PDFs to keep latency under control
const MAX_VISION_FILES = 2

function parseNomenclatureJSON(raw: string): { data: LigneNomenclature[] } | { error: string } {
  let cleaned = raw.trim()
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
  }
  const firstBracket = cleaned.indexOf('[')
  const lastBracket = cleaned.lastIndexOf(']')
  if (firstBracket === -1 || lastBracket === -1) {
    return {
      error: 'Aucune nomenclature détectée dans ce document. Vérifie que le PDF contient bien un tableau de matériel.',
    }
  }
  cleaned = cleaned.slice(firstBracket, lastBracket + 1)

  let data: LigneNomenclature[]
  try {
    data = JSON.parse(cleaned)
  } catch {
    console.error('[extractionNomenclature] JSON parse failed:', cleaned.slice(0, 300))
    return { error: 'Impossible de parser la réponse du modèle. Réessaie.' }
  }

  if (!Array.isArray(data) || data.length === 0) {
    return { error: 'Aucune ligne de nomenclature détectée dans ce document.' }
  }

  return {
    data: data.map(row => ({
      repere: String(row.repere ?? ''),
      quantite: String(row.quantite ?? ''),
      designation: String(row.designation ?? ''),
      reference: String(row.reference ?? ''),
      fabricant: String(row.fabricant ?? ''),
    })),
  }
}

export async function extractionNomenclature(formData: FormData): Promise<ExtractionNomenclatureState> {
  try {
    const files = (formData.getAll('files') as File[]).filter(f => f.size > 0)
    if (files.length === 0) return { error: 'Aucun fichier reçu.' }

    const invalidFile = files.find(f => f.type !== 'application/pdf' && !f.name.endsWith('.pdf'))
    if (invalidFile) return { error: `"${invalidFile.name}" n'est pas un PDF.` }

    const fichiers_lus: string[] = []
    const fichiers_illisibles: string[] = []
    const tooBigForVision: string[] = []

    type TextFile = { name: string; text: string }
    type VisionFile = { name: string; base64: string }

    const textFiles: TextFile[] = []
    const visionFiles: VisionFile[] = []

    for (const file of files) {
      try {
        const buffer = Buffer.from(await file.arrayBuffer())
        const pdf = await getDocumentProxy(new Uint8Array(buffer))
        const { text } = await extractText(pdf, { mergePages: true })
        const texte = text?.trim() ?? ''

        if (texte.length >= 100) {
          // Text-based PDF — fast path
          fichiers_lus.push(file.name)
          textFiles.push({ name: file.name, text: texte })
        } else if (file.size > MAX_VISION_SIZE) {
          // Image PDF too large for vision on Hobby plan
          tooBigForVision.push(file.name)
        } else if (visionFiles.length < MAX_VISION_FILES) {
          // Image PDF within size limit — vision fallback
          visionFiles.push({ name: file.name, base64: buffer.toString('base64') })
          fichiers_lus.push(file.name)
        } else {
          // Vision quota exceeded
          fichiers_illisibles.push(file.name)
        }
      } catch {
        fichiers_illisibles.push(file.name)
      }
    }

    if (fichiers_lus.length === 0) {
      if (tooBigForVision.length > 0) {
        return {
          error:
            'Ce document est trop volumineux pour l\'extraction automatique (limite : 3 Mo en mode image). Conseil : isolez la ou les pages de nomenclature (souvent en fin de dossier) dans un PDF séparé et réessayez.',
        }
      }
      return { error: 'Aucun fichier lisible. Vérifiez que les PDFs contiennent du texte ou font moins de 3 Mo.' }
    }

    const hasText = textFiles.length > 0
    const hasVision = visionFiles.length > 0
    let claudeRaw: string

    if (hasVision) {
      let contextNote =
        'Ce document est une nomenclature électrique ou technique, possiblement sous forme de tableau image (PDF scanné ou exporté depuis un logiciel de CAO).'

      if (hasText) {
        const LIMIT = 60_000
        const joined = textFiles.map(f => `===== ${f.name} =====\n\n${f.text}`).join('\n\n')
        contextNote += `\n\nTexte extrait de fichiers lisibles :\n${joined.slice(0, LIMIT)}`
      }

      const content = [
        ...visionFiles.map(vf => ({
          type: 'document' as const,
          source: {
            type: 'base64' as const,
            media_type: 'application/pdf' as const,
            data: vf.base64,
          },
          title: vf.name,
        })),
        {
          type: 'text' as const,
          text: `${contextNote}\n\n${EXTRACTION_PROMPT}`,
        },
      ]

      const msg = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 8192,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content }],
      })
      claudeRaw = msg.content[0].type === 'text' ? msg.content[0].text : ''
    } else {
      // Text-only path (fast)
      const LIMIT = 120_000
      const joined = textFiles.map(f => `===== DOCUMENT : ${f.name} =====\n\n${f.text}`).join('\n\n')
      const texteEnvoye = joined.length > LIMIT ? joined.slice(0, LIMIT) : joined

      const msg = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 8192,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: `DOCUMENT :\n${texteEnvoye}\n\n${EXTRACTION_PROMPT}`,
          },
        ],
      })
      claudeRaw = msg.content[0].type === 'text' ? msg.content[0].text : ''
    }

    const parseResult = parseNomenclatureJSON(claudeRaw)
    if ('error' in parseResult) return parseResult

    return {
      data: parseResult.data,
      fichiers_lus,
      fichiers_illisibles: [...fichiers_illisibles, ...tooBigForVision],
      mode_vision: hasVision,
    }
  } catch (err) {
    console.error('[extractionNomenclature]', err)
    return { error: "Erreur lors de l'extraction. Vérifie les fichiers et réessaie." }
  }
}
