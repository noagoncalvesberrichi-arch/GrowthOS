'use client'

import { useState, useTransition, useRef } from 'react'
import { analyserAO, type AnalyserAOState } from './actions'
import { AOResultDisplay } from './AOResultDisplay'

export function UploadForm() {
  const [file, setFile] = useState<File | null>(null)
  const [result, setResult] = useState<AnalyserAOState>(null)
  const [isPending, startTransition] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] ?? null
    setFile(selected)
    setResult(null)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return
    const fd = new FormData()
    fd.append('file', file)
    startTransition(async () => {
      const res = await analyserAO(fd)
      setResult(res)
    })
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Drop zone */}
        <div
          onClick={() => !isPending && inputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl px-8 py-12 flex flex-col items-center justify-center text-center transition-colors duration-200
            ${isPending
              ? 'border-border bg-background cursor-not-allowed opacity-60'
              : 'cursor-pointer border-border hover:border-accent bg-background hover:bg-accent-subtle/30'
            }`}
        >
          <div className="w-12 h-12 rounded-xl bg-surface border border-border flex items-center justify-center mb-4">
            {isPending ? (
              <svg className="animate-spin w-5 h-5 text-accent" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-text-muted">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="12" y1="18" x2="12" y2="12" />
                <line x1="9" y1="15" x2="15" y2="15" />
              </svg>
            )}
          </div>

          {isPending ? (
            <p className="font-syne text-[14px] font-semibold text-text">Analyse en cours…</p>
          ) : file ? (
            <>
              <p className="font-syne text-[14px] font-semibold text-text">{file.name}</p>
              <p className="font-syne text-[12px] text-text-subtle mt-1">
                {(file.size / 1024 / 1024).toFixed(2)} Mo · Cliquer pour changer
              </p>
            </>
          ) : (
            <>
              <p className="font-syne text-[14px] font-semibold text-text">
                Dépose ton PDF ici ou clique pour sélectionner
              </p>
              <p className="font-syne text-[12px] text-text-subtle mt-1">PDF uniquement · 20 Mo max</p>
            </>
          )}

          <input
            ref={inputRef}
            type="file"
            accept=".pdf,application/pdf"
            onChange={handleChange}
            className="hidden"
            disabled={isPending}
          />
        </div>

        <button
          type="submit"
          disabled={!file || isPending}
          className="group relative w-full py-3 bg-accent hover:bg-accent-dark text-white font-syne font-bold text-[14px] rounded-xl transition-all duration-200 overflow-hidden shadow-card disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <span
            aria-hidden="true"
            className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/15 to-transparent"
          />
          <span className="relative">
            {isPending ? 'Analyse en cours…' : 'Analyser →'}
          </span>
        </button>
      </form>

      {/* Erreur */}
      {result && 'error' in result && (
        <div className="mt-6 bg-red-50 border border-red-200 rounded-xl px-5 py-4">
          <p className="font-syne text-[13px] font-semibold text-red-600">{result.error}</p>
        </div>
      )}

      {/* Résultat */}
      {result && 'data' in result && <AOResultDisplay data={result.data} meta={result.meta} />}
    </div>
  )
}
