'use client'

import { useState, useCallback } from 'react'
import * as XLSX from 'xlsx'
import {
  importerReferences,
  type ReferenceFormData,
  type ReferenceChantier,
} from '@/app/(dashboard)/dashboard/mon-entreprise/actions'

// ─── Types ─────────────────────────────────────────────────────────────────────

type TargetField = 'titre' | 'maitre_ouvrage' | 'annee' | 'montant' | 'description' | 'domaines' | 'site_occupe'
type ColumnMapping = Record<TargetField, string | null>
type Step = 'file' | 'mapping' | 'done'

const TARGET_FIELDS: { field: TargetField; label: string; required?: boolean }[] = [
  { field: 'titre',         label: 'Titre',              required: true },
  { field: 'maitre_ouvrage',label: "Maître d'ouvrage"                   },
  { field: 'annee',         label: 'Année'                              },
  { field: 'montant',       label: 'Montant HT (€)'                    },
  { field: 'description',   label: 'Description'                        },
  { field: 'domaines',      label: 'Domaines'                           },
  { field: 'site_occupe',   label: 'Site occupé'                        },
]

// ─── Détection intelligente des colonnes ───────────────────────────────────────

const PATTERNS: Record<TargetField, string[]> = {
  titre:         ['titre', 'intitulé', 'intitule', 'objet', 'chantier', 'opération', 'operation', 'marché', 'marche', 'libellé', 'libelle', 'affaire', 'nom du'],
  maitre_ouvrage:['moa', "maître d'ouvrage", "maitre d'ouvrage", 'maître ouvrage', 'maitre ouvrage', 'client', 'commanditaire', "donneur d'ordre", 'donneur ordre'],
  annee:         ['année', 'annee', 'date', 'livraison', 'réception', 'reception', 'achèvement', 'achevement', 'fin ', 'millésime', 'millesime'],
  montant:       ['montant', 'prix', ' ht', 'coût', 'cout', 'valeur', 'budget', 'marché ht', 'marche ht'],
  description:   ['description', 'détail', 'detail', 'commentaire', 'note', 'nature', 'travaux', 'prestation'],
  domaines:      ['domaine', 'lot', "corps d'état", 'corps etat', 'spécialité', 'specialite', 'activité', 'activite'],
  site_occupe:   ['site occupé', 'site occupe', 'occupé', 'occupe', 'présence', 'presence'],
}

function detectColumn(columns: string[], field: TargetField): string | null {
  const lower = columns.map(c => c.toLowerCase())
  for (const pattern of PATTERNS[field]) {
    const idx = lower.findIndex(c => c.includes(pattern))
    if (idx >= 0) return columns[idx]
  }
  return null
}

function buildMapping(columns: string[]): ColumnMapping {
  const m = {} as ColumnMapping
  for (const { field } of TARGET_FIELDS) {
    m[field] = detectColumn(columns, field)
  }
  return m
}

// ─── Parseurs robustes ─────────────────────────────────────────────────────────

function parseMontant(s: string): number | null {
  if (!s?.trim()) return null
  let c = s.trim().toLowerCase().replace(/\s/g, '').replace(/€/g, '')
  const hasK = c.endsWith('k')
  if (hasK) c = c.slice(0, -1)
  // Virgule décimale (1 ou 2 chiffres après) → point
  c = c.replace(/,(\d{1,2})$/, '.$1').replace(/,/g, '')
  const n = parseFloat(c)
  if (isNaN(n)) return null
  return hasK ? n * 1000 : n
}

function parseAnnee(s: string): number | null {
  if (!s?.trim()) return null
  const y4 = s.match(/\b(19|20)\d{2}\b/)
  if (y4) return parseInt(y4[0], 10)
  const y2 = s.trim().match(/^\d{2}$/)
  if (y2) { const n = parseInt(y2[0], 10); return n >= 50 ? 1900 + n : 2000 + n }
  return null
}

function parseDomaines(s: string): string[] {
  if (!s?.trim()) return []
  return s.split(/[,;]/).map(d => d.trim()).filter(Boolean)
}

function parseSiteOccupe(s: string): boolean {
  return ['oui', 'yes', 'x', '1', 'true', 'vrai', '✓', '✔', 'ok'].includes(s.trim().toLowerCase())
}

// ─── Lecture du fichier ────────────────────────────────────────────────────────

