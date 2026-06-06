import Link from 'next/link'

export const metadata = {
  title: "Stratly — Analysez vos appels d'offres en quelques minutes",
  description:
    "Stratly analyse automatiquement vos dossiers de consultation, extrait les points clés et vous donne un avis Go/No-Go selon le profil de votre entreprise.",
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function ArrowRight() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  )
}

function IconFile() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  )
}

function IconScan() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2" />
      <rect x="7" y="7" width="10" height="10" rx="1" />
    </svg>
  )
}

function IconThumb() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3H14z" />
      <path d="M7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3" />
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

function IconCheckCircle() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  )
}

function IconZap() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  )
}

function IconLayers() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </svg>
  )
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const steps = [
  {
    num: '01',
    icon: <IconFile />,
    title: "Déposez les documents du DCE",
    sub: "RC, CCTP, CCAP, DPGF… Un ou plusieurs PDFs, Stratly les lit tous en une seule fois.",
  },
  {
    num: '02',
    icon: <IconScan />,
    title: "Stratly analyse et synthétise",
    sub: "L'outil extrait l'objet du marché, les critères de notation, les dates clés, les pièces à fournir et les points de vigilance.",
  },
  {
    num: '03',
    icon: <IconThumb />,
    title: "Recevez votre avis Go / No-Go",
    sub: "Stratly compare les exigences du marché aux capacités de votre entreprise et vous donne une recommandation claire.",
  },
]

