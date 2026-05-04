import Link from 'next/link'
import { DarkButton } from '@/components/ui/DarkButton'

export const metadata = {
  title: 'Stratly — Marketing B2B sans friction',
  description: 'La plateforme qui centralise votre stratégie marketing B2B.',
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

// ─── Data ─────────────────────────────────────────────────────────────────────

const modules = [
  {
    num: '01',
    label: 'CMO IA',
    description: 'Votre kit marketing B2B complet — posts LinkedIn, séquence emails, scripts de prospection et analyse stratégique.',
    features: [
      '5 posts LinkedIn prêts à publier',
      "Séquence de 3 emails d'onboarding",
      'Script de prospection téléphonique',
      '3 messages influenceurs & partenaires',
      'Analyse stratégique de la semaine',
    ],
    href: '/cmo',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5" />
        <path d="M11 13l9-9M15 3h6v6" />
      </svg>
    ),
  },
  {
    num: '02',
    label: 'Growth B2B',
    description: "Personal branding LinkedIn et Newsletter — plan de contenu expert, hooks d'accroche et stratégie sectorielle.",
    features: [
      'Plan de contenu hebdomadaire',
      '3 idées de posts expert avec angle',
      'Stratégie personal branding sectorielle',
      '5 sujets de newsletter',
    ],
    href: '/growth-b2b',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
        <polyline points="16 7 22 7 22 13" />
      </svg>
    ),
  },
  {
    num: '03',
    label: 'Growth Créateurs',
    description: 'Hooks viraux, formats optimisés et plan multi-plateforme pour TikTok, Instagram, YouTube et LinkedIn.',
    features: [
      'Plan de contenu multi-plateforme',
      '5 hooks viraux adaptés à votre niche',
      'Meilleurs formats et créneaux de publication',
      'Analyse des comptes en forte croissance',
    ],
    href: '/creators',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
  },
]

