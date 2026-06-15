'use client'

import { useState, useTransition, useEffect } from 'react'
import { rechercheAppelsOffres, evaluerAO, type AOAnnonce, type EvalAOData, type EvalAOResult } from './actions'
import { DEPT_NAMES } from './boampHelpers'

// ─── Generic helpers ──────────────────────────────────────────────────────────

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function daysUntil(iso: string | null): number | null {
  if (!iso) return null
  const ms = new Date(iso).getTime() - Date.now()
  return Math.ceil(ms / (1000 * 60 * 60 * 24))
}

function formatDept(code: string): string {
  return DEPT_NAMES[code] ? `${code} – ${DEPT_NAMES[code]}` : code
}

function normStr(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
}

const TYPE_LABELS: Record<string, string> = {
  TRAVAUX: 'Travaux',
  SERVICES: 'Services',
  FOURNITURES: 'Fournitures',
}

// ─── Level 1 : rule-based relevance scoring ───────────────────────────────────

type RelevanceResult = {
  score: number
  label: string
  category: 'pertinent' | 'a_verifier' | 'peu_pertinent' | 'unknown'
  zoneMatch: boolean
  domainMatch: boolean
}

const BTP_KEYS = ['travaux', 'maçon', 'electri', 'plomber', 'peintur', 'charpent', 'btp', 'genie civil', 'vrd', 'maconneri']

function computeRelevance(
  annonce: AOAnnonce,
  baseDepts: string[],
  profilDomaines: string[],
  profilZone: string | null
): RelevanceResult {
  const hasProfile = profilZone !== null || profilDomaines.length > 0
  if (!hasProfile) {
    return { score: 0, label: 'Profil incomplet', category: 'unknown', zoneMatch: false, domainMatch: false }
  }

  let score = 0

  // Zone (hard factor) — only scored when we extracted dept codes from profil
  const zoneMatch = baseDepts.length > 0 && annonce.code_departement.some((d) => baseDepts.includes(d))
  if (zoneMatch) score += 40

  // Domain in objet (strongest signal)
  const objetNorm = normStr(annonce.objet)
  const descNorm = normStr(annonce.descripteur_libelle.join(' '))
  const domainInObjet = profilDomaines.length > 0 && profilDomaines.some((d) => objetNorm.includes(normStr(d)))
  const domainInDesc = profilDomaines.length > 0 && profilDomaines.some((d) => descNorm.includes(normStr(d)))
  const domainMatch = domainInObjet || domainInDesc

  if (domainInObjet) score += 35
  else if (domainInDesc) score += 25

  // Type-of-work coherence bonus
  const isBTP = profilDomaines.some((d) => BTP_KEYS.some((k) => normStr(d).includes(k)))
  if (isBTP && annonce.type_marche.includes('TRAVAUX')) score += 10

  // Conjunction bonus: both signals present
  if (zoneMatch && domainMatch) score += 10

  let label: string
  let category: RelevanceResult['category']

  if (score >= 60) { label = 'Pertinent'; category = 'pertinent' }
  else if (score >= 25) { label = 'À vérifier'; category = 'a_verifier' }
  else { label = 'Peu pertinent'; category = 'peu_pertinent' }

  return { score, label, category, zoneMatch, domainMatch }
}

// ─── Level 1 badge ────────────────────────────────────────────────────────────

