'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

// ─── Types ────────────────────────────────────────────────────────────────────

type DernierMarche = {
  objet: string
  code_cpv: string | null
  date_notification: string | null
  montant: number | null
  titulaire_nom: string | null
  procedure: string | null
}

type TopTitulaire = {
  titulaire_nom: string
  nb: number
  montant_moyen: number | null
}

type HistoriqueData = {
  acheteur_nom: string | null
  nb_marches: number
  montant_moyen: number | null
  montant_median: number | null
  derniers_marches: DernierMarche[]
  top_titulaires: TopTitulaire[]
}

type Scope =
  | { type: 'precise'; prefix: string }
  | { type: 'fallback' }
  | { type: 'default' }

// ─── Helpers ──────────────────────────────────────────────────────────────────

const eur = (n: number | null) =>
  n == null
    ? '—'
    : new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)

const shortDate = (s: string | null) => {
  if (!s) return '—'
  try {
    return new Date(s).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch {
    return s
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-background border border-border rounded-xl p-4 flex flex-col gap-1">
      <p className="font-syne text-[11px] text-text-subtle uppercase tracking-wider">{label}</p>
      <p className="font-fraunces text-[22px] text-text leading-none">{value}</p>
    </div>
  )
}

// ─── Pro lock overlay ─────────────────────────────────────────────────────────

function ProLockOverlay({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative rounded-2xl overflow-hidden">
      <div className="blur-sm pointer-events-none select-none opacity-60">{children}</div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="bg-surface/95 border border-border rounded-xl px-6 py-5 text-center shadow-xl mx-4 max-w-[280px]">
          <div className="w-9 h-9 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-3">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0110 0v4" />
            </svg>
          </div>
          <p className="font-syne text-[13px] font-bold text-text mb-1">Réservé au plan Pro</p>
          <p className="font-syne text-[12px] text-text-muted mb-4 leading-relaxed">
            Débloquez l&apos;historique des marchés attribués par cet acheteur
          </p>
          <a
            href="/pricing"
            className="inline-flex items-center justify-center bg-accent text-white font-syne text-[13px] font-semibold rounded-xl px-4 py-2.5 hover:bg-accent/90 transition-colors"
          >
            Passer à Pro →
          </a>
        </div>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function HistoriqueAcheteur({
  siret,
  cpv,
  locked,
}: {
  siret: string
  cpv?: string | null
  locked?: boolean
}) {
  const [data, setData] = useState<HistoriqueData | null>(null)
  const [scope, setScope] = useState<Scope | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    ;(async () => {
      try {
        const prefix4 = cpv && cpv.length >= 4 ? cpv.slice(0, 4) : null

        if (prefix4) {
          // Try precise 4-digit prefix first
          const { data: result, error: rpcError } = await supabase.rpc(
            'get_historique_acheteur',
            { p_siret: siret, p_cpv_prefix: prefix4 }
          )
          if (rpcError) throw rpcError
          const d = result as HistoriqueData

          if (d.nb_marches >= 10) {
            setData(d)
            setScope({ type: 'precise', prefix: prefix4 })
            return
          }
        }

        // Fallback to "45" (all BTP)
        const { data: result45, error: rpcError45 } = await supabase.rpc(
          'get_historique_acheteur',
          { p_siret: siret, p_cpv_prefix: '45' }
        )
        if (rpcError45) throw rpcError45
        setData(result45 as HistoriqueData)
        setScope(prefix4 ? { type: 'fallback' } : { type: 'default' })
      } catch {
        setError("Impossible de charger l'historique.")
      } finally {
        setLoading(false)
      }
    })()
  }, [siret, cpv])

  // ── Loading ──
  if (loading) {
    return (
      <div className="border border-border rounded-xl overflow-hidden">
        <div className="bg-background px-5 py-3 border-b border-border">
          <p className="font-syne text-[12px] font-bold text-text-muted uppercase tracking-wider">
            Historique de l&apos;acheteur
          </p>
        </div>
        <div className="px-5 py-8 flex items-center gap-3 text-text-subtle">
          <svg className="animate-spin shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M21 12a9 9 0 11-6.219-8.56" />
          </svg>
          <p className="font-syne text-[13px]">Chargement de l&apos;historique…</p>
        </div>
      </div>
    )
  }

  // ── Error ──
  if (error) {
    return (
      <div className="border border-border rounded-xl px-5 py-4 flex items-center gap-3">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
          <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
        <p className="font-syne text-[13px] text-text-muted">{error}</p>
      </div>
    )
  }

  // ── No data ──
  if (!data || data.nb_marches === 0) {
    return (
      <div className="border border-border rounded-xl overflow-hidden">
        <div className="bg-background px-5 py-3 border-b border-border">
          <p className="font-syne text-[12px] font-bold text-text-muted uppercase tracking-wider">
            Historique de l&apos;acheteur
          </p>
        </div>
        <div className="px-5 py-6 text-center">
          <p className="font-syne text-[13px] text-text-subtle">
            Aucun marché attribué trouvé pour cet acheteur (SIRET&nbsp;: {siret}).
          </p>
        </div>
      </div>
    )
  }

  const acheteurLabel = data.acheteur_nom ?? `SIRET ${siret}`

  const scopeLabel =
    scope?.type === 'precise'
      ? `marchés similaires (CPV ${scope.prefix}xxxx)`
      : `ensemble des marchés de travaux de l'acheteur`

  const isLocked = locked ?? false

  const content = (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-brand-amber" />
        <p className="font-syne text-[12px] font-bold text-brand-amber uppercase tracking-wider">
          Historique de l&apos;acheteur
        </p>
      </div>

      <div className="border border-border rounded-xl overflow-hidden">
        <div className="bg-background px-5 py-3 border-b border-border">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <p className="font-syne text-[13px] font-semibold text-text">{acheteurLabel}</p>
              <p className="font-syne text-[11px] text-text-subtle mt-0.5">SIRET {siret}</p>
            </div>
            <span className="font-syne text-[11px] font-semibold text-text-subtle bg-background border border-border rounded-full px-3 py-1 shrink-0">
              {scopeLabel}
            </span>
          </div>
        </div>

        <div className="p-5 space-y-5">

          {/* 3 chiffres clés */}
          <div className="grid grid-cols-3 gap-3">
            <StatCard label="Marchés attribués" value={data.nb_marches.toString()} />
            <StatCard label="Montant médian" value={eur(data.montant_median)} />
            <StatCard label="Montant moyen" value={eur(data.montant_moyen)} />
          </div>

          {/* Top titulaires */}
          {data.top_titulaires.length > 0 && (
            <div>
              <p className="font-syne text-[11px] font-bold text-text-muted uppercase tracking-wider mb-3">
                Entreprises qui remportent chez cet acheteur
              </p>
              <div className="space-y-0 border border-border rounded-xl overflow-hidden">
                {data.top_titulaires.map((t, i) => (
                  <div
                    key={t.titulaire_nom}
                    className={`flex items-center gap-3 px-4 py-3 ${i < data.top_titulaires.length - 1 ? 'border-b border-border' : ''}`}
                  >
                    <span className="font-syne text-[11px] font-bold text-text-subtle w-5 shrink-0 text-right">
                      {i + 1}
                    </span>
                    <p className="font-syne text-[13px] text-text flex-1 truncate">{t.titulaire_nom}</p>
                    <span className="font-syne text-[12px] font-semibold text-accent shrink-0">
                      {t.nb} {t.nb > 1 ? 'lots' : 'lot'}
                    </span>
                    {t.montant_moyen != null && (
                      <span className="font-syne text-[12px] text-text-subtle shrink-0 hidden sm:block">
                        {eur(t.montant_moyen)} moy.
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Dernières attributions */}
          {data.derniers_marches.length > 0 && (
            <div>
              <p className="font-syne text-[11px] font-bold text-text-muted uppercase tracking-wider mb-3">
                Dernières attributions
              </p>
              <div className="border border-border rounded-xl overflow-hidden">
                {data.derniers_marches.slice(0, 10).map((m, i) => (
                  <div
                    key={i}
                    className={`px-4 py-3.5 ${i < Math.min(data.derniers_marches.length, 10) - 1 ? 'border-b border-border' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-1.5">
                      <p className="font-syne text-[13px] font-semibold text-text leading-snug flex-1">{m.objet}</p>
                      <span className="font-syne text-[13px] font-bold text-text shrink-0">
                        {eur(m.montant)}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                      {m.titulaire_nom && (
                        <span className="font-syne text-[12px] text-text-subtle">
                          Gagnant&nbsp;: <span className="font-semibold text-text-muted">{m.titulaire_nom}</span>
                        </span>
                      )}
                      {m.date_notification && (
                        <span className="font-syne text-[12px] text-text-subtle">
                          Attribué&nbsp;: <span className="font-semibold text-text-muted">{shortDate(m.date_notification)}</span>
                        </span>
                      )}
                      {m.procedure && (
                        <span className="font-syne text-[11px] bg-background border border-border rounded-md px-2 py-0.5 text-text-subtle">
                          {m.procedure}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )

  return isLocked ? <ProLockOverlay>{content}</ProLockOverlay> : content
}
