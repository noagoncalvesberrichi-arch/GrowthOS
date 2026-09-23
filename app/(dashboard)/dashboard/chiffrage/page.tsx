import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChiffrageWizard } from './ChiffrageWizard'
import type { ProfilEntreprise } from '@/app/(dashboard)/dashboard/mon-entreprise/actions'

export const metadata = { title: 'Chiffrage automatique — Stratly' }

export default async function ChiffragePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: aboData }, { data: profilData }] = await Promise.all([
    supabase.from('abonnements').select('plan').maybeSingle(),
    supabase.from('profil_entreprise').select('raison_sociale, forme_juridique, adresse_siege, siret, nom_signataire, qualite_signataire, iban, bic').maybeSingle(),
  ])

  const plan: string = (aboData as { plan: string } | null)?.plan ?? 'gratuit'
  const isPro = plan === 'pro' || plan.startsWith('essai_pro') || plan === 'fondateurs'
  const profil = profilData as Partial<ProfilEntreprise> | null

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 sm:px-8 sm:py-14">
      <div className="mb-8">
        <p className="font-syne text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-amber mb-3">
          Répondre aux appels d&apos;offres
        </p>
        <h1 className="font-syne text-2xl font-bold text-text mb-2">Chiffrage automatique</h1>
        <p className="font-syne text-[14px] text-text-muted">
          Copiez les prix de votre CRM dans le bordereau de l&apos;acheteur (DPGF / DQE / BPU) en conservant sa mise en forme.
        </p>
      </div>

      {isPro ? (
        <ChiffrageWizard profil={profil} />
      ) : (
        <div className="bg-surface border border-border rounded-2xl p-10 flex flex-col items-center gap-5 text-center">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="text-text-muted">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0110 0v4" />
          </svg>
          <div>
            <p className="font-syne text-[15px] font-semibold text-text mb-1">Fonctionnalité réservée au plan Pro</p>
            <p className="font-syne text-[13px] text-text-muted">Passez au plan Pro pour accéder au chiffrage automatique.</p>
          </div>
          <Link
            href="/pricing"
            className="font-syne text-[13px] font-semibold text-background bg-brand-amber hover:bg-brand-amber/90 px-6 py-2.5 rounded-xl transition-colors"
          >
            Voir les tarifs
          </Link>
        </div>
      )}
    </div>
  )
}
