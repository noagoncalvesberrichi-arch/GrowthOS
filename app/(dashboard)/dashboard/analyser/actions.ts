'use server'

import { extractText, getDocumentProxy } from 'unpdf'
import { anthropic } from '@/lib/anthropic'
import { createClient } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

// ─── Types ────────────────────────────────────────────────────────────────────

export type GoNoGoCritere = {
  critere: string
  exigence_marche: string
  situation_entreprise: string
  statut: 'ok' | 'manquant' | 'incertain'
}

export type GoNoGo = {
  verdict: 'GO' | 'NO_GO' | 'VIGILANCE'
  score_eligibilite: number
  criteres: GoNoGoCritere[]
  synthese: string
}

export type AOResult = {
  objet: string
  type_procedure: string
  acheteur: string
  siret_acheteur: string | null
  code_cpv: string | null
  montant_estime: number | null
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
  go_no_go: GoNoGo | null
}

export type AOMetadata = {
  tronque: boolean
  chars_traites: number
  chars_total: number
  fichiers_lus: string[]
  fichiers_illisibles: string[]
}

export type AnalyserAOState =
  | { data: AOResult; meta: AOMetadata; analyse_id?: string; analyses_restantes?: number }
  | { quota_atteint: true; analyses_utilisees: number; quota_gratuit: number }
  | { error: string }
  | null

// ─── Internal types ───────────────────────────────────────────────────────────

type ProfilRow = {
  raison_sociale: string | null
  ca_dernier_exercice: number | null
  effectif: number | null
  annees_experience: number | null
  certifications: string[] | null
  domaines: string[] | null
  zone_geographique: string | null
  capacite_caution: boolean
}

type AbonnementRow = {
  plan: string
  analyses_utilisees: number
  quota_gratuit: number
}

// ─── Prompts ──────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `Tu es un expert en marchés publics français. Tu analyses des appels d'offres et tu extrais les informations clés de manière structurée.
Tu réponds UNIQUEMENT avec un objet JSON valide, sans markdown, sans backticks, sans commentaires.`

function buildUserPrompt(texte: string, nbDocs: number, profil: ProfilRow | null): string {
  const profilBlock = profil ? `

PROFIL DE L'ENTREPRISE (pour l'analyse Go/No-Go) :
- Raison sociale : ${profil.raison_sociale ?? 'non renseigné'}
- CA dernier exercice : ${profil.ca_dernier_exercice != null ? `${profil.ca_dernier_exercice} €` : 'non renseigné'}
- Effectif : ${profil.effectif != null ? `${profil.effectif} personne(s)` : 'non renseigné'}
- Années d'expérience : ${profil.annees_experience != null ? profil.annees_experience : 'non renseigné'}
- Certifications : ${profil.certifications?.length ? profil.certifications.join(', ') : 'aucune renseignée'}
- Domaines d'activité : ${profil.domaines?.length ? profil.domaines.join(', ') : 'non renseignés'}
- Zone géographique : ${profil.zone_geographique ?? 'non renseignée'}
- Capacité caution bancaire : ${profil.capacite_caution ? 'oui' : 'non'}` : ''

  const goNoGoSchema = profil
    ? `  "go_no_go": {
    "verdict": "GO | NO_GO | VIGILANCE",
    "score_eligibilite": 75,
    "criteres": [
      {
        "critere": "string — ex: Chiffre d'affaires, Certification QUALIBAT, Zone géographique",
        "exigence_marche": "string — ce que le DCE exige ou laisse entendre",
        "situation_entreprise": "string — situation du profil ci-dessus",
        "statut": "ok | manquant | incertain"
      }
    ],
    "synthese": "string — 2-3 phrases : verdict, raisons principales, recommandation"
  }`
    : `  "go_no_go": null`

  const goNoGoRules = profil ? `

RÈGLES pour go_no_go :
- Compare UNIQUEMENT les données du profil entreprise ci-dessus aux exigences détectées dans le DCE.
- verdict "NO_GO" si une condition éliminatoire n'est pas remplie (CA insuffisant par rapport aux seuils mentionnés, certification obligatoire absente, zone hors périmètre).
- verdict "GO" si tous les critères vérifiables sont satisfaits.
- verdict "VIGILANCE" si des éléments importants sont incertains ou si le DCE ne précise pas les exigences.
- Inclure dans criteres uniquement les points pertinents (capacités financières, certifications requises, domaines, zone, caution si exigée).
- score_eligibilite : entier de 0 (aucune chance) à 100 (toutes conditions remplies).
- Si une info du profil est "non renseigné", marquer le critère correspondant "incertain".` : ''

  return `Voici le contenu d'un dossier de consultation des entreprises (DCE)${nbDocs > 1 ? ` composé de ${nbDocs} documents` : ''}. Analyse l'ensemble${nbDocs > 1 ? ' en croisant les informations de tous les documents' : ''} et extrais les informations clés en JSON.${profilBlock}

TEXTE DU DOSSIER :
${texte}

