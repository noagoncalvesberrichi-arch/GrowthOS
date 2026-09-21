import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ActeEngagementForm } from './ActeEngagementForm'
import { chargerActeEngagement } from './actions'
import type { AOResult } from '@/app/(dashboard)/dashboard/analyser/actions'

export const metadata = { title: "Acte d'engagement — Stratly" }

type AnalyseRow = {
  id: string
  created_at: string
  objet_marche: string
  resultat: AOResult | null
}

export default async function ActeEngagementPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const [{ data: abo }, { data: profilRow }, analysesResult, savedActe] = await Promise.all([
    supabase.from('abonnements').select('plan').eq('user_id', user.id).single(),
    supabase.from('profil_entreprise').select('*').eq('user_id', user.id).maybeSingle(),
    supabase.from('analyses').select('id, created_at, objet_marche, resultat').order('created_at', { ascending: false }).limit(30),
    chargerActeEngagement(),
  ])
  const analyses = (analysesResult.data ?? []) as AnalyseRow[]

  const plan = abo?.plan ?? 'gratuit'
  const isLocked = plan === 'gratuit'

  if (isLocked) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10 sm:px-8 sm:py-14">
        <div className="mb-8">
          <p className="font-syne text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-amber mb-3">
            Documents
          </p>
          <h1 className="font-fraunces text-[26px] sm:text-[32px] text-text tracking-tight leading-tight">
            Acte d&apos;engagement
          </h1>
        </div>
        <div className="bg-surface border border-border rounded-2xl px-6 py-12 text-center shadow-[0_2px_16px_rgba(37,99,235,0.04)]">
          <div
            className="w-13 h-13 rounded-xl flex items-center justify-center mx-auto mb-5"
            style={{ background: 'linear-gradient(135deg, #FEF3C7, #FDE68A)', width: 52, height: 52 }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0110 0v4" />
            </svg>
          </div>
          <p className="font-fraunces text-[20px] text-text mb-2">Fonctionnalité Essentiel & Pro</p>
          <p className="font-syne text-[13px] text-text-muted mb-7 max-w-sm mx-auto">
            Passez à un plan payant pour générer et télécharger des actes d&apos;engagement pré-remplis depuis vos analyses.
          </p>
          <Link
            href="/pricing"
            className="inline-flex items-center font-syne font-bold text-[13px] text-white bg-accent hover:bg-accent-dark px-5 py-2.5 rounded-xl shadow-[0_4px_16px_rgba(37,99,235,0.2)] transition-all duration-200"
          >
            Voir les tarifs →
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 sm:px-8 sm:py-14">
      <div className="mb-8">
        <p className="font-syne text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-amber mb-3">
          Documents
        </p>
        <h1 className="font-fraunces text-[26px] sm:text-[32px] text-text tracking-tight leading-tight">
          Acte d&apos;engagement
        </h1>
        <p className="font-syne text-[14px] text-text-muted mt-1.5">
          Pré-remplissez et téléchargez un brouillon d&apos;acte d&apos;engagement.
        </p>
      </div>

      <ActeEngagementForm
        profil={profilRow}
        analyses={analyses}
        savedActe={savedActe}
      />
    </div>
  )
}
