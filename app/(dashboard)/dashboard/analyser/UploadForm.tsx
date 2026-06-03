'use client'

import { useState, useTransition, useRef } from 'react'
import { analyserAO, type AOResult, type AOMetadata, type AnalyserAOState } from './actions'

// ─── Result display ───────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <div className="bg-background px-5 py-3 border-b border-border">
        <p className="font-syne text-[12px] font-bold text-text-muted uppercase tracking-wider">{title}</p>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  )
}

function AOResultDisplay({ data, meta }: { data: AOResult; meta: AOMetadata }) {
  return (
    <div className="space-y-4 mt-8">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-2 h-2 rounded-full bg-accent" />
        <p className="font-syne text-[12px] font-bold text-accent uppercase tracking-wider">Analyse terminée</p>
      </div>

      {meta.tronque && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <span className="text-amber-500 text-[15px] shrink-0 mt-0.5">⚠️</span>
          <p className="font-syne text-[13px] text-amber-800 leading-relaxed">
            <span className="font-semibold">Document volumineux</span> — l&apos;analyse porte sur les premières sections ({Math.round(meta.chars_traites / 1000)}k/{Math.round(meta.chars_total / 1000)}k caractères). Certaines informations en fin de dossier peuvent ne pas être prises en compte.
          </p>
        </div>
      )}

      {/* Objet + meta */}
      <Section title="Marché">
        <p className="font-syne text-[15px] font-bold text-text mb-3">{data.objet}</p>
        <div className="flex flex-wrap gap-3">
          <span className="font-syne text-[12px] bg-background border border-border rounded-lg px-3 py-1.5 text-text-muted">
            <span className="font-semibold text-text">Procédure : </span>{data.type_procedure}
          </span>
          <span className="font-syne text-[12px] bg-background border border-border rounded-lg px-3 py-1.5 text-text-muted">
            <span className="font-semibold text-text">Acheteur : </span>{data.acheteur}
          </span>
        </div>
      </Section>

      {/* Dates clés */}
      <Section title="Dates clés">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'Limite remise offres', value: data.dates_cles.date_limite_offres },
            { label: 'Visite du site', value: data.dates_cles.visite },
            { label: 'Validité des offres', value: data.dates_cles.validite_offres },
          ].map(({ label, value }) => (
            <div key={label} className="bg-background border border-border rounded-lg p-3">
              <p className="font-syne text-[11px] text-text-subtle mb-1">{label}</p>
              <p className="font-syne text-[13px] font-semibold text-text">{value ?? '—'}</p>
            </div>
          ))}
        </div>
        {data.dates_cles.autres_dates.length > 0 && (
          <div className="mt-4 space-y-1.5">
            {data.dates_cles.autres_dates.map(({ libelle, date }) => (
              <div key={libelle} className="flex items-baseline justify-between gap-4 py-1 border-b border-border last:border-0">
                <p className="font-syne text-[12px] text-text-muted">{libelle}</p>
                <p className="font-syne text-[12px] font-semibold text-text shrink-0">{date}</p>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Lots */}
      {data.lots.length > 0 && (
        <Section title={`Lots (${data.lots.length})`}>
          <div className="space-y-2">
            {data.lots.map((lot) => (
              <div key={lot.numero} className="flex items-start justify-between gap-4 py-2 border-b border-border last:border-0">
                <div className="flex items-start gap-3">
                  <span className="font-syne text-[11px] font-bold bg-accent-subtle text-accent px-2 py-0.5 rounded-md shrink-0 mt-0.5">
                    {lot.numero.toLowerCase().startsWith('lot') ? lot.numero : `Lot ${lot.numero}`}
                  </span>
                  <p className="font-syne text-[13px] text-text">{lot.designation}</p>
                </div>
                {lot.estimation && (
                  <p className="font-syne text-[13px] font-semibold text-text shrink-0">{lot.estimation}</p>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Critères de notation */}
      {data.criteres_notation.length > 0 && (
        <Section title="Critères de notation">
          <div className="space-y-2">
            {data.criteres_notation.map((c) => (
              <div key={c.critere} className="flex items-center justify-between gap-4 py-1.5">
                <p className="font-syne text-[13px] text-text-muted">{c.critere}</p>
                <span className="font-syne text-[13px] font-bold text-accent shrink-0">{c.ponderation}</span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Pièces à fournir */}
      {data.pieces_a_fournir.length > 0 && (
        <Section title={`Pièces à fournir (${data.pieces_a_fournir.length})`}>
          <ul className="space-y-1.5">
            {data.pieces_a_fournir.map((piece) => (
              <li key={piece} className="flex items-start gap-2.5">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-[2px]">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span className="font-syne text-[13px] text-text-muted">{piece}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Points de vigilance */}
      {data.points_de_vigilance.length > 0 && (
        <Section title="Points de vigilance">
          <ul className="space-y-2">
            {data.points_de_vigilance.map((point) => (
              <li key={point} className="flex items-start gap-2.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-[1px]">
                  <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                <span className="font-syne text-[13px] text-text-muted">{point}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  )
}

// ─── Main form ────────────────────────────────────────────────────────────────

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
