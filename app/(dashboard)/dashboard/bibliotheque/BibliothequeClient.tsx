'use client'

import { useState, useTransition, useRef } from 'react'
import Link from 'next/link'
import {
  listerBibliotheque, creerBloc, modifierBloc, supprimerBloc, fusionnerBlocs,
  importerBlocsWord, categoriserLot,
  type BlocContenu, type BlocImport, type RawBlocForCategorisation, type CategorisationResult,
} from './actions'
import { CATEGORIES, type CategorieId } from './constants'

// ─── Helpers ─────────────────────────────────────────────────────────────────

const CAT_MAP = Object.fromEntries(CATEGORIES.map(c => [c.id, c.label])) as Record<string, string>

const INPUT_CLASS = 'w-full bg-background border border-border rounded-xl px-4 py-2.5 font-syne text-[13px] text-text placeholder:text-text-subtle focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition-all duration-150'
const SELECT_CLASS = INPUT_CLASS

function wordCount(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length
}

// ─── ParseWordDoc (browser-side) ─────────────────────────────────────────────

type RawParsed = { titre: string; contenu: string; source_fichier: string }

async function parseWordDoc(file: File): Promise<RawParsed[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mammothMod = await import('mammoth')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mammoth = (mammothMod.default || mammothMod) as any
  const arrayBuffer = await file.arrayBuffer()

  // Use inline image handler to mark images; fall back to default (data URIs) if unavailable
  let result: { value: string }
  try {
    result = await mammoth.convertToHtml({ arrayBuffer }, {
      convertImage: mammoth.images?.inline
        ? mammoth.images.inline((_el: unknown) => Promise.resolve({ src: '__IMG__' }))
        : { convert: () => Promise.resolve({ src: '__IMG__' }) },
    })
  } catch {
    result = await mammoth.convertToHtml({ arrayBuffer })
  }

  // Replace any <img> (our placeholder or base64 data URIs) with inline [IMAGE] text
  // Using inline text (not a block element) so el.textContent picks it up correctly
  const html = result.value.replace(/<img\b[^>]*\/?>/gi, ' [IMAGE] ')

  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  const elements = Array.from(doc.body.children)

  const blocs: RawParsed[] = []
  let currentTitre = ''
  let currentLines: string[] = []

  const flush = () => {
    const content = currentLines.filter(Boolean).join('\n').trim()
    if (currentTitre && content.length >= 40) {
      blocs.push({ titre: currentTitre, contenu: content, source_fichier: file.name })
    }
  }

  for (const el of elements) {
    const tag = el.tagName.toLowerCase()
    if (['h1', 'h2', 'h3'].includes(tag)) {
      flush()
      currentTitre = el.textContent?.trim() ?? ''
      currentLines = []
    } else if (currentTitre) {
      const text = el.textContent?.trim() ?? ''
      if (text) currentLines.push(text)
    }
  }
  flush()

  // Merge blocs < 20 mots sans image dans le bloc précédent (contenu trop court)
  const merged: RawParsed[] = []
  for (const b of blocs) {
    const words = b.contenu.trim().split(/\s+/).filter(Boolean).length
    const hasImage = b.contenu.includes('[IMAGE]')
    if (words < 20 && !hasImage && merged.length > 0) {
      merged[merged.length - 1] = {
        ...merged[merged.length - 1],
        contenu: merged[merged.length - 1].contenu + '\n' + b.contenu,
      }
    } else {
      merged.push(b)
    }
  }

  return merged
}

// ─── Modal primitif ─────────────────────────────────────────────────────────

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-background border border-border rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-background border-b border-border px-6 py-4 flex items-center justify-between z-10">
          <p className="font-fraunces text-[18px] text-text">{title}</p>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-text-muted hover:text-text rounded-lg hover:bg-surface transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  )
}

// ─── BlocCard ────────────────────────────────────────────────────────────────

