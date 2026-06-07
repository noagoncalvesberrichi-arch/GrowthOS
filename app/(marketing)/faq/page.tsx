'use client'

import { useState } from 'react'
import Link from 'next/link'

const faqs = [
  {
    q: "Qu'est-ce que Stratly ?",
    a: "Stratly est un outil d'analyse de dossiers d'appels d'offres (AO). Vous déposez les PDFs du dossier de consultation des entreprises (DCE) et Stratly en extrait l'essentiel : objet du marché, critères de notation, dates clés, pièces à fournir, points de vigilance. L'outil vous donne également un avis Go / No-Go personnalisé, en comparant les exigences du marché au profil de votre entreprise.",
  },
  {
    q: "Comment ça marche ?",
    a: "Déposez un ou plusieurs PDFs (RC, CCTP, CCAP, DPGF…) dans la zone d'upload. Stratly analyse l'ensemble des documents en quelques secondes et vous restitue une synthèse structurée : objet du marché, critères de sélection et de notation, calendrier, liste des pièces à fournir, points de vigilance — et une recommandation Go, No-Go ou Vigilance basée sur votre profil entreprise.",
  },
  {
    q: "Quels documents puis-je analyser ?",
    a: "Tous les documents PDF d'un dossier de consultation des entreprises (DCE) : règlement de la consultation (RC), cahier des clauses techniques particulières (CCTP), cahier des clauses administratives particulières (CCAP), bordereau de prix unitaires (BPU/DQE), décomposition du prix global et forfaitaire (DPGF), acte d'engagement (AE), etc. Vous pouvez déposer plusieurs fichiers en une seule fois pour une analyse croisée complète.",
  },
  {
    q: "Mes données et mes dossiers sont-ils confidentiels ?",
    a: "Vos documents et les résultats d'analyse sont accessibles uniquement via votre compte personnel. Nous n'utilisons pas vos dossiers à d'autres fins que l'analyse demandée. Pour plus de détails sur la façon dont nous traitons vos données, consultez notre politique de confidentialité.",
  },
  {
    q: "C'est payant ?",
    a: "Stratly propose 3 analyses complètes gratuitement, sans limite de temps, pour vous permettre de tester l'outil sur vos premiers appels d'offres. Au-delà, un abonnement Pro (150 €/mois ou 1 500 €/an, soit 2 mois offerts) donne accès à des analyses illimitées.",
  },
  {
    q: "Stratly remplit-il le dossier de candidature à ma place ?",
    a: "Non — Stratly analyse et synthétise le dossier pour vous aider à décider rapidement si vous répondez à un appel d'offres, et à préparer votre candidature en connaissance de cause. La rédaction automatique des pièces de candidature est une fonctionnalité que nous envisageons pour une prochaine version.",
  },
  {
    q: "Faut-il une carte bancaire pour l'essai gratuit ?",
    a: "Non. Vous pouvez créer un compte et utiliser vos 3 analyses gratuites sans renseigner de moyen de paiement. La carte bancaire n'est demandée que si vous souhaitez souscrire à l'abonnement Pro.",
  },
  {
    q: "Puis-je annuler à tout moment ?",
    a: "Oui. L'abonnement mensuel est sans engagement : vous pouvez le résilier à tout moment depuis votre espace de facturation Stripe, et votre accès reste actif jusqu'à la fin de la période en cours. L'abonnement annuel prend fin à l'échéance de la période souscrite.",
  },
]

function FaqItem({ q, a, open, onToggle }: { q: string; a: string; open: boolean; onToggle: () => void }) {
  return (
    <div className="border-b border-border last:border-0">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-4 py-5 text-left"
      >
        <span className="font-syne text-[14px] sm:text-[15px] font-semibold text-text leading-snug">{q}</span>
        <span
          className="shrink-0 w-6 h-6 rounded-full border border-border flex items-center justify-center text-text-muted transition-transform duration-200"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </span>
      </button>
      <div
        className="grid transition-all duration-200 ease-in-out"
        style={{ gridTemplateRows: open ? '1fr' : '0fr' }}
      >
        <div className="overflow-hidden">
          <p className="font-syne text-[13px] sm:text-[14px] text-text-muted leading-relaxed pb-5 max-w-2xl">{a}</p>
        </div>
      </div>
    </div>
  )
}

export default function FaqPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  const toggle = (i: number) => setOpenIndex(openIndex === i ? null : i)

  return (
    <div className="bg-background">

      {/* Header */}
      <section
        className="relative overflow-hidden py-14 px-5 sm:px-6 md:py-20 text-center"
        style={{ background: 'linear-gradient(135deg, #0C1647 0%, #1E3A8A 55%, #2563EB 100%)' }}
      >
        <div className="absolute inset-0 dot-grid opacity-[0.06] pointer-events-none" />
        <div className="relative max-w-3xl mx-auto">
          <p className="font-syne text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-amber mb-4">
            Aide
          </p>
          <h1
            className="font-fraunces text-white tracking-tight leading-tight mb-4"
            style={{ fontSize: 'clamp(1.75rem, 4vw, 3rem)' }}
          >
            Questions fréquentes
          </h1>
          <p className="font-syne text-[15px] sm:text-[16px] text-white/65 max-w-lg mx-auto">
            Tout ce que vous devez savoir sur Stratly.
          </p>
        </div>
      </section>

      {/* Accordion */}
      <section className="py-10 px-5 sm:px-6 md:py-16">
        <div className="max-w-2xl mx-auto">
          {faqs.map((faq, i) => (
            <FaqItem
              key={i}
              q={faq.q}
              a={faq.a}
              open={openIndex === i}
              onToggle={() => toggle(i)}
            />
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-10 px-5 sm:px-6 md:py-14 bg-surface border-t border-border text-center">
        <div className="max-w-md mx-auto">
          <p className="font-fraunces text-[20px] sm:text-[22px] text-text mb-2">Vous avez une autre question ?</p>
          <p className="font-syne text-[13px] sm:text-[14px] text-text-muted mb-6">
            Contactez-nous ou essayez Stratly directement avec vos premiers dossiers.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 font-syne font-bold text-[14px] text-[#1E3A8A] bg-brand-amber hover:bg-brand-amber-dark px-6 py-3 rounded-xl transition-colors duration-200 shadow-[0_4px_16px_rgba(217,119,6,0.25)]"
          >
            Essayer gratuitement →
          </Link>
        </div>
      </section>

    </div>
  )
}
