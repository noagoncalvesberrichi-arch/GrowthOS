'use client'

import { useState } from 'react'
import { OutputSection } from './OutputSection'

interface CMOFormData {
  productName: string
  targetClient: string
  growthStage: string
  currentMRR: string
  targetMRR: string
}

interface GeneratedSections {
  LINKEDIN_POSTS?: string
  ONBOARDING_EMAILS?: string
  PROSPECTION_SCRIPT?: string
  INFLUENCEUR_MESSAGES?: string
  ANALYSE_STRATEGIQUE?: string
}

const SECTION_LABELS = {
  LINKEDIN_POSTS: { title: 'Posts LinkedIn', tag: '5 posts' },
  ONBOARDING_EMAILS: { title: 'Séquence Onboarding', tag: '3 emails' },
  PROSPECTION_SCRIPT: { title: 'Script Prospection', tag: 'Téléphone' },
  INFLUENCEUR_MESSAGES: { title: 'Messages Influenceurs', tag: '3 messages' },
  ANALYSE_STRATEGIQUE: { title: 'Analyse Stratégique', tag: 'Semaine' },
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block font-syne text-[12px] font-semibold text-text-muted mb-1.5">
      {children}
    </label>
  )
}

function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 py-1">
      <span className="font-syne text-[11px] font-semibold text-text-subtle uppercase tracking-wider whitespace-nowrap">
        {label}
      </span>
      <div className="flex-1 h-px bg-border" />
    </div>
  )
}

const inputBase =
  'w-full bg-surface border border-border rounded-lg px-3.5 py-2.5 font-syne text-[14px] text-text placeholder:text-text-subtle transition-all duration-150 focus:border-accent focus:ring-2 focus:ring-accent/10'

function RefreshIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 019-9 9.75 9.75 0 016.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 01-9 9 9.75 9.75 0 01-6.74-2.74L3 16" />
      <path d="M3 21v-5h5" />
    </svg>
  )
}

