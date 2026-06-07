'use client'

import { useState, useTransition, useRef } from 'react'
import { extractionNomenclature, type ExtractionNomenclatureState, type LigneNomenclature } from './actions'

function DownloadIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

async function exportToExcel(data: LigneNomenclature[]) {
  const XLSX = await import('xlsx')

  const exportData = data.map(row => ({
    'REPÈRE': row.repere,
    'QUANTITÉ': row.quantite,
    'DÉSIGNATION': row.designation,
    'RÉFÉRENCE': row.reference,
    'FABRICANT': row.fabricant,
    'PRIX UNITAIRE (€)': '',
    'TOTAL (€)': '',
  }))

  const ws = XLSX.utils.json_to_sheet(exportData)
  ws['!cols'] = [
    { wch: 10 },
    { wch: 8 },
    { wch: 45 },
    { wch: 22 },
    { wch: 15 },
    { wch: 18 },
    { wch: 12 },
  ]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Nomenclature')

  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' }) as ArrayBuffer
  const blob = new Blob([wbout], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'nomenclature.xlsx'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function ExportButton({ data }: { data: LigneNomenclature[] }) {
  return (
    <button
      onClick={() => exportToExcel(data)}
      className="inline-flex items-center gap-2 font-syne text-[13px] font-bold text-white bg-accent hover:bg-accent-dark px-4 py-2 rounded-xl transition-all duration-200 shadow-[0_4px_12px_rgba(37,99,235,0.2)]"
    >
      <DownloadIcon />
      Télécharger en Excel
    </button>
  )
}

function NomenclatureTable({ data }: { data: LigneNomenclature[] }) {
  return (
    <div className="rounded-xl overflow-hidden border border-border shadow-[0_2px_8px_rgba(37,99,235,0.04)]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px]">
          <thead>
            <tr style={{ background: 'linear-gradient(180deg, #0C1647, #0F1B4D)' }}>
              {['Repère', 'Qté', 'Désignation', 'Référence', 'Fabricant'].map((col, i) => (
                <th
                  key={col}
                  className={`px-3 py-3 text-left font-syne text-[10px] font-bold uppercase tracking-wider text-white/70 ${i === 0 ? 'pl-4' : ''} ${i === 4 ? 'pr-4' : ''}`}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr
                key={i}
                className={`border-b border-border last:border-0 transition-colors duration-100 hover:bg-accent-subtle/20 ${i % 2 === 0 ? 'bg-surface' : 'bg-background'}`}
              >
                <td className="px-3 py-2.5 pl-4 font-mono text-[12px] text-text font-medium whitespace-nowrap">
                  {row.repere || <span className="text-text-subtle/50">—</span>}
                </td>
                <td className="px-3 py-2.5 font-syne text-[13px] text-text whitespace-nowrap">
                  {row.quantite || <span className="text-text-subtle/50">—</span>}
                </td>
                <td className="px-3 py-2.5 font-syne text-[13px] text-text">
                  {row.designation || <span className="text-text-subtle/50">—</span>}
                </td>
                <td className="px-3 py-2.5 font-mono text-[12px] text-text-muted whitespace-nowrap">
                  {row.reference || <span className="text-text-subtle/50">—</span>}
                </td>
                <td className="px-3 py-2.5 pr-4 font-syne text-[13px] text-text-muted whitespace-nowrap">
                  {row.fabricant || <span className="text-text-subtle/50">—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function ChiffrageForm() {
  const [files, setFiles] = useState<File[]>([])
  const [result, setResult] = useState<ExtractionNomenclatureState>(null)
  const [isPending, startTransition] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files ?? [])
    if (newFiles.length === 0) return
    setFiles(prev => {
      const existingNames = new Set(prev.map(f => f.name))
      return [...prev, ...newFiles.filter(f => !existingNames.has(f.name))]
    })
    setResult(null)
    e.target.value = ''
  }

  const removeFile = (name: string) => {
    setFiles(prev => prev.filter(f => f.name !== name))
    setResult(null)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (files.length === 0) return
    const fd = new FormData()
    files.forEach(f => fd.append('files', f))
    startTransition(async () => {
      const res = await extractionNomenclature(fd)
      setResult(res)
    })
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Zone de dépôt */}
        <div
          onClick={() => !isPending && inputRef.current?.click()}
          className={`rounded-2xl border-2 border-dashed px-5 py-10 sm:px-8 sm:py-12 flex flex-col items-center justify-center text-center transition-all duration-200
            ${isPending
              ? 'border-border bg-background cursor-not-allowed opacity-60'
              : 'cursor-pointer border-border bg-surface hover:border-accent hover:bg-accent-subtle/30 hover:shadow-[0_0_0_4px_rgba(37,99,235,0.06)]'
            }`}
        >
          <div
            className="rounded-xl flex items-center justify-center mb-4"
            style={{ background: isPending ? undefined : 'linear-gradient(135deg, #EFF6FF, #DBEAFE)', width: 52, height: 52 }}
          >
            {isPending ? (
              <svg className="animate-spin w-5 h-5 text-accent" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <line x1="3" y1="9" x2="21" y2="9" />
                <line x1="3" y1="15" x2="21" y2="15" />
                <line x1="9" y1="9" x2="9" y2="21" />
              </svg>
            )}
          </div>

          {isPending ? (
            <p className="font-syne text-[14px] font-semibold text-text">Extraction en cours…</p>
          ) : (
            <>
              <p className="font-syne text-[14px] font-semibold text-text">
                {files.length > 0 ? "Ajouter d'autres fichiers" : 'Dépose ton PDF de nomenclature ici ou clique pour sélectionner'}
              </p>
              <p className="font-syne text-[12px] text-text-subtle mt-1">
                PDF avec texte sélectionnable · tableau REPÈRE / QTÉ / DÉSIGNATION
              </p>
            </>
          )}

          <input
            ref={inputRef}
            type="file"
            accept=".pdf,application/pdf"
            multiple
            onChange={handleChange}
            className="hidden"
            disabled={isPending}
          />
        </div>

        {/* Liste des fichiers */}
        {files.length > 0 && !isPending && (
          <ul className="space-y-2">
            {files.map((f) => (
              <li
                key={f.name}
                className="flex items-center justify-between gap-3 bg-surface border border-border rounded-xl px-4 py-2.5 shadow-[0_1px_4px_rgba(0,0,0,0.04)]"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-accent-subtle flex items-center justify-center shrink-0">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                  </div>
                  <span className="font-syne text-[13px] text-text truncate">{f.name}</span>
                  <span className="font-syne text-[11px] text-text-subtle shrink-0">
                    {(f.size / 1024 / 1024).toFixed(2)} Mo
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => removeFile(f.name)}
                  className="shrink-0 w-6 h-6 rounded-md flex items-center justify-center text-text-subtle hover:text-red-500 hover:bg-red-50 transition-all duration-150"
                  aria-label={`Retirer ${f.name}`}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        )}

        <button
          type="submit"
          disabled={files.length === 0 || isPending}
          className="group relative w-full py-3.5 bg-accent hover:bg-accent-dark text-white font-syne font-bold text-[14px] rounded-xl transition-all duration-200 overflow-hidden shadow-[0_4px_16px_rgba(37,99,235,0.25)] disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
        >
          <span
            aria-hidden="true"
            className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/15 to-transparent"
          />
          <span className="relative">
            {isPending ? 'Extraction en cours…' : 'Extraire la nomenclature →'}
          </span>
        </button>
      </form>

      {/* Erreur */}
      {result && 'error' in result && (
        <div className="mt-6 bg-red-50 border border-red-200 rounded-xl px-5 py-4">
          <p className="font-syne text-[13px] font-semibold text-red-600">{result.error}</p>
        </div>
      )}

      {/* Résultats */}
      {result && 'data' in result && (
        <div className="mt-6 space-y-4">

          {/* Barre de stats + export */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="inline-flex items-center gap-1.5 font-syne text-[13px] font-semibold text-text">
                <span className="w-5 h-5 rounded-full bg-accent flex items-center justify-center shrink-0">
                  <CheckIcon />
                </span>
                {result.data.length} ligne{result.data.length > 1 ? 's' : ''} extraite{result.data.length > 1 ? 's' : ''}
              </span>
              {result.fichiers_illisibles.length > 0 && (
                <span className="font-syne text-[12px] text-amber-600">
                  ⚠ {result.fichiers_illisibles.length} fichier{result.fichiers_illisibles.length > 1 ? 's' : ''} illisible{result.fichiers_illisibles.length > 1 ? 's' : ''} ignoré{result.fichiers_illisibles.length > 1 ? 's' : ''}
                </span>
              )}
            </div>
            <ExportButton data={result.data} />
          </div>

          {/* Tableau */}
          <NomenclatureTable data={result.data} />

          {/* Second bouton export pour les longues nomenclatures */}
          {result.data.length > 15 && (
            <div className="flex justify-end pt-1">
              <ExportButton data={result.data} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