function BlocCard({
  bloc, selected, selectionMode,
  onEdit, onDelete, onToggleSelect,
}: {
  bloc: BlocContenu
  selected: boolean
  selectionMode: boolean
  onEdit: () => void
  onDelete: () => void
  onToggleSelect: () => void
}) {
  return (
    <div
      onClick={selectionMode ? onToggleSelect : undefined}
      className={`bg-surface border rounded-xl px-4 py-3.5 space-y-2 transition-all duration-150 ${
        selectionMode ? 'cursor-pointer' : ''
      } ${selected ? 'border-accent bg-accent/4 ring-1 ring-accent/20' : 'border-border hover:border-border/70'}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5 min-w-0">
          {selectionMode && (
            <div className={`mt-0.5 w-4 h-4 rounded border-2 shrink-0 flex items-center justify-center transition-colors ${selected ? 'bg-accent border-accent' : 'border-border'}`}>
              {selected && <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>}
            </div>
          )}
          <p className="font-syne text-[13px] font-semibold text-text leading-snug">{bloc.titre}</p>
        </div>
        {!selectionMode && (
          <div className="flex gap-1.5 shrink-0">
            <button onClick={onEdit} className="w-7 h-7 flex items-center justify-center text-text-subtle hover:text-accent hover:bg-accent/8 rounded-lg transition-colors" title="Modifier">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
            </button>
            <button onClick={onDelete} className="w-7 h-7 flex items-center justify-center text-text-subtle hover:text-red-500 hover:bg-red-500/8 rounded-lg transition-colors" title="Supprimer">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" /><path d="M10 11v6M14 11v6M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" /></svg>
            </button>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <span className="font-syne text-[10px] font-semibold uppercase tracking-wide bg-accent/8 text-accent px-2 py-0.5 rounded-full">
          {CAT_MAP[bloc.categorie] ?? bloc.categorie}
        </span>
        {bloc.nb_mots > 0 && (
          <span className="font-syne text-[11px] text-text-subtle">{bloc.nb_mots} mots</span>
        )}
        {bloc.source_fichier && (
          <span className="font-syne text-[11px] text-text-subtle truncate max-w-[140px]" title={bloc.source_fichier}>
            {bloc.source_fichier}
          </span>
        )}
      </div>
      {bloc.resume && (
        <p className="font-syne text-[12px] text-text-muted leading-relaxed line-clamp-2">{bloc.resume}</p>
      )}
      {bloc.mots_cles?.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {bloc.mots_cles.slice(0, 5).map(k => (
            <span key={k} className="font-syne text-[10px] text-text-subtle bg-background border border-border px-1.5 py-0.5 rounded-md">{k}</span>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── BlocEditModal ────────────────────────────────────────────────────────────

function BlocEditModal({
  bloc, onSave, onClose, creating,
}: {
  bloc?: Partial<BlocContenu>
  onSave: (data: { titre: string; categorie: CategorieId; contenu: string; resume: string; mots_cles: string[] }) => void
  onClose: () => void
  creating?: boolean
}) {
  const [titre, setTitre] = useState(bloc?.titre ?? '')
  const [categorie, setCategorie] = useState<CategorieId>((bloc?.categorie as CategorieId) ?? 'autre')
  const [contenu, setContenu] = useState(bloc?.contenu ?? '')
  const [resume, setResume] = useState(bloc?.resume ?? '')
  const [motsClesRaw, setMotsClesRaw] = useState((bloc?.mots_cles ?? []).join(', '))

  const handleSave = () => {
    if (!titre.trim() || !contenu.trim()) return
    onSave({
      titre,
      categorie,
      contenu,
      resume,
      mots_cles: motsClesRaw.split(',').map(s => s.trim()).filter(Boolean),
    })
  }

  return (
    <Modal title={creating ? 'Nouveau bloc' : 'Modifier le bloc'} onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label className="block font-syne text-[11px] font-semibold uppercase tracking-wider text-text-subtle mb-1.5">Titre</label>
          <input value={titre} onChange={e => setTitre(e.target.value)} className={INPUT_CLASS} placeholder="Titre du bloc" />
        </div>
        <div>
          <label className="block font-syne text-[11px] font-semibold uppercase tracking-wider text-text-subtle mb-1.5">Catégorie</label>
          <select value={categorie} onChange={e => setCategorie(e.target.value as CategorieId)} className={SELECT_CLASS}>
            {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block font-syne text-[11px] font-semibold uppercase tracking-wider text-text-subtle mb-1.5">
            Contenu <span className="normal-case font-normal">({wordCount(contenu)} mots)</span>
          </label>
          <textarea value={contenu} onChange={e => setContenu(e.target.value)} rows={12} className={`${INPUT_CLASS} resize-y font-mono text-[12px]`} placeholder="Texte du bloc (markdown accepté)" />
        </div>
        <div>
          <label className="block font-syne text-[11px] font-semibold uppercase tracking-wider text-text-subtle mb-1.5">Résumé (1 ligne)</label>
          <input value={resume} onChange={e => setResume(e.target.value)} className={INPUT_CLASS} placeholder="Résumé court pour la sélection IA" />
        </div>
        <div>
          <label className="block font-syne text-[11px] font-semibold uppercase tracking-wider text-text-subtle mb-1.5">Mots-clés (séparés par des virgules)</label>
          <input value={motsClesRaw} onChange={e => setMotsClesRaw(e.target.value)} className={INPUT_CLASS} placeholder="rénovation, maçonnerie, ERP..." />
        </div>
        <div className="flex gap-3 pt-2">
          <button onClick={handleSave} disabled={!titre.trim() || !contenu.trim()} className="flex-1 bg-accent hover:bg-accent-dark text-white font-syne font-bold text-[13px] py-2.5 rounded-xl transition-colors disabled:opacity-40">
            {creating ? 'Créer le bloc' : 'Enregistrer'}
          </button>
          <button onClick={onClose} className="px-4 py-2.5 bg-surface border border-border text-text-muted font-syne text-[13px] rounded-xl hover:border-border/70 transition-colors">
            Annuler
          </button>
        </div>
      </div>
    </Modal>
  )
}

// ─── ImportWordModal ──────────────────────────────────────────────────────────

type ReviewBloc = RawBlocForCategorisation & {
  categorie: CategorieId
  resume: string
  mots_cles: string[]
  source_fichier: string
  keep: boolean
}

function ImportWordModal({ onDone, onClose }: { onDone: (blocs: BlocImport[]) => void; onClose: () => void }) {
  const [phase, setPhase] = useState<'pick' | 'parsing' | 'categorising' | 'review'>('pick')
  const [error, setError] = useState<string | null>(null)
  const [reviewBlocs, setReviewBlocs] = useState<ReviewBloc[]>([])
  const [categorisingProgress, setCategorisingProgress] = useState<{current: number; total: number} | null>(null)
  const [categorisingErrors, setCategorisingErrors] = useState(0)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    setError(null)
    setPhase('parsing')
    try {
      const raw = await parseWordDoc(file)
      if (!raw.length) { setError('Aucun bloc trouvé (vérifiez que le document a des titres H1/H2/H3).'); setPhase('pick'); return }

      setPhase('categorising')
      const BATCH = 15
      const totalBatches = Math.ceil(raw.length / BATCH)
      const cats: CategorisationResult[] = []
      let errors = 0

      for (let i = 0; i < raw.length; i += BATCH) {
        setCategorisingProgress({ current: Math.floor(i / BATCH) + 1, total: totalBatches })
        const batch = raw.slice(i, i + BATCH)
        try {
          const batchCats = await categoriserLot(batch.map(b => ({ titre: b.titre, contenu: b.contenu })))
          cats.push(...batchCats)
        } catch {
          errors++
          for (const b of batch) cats.push({ titre: b.titre, categorie: 'autre' as CategorieId, resume: '', mots_cles: [] })
        }
      }

      const blocs: ReviewBloc[] = raw.map((b, i) => ({
        titre: b.titre,
        contenu: b.contenu,
        source_fichier: b.source_fichier,
        categorie: cats[i]?.categorie ?? 'autre',
        resume: cats[i]?.resume ?? '',
        mots_cles: cats[i]?.mots_cles ?? [],
        keep: true,
      }))

      setReviewBlocs(blocs)
      setCategorisingErrors(errors)
      setCategorisingProgress(null)
      setPhase('review')
    } catch (err) {
      console.error(err)
      setError('Erreur lors du parsing du document.')
      setPhase('pick')
    }
  }

  const handleSave = () => {
    const toSave = reviewBlocs.filter(b => b.keep).map(b => ({
      titre: b.titre,
      categorie: b.categorie,
      contenu: b.contenu,
      resume: b.resume,
      mots_cles: b.mots_cles,
      source_fichier: b.source_fichier,
    } satisfies BlocImport))
    onDone(toSave)
  }

  return (
    <Modal title="Importer un fichier Word (.docx)" onClose={onClose}>
      {phase === 'pick' && (
        <div className="space-y-4">
          <p className="font-syne text-[13px] text-text-muted leading-relaxed">
            Le document sera découpé en blocs selon les titres (H1, H2, H3). Les images seront remplacées par un marqueur <code className="bg-surface px-1 rounded">[IMAGE]</code>.
          </p>
          {error && <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3"><p className="font-syne text-[13px] text-red-700">{error}</p></div>}
          <div
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-border hover:border-accent/40 rounded-xl py-10 text-center cursor-pointer transition-colors"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-3 text-text-subtle">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" />
            </svg>
            <p className="font-syne text-[13px] text-text-muted">Cliquez pour choisir un fichier .docx</p>
            <input ref={fileRef} type="file" accept=".docx" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
          </div>
        </div>
      )}

      {(phase === 'parsing' || phase === 'categorising') && (
        <div className="py-12 text-center space-y-4">
          <div className="flex gap-1 justify-center">
            {[0, 1, 2].map(i => <div key={i} className="w-2 h-2 rounded-full bg-accent animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}
          </div>
          <p className="font-syne text-[13px] text-text-muted">
            {phase === 'parsing'
              ? 'Lecture du document…'
              : categorisingProgress
                ? `Classement IA — lot ${categorisingProgress.current}/${categorisingProgress.total}…`
                : 'Classement IA en cours…'
            }
          </p>
          {phase === 'categorising' && categorisingProgress && (
            <div className="w-full max-w-[200px] mx-auto bg-border rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-accent h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.round((categorisingProgress.current / categorisingProgress.total) * 100)}%` }}
              />
            </div>
          )}
        </div>
      )}

      {phase === 'review' && (
        <div className="space-y-4">
          {categorisingErrors > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              <p className="font-syne text-[13px] text-amber-800">
                ⚠ {categorisingErrors} lot{categorisingErrors > 1 ? 's' : ''} non classé{categorisingErrors > 1 ? 's' : ''} — ces blocs ont la catégorie « Autre » par défaut. Corrigez-les ci-dessous avant d&apos;enregistrer, ou utilisez &ldquo;Classer automatiquement&rdquo; depuis la bibliothèque.
              </p>
            </div>
          )}
          <div className="flex items-center justify-between">
            <p className="font-syne text-[13px] text-text-muted">{reviewBlocs.filter(b => b.keep).length}/{reviewBlocs.length} blocs sélectionnés</p>
            <div className="flex gap-2">
              <button onClick={() => setReviewBlocs(prev => prev.map(b => ({ ...b, keep: true })))} className="font-syne text-[11px] text-accent hover:underline">Tout garder</button>
              <span className="text-text-subtle">·</span>
              <button onClick={() => setReviewBlocs(prev => prev.map(b => ({ ...b, keep: false })))} className="font-syne text-[11px] text-text-muted hover:underline">Tout décocher</button>
            </div>
          </div>

          <div className="space-y-3 max-h-[50vh] overflow-y-auto">
            {reviewBlocs.map((b, i) => (
              <div key={i} className={`border rounded-xl px-4 py-3 transition-colors ${b.keep ? 'border-border bg-surface' : 'border-border/40 bg-surface/40 opacity-60'}`}>
                <div className="flex items-start gap-3">
                  <input type="checkbox" checked={b.keep} onChange={e => setReviewBlocs(prev => prev.map((x, j) => j === i ? { ...x, keep: e.target.checked } : x))} className="mt-1 accent-accent" />
                  <div className="flex-1 min-w-0 space-y-2">
                    <input
                      value={b.titre}
                      onChange={e => setReviewBlocs(prev => prev.map((x, j) => j === i ? { ...x, titre: e.target.value } : x))}
                      className="w-full font-syne text-[13px] font-semibold text-text bg-transparent border-b border-transparent hover:border-border focus:border-accent focus:outline-none pb-0.5"
                    />
                    <div className="flex gap-2 flex-wrap">
                      <select
                        value={b.categorie}
                        onChange={e => setReviewBlocs(prev => prev.map((x, j) => j === i ? { ...x, categorie: e.target.value as CategorieId } : x))}
                        className="font-syne text-[11px] text-accent bg-accent/8 border-0 rounded-full px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-accent/20"
                      >
                        {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                      </select>
                      <span className="font-syne text-[11px] text-text-subtle">{wordCount(b.contenu)} mots</span>
                    </div>
                    {b.resume && <p className="font-syne text-[12px] text-text-muted line-clamp-2">{b.resume}</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-3 pt-2 border-t border-border">
            <button
              onClick={handleSave}
              disabled={reviewBlocs.filter(b => b.keep).length === 0}
              className="flex-1 bg-accent hover:bg-accent-dark text-white font-syne font-bold text-[13px] py-2.5 rounded-xl disabled:opacity-40 transition-colors"
            >
              Enregistrer {reviewBlocs.filter(b => b.keep).length} bloc{reviewBlocs.filter(b => b.keep).length > 1 ? 's' : ''} →
            </button>
            <button onClick={onClose} className="px-4 py-2.5 bg-surface border border-border text-text-muted font-syne text-[13px] rounded-xl hover:border-border/70 transition-colors">
              Annuler
            </button>
          </div>
        </div>
      )}
    </Modal>
  )
}

// ─── FusionModal ─────────────────────────────────────────────────────────────

function FusionModal({
  blocs, onFuse, onClose,
}: {
  blocs: BlocContenu[]
  onFuse: (titre: string, categorie: CategorieId) => void
  onClose: () => void
}) {
  const [titre, setTitre] = useState(blocs[0]?.titre ?? '')
  const [categorie, setCategorie] = useState<CategorieId>((blocs[0]?.categorie as CategorieId) ?? 'autre')

  return (
    <Modal title="Fusionner les blocs" onClose={onClose}>
      <div className="space-y-4">
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <p className="font-syne text-[13px] text-amber-800">
            Les {blocs.length} blocs sélectionnés seront fusionnés dans un nouveau bloc. Les blocs d&apos;origine seront supprimés.
          </p>
        </div>
        <div>
          <label className="block font-syne text-[11px] font-semibold uppercase tracking-wider text-text-subtle mb-1.5">Titre du nouveau bloc</label>
          <input value={titre} onChange={e => setTitre(e.target.value)} className={INPUT_CLASS} />
        </div>
        <div>
          <label className="block font-syne text-[11px] font-semibold uppercase tracking-wider text-text-subtle mb-1.5">Catégorie</label>
          <select value={categorie} onChange={e => setCategorie(e.target.value as CategorieId)} className={SELECT_CLASS}>
            {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        </div>
        <div className="flex gap-3">
          <button onClick={() => onFuse(titre, categorie)} disabled={!titre.trim()} className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-syne font-bold text-[13px] py-2.5 rounded-xl disabled:opacity-40 transition-colors">
            Fusionner →
          </button>
          <button onClick={onClose} className="px-4 py-2.5 bg-surface border border-border text-text-muted font-syne text-[13px] rounded-xl hover:border-border/70 transition-colors">
            Annuler
          </button>
        </div>
      </div>
    </Modal>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function BibliothequeClient({ initialBlocs }: { initialBlocs: BlocContenu[] }) {
  const [blocs, setBlocs] = useState<BlocContenu[]>(initialBlocs)
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [editingBloc, setEditingBloc] = useState<BlocContenu | null>(null)
  const [creatingBloc, setCreatingBloc] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showFusion, setShowFusion] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [toast, setToast] = useState<string | null>(null)
  const [isClassifying, setIsClassifying] = useState(false)
  const [classifyProgress, setClassifyProgress] = useState<{current: number; total: number} | null>(null)

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000) }

  const reload = () => {
    startTransition(async () => {
      const fresh = await listerBibliotheque()
      setBlocs(fresh)
    })
  }

  // Filter
  const filtered = blocs.filter(b => {
    const matchCat = activeCategory === 'all' || b.categorie === activeCategory
    const q = search.toLowerCase()
    const matchSearch = !q || b.titre.toLowerCase().includes(q) || b.resume.toLowerCase().includes(q) || b.mots_cles.some(k => k.includes(q))
    return matchCat && matchSearch
  })

  // Group by category
  const grouped = CATEGORIES.map(cat => ({
    ...cat,
    blocs: filtered.filter(b => b.categorie === cat.id),
  })).filter(g => activeCategory === 'all' ? g.blocs.length > 0 : g.id === activeCategory)

  const handleCreate = async (data: { titre: string; categorie: CategorieId; contenu: string; resume: string; mots_cles: string[] }) => {
    const res = await creerBloc(data)
    if (res.ok) { showToast('Bloc créé.'); setCreatingBloc(false); reload() }
  }

  const handleEdit = async (data: { titre: string; categorie: CategorieId; contenu: string; resume: string; mots_cles: string[] }) => {
    if (!editingBloc) return
    const res = await modifierBloc(editingBloc.id, data)
    if (res.ok) { showToast('Bloc enregistré.'); setEditingBloc(null); reload() }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce bloc définitivement ?')) return
    const res = await supprimerBloc(id)
    if (res.ok) { showToast('Bloc supprimé.'); reload() }
  }

  const handleFuse = async (titre: string, categorie: CategorieId) => {
    const ids = [...selectedIds]
    const res = await fusionnerBlocs(ids, titre, categorie)
    if (res.ok) {
      showToast('Blocs fusionnés.')
      setShowFusion(false)
      setSelectionMode(false)
      setSelectedIds(new Set())
      reload()
    }
  }

  const handleImportDone = async (blocsToSave: BlocImport[]) => {
    const res = await importerBlocsWord(blocsToSave)
    if (res.ok) { showToast(`${res.count} bloc${res.count > 1 ? 's' : ''} importé${res.count > 1 ? 's' : ''}.`); setShowImport(false); reload() }
  }

  const handleClasserAuto = async () => {
    const toClassify = blocs.filter(b => !b.resume)
    if (!toClassify.length || isClassifying) return
    setIsClassifying(true)
    const BATCH = 15
    const total = Math.ceil(toClassify.length / BATCH)
    for (let i = 0; i < toClassify.length; i += BATCH) {
      setClassifyProgress({ current: Math.floor(i / BATCH) + 1, total })
      const batch = toClassify.slice(i, i + BATCH)
      try {
        const results = await categoriserLot(batch.map(b => ({ titre: b.titre, contenu: b.contenu })))
        await Promise.all(batch.map((b, j) => modifierBloc(b.id, {
          categorie: results[j]?.categorie ?? b.categorie,
          resume: results[j]?.resume ?? '',
          mots_cles: results[j]?.mots_cles ?? [],
        })))
      } catch {
        // Continue with next batch on error
      }
    }
    setIsClassifying(false)
    setClassifyProgress(null)
    reload()
    showToast('Classement terminé.')
  }

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  const categoryCounts: Record<string, number> = {}
  for (const b of blocs) categoryCounts[b.categorie] = (categoryCounts[b.categorie] ?? 0) + 1

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 sm:px-8 sm:py-14">

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-text text-background font-syne text-[13px] font-semibold px-5 py-2.5 rounded-xl shadow-lg">
          {toast}
        </div>
      )}

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 font-syne text-[12px] font-semibold text-text-muted mb-8">
        <Link href="/dashboard" className="hover:text-text transition-colors duration-150">Tableau de bord</Link>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><polyline points="9 18 15 12 9 6" /></svg>
        <span className="text-text">Bibliothèque de contenus</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <p className="font-syne text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-amber mb-2">Mémoire technique</p>
          <h1 className="font-fraunces text-[26px] sm:text-[30px] text-text tracking-tight leading-tight">Bibliothèque de contenus</h1>
          <p className="font-syne text-[13px] text-text-muted mt-1">
            {blocs.length} bloc{blocs.length > 1 ? 's' : ''} · Base de contenus réutilisés dans la génération de mémoires
          </p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          {blocs.some(b => !b.resume) && !selectionMode && (
            <button
              onClick={handleClasserAuto}
              disabled={isClassifying}
              className="inline-flex items-center gap-2 font-syne text-[13px] font-semibold text-text-muted bg-surface border border-border hover:border-accent/40 hover:text-accent px-4 py-2.5 rounded-xl transition-all duration-200 disabled:opacity-50"
            >
              {isClassifying ? (
                <>
                  <svg className="animate-spin w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  {classifyProgress ? `Lot ${classifyProgress.current}/${classifyProgress.total}…` : 'Classement…'}
                </>
              ) : (
                <>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                  Classer automatiquement
                </>
              )}
            </button>
          )}
          <button
            onClick={() => setShowImport(true)}
            className="inline-flex items-center gap-2 font-syne text-[13px] font-semibold text-text-muted bg-surface border border-border hover:border-accent/40 hover:text-accent px-4 py-2.5 rounded-xl transition-all duration-200"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
            Importer un .docx
          </button>
          <button
            onClick={() => setCreatingBloc(true)}
            className="inline-flex items-center gap-2 font-syne text-[13px] font-bold text-white bg-accent hover:bg-accent-dark px-4 py-2.5 rounded-xl shadow-[0_4px_12px_rgba(37,99,235,0.2)] transition-all duration-200"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            Nouveau bloc
          </button>
        </div>
      </div>

      {/* Search + selection toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-subtle">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher dans la bibliothèque…"
            className="w-full bg-surface border border-border rounded-xl pl-9 pr-4 py-2.5 font-syne text-[13px] text-text placeholder:text-text-subtle focus:outline-none focus:border-accent transition-colors"
          />
        </div>
        {!selectionMode ? (
          blocs.length >= 2 && (
            <button
              onClick={() => setSelectionMode(true)}
              className="shrink-0 font-syne text-[13px] font-semibold text-text-muted bg-surface border border-border hover:border-border/70 px-4 py-2.5 rounded-xl transition-colors"
            >
              Sélectionner / Fusionner
            </button>
          )
        ) : (
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => { if (selectedIds.size >= 2) setShowFusion(true) }}
              disabled={selectedIds.size < 2}
              className="font-syne text-[13px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 hover:bg-amber-100 px-4 py-2.5 rounded-xl disabled:opacity-40 transition-colors"
            >
              Fusionner ({selectedIds.size})
            </button>
            <button
              onClick={() => { setSelectionMode(false); setSelectedIds(new Set()) }}
              className="font-syne text-[13px] text-text-muted bg-surface border border-border px-4 py-2.5 rounded-xl hover:border-border/70 transition-colors"
            >
              Annuler
            </button>
          </div>
        )}
      </div>

      {/* Category tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1 mb-6 scrollbar-hide">
        <button
          onClick={() => setActiveCategory('all')}
          className={`shrink-0 font-syne text-[12px] font-semibold px-3 py-1.5 rounded-lg transition-colors ${activeCategory === 'all' ? 'bg-accent text-white' : 'text-text-muted hover:bg-surface hover:text-text border border-border'}`}
        >
          Tout ({blocs.length})
        </button>
        {CATEGORIES.filter(c => (categoryCounts[c.id] ?? 0) > 0).map(c => (
          <button
            key={c.id}
            onClick={() => setActiveCategory(c.id)}
            className={`shrink-0 font-syne text-[12px] font-semibold px-3 py-1.5 rounded-lg transition-colors ${activeCategory === c.id ? 'bg-accent text-white' : 'text-text-muted hover:bg-surface hover:text-text border border-border'}`}
          >
            {c.label} ({categoryCounts[c.id] ?? 0})
          </button>
        ))}
      </div>

      {/* Empty state */}
      {blocs.length === 0 && (
        <div className="bg-surface border border-border rounded-2xl px-5 py-14 text-center">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-5" style={{ background: 'linear-gradient(135deg, #EFF6FF, #DBEAFE)' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5A2.5 2.5 0 016.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
            </svg>
          </div>
          <p className="font-fraunces text-[20px] text-text mb-2">Bibliothèque vide</p>
          <p className="font-syne text-[13px] text-text-muted mb-7 max-w-sm mx-auto leading-relaxed">
            Importez votre mémoire type (.docx) ou créez des blocs manuellement. Ces contenus seront utilisés à la génération pour personnaliser chaque section.
          </p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => setShowImport(true)} className="inline-flex items-center gap-2 font-syne text-[13px] font-semibold text-text-muted bg-surface border border-border hover:border-accent/40 px-5 py-2.5 rounded-xl transition-colors">
              Importer un .docx
            </button>
            <button onClick={() => setCreatingBloc(true)} className="inline-flex items-center gap-2 font-syne text-[13px] font-bold text-white bg-accent hover:bg-accent-dark px-5 py-2.5 rounded-xl shadow-[0_4px_12px_rgba(37,99,235,0.2)] transition-colors">
              Créer un bloc →
            </button>
          </div>
        </div>
      )}

      {/* No results */}
      {blocs.length > 0 && filtered.length === 0 && (
        <div className="bg-surface border border-border rounded-2xl px-5 py-10 text-center">
          <p className="font-syne text-[14px] text-text-muted">Aucun résultat pour &ldquo;{search}&rdquo;</p>
        </div>
      )}

      {/* Blocs grouped by category */}
      {isPending ? (
        <div className="flex gap-1 justify-center py-8">
          {[0, 1, 2].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}
        </div>
      ) : (
        <div className="space-y-8">
          {grouped.map(group => (
            <div key={group.id}>
              <p className="font-syne text-[11px] font-bold uppercase tracking-[0.14em] text-text-subtle mb-3">{group.label}</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {group.blocs.map(bloc => (
                  <BlocCard
                    key={bloc.id}
                    bloc={bloc}
                    selected={selectedIds.has(bloc.id)}
                    selectionMode={selectionMode}
                    onEdit={() => setEditingBloc(bloc)}
                    onDelete={() => handleDelete(bloc.id)}
                    onToggleSelect={() => toggleSelect(bloc.id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {creatingBloc && <BlocEditModal creating onSave={handleCreate} onClose={() => setCreatingBloc(false)} />}
      {editingBloc && <BlocEditModal bloc={editingBloc} onSave={handleEdit} onClose={() => setEditingBloc(null)} />}
      {showImport && <ImportWordModal onDone={handleImportDone} onClose={() => setShowImport(false)} />}
      {showFusion && (
        <FusionModal
          blocs={blocs.filter(b => selectedIds.has(b.id))}
          onFuse={handleFuse}
          onClose={() => setShowFusion(false)}
        />
      )}
    </div>
  )
}
