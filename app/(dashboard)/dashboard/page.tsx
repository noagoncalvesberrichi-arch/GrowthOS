import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export const metadata = { title: 'Tableau de bord — Stratly' }

type Verdict = 'GO' | 'NO_GO' | 'VIGILANCE'

type AnalyseRecente = {
  id: string
  created_at: string
  objet_marche: string | null
  nom_fichier: string | null
  resultat: { go_no_go?: { verdict?: Verdict } | null } | null
}

type Abonnement = {
  plan: string | null
  analyses_utilisees: number | null
  quota_gratuit: number | null
  statut_paiement: string | null
}

function verdictConfig(verdict: Verdict | undefined | null) {
  if (verdict === 'GO') return { label: 'GO', bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' }
  if (verdict === 'NO_GO') return { label: 'NO-GO', bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' }
  return { label: 'Vigilance', bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' }
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

const actionCards = [
  {
    href: '/dashboard/analyser',
    label: 'Analyser un AO',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="12" y1="18" x2="12" y2="12" /><line x1="9" y1="15" x2="15" y2="15" />
      </svg>
    ),
  },
  {
    href: '/dashboard/mes-analyses',
    label: 'Mes analyses',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
        <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
      </svg>
    ),
  },
  {
    href: '/dashboard/memoire',
    label: 'Mémoire technique',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><line x1="10" y1="9" x2="8" y2="9" />
      </svg>
    ),
  },
  {
    href: '/dashboard/appels-offres',
    label: "Appels d'offres",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    ),
  },
]

