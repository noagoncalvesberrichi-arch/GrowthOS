'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AOResultDisplay } from '@/app/(dashboard)/dashboard/analyser/AOResultDisplay'
import { RecoPrix } from '@/components/RecoPrix'
import { HistoriqueAcheteur } from '@/components/HistoriqueAcheteur'
import {
  calculateCountdown,
  classifyDocument,
  parseNotationWeight,
  getNextActions,
} from '@/lib/analyse/resultUtils'
import type { AOResult, AOMetadata } from '@/app/(dashboard)/dashboard/analyser/actions'

// ─── Shared atoms ─────────────────────────────────────────────────────────────

function SectionTitle({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="shrink-0 w-6 h-6 rounded-lg bg-accent/10 flex items-center justify-center">
        <span className="font-syne text-[11px] font-bold text-accent">{n}</span>
      </div>
      <h2 className="font-fraunces text-[18px] text-text tracking-tight">{children}</h2>
    </div>
  )
}

function Collapsible({
  title,
  defaultOpen = false,
  children,
}: {
  title: string
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border border-border rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 bg-surface hover:bg-background transition-colors duration-150"
      >
        <span className="font-syne text-[14px] font-semibold text-text">{title}</span>
        <svg
          width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          className={`text-text-muted transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && <div className="px-5 pb-5 pt-1 bg-surface">{children}</div>}
    </div>
  )
}

// ─── 0. Frise de progression ─────────────────────────────────────────────────

function FriseProgression({ dateLimite }: { dateLimite: string | null }) {
  const steps = [
    { label: 'Comprendre', done: true, current: false },
    { label: 'Décider', done: false, current: true },
    { label: "Préparer l'offre", done: false, current: false },
    { label: dateLimite ? `Envoyer · ${dateLimite}` : 'Envoyer', done: false, current: false },
  ]
  return (
    <div className="mb-8">
      <div className="flex items-center gap-0 overflow-x-auto pb-1">
        {steps.map((step, i) => (
          <div key={i} className="flex items-center shrink-0">
            {i > 0 && (
              <div className={`w-8 h-px mx-2 shrink-0 ${steps[i - 1].done ? 'bg-menthe/50' : 'bg-border'}`} />
            )}
            <div className="flex items-center gap-2">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                step.done ? 'bg-menthe' : step.current ? 'bg-accent' : 'bg-border'
              }`}>
                {step.done ? (
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <div className={`w-2 h-2 rounded-full ${step.current ? 'bg-white' : 'bg-text-subtle'}`} />
                )}
              </div>
              <span className={`font-syne text-[12px] font-semibold whitespace-nowrap ${
                step.done ? 'text-menthe-dark' : step.current ? 'text-accent' : 'text-text-muted'
              }`}>
                {step.label}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── 1. En résumé ─────────────────────────────────────────────────────────────

function SectionResume({
  goNoGo,
  dateLimite,
}: {
  goNoGo: AOResult['go_no_go']
  dateLimite: string | null
}) {
  if (!goNoGo) return null

  const verdict = goNoGo.verdict
  const countdown = calculateCountdown(dateLimite)

  const verdictCfg = {
    GO: { bg: 'bg-menthe/10', border: 'border-menthe/25', badge: 'bg-menthe/15 text-menthe border-menthe/30', label: 'GO', icon: '✓' },
    NO_GO: { bg: 'bg-red-500/6', border: 'border-red-300/25', badge: 'bg-red-500/12 text-red-600 border-red-300/30', label: 'NO-GO', icon: '✕' },
    VIGILANCE: { bg: 'bg-brand-amber/6', border: 'border-brand-amber/25', badge: 'bg-brand-amber/12 text-brand-amber border-brand-amber/30', label: 'Vigilance', icon: '⚠' },
  }[verdict]

  const okCriteres = goNoGo.criteres.filter(c => c.statut === 'ok')
  const warnCriteres = goNoGo.criteres.filter(c => c.statut !== 'ok')

  return (
    <div className={`rounded-2xl border ${verdictCfg.border} ${verdictCfg.bg} p-5 mb-6`}>
      <div className="flex flex-wrap items-start gap-4 mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <span className={`inline-flex items-center gap-1.5 border font-syne text-[12px] font-bold uppercase tracking-widest px-3 py-1 rounded-pill ${verdictCfg.badge}`}>
              {verdictCfg.icon} {verdictCfg.label}
            </span>
            {goNoGo.score_eligibilite != null && (
              <span className="font-syne text-[12px] font-semibold text-text-muted">
                Score {goNoGo.score_eligibilite} / 100
              </span>
            )}
          </div>
          {goNoGo.synthese && (
            <p className="font-syne text-[14px] text-text leading-relaxed">{goNoGo.synthese}</p>
          )}
        </div>
        {/* Countdown card */}
        {countdown !== null && (
          <div className="shrink-0 text-center bg-nuit rounded-xl px-4 py-3 min-w-[80px]">
            <p className={`font-fraunces text-[28px] font-bold leading-none mb-0.5 ${
              countdown < 0 ? 'text-red-400' : countdown < 7 ? 'text-brand-amber' : 'text-cuivre-glow'
            }`}>
              {Math.abs(countdown)}
            </p>
            <p className="font-syne text-[10px] text-white/40 uppercase tracking-wider">
              {countdown < 0 ? 'jours passés' : 'jours restants'}
            </p>
          </div>
        )}
      </div>
      {/* Criteria summary */}
      {goNoGo.criteres.length > 0 && (
        <div className="space-y-1.5">
          {okCriteres.slice(0, 3).map(c => (
            <div key={c.critere} className="flex items-start gap-2">
              <span className="text-menthe shrink-0 mt-0.5 text-[13px]">✓</span>
              <span className="font-syne text-[13px] text-text-muted">{c.critere}</span>
            </div>
          ))}
          {warnCriteres.slice(0, 3).map(c => (
            <div key={c.critere} className="flex items-start gap-2">
              <span className={`shrink-0 mt-0.5 text-[13px] ${c.statut === 'manquant' ? 'text-red-500' : 'text-brand-amber'}`}>
                {c.statut === 'manquant' ? '✕' : '⚠'}
              </span>
              <span className="font-syne text-[13px] text-text-muted">{c.critere}</span>
            </div>
          ))}
          {goNoGo.criteres.length > 6 && (
            <p className="font-syne text-[12px] text-text-subtle pl-5">+ {goNoGo.criteres.length - 6} critères supplémentaires</p>
          )}
        </div>
      )}
    </div>
  )
}

// ─── 2. Ce qu'il reste à faire ────────────────────────────────────────────────

function SectionActions({ result, analyseId, isMemoreLocked }: { result: AOResult; analyseId: string; isMemoreLocked: boolean }) {
  const actions = getNextActions(result, analyseId)
  if (actions.length === 0) return null

  const iconMap: Record<string, React.ReactNode> = {
    visite: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
    memoire: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/></svg>,
    chiffrage: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>,
    envoi: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
  }

  return (
    <div className="mb-6">
      <SectionTitle n={1}>Ce qu&apos;il vous reste à faire, dans l&apos;ordre</SectionTitle>
      <ol className="space-y-3">
        {actions.map((action, i) => {
          const isLocked = action.icon === 'memoire' && isMemoreLocked
          const isExternal = action.icon === 'visite' || action.icon === 'envoi'
          return (
            <li key={i} className="flex items-start gap-4 bg-surface border border-border rounded-xl px-4 py-3">
              <div className="shrink-0 w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center mt-0.5">
                <span className="font-syne text-[11px] font-bold text-accent">{i + 1}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-syne text-[13px] font-semibold text-text">{action.label}</p>
                <p className="font-syne text-[12px] text-text-muted">{action.detail}</p>
              </div>
              {!isExternal && (
                <Link
                  href={isLocked ? '/pricing' : action.href}
                  className={`shrink-0 flex items-center gap-1.5 font-syne text-[12px] font-semibold px-3 py-1.5 rounded-xl transition-all duration-150 ${
                    isLocked
                      ? 'text-text-muted border border-border hover:border-accent/30'
                      : 'text-white bg-accent hover:bg-accent-dark'
                  }`}
                >
                  <span className="text-current">{iconMap[action.icon]}</span>
                  {isLocked ? (
                    <><span>Accès Pro</span><span className="bg-brand-amber text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full ml-1">Pro</span></>
                  ) : 'Commencer'}
                </Link>
              )}
            </li>
          )
        })}
      </ol>
    </div>
  )
}

// ─── 3. Combien cet acheteur paie ─────────────────────────────────────────────
// Rendered via RecoPrix component (client, fetches from Supabase RPC)

// ─── 4. Comment votre offre sera notée ────────────────────────────────────────

function SectionNotation({ criteres }: { criteres: AOResult['criteres_notation'] }) {
  if (!criteres || criteres.length === 0) return null

  const weights = criteres.map(c => parseNotationWeight(c.ponderation))
  const totalParsed = weights.reduce<number>((s, w) => s + (w ?? 0), 0)
  const hasWeights = totalParsed > 0

  // Detect if price criterion exists
  const prixCritere = criteres.find(c =>
    c.critere.toLowerCase().includes('prix') || c.critere.toLowerCase().includes('financier')
  )
  const techPct = prixCritere
    ? 100 - (parseNotationWeight(prixCritere.ponderation) ?? 0)
    : null

  return (
    <div className="mb-6">
      <SectionTitle n={4}>Comment votre offre sera notée</SectionTitle>
      <div className="bg-surface border border-border rounded-2xl p-5">
        {hasWeights && (
          <div className="mb-4">
            {/* Segmented bar */}
            <div className="flex h-3 rounded-pill overflow-hidden gap-0.5 mb-3">
              {criteres.map((c, i) => {
                const w = weights[i] ?? 0
                const pct = totalParsed > 0 ? (w / totalParsed) * 100 : 100 / criteres.length
                const hues = ['#2563EB', '#34B890', '#C17F3A', '#8B5CF6', '#EF4444', '#0EA5E9']
                return (
                  <div
                    key={i}
                    style={{ width: `${pct}%`, background: hues[i % hues.length] }}
                    title={`${c.critere}: ${c.ponderation}`}
                  />
                )
              })}
            </div>
            {/* Legend */}
            <div className="flex flex-wrap gap-3">
              {criteres.map((c, i) => {
                const hues = ['#2563EB', '#34B890', '#C17F3A', '#8B5CF6', '#EF4444', '#0EA5E9']
                return (
                  <div key={i} className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: hues[i % hues.length] }} />
                    <span className="font-syne text-[12px] text-text-muted">{c.critere}</span>
                    {weights[i] !== null && (
                      <span className="font-syne text-[11px] font-bold text-text">{weights[i]}%</span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
        {!hasWeights && (
          <ul className="space-y-2 mb-3">
            {criteres.map(c => (
              <li key={c.critere} className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
                <span className="font-syne text-[13px] text-text">{c.critere}</span>
                <span className="font-syne text-[12px] text-text-muted ml-auto">{c.ponderation}</span>
              </li>
            ))}
          </ul>
        )}
        {techPct !== null && techPct > 50 && (
          <div className="bg-accent-subtle border border-accent-light rounded-xl px-4 py-2.5">
            <p className="font-syne text-[13px] text-accent-fg">
              <strong>{techPct}% de la note</strong> repose sur la qualité technique — votre mémoire est déterminant.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── 5. Documents à envoyer ───────────────────────────────────────────────────

function SectionDocuments({
  pieces,
  documents,
}: {
  pieces: AOResult['pieces_a_fournir']
  documents: AOResult['documents_a_remplir']
}) {
  const allDocs = [
    ...pieces.map(p => p),
    ...documents.map(d => d.nom_fichier),
  ]
  const unique = [...new Set(allDocs)]
  if (unique.length === 0) return null

  const stratly: string[] = []
  const ready: string[] = []
  const todo: string[] = []

  for (const doc of unique) {
    const cat = classifyDocument(doc)
    if (cat === 'stratly') stratly.push(doc)
    else if (cat === 'ready') ready.push(doc)
    else todo.push(doc)
  }

  // If classification is totally indeterminate (all todo), show a simple list
  const useCols = stratly.length > 0 || ready.length > 0

  return (
    <div className="mb-6">
      <SectionTitle n={5}>Les documents à envoyer</SectionTitle>
      {useCols ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <DocColumn
            title="Déjà prêts"
            subtitle="Dans votre profil"
            color="menthe"
            icon="✓"
            items={ready}
            emptyText="Aucun détecté"
          />
          <DocColumn
            title="Stratly les prépare"
            subtitle="Générés depuis votre analyse"
            color="accent"
            icon="⚡"
            items={stratly}
            emptyText="Aucun pour ce marché"
          />
          <DocColumn
            title="À faire vous-même"
            subtitle="À rédiger ou compléter"
            color="brand-amber"
            icon="○"
            items={todo}
            emptyText="Rien de spécifique"
          />
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-2xl p-5">
          <ul className="space-y-2">
            {unique.map(doc => (
              <li key={doc} className="flex items-start gap-2.5">
                <span className="text-text-subtle shrink-0 mt-0.5">○</span>
                <span className="font-syne text-[13px] text-text">{doc}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function DocColumn({
  title,
  subtitle,
  color,
  icon,
  items,
  emptyText,
}: {
  title: string
  subtitle: string
  color: string
  icon: string
  items: string[]
  emptyText: string
}) {
  const colorMap: Record<string, string> = {
    menthe: 'text-menthe-dark bg-menthe/8 border-menthe/20',
    accent: 'text-accent bg-accent-subtle border-accent-light',
    'brand-amber': 'text-brand-amber bg-brand-amber-subtle border-brand-amber/20',
  }
  const cls = colorMap[color] ?? 'text-text-muted bg-background border-border'

  return (
    <div className={`rounded-2xl border p-4 ${cls}`}>
      <p className="font-syne text-[11px] font-bold uppercase tracking-wider mb-0.5">{title}</p>
      <p className="font-syne text-[11px] opacity-60 mb-3">{subtitle}</p>
      {items.length === 0 ? (
        <p className="font-syne text-[12px] opacity-50 italic">{emptyText}</p>
      ) : (
        <ul className="space-y-1.5">
          {items.map(item => (
            <li key={item} className="flex items-start gap-2">
              <span className="shrink-0 opacity-70 text-[12px]">{icon}</span>
              <span className="font-syne text-[12px] leading-snug">{item}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// ─── 6. Points de vigilance ───────────────────────────────────────────────────

function SectionVigilance({ points }: { points: AOResult['points_de_vigilance'] }) {
  if (!points || points.length === 0) return null

  return (
    <div className="mb-6">
      <SectionTitle n={6}>Les points qui peuvent vous coûter cher</SectionTitle>
      <div className="bg-brand-amber-subtle border border-brand-amber/25 rounded-2xl p-5">
        <div className="flex items-start gap-3 mb-3">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <p className="font-syne text-[13px] font-semibold text-brand-amber">Points de vigilance identifiés</p>
        </div>
        <ul className="space-y-2">
          {points.map(p => (
            <li key={p} className="flex items-start gap-2.5">
              <span className="text-brand-amber shrink-0 mt-0.5 text-[13px]">⚠</span>
              <span className="font-syne text-[13px] text-brand-amber-dark leading-relaxed">{p}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

// ─── 7. Lexique ───────────────────────────────────────────────────────────────

const LEXIQUE = [
  { term: 'RC', def: 'Règlement de la consultation — document qui explique les règles de la mise en concurrence : critères de sélection, délais, format du dossier.' },
  { term: 'CCTP', def: 'Cahier des Clauses Techniques Particulières — décrit exactement le travail à effectuer : nature, quantités, matériaux, normes.' },
  { term: 'CCAP', def: 'Cahier des Clauses Administratives Particulières — fixe les conditions contractuelles : prix, paiement, pénalités, assurances.' },
  { term: 'DPGF', def: 'Décomposition du Prix Global et Forfaitaire — tableau que vous remplissez poste par poste avec vos prix unitaires. Sert de base à la comparaison des offres.' },
  { term: 'DQE', def: 'Détail Quantitatif Estimatif — variante du DPGF pour les marchés à bons de commande : prix unitaires × quantités estimées.' },
  { term: 'BPU', def: 'Bordereau de Prix Unitaires — liste de prix à l\'unité sans quantités fixées (marchés à bons de commande).' },
  { term: 'Acte d\'engagement', def: 'Document signé par lequel vous vous engagez à réaliser le marché aux conditions de l\'offre. C\'est le contrat qui lie acheteur et titulaire.' },
  { term: 'DC1', def: 'Déclaration sur l\'honneur de candidature — atteste que vous n\'êtes pas en situation d\'exclusion (pas de condamnation, pas de dette fiscale ou sociale).' },
  { term: 'DC2', def: 'Déclaration du candidat — synthèse de vos capacités (CA, effectif, assurance, certifications, références).' },
  { term: 'DUME', def: 'Document Unique de Marché Européen — équivalent du DC1/DC2 pour les appels d\'offres européens, réutilisable d\'un marché à l\'autre.' },
]

function SectionLexique() {
  return (
    <Collapsible title="Lexique des termes du marché public">
      <dl className="space-y-3 mt-2">
        {LEXIQUE.map(({ term, def }) => (
          <div key={term} className="grid grid-cols-[80px_1fr] gap-3">
            <dt className="font-mono text-[12px] font-bold text-accent pt-0.5">{term}</dt>
            <dd className="font-syne text-[13px] text-text-muted leading-relaxed">{def}</dd>
          </div>
        ))}
      </dl>
    </Collapsible>
  )
}

// ─── 8. Détails complets (ancien affichage) ──────────────────────────────────

function SectionDetails({ data, meta }: { data: AOResult; meta: AOMetadata }) {
  return (
    <Collapsible title="Détails complets de l'analyse">
      <div className="overflow-x-auto mt-2">
        <AOResultDisplay data={data} meta={meta} />
      </div>
    </Collapsible>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function AnalyseResultat({
  data,
  meta,
  analyseId,
  isPro,
  isMemoreLocked,
}: {
  data: AOResult
  meta: AOMetadata
  analyseId: string
  isPro: boolean
  isMemoreLocked: boolean
}) {
  const dateLimite = data.dates_cles?.date_limite_offres ?? null

  return (
    <div>
      {/* 0. Frise */}
      <FriseProgression dateLimite={dateLimite} />

      {/* 1. En résumé */}
      <SectionResume goNoGo={data.go_no_go} dateLimite={dateLimite} />

      {/* 2. Ce qu'il reste à faire */}
      <SectionActions result={data} analyseId={analyseId} isMemoreLocked={isMemoreLocked} />

      {/* 3. Positionnement prix (RecoPrix — client, fetches data) */}
      {data.siret_acheteur && data.code_cpv && (
        <div className="mb-6">
          <SectionTitle n={3}>Combien cet acheteur paie d&apos;habitude</SectionTitle>
          <RecoPrix
            siret={data.siret_acheteur}
            cpv={data.code_cpv}
            montant={data.montant_estime}
            locked={!isPro}
          />
        </div>
      )}

      {/* 4. Notation */}
      <SectionNotation criteres={data.criteres_notation} />

      {/* 5. Documents */}
      <SectionDocuments pieces={data.pieces_a_fournir} documents={data.documents_a_remplir} />

      {/* 6. Vigilance */}
      <SectionVigilance points={data.points_de_vigilance} />

      {/* 7. Historique acheteur */}
      {data.siret_acheteur && (
        <div className="mb-6">
          <SectionTitle n={7}>Historique de l&apos;acheteur</SectionTitle>
          <HistoriqueAcheteur
            siret={data.siret_acheteur}
            cpv={data.code_cpv}
            locked={!isPro}
          />
        </div>
      )}

      {/* 8. Lexique */}
      <div className="mb-6">
        <SectionLexique />
      </div>

      {/* 9. Détails complets */}
      <div className="mb-6">
        <SectionDetails data={data} meta={meta} />
      </div>
    </div>
  )
}
