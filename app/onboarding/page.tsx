import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { MonEntrepriseForm } from '@/app/(dashboard)/dashboard/mon-entreprise/MonEntrepriseForm'
import type { ProfilEntreprise } from '@/app/(dashboard)/dashboard/mon-entreprise/actions'

export const metadata = { title: 'Configurer mon entreprise — Stratly' }

export default async function OnboardingPage() {
  const supabase = await createClient()

  // Middleware already blocks unauthenticated users, but double-check
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // If profile already exists, skip onboarding
  const { data: profil } = await supabase
    .from('profil_entreprise')
    .select('*')
    .maybeSingle() as { data: ProfilEntreprise | null }

  if (profil) redirect('/dashboard')

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#EEF2FF' }}>

      {/* Top bar — logo seul */}
      <div className="px-8 py-6 flex items-center justify-center border-b border-[#D8E3FF]/60">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center shrink-0">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 11L5 5.5L8 8.5L10 5.5L12.5 11" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="font-fraunces font-bold text-[17px] text-text tracking-tight">Stratly</span>
        </Link>
      </div>

      <div className="max-w-2xl mx-auto px-6 pt-12 pb-20">

        {/* En-tête de bienvenue */}
        <div className="text-center mb-10">
          <p className="font-syne text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-amber mb-4">
            Configuration initiale
          </p>
          <h1 className="font-fraunces text-[36px] text-text tracking-tight leading-tight mb-3">
            Bienvenue sur Stratly&nbsp;!
          </h1>
          <p className="font-syne text-[15px] text-text-muted leading-relaxed max-w-md mx-auto">
            Renseignez votre entreprise pour obtenir des recommandations
            Go&nbsp;/&nbsp;No-Go personnalisées sur chaque appel d&apos;offres.
          </p>
          <Link
            href="/dashboard"
            className="inline-block mt-4 font-syne text-[12px] font-semibold text-text-subtle hover:text-text-muted transition-colors underline underline-offset-2 decoration-text-subtle/40"
          >
            Passer pour l&apos;instant →
          </Link>
        </div>

        {/* Formulaire — redirige vers /dashboard après save */}
        <MonEntrepriseForm profil={null} redirectOnSave="/dashboard" />
      </div>
    </div>
  )
}