const benefits = [
  {
    icon: <IconClock />,
    title: "Des heures récupérées",
    description: "Fini les après-midis à lire des cahiers des charges. Stratly synthétise en quelques minutes ce qui prend des heures.",
  },
  {
    icon: <IconCheckCircle />,
    title: "Zéro pièce oubliée",
    description: "Les pièces administratives et techniques à fournir sont extraites automatiquement. Plus de risque de rejet pour un oubli.",
  },
  {
    icon: <IconZap />,
    title: "Une décision rapide",
    description: "Go ou No-Go ? Stratly croise les exigences du marché avec votre profil d'entreprise pour vous aider à prioriser.",
  },
  {
    icon: <IconLayers />,
    title: "Tout le DCE d'un coup",
    description: "Analysez plusieurs PDFs en une seule fois : le RC, le CCTP et le CCAP ensemble pour une analyse croisée complète.",
  },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <div>

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <section
        className="px-6 pt-24 pb-32"
        style={{ background: 'linear-gradient(to bottom, #ffffff 0%, #ffffff 55%, #ecfdf5 100%)' }}
      >
        <div className="max-w-4xl mx-auto">
          <p className="font-syne text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-amber mb-8">
            Pour les entreprises qui répondent à des appels d&apos;offres
          </p>
          <h1
            className="font-syne font-extrabold text-text tracking-tight leading-[1.04] mb-7"
            style={{ fontSize: 'clamp(2.4rem, 5.5vw, 4rem)' }}
          >
            Analysez un dossier<br className="hidden sm:block" />
            d&apos;appel d&apos;offres en quelques minutes.
          </h1>
          <p className="font-syne text-[17px] md:text-[18px] text-text-muted leading-relaxed max-w-2xl mb-10">
            Déposez vos PDFs. Stratly extrait l&apos;essentiel — objet du marché, critères de
            notation, dates, pièces à fournir, points de vigilance — et vous donne un avis
            Go&nbsp;/&nbsp;No-Go selon le profil de votre entreprise.
          </p>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <Link
              href="/signup"
              className="group relative inline-flex items-center gap-2 font-syne font-bold text-[15px] text-white bg-accent hover:bg-accent-dark px-7 py-3.5 rounded-xl transition-all duration-200 overflow-hidden shadow-card"
            >
              <span
                aria-hidden="true"
                className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none"
              />
              <span className="relative">Essayer gratuitement</span>
              <ArrowRight />
            </Link>
            <Link
              href="/pricing"
              className="font-syne text-[14px] font-semibold text-text-muted hover:text-text transition-colors duration-150"
            >
              Voir les tarifs →
            </Link>
          </div>
          <p className="font-syne text-[12px] text-text-subtle mt-5">
            3 analyses offertes · Sans carte bancaire
          </p>
        </div>
      </section>

      {/* ── Le problème ─────────────────────────────────────────────────────── */}
      <section className="bg-white py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <p className="font-syne text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-amber mb-4">
            Le problème
          </p>
          <h2 className="font-syne text-[30px] md:text-[38px] font-extrabold text-text tracking-tight leading-tight mb-14 max-w-2xl">
            Un dossier d&apos;AO, c&apos;est du temps que vous n&apos;avez pas.
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              {
                num: '01',
                title: 'Des dizaines de pages à éplucher',
                text: "RC, CCTP, CCAP, BPU… Trouver les dates limites, les critères de notation et les pièces à fournir peut prendre plusieurs heures par dossier.",
              },
              {
                num: '02',
                title: 'Un oubli suffit pour être éliminé',
                text: "Une pièce administrative manquante et la candidature est déclarée irrecevable. Le dossier est rejeté sans être lu.",
              },
              {
                num: '03',
                title: 'Difficile de décider vite',
                text: "Sans synthèse rapide, on perd du temps à analyser des marchés pour lesquels on n'a pas le profil — et on en rate d'autres, faute de temps.",
              },
            ].map((item) => (
              <div key={item.num}>
                <p className="font-syne font-extrabold text-[52px] leading-none text-[#E8E8E8] select-none mb-5">
                  {item.num}
                </p>
                <h3 className="font-syne text-[16px] font-bold text-text mb-2 leading-snug">
                  {item.title}
                </h3>
                <p className="font-syne text-[13px] text-text-muted leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Comment ça marche ───────────────────────────────────────────────── */}
      <section className="py-24 px-6" style={{ backgroundColor: '#FAFAFA' }}>
        <div className="max-w-5xl mx-auto">
          <div className="mb-16">
            <p className="font-syne text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-amber mb-4">
              Fonctionnement
            </p>
            <h2 className="font-syne text-[30px] md:text-[38px] font-extrabold text-text tracking-tight leading-tight">
              Trois étapes, c&apos;est tout.
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {steps.map((step) => (
              <div key={step.num}>
                <p className="font-syne font-extrabold text-[60px] leading-none text-[#E8E8E8] select-none tabular-nums">
                  {step.num}
                </p>
                <div className="w-10 h-10 rounded-xl bg-accent-subtle text-accent flex items-center justify-center mt-4 mb-5">
                  {step.icon}
                </div>
                <h3 className="font-syne text-[17px] font-bold text-text mb-2">{step.title}</h3>
                <p className="font-syne text-[13px] text-text-muted leading-relaxed">{step.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Bénéfices ───────────────────────────────────────────────────────── */}
      <section className="bg-white py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="mb-14">
            <p className="font-syne text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-amber mb-4">
              Pourquoi Stratly
            </p>
            <h2 className="font-syne text-[30px] md:text-[38px] font-extrabold text-text tracking-tight leading-tight">
              Ce qu&apos;on vous fait gagner.
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {benefits.map((b) => (
              <div
                key={b.title}
                className="bg-surface border border-[#EBEBEB] rounded-2xl p-7 hover:shadow-[0_4px_24px_rgba(0,0,0,0.07)] hover:border-[#D5D5D5] transition-all duration-300"
              >
                <div className="w-10 h-10 rounded-xl bg-accent-subtle text-accent flex items-center justify-center mb-5">
                  {b.icon}
                </div>
                <h3 className="font-syne text-[15px] font-bold text-text mb-2 leading-snug">{b.title}</h3>
                <p className="font-syne text-[13px] text-text-muted leading-relaxed">{b.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA final ───────────────────────────────────────────────────────── */}
      <section
        className="py-28 px-6"
        style={{ background: 'linear-gradient(160deg, #0F1B4D 0%, #1E3A8A 55%, #2563EB 100%)' }}
      >
        <div className="max-w-4xl mx-auto">
          <p className="font-syne text-[11px] font-semibold uppercase tracking-[0.16em] text-white/40 mb-8">
            Sans engagement
          </p>
          <h2
            className="font-syne font-extrabold text-white tracking-tight leading-[1.04] mb-6 max-w-2xl"
            style={{ fontSize: 'clamp(1.9rem, 4vw, 3.2rem)' }}
          >
            Essayez gratuitement,<br className="hidden sm:block" /> sans engagement.
          </h2>
          <p className="font-syne text-[16px] text-white/65 leading-relaxed max-w-xl mb-10">
            3 analyses complètes offertes dès l&apos;inscription. Aucune carte bancaire requise.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 font-syne font-bold text-[14px] text-[#1E3A8A] bg-white hover:bg-white/92 px-7 py-3.5 rounded-xl transition-colors duration-200 shadow-[0_2px_12px_rgba(0,0,0,0.2)]"
          >
            Démarrer maintenant
            <ArrowRight />
          </Link>
          <p className="font-syne text-[12px] text-white/35 mt-5">
            3 analyses offertes · Sans carte bancaire · Annulable à tout moment
          </p>
        </div>
      </section>

    </div>
  )
}