export default async function DashboardPage() {
  const supabase = await createClient()

  const [{ data: { user } }, { data: aboData }, { data: analysesData }] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from('abonnements').select('plan, analyses_utilisees, quota_gratuit, statut_paiement').maybeSingle(),
    supabase
      .from('analyses')
      .select('id, created_at, objet_marche, nom_fichier, resultat')
      .order('created_at', { ascending: false })
      .limit(4),
  ])

  const firstName = user?.email?.split('@')[0] ?? 'toi'
  const abo = aboData as Abonnement | null
  const analyses = (analysesData ?? []) as AnalyseRecente[]

  const isPro = abo?.plan === 'pro' && abo?.statut_paiement === 'actif'
  const used = abo?.analyses_utilisees ?? 0
  const quota = abo?.quota_gratuit ?? 3
  const pct = Math.min(100, Math.round((used / quota) * 100))
  const barColor = pct >= 100 ? '#EF4444' : pct >= 67 ? '#D97706' : '#2563EB'

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 sm:px-8 sm:py-14">

      {/* Header */}
      <div className="mb-8">
        <p className="font-syne text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-amber mb-2">
          Tableau de bord
        </p>
        <h1 className="font-fraunces text-[28px] sm:text-[34px] text-text tracking-tight leading-tight">
          Bonjour, {firstName}&nbsp;👋
        </h1>
      </div>

      {/* Top section: quota + actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-8">

        {/* Quota block */}
        <div className="bg-surface border border-border rounded-2xl p-5">
          {isPro ? (
            <div className="h-full flex flex-col justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 bg-accent/8 text-accent border border-accent/20 rounded-full px-3 py-1 mb-3">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" className="shrink-0">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                  <span className="font-syne text-[11px] font-bold uppercase tracking-wider">Pro</span>
                </div>
                <p className="font-syne text-[13px] text-text-muted leading-relaxed">
                  Analyses illimitées, toutes les fonctionnalités débloquées.
                </p>
              </div>
              <Link href="/dashboard/parametres" className="font-syne text-[12px] font-semibold text-text-subtle hover:text-accent transition-colors duration-150">
                Gérer l&apos;abonnement →
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-syne text-[11px] font-semibold uppercase tracking-wider text-text-subtle mb-1">
                    Plan Gratuit
                  </p>
                  <p className="font-fraunces text-[26px] text-text leading-none">
                    {used}
                    <span className="font-syne text-[14px] text-text-subtle font-normal"> / {quota}</span>
                  </p>
                  <p className="font-syne text-[12px] text-text-subtle mt-0.5">analyses utilisées</p>
                </div>
                {used >= quota && (
                  <span className="shrink-0 font-syne text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 rounded-full px-2 py-0.5 mt-0.5">
                    Quota atteint
                  </span>
                )}
              </div>

              {/* Progress bar */}
              <div>
                <div className="h-1.5 rounded-full bg-border overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, background: barColor }}
                  />
                </div>
              </div>

              <Link
                href="/pricing"
                className="inline-flex items-center justify-center gap-1.5 bg-accent text-white font-syne text-[13px] font-semibold rounded-xl px-4 py-2.5 hover:bg-accent/90 transition-colors duration-150"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
                Passer à Pro
              </Link>
            </div>
          )}
        </div>

        {/* Action cards 2×2 */}
        <div className="lg:col-span-2 grid grid-cols-2 gap-3">
          {actionCards.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="group bg-surface border border-border hover:border-accent/35 rounded-xl p-4 flex flex-col gap-3 transition-all duration-150 hover:shadow-[0_4px_20px_rgba(37,99,235,0.08)]"
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: 'linear-gradient(135deg, #EFF6FF, #DBEAFE)' }}
              >
                {card.icon}
              </div>
              <div className="flex items-end justify-between gap-1">
                <p className="font-syne text-[13px] font-semibold text-text leading-snug flex-1">{card.label}</p>
                <svg
                  width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                  className="shrink-0 text-text-subtle group-hover:text-accent group-hover:translate-x-0.5 transition-all duration-150 mb-0.5"
                >
                  <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent analyses */}
      <div className="bg-surface border border-border rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <p className="font-syne text-[13px] font-bold text-text uppercase tracking-wider">Dernières analyses</p>
          <Link href="/dashboard/mes-analyses" className="font-syne text-[12px] font-semibold text-accent hover:text-accent/80 transition-colors duration-150">
            Voir tout →
          </Link>
        </div>

        {analyses.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4"
              style={{ background: 'linear-gradient(135deg, #EFF6FF, #DBEAFE)' }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="12" y1="18" x2="12" y2="12" /><line x1="9" y1="15" x2="15" y2="15" />
              </svg>
            </div>
            <p className="font-syne text-[14px] font-semibold text-text mb-1.5">Aucune analyse pour l&apos;instant</p>
            <p className="font-syne text-[13px] text-text-muted mb-5">Dépose ton premier DCE pour commencer.</p>
            <Link
              href="/dashboard/analyser"
              className="inline-flex items-center gap-2 bg-accent text-white font-syne text-[13px] font-semibold rounded-xl px-4 py-2.5 hover:bg-accent/90 transition-colors duration-150"
            >
              Analyser un AO
            </Link>
          </div>
        ) : (
          <ul>
            {analyses.map((analyse, i) => {
              const verdict = analyse.resultat?.go_no_go?.verdict
              const vc = verdictConfig(verdict)
              const title = analyse.objet_marche ?? analyse.nom_fichier ?? 'Sans titre'
              return (
                <li key={analyse.id}>
                  <Link
                    href={`/dashboard/mes-analyses/${analyse.id}`}
                    className={`flex items-center gap-3.5 px-5 py-3.5 hover:bg-accent/4 transition-colors duration-150 group ${i < analyses.length - 1 ? 'border-b border-border' : ''}`}
                  >
                    {/* Verdict badge */}
                    <span className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 ${vc.bg}`}>
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${vc.dot}`} />
                      <span className={`font-syne text-[10px] font-bold ${vc.text}`}>{vc.label}</span>
                    </span>

                    {/* Title */}
                    <p className="font-syne text-[13px] text-text flex-1 truncate leading-snug group-hover:text-accent transition-colors duration-150">
                      {title}
                    </p>

                    {/* Date */}
                    <span className="font-syne text-[12px] text-text-subtle shrink-0">
                      {formatDate(analyse.created_at)}
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </div>

    </div>
  )
}
