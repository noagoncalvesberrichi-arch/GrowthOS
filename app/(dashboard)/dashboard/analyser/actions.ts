'use server'

import { PDFParse } from 'pdf-parse'
import { anthropic } from '@/lib/anthropic'

const SYSTEM_PROMPT = `Tu es un expert en marchés publics français. Tu analyses des appels d'offres et tu extrais les informations clés de manière structurée.
Tu réponds UNIQUEMENT avec un objet JSON valide, sans markdown, sans backticks, sans commentaires.`

const USER_PROMPT = (texte: string) => `Voici le texte d'un appel d'offres. Extrais et structure les informations suivantes en JSON.

TEXTE DE L'APPEL D'OFFRES :
${texte.slice(0, 40000)}

Retourne UNIQUEMENT ce JSON (toutes les clés sont requises, utilise null si l'information est absente) :
{
  "objet": "string — objet ou intitulé du marché",
  "type_procedure": "string — ex: procédure adaptée, appel d'offres ouvert, etc.",
  "acheteur": "string — nom du pouvoir adjudicateur",
  "lots": [
    { "numero": "string", "designation": "string", "estimation": "string ou null" }
  ],
  "criteres_notation": [
    { "critere": "string", "ponderation": "string" }
  ],
  "pieces_a_fournir": ["string"],
  "dates_cles": {
    "limite_remise_offres": "string ou null — date et heure",
    "visite_site": "string ou null",
    "validite_offres": "string ou null"
  },
  "points_de_vigilance": ["string"]
}`

export type AOResult = {
  objet: string
  type_procedure: string
  acheteur: string
  lots: { numero: string; designation: string; estimation: string | null }[]
  criteres_notation: { critere: string; ponderation: string }[]
  pieces_a_fournir: string[]
  dates_cles: {
    limite_remise_offres: string | null
    visite_site: string | null
    validite_offres: string | null
  }
  points_de_vigilance: string[]
}

export type AnalyserAOState =
  | { data: AOResult }
  | { error: string }
  | null

export async function analyserAO(formData: FormData): Promise<AnalyserAOState> {
  try {
    const file = formData.get('file') as File | null
    if (!file || file.size === 0) return { error: 'Aucun fichier reçu.' }
    if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
      return { error: 'Le fichier doit être un PDF.' }
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const parser = new PDFParse({ data: buffer })
    const parsed = await parser.getText()
    const texte = parsed.text?.trim() ?? ''

    if (texte.length < 100) {
      return { error: 'PDF illisible ou vide (peut-être un scan image sans texte sélectionnable).' }
    }

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: USER_PROMPT(texte) }],
    })

    const content = message.content[0].type === 'text' ? message.content[0].text : ''
    const firstBrace = content.indexOf('{')
    const lastBrace = content.lastIndexOf('}')
    if (firstBrace === -1 || lastBrace === -1) {
      return { error: 'Réponse inattendue du modèle. Réessaie.' }
    }
    const cleaned = content.slice(firstBrace, lastBrace + 1)

    let data: AOResult
    try {
      data = JSON.parse(cleaned)
    } catch {
      console.error('[analyserAO] JSON parse failed:', cleaned)
      return { error: 'Impossible de parser la réponse du modèle. Réessaie.' }
    }

    return { data }
  } catch (err) {
    console.error('[analyserAO]', err)
    return { error: "Erreur lors de l'analyse. Vérifie le fichier et réessaie." }
  }
}
