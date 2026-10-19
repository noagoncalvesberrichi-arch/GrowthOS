import { PricingCards } from './PricingCards'

export const metadata = { title: 'Tarifs — Stratly' }

export default async function PricingPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; canceled?: string }>
}) {
  const params = await searchParams

  return (
    <div className="bg-background">

      {/* Header — crépuscule gradient */}
      <section
        className="relative overflow-hidden py-14 px-5 sm:px-6 md:py-20 text-center"
        style={{ background: 'linear-gradient(165deg, #0D1220 0%, #160D38 28%, #1B2550 55%, #0F2040 78%, #0A1628 100%)' }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 70% 60% at 50% 70%, rgba(37,99,235,0.09) 0%, transparent 70%)' }}
        />
        <div className="relative max-w-3xl mx-auto">
          <p className="font-syne text-[11px] font-bold uppercase tracking-[0.18em] text-cuivre-glow mb-4">
            Simple et transparent
          </p>
          <h1
            className="font-fraunces text-white tracking-tight leading-tight mb-4"
            style={{ fontSize: 'clamp(2rem, 4vw, 3rem)' }}
          >
            Choisissez votre plan.
          </h1>
          <p className="font-syne text-[16px] text-white/55 max-w-lg mx-auto">
            Commencez gratuitement. Passez à Essentiel ou Pro quand vous êtes prêt.
          </p>
        </div>
      </section>

      {/* Plans */}
      <section className="py-12 px-5 sm:px-6 md:py-16">
        <PricingCards
          success={params.success === 'true'}
          canceled={params.canceled === 'true'}
        />
      </section>

      {/* FAQ */}
      <section className="py-10 px-5 sm:px-6 md:py-14 bg-surface border-t border-border">
        <div className="max-w-2xl mx-auto">
          <p className="font-syne text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-amber mb-4 text-center">
            FAQ
          </p>
          <h2 className="font-fraunces text-[22px] md:text-[28px] text-text text-center mb-8 md:mb-10">Questions fréquentes</h2>
          <div className="space-y-0 divide-y divide-border">
            {[
              {
                q: 'Combien d\'analyses ai-je avec le plan gratuit ?',
                a: '3 analyses complètes, sans limite de temps. Idéal pour tester Stratly sur vos premiers appels d\'offres.',
              },
              {
                q: 'Qu\'est-ce que l\'analyse Go / No-Go ?',
                a: 'Stratly compare automatiquement les exigences du marché (CA requis, certifications, zone géographique…) au profil de votre entreprise et vous donne un verdict clair : GO, NO-GO ou VIGILANCE.',
              },
              {
                q: 'Puis-je analyser plusieurs PDFs en même temps ?',
                a: 'Oui. Vous pouvez déposer l\'ensemble du DCE (RC, CCTP, CCAP, DPGF…) en une seule fois. Stratly croise l\'ensemble des documents pour une analyse complète.',
              },
              {
                q: 'Puis-je annuler à tout moment ?',
                a: 'Oui. L\'abonnement est sans engagement : vous pouvez résilier à tout moment depuis votre espace de facturation Stripe. Votre accès reste actif jusqu\'à la fin de la période en cours.',
              },
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
