import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { AnalyseResultat } from '@/components/AnalyseResultat'
import { getNextActions } from '@/lib/analyse/resultUtils'
import type { AOResult, AOMetadata } from '../../analyser/actions'

// ─── Step frise ───────────────────────────────────────────────────────────────

function StepFrise({ hasMemoire }: { hasMemoire: boolean }) {
  const steps = [
    { label: 'Analyse', done: true },
    { label: 'Mémoire', done: hasMemoire },
    { label: 'Chiffrage', done: false },
  ]
  return (
    <div className="flex items-center gap-0">
      {steps.map((step, i) => (
        <div key={step.label} className="flex items-center">
          {i > 0 && (
            <div className={`w-8 h-px mx-1 ${steps[i - 1].done ? 'bg-menthe/60' : 'bg-white/15'}`} />
          )}
          <div className="flex items-center gap-1.5">
            <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
              step.done ? 'bg-menthe' : i === 0 ? 'bg-cuivre-glow' : 'bg-white/10 border border-white/20'
            }`}>
              {step.done ? (
                <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                <div className={`w-1.5 h-1.5 rounded-full ${i === 0 ? 'bg-nuit' : 'bg-white/20'}`} />
              )}
            </div>
            <span className={`font-syne text-[11px] font-semibold ${
              step.done || i === 0 ? 'text-white/75' : 'text-white/30'
            }`}>
              {step.label}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Verdict badge ────────────────────────────────────────────────────────────

function VerdictBadge({ verdict }: { verdict: 'GO' | 'NO_GO' | 'VIGILANCE' | null }) {
  if (!verdict) return null
  const map = {
    GO: { label: 'GO', bg: 'bg-menthe/15', border: 'border-menthe/30', text: 'text-menthe' },
    NO_GO: { label: 'NO-GO', bg: 'bg-red-500/12', border: 'border-red-400/30', text: 'text-red-300' },
    VIGILANCE: { label: 'Vigilance', bg: 'bg-brand-amber/12', border: 'border-brand-amber/30', text: 'text-cuivre-glow' },
  }
  const s = map[verdict]
  return (
    <span className={`inline-flex items-center ${s.bg} border ${s.border} ${s.text} font-syne text-[11px] font-bold uppercase tracking-widest px-3 py-1 rounded-pill`}>
      {s.label}
    </span>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function AnalyseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data }, { data: abo }] = await Promise.all([
    supabase
      .from('analyses')
      .select('id, created_at, nom_fichier, objet_marche, resultat, tronque')
      .eq('id', id)
      .single(),
    supabase.from('abonnements').select('plan').maybeSingle(),
  ])

  if (!data) notFound()
  const plan = abo?.plan ?? 'gratuit'
  const isPro = plan === 'pro' || plan.startsWith('essai_pro') || plan === 'fondateurs'
  const isMemoreLocked = plan === 'gratuit'

  const date = new Date(data.created_at as string).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const resultat = data.resultat as AOResult
  const verdict = resultat?.go_no_go?.verdict ?? null
  const score = resultat?.go_no_go?.score_eligibilite ?? null
  const dateLimite = resultat?.dates_cles?.date_limite_offres ?? null
  const montant = resultat?.montant_estime ?? null

  const meta: AOMetadata = {
    tronque: data.tronque as boolean,
    chars_traites: 0,
    chars_total: 0,
    fichiers_lus: [],
    fichiers_illisibles: [],
    fichiers_statuts: [],
    dossier_incomplet: false,
    pieces_essentielles_manquantes: [],
  }

  const firstAction = resultat ? getNextActions(resultat, id)[0] : undefined

  return (
    <div className="pb-24">

      {/* ── Dark hero header ── */}
      <div
        className="relative overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #0D1220 0%, #160D38 40%, #0F2040 100%)' }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 60% 80% at 30% 50%, rgba(37,99,235,0.07) 0%, transparent 70%)' }}
        />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-8 pt-6 pb-8">

          {/* Breadcrumb + frise */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <nav className="flex items-center gap-1.5 font-syne text-[11px] font-semibold text-white/35">
              <Link href="/dashboard/mes-analyses" className="hover:text-white/65 transition-colors duration-150">
                Mes analyses
              </Link>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                <polyline points="9 18 15 12 9 6" />
              </svg>
              <span className="text-white/55 truncate max-w-[180px]">{data.objet_marche as string}</span>
            </nav>
            <StepFrise hasMemoire={false} />
          </div>

          {/* Title row */}
          <div className="flex flex-wrap items-start gap-3 mb-5">
            {verdict && <VerdictBadge verdict={verdict} />}
            <h1 className="font-fraunces text-[22px] sm:text-[26px] text-white tracking-tight leading-snug flex-1 min-w-0">
              {data.objet_marche as string}
            </h1>
          </div>

          {/* Meta */}
          <p className="font-syne text-[12px] text-white/30 mb-5">
            {data.nom_fichier as string} · {date}
          </p>

          {/* Summary metrics strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {score !== null && (
              <div className="glass-card-sm rounded-xl px-3 py-3">
                <p className="font-syne text-[10px] text-white/35 mb-1">Score d&apos;adéquation</p>
                <div className="flex items-center gap-2">
                  <span className="font-fraunces text-[20px] text-cuivre-glow font-bold leading-none">{score}</span>
                  <span className="font-syne text-[10px] text-white/30">/ 100</span>
                </div>
                <div className="mt-1.5 h-1 rounded-pill bg-white/8 overflow-hidden">
                  <div
                    className="h-full rounded-pill bg-gradient-to-r from-menthe to-cuivre"
                    style={{ width: `${score}%` }}
                  />
                </div>
              </div>
            )}
            {dateLimite && (
              <div className="glass-card-sm rounded-xl px-3 py-3">
                <p className="font-syne text-[10px] text-white/35 mb-1">Date limite</p>
                <p className="font-syne text-[13px] font-bold text-white leading-snug">{dateLimite}</p>
              </div>
            )}
            {montant !== null && (
              <div className="glass-card-sm rounded-xl px-3 py-3">
                <p className="font-syne text-[10px] text-white/35 mb-1">Montant estimé</p>
                <p className="font-syne text-[13px] font-bold text-white leading-snug">
                  {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(montant)}
                </p>
              </div>
            )}
            {resultat?.acheteur && (
              <div className="glass-card-sm rounded-xl px-3 py-3 col-span-2 sm:col-span-1">
                <p className="font-syne text-[10px] text-white/35 mb-1">Acheteur</p>
                <p className="font-syne text-[12px] font-semibold text-white leading-snug line-clamp-2">{resultat.acheteur}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="max-w-3xl mx-auto px-4 sm:px-8 pt-8">
        <AnalyseResultat
          data={resultat}
          meta={meta}
          analyseId={id}
          isPro={isPro}
          isMemoreLocked={isMemoreLocked}
        />
      </div>

      {/* ── Sticky bottom bar — first uncompleted action ── */}
      {firstAction && (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border/60 bg-surface/95 backdrop-blur-xl px-4 py-3 sm:px-8">
          <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
            <div className="hidden sm:block">
              <p className="font-fraunces text-[15px] text-text leading-tight">Prochaine étape</p>
              <p className="font-syne text-[12px] text-text-muted">{firstAction.detail}</p>
            </div>
            {firstAction.icon === 'memoire' && isMemoreLocked ? (
              <a
                href="/pricing"
                className="ml-auto shrink-0 inline-flex items-center gap-2 font-syne text-[13px] font-semibold text-text-muted bg-background border border-border hover:border-accent/40 px-4 py-2.5 rounded-xl transition-all duration-200"
              >
                {firstAction.label}
                <span className="font-syne text-[10px] font-bold text-white bg-brand-amber px-1.5 py-0.5 rounded-full uppercase tracking-wide">Pro</span>
              </a>
            ) : (
              <a
                href={firstAction.href}
                className="ml-auto shrink-0 inline-flex items-center gap-2 font-syne text-[13px] font-bold text-white bg-accent hover:bg-accent-dark px-5 py-2.5 rounded-xl transition-all duration-200 shadow-[0_4px_12px_rgba(37,99,235,0.2)]"
              >
                {firstAction.label} →
              </a>
            )}
          </div>
        </div>
      )}

    </div>
  )
}
