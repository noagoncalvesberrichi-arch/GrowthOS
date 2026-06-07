import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ParametresClient } from './ParametresClient'

export const metadata = { title: 'Paramètres — Stratly' }

export type AbonnementData = {
  plan: string
  analyses_utilisees: number
  quota_gratuit: number
  statut_paiement: string | null
  stripe_customer_id: string | null
} | null

export default async function ParametresPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: abonnement } = await supabase
    .from('abonnements')
    .select('plan, analyses_utilisees, quota_gratuit, statut_paiement, stripe_customer_id')
    .maybeSingle() as { data: AbonnementData }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 sm:px-8 sm:py-14">
      <div className="mb-8">
        <p className="font-syne text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-amber mb-3">
          Compte &amp; paramètres
        </p>
        <h1 className="font-fraunces text-[26px] sm:text-[32px] text-text tracking-tight leading-tight">
          Paramètres
        </h1>
      </div>

      <ParametresClient email={user.email ?? ''} abonnement={abonnement} />
    </div>
  )
}