function RelevanceBadge({ relevance }: { relevance: RelevanceResult }) {
  if (relevance.category === 'unknown') {
    return (
      <span className="inline-flex items-center gap-1.5 font-syne text-[10px] font-semibold text-text-subtle bg-background border border-border px-2.5 py-1 rounded-full">
        <span className="w-1.5 h-1.5 rounded-full bg-gray-300 shrink-0" />
        Profil incomplet
      </span>
    )
  }

  const styles = {
    pertinent: {
      dot: 'bg-green-500',
      wrapper: 'text-green-800 bg-green-50 border-green-200',
    },
    a_verifier: {
      dot: 'bg-amber-500',
      wrapper: 'text-amber-800 bg-amber-50 border-amber-200',
    },
    peu_pertinent: {
      dot: 'bg-gray-400',
      wrapper: 'text-gray-600 bg-gray-50 border-gray-200',
    },
  }[relevance.category]

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className={`inline-flex items-center gap-1.5 font-syne text-[10px] font-bold border px-2.5 py-1 rounded-full ${styles.wrapper}`}>
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${styles.dot}`} />
        {relevance.label}
      </span>
      {relevance.zoneMatch && (
        <span className="font-syne text-[10px] text-green-700 flex items-center gap-0.5">
          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
          Zone
        </span>
      )}
      {relevance.domainMatch && (
        <span className="font-syne text-[10px] text-green-700 flex items-center gap-0.5">
          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
          Métier
        </span>
      )}
    </div>
  )
}

// ─── Level 2 : evaluation panel ───────────────────────────────────────────────

function EvalPanel({ result }: { result: EvalAOData }) {
  const catStyles = {
    Favorable: { color: 'text-green-700', bg: 'bg-green-50 border-green-200', dot: 'bg-green-500' },
    Vigilance: { color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200', dot: 'bg-amber-500' },
    Défavorable: { color: 'text-red-700', bg: 'bg-red-50 border-red-200', dot: 'bg-red-500' },
  }[result.categorie]

  const barColor = result.score >= 65
    ? 'bg-green-500'
    : result.score >= 35
    ? 'bg-amber-500'
    : 'bg-red-400'

  return (
    <div className="mt-3 pt-3 border-t border-border space-y-3">
      {/* Score + catégorie */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="font-syne text-[11px] text-text-subtle">Score de correspondance</span>
            <span className="font-syne text-[12px] font-bold text-text">{result.score}/100</span>
          </div>
          <div className="h-1.5 rounded-full bg-border overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${barColor}`}
              style={{ width: `${result.score}%` }}
            />
          </div>
        </div>
        <span className={`inline-flex items-center gap-1.5 font-syne text-[10px] font-bold border px-2.5 py-1 rounded-full shrink-0 ${catStyles.bg} ${catStyles.color}`}>
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${catStyles.dot}`} />
          {result.categorie}
        </span>
      </div>

      {/* Explication */}
      <p className="font-syne text-[12px] text-text leading-relaxed">{result.explication}</p>

      {/* Points */}
      {result.points_forts.length > 0 && (
        <div>
          <p className="font-syne text-[10px] font-bold text-green-700 uppercase tracking-wide mb-1">Points forts</p>
          <ul className="space-y-0.5">
            {result.points_forts.map((pt, i) => (
              <li key={i} className="flex items-start gap-1.5 font-syne text-[12px] text-text">
                <svg className="shrink-0 mt-0.5" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
                {pt}
              </li>
            ))}
          </ul>
        </div>
      )}

      {result.points_vigilance.length > 0 && (
        <div>
          <p className="font-syne text-[10px] font-bold text-amber-700 uppercase tracking-wide mb-1">À vérifier dans le DCE</p>
          <ul className="space-y-0.5">
            {result.points_vigilance.map((pt, i) => (
              <li key={i} className="flex items-start gap-1.5 font-syne text-[12px] text-text">
                <svg className="shrink-0 mt-0.5" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                {pt}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Disclaimer */}
      <div className="flex items-start gap-2 bg-background border border-border rounded-lg px-3 py-2.5">
        <svg className="shrink-0 mt-0.5" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round">
          <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <p className="font-syne text-[11px] text-text-subtle leading-relaxed">
          Pré-évaluation sur l&apos;avis uniquement — pas un Go/No-Go définitif. Pour statuer, téléchargez le DCE et{' '}
          <a href="/dashboard/analyser" className="text-accent underline underline-offset-2 hover:text-accent-dark">
            analysez-le dans Analyser un AO
          </a>.
        </p>
      </div>
    </div>
  )
}

// ─── AO Card ─────────────────────────────────────────────────────────────────

function AOCard({
  annonce,
  baseDepts,
  profilDomaines,
  profilZone,
}: {
  annonce: AOAnnonce
  baseDepts: string[]
  profilDomaines: string[]
  profilZone: string | null
}) {
  const relevance = computeRelevance(annonce, baseDepts, profilDomaines, profilZone)
  const dlDays = daysUntil(annonce.datelimitereponse)
  const deadlineUrgent = dlDays !== null && dlDays >= 0 && dlDays <= 7
  const deadlinePassed = dlDays !== null && dlDays < 0

  // Level 2 state
  const [evalData, setEvalData] = useState<EvalAOData | null>(null)
  const [evalError, setEvalError] = useState<string | null>(null)
  const [isEvalOpen, setIsEvalOpen] = useState(false)
  const [isEvaluating, startEvalTransition] = useTransition()

  const handleEvaluate = () => {
    if (evalData || evalError) {
      // Already evaluated — just toggle visibility
      setIsEvalOpen((prev) => !prev)
      return
    }
    setIsEvalOpen(true)
    startEvalTransition(async () => {
      const res: EvalAOResult = await evaluerAO({
        objet: annonce.objet,
        nomacheteur: annonce.nomacheteur,
        code_departement: annonce.code_departement,
        type_marche: annonce.type_marche,
        descripteur_libelle: annonce.descripteur_libelle,
        dateparution: annonce.dateparution,
        datelimitereponse: annonce.datelimitereponse,
      })
      if ('error' in res) {
        setEvalError(res.error)
      } else {
        setEvalData(res)
        setEvalError(null)
      }
    })
  }

  const evalButtonLabel = isEvaluating
    ? 'Évaluation en cours…'
    : evalData || evalError
    ? isEvalOpen
      ? '← Masquer'
      : 'Voir l\'évaluation IA'
    : 'Évaluer avec l\'IA'

  return (
    <div className="bg-surface border border-border rounded-2xl px-5 py-4 shadow-[0_1px_4px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.07)] transition-shadow duration-200">
      {/* Top row: Level 1 badge + type chips */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <RelevanceBadge relevance={relevance} />
        <div className="flex gap-1.5 shrink-0 flex-wrap justify-end">
          {annonce.type_marche.map((t) => (
            <span
              key={t}
              className="font-syne text-[10px] font-semibold text-text-subtle bg-background border border-border px-2 py-0.5 rounded-full"
            >
              {TYPE_LABELS[t] ?? t}
            </span>
          ))}
        </div>
      </div>

      {/* Objet */}
      <p className="font-syne text-[14px] font-semibold text-text leading-snug mb-2">
        {annonce.objet}
      </p>

      {/* Acheteur + depts */}
      <div className="flex flex-wrap gap-x-4 gap-y-0.5 mb-3">
        {annonce.nomacheteur && (
          <p className="font-syne text-[12px] text-text-subtle">{annonce.nomacheteur}</p>
        )}
        {annonce.code_departement.length > 0 && (
          <p className="font-syne text-[12px] text-text-subtle">
            {annonce.code_departement.map(formatDept).join(' · ')}
          </p>
        )}
      </div>

      {/* Descripteurs CPV */}
      {annonce.descripteur_libelle.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {annonce.descripteur_libelle.slice(0, 4).map((d) => (
            <span
              key={d}
              className="font-syne text-[10px] text-text-subtle bg-background border border-border px-1.5 py-0.5 rounded"
            >
              {d}
            </span>
          ))}
        </div>
      )}

      {/* Footer: dates + voir l'avis */}
      <div className="flex items-center justify-between gap-3 pt-3 border-t border-border">
        <div className="flex flex-wrap gap-x-4 gap-y-0.5">
          <p className="font-syne text-[11px] text-text-subtle">
            Publié le {formatDate(annonce.dateparution)}
          </p>
          {annonce.datelimitereponse && (
            <p
              className={`font-syne text-[11px] font-semibold ${
                deadlinePassed
                  ? 'text-text-subtle line-through'
                  : deadlineUrgent
                  ? 'text-red-600'
                  : 'text-text-subtle'
              }`}
            >
              Limite : {annonce.datelimitereponse.replace('T', ' ')}
              {!deadlinePassed && dlDays !== null && dlDays <= 14 && (
                <span className="ml-1">
                  ({dlDays === 0 ? "aujourd'hui" : dlDays === 1 ? 'demain' : `${dlDays}j`})
                </span>
              )}
            </p>
          )}
        </div>
        {annonce.url_avis ? (
          <a
            href={annonce.url_avis}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 font-syne text-[12px] font-bold text-accent hover:text-accent-dark underline underline-offset-2 transition-colors"
          >
            Voir l&apos;avis →
          </a>
        ) : (
          <span className="shrink-0 font-syne text-[12px] text-text-subtle">
            Avis non disponible
          </span>
        )}
      </div>

      {/* Level 2: Evaluate button */}
      <div className="mt-3 flex items-center justify-between">
        <button
          onClick={handleEvaluate}
          disabled={isEvaluating}
          className="inline-flex items-center gap-1.5 font-syne text-[11px] font-semibold text-accent hover:text-accent-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isEvaluating ? (
            <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          )}
          {evalButtonLabel}
        </button>
        {!evalData && !isEvaluating && (
          <span className="font-syne text-[10px] text-text-subtle">Utilise un crédit IA</span>
        )}
      </div>

      {/* Level 2: Evaluation panel (expandable) */}
      {isEvalOpen && (
        <>
          {isEvaluating && (
            <div className="mt-3 pt-3 border-t border-border flex items-center gap-2 py-4">
              <svg className="animate-spin w-4 h-4 text-accent shrink-0" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <p className="font-syne text-[12px] text-text-subtle">Évaluation en cours…</p>
            </div>
          )}
          {evalError && (
            <div className="mt-3 pt-3 border-t border-border">
              <p className="font-syne text-[12px] text-red-600">{evalError}</p>
            </div>
          )}
          {evalData && <EvalPanel result={evalData} />}
        </>
      )}
    </div>
  )
}

// ─── Main client component ────────────────────────────────────────────────────

type Props = {
  baseDepts: string[]
  baseDomainKeywords: string[]
  profilZone: string | null
  profilDomaines: string[]
}

export function AppelsOffresClient({
  baseDepts,
  baseDomainKeywords,
  profilZone,
  profilDomaines,
}: Props) {
  const [annonces, setAnnonces] = useState<AOAnnonce[]>([])
  const [total, setTotal] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [hasLoaded, setHasLoaded] = useState(false)
  const [motsCles, setMotsCles] = useState('')
  const [inputValue, setInputValue] = useState('')

  const doSearch = (kw: string) => {
    setError(null)
    startTransition(async () => {
      const res = await rechercheAppelsOffres({ baseDepts, baseDomainKeywords, motsCles: kw })
      setHasLoaded(true)
      if ('error' in res) {
        setError(res.error)
      } else {
        setAnnonces(res.annonces)
        setTotal(res.total)
      }
    })
  }

  useEffect(() => {
    doSearch('')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const kw = inputValue.trim()
    setMotsCles(kw)
    doSearch(kw)
  }

  const handleReset = () => {
    setInputValue('')
    setMotsCles('')
    doSearch('')
  }

  const hasProfile = profilZone || profilDomaines.length > 0
  const isFiltered = baseDepts.length > 0 || baseDomainKeywords.length > 0

  return (
    <div className="space-y-6">
      {/* Info banner */}
      <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
        <svg
          width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          className="shrink-0 mt-0.5"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <p className="font-syne text-[12px] text-blue-800 leading-relaxed">
          Données BOAMP — marchés publics ≥ 90 000 € publiés au Journal Officiel. Les montants ne sont pas disponibles dans cette version.
          {isFiltered
            ? ' Résultats filtrés selon votre zone et vos métiers (profil Mon entreprise).'
            : !hasProfile
            ? ' Complétez votre profil Mon entreprise pour filtrer les résultats selon votre zone et vos métiers.'
            : ''}
        </p>
      </div>

      {/* Profil recap chips */}
      {hasProfile && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="font-syne text-[11px] text-text-subtle">Filtres actifs :</span>
          {profilZone && (
            <span className="font-syne text-[11px] text-text bg-background border border-border px-2 py-0.5 rounded-full">
              Zone : {profilZone}
            </span>
          )}
          {profilDomaines.map((d) => (
            <span key={d} className="font-syne text-[11px] text-text bg-background border border-border px-2 py-0.5 rounded-full">
              {d}
            </span>
          ))}
        </div>
      )}

      {/* Search bar */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Affiner par mot-clé… (ex: rénovation, logiciel, nettoyage)"
          className="flex-1 font-syne text-[13px] border border-border rounded-xl px-4 py-2.5 bg-surface text-text placeholder:text-text-subtle focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition"
        />
        <button
          type="submit"
          disabled={isPending}
          className="font-syne text-[13px] font-bold text-white bg-accent hover:bg-accent-dark px-5 py-2.5 rounded-xl transition-colors disabled:opacity-50 shrink-0"
        >
          Rechercher
        </button>
        {motsCles && (
          <button
            type="button"
            onClick={handleReset}
            className="font-syne text-[12px] text-text-subtle hover:text-text px-3 py-2.5 rounded-xl border border-border hover:bg-surface transition-colors shrink-0"
          >
            Réinitialiser
          </button>
        )}
      </form>

      {/* Loading */}
      {isPending && (
        <div className="flex items-center gap-3 py-8 justify-center">
          <svg className="animate-spin w-5 h-5 text-accent" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="font-syne text-[13px] text-text-subtle">Récupération des appels d&apos;offres…</p>
        </div>
      )}

      {/* Error */}
      {!isPending && error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-4">
          <p className="font-syne text-[13px] font-semibold text-red-600">{error}</p>
        </div>
      )}

      {/* Results */}
      {!isPending && hasLoaded && !error && (
        <>
          <p className="font-syne text-[12px] text-text-subtle">
            {annonces.length === 0
              ? "Aucun appel d'offres trouvé pour ces critères."
              : `${annonces.length} annonce${annonces.length > 1 ? 's' : ''} affichée${annonces.length > 1 ? 's' : ''}${total > annonces.length ? ` sur ${total} correspondantes` : ''}`}
            {motsCles && <span className="ml-1">pour &laquo; {motsCles} &raquo;</span>}
          </p>

          <div className="space-y-3">
            {annonces.map((a) => (
              <AOCard
                key={a.idweb}
                annonce={a}
                baseDepts={baseDepts}
                profilDomaines={profilDomaines}
                profilZone={profilZone}
              />
            ))}
          </div>

          {annonces.length === 0 && (
            <div className="text-center py-12">
              <p className="font-syne text-[14px] text-text-subtle">
                Essayez un mot-clé plus générique, ou{' '}
                <a href="/dashboard/mon-entreprise" className="text-accent underline underline-offset-2">
                  complétez votre profil
                </a>{' '}
                pour élargir la zone de recherche.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
