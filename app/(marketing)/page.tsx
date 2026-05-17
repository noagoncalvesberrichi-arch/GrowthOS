import Link from 'next/link'
import { DarkButton } from '@/components/ui/DarkButton'

export const metadata = {
  title: 'Stratly — De 20 à 100 avis Google en 6 mois',
  description: 'Stratly envoie automatiquement à chaque patient un SMS post-séance pour collecter son avis Google. Pour kinésithérapeutes libéraux français.',
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function Check() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-[2px]">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function ArrowRight() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  )
}

function IconGoogle() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8v4l3 3" />
      <path d="M17 12h-5" />
    </svg>
  )
}

function IconPerson() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M19 8v6M22 11h-6" />
    </svg>
  )
}

function IconSMS() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
    </svg>
  )
}

function IconPlug() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22v-4M12 6V2M8 6v4a4 4 0 008 0V6M4 6h16" />
    </svg>
  )
}

function IconShield() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  )
}

function IconEdit() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  )
}

function IconClock() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  )
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const steps = [
  {
    num: '01',
    icon: <IconGoogle />,
    title: 'Tu connectes ta fiche Google Business',
    sub: 'En 30 secondes via OAuth',
  },
  {
    num: '02',
    icon: <IconPerson />,
    title: 'Tu ajoutes tes patients du jour',
    sub: 'Manuellement ou via QR code en salle d\'attente',
  },
  {
    num: '03',
    icon: <IconSMS />,
    title: 'Stratly envoie le SMS au bon moment',
    sub: 'Routing intelligent : 4-5★ → Google, 1-3★ → email privé',
  },
]

const features = [
  {
    icon: <IconPlug />,
    title: 'Pas besoin de Doctolib API',
    description: 'Fonctionne avec tous les logiciels métiers',
  },
  {
    icon: <IconShield />,
    title: 'Conforme RGPD santé',
    description: 'Hébergement EU, données chiffrées',
  },
  {
    icon: <IconEdit />,
    title: 'SMS personnalisable',
    description: 'Au nom de ton cabinet, ton ton',
  },
  {
    icon: <IconClock />,
    title: 'Démarrage en 5 minutes',
    description: 'Installation guidée, aucune compétence technique',
  },
]

const plans = [
  {
    name: 'Starter',
    price: 29,
    description: 'Pour démarrer',
    features: ['1 praticien', 'SMS illimités', 'Dashboard avis', 'Alertes email'],
    highlighted: false,
    cta: 'Essayer gratuitement',
  },
  {
    name: 'Pro',
    price: 59,
    description: 'Le plus populaire',
    features: [
      'Jusqu\'à 3 praticiens',
      'Alertes avis négatifs en temps réel',
      'Multi-utilisateurs',
      'Support prioritaire',
    ],
    highlighted: true,
    cta: 'Essayer gratuitement',
  },
  {
    name: 'Multi-cabinet',
    price: 149,
    description: 'Pour les groupes',
    features: [
      'Praticiens illimités',
      'Multi-sites',
      'API',
      'Reporting consolidé',
      'Account manager dédié',
    ],
    highlighted: false,
    cta: 'Nous contacter',
  },
]

