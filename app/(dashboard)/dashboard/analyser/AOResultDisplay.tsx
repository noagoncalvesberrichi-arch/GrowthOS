import Link from 'next/link'
import type { AOResult, AOMetadata, GoNoGo, GoNoGoCritere } from './actions'

// ─── Go/No-Go ─────────────────────────────────────────────────────────────────

const VERDICT_CONFIG = {
  GO: {
    border: 'border-emerald-200',
    headerBg: 'bg-emerald-50',
    bodyBg: 'bg-emerald-50/60',
    verdictText: 'text-emerald-700',
    bodyText: 'text-emerald-800',
    scoreBadge: 'bg-emerald-100 text-emerald-700',
    divider: 'border-emerald-200',
    label: 'GO',
  },
  NO_GO: {
    border: 'border-red-200',
    headerBg: 'bg-red-50',
    bodyBg: 'bg-red-50/60',
    verdictText: 'text-red-700',
    bodyText: 'text-red-800',
    scoreBadge: 'bg-red-100 text-red-700',
    divider: 'border-red-200',
    label: 'NO-GO',
  },
  VIGILANCE: {
    border: 'border-amber-200',
    headerBg: 'bg-amber-50',
    bodyBg: 'bg-amber-50/60',
    verdictText: 'text-amber-700',
    bodyText: 'text-amber-800',
    scoreBadge: 'bg-amber-100 text-amber-700',
    divider: 'border-amber-200',
    label: 'VIGILANCE',
  },
} as const

function StatutIcon({ statut }: { statut: GoNoGoCritere['statut'] }) {
  if (statut === 'ok') {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    )
  }
  if (statut === 'manquant') {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    )
  }
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  )
}

const statutValueColor: Record<GoNoGoCritere['statut'], string> = {
  ok: 'text-emerald-600',
  manquant: 'text-red-600',
  incertain: 'text-amber-600',
}

