'use client'

import { useState, useTransition } from 'react'
import { creerSessionCheckout } from './actions'

function Check() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-accent shrink-0 mt-0.5">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function GrayCheck() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-text-subtle shrink-0 mt-0.5">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

export function PricingCards({ success, canceled }: { success: boolean; canceled: boolean }) {
  const [error, setError] = useState<string | null>(null)
  const [loadingPlan, setLoadingPlan] = useState<'mensuel' | 'annuel' | null>(null)
  const [, startTransition] = useTransition()

  const handleSubscribe = (plan: 'mensuel' | 'annuel') => {
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

  return (
    <div className="space-y-6">

      {/* Success / canceled banners */}
      {success && (
        <div className="max-w-3xl mx-auto bg-emerald-50 border border-emerald-200 rounded-xl px-5 py-4">
          <p className="font-syne text-[13px] font-semibold text-emerald-700 text-center">
            Abonnement activé — bienvenue dans le plan Pro !
          </p>
        </div>
      )}
      {canceled && (
        <div className="max-w-3xl mx-auto bg-amber-50 border border-amber-200 rounded-xl px-5 py-4">
          <p className="font-syne text-[13px] text-amber-700 text-center">
            Paiement annulé. Tu peux réessayer quand tu veux.
          </p>
        </div>
      )}
      {error && (
        <div className="max-w-3xl mx-auto bg-red-50 border border-red-200 rounded-xl px-5 py-4">
          <p className="font-syne text-[13px] font-semibold text-red-600 text-center">{error}</p>
        </div>
      )}

      {/* Plans grid */}
      <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Gratuit */}
        <div className="bg-surface border border-border rounded-2xl p-7 flex flex-col">
          <div className="mb-5">
            <h2 className="font-syne text-[18px] font-extrabold text-text">Gratuit</h2>
            <p className="font-syne text-[13px] text-text-muted mt-0.5">Pour découvrir Stratly</p>
          </div>
          <div className="mb-6">
            <div className="flex items-baseline gap-1.5">
              <span className="font-syne text-[40px] font-extrabold text-text leading-none tracking-tight">0€</span>
            </div>
            <p className="font-syne text-[12px] text-text-subtle mt-1">Pour toujours</p>
          </div>
          <ul className="space-y-3 flex-1 mb-7">
            {[
              '3 analyses offertes',
              'Extraction complète du DCE',
              'Dates clés & pièces à fournir',
              'Analyse Go / No-Go basique',
            ].map((f) => (
              <li key={f} className="flex items-start gap-2.5">
                <GrayCheck />
                <span className="font-syne text-[13px] text-text-muted">{f}</span>
              </li>
            ))}
          </ul>
          <div className="w-full py-3 border-2 border-border rounded-xl font-syne font-bold text-[14px] text-center text-text-subtle cursor-default">
            Plan actuel
          </div>
        </div>

        {/* Pro Mensuel */}
        <div className="bg-surface border-2 border-accent rounded-2xl overflow-hidden flex flex-col shadow-card-md ring-4 ring-accent/8">
          <div className="bg-accent px-5 py-2 text-center">
            <p className="font-syne text-[11px] font-bold text-white uppercase tracking-widest">✦ Recommandé</p>
          </div>
          <div className="p-7 flex flex-col flex-1">
            <div className="mb-5">
              <h2 className="font-syne text-[18px] font-extrabold text-text">Pro Mensuel</h2>
              <p className="font-syne text-[13px] text-text-muted mt-0.5">Analyses illimitées</p>
            </div>
            <div className="mb-6">
              <div className="flex items-baseline gap-1.5">
                <span className="font-syne text-[40px] font-extrabold text-text leading-none tracking-tight">150€</span>
                <span className="font-syne text-[13px] text-text-subtle">/mois</span>
              </div>
              <p className="font-syne text-[12px] text-text-subtle mt-1">Sans engagement</p>
            </div>
            <ul className="space-y-3 flex-1 mb-7">
              {[
                'Analyses illimitées',
                'Extraction complète du DCE',
                'Dates clés & pièces à fournir',
                'Analyse Go / No-Go personnalisée',
                'Historique de toutes les analyses',
              ].map((f) => (
                <li key={f} className="flex items-start gap-2.5">
                  <Check />
                  <span className="font-syne text-[13px] text-text-muted">{f}</span>
                </li>
              ))}
            </ul>
            <button
              onClick={() => handleSubscribe('mensuel')}
              disabled={loadingPlan !== null}
              className="group relative w-full py-3 bg-accent hover:bg-accent-dark text-white font-syne font-bold text-[14px] rounded-xl transition-all duration-200 overflow-hidden shadow-card disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span aria-hidden="true" className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/15 to-transparent" />
              <span className="relative">
                {loadingPlan === 'mensuel' ? 'Redirection…' : "S'abonner →"}
              </span>
            </button>
          </div>
        </div>

        {/* Pro Annuel */}
        <div className="bg-surface border border-border rounded-2xl p-7 flex flex-col hover:shadow-card-md hover:border-border-focus/30 transition-all duration-200">
          <div className="mb-5">
            <div className="flex items-center gap-2 mb-0.5">
              <h2 className="font-syne text-[18px] font-extrabold text-text">Pro Annuel</h2>
              <span className="font-syne text-[10px] font-bold bg-accent-subtle text-accent px-2 py-0.5 rounded-full">2 mois offerts</span>
            </div>
            <p className="font-syne text-[13px] text-text-muted">Analyses illimitées</p>
          </div>
          <div className="mb-6">
            <div className="flex items-baseline gap-1.5">
              <span className="font-syne text-[40px] font-extrabold text-text leading-none tracking-tight">1&nbsp;500€</span>
              <span className="font-syne text-[13px] text-text-subtle">/an</span>
            </div>
            <p className="font-syne text-[12px] text-accent font-semibold mt-1">
              125€/mois — économisez 300€/an
            </p>
          </div>
          <ul className="space-y-3 flex-1 mb-7">
            {[
              'Analyses illimitées',
              'Extraction complète du DCE',
              'Dates clés & pièces à fournir',
              'Analyse Go / No-Go personnalisée',
              'Historique de toutes les analyses',
            ].map((f) => (
              <li key={f} className="flex items-start gap-2.5">
                <Check />
                <span className="font-syne text-[13px] text-text-muted">{f}</span>
              </li>
            ))}
          </ul>
          <button
            onClick={() => handleSubscribe('annuel')}
            disabled={loadingPlan !== null}
            className="group relative w-full py-3 border-2 border-border hover:border-accent text-text hover:text-accent font-syne font-bold text-[14px] rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="relative">
              {loadingPlan === 'annuel' ? 'Redirection…' : "S'abonner →"}
            </span>
          </button>
        </div>

      </div>

      {/* Trust badges */}
      <div className="max-w-3xl mx-auto flex flex-wrap items-center justify-center gap-6 pt-2">
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
