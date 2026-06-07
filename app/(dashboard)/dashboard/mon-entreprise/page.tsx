import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { MonEntrepriseForm } from './MonEntrepriseForm'
import type { ProfilEntreprise } from './actions'

export const metadata = { title: 'Mon entreprise — Stratly' }

export default async function MonEntreprisePage() {
  const supabase = await createClient()
  const { data: profil } = await supabase
    .from('profil_entreprise')
    .select('*')
    .maybeSingle() as { data: ProfilEntreprise | null }

  const isOnboarding = profil === null

  return (
    <div className="max-w-2xl mx-auto px-8 py-14">

      {/* Bannière d'accueil — première visite uniquement */}
      {isOnboarding && (
        <div className="mb-8 relative overflow-hidden rounded-2xl border border-brand-amber/30 shadow-[0_2px_16px_rgba(217,119,6,0.08)]"
             style={{ background: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 60%, #FFFBEB 100%)' }}>
          <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full blur-2xl opacity-30 pointer-events-none bg-brand-amber" />
          <div className="relative px-6 py-6">
            <div className="flex items-start gap-4">
              <div className="w-9 h-9 rounded-xl bg-brand-amber/15 border border-brand-amber/25 flex items-center justify-center shrink-0 mt-0.5">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-fraunces text-[18px] text-text leading-tight mb-1.5">
                  Bienvenue sur Stratly&nbsp;!
                </h2>
                <p className="font-syne text-[13px] text-text-muted leading-relaxed mb-4">
                  Renseignez votre entreprise pour obtenir des recommandations Go&nbsp;/&nbsp;No-Go
                  personnalisées sur chaque appel d&apos;offres. Cela ne prend que quelques minutes.
                </p>
                <Link
                  href="/dashboard"
                  className="font-syne text-[12px] font-semibold text-text-subtle hover:text-text-muted transition-colors underline underline-offset-2 decoration-text-subtle/50"
                >
                  Passer cette étape pour l&apos;instant →
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <p className="font-syne text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-amber mb-3">
          Profil
        </p>
        <h1 className="font-fraunces text-[32px] text-text tracking-tight leading-tight">
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
