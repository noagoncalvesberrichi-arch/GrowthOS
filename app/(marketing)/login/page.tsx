'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Logo } from '@/components/Logo'
import { verifierEtEnvoyerBienvenue } from './actions'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })

    if (signInError) {
      setError('Email ou mot de passe incorrect.')
      setLoading(false)
      return
    }

    // Redirect to onboarding if no company profile yet
    const { data: profil } = await supabase
      .from('profil_entreprise')
      .select('id')
      .maybeSingle()

    // Fire-and-forget — n'attend pas le résultat, ne bloque pas la navigation
    verifierEtEnvoyerBienvenue().catch(() => {})

    router.push(profil ? '/dashboard' : '/onboarding')
    router.refresh()
  }

  return (
    <div
      className="relative min-h-[calc(100vh-64px)] flex items-center justify-center p-6 overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #0C1647 0%, #1E3A8A 55%, #2563EB 100%)' }}
    >
      <div className="absolute inset-0 dot-grid opacity-[0.06] pointer-events-none" />

      <div className="relative bg-white rounded-2xl shadow-[0_24px_80px_rgba(0,0,0,0.28)] w-full max-w-md overflow-hidden">

        {/* Header */}
        <div className="px-8 pt-8 pb-6 border-b border-[#EEF2FF] text-center">
          <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center mx-auto mb-4">
            <Logo symbolOnly variant="onAccent" />
          </div>
          <h1 className="font-fraunces text-[26px] text-text tracking-tight">Bon retour&nbsp;!</h1>
          <p className="font-syne text-[13px] text-text-muted mt-1">Connectez-vous à votre espace Stratly.</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-8 py-7 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              <p className="font-syne text-[13px] text-red-600">{error}</p>
            </div>
          )}

          <div>
            <label className="block font-syne text-[12px] font-semibold text-text-muted mb-1.5">
              Adresse email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vous@exemple.com"
              required
              className="w-full bg-background border border-border rounded-lg px-3.5 py-2.5 font-syne text-[14px] text-text placeholder:text-text-subtle transition-all duration-150 focus:border-accent focus:ring-2 focus:ring-accent/10 outline-none"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-syne text-[12px] font-semibold text-text-muted">Mot de passe</label>
              <Link href="/forgot-password" className="font-syne text-[12px] text-accent hover:text-accent-dark transition-colors">
                Oublié ?
              </Link>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full bg-background border border-border rounded-lg px-3.5 py-2.5 font-syne text-[14px] text-text placeholder:text-text-subtle transition-all duration-150 focus:border-accent focus:ring-2 focus:ring-accent/10 outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="group relative w-full py-3 bg-accent hover:bg-accent-dark text-white font-syne font-bold text-[14px] rounded-xl transition-all duration-200 overflow-hidden shadow-[0_4px_16px_rgba(37,99,235,0.25)] mt-2"
          >
            <span
              aria-hidden="true"
              className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/15 to-transparent"
            />
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Connexion...
              </span>
            ) : (
              <span className="relative">Se connecter →</span>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="px-8 pb-7 text-center">
          <p className="font-syne text-[13px] text-text-muted">
            Pas encore de compte ?{' '}
            <Link href="/signup" className="text-accent hover:text-accent-dark font-semibold transition-colors">
              Créer un compte
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
