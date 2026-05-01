'use client'

import { useState } from 'react'
import Link from 'next/link'

const plans = [
  {
    id: 'starter',
    name: 'Starter',
    monthlyPrice: 29,
    description: 'Pour démarrer avec un module',
    features: [
      '1 module au choix',
      '50 générations / mois',
      'Export texte',
      'Support email',
    ],
    cta: 'Commencer',
    href: '/signup',
    highlighted: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    monthlyPrice: 59,
    description: 'L\'accès complet à la plateforme',
    features: [
      '3 modules inclus',
      'Générations illimitées',
      'Export + historique',
      'Support prioritaire',
      'Mises à jour en avant-première',
    ],
    cta: 'Passer Pro',
    href: '/signup',
    highlighted: true,
  },
  {
    id: 'agency',
    name: 'Agency',
    monthlyPrice: 99,
    description: 'Pour les équipes et agences',
    features: [
      'Tout de Pro',
      'Jusqu\'à 5 comptes clients',
      'Dashboard centralisé',
      'White label partiel',
      'Support dédié',
    ],
    cta: 'Nous contacter',
    href: '/signup',
    highlighted: false,
  },
]

function Check() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-accent shrink-0 mt-0.5">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

export default function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(false)

  const getPrice = (monthly: number) => isAnnual ? Math.round(monthly * 0.8) : monthly
  const getAnnualTotal = (monthly: number) => Math.round(monthly * 0.8 * 12)

  return (
    <div className="bg-background">

      {/* Header */}
      <section className="bg-surface border-b border-border py-16 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-accent-subtle border border-accent/20 text-accent text-[12px] font-semibold px-3 py-1.5 rounded-full mb-6 font-syne">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
            Simple et transparent
          </div>
          <h1 className="font-syne text-[42px] font-extrabold text-text leading-tight tracking-tight mb-4">
            Choisissez votre plan
          </h1>
          <p className="font-syne text-[16px] text-text-muted mb-8">
            Sans engagement. Annulable à tout moment. Essai gratuit 3 jours.
          </p>

          {/* Toggle */}
          <div className="inline-flex bg-background border border-border rounded-xl p-1.5 gap-1">
            <button
              onClick={() => setIsAnnual(false)}
              className={`px-5 py-2 rounded-lg font-syne text-[13px] font-semibold transition-all duration-200
                ${!isAnnual ? 'bg-surface text-text shadow-card' : 'text-text-muted hover:text-text'}`}
            >
              Mensuel
            </button>
            <button
              onClick={() => setIsAnnual(true)}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg font-syne text-[13px] font-semibold transition-all duration-200
                ${isAnnual ? 'bg-surface text-text shadow-card' : 'text-text-muted hover:text-text'}`}
            >
              Annuel
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full transition-colors
                ${isAnnual ? 'bg-accent-subtle text-accent' : 'bg-border text-text-subtle'}`}>
                -20%
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* Plans */}
      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`bg-surface rounded-2xl flex flex-col overflow-hidden transition-all duration-200
                ${plan.highlighted
                  ? 'border-2 border-accent shadow-card-md ring-4 ring-accent/8'
                  : 'border border-border shadow-card hover:shadow-card-md hover:border-border-focus/30'
                }`}
            >
              {/* Badge */}
              {plan.highlighted && (
                <div className="bg-accent px-5 py-2 text-center">
                  <p className="font-syne text-[11px] font-bold text-white uppercase tracking-widest">
                    ✦ Recommandé
                  </p>
                </div>
              )}

              <div className="p-7 flex-1 flex flex-col">
                {/* Plan name */}
                <div className="mb-6">
                  <h2 className="font-syne text-[20px] font-extrabold text-text">{plan.name}</h2>
                  <p className="font-syne text-[13px] text-text-muted mt-0.5">{plan.description}</p>
                </div>

                {/* Price */}
                <div className="mb-6">
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-syne text-[46px] font-extrabold text-text leading-none tracking-tight">
                      {getPrice(plan.monthlyPrice)}€
                    </span>
                    <span className="font-syne text-[13px] text-text-subtle">/mois</span>
                  </div>
                  {isAnnual && (
                    <p className="font-syne text-[12px] text-accent font-semibold mt-1">
                      Soit {getAnnualTotal(plan.monthlyPrice)}€/an — vous économisez {plan.monthlyPrice * 12 - getAnnualTotal(plan.monthlyPrice)}€
                    </p>
                  )}
                  {!isAnnual && (
                    <p className="font-syne text-[12px] text-text-subtle mt-1">
                      ou {Math.round(plan.monthlyPrice * 0.8)}€/mois en annuel
                    </p>
                  )}
                </div>

                {/* Features */}
                <ul className="space-y-3 flex-1 mb-7">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5">
                      <Check />
                      <span className="font-syne text-[13px] text-text-muted">{f}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <Link
                  href={plan.href}
                  className={`group relative block w-full py-3 font-syne font-bold text-[14px] text-center rounded-xl transition-all duration-200 overflow-hidden
                    ${plan.highlighted
                      ? 'bg-accent hover:bg-accent-dark text-white shadow-card'
                      : 'border-2 border-border hover:border-accent text-text hover:text-accent'
                    }`}
                >
                  {plan.highlighted && (
                    <span
                      aria-hidden="true"
                      className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/15 to-transparent"
                    />
                  )}
                  <span className="relative">{plan.cta} →</span>
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Trust badges */}
        <div className="max-w-5xl mx-auto mt-10 flex flex-wrap items-center justify-center gap-6">
          {[
            { icon: '🔒', text: 'Paiement sécurisé par Stripe' },
            { icon: '↩', text: 'Sans engagement' },
            { icon: '✓', text: 'Annulable à tout moment' },
            { icon: '🎯', text: '3 jours d\'essai gratuit' },
          ].map((badge) => (
            <div key={badge.text} className="flex items-center gap-2">
              <span className="text-[14px]">{badge.icon}</span>
              <span className="font-syne text-[13px] text-text-muted">{badge.text}</span>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="py-14 px-6 bg-surface border-t border-border">
        <div className="max-w-2xl mx-auto">
          <h2 className="font-syne text-[26px] font-extrabold text-text text-center mb-10">Questions fréquentes</h2>
          <div className="space-y-0 divide-y divide-border">
            {[
              { q: 'Puis-je changer de plan à tout moment ?', a: 'Oui, vous pouvez upgrader ou downgrader votre plan à tout moment depuis votre espace client. Le changement est effectif immédiatement.' },
              { q: 'Les générations sont-elles limitées ?', a: 'Le plan Starter inclut 50 générations par mois. Les plans Pro et Agency sont illimités.' },
              { q: 'Que se passe-t-il à la fin de l\'essai gratuit ?', a: 'À la fin des 3 jours d\'essai, votre compte passe automatiquement en plan gratuit limité, sans frais. Vous pouvez upgrader quand vous le souhaitez.' },
              { q: 'Le contenu généré est-il vraiment personnalisé ?', a: 'Oui. Claude AI génère du contenu entièrement personnalisé en fonction de votre produit, votre cible et vos objectifs. Aucun contenu générique.' },
            ].map((faq) => (
              <div key={faq.q} className="py-5">
                <p className="font-syne text-[15px] font-semibold text-text mb-2">{faq.q}</p>
                <p className="font-syne text-[13px] text-text-muted leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
