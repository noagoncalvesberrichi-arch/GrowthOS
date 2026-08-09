'use client'

import { useState, useTransition } from 'react'
import { creerSessionCheckout } from './actions'

function Check({ accent }: { accent?: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
      strokeLinecap="round" strokeLinejoin="round"
      className={`${accent ? 'text-accent' : 'text-text-subtle'} shrink-0 mt-0.5`}
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function Lock() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" className="text-text-subtle/50 shrink-0 mt-0.5"
    >
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
  )
}

function FeatureRow({ label, locked, accent }: { label: string; locked?: boolean; accent?: boolean }) {
  return (
    <li className="flex items-start gap-2.5">
      {locked ? <Lock /> : <Check accent={accent} />}
      <span className={`font-syne text-[13px] ${locked ? 'text-text-subtle/50' : 'text-text-muted'}`}>
        {label}
      </span>
    </li>
  )
}

type Plan = 'essentiel' | 'pro'

export function PricingCards({ success, canceled }: { success: boolean; canceled: boolean }) {
  const [error, setError] = useState<string | null>(null)
  const [loadingPlan, setLoadingPlan] = useState<Plan | null>(null)
  const [, startTransition] = useTransition()

  const handleSubscribe = (plan: Plan) => {
    setError(null)
    setLoadingPlan(plan)
    startTransition(async () => {
      const result = await creerSessionCheckout(plan)
      if ('url' in result) {
        window.location.href = result.url
      } else {
        setError(result.error)
        setLoadingPlan(null)
      }
    })
  }

  const isLoading = loadingPlan !== null

  return (
    <div className="space-y-8 max-w-5xl mx-auto">

      {/* Banners */}
      {success && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-5 py-4">
          <p className="font-syne text-[13px] font-semibold text-emerald-700 text-center">
            Abonnement activé — bienvenue chez Stratly !
          </p>
        </div>
      )}
      {canceled && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4">
          <p className="font-syne text-[13px] text-amber-700 text-center">
            Paiement annulé. Tu peux réessayer quand tu veux.
          </p>
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-4">
          <p className="font-syne text-[13px] font-semibold text-red-600 text-center">{error}</p>
        </div>
      )}

      {/* Encart fondateurs */}
      <div className="relative overflow-hidden rounded-2xl border-2 border-brand-amber/60 bg-[#FFFBF0] px-5 py-5 sm:px-7 sm:py-6">
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none dot-grid" />
        <div className="relative flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
          <div className="flex-1 min-w-0">
            <div className="inline-flex items-center gap-2 mb-2">
              <span className="font-syne text-[10px] font-bold tracking-[0.18em] uppercase text-brand-amber">
                ✦ Offre fondateurs — 15 places
              </span>
            </div>
            <p className="font-fraunces text-[19px] sm:text-[22px] text-text leading-snug">
              Le plan Pro à <span className="text-brand-amber">190€&nbsp;/mois à vie</span>
            </p>
            <p className="font-syne text-[13px] text-text-muted mt-1 leading-relaxed">
              Toutes les fonctionnalités Pro, tarif bloqué pour toujours. Réservé aux 15 premiers clients.
            </p>
          </div>
          <button
            onClick={() => handleSubscribe('pro')}
            disabled={isLoading}
            className="shrink-0 inline-flex items-center justify-center gap-2 bg-brand-amber hover:bg-[#B45309] text-white font-syne font-bold text-[14px] rounded-xl px-6 py-3 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {loadingPlan === 'pro' ? 'Redirection…' : "Rejoindre les fondateurs →"}
          </button>
        </div>
      </div>

      {/* 3 plan cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">

        {/* Gratuit */}
        <div className="bg-surface border border-border rounded-2xl p-5 flex flex-col">
          <div className="mb-4">
            <h2 className="font-fraunces text-[20px] text-text">Gratuit</h2>
            <p className="font-syne text-[12px] text-text-subtle mt-0.5">Pour découvrir Stratly</p>
          </div>
          <div className="mb-5">
            <span className="font-fraunces text-[38px] text-text leading-none tracking-tight">0€</span>
            <p className="font-syne text-[12px] text-text-subtle mt-1">Pour toujours</p>
          </div>
          <ul className="space-y-2.5 flex-1 mb-6">
            <FeatureRow label="3 analyses au total" />
            <FeatureRow label="Extraction complète du DCE" />
            <FeatureRow label="Dates clés & pièces à fournir" />
            <FeatureRow label="Analyse Go / No-Go" />
            <FeatureRow label="Historique de l'acheteur" locked />
            <FeatureRow label="Positionnement prix" locked />
          </ul>
          <div className="w-full py-3 border border-border rounded-xl font-syne font-bold text-[13px] text-center text-text-subtle cursor-default">
            Plan actuel
          </div>
        </div>

        {/* Essentiel */}
        <div className="bg-surface border-2 border-accent/30 rounded-2xl p-5 flex flex-col">
          <div className="mb-4">
            <h2 className="font-fraunces text-[20px] text-text">Essentiel</h2>
            <p className="font-syne text-[12px] text-text-subtle mt-0.5">Pour répondre en continu</p>
          </div>
          <div className="mb-5">
            <div className="flex items-baseline gap-1">
              <span className="font-fraunces text-[38px] text-text leading-none tracking-tight">190€</span>
              <span className="font-syne text-[13px] text-text-subtle">/mois</span>
            </div>
            <p className="font-syne text-[12px] text-text-subtle mt-1">Sans engagement</p>
          </div>
          <ul className="space-y-2.5 flex-1 mb-6">
            <FeatureRow label="Analyses illimitées" accent />
            <FeatureRow label="Extraction complète du DCE" accent />
            <FeatureRow label="Dates clés & pièces à fournir" accent />
            <FeatureRow label="Analyse Go / No-Go" accent />
            <FeatureRow label="Mémoire technique" accent />
            <FeatureRow label="Veille appels d'offres" accent />
            <FeatureRow label="Historique de l'acheteur" locked />
            <FeatureRow label="Positionnement prix" locked />
          </ul>
          <button
            onClick={() => handleSubscribe('essentiel')}
            disabled={isLoading}
            className="group relative w-full py-3 bg-accent/10 hover:bg-accent/20 text-accent font-syne font-bold text-[13px] rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed border border-accent/30"
          >
            {loadingPlan === 'essentiel' ? 'Redirection…' : "Choisir Essentiel →"}
          </button>
        </div>

        {/* Pro */}
        <div className="rounded-2xl overflow-hidden border-2 border-accent shadow-[0_8px_40px_rgba(37,99,235,0.18)] flex flex-col">
          <div
            className="px-5 pt-5 pb-5"
            style={{ background: 'linear-gradient(135deg, #0F1B4D, #1E3A8A)' }}
          >
            <p className="font-syne text-[10px] font-bold text-white/40 uppercase tracking-widest mb-3">
              ✦ Stratly Pro
            </p>
            <h2 className="font-fraunces text-[20px] text-white mb-1">Pro</h2>
            <p className="font-syne text-[12px] text-white/50 mb-4">Intelligence complète</p>
            <div>
              <div className="flex items-baseline gap-1">
                <span className="font-fraunces text-[38px] font-bold text-white leading-none tracking-tight">390€</span>
                <span className="font-syne text-[13px] text-white/50">/mois</span>
              </div>
              <p className="font-syne text-[12px] text-white/40 mt-1">Sans engagement</p>
            </div>
          </div>

          <div className="p-5 bg-surface flex flex-col flex-1">
            <ul className="space-y-2.5 flex-1 mb-6">
              <FeatureRow label="Tout d'Essentiel" accent />
              <FeatureRow label="Historique de l'acheteur" accent />
              <FeatureRow label="Positionnement prix" accent />
              <FeatureRow label="Chiffrage (bientôt)" accent />
              <FeatureRow label="Support prioritaire" accent />
            </ul>
            <button
              onClick={() => handleSubscribe('pro')}
              disabled={isLoading}
              className="group relative w-full py-3.5 bg-accent hover:bg-accent-dark text-white font-syne font-bold text-[14px] rounded-xl transition-all duration-200 overflow-hidden shadow-[0_4px_16px_rgba(37,99,235,0.25)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span aria-hidden className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/15 to-transparent" />
              <span className="relative">
                {loadingPlan === 'pro' ? 'Redirection…' : "Choisir Pro →"}
              </span>
            </button>
          </div>
        </div>

      </div>

      {/* Trust badges */}
      <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 pt-2">
        {[
          { icon: '🔒', text: 'Paiement sécurisé par Stripe' },
          { icon: '↩', text: 'Sans engagement' },
          { icon: '✓', text: 'Annulable à tout moment' },
        ].map((b) => (
          <div key={b.text} className="flex items-center gap-2">
            <span className="text-[14px]">{b.icon}</span>
            <span className="font-syne text-[13px] text-text-muted">{b.text}</span>
          </div>
        ))}
      </div>

    </div>
  )
}
