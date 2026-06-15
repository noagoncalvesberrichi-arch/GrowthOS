'use server'

import { anthropic } from '@/lib/anthropic'
import { createClient } from '@/lib/supabase/server'

const BOAMP_URL =
  'https://boamp-datadila.opendatasoft.com/api/explore/v2.1/catalog/datasets/boamp/records'

const FIELDS =
  'idweb,objet,nomacheteur,code_departement,dateparution,datelimitereponse,datefindiffusion,type_marche,procedure_libelle,descripteur_libelle,famille_libelle,nature,url_avis'

// ─── Types ────────────────────────────────────────────────────────────────────

export type AOAnnonce = {
  idweb: string
  objet: string
  nomacheteur: string | null
  code_departement: string[]
  dateparution: string | null
  datelimitereponse: string | null
  datefindiffusion: string | null
  type_marche: string[]
  procedure_libelle: string | null
  descripteur_libelle: string[]
  famille_libelle: string | null
  nature: string | null
  url_avis: string | null
}

export type RechercheParams = {
  baseDepts: string[]
  baseDomainKeywords: string[]
  motsCles?: string
}

export type RechercheResult =
  | { annonces: AOAnnonce[]; total: number }
  | { error: string }

// ─── ODSQL builder ───────────────────────────────────────────────────────────

function buildWhereClause(params: RechercheParams): string {
  const { baseDepts, baseDomainKeywords, motsCles } = params

  // Only show annonces from the last 60 days to keep results relevant
  const since = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10)

  const base = `etat="INITIAL" AND nature="APPEL_OFFRE" AND dateparution>="${since}"`

  const subConditions: string[] = []

  // Zone filter — using "like" (not "in") which BOAMP ODSQL supports
  if (baseDepts.length > 0) {
    const zoneExpr = baseDepts
      .slice(0, 12)
      .map((d) => `code_departement like "${d}"`)
      .join(' OR ')
    subConditions.push(`(${zoneExpr})`)
  }

  // Domain keyword filter — up to 6 to keep URL length reasonable
  if (baseDomainKeywords.length > 0) {
    const kwExpr = baseDomainKeywords
      .slice(0, 6)
      .map((kw) => `search(objet,"${kw.replace(/"/g, '')}")`)
      .join(' OR ')
    subConditions.push(`(${kwExpr})`)
  }

  const whereClause =
    subConditions.length > 0
      ? `${base} AND (${subConditions.join(' OR ')})`
      : base

  // User free-text search is ANDed on top (narrows results)
  if (motsCles?.trim()) {
    const kw = motsCles.trim().replace(/"/g, '').slice(0, 80)
    return `${whereClause} AND search(objet,"${kw}")`
  }

  return whereClause
}

// ─── Server action ────────────────────────────────────────────────────────────

export async function rechercheAppelsOffres(
  params: RechercheParams
): Promise<RechercheResult> {
  try {
    const where = buildWhereClause(params)

    const url = new URL(BOAMP_URL)
    url.searchParams.set('select', FIELDS)
    url.searchParams.set('where', where)
    url.searchParams.set('order_by', 'dateparution DESC')
    url.searchParams.set('limit', '25')

    const response = await fetch(url.toString(), {
      headers: { Accept: 'application/json' },
    })

    if (!response.ok) {
      const text = await response.text().catch(() => '')
      console.error('[BOAMP] HTTP error:', response.status, text.slice(0, 300))
      return { error: `Erreur BOAMP (${response.status}). Réessayez dans quelques instants.` }
    }

    const json = await response.json()

    const raw: Record<string, unknown>[] = json.results ?? []
    const total: number = json.total_count ?? raw.length

    const annonces: AOAnnonce[] = raw.map((r) => ({
      idweb: String(r.idweb ?? ''),
      objet: String(r.objet ?? ''),
      nomacheteur: r.nomacheteur ? String(r.nomacheteur) : null,
      code_departement: Array.isArray(r.code_departement)
        ? r.code_departement.map(String)
        : r.code_departement
        ? [String(r.code_departement)]
        : [],
      dateparution: r.dateparution ? String(r.dateparution).slice(0, 10) : null,
      datelimitereponse: r.datelimitereponse
        ? String(r.datelimitereponse).slice(0, 16).replace('T', ' ')
        : null,
      datefindiffusion: r.datefindiffusion ? String(r.datefindiffusion).slice(0, 10) : null,
      type_marche: Array.isArray(r.type_marche)
        ? r.type_marche.map(String)
        : r.type_marche
        ? [String(r.type_marche)]
        : [],
      procedure_libelle: r.procedure_libelle ? String(r.procedure_libelle) : null,
      descripteur_libelle: Array.isArray(r.descripteur_libelle)
        ? r.descripteur_libelle.map(String)
        : r.descripteur_libelle
        ? [String(r.descripteur_libelle)]
        : [],
      famille_libelle: r.famille_libelle ? String(r.famille_libelle) : null,
      nature: r.nature ? String(r.nature) : null,
      url_avis: r.url_avis ? String(r.url_avis) : null,
    }))

    return { annonces, total }
  } catch (err) {
    console.error('[rechercheAppelsOffres]', err)
    return {
      error:
        "Impossible de récupérer les appels d'offres. Vérifiez votre connexion et réessayez.",
    }
  }
}

