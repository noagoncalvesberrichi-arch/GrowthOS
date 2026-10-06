'use client'

import { useState } from 'react'
import type { FileAnalysis, ColumnMapping, ColumnRole } from '@/lib/chiffrage/types'
import { detectColumns } from '@/lib/chiffrage/columnDetection'

const ROLE_LABELS: Record<ColumnRole, string> = {
  numero: 'N° de poste',
  designation: 'Désignation *',
  unit: 'Unité',
  quantity: 'Quantité',
  pu_ht: 'Prix unitaire HT *',
  total_ht: 'Montant total HT',
}

const ROLES: ColumnRole[] = ['designation', 'pu_ht', 'total_ht', 'quantity', 'unit', 'numero']

type Props = {
  acheteurAnalysis: FileAnalysis
  crmAnalysis: FileAnalysis
  acheteurMappings: Record<string, ColumnMapping>
  crmMappings: Record<string, ColumnMapping>
  onMappingsChange: (am: Record<string, ColumnMapping>, cm: Record<string, ColumnMapping>) => void
  onAcheteurAnalysisChange: (newAnalysis: FileAnalysis) => void
  onContinue: () => Promise<void>
  onBack: () => void
}

function SheetMappingTable({
  fileName,
  sheetName,
  headerValues,
  mapping,
  ambiguous,
  onChange,
}: {
  fileName: string
  sheetName: string
  headerValues: string[]
  mapping: ColumnMapping
  ambiguous: boolean
  onChange: (role: ColumnRole, idx: number | undefined) => void
}) {
  return (
    <div className="bg-surface border border-border rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-mono text-[11px] text-text-muted">{fileName}</p>
          <p className="font-syne text-[13px] font-semibold text-text">{sheetName}</p>
        </div>
        {ambiguous && (
          <span className="font-mono text-[10px] text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 px-2 py-0.5 rounded-full">
            Détection incertaine
          </span>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {ROLES.map(role => (
          <div key={role} className="flex items-center gap-2">
            <label className="font-syne text-[11px] text-text-muted w-36 shrink-0">{ROLE_LABELS[role]}</label>
            <select
              value={mapping[role] ?? ''}
              onChange={e => {
                const val = e.target.value
                onChange(role, val === '' ? undefined : parseInt(val, 10))
              }}
              className="flex-1 bg-background border border-border rounded-lg px-2 py-1 font-syne text-[12px] text-text focus:outline-none focus:border-brand-amber"
            >
              <option value="">— Non utilisé</option>
              {headerValues.map((h, i) => (
                <option key={i} value={i}>{h || `Colonne ${i + 1}`}</option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </div>
  )
}

export function Step2Mapping({
  acheteurAnalysis, crmAnalysis,
  acheteurMappings, crmMappings,
  onMappingsChange, onAcheteurAnalysisChange, onContinue, onBack,
}: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateAcheteur = (sheetName: string, role: ColumnRole, idx: number | undefined) => {
    const next = { ...acheteurMappings, [sheetName]: { ...acheteurMappings[sheetName], [role]: idx } }
    if (idx === undefined) delete next[sheetName][role]
    onMappingsChange(next, crmMappings)
  }
  const updateCrm = (sheetName: string, role: ColumnRole, idx: number | undefined) => {
    const next = { ...crmMappings, [sheetName]: { ...crmMappings[sheetName], [role]: idx } }
    if (idx === undefined) delete next[sheetName][role]
    onMappingsChange(acheteurMappings, next)
  }

  const handleContinue = async () => {
    setLoading(true)
    setError(null)
    try {
      await onContinue()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur lors du rapprochement.')
    } finally {
      setLoading(false)
    }
  }

  const visibleAcheteur = acheteurAnalysis.sheets.filter(s => !s.isHidden)
  const visibleCrm = crmAnalysis.sheets.filter(s => !s.isHidden)

  // Detect if any acheteur sheet has the PU column mapped.
  // A blank DPGF (all PU cells empty) is valid — we're filling it. Only warn when the column itself is unmapped.
  const hasPriceData = visibleAcheteur.some(sheet => {
    const mapping = acheteurMappings[sheet.sheetName] ?? sheet.mapping
    return mapping.pu_ht !== undefined && mapping.designation !== undefined
  })

  const handleHeaderOverride = (sheetName: string, rawRowIdx: number) => {
    const sheet = acheteurAnalysis.sheets.find(s => s.sheetName === sheetName)
    if (!sheet || rawRowIdx < 0 || rawRowIdx >= sheet.rawRows.length) return
    const newHeaderValues = sheet.rawRows[rawRowIdx].values.map(v => String(v ?? ''))
    const newMapping = detectColumns(newHeaderValues)
    const newSheets = acheteurAnalysis.sheets.map(s =>
      s.sheetName === sheetName
        ? { ...s, headerValues: newHeaderValues, mapping: newMapping, mappingAmbiguous: false }
        : s
    )
    onAcheteurAnalysisChange({ ...acheteurAnalysis, sheets: newSheets })
    onMappingsChange({ ...acheteurMappings, [sheetName]: newMapping }, crmMappings)
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <p className="font-syne text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted">
          Bordereau de l&apos;acheteur
        </p>
        {visibleAcheteur.map(sheet => (
          <SheetMappingTable
            key={sheet.sheetName}
            fileName={acheteurAnalysis.fileName}
            sheetName={sheet.sheetName}
            headerValues={sheet.headerValues}
            mapping={acheteurMappings[sheet.sheetName] ?? sheet.mapping}
            ambiguous={sheet.mappingAmbiguous}
            onChange={(role, idx) => updateAcheteur(sheet.sheetName, role, idx)}
          />
        ))}
      </div>

      <div className="space-y-3">
        <p className="font-syne text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted">
          Export CRM
        </p>
        {visibleCrm.map(sheet => (
          <SheetMappingTable
            key={sheet.sheetName}
            fileName={crmAnalysis.fileName}
            sheetName={sheet.sheetName}
            headerValues={sheet.headerValues}
            mapping={crmMappings[sheet.sheetName] ?? sheet.mapping}
            ambiguous={sheet.mappingAmbiguous}
            onChange={(role, idx) => updateCrm(sheet.sheetName, role, idx)}
          />
        ))}
      </div>

      {!hasPriceData && visibleAcheteur.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-4 space-y-3">
          <p className="font-syne text-[13px] text-amber-800">
            <strong>Aucune valeur de prix détectée</strong> dans le bordereau acheteur. La ligne d&apos;en-tête a peut-être été mal identifiée.
            Sélectionnez la ligne qui contient les intitulés de colonnes :
          </p>
          {visibleAcheteur.map(sheet => (
            <div key={sheet.sheetName} className="space-y-1">
              <p className="font-syne text-[11px] font-semibold text-amber-700 uppercase tracking-wide">{sheet.sheetName}</p>
              <select
                defaultValue=""
                onChange={e => handleHeaderOverride(sheet.sheetName, parseInt(e.target.value, 10))}
                className="w-full bg-white border border-amber-300 rounded-lg px-3 py-1.5 font-syne text-[12px] text-text focus:outline-none focus:border-amber-500"
              >
                <option value="">— Choisir la ligne d&apos;en-tête</option>
                {sheet.rawRows.slice(0, 15).map((row, idx) => {
                  const preview = row.values.slice(0, 8).map(v => String(v ?? '')).filter(Boolean).join(' | ')
                  return (
                    <option key={idx} value={idx}>
                      Ligne {row.rowIndex}: {preview.slice(0, 80) || '(vide)'}
                    </option>
                  )
                })}
              </select>
            </div>
          ))}
        </div>
      )}

      {error && (
        <p className="font-syne text-[13px] text-red-400 bg-red-500/8 border border-red-500/20 rounded-xl px-4 py-3">{error}</p>
      )}

      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="font-syne text-[13px] font-semibold px-5 py-2.5 rounded-xl border border-border text-text-muted hover:text-text hover:border-text-muted transition-colors"
        >
          ← Retour
        </button>
        <button
          onClick={handleContinue}
          disabled={loading}
          className="font-syne text-[13px] font-semibold px-6 py-2.5 rounded-xl bg-brand-amber text-background hover:bg-brand-amber/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          {loading && (
            <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0" opacity="0.3" /><path d="M21 12a9 9 0 00-9-9" /></svg>
          )}
          {loading ? 'Rapprochement en cours…' : 'Continuer →'}
        </button>
      </div>
    </div>
  )
}
