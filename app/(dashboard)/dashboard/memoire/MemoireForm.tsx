'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import Link from 'next/link'
import {
  genererMemoire, sauvegarderMemoire, chargerMemoire,
  preparerGenerationV2, genererSectionV2, genererConclusionV2,
  type SectionPlan, type SectionResult,
} from './actions'
import type { AnalyseItem } from './page'

// ─── Markdown helpers ─────────────────────────────────────────────────────────

function parseInlineRuns(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/).map((part, i) =>
    part.startsWith('**') && part.endsWith('**')
      ? { text: part.slice(2, -2), bold: true, key: i }
      : { text: part, bold: false, key: i }
  ).filter(r => r.text !== '')
}

function escHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function inlineMd(s: string) {
  return escHtml(s).replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
}

function renderMarkdown(text: string): string {
  const lines = text.split('\n')
  const out: string[] = []
  let inUl = false
  let inOl = false
  const closeUl = () => { if (inUl) { out.push('</ul>'); inUl = false } }
  const closeOl = () => { if (inOl) { out.push('</ol>'); inOl = false } }
  for (const raw of lines) {
    const t = raw.trim()
    if (!t) { closeUl(); closeOl(); out.push('<div style="height:0.5em"></div>'); continue }
    if (t.startsWith('### ')) { closeUl(); closeOl(); out.push(`<h3 style="font-size:13px;font-weight:700;margin:12px 0 4px">${inlineMd(t.slice(4))}</h3>`); continue }
    if (t.startsWith('## '))  { closeUl(); closeOl(); out.push(`<h2 style="font-size:15px;font-weight:700;margin:16px 0 4px">${inlineMd(t.slice(3))}</h2>`); continue }
    if (t.startsWith('# '))   { closeUl(); closeOl(); out.push(`<h1 style="font-size:18px;font-weight:700;margin:20px 0 6px">${inlineMd(t.slice(2))}</h1>`); continue }
    if (/^[*-] /.test(t)) {
      closeOl()
      if (!inUl) { out.push('<ul style="margin:4px 0;padding-left:20px">'); inUl = true }
      out.push(`<li style="margin:2px 0">${inlineMd(t.slice(2))}</li>`)
      continue
    }
    if (/^\d+\. /.test(t)) {
      closeUl()
      if (!inOl) { out.push('<ol style="margin:4px 0;padding-left:20px">'); inOl = true }
      out.push(`<li style="margin:2px 0">${inlineMd(t.replace(/^\d+\. /, ''))}</li>`)
      continue
    }
    closeUl(); closeOl()
    out.push(`<p style="margin:4px 0">${inlineMd(t)}</p>`)
  }
  closeUl(); closeOl()
  return out.join('\n')
}

// ─── docx export ─────────────────────────────────────────────────────────────

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

async function downloadDocx(content: string, objet: string) {
  const { Document, HeadingLevel, Packer, Paragraph, TextRun } = await import('docx')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const children: any[] = []

  for (const line of content.split('\n')) {
    const t = line.trim()
    const runs = parseInlineRuns(t).map(r => new TextRun({ text: r.text, bold: r.bold }))

    if (!t) {
      children.push(new Paragraph({ text: '', spacing: { after: 80 } }))
    } else if (t.startsWith('### ')) {
      children.push(new Paragraph({ text: t.slice(4), heading: HeadingLevel.HEADING_3 }))
    } else if (t.startsWith('## ')) {
      children.push(new Paragraph({ text: t.slice(3), heading: HeadingLevel.HEADING_2 }))
    } else if (t.startsWith('# ')) {
      children.push(new Paragraph({ text: t.slice(2), heading: HeadingLevel.HEADING_1 }))
    } else if (t.startsWith('⚠')) {
      children.push(new Paragraph({ children: [new TextRun({ text: t, italics: true, color: '6B7280' })], spacing: { after: 160 } }))
    } else if (/^[*-] /.test(t)) {
      children.push(new Paragraph({ children: parseInlineRuns(t.slice(2)).map(r => new TextRun({ text: r.text, bold: r.bold })), bullet: { level: 0 }, spacing: { after: 60 } }))
    } else if (/^\d+\. /.test(t)) {
      children.push(new Paragraph({ children: parseInlineRuns(t.replace(/^\d+\. /, '')).map(r => new TextRun({ text: r.text, bold: r.bold })), bullet: { level: 0 }, spacing: { after: 60 } }))
    } else {
      children.push(new Paragraph({ children: runs, spacing: { after: 100 } }))
    }
  }

  const doc = new Document({ sections: [{ children }] })
  const blob = await Packer.toBlob(doc)
  const safe = objet.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').slice(0, 60)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = `Memoire_technique_${safe}.docx`
  document.body.appendChild(a); a.click()
  document.body.removeChild(a); URL.revokeObjectURL(url)
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function DownloadIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
}
function CopyIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" /></svg>
}
function RefreshIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" /><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" /></svg>
}