const faqs = [
  {
    q: "C'est légal de filtrer les avis avant Google ?",
    a: "Oui. On ne supprime aucun avis. On propose simplement au patient déçu de te contacter en privé pour t'expliquer ce qui n'a pas été. Le patient reste libre de poster son avis sur Google s'il le souhaite. Cette pratique est conforme aux CGU de Google.",
  },
  {
    q: 'Combien de temps pour configurer Stratly ?',
    a: "5 minutes en moyenne. Tu connectes ta fiche Google Business, tu importes ta liste de patients du jour, c'est prêt.",
  },
  {
    q: "Et si un patient n'a pas de portable ?",
    a: "Tu peux utiliser le QR code en salle d'attente ou l'option email. Le formulaire s'adapte automatiquement.",
  },
  {
    q: 'Stratly est affilié à Doctolib ?',
    a: "Non, Stratly est un outil indépendant. On fonctionne en complément de Doctolib sans avoir besoin d'intégration.",
  },
  {
    q: 'Quels sont les SMS envoyés ?',
    a: "Texte personnalisable au nom de ton cabinet. Exemple : 'Bonjour [Prénom], merci de votre visite chez [Cabinet]. Si vous avez 30 secondes, votre avis nous aide énormément : [lien]. Belle journée.'",
  },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <div>

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section
        className="px-6 pt-28 pb-36"
        style={{ background: 'linear-gradient(to bottom, #ffffff 0%, #ffffff 60%, #ecfdf5 100%)' }}
      >
        <div className="max-w-4xl mx-auto">
          <p className="font-syne text-[11px] font-semibold uppercase tracking-[0.16em] text-text-subtle mb-10">
            Pour kinésithérapeutes libéraux
          </p>

          <h1
            className="font-syne font-extrabold text-text tracking-tight leading-[1.03] mb-8"
            style={{ fontSize: 'clamp(2.8rem, 6vw, 4.75rem)' }}
          >
            De 20 à 100 avis Google<br />en 6 mois.
          </h1>

          <p className="font-syne text-[17px] md:text-[19px] text-text-muted leading-relaxed max-w-2xl mb-12">
            Stratly envoie automatiquement à chaque patient un SMS post-séance pour collecter son avis. Les satisfaits postent sur Google. Les insatisfaits t&apos;arrivent en privé.
          </p>

          <div className="flex flex-col sm:flex-row items-start gap-3">
            <DarkButton href="/signup">Essayer 14 jours gratuits</DarkButton>
            <Link
              href="/pricing"
              className="inline-flex items-center font-syne font-semibold text-[14px] text-gray-900 border-2 border-gray-900 hover:bg-gray-900 hover:text-white px-6 py-3 rounded-lg transition-all duration-200"
            >
              Voir les tarifs
            </Link>
          </div>

          <p className="font-syne text-[12px] text-text-subtle mt-5">
            Sans carte bancaire · Annulation en 1 clic
          </p>
        </div>
      </section>

      {/* ── Le problème ───────────────────────────────────────────────────── */}
      <section className="bg-white py-28 px-6">
        <div className="max-w-4xl mx-auto">
          <p className="font-syne text-[11px] font-semibold uppercase tracking-[0.16em] text-text-subtle mb-4">
            Le problème
          </p>
          <h2 className="font-syne text-[32px] md:text-[40px] font-extrabold text-text tracking-tight leading-tight mb-8 max-w-2xl">
            Le cabinet d&apos;à côté te passe devant sur Google Maps
          </h2>
          <p className="font-syne text-[16px] text-text-muted leading-relaxed max-w-2xl">
            Tu vois 30 patients par semaine. Combien laissent un avis Google ? 1&nbsp;? 2&nbsp;? Pendant ce temps, le cabinet d&apos;à côté en collecte 15 par mois — et ressort en premier dans les recherches &laquo;&nbsp;kiné [ta ville]&nbsp;&raquo;.
          </p>
        </div>
      </section>

      {/* ── Comment ça marche ─────────────────────────────────────────────── */}
      <section className="py-28 px-6" style={{ backgroundColor: '#FAFAFA' }}>
        <div className="max-w-5xl mx-auto">
          <div className="mb-20">
            <p className="font-syne text-[11px] font-semibold uppercase tracking-[0.16em] text-text-subtle mb-4">
              Fonctionnement
            </p>
            <h2 className="font-syne text-[32px] md:text-[40px] font-extrabold text-text tracking-tight leading-tight">
              Trois étapes, c&apos;est tout.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {steps.map((step) => (
              <div key={step.num}>
                <p className="font-syne font-extrabold text-[60px] leading-none text-[#E8E8E8] select-none tabular-nums mb-0">
                  {step.num}
                </p>
                <div className="w-10 h-10 rounded-xl bg-[#F5F5F5] text-[#4A4A4A] flex items-center justify-center mt-4 mb-5">
                  {step.icon}
                </div>
                <h3 className="font-syne text-[17px] font-bold text-text mb-2">{step.title}</h3>
                <p className="font-syne text-[13px] text-text-muted leading-relaxed">{step.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ROI ───────────────────────────────────────────────────────────── */}
      <section className="bg-white py-28 px-6">
        <div className="max-w-4xl mx-auto">
          <p className="font-syne text-[11px] font-semibold uppercase tracking-[0.16em] text-text-subtle mb-4">
            Résultats
          </p>
          <h2 className="font-syne text-[32px] md:text-[40px] font-extrabold text-text tracking-tight leading-tight mb-12">
            Le calcul est simple
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
            {/* Sans Stratly */}
            <div className="border border-[#EBEBEB] rounded-2xl p-8">
              <p className="font-syne text-[11px] font-semibold uppercase tracking-[0.12em] text-text-subtle mb-5">
                Sans Stratly
              </p>
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <span className="font-syne text-[13px] text-text-muted leading-relaxed">30 patients/semaine × 1% laissent un avis</span>
                </div>
                <div className="w-full h-px bg-[#F0F0F0]" />
                <p className="font-syne text-[13px] text-text-muted">= 1 avis / semaine</p>
                <div className="w-full h-px bg-[#F0F0F0]" />
                <p className="font-syne text-[22px] font-extrabold text-text tracking-tight">~12 avis sur 3 mois</p>
              </div>
            </div>

            {/* Avec Stratly */}
            <div className="border-2 border-accent rounded-2xl p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-accent text-white font-syne text-[11px] font-bold uppercase tracking-wider px-4 py-1.5 rounded-bl-xl">
                Avec Stratly
              </div>
              <p className="font-syne text-[11px] font-semibold uppercase tracking-[0.12em] text-accent mb-5 mt-2">
                Avec Stratly
              </p>
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <span className="font-syne text-[13px] text-text-muted leading-relaxed">30 patients/semaine × 12% laissent un avis</span>
                </div>
                <div className="w-full h-px bg-[#E8F5F0]" />
                <p className="font-syne text-[13px] text-text-muted">= 3-4 avis / semaine</p>
                <div className="w-full h-px bg-[#E8F5F0]" />
                <p className="font-syne text-[22px] font-extrabold text-accent tracking-tight">~50 avis sur 3 mois</p>
              </div>
            </div>
          </div>

          <p className="font-syne text-[14px] text-text-muted leading-relaxed max-w-2xl">
            Plus d&apos;avis → tu remontes sur Google Maps → tu captes les nouveaux patients qui cherchent un kiné dans ta ville.
          </p>
        </div>
      </section>

      {/* ── Conçu pour les kinés ──────────────────────────────────────────── */}
      <section className="py-28 px-6" style={{ backgroundColor: '#FAFAFA' }}>
        <div className="max-w-5xl mx-auto">
          <div className="mb-16">
            <p className="font-syne text-[11px] font-semibold uppercase tracking-[0.16em] text-text-subtle mb-4">
              Conçu pour les kinés
            </p>
            <h2 className="font-syne text-[32px] md:text-[40px] font-extrabold text-text tracking-tight leading-tight">
              Pensé pour ton quotidien.
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
            {features.map((f) => (
              <div
                key={f.title}
                className="bg-white border border-[#EBEBEB] rounded-2xl p-7 hover:shadow-[0_4px_24px_rgba(0,0,0,0.07)] hover:border-[#D5D5D5] transition-all duration-300"
              >
                <div className="w-10 h-10 rounded-xl bg-[#F5F5F5] text-[#4A4A4A] flex items-center justify-center mb-5">
                  {f.icon}
                </div>
                <h3 className="font-syne text-[15px] font-bold text-text mb-2 leading-snug">{f.title}</h3>
                <p className="font-syne text-[13px] text-text-muted leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ───────────────────────────────────────────────────────── */}
      <section className="bg-white py-28 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="mb-16 text-center">
            <p className="font-syne text-[11px] font-semibold uppercase tracking-[0.16em] text-text-subtle mb-4">
              Tarifs
            </p>
            <h2 className="font-syne text-[32px] md:text-[40px] font-extrabold text-text tracking-tight leading-tight mb-3">
              Simple et transparent.
            </h2>
            <p className="font-syne text-[14px] text-text-muted">
              Annuel -20% disponible. 14 jours gratuits sur tous les plans.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`bg-surface rounded-2xl flex flex-col overflow-hidden transition-all duration-200
                  ${plan.highlighted
                    ? 'border-2 border-accent shadow-card-md ring-4 ring-accent/8'
                    : 'border border-border shadow-card hover:shadow-card-md'
                  }`}
              >
                {plan.highlighted && (
                  <div className="bg-accent px-5 py-2 text-center">
                    <p className="font-syne text-[11px] font-bold text-white uppercase tracking-widest">
                      Populaire
                    </p>
                  </div>
                )}

                <div className="p-7 flex-1 flex flex-col">
                  <div className="mb-6">
                    <h3 className="font-syne text-[20px] font-extrabold text-text">{plan.name}</h3>
                    <p className="font-syne text-[13px] text-text-muted mt-0.5">{plan.description}</p>
                  </div>

                  <div className="mb-6">
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-syne text-[46px] font-extrabold text-text leading-none tracking-tight">
                        {plan.price}€
                      </span>
                      <span className="font-syne text-[13px] text-text-subtle">/mois</span>
                    </div>
                  </div>

                  <ul className="space-y-3 flex-1 mb-7">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5">
                        <Check />
                        <span className="font-syne text-[13px] text-text-muted">{f}</span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    href="/signup"
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
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────────────────── */}
      <section className="py-28 px-6" style={{ backgroundColor: '#FAFAFA' }}>
        <div className="max-w-2xl mx-auto">
          <div className="mb-12 text-center">
            <p className="font-syne text-[11px] font-semibold uppercase tracking-[0.16em] text-text-subtle mb-4">
              FAQ
            </p>
            <h2 className="font-syne text-[32px] font-extrabold text-text tracking-tight leading-tight">
              Questions fréquentes
            </h2>
          </div>

          <div className="space-y-0 divide-y divide-border">
            {faqs.map((faq) => (
              <details key={faq.q} className="group py-1">
                <summary className="flex items-center justify-between gap-4 py-5 cursor-pointer list-none">
                  <span className="font-syne text-[15px] font-semibold text-text">{faq.q}</span>
                  <svg
                    width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                    strokeLinecap="round" strokeLinejoin="round"
                    className="shrink-0 text-text-subtle transition-transform duration-200 group-open:rotate-45"
                  >
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </summary>
                <p className="font-syne text-[14px] text-text-muted leading-relaxed pb-5">
                  {faq.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA final ─────────────────────────────────────────────────────── */}
      <section
        className="py-32 px-6"
        style={{ background: 'linear-gradient(160deg, #022C22 0%, #064E3B 55%, #065F46 100%)' }}
      >
        <div className="max-w-4xl mx-auto">
          <p className="font-syne text-[11px] font-semibold uppercase tracking-[0.16em] text-white/40 mb-8">
            Sans engagement
          </p>

          <h2
            className="font-syne font-extrabold text-white tracking-tight leading-[1.04] mb-6 max-w-2xl"
            style={{ fontSize: 'clamp(2rem, 4.5vw, 3.5rem)' }}
          >
            Essaie Stratly 14 jours sans engagement.
          </h2>

          <p className="font-syne text-[17px] text-white/65 leading-relaxed max-w-xl mb-12">
            Si tu n&apos;as pas 5 avis Google supplémentaires en 30 jours, on te rembourse.
          </p>

          <Link
            href="/signup"
            className="inline-flex items-center gap-2 font-syne font-bold text-[14px] text-[#064E3B] bg-white hover:bg-white/92 px-7 py-3.5 rounded-lg transition-colors duration-200 shadow-[0_2px_12px_rgba(0,0,0,0.2)]"
          >
            Démarrer maintenant
            <ArrowRight />
          </Link>

          <p className="font-syne text-[12px] text-white/35 mt-6">
            Sans carte bancaire · Annulation en 1 clic
          </p>
        </div>
      </section>

    </div>
  )
}
