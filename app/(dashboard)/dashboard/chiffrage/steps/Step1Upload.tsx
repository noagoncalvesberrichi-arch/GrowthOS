'use client'

import { useState, useRef, DragEvent } from 'react'
import type { FileAnalysis } from '@/lib/chiffrage/types'

type Props = {
  onComplete: (acheteur: FileAnalysis, crm: FileAnalysis, acheteurFile: File, crmFile: File) => void
}

function FileDrop({
  label,
  hint,
  accept,
  file,
  onFile,
  onClear,
}: {
  label: string
  hint: string
  accept: string
  file: File | null
  onFile: (f: File) => void
  onClear: () => void
}) {
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDrop = (e: DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) onFile(f)
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => !file && inputRef.current?.click()}
      className={`relative flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-8 transition-colors cursor-pointer
        ${dragging ? 'border-brand-amber bg-brand-amber/5' : file ? 'border-border bg-surface cursor-default' : 'border-border hover:border-brand-amber/50 bg-surface'}`}
    >
      <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f) }} />

      {file ? (
        <div className="flex items-center gap-3 w-full">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-brand-amber shrink-0">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" />
          </svg>
          <div className="flex-1 min-w-0">
            <p className="font-syne text-[13px] font-semibold text-text truncate">{file.name}</p>
            <p className="font-mono text-[11px] text-text-muted">{(file.size / 1024).toFixed(0)} Ko</p>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onClear() }}
            className="font-syne text-[11px] text-text-muted hover:text-red-400 transition-colors"
          >
            Supprimer
          </button>
        </div>
      ) : (
        <>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-text-muted">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          <div className="text-center">
            <p className="font-syne text-[13px] font-semibold text-text">{label}</p>
            <p className="font-mono text-[11px] text-text-muted mt-0.5">{hint}</p>
          </div>
        </>
      )}
    </div>
  )
}

export function Step1Upload({ onComplete }: Props) {
  const [acheteurFile, setAcheteurFile] = useState<File | null>(null)
  const [crmFile, setCrmFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canSubmit = acheteurFile && crmFile && !loading

  const handleAnalyse = async () => {
    if (!acheteurFile || !crmFile) return
    setLoading(true)
    setError(null)
    try {
      const fd = new FormData()
      fd.append('acheteur', acheteurFile)
      fd.append('crm', crmFile)
      const res = await fetch('/api/chiffrage/analyser', { method: 'POST', body: fd })
      const data = await res.json()
      if (data.error) { setError(data.error); return }
      onComplete(data.acheteur, data.crm, acheteurFile, crmFile)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur inattendue.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <p className="font-syne text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted">
            Bordereau de l&apos;acheteur
          </p>
          <FileDrop
            label="Déposer le fichier DPGF / DQE / BPU"
            hint=".xlsx — max 10 Mo"
            accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            file={acheteurFile}
            onFile={setAcheteurFile}
            onClear={() => setAcheteurFile(null)}
          />
        </div>
        <div className="space-y-2">
          <p className="font-syne text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted">
            Export CRM
          </p>
          <FileDrop
            label="Déposer l&apos;export de votre CRM"
            hint=".xlsx / .csv — max 10 Mo"
            accept=".xlsx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
            file={crmFile}
            onFile={setCrmFile}
            onClear={() => setCrmFile(null)}
          />
        </div>
      </div>

      {error && (
        <p className="font-syne text-[13px] text-red-400 bg-red-500/8 border border-red-500/20 rounded-xl px-4 py-3">{error}</p>
      )}

      <div className="flex justify-end">
        <button
          onClick={handleAnalyse}
          disabled={!canSubmit}
          className="font-syne text-[13px] font-semibold px-6 py-2.5 rounded-xl bg-brand-amber text-background hover:bg-brand-amber/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          {loading && (
            <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0" opacity="0.3" /><path d="M21 12a9 9 0 00-9-9" />
            </svg>
          )}
          {loading ? 'Analyse en cours…' : 'Analyser les fichiers'}
        </button>
      </div>
    </div>
  )
}
