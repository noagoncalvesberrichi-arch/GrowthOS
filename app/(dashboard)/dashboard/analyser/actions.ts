'use server'

import { extractText, getDocumentProxy } from 'unpdf'
import { anthropic } from '@/lib/anthropic'
import { createClient } from '@/lib/supabase/server'

const SYSTEM_PROMPT = `Tu es un expert en marchés publics français. Tu analyses des appels d'offres et tu extrais les informations clés de manière structurée.
Tu réponds UNIQUEMENT avec un objet JSON valide, sans markdown, sans backticks, sans commentaires.`

const USER_PROMPT = (texte: string, nbDocs: number) =>
  `Voici le contenu d'un dossier de consultation des entreprises (DCE)${nbDocs > 1 ? ` composé de ${nbDocs} documents` : ''}. Analyse l'ensemble${nbDocs > 1 ? ' en croisant les informations de tous les documents' : ''} et extrais les informations clés en JSON.

TEXTE DU DOSSIER :
${texte}

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
  fichiers_lus: string[]
  fichiers_illisibles: string[]
}

export type AnalyserAOState =
  | { data: AOResult; meta: AOMetadata; analyse_id?: string }
  | { error: string }
  | null

export async function analyserAO(formData: FormData): Promise<AnalyserAOState> {
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

        if (texte.length < 100) {
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
    const LIMIT = 180000
    const tronque = texteTotal.length > LIMIT
    const texteEnvoye = tronque ? texteTotal.slice(0, LIMIT) : texteTotal
    const meta: AOMetadata = {
      tronque,
      chars_traites: texteEnvoye.length,
      chars_total: texteTotal.length,
      fichiers_lus,
      fichiers_illisibles,
    }

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: USER_PROMPT(texteEnvoye, fichiers_lus.length) }],
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
            nom_fichier: files.map(f => f.name).join(', '),
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
    return { error: "Erreur lors de l'analyse. Vérifie les fichiers et réessaie." }
  }
}
