import { createClient } from '@/lib/supabase/server'
import { MonEntrepriseForm } from './MonEntrepriseForm'
import type { ProfilEntreprise } from './actions'

export const metadata = { title: 'Mon entreprise — Stratly' }

export default async function MonEntreprisePage() {
  const supabase = await createClient()
  const { data: profil } = await supabase
    .from('profil_entreprise')
    .select('*')
    .maybeSingle() as { data: ProfilEntreprise | null }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 sm:px-8 sm:py-14">

      <div className="mb-8">
        <p className="font-syne text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-amber mb-3">
          Profil
        </p>
        <h1 className="font-fraunces text-[26px] sm:text-[32px] text-text tracking-tight leading-tight">
          Mon entreprise
        </h1>
        <p className="font-syne text-[14px] text-text-muted mt-1.5 max-w-xl">
          Ces informations permettront à Stratly de qualifier automatiquement les appels d&apos;offres et de générer un avis Go&nbsp;/&nbsp;No-Go personnalisé.
        </p>
      </div>

      <MonEntrepriseForm profil={profil} />
    </div>
  )
}
