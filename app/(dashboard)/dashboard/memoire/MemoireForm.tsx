'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import { genererMemoire, sauvegarderMemoire, chargerMemoire } from './actions'
import type { AnalyseItem } from './page'

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

function DownloadIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  )
}

function downloadTxt(content: string, objet: string) {
  const filename = `trame-memoire-${objet.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 40)}.txt`
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

const INPUT_CLASS =
  'w-full bg-background border border-border rounded-xl px-4 py-3 font-syne text-[14px] text-text placeholder:text-text-subtle focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition-all duration-150'

export function MemoireForm({ analyses }: { analyses: AnalyseItem[] }) {
  const [mode, setMode] = useState<'analyse' | 'manuel'>(analyses.length > 0 ? 'analyse' : 'manuel')
  const [selectedAnalyseId, setSelectedAnalyseId] = useState(analyses[0]?.id ?? '')
  const [descriptionMarche, setDescriptionMarche] = useState('')
  const [trame, setTrame] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Prevents a debounce-save from firing when trame is set programmatically (load or generation)
  const skipNextSaveRef = useRef(false)

  // Load saved memoire when the selected analysis changes
  useEffect(() => {
    if (mode !== 'analyse' || !selectedAnalyseId) return
    skipNextSaveRef.current = true
    setTrame('')
    setSaveStatus('idle')
    chargerMemoire(selectedAnalyseId).then(res => {
      if (res.contenu) setTrame(res.contenu)
    })
  }, [mode, selectedAnalyseId])

  // Debounced auto-save on every trame edit (analyse mode only)
  useEffect(() => {
    if (!trame || mode !== 'analyse' || !selectedAnalyseId) return
    if (skipNextSaveRef.current) {
      skipNextSaveRef.current = false
      return
    }
    setSaveStatus('saving')
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(async () => {
      const res = await sauvegarderMemoire(selectedAnalyseId, trame)
      setSaveStatus(res.ok ? 'saved' : 'error')
    }, 1500)
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [trame, mode, selectedAnalyseId])

  const handleGenerer = () => {
    setError(null)
    setTrame('')
    setSaveStatus('idle')
    // Server action will save on generation — skip the subsequent debounce
    if (mode === 'analyse' && selectedAnalyseId) {
      skipNextSaveRef.current = true
    }
    startTransition(async () => {
      try {
        const res = await genererMemoire(
          mode === 'analyse' ? (selectedAnalyseId || null) : null,
          mode === 'manuel' ? descriptionMarche : null
        )
        if ('error' in res) {
          setError(res.error)
          skipNextSaveRef.current = false
        } else {
          setTrame(res.trame)
          if (mode === 'analyse' && selectedAnalyseId) setSaveStatus('saved')
        }
      } catch {
        setError("La génération a expiré ou une erreur réseau s'est produite. Réessaie.")
        skipNextSaveRef.current = false
      }
    })
  }

  const canSubmit = mode === 'analyse'
    ? !!selectedAnalyseId
    : descriptionMarche.trim().length >= 20

  const trameLabel = mode === 'analyse'
    ? (analyses.find(a => a.id === selectedAnalyseId)?.objet_marche ?? 'marche')
    : descriptionMarche.slice(0, 50)

  return (
    <div className="space-y-6">

      {/* ── Sélecteur de mode ── */}
      <div className="bg-surface border border-border rounded-2xl p-6 sm:p-8 space-y-5">
        <p className="font-syne text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-amber">
          Source du marché
        </p>

        <div className="flex rounded-xl border border-border overflow-hidden text-[13px] font-syne font-semibold">
          <button
            type="button"
            onClick={() => setMode('analyse')}
            className={`flex-1 py-2.5 px-3 transition-colors duration-150 ${
              mode === 'analyse'
                ? 'bg-accent text-white'
                : 'bg-surface text-text-muted hover:bg-accent-subtle/30'
            }`}
          >
            Depuis une analyse sauvegardée
          </button>
          <button
            type="button"
            onClick={() => setMode('manuel')}
            className={`flex-1 py-2.5 px-3 border-l border-border transition-colors duration-150 ${
              mode === 'manuel'
                ? 'bg-accent text-white'
                : 'bg-surface text-text-muted hover:bg-accent-subtle/30'
            }`}
          >
            Décrire le marché
          </button>
        </div>

        {mode === 'analyse' && (
          analyses.length === 0 ? (
            <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3">
              <p className="font-syne text-[13px] text-amber-700">
                Aucune analyse sauvegardée. Analysez un AO d&apos;abord, ou décrivez le marché manuellement.
              </p>
            </div>
          ) : (
            <div>
              <label className="block font-syne text-[11px] font-semibold uppercase tracking-widest text-text-subtle mb-2">
                Sélectionner une analyse
              </label>
              <select
                value={selectedAnalyseId}
                onChange={e => setSelectedAnalyseId(e.target.value)}
                className={INPUT_CLASS}
              >
                {analyses.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.objet_marche || a.nom_fichier} · {new Date(a.created_at).toLocaleDateString('fr-FR')}
                  </option>
                ))}
              </select>
            </div>
          )
        )}

        {mode === 'manuel' && (
          <div>
            <label className="block font-syne text-[11px] font-semibold uppercase tracking-widest text-text-subtle mb-2">
              Description du marché
            </label>
            <textarea
              value={descriptionMarche}
              onChange={e => setDescriptionMarche(e.target.value)}
              placeholder="Objet du marché, type de prestation, critères de notation, contraintes particulières, exigences du cahier des charges…"
              rows={5}
              disabled={isPending}
              className={`${INPUT_CLASS} resize-y`}
            />
            <p className="font-syne text-[11px] text-text-subtle mt-1.5">
              Plus vous êtes précis, plus la trame sera adaptée.
            </p>
          </div>
        )}

        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3">
            <p className="font-syne text-[13px] font-semibold text-red-600">{error}</p>
          </div>
        )}

        <button
          type="button"
          onClick={handleGenerer}
          disabled={!canSubmit || isPending}
          className="group relative w-full py-3.5 bg-accent hover:bg-accent-dark text-white font-syne font-bold text-[14px] rounded-xl transition-all duration-200 overflow-hidden shadow-[0_4px_16px_rgba(37,99,235,0.25)] disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
        >
          <span
            aria-hidden="true"
            className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/15 to-transparent"
          />
          <span className="relative flex items-center justify-center gap-2">
            {isPending ? (
              <>
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Génération en cours…
              </>
            ) : (
              'Générer la trame →'
            )}
          </span>
        </button>
      </div>

      {/* ── Résultat ── */}
      {trame && (
        <div className="bg-surface border border-border rounded-2xl p-6 sm:p-8 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-syne text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-amber">
                Trame générée
              </p>
              <p className="font-syne text-[12px] text-text-subtle mt-0.5">
                Modifiez directement le texte ci-dessous, puis téléchargez.
              </p>
            </div>
            <div className="flex items-center gap-3">
              {mode === 'analyse' && selectedAnalyseId && (
                <span className={`font-syne text-[11px] ${
                  saveStatus === 'saving' ? 'text-text-subtle' :
                  saveStatus === 'saved'  ? 'text-emerald-600' :
                  saveStatus === 'error'  ? 'text-red-500' : ''
                }`}>
                  {saveStatus === 'saving' && 'Sauvegarde…'}
                  {saveStatus === 'saved'  && '✓ Sauvegardé'}
                  {saveStatus === 'error'  && '⚠ Erreur de sauvegarde'}
                </span>
              )}
              <button
                type="button"
                onClick={() => downloadTxt(trame, trameLabel)}
                className="inline-flex items-center gap-2 font-syne text-[13px] font-bold text-white bg-accent hover:bg-accent-dark px-4 py-2 rounded-xl transition-all duration-200 shadow-[0_4px_12px_rgba(37,99,235,0.2)]"
              >
                <DownloadIcon />
                Télécharger (.txt)
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-border overflow-hidden">
            <textarea
              value={trame}
              onChange={e => setTrame(e.target.value)}
              rows={45}
              spellCheck={false}
              className="w-full bg-background px-5 py-4 font-mono text-[12.5px] text-text leading-relaxed focus:outline-none resize-y"
            />
          </div>

          <div className="flex items-center justify-between">
            {mode === 'analyse' && selectedAnalyseId ? (
              <span className={`font-syne text-[11px] ${
                saveStatus === 'saving' ? 'text-text-subtle' :
                saveStatus === 'saved'  ? 'text-emerald-600' :
                saveStatus === 'error'  ? 'text-red-500' : 'text-transparent'
              }`}>
                {saveStatus === 'saving' && 'Sauvegarde…'}
                {saveStatus === 'saved'  && '✓ Sauvegardé'}
                {saveStatus === 'error'  && '⚠ Erreur de sauvegarde'}
              </span>
            ) : <span />}
            <button
              type="button"
              onClick={() => downloadTxt(trame, trameLabel)}
              className="inline-flex items-center gap-2 font-syne text-[13px] font-bold text-white bg-accent hover:bg-accent-dark px-4 py-2 rounded-xl transition-all duration-200 shadow-[0_4px_12px_rgba(37,99,235,0.2)]"
            >
              <DownloadIcon />
              Télécharger (.txt)
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
