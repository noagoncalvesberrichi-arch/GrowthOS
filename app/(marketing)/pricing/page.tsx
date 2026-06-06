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

      {/* Header */}
      <section className="bg-surface border-b border-border py-16 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-accent-subtle border border-accent/20 text-accent text-[12px] font-semibold px-3 py-1.5 rounded-full mb-6 font-syne">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            Simple et transparent
          </div>
          <h1 className="font-syne text-[42px] font-extrabold text-text leading-tight tracking-tight mb-4">
            Choisissez votre plan
          </h1>
          <p className="font-syne text-[16px] text-text-muted">
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
          <h2 className="font-syne text-[26px] font-extrabold text-text text-center mb-10">Questions fréquentes</h2>
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