export function CMOModule() {
  const [form, setForm] = useState<CMOFormData>({
    productName: '',
    targetClient: '',
    growthStage: '0',
    currentMRR: '',
    targetMRR: '',
  })
  const [loading, setLoading] = useState(false)
  const [sections, setSections] = useState<GeneratedSections | null>(null)
  const [error, setError] = useState<string | null>(null)

  const canGenerate = !loading && !!form.productName.trim() && !!form.targetClient.trim()

  const handleGenerate = async () => {
    if (!canGenerate) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/generate/cmo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Génération échouée')
      setSections(data.sections)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen">

      {/* ── Form Panel ─────────────────────────────────────── */}
      <div className="w-[340px] shrink-0 border-r border-border bg-surface min-h-screen flex flex-col">

        {/* Header */}
        <div className="px-6 pt-6 pb-5 border-b border-border">
          <div className="flex items-center gap-2 mb-3">
            <span className="bg-accent-subtle text-accent text-[11px] font-semibold font-syne px-2.5 py-1 rounded-full">
              Module 01
            </span>
            <span className="bg-background text-text-subtle text-[11px] font-syne px-2.5 py-1 rounded-full border border-border">
              B2B
            </span>
          </div>
          <h1 className="font-syne text-[22px] font-extrabold text-text leading-tight tracking-tight">
            CMO IA
          </h1>
          <p className="font-syne text-[13px] text-text-muted mt-1.5 leading-relaxed">
            Générez votre kit marketing complet en moins d'une minute.
          </p>
        </div>

        {/* Form */}
        <div className="flex-1 px-6 py-5 space-y-5 overflow-auto">

          <SectionDivider label="Votre produit" />

          <div>
            <FieldLabel>Nom du produit *</FieldLabel>
            <input
              type="text"
              value={form.productName}
              onChange={(e) => setForm({ ...form, productName: e.target.value })}
              placeholder="ex : Notion, Stripe, Figma"
              className={inputBase}
            />
          </div>

          <div>
            <FieldLabel>Cible client *</FieldLabel>
            <input
              type="text"
              value={form.targetClient}
              onChange={(e) => setForm({ ...form, targetClient: e.target.value })}
              placeholder="ex : PME B2B, startups SaaS"
              className={inputBase}
            />
          </div>

          <SectionDivider label="Croissance" />

          <div>
            <FieldLabel>Stade actuel</FieldLabel>
            <div className="space-y-2">
              {[
                { value: '0', label: '0 client', sub: 'Pré-lancement' },
                { value: '1-10', label: '1 à 10 clients', sub: 'Early stage' },
                { value: '10+', label: '10+ clients', sub: 'En croissance' },
              ].map((opt) => {
                const sel = form.growthStage === opt.value
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setForm({ ...form, growthStage: opt.value })}
                    className={`
                      w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg border text-left
                      transition-all duration-150
                      ${sel
                        ? 'border-accent bg-accent-subtle text-accent-fg'
                        : 'border-border bg-surface text-text-muted hover:border-border-focus/40 hover:bg-background hover:text-text'
                      }
                    `}
                  >
                    <div className={`w-2 h-2 rounded-full shrink-0 transition-colors duration-150 ${sel ? 'bg-accent' : 'bg-border'}`} />
                    <span className="font-syne text-[13px] font-medium flex-1">{opt.label}</span>
                    <span className={`font-syne text-[11px] ${sel ? 'text-accent/70' : 'text-text-subtle'}`}>{opt.sub}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel>MRR actuel</FieldLabel>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-syne text-[13px] text-text-subtle pointer-events-none">€</span>
                <input
                  type="number"
                  value={form.currentMRR}
                  onChange={(e) => setForm({ ...form, currentMRR: e.target.value })}
                  placeholder="0"
                  className={`${inputBase} pl-7`}
                />
              </div>
            </div>
            <div>
              <FieldLabel>Objectif MRR</FieldLabel>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-syne text-[13px] text-text-subtle pointer-events-none">€</span>
                <input
                  type="number"
                  value={form.targetMRR}
                  onChange={(e) => setForm({ ...form, targetMRR: e.target.value })}
                  placeholder="10 000"
                  className={`${inputBase} pl-7`}
                />
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="px-6 py-5 border-t border-border space-y-2.5">
          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <svg className="w-4 h-4 text-red-500 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <p className="font-syne text-[12px] text-red-600">{error}</p>
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={!canGenerate}
            className={`
              group relative w-full py-3 font-syne text-[14px] font-bold rounded-xl overflow-hidden
              transition-all duration-200
              ${canGenerate
                ? 'bg-accent hover:bg-accent-dark text-white shadow-card-md active:scale-[0.98]'
                : 'bg-background text-text-subtle border border-border cursor-not-allowed'
              }
            `}
          >
            {/* Shimmer */}
            {canGenerate && (
              <span
                aria-hidden="true"
                className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none"
              />
            )}
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Génération en cours...
              </span>
            ) : (
              <span className="relative">Générer mon kit →</span>
            )}
          </button>

          <p className="font-syne text-center text-[11px] text-text-subtle">
            Powered by Claude AI · ~30 secondes
          </p>
        </div>
      </div>

      {/* ── Output Panel ────────────────────────────────────── */}
      <div className="flex-1 min-h-screen flex flex-col">

        {/* Empty state */}
        {!sections && !loading && (
          <div className="flex-1 dot-grid flex items-center justify-center p-8 min-h-screen">
            <div className="bg-surface border border-border rounded-2xl shadow-card-md max-w-sm w-full overflow-hidden">
              <div className="px-6 pt-6 pb-5 border-b border-border">
                <div className="w-10 h-10 rounded-xl bg-accent-subtle flex items-center justify-center mb-4">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                </div>
                <h2 className="font-syne text-[18px] font-bold text-text">Ce que vous allez recevoir</h2>
                <p className="font-syne text-[13px] text-text-muted mt-1">5 livrables marketing personnalisés</p>
              </div>

              <div className="divide-y divide-border">
                {Object.entries(SECTION_LABELS).map(([, s], i) => (
                  <div key={i} className="flex items-center gap-3 px-6 py-3.5">
                    <div className="w-6 h-6 rounded-md bg-accent-subtle flex items-center justify-center shrink-0">
                      <span className="font-syne text-[10px] font-bold text-accent">{i + 1}</span>
                    </div>
                    <p className="font-syne text-[13px] font-medium text-text flex-1">{s.title}</p>
                    <span className="font-syne text-[11px] text-text-subtle bg-background px-2 py-0.5 rounded-full border border-border">
                      {s.tag}
                    </span>
                  </div>
                ))}
              </div>

              <div className="px-6 py-4 bg-background">
                <p className="font-syne text-[12px] text-text-subtle text-center">
                  ← Remplissez le formulaire pour commencer
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="flex-1 flex flex-col min-h-screen">
            {/* Scan line */}
            <div className="relative h-[2px] bg-border overflow-hidden">
              <div className="absolute top-0 left-0 h-full w-[35%] bg-gradient-to-r from-transparent via-accent to-transparent animate-scan" />
            </div>

            {/* Header */}
            <div className="px-6 py-4 border-b border-border bg-surface flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-accent-subtle flex items-center justify-center">
                  <svg className="animate-spin w-4 h-4 text-accent" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                </div>
                <div>
                  <p className="font-syne text-[12px] font-semibold text-accent">Génération en cours</p>
                  <p className="font-syne text-[13px] font-semibold text-text">{form.productName}</p>
                </div>
              </div>
              <p className="font-syne text-[12px] text-text-subtle animate-pulse-slow">Claude IA analyse...</p>
            </div>

            {/* Skeleton cards */}
            <div className="p-6 space-y-3">
              {[40, 70, 55, 65, 50].map((w, i) => (
                <div
                  key={i}
                  className="bg-surface border border-border rounded-xl shadow-card overflow-hidden"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <div className="flex items-center gap-3 px-5 py-3.5 bg-surface-raised border-b border-border">
                    <div className="w-8 h-8 rounded-lg bg-border animate-pulse" />
                    <div className="space-y-1.5">
                      <div className="h-3 bg-border rounded-full animate-pulse" style={{ width: `${w + 40}px` }} />
                      <div className="h-2.5 bg-border/70 rounded-full animate-pulse" style={{ width: `${w}px` }} />
                    </div>
                  </div>
                  <div className="px-5 py-4 space-y-2.5">
                    <div className="h-2.5 bg-border/60 rounded-full animate-pulse w-full" />
                    <div className="h-2.5 bg-border/60 rounded-full animate-pulse" style={{ width: '85%' }} />
                    <div className="h-2.5 bg-border/60 rounded-full animate-pulse" style={{ width: '70%' }} />
                    <div className="h-2.5 bg-border/40 rounded-full animate-pulse" style={{ width: '55%' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Generated content */}
        {sections && !loading && (
          <div className="flex-1 flex flex-col min-h-screen">
            {/* Results header */}
            <div className="px-6 py-4 border-b border-border bg-surface flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-accent" />
                <div>
                  <p className="font-syne text-[14px] font-bold text-text">{form.productName}</p>
                  <p className="font-syne text-[12px] text-text-muted">
                    {Object.keys(sections).length} livrables générés · Prêts à utiliser
                  </p>
                </div>
              </div>
              <button
                onClick={handleGenerate}
                className="flex items-center gap-2 font-syne text-[12px] font-semibold text-text-muted hover:text-accent transition-colors duration-150 px-3.5 py-2 border border-border hover:border-accent/40 rounded-lg hover:bg-accent-subtle"
              >
                <RefreshIcon />
                Régénérer
              </button>
            </div>

            {/* Section cards */}
            <div className="p-6 space-y-4 flex-1">
              {(Object.entries(SECTION_LABELS) as [keyof typeof SECTION_LABELS, { title: string; tag: string }][]).map(
                ([key, label], i) =>
                  sections[key] ? (
                    <OutputSection
                      key={key}
                      sectionKey={key}
                      title={label.title}
                      tag={label.tag}
                      content={sections[key] || ''}
                      index={i + 1}
                    />
                  ) : null
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