const steps = [
  {
    num: '01',
    title: 'Décrivez votre contexte',
    description: 'Nom du produit, cible client, stade de croissance, objectifs. Un formulaire structuré, pas un champ libre.',
  },
  {
    num: '02',
    title: 'Recevez vos livrables',
    description: 'Chaque livrable est personnalisé pour votre produit et votre marché. Structuré, prêt à relire.',
  },
  {
    num: '03',
    title: 'Publiez et mesurez',
    description: "Copiez d'un clic. Publiez sur vos canaux. Régénérez à tout moment si le contexte évolue.",
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
        <div className="max-w-5xl mx-auto">

          {/* Eyebrow */}
          <p className="font-syne text-[11px] font-semibold uppercase tracking-[0.16em] text-text-subtle mb-10">
            Plateforme Marketing B2B
          </p>

          {/* Title */}
          <h1 className="font-syne font-extrabold text-text tracking-tight leading-[1.03] mb-8"
            style={{ fontSize: 'clamp(3rem, 6.5vw, 5.25rem)' }}
          >
            Marketing<br />sans friction.
          </h1>

          {/* Subtitle */}
          <p className="font-syne text-[17px] md:text-[19px] text-text-muted leading-relaxed max-w-xl mb-12">
            La plateforme qui centralise votre stratégie marketing B2B — posts, emails, scripts et analyse — personnalisée pour votre produit et votre marché.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-start gap-3">
            <DarkButton href="/signup">Commencer</DarkButton>
            <Link
              href="/pricing"
              className="inline-flex items-center font-syne font-semibold text-[14px] text-gray-900 border-2 border-gray-900 hover:bg-gray-900 hover:text-white px-6 py-3 rounded-lg transition-all duration-200"
            >
              Voir les tarifs
            </Link>
          </div>

          <p className="font-syne text-[12px] text-text-subtle mt-5">
            Sans engagement · 3 jours d&apos;essai gratuit
          </p>
        </div>
      </section>

      {/* ── Modules ───────────────────────────────────────────────────────── */}
      <section id="modules" className="bg-white py-28 px-6">
        <div className="max-w-6xl mx-auto">

          {/* Section header */}
          <div className="mb-16">
            <p className="font-syne text-[11px] font-semibold uppercase tracking-[0.16em] text-text-subtle mb-4">
              Trois modules
            </p>
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
              <h2 className="font-syne text-[36px] md:text-[42px] font-extrabold text-text tracking-tight leading-tight max-w-md">
                Un outil pour chaque besoin.
              </h2>
              <p className="font-syne text-[14px] text-text-muted max-w-xs leading-relaxed md:text-right">
                Chaque module couvre un cas d&apos;usage précis et produit des livrables prêts à l&apos;emploi.
              </p>
            </div>
          </div>

          {/* Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {modules.map((mod) => (
              <div
                key={mod.num}
                className="relative border border-[#EBEBEB] rounded-2xl p-8 flex flex-col hover:shadow-[0_4px_24px_rgba(0,0,0,0.07)] hover:border-[#D5D5D5] transition-all duration-300 bg-white overflow-hidden group"
              >
                {/* Ghost number */}
                <span className="absolute top-5 right-6 font-syne font-extrabold text-[72px] leading-none text-[#F0F0F0] select-none pointer-events-none tabular-nums group-hover:text-[#E8F5F0] transition-colors duration-300">
                  {mod.num}
                </span>

                {/* Icon */}
                <div className="w-10 h-10 rounded-xl bg-[#F5F5F5] text-[#4A4A4A] flex items-center justify-center mb-6 group-hover:bg-accent-subtle group-hover:text-accent transition-all duration-300">
                  {mod.icon}
                </div>

                {/* Text */}
                <h3 className="font-syne text-[19px] font-extrabold text-text mb-2.5">{mod.label}</h3>
                <p className="font-syne text-[13px] text-text-muted leading-relaxed mb-6 flex-1">{mod.description}</p>

                {/* Separator */}
                <div className="w-full h-px bg-[#F0F0F0] mb-5" />

                {/* Features */}
                <ul className="space-y-2.5 mb-7">
                  {mod.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5">
                      <Check />
                      <span className="font-syne text-[13px] text-text-muted">{f}</span>
                    </li>
                  ))}
                </ul>

                {/* Link */}
                <Link
                  href={mod.href}
                  className="inline-flex items-center gap-1.5 font-syne text-[13px] font-semibold text-accent hover:text-accent-dark transition-colors duration-150"
                >
                  Essayer ce module
                  <ArrowRight />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────────────────── */}
      <section className="py-28 px-6" style={{ backgroundColor: '#FAFAFA' }}>
        <div className="max-w-5xl mx-auto">

          {/* Header */}
          <div className="mb-20">
            <p className="font-syne text-[11px] font-semibold uppercase tracking-[0.16em] text-text-subtle mb-4">
              Fonctionnement
            </p>
            <h2 className="font-syne text-[36px] md:text-[42px] font-extrabold text-text tracking-tight leading-tight">
              Trois étapes, c&apos;est tout.
            </h2>
          </div>

          {/* Steps */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {steps.map((step) => (
              <div key={step.num}>
                {/* Decorative number */}
                <p className="font-syne font-extrabold text-[60px] leading-none text-[#E8E8E8] mb-0 select-none tabular-nums">
                  {step.num}
                </p>
                {/* Accent line */}
                <div className="w-8 h-[2px] bg-accent mt-4 mb-5" />
                <h3 className="font-syne text-[17px] font-bold text-text mb-3">{step.title}</h3>
                <p className="font-syne text-[13px] text-text-muted leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Bientôt disponible (remplace témoignages) ─────────────────────── */}
      <section className="py-28 px-6" style={{ backgroundColor: '#F3F3F3' }}>
        <div className="max-w-5xl mx-auto">

          {/* Header */}
          <div className="mb-16">
            <p className="font-syne text-[11px] font-semibold uppercase tracking-[0.16em] text-text-subtle mb-4">
              Témoignages
            </p>
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
              <h2 className="font-syne text-[36px] md:text-[42px] font-extrabold text-text tracking-tight leading-tight max-w-md">
                Ils témoignent<br />bientôt.
              </h2>
              <p className="font-syne text-[14px] text-text-muted max-w-xs leading-relaxed">
                Stratly est en phase de lancement. Les premiers retours utilisateurs arrivent très prochainement.
              </p>
            </div>
          </div>

          {/* Placeholder cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-12">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="border-2 border-dashed border-[#DCDCDC] rounded-2xl p-8 flex flex-col items-center justify-center min-h-[200px]"
                style={{ animationDelay: `${i * 150}ms` }}
              >
                <div className="w-8 h-px bg-[#D0D0D0] mb-3" />
                <p className="font-syne text-[12px] text-[#C0C0C0] font-medium uppercase tracking-wider">
                  En cours
                </p>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="flex items-center gap-4">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 font-syne font-semibold text-[14px] text-white px-5 py-2.5 rounded-lg transition-colors duration-200"
              style={{ backgroundColor: '#064E3B' }}
            >
              Rejoindre la liste d&apos;attente
              <ArrowRight />
            </Link>
            <p className="font-syne text-[12px] text-text-subtle">
              200+ équipes déjà inscrites
            </p>
          </div>
        </div>
      </section>

      {/* ── CTA final ─────────────────────────────────────────────────────── */}
      <section
        className="py-32 px-6"
        style={{ background: 'linear-gradient(160deg, #022C22 0%, #064E3B 55%, #065F46 100%)' }}
      >
        <div className="max-w-4xl mx-auto">

          {/* Eyebrow */}
          <p className="font-syne text-[11px] font-semibold uppercase tracking-[0.16em] text-white/40 mb-8">
            Prêt à démarrer
          </p>

          {/* Title */}
          <h2
            className="font-syne font-extrabold text-white tracking-tight leading-[1.04] mb-8 max-w-2xl"
            style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)' }}
          >
            Commencez aujourd&apos;hui.
          </h2>

          {/* Subtitle */}
          <p className="font-syne text-[17px] text-white/65 leading-relaxed max-w-lg mb-12">
            Rejoignez les équipes qui ont centralisé leur stratégie marketing B2B sur une seule plateforme.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-start gap-4">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 font-syne font-bold text-[14px] text-[#064E3B] bg-white hover:bg-white/92 px-7 py-3.5 rounded-lg transition-colors duration-200 shadow-[0_2px_12px_rgba(0,0,0,0.2)]"
            >
              Commencer gratuitement
              <ArrowRight />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center font-syne font-semibold text-[14px] text-white/80 hover:text-white border border-white/25 hover:border-white/50 px-7 py-3.5 rounded-lg transition-all duration-200"
            >
              Voir les tarifs
            </Link>
          </div>

          {/* Note */}
          <p className="font-syne text-[12px] text-white/35 mt-7">
            Sans carte bancaire · Sans engagement · Annulable à tout moment
          </p>
        </div>
      </section>

    </div>
  )
}
