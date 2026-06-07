'use client'

import { useState, useTransition } from 'react'
import { creerSessionCheckout } from './actions'

function Check({ blue }: { blue?: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      className={`${blue ? 'text-accent' : 'text-text-subtle'} shrink-0 mt-0.5`}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

const proFeatures = [
  'Analyses illimitées',
  'Extraction complète du DCE',
  'Dates clés & pièces à fournir',
  'Analyse Go / No-Go personnalisée',
  'Historique de toutes les analyses',
]

const freeFeatures = [
  '3 analyses offertes',
  'Extraction complète du DCE',
  'Dates clés & pièces à fournir',
  'Analyse Go / No-Go basique',
]

export function PricingCards({ success, canceled }: { success: boolean; canceled: boolean }) {
  const [billing, setBilling] = useState<'mensuel' | 'annuel'>('mensuel')
  const [error, setError] = useState<string | null>(null)
  const [loadingPlan, setLoadingPlan] = useState<'mensuel' | 'annuel' | null>(null)
  const [, startTransition] = useTransition()

  const handleSubscribe = () => {
    setError(null)
    setLoadingPlan(billing)
    startTransition(async () => {
      const result = await creerSessionCheckout(billing)
      if ('url' in result) {
        window.location.href = result.url
      } else {
        setError(result.error)
        setLoadingPlan(null)
      }
    })
  }

  return (
    <div className="space-y-6">

      {/* Banners */}
      {success && (
        <div className="max-w-2xl mx-auto bg-emerald-50 border border-emerald-200 rounded-xl px-5 py-4">
          <p className="font-syne text-[13px] font-semibold text-emerald-700 text-center">
            Abonnement activé — bienvenue dans le plan Pro !
          </p>
        </div>
      )}
      {canceled && (
        <div className="max-w-2xl mx-auto bg-amber-50 border border-amber-200 rounded-xl px-5 py-4">
          <p className="font-syne text-[13px] text-amber-700 text-center">
            Paiement annulé. Tu peux réessayer quand tu veux.
          </p>
        </div>
      )}
      {error && (
        <div className="max-w-2xl mx-auto bg-red-50 border border-red-200 rounded-xl px-5 py-4">
          <p className="font-syne text-[13px] font-semibold text-red-600 text-center">{error}</p>
        </div>
      )}

      {/* Cards */}
      <div className="max-w-2xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 items-start">

        {/* Gratuit */}
        <div className="bg-surface border border-border rounded-2xl p-5 md:p-7 flex flex-col">
          <div className="mb-5">
            <h2 className="font-fraunces text-[22px] text-text">Gratuit</h2>
            <p className="font-syne text-[13px] text-text-muted mt-0.5">Pour découvrir Stratly</p>
          </div>
          <div className="mb-6">
            <div className="flex items-baseline gap-1.5">
              <span className="font-fraunces text-[44px] text-text leading-none tracking-tight">0€</span>
            </div>
            <p className="font-syne text-[12px] text-text-subtle mt-1">Pour toujours</p>
          </div>
          <ul className="space-y-3 flex-1 mb-7">
            {freeFeatures.map((f) => (
              <li key={f} className="flex items-start gap-2.5">
                <Check />
                <span className="font-syne text-[13px] text-text-muted">{f}</span>
              </li>
            ))}
          </ul>
          <div className="w-full py-3 border-2 border-border rounded-xl font-syne font-bold text-[14px] text-center text-text-subtle cursor-default">
            Plan actuel
          </div>
        </div>

        {/* Pro */}
        <div className="rounded-2xl overflow-hidden border-2 border-accent shadow-[0_8px_40px_rgba(37,99,235,0.2)] flex flex-col">

          {/* Header sombre avec toggle */}
          <div
            className="px-5 pt-5 pb-5 md:px-7 md:pt-6 md:pb-6"
            style={{ background: 'linear-gradient(135deg, #0F1B4D, #1E3A8A)' }}
          >
            <p className="font-syne text-[10px] font-bold text-white/40 uppercase tracking-widest mb-5">
              ✦ Stratly Pro
            </p>

            <div className="flex items-center gap-3 mb-6">
              <span className={`font-syne text-[13px] font-semibold transition-colors ${billing === 'mensuel' ? 'text-white' : 'text-white/45'}`}>
                Mensuel
              </span>
              <button
                role="switch"
                aria-checked={billing === 'annuel'}
                onClick={() => setBilling(b => b === 'mensuel' ? 'annuel' : 'mensuel')}
                className={`relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0 ${billing === 'annuel' ? 'bg-brand-amber' : 'bg-white/20'}`}
              >
                <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${billing === 'annuel' ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
              <span className={`font-syne text-[13px] font-semibold flex items-center gap-2 transition-colors ${billing === 'annuel' ? 'text-white' : 'text-white/45'}`}>
                Annuel
                <span className="font-syne text-[9px] font-bold bg-brand-amber text-[#1E3A8A] px-1.5 py-0.5 rounded-full">
                  2 mois offerts
                </span>
              </span>
            </div>

            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="font-fraunces text-[40px] md:text-[48px] font-bold text-white leading-none tracking-tight">
                  {billing === 'mensuel' ? '150€' : '125€'}
                </span>
                <span className="font-syne text-[14px] text-white/55">/mois</span>
              </div>
              <p className="font-syne text-[12px] text-white/45 mt-1.5">
                {billing === 'mensuel'
                  ? 'Sans engagement'
                  : '1 500€ facturés annuellement · économisez 300€'}
              </p>
            </div>
          </div>

          {/* Body */}
          <div className="p-5 md:p-7 bg-surface flex flex-col flex-1">
            <ul className="space-y-3 flex-1 mb-7">
              {proFeatures.map((f) => (
                <li key={f} className="flex items-start gap-2.5">
                  <Check blue />
                  <span className="font-syne text-[13px] text-text-muted">{f}</span>
                </li>
              ))}
            </ul>
            <button
              onClick={handleSubscribe}
              disabled={loadingPlan !== null}
              className="group relative w-full py-3.5 bg-accent hover:bg-accent-dark text-white font-syne font-bold text-[14px] rounded-xl transition-all duration-200 overflow-hidden shadow-[0_4px_16px_rgba(37,99,235,0.25)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span aria-hidden="true" className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/15 to-transparent" />
              <span className="relative">
                {loadingPlan !== null ? 'Redirection…' : "S'abonner →"}
              </span>
            </button>
          </div>
        </div>

      </div>

      {/* Trust badges */}
      <div className="max-w-2xl mx-auto flex flex-wrap items-center justify-center gap-4 sm:gap-6 pt-2">
        {[
          { icon: '🔒', text: 'Paiement sécurisé par Stripe' },
          { icon: '↩', text: 'Sans engagement (mensuel)' },
          { icon: '✓', text: 'Annulable à tout moment' },
        ].map((badge) => (
          <div key={badge.text} className="flex items-center gap-2">
            <span className="text-[14px]">{badge.icon}</span>
            <span className="font-syne text-[13px] text-text-muted">{badge.text}</span>
          </div>
        ))}
      </div>

    </div>
  )
}
