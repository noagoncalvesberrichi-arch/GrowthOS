import Link from 'next/link'

export const metadata = {
  title: "Stratly — Analysez vos appels d'offres, sachez ce que vos acheteurs paient",
  description:
    "Stratly analyse automatiquement vos DCE, consulte l'historique réel de l'acheteur et vous donne un Go/No-Go selon le profil de votre entreprise BTP. Essayez gratuitement.",
  openGraph: {
    title: "Stratly — Analysez vos appels d'offres, sachez ce que vos acheteurs paient",
    description:
      "Analyse DCE en 2 minutes, historique acheteur DECP, positionnement prix, mémoire technique. La plateforme pour les entreprises BTP qui répondent aux marchés publics.",
    url: 'https://stratly.fr',
    type: 'website' as const,
  },
  twitter: {
    card: 'summary_large_image' as const,
    title: "Stratly — Analysez vos appels d'offres, sachez ce que vos acheteurs paient",
    description:
      "Analyse DCE en 2 minutes, historique acheteur DECP, positionnement prix, mémoire technique.",
  },
}

// ─── Browser frame ────────────────────────────────────────────────────────────

function BrowserFrame({
  src,
  alt,
  maxHeight,
  className = '',
}: {
  src: string
  alt: string
  maxHeight?: number
  className?: string
}) {
  return (
    <div className={`rounded-2xl overflow-hidden ${className}`}>
      <div className="bg-[#E8EAED] px-4 py-2.5 flex items-center gap-3 border-b border-[#CDD0D6] shrink-0">
        <div className="flex gap-1.5 shrink-0">
          <div className="w-3 h-3 rounded-full bg-[#FF5F57]" />
          <div className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
          <div className="w-3 h-3 rounded-full bg-[#28CA41]" />
        </div>
        <div className="flex-1 bg-white/80 rounded-md h-5 flex items-center px-3 overflow-hidden">
          <span className="font-mono text-[10px] text-[#AAA] truncate">app.stratly.fr</span>
        </div>
      </div>
      <div className="overflow-hidden" style={maxHeight ? { maxHeight } : undefined}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} className="w-full block" />
      </div>
    </div>
  )
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

function IconChart() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  )
}

function IconBookOpen() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" />
      <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" />
    </svg>
  )
}

