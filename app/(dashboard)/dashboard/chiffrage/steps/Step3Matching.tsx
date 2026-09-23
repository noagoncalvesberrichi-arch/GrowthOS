'use client'

import { useMemo } from 'react'
import type { FileAnalysis, ColumnMapping, MatchedRow, ParsedRow } from '@/lib/chiffrage/types'
import { applyMapping } from '@/lib/chiffrage/rowMatching'

type Props = {
  acheteurAnalysis: FileAnalysis
  crmAnalysis: FileAnalysis
  acheteurMappings: Record<string, ColumnMapping>
  crmMappings: Record<string, ColumnMapping>
  matches: MatchedRow[]
  onMatchesChange: (matches: MatchedRow[]) => void
  onGenerate: () => void
  onBack: () => void
}

function ConfidenceBadge({ confidence, matched }: { confidence: number; matched: boolean }) {
  if (!matched) {
    return <span className="font-mono text-[10px] bg-red-500/10 border border-red-500/20 text-red-400 px-2 py-0.5 rounded-full whitespace-nowrap">Non trouvé</span>
  }
  if (confidence >= 0.9) {
    return <span className="font-mono text-[10px] bg-green-500/10 border border-green-500/20 text-green-400 px-2 py-0.5 rounded-full whitespace-nowrap">{Math.round(confidence * 100)} %</span>
  }
  if (confidence >= 0.7) {
    return <span className="font-mono text-[10px] bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full whitespace-nowrap">{Math.round(confidence * 100)} %</span>
  }
  return <span className="font-mono text-[10px] bg-red-500/10 border border-red-500/20 text-red-400 px-2 py-0.5 rounded-full whitespace-nowrap">{Math.round(confidence * 100)} %</span>
}

