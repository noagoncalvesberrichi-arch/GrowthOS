import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { MemoireForm } from './MemoireForm'

export const maxDuration = 300
export const metadata = { title: 'Mémoire technique — Stratly' }

export type AnalyseItem = {
  id: string
  objet_marche: string | null
  nom_fichier: string
  created_at: string
  go_no_go_verdict: string | null
}

export default async function MemoirePage({ searchParams }: { searchParams: Promise<{ analyse?: string }> }) {
  const { analyse: defaultAnalyseId } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: rawAnalyses }, { data: aboData }] = await Promise.all([
    supabase
      .from('analyses')
      .select('id, objet_marche, nom_fichier, created_at, resultat')
      .order('created_at', { ascending: false })
      .limit(20),
    supabase
      .from('abonnements')
      .select('plan')
      .maybeSingle(),
  ])

  const analyses: AnalyseItem[] = (rawAnalyses ?? []).map((a) => ({
    id: a.id as string,
    objet_marche: a.objet_marche as string | null,
    nom_fichier: a.nom_fichier as string,
    created_at: a.created_at as string,
    go_no_go_verdict: (a.resultat as { go_no_go?: { verdict?: string } } | null)?.go_no_go?.verdict ?? null,
  }))

  const plan = (aboData as { plan: string } | null)?.plan ?? 'gratuit'
  const isLocked = plan === 'gratuit'

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 sm:px-8 sm:py-14">

      <div className="mb-8">
        <p className="font-syne text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-amber mb-3">
          Réponse aux appels d&apos;offres
        </p>
        <h1 className="font-fraunces text-[26px] sm:text-[32px] text-text tracking-tight leading-tight mb-3">
          Mémoire technique
        </h1>
        <p className="font-syne text-[14px] text-text-muted leading-relaxed max-w-lg">
          Générez une trame structurée et pré-remplie à partir de votre analyse d&apos;AO ou d&apos;une description du marché.
          Les passages <span className="font-semibold text-text">[À COMPLÉTER]</span> vous indiquent ce que vous devez personnaliser.
        </p>
      </div>

      {analyses.length === 0 ? (
        <div className="bg-surface border border-border rounded-2xl px-5 py-12 sm:px-8 sm:py-16 text-center shadow-[0_2px_16px_rgba(37,99,235,0.04)]">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-5"
            style={{ background: 'linear-gradient(135deg, #EFF6FF, #DBEAFE)', width: 52, height: 52 }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <line x1="10" y1="9" x2="8" y2="9" />
            </svg>
          </div>
          <p className="font-fraunces text-[20px] text-text mb-2">Aucun mémoire technique</p>
          <p className="font-syne text-[13px] text-text-muted mb-7 max-w-sm mx-auto leading-relaxed">
            Lancez d&apos;abord une analyse, puis générez le mémoire depuis la page de l&apos;analyse.
          </p>
          <Link
            href="/dashboard/mes-analyses"
            className="inline-flex items-center font-syne font-bold text-[13px] text-white bg-accent hover:bg-accent-dark px-5 py-2.5 rounded-xl shadow-[0_4px_16px_rgba(37,99,235,0.2)] transition-all duration-200"
          >
            Voir mes analyses →
          </Link>
        </div>
      ) : (
        <MemoireForm analyses={analyses} isLocked={isLocked} defaultAnalyseId={defaultAnalyseId} />
      )}
    </div>
  )
}
