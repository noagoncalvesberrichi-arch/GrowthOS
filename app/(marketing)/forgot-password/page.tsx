'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    if (resetError) {
      setError(resetError.message)
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-background dot-grid flex items-center justify-center p-6">
      <div className="bg-surface border border-border rounded-2xl shadow-card-md w-full max-w-md overflow-hidden">

        {/* Header */}
        <div className="px-8 pt-8 pb-6 border-b border-border text-center">
          <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center mx-auto mb-4">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            </svg>
          </div>
          <h1 className="font-syne text-[22px] font-extrabold text-text">Mot de passe oublié</h1>
          <p className="font-syne text-[13px] text-text-muted mt-1">
            {sent
              ? 'Vérifiez votre boîte mail.'
              : 'Entrez votre email pour recevoir un lien de réinitialisation.'}
          </p>
        </div>

        {sent ? (
          <div className="px-8 py-8 text-center">
            <div className="w-12 h-12 rounded-full bg-accent-subtle flex items-center justify-center mx-auto mb-4">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <p className="font-syne text-[14px] text-text font-semibold mb-1">Email envoyé !</p>
            <p className="font-syne text-[13px] text-text-muted leading-relaxed mb-6">
              Un lien de réinitialisation a été envoyé à <span className="font-semibold text-text">{email}</span>. Vérifiez aussi vos spams.
            </p>
            <Link
              href="/login"
              className="font-syne text-[13px] text-accent hover:text-accent-dark font-semibold transition-colors"
            >
              ← Retour à la connexion
            </Link>
          </div>
        ) : (
          <>
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
                    Envoi en cours...
                  </span>
                ) : (
                  <span className="relative">Envoyer le lien →</span>
                )}
              </button>
            </form>

            <div className="px-8 pb-7 text-center">
              <Link
                href="/login"
                className="font-syne text-[13px] text-text-muted hover:text-text transition-colors"
              >
                ← Retour à la connexion
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