export function Step3Matching({
  acheteurAnalysis, crmAnalysis,
  acheteurMappings, crmMappings,
  matches, onMatchesChange, onGenerate, onBack,
}: Props) {
  // Build parsed rows
  const acheteurPriceRows = useMemo<ParsedRow[]>(() => {
    const rows: ParsedRow[] = []
    for (const sheet of acheteurAnalysis.sheets) {
      if (sheet.isHidden) continue
      const mapping = acheteurMappings[sheet.sheetName] ?? sheet.mapping
      for (const raw of sheet.rawRows) {
        const row = applyMapping(raw, mapping, sheet.sheetName)
        if (!row.isTitle && !row.isSubtotal && row.designation) rows.push(row)
      }
    }
    return rows
  }, [acheteurAnalysis, acheteurMappings])

  const crmRows = useMemo<ParsedRow[]>(() => {
    const rows: ParsedRow[] = []
    for (const sheet of crmAnalysis.sheets) {
      if (sheet.isHidden) continue
      const mapping = crmMappings[sheet.sheetName] ?? sheet.mapping
      for (const raw of sheet.rawRows) {
        const row = applyMapping(raw, mapping, sheet.sheetName)
        if (!row.isTitle && !row.isSubtotal && row.designation) rows.push(row)
      }
    }
    return rows
  }, [crmAnalysis, crmMappings])

  const crmById = useMemo(() => {
    const m = new Map<string, ParsedRow>()
    for (const r of crmRows) m.set(r.id, r)
    return m
  }, [crmRows])

  const matchByAcheteurId = useMemo(() => {
    const m = new Map<string, MatchedRow>()
    for (const match of matches) m.set(match.acheteurRowId, match)
    return m
  }, [matches])

  const nbMatched = matches.filter(m => m.crmRowId !== null).length
  const nbTotal = acheteurPriceRows.length

  const updateMatch = (acheteurRowId: string, crmRowId: string | null) => {
    const crm = crmRowId ? crmById.get(crmRowId) : null
    const next = matches.map(m =>
      m.acheteurRowId === acheteurRowId
        ? { ...m, crmRowId, confidence: crmRowId ? 1.0 : 0, pu_ht_crm: crm?.pu_ht ?? null }
        : m
    )
    if (!next.find(m => m.acheteurRowId === acheteurRowId)) {
      next.push({ acheteurRowId, crmRowId, confidence: crmRowId ? 1.0 : 0, pu_ht_crm: crm?.pu_ht ?? null, quantityMismatch: false })
    }
    onMatchesChange(next)
  }

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="flex items-center gap-4 text-[13px] font-syne">
        <span className="text-text-muted">Rapprochées :</span>
        <span className="font-semibold text-text">{nbMatched} / {nbTotal}</span>
        {nbMatched < nbTotal && (
          <span className="font-mono text-[11px] text-yellow-400 bg-yellow-500/8 border border-yellow-500/20 px-2 py-0.5 rounded-full">
            {nbTotal - nbMatched} non rapprochées
          </span>
        )}
      </div>

      {/* Table */}
      <div className="border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border bg-surface">
                <th className="font-mono text-[10px] uppercase tracking-[0.1em] text-text-muted px-3 py-2.5 w-16">N°</th>
                <th className="font-mono text-[10px] uppercase tracking-[0.1em] text-text-muted px-3 py-2.5">Désignation acheteur</th>
                <th className="font-mono text-[10px] uppercase tracking-[0.1em] text-text-muted px-3 py-2.5">Ligne CRM proposée</th>
                <th className="font-mono text-[10px] uppercase tracking-[0.1em] text-text-muted px-3 py-2.5 w-24">Confiance</th>
                <th className="font-mono text-[10px] uppercase tracking-[0.1em] text-text-muted px-3 py-2.5 w-28 text-right">PU HT</th>
              </tr>
            </thead>
            <tbody>
              {acheteurPriceRows.map((aRow) => {
                const match = matchByAcheteurId.get(aRow.id)
                const crmRow = match?.crmRowId ? crmById.get(match.crmRowId) : null
                return (
                  <tr key={aRow.id} className="border-b border-border/50 last:border-0 hover:bg-surface/50">
                    <td className="px-3 py-2">
                      <span className="font-mono text-[11px] text-text-muted">{aRow.numero ?? '—'}</span>
                    </td>
                    <td className="px-3 py-2">
                      <p className="font-syne text-[12px] text-text leading-snug line-clamp-2">{aRow.designation}</p>
                      {match?.quantityMismatch && (
                        <p className="font-mono text-[10px] text-yellow-400 mt-0.5">Qtés différentes</p>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <select
                        value={match?.crmRowId ?? ''}
                        onChange={e => updateMatch(aRow.id, e.target.value || null)}
                        className="w-full bg-background border border-border rounded-lg px-2 py-1 font-syne text-[11px] text-text focus:outline-none focus:border-brand-amber"
                      >
                        <option value="">— Non rapproché</option>
                        {crmRows.map(cr => (
                          <option key={cr.id} value={cr.id}>
                            {cr.designation?.slice(0, 60)}{(cr.designation?.length ?? 0) > 60 ? '…' : ''}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <ConfidenceBadge confidence={match?.confidence ?? 0} matched={!!match?.crmRowId} />
                    </td>
                    <td className="px-3 py-2 text-right">
                      {match?.pu_ht_crm != null ? (
                        <span className="font-mono text-[12px] text-text">
                          {match.pu_ht_crm.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                        </span>
                      ) : (
                        <span className="font-mono text-[11px] text-text-muted">—</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="font-syne text-[13px] font-semibold px-5 py-2.5 rounded-xl border border-border text-text-muted hover:text-text hover:border-text-muted transition-colors"
        >
          ← Retour
        </button>
        <button
          onClick={onGenerate}
          className="font-syne text-[13px] font-semibold px-6 py-2.5 rounded-xl bg-brand-amber text-background hover:bg-brand-amber/90 transition-colors"
        >
          Générer le fichier chiffré →
        </button>
      </div>
    </div>
  )
}