const INPUT_CLASS = 'w-full bg-background border border-border rounded-xl px-4 py-3 font-syne text-[14px] text-text placeholder:text-text-subtle focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition-all duration-150'

// ─── V2 Generation state machine ─────────────────────────────────────────────

type V2Phase =
  | { phase: 'idle' }
  | { phase: 'planning' }
  | { phase: 'generating'; plan: SectionPlan[]; introBlocs: { id: string; titre: string }[]; currentIndex: number; total: number; results: SectionResult[] }
  | { phase: 'done'; results: SectionResult[] }
  | { phase: 'error'; message: string }

// ─── SectionCard (transparency) ──────────────────────────────────────────────

function SectionCard({
  section, index, onRegen, isRegenerating,
}: {
  section: SectionResult
  index: number
  onRegen: (index: number) => void
  isRegenerating: boolean
}) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <div className="bg-surface px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="font-syne text-[11px] font-bold text-accent bg-accent/8 px-2 py-0.5 rounded-full shrink-0">{section.ponderation}</span>
          <p className="font-syne text-[13px] font-semibold text-text truncate">{section.titre}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {section.blocs.length > 0 && (
            <button
              onClick={() => setExpanded(p => !p)}
              className="font-syne text-[11px] text-text-subtle hover:text-text transition-colors"
            >
              {section.blocs.length} bloc{section.blocs.length > 1 ? 's' : ''}
              <span className="ml-1">{expanded ? '▲' : '▼'}</span>
            </button>
          )}
          <button
            onClick={() => onRegen(index)}
            disabled={isRegenerating}
            className="inline-flex items-center gap-1.5 font-syne text-[11px] font-semibold text-text-muted border border-border hover:border-accent hover:text-accent px-2.5 py-1 rounded-lg transition-colors disabled:opacity-40"
            title="Régénérer cette section"
          >
            <RefreshIcon />
            Régénérer
          </button>
        </div>
      </div>
      {expanded && section.blocs.length > 0 && (
        <div className="bg-accent/3 border-t border-border px-4 py-2.5 flex flex-wrap gap-1.5">
          <span className="font-syne text-[10px] font-semibold uppercase tracking-wider text-text-subtle mr-1">Blocs :</span>
          {section.blocs.map(b => (
            <span key={b.id} className="font-syne text-[11px] text-accent bg-accent/8 border border-accent/20 px-2 py-0.5 rounded-full">{b.titre}</span>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── MemoireForm ──────────────────────────────────────────────────────────────

export function MemoireForm({
  analyses, isLocked, defaultAnalyseId, biblioCount,
}: {
  analyses: AnalyseItem[]
  isLocked?: boolean
  defaultAnalyseId?: string
  biblioCount?: number
}) {
  const resolvedDefault = defaultAnalyseId && analyses.some(a => a.id === defaultAnalyseId) ? defaultAnalyseId : (analyses[0]?.id ?? '')
  const [mode, setMode] = useState<'analyse' | 'manuel'>(analyses.length > 0 ? 'analyse' : 'manuel')
  const [selectedAnalyseId, setSelectedAnalyseId] = useState(resolvedDefault)
  const [descriptionMarche, setDescriptionMarche] = useState('')
  const [longueur, setLongueur] = useState<'court' | 'standard' | 'complet'>('standard')
  const [trame, setTrame] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [copied, setCopied] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)

  // V2 state machine
  const [v2State, setV2State] = useState<V2Phase>({ phase: 'idle' })
  const [v2Sections, setV2Sections] = useState<SectionResult[]>([])
  const [regenIdx, setRegenIdx] = useState<number | null>(null)

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const skipNextSaveRef = useRef(false)
  const didAutoTriggerRef = useRef(false)
  const prevTrameRef = useRef('')
  const v2RunRef = useRef(false)

  const hasBiblio = (biblioCount ?? 0) > 0
  const useV2 = hasBiblio && mode === 'analyse'

  // Auto-switch to preview when trame is first populated
  useEffect(() => {
    if (trame && !prevTrameRef.current) setPreviewMode(true)
    prevTrameRef.current = trame
  }, [trame])

  // Load saved memoire when selected analysis changes
  useEffect(() => {
    if (mode !== 'analyse' || !selectedAnalyseId) return
    skipNextSaveRef.current = true
    setTrame('')
    setV2Sections([])
    setV2State({ phase: 'idle' })
    setSaveStatus('idle')
    chargerMemoire(selectedAnalyseId).then(res => {
      if (res.contenu) setTrame(res.contenu)
    })
  }, [mode, selectedAnalyseId])

  // Debounced auto-save on trame edit (analyse mode only)
  useEffect(() => {
    if (!trame || mode !== 'analyse' || !selectedAnalyseId) return
    if (skipNextSaveRef.current) { skipNextSaveRef.current = false; return }
    setSaveStatus('saving')
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(async () => {
      const res = await sauvegarderMemoire(selectedAnalyseId, trame)
      setSaveStatus(res.ok ? 'saved' : 'error')
    }, 1500)
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current) }
  }, [trame, mode, selectedAnalyseId])

  // Auto-trigger on mount when arriving with ?analyse=
  useEffect(() => {
    if (!defaultAnalyseId || didAutoTriggerRef.current || isPending || trame) return
    if (!analyses.some(a => a.id === defaultAnalyseId)) return
    didAutoTriggerRef.current = true
    handleGenerer()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // V2 generation loop — fires each time currentIndex advances
  useEffect(() => {
    if (v2State.phase !== 'generating') return
    if (v2RunRef.current) return
    v2RunRef.current = true

    const runNext = async () => {
      const { plan, introBlocs, currentIndex, total, results } = v2State

      if (currentIndex >= total) {
        // All sections done — generate conclusion
        const concRes = await genererConclusionV2({
          analyseId: mode === 'analyse' ? selectedAnalyseId : null,
          descriptionManuelle: mode === 'manuel' ? descriptionMarche : null,
          longueur,
        })
        const conclusionText = 'text' in concRes ? concRes.text : ''

        // Add intro + sections + conclusion
        const allSections: SectionResult[] = [
          ...results,
          ...(conclusionText ? [{ titre: 'Conclusion', ponderation: '', text: conclusionText, blocs: [] }] : []),
        ]

        const assembled = buildTrameFromSections(allSections)
        setV2Sections(allSections)
        setTrame(assembled)
        setV2State({ phase: 'done', results: allSections })

        if (mode === 'analyse' && selectedAnalyseId) {
          skipNextSaveRef.current = true
          sauvegarderMemoire(selectedAnalyseId, assembled).then(() => setSaveStatus('saved'))
        }
        v2RunRef.current = false
        return
      }

      // Generate current section
      let sectionPlan: SectionPlan | undefined
      let blocsIds: string[]
      let isIntro = false

      if (currentIndex === 0) {
        // Intro
        isIntro = true
        sectionPlan = { titre: 'Introduction', ponderation: '', blocs: introBlocs.map(b => ({ ...b, categorie: 'presentation' })) }
        blocsIds = introBlocs.map(b => b.id)
      } else {
        sectionPlan = plan[currentIndex - 1]
        blocsIds = sectionPlan?.blocs.map(b => b.id) ?? []
      }

      const res = await genererSectionV2({
        analyseId: mode === 'analyse' ? selectedAnalyseId : null,
        descriptionManuelle: mode === 'manuel' ? descriptionMarche : null,
        sectionTitre: sectionPlan?.titre ?? '',
        sectionPonderation: sectionPlan?.ponderation ?? '',
        blocsIds,
        longueur,
        isIntro,
      })

      if ('error' in res) {
        setV2State({ phase: 'error', message: res.error })
        v2RunRef.current = false
        return
      }

      const newResult: SectionResult = {
        titre: sectionPlan?.titre ?? '',
        ponderation: sectionPlan?.ponderation ?? '',
        text: res.text,
        blocs: res.blocs,
      }

      const newResults = [...results, newResult]

      v2RunRef.current = false
      setV2State({
        phase: 'generating',
        plan,
        introBlocs,
        currentIndex: currentIndex + 1,
        total,
        results: newResults,
      })
    }

    runNext()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [v2State.phase === 'generating' ? (v2State as Extract<V2Phase, {phase:'generating'}>).currentIndex : -1])

  function buildTrameFromSections(sections: SectionResult[]): string {
    return sections.map(s => s.text).join('\n\n')
  }

  const handleGenerer = () => {
    setError(null)
    setTrame('')
    setV2Sections([])
    setSaveStatus('idle')

    const analyseIdForGen = mode === 'analyse' ? selectedAnalyseId : null
    const descriptionForGen = mode === 'manuel' ? descriptionMarche : null

    if (useV2) {
      // V2 flow: plan first, then section by section
      v2RunRef.current = false
      setV2State({ phase: 'planning' })
      preparerGenerationV2(analyseIdForGen, descriptionForGen).then(planRes => {
        if ('error' in planRes) { setV2State({ phase: 'error', message: planRes.error }); return }
        if (!planRes.sections.length && !planRes.introBlocs.length) {
          // Fallback to V1
          runV1Generation()
          return
        }
        const total = 1 + planRes.sections.length // 1 intro + N sections (conclusion is handled at the end)
        setV2State({
          phase: 'generating',
          plan: planRes.sections,
          introBlocs: planRes.introBlocs,
          currentIndex: 0,
          total,
          results: [],
        })
      })
    } else {
      runV1Generation()
    }
  }

  const runV1Generation = () => {
    if (mode === 'analyse' && selectedAnalyseId) skipNextSaveRef.current = true
    startTransition(async () => {
      try {
        const res = await genererMemoire(
          mode === 'analyse' ? (selectedAnalyseId || null) : null,
          mode === 'manuel' ? descriptionMarche : null,
          longueur
        )
        if ('error' in res) { setError(res.error); skipNextSaveRef.current = false }
        else { setTrame(res.trame); if (mode === 'analyse' && selectedAnalyseId) setSaveStatus('saved') }
      } catch {
        setError("La génération a expiré ou une erreur réseau s'est produite. Réessaie.")
        skipNextSaveRef.current = false
      }
    })
  }

  const handleRegenSection = async (index: number) => {
    if (regenIdx !== null) return
    setRegenIdx(index)
    const section = v2Sections[index]
    if (!section) { setRegenIdx(null); return }

    const res = await genererSectionV2({
      analyseId: mode === 'analyse' ? selectedAnalyseId : null,
      descriptionManuelle: mode === 'manuel' ? descriptionMarche : null,
      sectionTitre: section.titre,
      sectionPonderation: section.ponderation,
      blocsIds: section.blocs.map(b => b.id),
      longueur,
      isIntro: section.titre === 'Introduction',
    })

    if ('error' in res) { setRegenIdx(null); return }

    const updated = [...v2Sections]
    updated[index] = { ...section, text: res.text, blocs: res.blocs }
    setV2Sections(updated)
    const assembled = buildTrameFromSections(updated)
    setTrame(assembled)
    skipNextSaveRef.current = true
    if (mode === 'analyse' && selectedAnalyseId) {
      sauvegarderMemoire(selectedAnalyseId, assembled).then(() => setSaveStatus('saved'))
    }
    setRegenIdx(null)
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(trame)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const canSubmit = mode === 'analyse' ? !!selectedAnalyseId : descriptionMarche.trim().length >= 20
  const selectedAnalyse = analyses.find(a => a.id === selectedAnalyseId)
  const isNoGo = mode === 'analyse' && selectedAnalyse?.go_no_go_verdict === 'NO_GO'
  const trameLabel = mode === 'analyse'
    ? (analyses.find(a => a.id === selectedAnalyseId)?.objet_marche ?? 'marche')
    : descriptionMarche.slice(0, 50)

  const isV2Loading = v2State.phase === 'planning' || v2State.phase === 'generating'
  const isAnyLoading = isPending || isV2Loading

  const v2Progress = v2State.phase === 'generating'
    ? { current: v2State.currentIndex, total: v2State.total + 1 }
    : null

  // Upsell
  if (isLocked) {
    return (
      <div className="bg-surface border border-border rounded-2xl p-8 text-center space-y-5">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto" style={{ background: 'linear-gradient(135deg, #EFF6FF, #DBEAFE)' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><line x1="10" y1="9" x2="8" y2="9" /></svg>
        </div>
        <div>
          <p className="font-fraunces text-[22px] text-text mb-2">Mémoire technique</p>
          <p className="font-syne text-[14px] text-text-muted leading-relaxed max-w-sm mx-auto">La génération de mémoires techniques est disponible à partir du plan Essentiel.</p>
        </div>
        <a href="/pricing" className="inline-flex items-center justify-center gap-2 bg-accent text-white font-syne font-bold text-[14px] rounded-xl px-6 py-3 hover:bg-accent/90 transition-colors shadow-[0_4px_16px_rgba(37,99,235,0.25)]">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
          Passer à Essentiel →
        </a>
      </div>
    )
  }

  return (
    <div className="space-y-6">

      {/* NO-GO banner */}
      {isNoGo && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-3">
          <span className="text-amber-600 mt-0.5 shrink-0">⚠</span>
          <p className="font-syne text-[13px] text-amber-800">Cette analyse est en <strong>NO-GO</strong> — vérifiez l&apos;éligibilité avant de rédiger un mémoire.</p>
        </div>
      )}

      {/* Bibliothèque CTA si vide */}
      {!hasBiblio && (
        <div className="bg-accent/4 border border-accent/20 rounded-xl px-4 py-3 flex items-center justify-between gap-4">
          <div>
            <p className="font-syne text-[13px] font-semibold text-text">Personnalisez avec vos propres contenus</p>
            <p className="font-syne text-[12px] text-text-muted mt-0.5">Importez votre mémoire type pour que l&apos;IA l&apos;utilise comme base à la génération.</p>
          </div>
          <Link href="/dashboard/bibliotheque" className="shrink-0 font-syne text-[12px] font-semibold text-accent hover:text-accent-dark transition-colors whitespace-nowrap">
            Bibliothèque →
          </Link>
        </div>
      )}

      {/* Source + longueur */}
      <div className="bg-surface border border-border rounded-2xl p-6 sm:p-8 space-y-5">
        <p className="font-syne text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-amber">Source du marché</p>

        {/* Mode selector */}
        <div className="flex rounded-xl border border-border overflow-hidden text-[13px] font-syne font-semibold">
          <button type="button" onClick={() => setMode('analyse')} className={`flex-1 py-2.5 px-3 transition-colors duration-150 ${mode === 'analyse' ? 'bg-accent text-white' : 'bg-surface text-text-muted hover:bg-accent-subtle/30'}`}>
            Depuis une analyse
          </button>
          <button type="button" onClick={() => setMode('manuel')} className={`flex-1 py-2.5 px-3 border-l border-border transition-colors duration-150 ${mode === 'manuel' ? 'bg-accent text-white' : 'bg-surface text-text-muted hover:bg-accent-subtle/30'}`}>
            Décrire le marché
          </button>
        </div>

        {mode === 'analyse' && (
          analyses.length === 0 ? (
            <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3">
              <p className="font-syne text-[13px] text-amber-700">Aucune analyse. Analysez un AO d&apos;abord ou décrivez le marché manuellement.</p>
            </div>
          ) : (
            <div>
              <label className="block font-syne text-[11px] font-semibold uppercase tracking-widest text-text-subtle mb-2">Sélectionner une analyse</label>
              <select value={selectedAnalyseId} onChange={e => setSelectedAnalyseId(e.target.value)} className={INPUT_CLASS}>
                {analyses.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.objet_marche || a.nom_fichier} · {new Date(a.created_at).toLocaleDateString('fr-FR')}
                    {a.go_no_go_verdict === 'NO_GO' ? ' · NO-GO' : ''}
                  </option>
                ))}
              </select>
            </div>
          )
        )}

        {mode === 'manuel' && (
          <div>
            <label className="block font-syne text-[11px] font-semibold uppercase tracking-widest text-text-subtle mb-2">Description du marché</label>
            <textarea
              value={descriptionMarche}
              onChange={e => setDescriptionMarche(e.target.value)}
              placeholder="Objet du marché, type de prestation, critères de notation, contraintes…"
              rows={5}
              disabled={isAnyLoading}
              className={`${INPUT_CLASS} resize-y`}
            />
          </div>
        )}

        {/* Longueur selector */}
        <div>
          <label className="block font-syne text-[11px] font-semibold uppercase tracking-widest text-text-subtle mb-2">Longueur cible</label>
          <div className="flex rounded-xl border border-border overflow-hidden text-[12px] font-syne font-semibold">
            {([
              { id: 'court', label: 'Court', detail: '~3 000 mots' },
              { id: 'standard', label: 'Standard', detail: '~7 000 mots' },
              { id: 'complet', label: 'Complet', detail: '~12 000 mots' },
            ] as const).map((opt, i) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setLongueur(opt.id)}
                className={`flex-1 py-2 px-2 transition-colors duration-150 ${i > 0 ? 'border-l border-border' : ''} ${longueur === opt.id ? 'bg-accent text-white' : 'bg-surface text-text-muted hover:bg-accent-subtle/30'}`}
              >
                <span className="block">{opt.label}</span>
                <span className={`block text-[10px] font-normal ${longueur === opt.id ? 'text-white/70' : 'text-text-subtle'}`}>{opt.detail}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Mode indicator */}
        {hasBiblio && mode === 'analyse' && (
          <div className="flex items-center gap-2 text-emerald-600">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
            <p className="font-syne text-[12px] font-semibold">Génération personnalisée — vos contenus de bibliothèque seront utilisés</p>
          </div>
        )}

        {error && <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3"><p className="font-syne text-[13px] font-semibold text-red-600">{error}</p></div>}
        {v2State.phase === 'error' && <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3"><p className="font-syne text-[13px] font-semibold text-red-600">{v2State.message}</p></div>}

        <button
          type="button"
          onClick={handleGenerer}
          disabled={!canSubmit || isAnyLoading}
          className="group relative w-full py-3.5 bg-accent hover:bg-accent-dark text-white font-syne font-bold text-[14px] rounded-xl transition-all duration-200 overflow-hidden shadow-[0_4px_16px_rgba(37,99,235,0.25)] disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
        >
          <span aria-hidden="true" className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/15 to-transparent" />
          <span className="relative flex items-center justify-center gap-2">
            {isAnyLoading ? (
              <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> Génération en cours…</>
            ) : (
              `Générer ${useV2 ? 'section par section' : 'la trame'} →`
            )}
          </span>
        </button>

        {/* V2 progress */}
        {isV2Loading && (
          <div className="space-y-3">
            {v2State.phase === 'planning' && (
              <div className="flex items-center gap-3 justify-center py-2">
                <div className="flex gap-1">{[0,1,2].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}</div>
                <p className="font-syne text-[12px] text-text-subtle">Préparation du plan…</p>
              </div>
            )}
            {v2State.phase === 'generating' && v2Progress && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="font-syne text-[12px] text-text-subtle">
                    Section {Math.min(v2Progress.current + 1, v2Progress.total)}/{v2Progress.total}
                    {v2State.currentIndex === 0 ? ' — Introduction' : v2State.plan[v2State.currentIndex - 1] ? ` — ${v2State.plan[v2State.currentIndex - 1].titre}` : ' — Conclusion'}
                  </p>
                  <p className="font-syne text-[11px] text-text-subtle">{Math.round(((v2Progress.current) / v2Progress.total) * 100)}%</p>
                </div>
                <div className="w-full bg-border rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-accent h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.round((v2Progress.current / v2Progress.total) * 100)}%` }}
                  />
                </div>
                {/* Sections générées */}
                {v2State.results.length > 0 && (
                  <div className="space-y-1 pt-1">
                    {v2State.results.map((r, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
                        <p className="font-syne text-[11px] text-text-muted">{r.titre || 'Introduction'}</p>
                      </div>
                    ))}
                    <div className="flex items-center gap-2">
                      <div className="flex gap-0.5">{[0,1,2].map(i => <div key={i} className="w-1 h-1 rounded-full bg-accent animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}</div>
                      <p className="font-syne text-[11px] text-accent">
                        {v2State.currentIndex === 0 ? 'Introduction' : v2State.plan[v2State.currentIndex - 1]?.titre ?? 'Conclusion'} en cours…
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* V1 loading */}
        {isPending && (
          <div className="flex items-center gap-3 justify-center pt-1">
            <div className="flex gap-1">{[0,1,2].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}</div>
            <p className="font-syne text-[12px] text-text-subtle">Génération en cours — comptez 2 à 3 minutes</p>
          </div>
        )}
      </div>

      {/* Résultat */}
      {(trame || isAnyLoading) && (
        <div className="bg-surface border border-border rounded-2xl p-6 sm:p-8 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-syne text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-amber">Trame générée</p>
              <p className="font-syne text-[12px] text-text-subtle mt-0.5">
                {previewMode ? 'Aperçu rendu — cliquez sur « Éditer » pour modifier.' : 'Modifiez directement le texte ci-dessous, puis exportez.'}
              </p>
            </div>
            {trame && (
              <div className="flex items-center gap-3">
                {mode === 'analyse' && selectedAnalyseId && (
                  <span className={`font-syne text-[11px] ${saveStatus === 'saving' ? 'text-text-subtle' : saveStatus === 'saved' ? 'text-emerald-600' : saveStatus === 'error' ? 'text-red-500' : ''}`}>
                    {saveStatus === 'saving' && 'Sauvegarde…'}
                    {saveStatus === 'saved' && '✓ Sauvegardé'}
                    {saveStatus === 'error' && '⚠ Erreur'}
                  </span>
                )}
                <button type="button" onClick={() => downloadDocx(trame, trameLabel)} className="inline-flex items-center gap-2 font-syne text-[13px] font-bold text-white bg-accent hover:bg-accent-dark px-4 py-2 rounded-xl transition-all duration-200 shadow-[0_4px_12px_rgba(37,99,235,0.2)]">
                  <DownloadIcon />Exporter .docx
                </button>
                <button type="button" onClick={handleCopy} className="inline-flex items-center gap-2 font-syne text-[13px] font-semibold text-text-muted bg-background border border-border hover:border-accent hover:text-accent px-4 py-2 rounded-xl transition-all duration-200">
                  <CopyIcon />{copied ? 'Copié !' : 'Copier'}
                </button>
              </div>
            )}
          </div>

          {trame && (
            <>
              <div className="flex rounded-lg border border-border overflow-hidden text-[12px] font-syne font-semibold w-fit">
                <button type="button" onClick={() => setPreviewMode(false)} className={`px-3.5 py-1.5 transition-colors ${!previewMode ? 'bg-accent text-white' : 'bg-surface text-text-muted hover:bg-accent-subtle/30'}`}>Éditer</button>
                <button type="button" onClick={() => setPreviewMode(true)} className={`px-3.5 py-1.5 border-l border-border transition-colors ${previewMode ? 'bg-accent text-white' : 'bg-surface text-text-muted hover:bg-accent-subtle/30'}`}>Aperçu</button>
              </div>

              <div className="rounded-xl border border-border overflow-hidden">
                {previewMode ? (
                  // eslint-disable-next-line react/no-danger
                  <div className="w-full bg-background px-5 py-4 font-syne text-[13px] text-text leading-relaxed min-h-[400px]" dangerouslySetInnerHTML={{ __html: renderMarkdown(trame) }} />
                ) : (
                  <textarea value={trame} onChange={e => setTrame(e.target.value)} rows={45} spellCheck={false} className="w-full bg-background px-5 py-4 font-mono text-[12.5px] text-text leading-relaxed focus:outline-none resize-y" />
                )}
              </div>
            </>
          )}

          {isAnyLoading && !trame && (
            <div className="rounded-xl border border-border bg-background px-5 py-12 flex flex-col items-center gap-3">
              <div className="flex gap-1">{[0,1,2].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}</div>
              <p className="font-syne text-[12px] text-text-subtle">
                {isV2Loading ? 'Génération section par section en cours…' : 'Génération en cours — comptez 2 à 3 minutes'}
              </p>
            </div>
          )}

          {trame && (
            <div className="flex items-center justify-between">
              {mode === 'analyse' && selectedAnalyseId ? (
                <span className={`font-syne text-[11px] ${saveStatus === 'saving' ? 'text-text-subtle' : saveStatus === 'saved' ? 'text-emerald-600' : saveStatus === 'error' ? 'text-red-500' : 'text-transparent'}`}>
                  {saveStatus === 'saving' && 'Sauvegarde…'}{saveStatus === 'saved' && '✓ Sauvegardé'}{saveStatus === 'error' && '⚠ Erreur de sauvegarde'}
                </span>
              ) : <span />}
              <div className="flex gap-3">
                <button type="button" onClick={handleCopy} className="inline-flex items-center gap-2 font-syne text-[13px] font-semibold text-text-muted bg-background border border-border hover:border-accent hover:text-accent px-4 py-2 rounded-xl transition-all duration-200">
                  <CopyIcon />{copied ? 'Copié !' : 'Copier'}
                </button>
                <button type="button" onClick={() => downloadDocx(trame, trameLabel)} className="inline-flex items-center gap-2 font-syne text-[13px] font-bold text-white bg-accent hover:bg-accent-dark px-4 py-2 rounded-xl transition-all duration-200 shadow-[0_4px_12px_rgba(37,99,235,0.2)]">
                  <DownloadIcon />Exporter .docx
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Transparence V2 : sections avec blocs et régénération */}
      {v2Sections.length > 0 && trame && (
        <div className="bg-surface border border-border rounded-2xl p-6 space-y-3">
          <p className="font-syne text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-amber">Sections générées</p>
          <p className="font-syne text-[12px] text-text-muted">Cliquez sur &ldquo;Régénérer&rdquo; pour reformuler une section avec les mêmes blocs.</p>
          <div className="space-y-2">
            {v2Sections.map((s, i) => (
              <SectionCard
                key={i}
                section={s}
                index={i}
                onRegen={handleRegenSection}
                isRegenerating={regenIdx === i}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