async function parseFile(
  file: File
): Promise<{ columns: string[]; rawRows: Record<string, string>[] }> {
  const buffer = await file.arrayBuffer()
  const wb = XLSX.read(buffer, { type: 'array', cellDates: true })
  const ws = wb.Sheets[wb.SheetNames[0]]

  // sheet_to_json avec header:1 → tableau de tableaux
  const aoa = XLSX.utils.sheet_to_json<unknown[]>(ws, {
    header: 1,
    defval: null,
    blankrows: false,
  }) as unknown[][]

  if (aoa.length < 2) throw new Error('Le fichier doit contenir au moins une ligne d\'en-têtes et une ligne de données.')

  // Détecter la ligne d'en-têtes : première ligne avec ≥ 2 cellules non vides
  let headerIdx = 0
  for (let i = 0; i < Math.min(5, aoa.length); i++) {
    if ((aoa[i] as unknown[]).filter(c => c != null && String(c).trim()).length >= 2) {
      headerIdx = i
      break
    }
  }

  const headerRow = aoa[headerIdx] as unknown[]
  const columns: string[] = []
  const colPositions: number[] = []

  headerRow.forEach((cell, i) => {
    const s = cell == null ? '' : String(cell).trim()
    if (s) { columns.push(s); colPositions.push(i) }
  })

  if (!columns.length) throw new Error('Impossible de détecter les colonnes du fichier.')

  const rawRows: Record<string, string>[] = []

  for (let i = headerIdx + 1; i < aoa.length && rawRows.length < 500; i++) {
    const row = aoa[i] as unknown[]
    const obj: Record<string, string> = {}
    let hasContent = false

    colPositions.forEach((ci, j) => {
      const cell = row[ci]
      let val = ''
      if (cell instanceof Date) {
        val = String(cell.getFullYear())
      } else if (cell != null) {
        val = String(cell).trim()
      }
      obj[columns[j]] = val
      if (val) hasContent = true
    })

    if (hasContent) rawRows.push(obj)
  }

  if (!rawRows.length) throw new Error('Aucune donnée trouvée dans le fichier.')
  return { columns, rawRows }
}

// ─── Application du mapping sur une ligne ─────────────────────────────────────

function applyMapping(raw: Record<string, string>, mapping: ColumnMapping): ReferenceFormData {
  const get = (f: TargetField) => (mapping[f] ? (raw[mapping[f]!] ?? '').trim() : '')
  const annee = parseAnnee(get('annee'))
  const montant = parseMontant(get('montant'))
  return {
    titre:          get('titre'),
    maitre_ouvrage: get('maitre_ouvrage'),
    annee:          annee  != null ? String(annee)   : '',
    montant:        montant != null ? String(montant) : '',
    description:    get('description'),
    domaines:       parseDomaines(get('domaines')),
    site_occupe:    parseSiteOccupe(get('site_occupe')),
  }
}

// ─── Téléchargement du modèle Excel ────────────────────────────────────────────

function downloadTemplate() {
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.aoa_to_sheet([
    ["Titre", "Maître d'ouvrage", "Année", "Montant HT (€)", "Description", "Domaines", "Site occupé"],
    [
      "Rénovation thermique groupe scolaire Paul Bert",
      "Commune de Montreuil", 2022, 480000,
      "Rénovation de 12 classes en site occupé, isolation par l'extérieur, remplacement menuiseries.",
      "Gros œuvre,Isolation", "Oui",
    ],
    [
      "Construction mairie annexe", "CC Vals d'Anjou", 2021, 1250000,
      "Construction d'un bâtiment administratif R+1, structure béton, charpente bois.",
      "Gros œuvre,Charpente", "Non",
    ],
  ])
  ws['!cols'] = [
    { wch: 45 }, { wch: 25 }, { wch: 8 }, { wch: 15 },
    { wch: 60 }, { wch: 25 }, { wch: 12 },
  ]
  XLSX.utils.book_append_sheet(wb, ws, 'Références')
  XLSX.writeFile(wb, 'modele_references_stratly.xlsx')
}

// ─── Composant principal ───────────────────────────────────────────────────────

interface Props {
  onSuccess: (refs: ReferenceChantier[]) => void
  onClose: () => void
}

const SEL = [
  'w-full bg-background border border-border rounded-lg px-3 py-2',
  'font-syne text-[13px] text-text',
  'focus:border-accent focus:ring-2 focus:ring-accent/10 outline-none',
].join(' ')