function HistoriqueMockup() {
  return (
    <div className="rounded-2xl overflow-hidden shadow-[0_16px_56px_rgba(0,0,0,0.45)]">
      <div className="bg-[#E8EAED] px-4 py-2.5 flex items-center gap-3 border-b border-[#CDD0D6] shrink-0">
        <div className="flex gap-1.5 shrink-0">
          <div className="w-3 h-3 rounded-full bg-[#FF5F57]" />
          <div className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
          <div className="w-3 h-3 rounded-full bg-[#28CA41]" />
        </div>
        <div className="flex-1 bg-white/80 rounded-md h-5 flex items-center px-3 overflow-hidden">
          <span className="font-mono text-[10px] text-[#AAA] truncate">app.stratly.fr</span>
        </div>
      </div>
      <div className="bg-white p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="font-syne text-[10px] font-semibold uppercase tracking-widest text-[#2563EB] mb-0.5">Historique acheteur</p>
            <p className="font-fraunces text-[15px] text-[#0F1B4D]">Bordeaux Métropole</p>
          </div>
          <div className="text-right">
            <p className="font-syne text-[10px] text-[#6B7280]">42 marchés BTP</p>
            <p className="font-syne text-[10px] text-[#9CA3AF]">Màj il y a 3 j</p>
          </div>
        </div>
        <div className="space-y-0 mb-3 border border-[#F3F4F6] rounded-lg overflow-hidden">
          {[
            { objet: 'Terrassement VRD', montant: '285 000 €', attributaire: 'BTP Atlantique' },
            { objet: 'Réseaux EU/EP', montant: '142 000 €', attributaire: 'Canalisation Sud' },
            { objet: 'Génie civil', montant: '610 000 €', attributaire: 'Gironde TP' },
          ].map((row, i) => (
            <div key={row.objet} className={`flex items-center justify-between px-3 py-2 text-[11px] ${i < 2 ? 'border-b border-[#F3F4F6]' : ''}`}>
              <span className="font-syne text-[#374151] truncate max-w-[110px]">{row.objet}</span>
              <span className="font-syne font-semibold text-[#0F1B4D] shrink-0 mx-2">{row.montant}</span>
              <span className="font-syne text-[#9CA3AF] truncate max-w-[80px] text-right">{row.attributaire}</span>
            </div>
          ))}
        </div>
        <div className="bg-[#F9FAFB] rounded-lg p-3">
          <p className="font-syne text-[10px] text-[#9CA3AF] mb-1.5">Positionnement prix — p25 / médiane / p75</p>
          <div className="flex items-center gap-2">
            <span className="font-syne text-[10px] text-[#6B7280]">130k</span>
            <div className="flex-1 h-2 bg-[#E5E7EB] rounded-full relative">
              <div className="absolute inset-y-0 left-[22%] right-[22%] bg-[#DBEAFE] rounded-full" />
              <div
                className="absolute top-1/2 left-[52%] -translate-y-1/2 w-2.5 h-2.5 bg-[#2563EB] rounded-full"
                style={{ boxShadow: '0 0 0 2px white, 0 0 0 3px #2563EB' }}
              />
            </div>
            <span className="font-syne text-[10px] text-[#6B7280]">620k</span>
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="font-syne text-[9px] text-[#9CA3AF]">p25 : 180k€</span>
            <span className="font-syne text-[9px] font-semibold text-[#2563EB]">médiane : 310k€</span>
            <span className="font-syne text-[9px] text-[#9CA3AF]">p75 : 490k€</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const pillars = [
  {
    num: '01',
    icon: <IconScan />,
    title: "Analyse du DCE en 2 minutes",
    badge: undefined as string | undefined,
    sub: "Déposez les PDFs du dossier. Stratly extrait l'objet du marché, les critères, les délais, les pièces à fournir et les points de vigilance — et compare les exigences au profil de votre entreprise pour un Go/No-Go clair.",
  },
  {
    num: '02',
    icon: <IconChart />,
    title: "Historique & prix de l'acheteur",
    badge: "Nouveau" as string | undefined,
    sub: "Accédez aux attributions réelles de chaque acheteur public : entreprises retenues, montants, lots. Issues des données DECP, plus d'un million de marchés BTP mis à jour chaque semaine. Et la fourchette p25/médiane/p75 pour chiffrer juste.",
  },
  {
    num: '03',
    icon: <IconBookOpen />,
    title: "Mémoire technique sur mesure",
    badge: undefined as string | undefined,
    sub: "Générez une trame structurée sur la grille de notation du DCE, enrichie automatiquement par vos références chantier. Export Word en un clic.",
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
    title: "Acheteurs connus avant de chiffrer",
    description: "Consultez l'historique des attributions de chaque acheteur et la fourchette p25/médiane/p75 pour calibrer votre offre.",
  },
  {
    icon: <IconLayers />,
    title: "Mémoire technique en 2 minutes",
    description: "Générez une trame structurée sur la grille de notation du DCE, nourrie par vos références chantier. Export Word en un clic.",
  },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <div>

      {/* ── HERO ────────────────────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0C1647 0%, #1E3A8A 55%, #2563EB 100%)' }}
      >
        <div className="absolute inset-0 dot-grid opacity-[0.06] pointer-events-none" />
        <div
          className="absolute -top-32 -right-32 w-[640px] h-[640px] rounded-full blur-3xl opacity-25 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #60A5FA, transparent 70%)' }}
        />

        <div className="relative max-w-6xl mx-auto px-5 sm:px-6 pt-10 pb-8 md:pt-16 md:pb-12 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-start">

          {/* Texte */}
          <div className="pt-4 lg:pt-10">
            <p className="font-syne text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-amber mb-5">
              Pour les entreprises qui répondent à des appels d&apos;offres
            </p>
            <h1
              className="font-fraunces text-white tracking-tight leading-[1.08] mb-5"
              style={{ fontSize: 'clamp(1.75rem, 5vw, 3.4rem)' }}
            >
              Analysez vos appels d&apos;offres, sachez ce que vos acheteurs paient
            </h1>
            <p className="font-syne text-[15px] sm:text-[17px] text-white/70 leading-relaxed mb-7 sm:mb-10 max-w-lg">
              Déposez vos PDFs. Stratly analyse le DCE, consulte l&apos;historique réel de
              l&apos;acheteur et vous donne un Go&nbsp;/&nbsp;No-Go selon le profil de votre entreprise.
            </p>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <Link
                href="/signup"
                className="group relative inline-flex items-center gap-2 font-syne font-bold text-[15px] bg-brand-amber hover:bg-brand-amber-dark text-[#1E3A8A] px-7 py-3.5 rounded-xl transition-all duration-200 overflow-hidden shadow-[0_4px_24px_rgba(217,119,6,0.35)]"
              >
                <span
                  aria-hidden="true"
                  className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none"
                />
                <span className="relative">Essayer gratuitement</span>
                <ArrowRight />
              </Link>
              <Link
                href="/pricing"
                className="font-syne text-[14px] font-semibold text-white/55 hover:text-white transition-colors duration-150"
              >
                Voir les tarifs →
              </Link>
            </div>
            <p className="font-syne text-[12px] text-white/30 mt-5">
              3 analyses offertes · Sans carte bancaire
            </p>
          </div>

          {/* Image */}
          <div className="lg:pt-10 lg:pb-0 pb-6 overflow-hidden">
            <BrowserFrame
              src="/screenshots/screenshot-gonogo.png"
              alt="Verdict Go/No-Go — score 85/100 avec détail des critères"
              maxHeight={460}
              className="-rotate-1 shadow-[0_24px_80px_rgba(37,99,235,0.5)]"
            />
          </div>
        </div>
      </section>

      {/* ── LE PROBLÈME ─────────────────────────────────────────────────────── */}
      <section className="py-14 px-5 sm:px-6 md:py-24 overflow-hidden" style={{ backgroundColor: '#EEF2FF' }}>
        <div className="max-w-4xl mx-auto">
          <p className="font-syne text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-amber mb-4">
            Le problème
          </p>
          <h2
            className="font-fraunces text-text tracking-tight leading-tight mb-8 md:mb-14 max-w-2xl"
            style={{ fontSize: 'clamp(1.6rem, 3vw, 2.5rem)' }}
          >
            Un dossier d&apos;AO, c&apos;est du temps que vous n&apos;avez pas.
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-7 mb-10 md:gap-10 md:mb-16">
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
                <p className="font-fraunces font-bold text-[36px] md:text-[48px] leading-none text-accent/15 select-none mb-4">
                  {item.num}
                </p>
                <h3 className="font-syne text-[15px] sm:text-[16px] font-bold text-text mb-2 leading-snug">
                  {item.title}
                </h3>
                <p className="font-syne text-[13px] text-text-muted leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>

          <BrowserFrame
            src="/screenshots/screenshot-vigilance.png"
            alt="Points de vigilance extraits automatiquement du DCE"
            maxHeight={340}
            className="rotate-[0.4deg] shadow-[0_16px_56px_rgba(37,99,235,0.14)]"
          />
          <p className="font-syne text-[11px] text-text-subtle text-center mt-3">
            Exemple de points de vigilance extraits automatiquement
          </p>
        </div>
      </section>

      {/* ── FONCTIONNALITÉS ─────────────────────────────────────────────────── */}
      <section className="py-14 px-5 sm:px-6 md:py-24 overflow-hidden" style={{ backgroundColor: '#0F1B4D' }}>
        <div className="max-w-5xl mx-auto">
          <p className="font-syne text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-amber mb-4">
            Fonctionnalités
          </p>
          <h2
            className="font-fraunces text-white tracking-tight leading-tight mb-10 md:mb-16"
            style={{ fontSize: 'clamp(1.6rem, 3vw, 2.5rem)' }}
          >
            Tout ce qu&apos;il vous faut pour répondre.
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10 md:gap-12 md:mb-16">
            {pillars.map((pillar) => (
              <div key={pillar.num}>
                <p className="font-fraunces font-bold text-[40px] md:text-[56px] leading-none text-white/10 select-none tabular-nums">
                  {pillar.num}
                </p>
                <div className="w-10 h-10 rounded-xl bg-white/10 text-white flex items-center justify-center mt-4 mb-4">
                  {pillar.icon}
                </div>
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <h3 className="font-syne text-[16px] sm:text-[17px] font-bold text-white">{pillar.title}</h3>
                  {pillar.badge && (
                    <span className="font-syne text-[9px] font-bold uppercase tracking-wider text-[#1E3A8A] bg-brand-amber rounded-full px-2 py-0.5">
                      {pillar.badge}
                    </span>
                  )}
                </div>
                <p className="font-syne text-[13px] text-white/55 leading-relaxed">{pillar.sub}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto overflow-hidden">
            <div>
              <BrowserFrame
                src="/screenshots/screenshot-gonogo.png"
                alt="Verdict Go/No-Go — score et critères de sélection"
                className="-rotate-[0.3deg] shadow-[0_16px_56px_rgba(0,0,0,0.45)]"
              />
              <p className="font-syne text-[11px] text-white/30 text-center mt-3">
                Analyse Go/No-Go personnalisée
              </p>
            </div>
            <div>
              <HistoriqueMockup />
              <p className="font-syne text-[11px] text-white/30 text-center mt-3">
                Historique DECP — 1M+ marchés BTP
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── BÉNÉFICES ───────────────────────────────────────────────────────── */}
      <section className="py-14 px-5 sm:px-6 md:py-24 bg-white">
        <div className="max-w-5xl mx-auto">
          <p className="font-syne text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-amber mb-4">
            Pourquoi Stratly
          </p>
          <h2
            className="font-fraunces text-text tracking-tight leading-tight mb-8 md:mb-14"
            style={{ fontSize: 'clamp(1.6rem, 3vw, 2.5rem)' }}
          >
            Ce qu&apos;on vous fait gagner.
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {benefits.map((b) => (
              <div
                key={b.title}
                className="bg-surface border border-[#E8ECFF] rounded-2xl p-5 md:p-7 hover:shadow-[0_8px_32px_rgba(37,99,235,0.1)] hover:border-accent/30 transition-all duration-300"
              >
                <div className="w-10 h-10 rounded-xl bg-accent-subtle text-accent flex items-center justify-center mb-4">
                  {b.icon}
                </div>
                <h3 className="font-syne text-[15px] font-bold text-text mb-2 leading-snug">{b.title}</h3>
                <p className="font-syne text-[13px] text-text-muted leading-relaxed">{b.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ───────────────────────────────────────────────────────── */}
      <section
        className="py-16 px-5 sm:px-6 md:py-28 relative overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #0F1B4D 0%, #1E3A8A 55%, #2563EB 100%)' }}
      >
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] blur-3xl opacity-20 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse, #93C5FD, transparent 70%)' }}
        />
        <div className="relative max-w-4xl mx-auto">
          <p className="font-syne text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-amber mb-5 md:mb-8">
            Sans engagement
          </p>
          <h2
            className="font-fraunces text-white tracking-tight leading-[1.08] mb-4 md:mb-6 max-w-2xl"
            style={{ fontSize: 'clamp(1.75rem, 4vw, 3rem)' }}
          >
            Essayez gratuitement,<br className="hidden sm:block" /> sans engagement.
          </h2>
          <p className="font-syne text-[14px] md:text-[16px] text-white/65 leading-relaxed max-w-xl mb-7 md:mb-10">
            3 analyses complètes offertes dès l&apos;inscription. Aucune carte bancaire requise.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 font-syne font-bold text-[14px] text-[#1E3A8A] bg-white hover:bg-white/92 px-7 py-3.5 rounded-xl transition-colors duration-200 shadow-[0_2px_16px_rgba(0,0,0,0.25)]"
          >
            Démarrer maintenant
            <ArrowRight />
          </Link>
          <p className="font-syne text-[12px] text-white/30 mt-5">
            3 analyses offertes · Sans carte bancaire · Annulable à tout moment
          </p>
        </div>
      </section>

    </div>
  )
}