function GoNoGoPanel({ gng }: { gng: GoNoGo | null }) {
  if (!gng) {
    return (
      <div className="flex items-center justify-between gap-4 bg-surface border border-border rounded-xl px-5 py-4">
        <div className="min-w-0">
          <p className="font-syne text-[13px] font-semibold text-text leading-snug">
            Analyse Go&nbsp;/&nbsp;No-Go indisponible
          </p>
          <p className="font-syne text-[12px] text-text-muted mt-0.5">
            Renseignez votre profil entreprise pour obtenir une recommandation personnalisée.
          </p>
        </div>
        <Link
          href="/dashboard/mon-entreprise"
          className="shrink-0 font-syne text-[12px] font-semibold text-accent hover:text-accent-dark transition-colors duration-150 whitespace-nowrap"
        >
          Compléter →
        </Link>
      </div>
    )
  }

  const cfg = VERDICT_CONFIG[gng.verdict]

  return (
    <div className={`rounded-xl overflow-hidden border ${cfg.border}`}>
      {/* Header */}
      <div className={`${cfg.headerBg} px-5 py-3.5 flex items-center gap-3 border-b ${cfg.border}`}>
        <span className={`font-syne text-[14px] font-extrabold uppercase tracking-wide ${cfg.verdictText}`}>
          {cfg.label}
        </span>
        <span className={`font-syne text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${cfg.scoreBadge}`}>
          Éligibilité&nbsp;: {gng.score_eligibilite}/100
        </span>
      </div>

      {/* Synthesis */}
      <div className={`${cfg.bodyBg} px-5 py-4 border-b ${cfg.border}`}>
        <p className={`font-syne text-[13px] leading-relaxed ${cfg.bodyText}`}>{gng.synthese}</p>
      </div>

      {/* Criteria */}
      {gng.criteres.length > 0 && (
        <div className={`${cfg.bodyBg} px-5 py-4`}>
          <div className="space-y-0">
            {gng.criteres.map((c) => (
              <div key={c.critere} className={`flex items-start gap-3 py-2.5 border-b ${cfg.divider}/50 last:border-0`}>
                <StatutIcon statut={c.statut} />
                <div className="flex-1 min-w-0">
                  <p className="font-syne text-[12px] font-semibold text-text leading-snug">{c.critere}</p>
                  <div className="flex flex-wrap gap-x-4 mt-0.5">
                    <span className="font-syne text-[11px] text-text-subtle">
                      Exigé&nbsp;: <span className="font-semibold text-text-muted">{c.exigence_marche}</span>
                    </span>
                    <span className="font-syne text-[11px] text-text-subtle">
                      Vous&nbsp;: <span className={`font-semibold ${statutValueColor[c.statut]}`}>{c.situation_entreprise}</span>
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <div className="bg-background px-5 py-3 border-b border-border">
        <p className="font-syne text-[12px] font-bold text-text-muted uppercase tracking-wider">{title}</p>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  )
}

// ─── Main display ─────────────────────────────────────────────────────────────

export function AOResultDisplay({ data, meta }: { data: AOResult; meta: AOMetadata }) {
  return (
    <div className="space-y-4 mt-8">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-2 h-2 rounded-full bg-accent" />
        <p className="font-syne text-[12px] font-bold text-accent uppercase tracking-wider">Analyse terminée</p>
      </div>

      {/* Fichiers illisibles */}
      {meta.fichiers_illisibles.length > 0 && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <span className="text-red-500 text-[15px] shrink-0 mt-0.5">⚠️</span>
          <p className="font-syne text-[13px] text-red-800 leading-relaxed">
            <span className="font-semibold">
              {meta.fichiers_illisibles.length === 1 ? '1 fichier illisible' : `${meta.fichiers_illisibles.length} fichiers illisibles`}
            </span>
            {' '}— {meta.fichiers_illisibles.join(', ')} (scan image sans texte sélectionnable, non inclus dans l&apos;analyse).
          </p>
        </div>
      )}

      {/* Troncature */}
      {meta.tronque && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <span className="text-amber-500 text-[15px] shrink-0 mt-0.5">⚠️</span>
          <p className="font-syne text-[13px] text-amber-800 leading-relaxed">
            <span className="font-semibold">Dossier volumineux</span>
            {meta.chars_traites > 0 && (
              <> — l&apos;analyse porte sur les premières sections ({Math.round(meta.chars_traites / 1000)}k/{Math.round(meta.chars_total / 1000)}k caractères)</>
            )}
            . Certaines informations en fin de dossier peuvent ne pas être prises en compte.
          </p>
        </div>
      )}

      {/* Go/No-Go */}
      <GoNoGoPanel gng={data.go_no_go} />

      {/* Objet + meta */}
      <Section title="Marché">
        <p className="font-syne text-[15px] font-bold text-text mb-3">{data.objet}</p>
        <div className="flex flex-wrap gap-3">
          <span className="font-syne text-[12px] bg-background border border-border rounded-lg px-3 py-1.5 text-text-muted">
            <span className="font-semibold text-text">Procédure : </span>{data.type_procedure}
          </span>
          <span className="font-syne text-[12px] bg-background border border-border rounded-lg px-3 py-1.5 text-text-muted">
            <span className="font-semibold text-text">Acheteur : </span>{data.acheteur}
          </span>
        </div>
      </Section>

      {/* Dates clés */}
      <Section title="Dates clés">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'Limite remise offres', value: data.dates_cles.date_limite_offres },
            { label: 'Visite du site', value: data.dates_cles.visite },
            { label: 'Validité des offres', value: data.dates_cles.validite_offres },
          ].map(({ label, value }) => (
            <div key={label} className="bg-background border border-border rounded-lg p-3">
              <p className="font-syne text-[11px] text-text-subtle mb-1">{label}</p>
              <p className="font-syne text-[13px] font-semibold text-text">{value ?? '—'}</p>
            </div>
          ))}
        </div>
        {data.dates_cles.autres_dates.length > 0 && (
          <div className="mt-4 space-y-1.5">
            {data.dates_cles.autres_dates.map(({ libelle, date }) => (
              <div key={libelle} className="flex items-baseline justify-between gap-4 py-1 border-b border-border last:border-0">
                <p className="font-syne text-[12px] text-text-muted">{libelle}</p>
                <p className="font-syne text-[12px] font-semibold text-text shrink-0">{date}</p>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Lots */}
      {data.lots.length > 0 && (
        <Section title={`Lots (${data.lots.length})`}>
          <div className="space-y-2">
            {data.lots.map((lot) => (
              <div key={lot.numero} className="flex items-start justify-between gap-4 py-2 border-b border-border last:border-0">
                <div className="flex items-start gap-3">
                  <span className="font-syne text-[11px] font-bold bg-accent-subtle text-accent px-2 py-0.5 rounded-md shrink-0 mt-0.5">
                    {lot.numero.toLowerCase().startsWith('lot') ? lot.numero : `Lot ${lot.numero}`}
                  </span>
                  <p className="font-syne text-[13px] text-text">{lot.designation}</p>
                </div>
                {lot.estimation && (
                  <p className="font-syne text-[13px] font-semibold text-text shrink-0">{lot.estimation}</p>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Critères de notation */}
      {data.criteres_notation.length > 0 && (
        <Section title="Critères de notation">
          <div className="space-y-2">
            {data.criteres_notation.map((c) => (
              <div key={c.critere} className="flex items-center justify-between gap-4 py-1.5">
                <p className="font-syne text-[13px] text-text-muted">{c.critere}</p>
                <span className="font-syne text-[13px] font-bold text-accent shrink-0">{c.ponderation}</span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Pièces à fournir */}
      {data.pieces_a_fournir.length > 0 && (
        <Section title={`Pièces à fournir (${data.pieces_a_fournir.length})`}>
          <ul className="space-y-1.5">
            {data.pieces_a_fournir.map((piece) => (
              <li key={piece} className="flex items-start gap-2.5">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-[2px]">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span className="font-syne text-[13px] text-text-muted">{piece}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Points de vigilance */}
      {data.points_de_vigilance.length > 0 && (
        <Section title="Points de vigilance">
          <ul className="space-y-2">
            {data.points_de_vigilance.map((point) => (
              <li key={point} className="flex items-start gap-2.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-[1px]">
                  <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                <span className="font-syne text-[13px] text-text-muted">{point}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  )
}
