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
    <div className="max-w-2xl mx-auto px-8 py-10">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full bg-accent" />
          <span className="font-syne text-[12px] font-semibold text-accent uppercase tracking-wider">Profil</span>
        </div>
        <h1 className="font-syne text-[28px] font-extrabold text-text tracking-tight leading-tight">
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