// ─── Level 2 : évaluation IA à la demande ────────────────────────────────────

export type EvalAOInput = {
  objet: string
  nomacheteur: string | null
  code_departement: string[]
  type_marche: string[]
  descripteur_libelle: string[]
  dateparution: string | null
  datelimitereponse: string | null
}

export type EvalAOData = {
  score: number
  categorie: 'Favorable' | 'Vigilance' | 'Défavorable'
  points_forts: string[]
  points_vigilance: string[]
  explication: string
}

export type EvalAOResult = EvalAOData | { error: string }

const EVAL_SYSTEM_PROMPT = `Tu es un expert en marchés publics français.
Tu réalises une PRÉ-ÉVALUATION rapide d'un avis d'appel d'offres pour une entreprise.
IMPORTANT : cette évaluation est PRÉLIMINAIRE — elle est basée UNIQUEMENT sur l'avis BOAMP (objet, type, lieu, descripteurs CPV). Sans le DCE complet, tu ne peux pas évaluer les conditions précises de qualification, les critères de sélection détaillés, ni les pièces à fournir.
Réponds UNIQUEMENT avec un objet JSON valide, sans markdown ni backticks.`

export async function evaluerAO(input: EvalAOInput): Promise<EvalAOResult> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { error: 'Vous devez être connecté.' }

    const { data: profil } = await supabase
      .from('profil_entreprise')
      .select(
        'raison_sociale, ca_dernier_exercice, effectif, annees_experience, certifications, domaines, zone_geographique'
      )
      .maybeSingle()

    const profilBlock = profil
      ? `- Raison sociale : ${profil.raison_sociale ?? 'non renseigné'}
- Chiffre d'affaires : ${profil.ca_dernier_exercice != null ? `${profil.ca_dernier_exercice.toLocaleString('fr-FR')} €` : 'non renseigné'}
- Effectif : ${profil.effectif != null ? `${profil.effectif} pers.` : 'non renseigné'}
- Expérience : ${profil.annees_experience != null ? `${profil.annees_experience} ans` : 'non renseigné'}
- Certifications : ${profil.certifications?.length ? profil.certifications.join(', ') : 'aucune renseignée'}
- Domaines d'activité : ${profil.domaines?.length ? profil.domaines.join(', ') : 'non renseignés'}
- Zone géographique : ${profil.zone_geographique ?? 'non renseignée'}`
      : 'Profil non renseigné'

    const userPrompt = `PROFIL ENTREPRISE :
${profilBlock}

AVIS D'APPEL D'OFFRES :
- Objet : ${input.objet}
- Acheteur : ${input.nomacheteur ?? 'non précisé'}
- Type de marché : ${input.type_marche.join(', ') || 'non précisé'}
- Département(s) : ${input.code_departement.join(', ') || 'non précisé'}
- Publié le : ${input.dateparution ?? 'non précisé'}
- Limite de remise des offres : ${input.datelimitereponse ?? 'non précisée'}
- Descripteurs CPV : ${input.descripteur_libelle.join(', ') || 'non précisés'}

Évalue si le profil de l'entreprise semble cohérent avec cet appel d'offres.
Rappel : PRÉ-ÉVALUATION uniquement — l'explication doit conclure en invitant à télécharger le DCE et faire l'analyse complète avant de décider.

Réponds en JSON :
{
  "score": <entier 0 à 100>,
  "categorie": <"Favorable" | "Vigilance" | "Défavorable">,
  "points_forts": [<1 à 3 strings — pourquoi ça matche>],
  "points_vigilance": [<1 à 3 strings — ce à vérifier dans le DCE>],
  "explication": "<2-3 phrases synthétisant le match et invitant à lire le DCE pour décider>"
}`

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 512,
      system: EVAL_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    const firstBrace = text.indexOf('{')
    const lastBrace = text.lastIndexOf('}')
    if (firstBrace === -1 || lastBrace === -1) return { error: 'Réponse inattendue du modèle.' }

    const data = JSON.parse(text.slice(firstBrace, lastBrace + 1))

    return {
      score: Math.min(100, Math.max(0, Number(data.score) || 0)),
      categorie: (['Favorable', 'Vigilance', 'Défavorable'].includes(data.categorie)
        ? data.categorie
        : 'Vigilance') as EvalAOData['categorie'],
      points_forts: Array.isArray(data.points_forts) ? data.points_forts.slice(0, 3) : [],
      points_vigilance: Array.isArray(data.points_vigilance)
        ? data.points_vigilance.slice(0, 3)
        : [],
      explication: String(data.explication ?? ''),
    }
  } catch (err) {
    console.error('[evaluerAO]', err)
    return { error: "Erreur lors de l'évaluation. Réessayez." }
  }
}
