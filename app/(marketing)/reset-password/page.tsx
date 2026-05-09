'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type PageState = 'loading' | 'ready' | 'success' | 'error'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [pageState, setPageState] = useState<PageState>('loading')
  const [pageError, setPageError] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [formError, setFormError] = useState('')

  useEffect(() => {
    const supabase = createClient()
    let resolved = false

    // Listen for PASSWORD_RECOVERY event — fires when SDK auto-detects a recovery hash
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        resolved = true
        setPageState('ready')
      }
    })

    const init = async () => {
      // Cas 1 : PKCE flow (?code=xxx in query string)
      const code = new URLSearchParams(window.location.search).get('code')

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        resolved = true
        if (error) {
          setPageError('Ce lien est invalide ou a expiré. Recommencez depuis la page mot de passe oublié.')
          setPageState('error')
        } else {
          setPageState('ready')
        }
        return
      }

      // Cas 2 : Implicit flow (#access_token=xxx in hash)
      const hash = window.location.hash.substring(1)
      const hashParams = new URLSearchParams(hash)
      const accessToken = hashParams.get('access_token')
      const refreshToken = hashParams.get('refresh_token')
      const type = hashParams.get('type')

      if (accessToken && refreshToken && type === 'recovery') {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        })
        resolved = true
        if (error) {
          setPageError('Ce lien est invalide ou a expiré. Recommencez depuis la page mot de passe oublié.')
          setPageState('error')
        } else {
          setPageState('ready')
          window.history.replaceState(null, '', window.location.pathname)
        }
        return
      }

      // Cas 3 : Session déjà créée par Supabase (verify endpoint avec cookies)
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        resolved = true
        setPageState('ready')
        return
      }

      // Cas 4 : Aucun token, aucune session — attendre 5s pour PASSWORD_RECOVERY event
      setTimeout(() => {
        if (!resolved) {
          setPageError('Lien de réinitialisation manquant ou expiré.')
          setPageState('error')
        }
      }, 5000)
    }

    init()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) {
      setFormError('Les mots de passe ne correspondent pas.')
      return
    }
    setLoading(true)
    setFormError('')

    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setFormError(error.message)
      setLoading(false)
      return
    }

    setPageState('success')
    setTimeout(() => router.push('/dashboard'), 2000)
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-background dot-grid flex items-center justify-center p-6">
      <div className="bg-surface border border-border rounded-2xl shadow-card-md w-full max-w-md overflow-hidden">

        {/* Header */}
        <div className="px-8 pt-8 pb-6 border-b border-border text-center">
          <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center mx-auto mb-4">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <h1 className="font-syne text-[22px] font-extrabold text-text">Nouveau mot de passe</h1>
          <p className="font-syne text-[13px] text-text-muted mt-1">
            {pageState === 'success'
              ? 'Mot de passe mis à jour — redirection...'
              : 'Choisissez un mot de passe sécurisé.'}
          </p>
        </div>

        <div className="px-8 py-8">
          {/* Loading */}
          {pageState === 'loading' && (
            <div className="flex items-center justify-center gap-3 py-4">
              <svg className="animate-spin w-5 h-5 text-accent" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span className="font-syne text-[13px] text-text-muted">Vérification du lien...</span>
            </div>
          )}

          {/* Error — invalid/expired link */}
          {pageState === 'error' && (
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
              </div>
              <p className="font-syne text-[13px] text-text-muted leading-relaxed mb-6">{pageError}</p>
              <Link
                href="/forgot-password"
                className="inline-flex items-center gap-1.5 font-syne text-[13px] font-semibold text-accent hover:text-accent-dark transition-colors"
              >
                Renvoyer un lien →
              </Link>
            </div>
          )}

          {/* Success */}
          {pageState === 'success' && (
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-accent-subtle flex items-center justify-center mx-auto mb-4">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <p className="font-syne text-[14px] text-text font-semibold mb-1">Mot de passe mis à jour !</p>
              <p className="font-syne text-[13px] text-text-muted">Redirection vers votre espace...</p>
            </div>
          )}

          {/* Form */}
          {pageState === 'ready' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {formError && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                  <p className="font-syne text-[13px] text-red-600">{formError}</p>
                </div>
              )}

              <div>
                <label className="block font-syne text-[12px] font-semibold text-text-muted mb-1.5">
                  Nouveau mot de passe
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 8 caractères"
                  required
                  minLength={8}
                  className="w-full bg-background border border-border rounded-lg px-3.5 py-2.5 font-syne text-[14px] text-text placeholder:text-text-subtle transition-all duration-150 focus:border-accent focus:ring-2 focus:ring-accent/10 outline-none"
                />
              </div>

              <div>
                <label className="block font-syne text-[12px] font-semibold text-text-muted mb-1.5">
                  Confirmer le mot de passe
                </label>
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={8}
                  className="w-full bg-background border border-border rounded-lg px-3.5 py-2.5 font-syne text-[14px] text-text placeholder:text-text-subtle transition-all duration-150 focus:border-accent focus:ring-2 focus:ring-accent/10 outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="group relative w-full py-3 bg-accent hover:bg-accent-dark text-white font-syne font-bold text-[14px] rounded-xl transition-all duration-200 overflow-hidden shadow-card mt-2"
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
                    Mise à jour...
                  </span>
                ) : (
                  <span className="relative">Enregistrer →</span>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
