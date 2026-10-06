import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { AOResultDisplay } from '../../analyser/AOResultDisplay'
import { RecoPrix } from '@/components/RecoPrix'
import { HistoriqueAcheteur } from '@/components/HistoriqueAcheteur'
import type { AOResult, AOMetadata } from '../../analyser/actions'

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

  const meta: AOMetadata = {
    tronque: data.tronque as boolean,
    chars_traites: 0,
    chars_total: 0,
    fichiers_lus: [],
    fichiers_illisibles: [],
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 sm:px-8 sm:py-14">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 font-syne text-[12px] font-semibold text-text-muted mb-8">
        <Link href="/dashboard/mes-analyses" className="hover:text-text transition-colors duration-150">
          Mes analyses
        </Link>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
          <polyline points="9 18 15 12 9 6" />
        </svg>
        <span className="text-text truncate max-w-[260px]">{data.objet_marche as string}</span>
      </nav>

      {/* Header */}
      <div className="mb-6">
        <p className="font-syne text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-amber mb-3">
          Analyse
        </p>
        <h1 className="font-fraunces text-[28px] text-text tracking-tight leading-tight mb-2">
          {data.objet_marche as string}
        </h1>
        <p className="font-syne text-[12px] text-text-muted">
          {data.nom_fichier as string} · {date}
        </p>
      </div>

      {/* Générer le mémoire */}
      <div className="mb-8">
        {isMemoreLocked ? (
          <a
            href="/pricing"
            className="inline-flex items-center gap-2.5 font-syne text-[13px] font-semibold text-text-muted bg-surface border border-border hover:border-accent/40 px-4 py-2.5 rounded-xl transition-all duration-200"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><line x1="10" y1="9" x2="8" y2="9" />
            </svg>
            Générer le mémoire technique
            <span className="font-syne text-[10px] font-bold text-white bg-brand-amber px-1.5 py-0.5 rounded-full uppercase tracking-wide">Plan Pro</span>
          </a>
        ) : (
          <a
            href={`/dashboard/memoire?analyse=${data.id as string}`}
            className="inline-flex items-center gap-2 font-syne text-[13px] font-bold text-white bg-accent hover:bg-accent-dark px-4 py-2.5 rounded-xl transition-all duration-200 shadow-[0_4px_12px_rgba(37,99,235,0.2)]"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><line x1="10" y1="9" x2="8" y2="9" />
            </svg>
            Générer le mémoire technique →
          </a>
        )}
      </div>

      {/* Résultat — NE PAS MODIFIER */}
      <div className="overflow-x-auto">
        <AOResultDisplay data={data.resultat as AOResult} meta={meta} />
      </div>

      {/* Positionnement prix */}
      {(data.resultat as AOResult)?.siret_acheteur && (data.resultat as AOResult)?.code_cpv && (
        <div className="mt-8">
          <RecoPrix
            siret={(data.resultat as AOResult).siret_acheteur!}
            cpv={(data.resultat as AOResult).code_cpv!}
            montant={(data.resultat as AOResult).montant_estime}
            locked={!isPro}
          />
        </div>
      )}

      {/* Historique acheteur */}
      {(data.resultat as AOResult)?.siret_acheteur && (
        <div className="mt-8">
          <HistoriqueAcheteur
            siret={(data.resultat as AOResult).siret_acheteur!}
            cpv={(data.resultat as AOResult).code_cpv}
            locked={!isPro}
          />
        </div>
      )}

      {/* Générer le mémoire — CTA bas de page */}
      <div className="mt-10 pt-8 border-t border-border">
        {isMemoreLocked ? (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-surface border border-border rounded-2xl px-6 py-5">
            <div>
              <p className="font-fraunces text-[18px] text-text mb-1">Passer à l&apos;étape suivante</p>
              <p className="font-syne text-[13px] text-text-muted">Rédigez votre mémoire technique depuis cette analyse.</p>
            </div>
            <a
              href="/pricing"
              className="shrink-0 inline-flex items-center gap-2 font-syne text-[13px] font-semibold text-text-muted bg-background border border-border hover:border-accent/40 px-4 py-2.5 rounded-xl transition-all duration-200"
            >
              Générer le mémoire technique
              <span className="font-syne text-[10px] font-bold text-white bg-brand-amber px-1.5 py-0.5 rounded-full uppercase tracking-wide">Plan Pro</span>
            </a>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-accent/4 border border-accent/20 rounded-2xl px-6 py-5">
            <div>
              <p className="font-fraunces text-[18px] text-text mb-1">Passer à l&apos;étape suivante</p>
              <p className="font-syne text-[13px] text-text-muted">Générez la trame de mémoire technique adaptée à cet appel d&apos;offres.</p>
            </div>
            <a
              href={`/dashboard/memoire?analyse=${data.id as string}`}
              className="shrink-0 inline-flex items-center gap-2 font-syne text-[13px] font-bold text-white bg-accent hover:bg-accent-dark px-5 py-3 rounded-xl transition-all duration-200 shadow-[0_4px_12px_rgba(37,99,235,0.2)]"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><line x1="10" y1="9" x2="8" y2="9" />
              </svg>
              Générer le mémoire technique →
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