Retourne UNIQUEMENT ce JSON (toutes les clés sont requises, utilise null si l'information est absente) :
{
  "objet": "string — objet ou intitulé du marché",
  "type_procedure": "string — ex: procédure adaptée, appel d'offres ouvert, etc.",
  "acheteur": "string — nom du pouvoir adjudicateur",
  "siret_acheteur": "string ou null — SIRET (14 chiffres) du pouvoir adjudicateur si mentionné dans le DCE, sinon null",
  "code_cpv": "string ou null — code CPV principal du marché (8 chiffres, ex. 45214210) si mentionné dans le DCE, sinon null",
  "montant_estime": "number ou null — montant estimé du marché ou du lot principal en € HT s'il figure dans le DCE (nombre brut sans unité, ex. 450000), sinon null",
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
  "points_de_vigilance": ["string"],
${goNoGoSchema}
}

RÈGLES STRICTES pour dates_cles :
- date_limite_offres : UNIQUEMENT la date/heure de dépôt des offres. Pas de réunion, pas de visite.
- visite : UNIQUEMENT la visite physique du site. Pas la réunion de lancement.
- autres_dates : tout le reste (réunion de lancement, date prévisionnelle de démarrage, période de questions, notification du marché, etc.)
- Ne duplique jamais une date dans plusieurs champs.${goNoGoRules}`
}

// ─── Server action ────────────────────────────────────────────────────────────

export async function analyserAO(formData: FormData): Promise<AnalyserAOState> {
  try {
    const files = (formData.getAll('files') as File[]).filter(f => f.size > 0)
    if (files.length === 0) return { error: 'Aucun fichier reçu.' }

    const invalidFile = files.find(f => f.type !== 'application/pdf' && !f.name.endsWith('.pdf'))
    if (invalidFile) return { error: `"${invalidFile.name}" n'est pas un PDF.` }

    // Extract text from each PDF
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
    const LIMIT = 500000
    const tronque = texteTotal.length > LIMIT
    const texteEnvoye = tronque ? texteTotal.slice(0, LIMIT) : texteTotal
    const meta: AOMetadata = {
      tronque,
      chars_traites: texteEnvoye.length,
      chars_total: texteTotal.length,
      fichiers_lus,
      fichiers_illisibles,
    }

    // Load user
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // ── Quota check (BEFORE Claude call) ─────────────────────────────────────
    let abonnement: AbonnementRow | null = null
    if (user) {
      const { data: existingAbo } = await supabase
        .from('abonnements')
        .select('plan, analyses_utilisees, quota_gratuit')
        .maybeSingle()

      if (!existingAbo) {
        const { data: newAbo, error: createError } = await supabase
          .from('abonnements')
          .insert({ user_id: user.id })
          .select('plan, analyses_utilisees, quota_gratuit')
          .single()
        if (createError) {
          console.error('[analyserAO] create abonnement failed:', createError)
        } else {
          abonnement = newAbo as AbonnementRow
        }
      } else {
        abonnement = existingAbo as AbonnementRow
      }

      if (abonnement && abonnement.plan === 'gratuit' && abonnement.analyses_utilisees >= abonnement.quota_gratuit) {
        return {
          quota_atteint: true,
          analyses_utilisees: abonnement.analyses_utilisees,
          quota_gratuit: abonnement.quota_gratuit,
        }
      }
    }

    // Load profil for Go/No-Go
    let profil: ProfilRow | null = null
    if (user) {
      const { data: profilData } = await supabase
        .from('profil_entreprise')
        .select('raison_sociale, ca_dernier_exercice, effectif, annees_experience, certifications, domaines, zone_geographique, capacite_caution')
        .maybeSingle()
      profil = profilData as ProfilRow | null
    }

    // Call Claude
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: profil ? 8192 : 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: buildUserPrompt(texteEnvoye, fichiers_lus.length, profil) }],
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

    // Analysis succeeded — persist and update quota
    let analyse_id: string | undefined
    if (user) {
      // Save analysis to DB
      try {
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
      } catch (saveErr) {
        console.error('[analyserAO] save error:', saveErr)
      }

      // Increment quota counter — via admin client (RLS bypassed, UPDATE policy removed)
      if (abonnement) {
        try {
          const { error: incrError } = await getSupabaseAdmin()
            .from('abonnements')
            .update({
              analyses_utilisees: abonnement.analyses_utilisees + 1,
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', user.id)
          if (incrError) console.error('[analyserAO] quota increment failed:', incrError)
        } catch (incrErr) {
          console.error('[analyserAO] quota increment error:', incrErr)
        }
      }
    }

    const analyses_restantes = abonnement?.plan === 'gratuit'
      ? Math.max(0, abonnement.quota_gratuit - abonnement.analyses_utilisees - 1)
      : undefined

    return { data, meta, analyse_id, analyses_restantes }
  } catch (err) {
    console.error('[analyserAO]', err)
    return { error: "Erreur lors de l'analyse. Vérifie les fichiers et réessaie." }
  }
}
