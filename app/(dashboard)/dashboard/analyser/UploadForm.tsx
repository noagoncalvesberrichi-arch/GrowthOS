'use client'

import { useState, useRef } from 'react'

export function UploadForm() {
  const [file, setFile] = useState<File | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] ?? null
    setFile(selected)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Traitement à implémenter
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Drop zone */}
      <div
        onClick={() => inputRef.current?.click()}
        className="cursor-pointer border-2 border-dashed border-border hover:border-accent rounded-2xl px-8 py-12 flex flex-col items-center justify-center text-center transition-colors duration-200 bg-background hover:bg-accent-subtle/30"
      >
        <div className="w-12 h-12 rounded-xl bg-surface border border-border flex items-center justify-center mb-4">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-text-muted">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="12" y1="18" x2="12" y2="12" />
            <line x1="9" y1="15" x2="15" y2="15" />
          </svg>
        </div>

        {file ? (
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
        />
      </div>

      <button
        type="submit"
        disabled={!file}
        className="group relative w-full py-3 bg-accent hover:bg-accent-dark text-white font-syne font-bold text-[14px] rounded-xl transition-all duration-200 overflow-hidden shadow-card disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <span
          aria-hidden="true"
          className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/15 to-transparent"
        />
        <span className="relative">Analyser →</span>
      </button>
    </form>
  )
}