export function ReferencesImport({ onSuccess, onClose }: Props) {
  const [step, setStep] = useState<Step>('file')
  const [columns, setColumns] = useState<string[]>([])
  const [rawRows, setRawRows] = useState<Record<string, string>[]>([])
  const [mapping, setMapping] = useState<ColumnMapping>({
    titre: null, maitre_ouvrage: null, annee: null,
    montant: null, description: null, domaines: null, site_occupe: null,
  })
  const [skipped, setSkipped] = useState<Set<number>>(new Set())
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<{ imported: number; ignored: number } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleFile = useCallback(async (file: File) => {
    setError(null)
    const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
    if (!['xlsx', 'xls', 'csv'].includes(ext)) {
      setError('Format non supporté. Utilisez .xlsx, .xls ou .csv.')
      return
    }
    try {
      const { columns: cols, rawRows: rows } = await parseFile(file)
      setColumns(cols)
      setRawRows(rows)
      setMapping(buildMapping(cols))
      setSkipped(new Set())
      setStep('mapping')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur de lecture du fichier.')
    }
  }, [])

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const toggleSkip = (i: number) =>
    setSkipped(prev => { const s = new Set(prev); s.has(i) ? s.delete(i) : s.add(i); return s })

  const setField = (field: TargetField, val: string) =>
    setMapping(prev => ({ ...prev, [field]: val || null }))

  // ── Données dérivées ───────────────────────────────────────────────────────

  const mappedRows     = rawRows.map(r => applyMapping(r, mapping))
  const toImport       = mappedRows.filter((r, i) => !skipped.has(i) && r.titre.trim())
  const previewRaw     = rawRows.slice(0, 5)

  const handleImport = async () => {
    if (!toImport.length || !mapping.titre) return
    setImporting(true)
    setError(null)
    const res = await importerReferences(toImport)
    setImporting(false)
    if ('error' in res) { setError(res.error); return }
    setResult({ imported: res.imported, ignored: res.ignored })
    setStep('done')
    onSuccess(res.refs)
  }

  // ── Rendu ──────────────────────────────────────────────────────────────────

  /* ── Étape 1 : dépôt de fichier ── */
  if (step === 'file') return (
    <div className="space-y-4">
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors duration-150 ${dragOver ? 'border-accent bg-accent/5' : 'border-border'}`}
      >
        <svg className="mx-auto mb-3 text-text-muted" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
        <p className="font-syne text-[14px] font-semibold text-text mb-1">Déposez votre fichier ici</p>
        <p className="font-syne text-[12px] text-text-muted mb-4">Excel (.xlsx, .xls) ou CSV — 500 lignes max</p>
        <label className="inline-flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent-dark text-white font-syne font-bold text-[13px] rounded-xl cursor-pointer transition-colors duration-200">
          Parcourir…
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            className="sr-only"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
          />
        </label>
      </div>

      {error && <p className="font-syne text-[12px] text-red-600 font-semibold">{error}</p>}

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={downloadTemplate}
          className="inline-flex items-center gap-1.5 font-syne text-[12px] text-text-muted hover:text-accent transition-colors"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          Télécharger un modèle Excel
        </button>
        <button type="button" onClick={onClose} className="font-syne text-[13px] font-semibold text-text-muted hover:text-text transition-colors">
          Annuler
        </button>
      </div>
    </div>
  )

  /* ── Étape 2 : correspondance + aperçu ── */
  if (step === 'mapping') return (
    <div className="space-y-5">

      {/* En-tête */}
      <div className="flex items-center justify-between">
        <p className="font-syne text-[12px] text-text-muted">
          <span className="font-semibold text-text">{rawRows.length}</span> ligne{rawRows.length !== 1 ? 's' : ''} détectée{rawRows.length !== 1 ? 's' : ''}
        </p>
        <button type="button" onClick={() => setStep('file')} className="font-syne text-[12px] text-text-muted hover:text-text transition-colors">
          ← Changer de fichier
        </button>
      </div>

      {/* Correspondance des colonnes */}
      <div className="bg-background rounded-xl border border-border p-4 space-y-3">
        <p className="font-syne text-[11px] font-semibold text-text-muted uppercase tracking-widest mb-1">
          Correspondance des colonnes
        </p>
        {TARGET_FIELDS.map(({ field, label, required }) => (
          <div key={field} className="grid grid-cols-[140px_1fr] items-center gap-3">
            <label className="font-syne text-[12px] font-semibold text-text shrink-0">
              {label}{required && <span className="text-red-500 ml-0.5">*</span>}
            </label>
            <select value={mapping[field] ?? ''} onChange={e => setField(field, e.target.value)} className={SEL}>
              <option value="">(ignorer)</option>
              {columns.map(col => (
                <option key={col} value={col}>{col}</option>
              ))}
            </select>
          </div>
        ))}
      </div>

      {/* Aperçu des 5 premières lignes */}
      <div className="space-y-2">
        <p className="font-syne text-[11px] font-semibold text-text-muted uppercase tracking-widest">
          Aperçu — {previewRaw.length} première{previewRaw.length !== 1 ? 's' : ''} ligne{previewRaw.length !== 1 ? 's' : ''}
        </p>
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[520px]">
            <thead className="bg-background">
              <tr>
                <th className="px-3 py-2 font-syne text-[10px] font-semibold text-text-muted text-center w-10">⊘</th>
                <th className="px-3 py-2 font-syne text-[10px] font-semibold text-text-muted text-left">Titre</th>
                <th className="px-3 py-2 font-syne text-[10px] font-semibold text-text-muted text-left">MOA</th>
                <th className="px-3 py-2 font-syne text-[10px] font-semibold text-text-muted text-left">Année</th>
                <th className="px-3 py-2 font-syne text-[10px] font-semibold text-text-muted text-left">Montant</th>
              </tr>
            </thead>
            <tbody>
              {previewRaw.map((raw, i) => {
                const p = applyMapping(raw, mapping)
                const skip = skipped.has(i)
                return (
                  <tr key={i} className={`border-t border-border ${skip ? 'opacity-35' : ''}`}>
                    <td className="px-3 py-2 text-center">
                      <input
                        type="checkbox"
                        checked={skip}
                        onChange={() => toggleSkip(i)}
                        title="Ignorer cette ligne"
                        className="accent-accent cursor-pointer"
                      />
                    </td>
                    <td className="px-3 py-2 font-syne text-[12px] text-text max-w-[180px] truncate">
                      {p.titre || <span className="text-text-subtle italic">—</span>}
                    </td>
                    <td className="px-3 py-2 font-syne text-[12px] text-text-muted max-w-[130px] truncate">
                      {p.maitre_ouvrage || '—'}
                    </td>
                    <td className="px-3 py-2 font-syne text-[12px] text-text-muted whitespace-nowrap">
                      {p.annee || '—'}
                    </td>
                    <td className="px-3 py-2 font-syne text-[12px] text-text-muted whitespace-nowrap">
                      {p.montant ? `${Number(p.montant).toLocaleString('fr-FR')} €` : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Compteur + actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-syne text-[13px] text-text">
          <span className="font-bold text-accent">{toImport.length}</span>
          {' '}référence{toImport.length !== 1 ? 's' : ''} sera{toImport.length !== 1 ? 'ont' : ''} importée{toImport.length !== 1 ? 's' : ''}
          {rawRows.length > 5 && (
            <span className="text-text-muted"> sur {rawRows.length} lignes au total</span>
          )}
        </p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={importing}
            className="font-syne text-[13px] font-semibold text-text-muted hover:text-text transition-colors disabled:opacity-40"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleImport}
            disabled={importing || !toImport.length || !mapping.titre}
            className="px-5 py-2 bg-accent hover:bg-accent-dark text-white font-syne font-bold text-[13px] rounded-xl transition-all duration-200 shadow-[0_2px_8px_rgba(37,99,235,0.2)] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {importing
              ? 'Import en cours…'
              : `Importer ${toImport.length} référence${toImport.length !== 1 ? 's' : ''}`}
          </button>
        </div>
      </div>

      {error && <p className="font-syne text-[12px] text-red-600 font-semibold">{error}</p>}
    </div>
  )

  /* ── Étape 3 : succès ── */
  return (
    <div className="py-6 text-center space-y-3">
      <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center mx-auto">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
      <p className="font-syne text-[16px] font-bold text-text">
        {result?.imported ?? 0} référence{(result?.imported ?? 0) > 1 ? 's' : ''} importée{(result?.imported ?? 0) > 1 ? 's' : ''}
      </p>
      {(result?.ignored ?? 0) > 0 && (
        <p className="font-syne text-[13px] text-text-muted">
          {result?.ignored} ignorée{(result?.ignored ?? 0) > 1 ? 's' : ''} (doublons déjà présents)
        </p>
      )}
      <button type="button" onClick={onClose} className="font-syne text-[13px] font-semibold text-accent hover:text-accent-dark transition-colors">
        Fermer
      </button>
    </div>
  )
}
