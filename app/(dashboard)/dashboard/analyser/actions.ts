'use server'

import { extractText, getDocumentProxy } from 'unpdf'
import { anthropic } from '@/lib/anthropic'
import { createClient } from '@/lib/supabase/server'

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
    "date_limite_offres": "string ou null — date ET heure limite de remise des offres uniquement",
    "visite": "string ou null — visite du site préalable uniquement. Précise si obligatoire ou facultative. Si aucune visite prévue, mettre 'Aucune visite prévue'",
    "validite_offres": "string ou null — durée de validité des offres",
    "autres_dates": [
      { "libelle": "string — ex: Réunion de lancement, Date de démarrage, Limite questions écrites, etc.", "date": "string" }
    ]
  },
  "points_de_vigilance": ["string"]
}

RÈGLES STRICTES pour dates_cles :
- date_limite_offres : UNIQUEMENT la date/heure de dépôt des offres. Pas de réunion, pas de visite.
- visite : UNIQUEMENT la visite physique du site. Pas la réunion de lancement.
- autres_dates : tout le reste (réunion de lancement, date prévisionnelle de démarrage, période de questions, notification du marché, etc.)
- Ne duplique jamais une date dans plusieurs champs.`

export type AOResult = {
  objet: string
  type_procedure: string
  acheteur: string
  lots: { numero: string; designation: string; estimation: string | null }[]
  criteres_notation: { critere: string; ponderation: string }[]
  pieces_a_fournir: string[]
  dates_cles: {
    date_limite_offres: string | null
    visite: string | null
    validite_offres: string | null
    autres_dates: { libelle: string; date: string }[]
  }
  points_de_vigilance: string[]
}

export type AOMetadata = {
  tronque: boolean
  chars_traites: number
  chars_total: number
}

export type AnalyserAOState =
  | { data: AOResult; meta: AOMetadata; analyse_id?: string }
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
    const pdf = await getDocumentProxy(new Uint8Array(buffer))
    const { text } = await extractText(pdf, { mergePages: true })
    const texte = text?.trim() ?? ''

    if (texte.length < 100) {
      return { error: 'PDF illisible ou vide (peut-être un scan image sans texte sélectionnable).' }
    }

    const LIMIT = 180000
    const tronque = texte.length > LIMIT
    const texteEnvoye = tronque ? texte.slice(0, LIMIT) : texte
    const meta: AOMetadata = {
      tronque,
      chars_traites: texteEnvoye.length,
      chars_total: texte.length,
    }

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: USER_PROMPT(texteEnvoye) }],
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

    // Persist to DB — non-blocking: analysis is returned even if save fails
    let analyse_id: string | undefined
    try {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: inserted, error: insertError } = await supabase
          .from('analyses')
          .insert({
            user_id: user.id,
            nom_fichier: file.name,
            objet_marche: data.objet,
            resultat: data,
            tronque,
          })
          .select('id')
          .single()
        if (insertError) {
          console.error('[analyserAO] insert failed:', insertError)
        } else {
          analyse_id = inserted.id as string
        }
      }
    } catch (saveErr) {
      console.error('[analyserAO] save error:', saveErr)
    }

    return { data, meta, analyse_id }
  } catch (err) {
    console.error('[analyserAO]', err)
    return { error: "Erreur lors de l'analyse. Vérifie le fichier et réessaie." }
  }
}
