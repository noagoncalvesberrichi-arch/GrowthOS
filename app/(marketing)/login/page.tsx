'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => setLoading(false), 1500)
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-background dot-grid flex items-center justify-center p-6">
      <div className="bg-surface border border-border rounded-2xl shadow-card-md w-full max-w-md overflow-hidden">

        {/* Header */}
        <div className="px-8 pt-8 pb-6 border-b border-border text-center">
          <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center mx-auto mb-4">
            <svg width="18" height="18" viewBox="0 0 14 14" fill="none">
              <path d="M2 11L5 5.5L8 8.5L10 5.5L12.5 11" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h1 className="font-syne text-[22px] font-extrabold text-text">Bon retour !</h1>
          <p className="font-syne text-[13px] text-text-muted mt-1">Connectez-vous à votre espace GrowthOS.</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-8 py-7 space-y-4">
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
              className="w-full bg-background border border-border rounded-lg px-3.5 py-2.5 font-syne text-[14px] text-text placeholder:text-text-subtle transition-all duration-150 focus:border-accent focus:ring-2 focus:ring-accent/10"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-syne text-[12px] font-semibold text-text-muted">Mot de passe</label>
              <button type="button" className="font-syne text-[12px] text-accent hover:text-accent-dark transition-colors">
                Oublié ?
              </button>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full bg-background border border-border rounded-lg px-3.5 py-2.5 font-syne text-[14px] text-text placeholder:text-text-subtle transition-all duration-150 focus:border-accent focus:ring-2 focus:ring-accent/10"
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
