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

      {/* Header — dark gradient */}
      <section
        className="relative overflow-hidden py-20 px-6 text-center"
        style={{ background: 'linear-gradient(135deg, #0C1647 0%, #1E3A8A 55%, #2563EB 100%)' }}
      >
        <div className="absolute inset-0 dot-grid opacity-[0.06] pointer-events-none" />
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] blur-3xl opacity-20 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse, #93C5FD, transparent 70%)' }}
        />
        <div className="relative max-w-3xl mx-auto">
          <p className="font-syne text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-amber mb-4">
            Simple et transparent
          </p>
          <h1
            className="font-fraunces text-white tracking-tight leading-tight mb-4"
            style={{ fontSize: 'clamp(2rem, 4vw, 3rem)' }}
          >
            Une seule offre, claire et honnête.
          </h1>
          <p className="font-syne text-[16px] text-white/65 max-w-lg mx-auto">
            Commencez gratuitement avec 3 analyses. Passez Pro pour analyser sans limite.
          </p>
        </div>
      </section>

      {/* Plans */}
      <section className="py-16 px-6">
        <PricingCards
          success={params.success === 'true'}
          canceled={params.canceled === 'true'}
        />
      </section>

      {/* FAQ */}
      <section className="py-14 px-6 bg-surface border-t border-border">
        <div className="max-w-2xl mx-auto">
          <p className="font-syne text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-amber mb-4 text-center">
            FAQ
          </p>
          <h2 className="font-fraunces text-[28px] text-text text-center mb-10">Questions fréquentes</h2>
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
                q: 'Comment fonctionne l\'abonnement annuel ?',
                a: '1 500€ facturés en une fois pour 12 mois, soit 125€/mois. C\'est l\'équivalent de 10 mois au tarif mensuel — 2 mois offerts.',
              },
              {
                q: 'Puis-je annuler à tout moment ?',
                a: 'Oui. L\'abonnement mensuel est sans engagement : vous pouvez résilier à tout moment depuis votre espace Stripe. L\'annuel prend fin à échéance.',
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
