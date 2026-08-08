'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

// ─── Types ────────────────────────────────────────────────────────────────────

type RecoPrixData = {
  scope: 'acheteur' | 'national'
  nb_marches: number
  p25: number
  mediane: number
  p75: number
  nb_concurrents: number
  position: 'sous_le_marche' | 'dans_le_marche' | 'au_dessus_du_marche' | null
}

// ─── Config ───────────────────────────────────────────────────────────────────

const POSITION_CFG = {
  dans_le_marche: {
    bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700',
    dot: '#16a34a', label: 'Dans le marché', hint: null,
  },
  sous_le_marche: {
    bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700',
    dot: '#d97706', label: 'Sous le marché', hint: 'Attention aux offres anormalement basses',
  },
  au_dessus_du_marche: {
    bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700',
    dot: '#dc2626', label: 'Au-dessus du marché', hint: null,
  },
} as const

// ─── Helpers ──────────────────────────────────────────────────────────────────

const eur = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)

// ─── Main component ───────────────────────────────────────────────────────────

export function RecoPrix({
  siret,
  cpv,
  montant,
}: {
  siret: string
  cpv: string
  montant?: number | null
}) {
  const [data, setData] = useState<RecoPrixData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    ;(async () => {
      try {
        const { data: result, error } = await supabase.rpc('get_reco_prix', {
          p_siret: siret,
          p_cpv_prefix: cpv.slice(0, 4),
          p_montant: montant ?? null,
        })
        if (!error) setData(result as RecoPrixData)
      } catch {
        // Silent fail — widget secondaire
      } finally {
        setLoading(false)
      }
    })()
  }, [siret, cpv, montant])

  if (loading) {
    return (
      <div className="border border-border rounded-xl px-5 py-5 flex items-center gap-3">
        <svg className="animate-spin shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M21 12a9 9 0 11-6.219-8.56" />
        </svg>
        <p className="font-syne text-[13px] text-text-subtle">Chargement du positionnement prix…</p>
      </div>
    )
  }

  if (!data || data.nb_marches === 0) return null

  const posCfg = data.position ? POSITION_CFG[data.position] : null

  // ── Bar geometry ──────────────────────────────────────────────────────────
  const range = data.p75 > data.p25 ? data.p75 - data.p25 : 1
  const pad = range * 0.25
  const dMin = data.p25 - pad
  const dMax = data.p75 + pad
  const dRange = dMax - dMin

  // Returns a percentage within the bar (3%–97% to avoid edge overflow)
  const pct = (v: number) =>
    Math.min(97, Math.max(3, ((v - dMin) / dRange) * 100))

  const p25Pct  = pct(data.p25)
  const medPct  = pct(data.mediane)
  const p75Pct  = pct(data.p75)
  const montantPct = montant != null ? pct(montant) : null

  const scopeLabel = data.scope === 'acheteur'
    ? `Basé sur ${data.nb_marches} marchés similaires de cet acheteur`
    : `Référentiel national — acheteur peu actif sur ce type de marché (${data.nb_marches} marchés)`

  return (
    <div className="space-y-4">
      {/* Section header */}
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full" style={{ background: '#2563EB' }} />
        <p className="font-syne text-[12px] font-bold text-accent uppercase tracking-wider">
          Positionnement prix
        </p>
      </div>

      <div className="border border-border rounded-xl overflow-hidden">
        {/* Card header */}
        <div className="bg-background px-5 py-3 border-b border-border flex items-center justify-between gap-3 flex-wrap">
          <p className="font-syne text-[12px] text-text-subtle leading-snug">{scopeLabel}</p>
          {data.nb_concurrents > 0 && (
            <span className="font-syne text-[11px] text-text-subtle shrink-0">
              {data.nb_concurrents} concurrent{data.nb_concurrents > 1 ? 's' : ''} dans le référentiel
            </span>
          )}
        </div>

        <div className="p-5 space-y-4">

          {/* Position badge */}
          {posCfg && (
            <div className={`flex items-start gap-2.5 rounded-xl border px-4 py-3 ${posCfg.bg} ${posCfg.border}`}>
              <div className="w-2 h-2 rounded-full mt-[3px] shrink-0" style={{ background: posCfg.dot }} />
              <div>
                <p className={`font-syne text-[13px] font-bold ${posCfg.text}`}>{posCfg.label}</p>
                {posCfg.hint && (
                  <p className={`font-syne text-[12px] mt-0.5 ${posCfg.text} opacity-80`}>{posCfg.hint}</p>
                )}
              </div>
            </div>
          )}

          {/* Price range stat boxes */}
          <div className="grid grid-cols-3 gap-px bg-border rounded-xl overflow-hidden">
            {([
              { key: 'p25',    val: data.p25,    label: '1er quartile',  sub: 'p25' },
              { key: 'med',    val: data.mediane, label: 'Médiane',       sub: 'p50' },
              { key: 'p75',    val: data.p75,    label: '3e quartile',   sub: 'p75' },
            ] as const).map(({ key, val, label, sub }) => (
              <div key={key} className="bg-surface px-3 py-3 text-center">
                <p className="font-syne text-[10px] text-text-subtle mb-1">{label}</p>
                <p className="font-fraunces text-[16px] text-text leading-none">{eur(val)}</p>
                <p className="font-syne text-[9px] text-text-subtle mt-0.5 opacity-50 uppercase tracking-wider">{sub}</p>
              </div>
            ))}
          </div>

          {/* Visual range bar */}
          <div className="px-0.5">
            {/* Bar */}
            <div className="relative h-2.5 rounded-full bg-border">
              {/* Market zone fill */}
              <div
                className="absolute h-full rounded-full bg-accent/20"
                style={{ left: `${p25Pct}%`, right: `${100 - p75Pct}%` }}
              />
              {/* Median tick */}
              <div
                className="absolute top-0 bottom-0 w-px bg-accent/50"
                style={{ left: `${medPct}%` }}
              />
              {/* Montant dot */}
              {montantPct !== null && (
                <div
                  className="absolute top-1/2 w-4 h-4 rounded-full border-2 border-white shadow-md"
                  style={{
                    left: `${montantPct}%`,
                    transform: 'translate(-50%, -50%)',
                    background: posCfg?.dot ?? '#6B7280',
                  }}
                />
              )}
            </div>

            {/* Axis anchors */}
            <div className="relative flex justify-between mt-1.5">
              <span className="font-syne text-[9px] text-text-subtle" style={{ marginLeft: `${p25Pct - 1}%` }}>p25</span>
              <span className="font-syne text-[9px] text-text-subtle absolute" style={{ left: `${medPct}%`, transform: 'translateX(-50%)' }}>médiane</span>
              <span className="font-syne text-[9px] text-text-subtle" style={{ marginRight: `${100 - p75Pct - 1}%` }}>p75</span>
            </div>

            {/* Montant label */}
            {montantPct !== null && montant != null && (
              <div
                className="relative mt-3 flex justify-center"
                style={{ marginLeft: `${montantPct}%`, transform: 'translateX(-50%)', width: 0 }}
              >
                <span
                  className="font-syne text-[11px] font-semibold whitespace-nowrap"
                  style={{ color: posCfg?.dot ?? '#6B7280' }}
                >
                  ▲ Votre estimation : {eur(montant)}
                </span>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
