import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Logo } from '@/components/Logo'
import { OnboardingForm } from './OnboardingForm'

export const metadata = { title: 'Mon entreprise — Stratly' }

export default async function OnboardingPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profil } = await supabase
    .from('profil_entreprise')
    .select('raison_sociale, onboarding_masque')
    .maybeSingle()

  // Already completed or explicitly skipped → go straight to dashboard
  if (profil?.raison_sociale?.trim() || profil?.onboarding_masque) redirect('/dashboard')

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#EEF2FF' }}>

      {/* Top bar */}
      <div className="px-5 py-4 sm:px-8 sm:py-6 flex items-center justify-center border-b border-[#D8E3FF]/60">
        <Link href="/" className="flex items-center">
          <Logo />
        </Link>
      </div>

      <div className="max-w-xl mx-auto px-4 pt-10 pb-16 sm:px-6 sm:pt-12 sm:pb-20">

        {/* Header */}
        <div className="mb-8">
          <p className="font-syne text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-amber mb-3">
            Étape 1 sur 1
          </p>
          <h1 className="font-fraunces text-[26px] sm:text-[32px] text-text tracking-tight leading-tight mb-3">
            Présentez votre entreprise
          </h1>
          <div className="bg-accent/8 border border-accent/20 rounded-xl px-4 py-3">
            <p className="font-syne text-[13px] text-text leading-relaxed">
              Avant votre première analyse, prenez 2 minutes pour présenter votre entreprise.
              Stratly s&apos;en sert pour vous dire si un appel d&apos;offres est fait pour vous.
            </p>
          </div>
        </div>

        {/* Short form */}
        <div className="bg-surface border border-border rounded-2xl p-6 shadow-[0_2px_20px_rgba(0,0,0,0.04)]">
          <OnboardingForm />
        </div>

        <p className="font-syne text-[11px] text-text-subtle text-center mt-6">
          Le reste du profil (références chantiers, certifications, moyens humains) est accessible
          depuis{' '}
          <Link href="/dashboard/mon-entreprise" className="underline underline-offset-2">Mon entreprise</Link>
          {' '}et n&apos;est pas obligatoire maintenant.
        </p>

      </div>
    </div>
  )
}
