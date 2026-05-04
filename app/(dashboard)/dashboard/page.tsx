import Link from 'next/link'

export const metadata = { title: 'Dashboard — Stratly' }

const modules = [
  {
    num: '01',
    href: '/cmo',
    label: 'CMO IA',
    description: 'Générez votre kit marketing B2B complet — posts LinkedIn, emails, scripts et analyse stratégique.',
    features: ['5 posts LinkedIn', 'Séquence d\'emails', 'Script de prospection', 'Analyse stratégique'],
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5" />
        <path d="M11 13l9-9" /><path d="M15 3h6v6" />
      </svg>
    ),
    status: 'Disponible',
  },
  {
    num: '02',
    href: '/growth-b2b',
    label: 'Growth B2B',
    description: 'Construisez votre personal branding et votre plan de contenu LinkedIn et Newsletter.',
    features: ['Plan contenu hebdomadaire', 'Posts expert avec hook', 'Stratégie personal branding', '5 sujets newsletter'],
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" />
      </svg>
    ),
    status: 'Bientôt',
  },
  {
    num: '03',
    href: '/creators',
    label: 'Growth Créateurs',
    description: 'Explosez votre audience sur TikTok, Instagram, YouTube et LinkedIn avec des contenus viraux.',
    features: ['Plan multi-plateforme', 'Hooks viraux', 'Formats & horaires', 'Analyse des tendances'],
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
    status: 'Bientôt',
  },
]

export default function DashboardPage() {
  return (
    <div className="max-w-5xl mx-auto px-8 py-10">

      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-2 h-2 rounded-full bg-accent" />
          <span className="font-syne text-[12px] font-semibold text-accent uppercase tracking-wider">Espace de travail</span>
        </div>
        <h1 className="font-syne text-[32px] font-extrabold text-text leading-tight tracking-tight">
          Bonjour — choisissez votre module.
        </h1>
        <p className="font-syne text-[15px] text-text-muted mt-2">
          Chaque module génère vos livrables marketing en moins d'une minute.
        </p>
      </div>

      {/* Module cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {modules.map((mod) => (
          <div
            key={mod.num}
            className={`bg-surface border border-border rounded-2xl p-6 flex flex-col transition-all duration-200
              ${mod.status === 'Disponible' ? 'hover:shadow-card-md hover:border-accent/30 cursor-pointer' : 'opacity-70'}`}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${mod.status === 'Disponible' ? 'bg-accent-subtle text-accent' : 'bg-background text-text-subtle'}`}>
                {mod.icon}
              </div>
              <div className="flex items-center gap-2">
                <span className="font-syne text-[10px] font-bold text-text-subtle">{mod.num}</span>
                <span className={`font-syne text-[10px] font-semibold px-2 py-0.5 rounded-full
                  ${mod.status === 'Disponible' ? 'bg-accent-subtle text-accent' : 'bg-background text-text-subtle border border-border'}`}>
                  {mod.status}
                </span>
              </div>
            </div>

            {/* Content */}
            <h2 className="font-syne text-[17px] font-bold text-text mb-2">{mod.label}</h2>
            <p className="font-syne text-[13px] text-text-muted leading-relaxed mb-5 flex-1">{mod.description}</p>

            {/* Features */}
            <ul className="space-y-2 mb-6">
              {mod.features.map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={mod.status === 'Disponible' ? '#059669' : '#A1A1AA'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span className="font-syne text-[12px] text-text-muted">{f}</span>
                </li>
              ))}
            </ul>

            {/* CTA */}
            {mod.status === 'Disponible' ? (
              <Link
                href={mod.href}
                className="group relative block w-full py-2.5 bg-accent hover:bg-accent-dark text-white font-syne font-bold text-[13px] text-center rounded-xl transition-all duration-200 overflow-hidden shadow-card"
              >
                <span
                  aria-hidden="true"
                  className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/15 to-transparent"
                />
                <span className="relative">Lancer →</span>
              </Link>
            ) : (
              <div className="w-full py-2.5 bg-background text-text-subtle font-syne font-semibold text-[13px] text-center rounded-xl border border-border">
                Bientôt disponible
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Quick stats bar */}
      <div className="mt-8 grid grid-cols-3 gap-4">
        {[
          { label: 'Générations ce mois', value: '—', suffix: '' },
          { label: 'Livrables créés', value: '—', suffix: '' },
          { label: 'Temps économisé', value: '—', suffix: '' },
        ].map((stat) => (
          <div key={stat.label} className="bg-surface border border-border rounded-xl px-5 py-4">
            <p className="font-syne text-[12px] text-text-subtle mb-1">{stat.label}</p>
            <p className="font-syne text-[22px] font-extrabold text-text">{stat.value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
