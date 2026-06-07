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
  | { data: LigneNomenclature[]; fichiers_lus: string[]; fichiers_illisibles: string[] }
  | { error: string }
  | null

const SYSTEM_PROMPT = `Tu es un expert en lecture de nomenclatures électriques et techniques. Tu extrais des données de tableaux de matériel sous forme de JSON strict.
Tu réponds UNIQUEMENT avec un tableau JSON valide, sans markdown, sans backticks, sans texte autour.`

export async function extractionNomenclature(formData: FormData): Promise<ExtractionNomenclatureState> {
  try {
    const files = (formData.getAll('files') as File[]).filter(f => f.size > 0)
    if (files.length === 0) return { error: 'Aucun fichier reçu.' }

    const invalidFile = files.find(f => f.type !== 'application/pdf' && !f.name.endsWith('.pdf'))
    if (invalidFile) return { error: `"${invalidFile.name}" n'est pas un PDF.` }

    const fichiers_lus: string[] = []
    const fichiers_illisibles: string[] = []
    const parts: string[] = []

    for (const file of files) {
      try {
        const buffer = Buffer.from(await file.arrayBuffer())
        const pdf = await getDocumentProxy(new Uint8Array(buffer))
        const { text } = await extractText(pdf, { mergePages: true })
        const texte = text?.trim() ?? ''

        if (texte.length < 50) {
          fichiers_illisibles.push(file.name)
        } else {
          fichiers_lus.push(file.name)
          parts.push(`\n\n===== DOCUMENT : ${file.name} =====\n\n${texte}`)
        }
      } catch {
        fichiers_illisibles.push(file.name)
      }
    }

    if (fichiers_lus.length === 0) {
      return { error: 'Aucun fichier lisible. Les PDFs sont peut-être des scans image sans texte sélectionnable.' }
    }

    const texteTotal = parts.join('')
    const LIMIT = 120_000
    const texteEnvoye = texteTotal.length > LIMIT ? texteTotal.slice(0, LIMIT) : texteTotal

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 8192,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Extrais TOUTES les lignes de la nomenclature de ce document sous forme de JSON structuré.

Pour chaque ligne, retourne un objet avec exactement ces clés :
- "repere" : repère ou identifiant de l'équipement (ex: Q1, KM2, -F1). Chaîne vide si absent.
- "quantite" : la quantité (ex: "1", "2", "3 m"). Chaîne vide si absente.
- "designation" : description complète du composant ou de l'article.
- "reference" : référence fabricant / code produit. Chaîne vide si absente.
- "fabricant" : nom du fabricant ou marque. Chaîne vide si absent.

Retourne UNIQUEMENT un tableau JSON (array d'objets). Sans texte avant, sans backticks, sans markdown.
Si une information est absente pour une ligne, utilise une chaîne vide "".
Si tu ne trouves aucune nomenclature, retourne un tableau vide [].
Ne retourne pas les lignes d'en-tête du tableau.

DOCUMENT :
${texteEnvoye}`,
        },
      ],
    })

    const raw = message.content[0].type === 'text' ? message.content[0].text : ''

    // Nettoyer la réponse : retirer les éventuels backticks/markdown
    let cleaned = raw.trim()
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
    }

    // Extraire le tableau JSON (entre [ et ])
    const firstBracket = cleaned.indexOf('[')
    const lastBracket = cleaned.lastIndexOf(']')
    if (firstBracket === -1 || lastBracket === -1) {
      return {
        error: 'Aucune nomenclature détectée dans ce document. Vérifie que le PDF contient un tableau de matériel avec du texte sélectionnable (pas un scan image).',
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

    // Normaliser : s'assurer que tous les champs sont bien des strings
    const normalized: LigneNomenclature[] = data.map(row => ({
      repere: String(row.repere ?? ''),
      quantite: String(row.quantite ?? ''),
      designation: String(row.designation ?? ''),
      reference: String(row.reference ?? ''),
      fabricant: String(row.fabricant ?? ''),
    }))

    return { data: normalized, fichiers_lus, fichiers_illisibles }
  } catch (err) {
    console.error('[extractionNomenclature]', err)
    return { error: "Erreur lors de l'extraction. Vérifie les fichiers et réessaie." }
  }
}
