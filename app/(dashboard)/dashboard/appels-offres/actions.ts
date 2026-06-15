'use server'

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
