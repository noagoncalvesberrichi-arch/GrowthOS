'use client'

import { useState, useTransition, useRef } from 'react'
import { analyserAO, type AnalyserAOState } from './actions'
import { AOResultDisplay } from './AOResultDisplay'

export function UploadForm() {
  const [files, setFiles] = useState<File[]>([])
  const [result, setResult] = useState<AnalyserAOState>(null)
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

    // Guard: Vercel Hobby infrastructure cap ~4.5 MB
    const MAX_UPLOAD_BYTES = 4 * 1024 * 1024
    const totalSize = files.reduce((acc, f) => acc + f.size, 0)
    if (totalSize > MAX_UPLOAD_BYTES) {
      setResult({
        error:
          'Ce dossier est trop volumineux pour être analysé en une fois. Déposez les documents principaux (RC, CCTP, CCAP) séparément.',
      })
      return
    }

    const fd = new FormData()
    files.forEach(f => fd.append('files', f))
    startTransition(async () => {
      try {
        const res = await analyserAO(fd)
        setResult(res)
      } catch {
        setResult({
          error:
            "L'analyse a expiré ou une erreur réseau s'est produite. Si le dossier est volumineux, déposez les documents principaux séparément et réessayez.",
        })
      }
    })
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Drop zone */}
        <div
          onClick={() => !isPending && inputRef.current?.click()}
          className={`rounded-2xl border-2 border-dashed px-5 py-10 sm:px-8 sm:py-12 flex flex-col items-center justify-center text-center transition-all duration-200
            ${isPending
              ? 'border-border bg-background cursor-not-allowed opacity-60'
              : 'cursor-pointer border-border bg-surface hover:border-accent hover:bg-accent-subtle/30 hover:shadow-[0_0_0_4px_rgba(37,99,235,0.06)]'
            }`}
        >
          <div
            className="w-13 h-13 rounded-xl flex items-center justify-center mb-4"
            style={{ background: isPending ? undefined : 'linear-gradient(135deg, #EFF6FF, #DBEAFE)', width: 52, height: 52 }}
          >
            {isPending ? (
              <svg className="animate-spin w-5 h-5 text-accent" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="12" y1="18" x2="12" y2="12" />
                <line x1="9" y1="15" x2="15" y2="15" />
              </svg>
            )}
          </div>

          {isPending ? (
            <p className="font-syne text-[14px] font-semibold text-text">Analyse en cours…</p>
          ) : (
            <>
              <p className="font-syne text-[14px] font-semibold text-text">
                {files.length > 0 ? "Ajouter d'autres fichiers" : 'Dépose tes PDFs ici ou clique pour sélectionner'}
              </p>
              <p className="font-syne text-[12px] text-text-subtle mt-1">
                PDF uniquement · Plusieurs fichiers acceptés (RC, CCTP, CCAP…)
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

        {/* File list */}
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
            {isPending
              ? 'Analyse en cours…'
              : files.length > 1
                ? `Analyser ${files.length} fichiers →`
                : 'Analyser →'
            }
          </span>
        </button>
      </form>

      {/* Erreur */}
      {result && 'error' in result && (
        <div className="mt-6 bg-red-50 border border-red-200 rounded-xl px-5 py-4">
          <p className="font-syne text-[13px] font-semibold text-red-600">{result.error}</p>
        </div>
      )}

      {/* Quota atteint */}
      {result && 'quota_atteint' in result && (
        <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl px-5 py-5 space-y-3">
          <p className="font-syne text-[14px] font-bold text-amber-800">
            Quota d&apos;analyses atteint
          </p>
          <p className="font-syne text-[13px] text-amber-700">
            Tu as utilisé {result.analyses_utilisees} analyse{result.analyses_utilisees > 1 ? 's' : ''} sur {result.quota_gratuit} disponibles dans le plan gratuit.
          </p>
          <a
            href="/pricing"
            className="inline-block font-syne text-[13px] font-bold text-white bg-accent hover:bg-accent-dark px-5 py-2.5 rounded-lg transition-colors duration-150"
          >
            Passer au plan Pro →
          </a>
        </div>
      )}

      {/* Analyses restantes (avertissement) */}
      {result && 'data' in result && result.analyses_restantes !== undefined && result.analyses_restantes <= 1 && (
        <div className="mt-4 flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <p className="font-syne text-[12px] text-amber-800">
            {result.analyses_restantes === 0
              ? <>C&apos;était ta dernière analyse gratuite. <a href="/pricing" className="font-semibold underline underline-offset-2 hover:text-amber-900">Passe au Pro</a> pour continuer.</>
              : <>Il te reste <span className="font-semibold">1 analyse gratuite</span>. <a href="/pricing" className="font-semibold underline underline-offset-2 hover:text-amber-900">Voir les offres</a>.</>
            }
          </p>
        </div>
      )}

      {/* Résultat — NE PAS MODIFIER */}
      {result && 'data' in result && (
        <div className="overflow-x-auto">
          <AOResultDisplay data={result.data} meta={result.meta} />
        </div>
      )}
    </div>
  )
}
