'use client'

import { useState, useTransition, useEffect } from 'react'
import { rechercheAppelsOffres, type AOAnnonce } from './actions'
import { DEPT_NAMES } from './boampHelpers'

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

function hasZoneBadge(annonce: AOAnnonce, baseDepts: string[]): boolean {
  if (!baseDepts.length) return false
  return annonce.code_departement.some((d) => baseDepts.includes(d))
}

function hasMetierBadge(annonce: AOAnnonce, profilDomaines: string[]): boolean {
  if (!profilDomaines.length) return false
  const haystack = normStr(
    [annonce.objet, ...annonce.descripteur_libelle].join(' ')
  )
  return profilDomaines.some((dom) => haystack.includes(normStr(dom)))
}

const TYPE_LABELS: Record<string, string> = {
  TRAVAUX: 'Travaux',
  SERVICES: 'Services',
  FOURNITURES: 'Fournitures',
}

// ─── AO Card ─────────────────────────────────────────────────────────────────

function AOCard({
  annonce,
  baseDepts,
  profilDomaines,
}: {
  annonce: AOAnnonce
  baseDepts: string[]
  profilDomaines: string[]
}) {
  const zoneBadge = hasZoneBadge(annonce, baseDepts)
  const metierBadge = hasMetierBadge(annonce, profilDomaines)
  const dlDays = daysUntil(annonce.datelimitereponse)
  const deadlineUrgent = dlDays !== null && dlDays >= 0 && dlDays <= 7
  const deadlinePassed = dlDays !== null && dlDays < 0

  return (
    <div className="bg-surface border border-border rounded-2xl px-5 py-4 shadow-[0_1px_4px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.07)] transition-shadow duration-200">
      {/* Top row: badges + type */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex flex-wrap gap-1.5">
          {zoneBadge && (
            <span className="inline-flex items-center gap-1 font-syne text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
              <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 1118 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              Votre zone
            </span>
          )}
          {metierBadge && (
            <span className="inline-flex items-center gap-1 font-syne text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
              <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <rect x="2" y="7" width="20" height="14" rx="2" />
                <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
              </svg>
              Votre métier
            </span>
          )}
          {!zoneBadge && !metierBadge && (
            <span className="font-syne text-[10px] text-text-subtle">—</span>
          )}
        </div>
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
          <p className="font-syne text-[12px] text-text-subtle">
            {annonce.nomacheteur}
          </p>
        )}
        {annonce.code_departement.length > 0 && (
          <p className="font-syne text-[12px] text-text-subtle">
            {annonce.code_departement.map(formatDept).join(' · ')}
          </p>
        )}
      </div>

      {/* Descripteurs */}
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

      {/* Footer: dates + CTA */}
      <div className="flex items-center justify-between gap-3 pt-3 border-t border-border mt-1">
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
              Limite : {annonce.datelimitereponse.replace(' ', ' à ')}
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

  // Initial load
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
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#2563EB"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="shrink-0 mt-0.5"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <p className="font-syne text-[12px] text-blue-800 leading-relaxed">
          Données BOAMP — marchés publics ≥ 90 000 € publiés au Journal Officiel.
          Les montants ne sont pas disponibles dans cette version.
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
            <span
              key={d}
              className="font-syne text-[11px] text-text bg-background border border-border px-2 py-0.5 rounded-full"
            >
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
          placeholder="Rechercher dans les objets… (ex: rénovation, informatique)"
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
          <svg
            className="animate-spin w-5 h-5 text-accent"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="3"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          <p className="font-syne text-[13px] text-text-subtle">
            Récupération des appels d&apos;offres…
          </p>
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
              ? 'Aucun appel d\'offres trouvé pour ces critères.'
              : `${annonces.length} annonce${annonces.length > 1 ? 's' : ''} affichée${annonces.length > 1 ? 's' : ''}${total > annonces.length ? ` sur ${total} correspondantes` : ''}`}
            {motsCles && (
              <span className="ml-1">
                pour &laquo; {motsCles} &raquo;
              </span>
            )}
          </p>

          <div className="space-y-3">
            {annonces.map((a) => (
              <AOCard
                key={a.idweb}
                annonce={a}
                baseDepts={baseDepts}
                profilDomaines={profilDomaines}
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
