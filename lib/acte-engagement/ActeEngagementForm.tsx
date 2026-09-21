'use client'

import { useState, useTransition, useMemo, useCallback } from 'react'
import { montantEnLettres } from '@/lib/montantEnLettres'
import {
  sauvegarderActeEngagement,
  type ActeLot,
  type ActeEngagementData,
} from './actions'
import type { ProfilEntreprise } from '@/app/(dashboard)/dashboard/mon-entreprise/actions'
import type { AOResult } from '@/app/(dashboard)/dashboard/analyser/actions'

// ─── Types ────────────────────────────────────────────────────────────────────

type AnalyseRow = {
  id: string
  created_at: string
  objet_marche: string
  resultat: AOResult | null
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseNum(s: string): number {
  const n = parseFloat(s.replace(',', '.'))
  return isFinite(n) && n >= 0 ? n : 0
}

function formatEur(n: number): string {
  return n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function emptyLot(i: number): ActeLot {
  return { numero: String(i + 1), designation: '', montant_ht: '' }
}

function initForm(
  profil: ProfilEntreprise | null,
  saved: ActeEngagementData | null
): ActeEngagementData {
  if (saved) return saved
  return {
    raison_sociale: profil?.raison_sociale ?? '',
    forme_juridique: profil?.forme_juridique ?? '',
    adresse_siege: profil?.adresse_siege ?? '',
    siret: profil?.siret ?? '',
    nom_signataire: profil?.nom_signataire ?? '',
    qualite_signataire: profil?.qualite_signataire ?? '',
    iban: profil?.iban ?? '',
    bic: profil?.bic ?? '',
    objet: '',
    acheteur: '',
    delai_execution: '',
    lots: [emptyLot(0)],
    taux_tva: '20',
    analyse_id: null,
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const inputClass =
  'w-full bg-background border border-border rounded-lg px-3.5 py-2.5 font-syne text-[14px] text-text placeholder:text-text-subtle focus:border-accent focus:ring-2 focus:ring-accent/10 outline-none transition-all duration-150 disabled:opacity-50'

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block font-syne text-[12px] font-semibold text-text-muted">{label}</label>
      {hint && <p className="font-syne text-[11px] text-text-subtle -mt-0.5">{hint}</p>}
      {children}
    </div>
  )
}

function SectionHeader({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2.5 mb-5">
      <div className="w-1 h-4 rounded-full bg-brand-amber" />
      <p className="font-syne text-[11px] font-semibold text-text-muted uppercase tracking-widest">{label}</p>
    </div>
  )
}

function CopyBlock({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    })
  }
  return (
    <div className="bg-background border border-border rounded-xl p-4">
      <p className="font-syne text-[11px] font-semibold text-text-muted uppercase tracking-widest mb-2">{label}</p>
      <p className="font-syne text-[13px] text-text leading-relaxed break-words">{value}</p>
      <button
        type="button"
        onClick={copy}
        className="mt-3 flex items-center gap-1.5 font-syne text-[12px] font-semibold text-accent hover:text-accent-dark transition-colors duration-150"
      >
        {copied ? (
          <>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Copié
          </>
        ) : (
          <>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
            </svg>
            Copier
          </>
        )}
      </button>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ActeEngagementForm({
  profil,
  analyses,
  savedActe,
}: {
  profil: ProfilEntreprise | null
  analyses: AnalyseRow[]
  savedActe: ActeEngagementData | null
}) {
  const [form, setForm] = useState<ActeEngagementData>(() => initForm(profil, savedActe))
  const [isPending, startTransition] = useTransition()
  const [saveState, setSaveState] = useState<{ success: true } | { error: string } | null>(null)
  const [isExporting, setIsExporting] = useState(false)

  const update = useCallback(<K extends keyof ActeEngagementData>(key: K, value: ActeEngagementData[K]) => {
    setForm(prev => ({ ...prev, [key]: value }))
    setSaveState(null)
  }, [])

  const updateLot = (idx: number, field: keyof ActeLot, value: string) => {
    setForm(prev => {
      const lots = prev.lots.map((l, i) => i === idx ? { ...l, [field]: value } : l)
      return { ...prev, lots }
    })
    setSaveState(null)
  }

  const addLot = () => {
    setForm(prev => ({ ...prev, lots: [...prev.lots, emptyLot(prev.lots.length)] }))
  }

  const removeLot = (idx: number) => {
    setForm(prev => ({ ...prev, lots: prev.lots.filter((_, i) => i !== idx) }))
  }

  const prefillFromAnalyse = (analyseId: string) => {
    const analyse = analyses.find(a => a.id === analyseId)
    if (!analyse) return
    const res = analyse.resultat
    update('analyse_id', analyseId)
    update('objet', res?.objet ?? analyse.objet_marche ?? '')
    update('acheteur', res?.acheteur ?? '')
    if (res?.lots && res.lots.length > 0) {
      const lots: ActeLot[] = res.lots.map((l, i) => ({
        numero: l.numero || String(i + 1),
        designation: l.designation || '',
        montant_ht: '',
      }))
      update('lots', lots)
    }
  }

  const tva = parseNum(form.taux_tva)
  const lotsCalcules = useMemo(() =>
    form.lots.map(l => {
      const ht = parseNum(l.montant_ht)
      const montantTva = ht * tva / 100
      const ttc = ht + montantTva
      return { ...l, ht, montantTva, ttc }
    }),
    [form.lots, tva]
  )

  const totalHt = lotsCalcules.reduce((acc, l) => acc + l.ht, 0)
  const totalTva = lotsCalcules.reduce((acc, l) => acc + l.montantTva, 0)
  const totalTtc = lotsCalcules.reduce((acc, l) => acc + l.ttc, 0)
  const hasResults = totalHt > 0

  const handleSave = () => {
    startTransition(async () => {
      const result = await sauvegarderActeEngagement(form)
      setSaveState(result)
    })
  }

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
        HeadingLevel, AlignmentType, WidthType, BorderStyle } = await import('docx')

      const bold = (text: string) => new TextRun({ text, bold: true, font: 'Arial', size: 22 })
      const normal = (text: string) => new TextRun({ text, font: 'Arial', size: 22 })
      const br = () => new Paragraph({ children: [new TextRun('')], spacing: { after: 120 } })
      const sectionTitle = (text: string) => new Paragraph({
        children: [bold(text)],
        spacing: { before: 300, after: 120 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '0F1B4D' } },
      })

      const row = (label: string, value: string) => new TableRow({
        children: [
          new TableCell({ width: { size: 40, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [bold(label)], spacing: { after: 40 } })] }),
          new TableCell({ width: { size: 60, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [normal(value)], spacing: { after: 40 } })] }),
        ],
      })

      const noBorderStyle = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }
      const noBorders = {
        top: noBorderStyle, bottom: noBorderStyle,
        left: noBorderStyle, right: noBorderStyle,
        insideHorizontal: noBorderStyle, insideVertical: noBorderStyle,
      }

      const infoTable = (pairs: [string, string][]) => new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: noBorders,
        rows: pairs.map(([l, v]) => row(l, v)),
      })

      const lotsRows = lotsCalcules
        .filter(l => l.designation || l.ht > 0)
        .flatMap(l => [
          new Paragraph({ children: [bold(`Lot n° ${l.numero} – ${l.designation}`)], spacing: { before: 160, after: 60 } }),
          new Paragraph({ children: [normal(`Montant HT : ${formatEur(l.ht)} €`)] }),
          new Paragraph({ children: [normal(`TVA ${form.taux_tva}% : ${formatEur(l.montantTva)} €`)] }),
          new Paragraph({ children: [normal(`Montant TTC : ${formatEur(l.ttc)} €`)] }),
          new Paragraph({ children: [normal(`En toutes lettres (HT) : ${montantEnLettres(l.ht)} hors taxes`)], spacing: { after: 80 } }),
        ])

      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            new Paragraph({
              heading: HeadingLevel.TITLE,
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: "ACTE D'ENGAGEMENT", bold: true, font: 'Arial', size: 32, color: '0F1B4D' })],
              spacing: { after: 200 },
            }),
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: "Format ATTRI1 – Document d'aide à la rédaction", font: 'Arial', size: 18, color: '6B7280', italics: true })],
              spacing: { after: 80 },
            }),
            new Paragraph({
              children: [new TextRun({ text: "⚠ Document d'aide — vérifiez et reportez les informations sur le formulaire exigé par l'acheteur.", font: 'Arial', size: 18, color: 'D97706', bold: true })],
              spacing: { after: 400 },
              shading: { fill: 'FEF3C7' },
            }),
            sectionTitle('I – IDENTIFICATION DU POUVOIR ADJUDICATEUR'),
            infoTable([['Acheteur / Pouvoir adjudicateur :', form.acheteur || '—']]),
            br(),
            sectionTitle('II – OBJET DU MARCHÉ'),
            infoTable([
              ['Objet :', form.objet || '—'],
              ["Délai d'exécution :", form.delai_execution || '—'],
            ]),
            br(),
            sectionTitle('III – IDENTIFICATION DU CANDIDAT'),
            infoTable([
              ['Raison sociale :', form.raison_sociale || '—'],
              ['Forme juridique :', form.forme_juridique || '—'],
              ['Adresse du siège :', form.adresse_siege || '—'],
              ['N° SIRET :', form.siret || '—'],
              ['Représenté par :', form.nom_signataire || '—'],
              ['En qualité de :', form.qualite_signataire || '—'],
              ...(form.iban ? [['IBAN :', form.iban] as [string, string]] : []),
              ...(form.bic ? [['BIC / SWIFT :', form.bic] as [string, string]] : []),
            ]),
            br(),
            sectionTitle('IV – PRIX'),
            ...lotsRows,
            br(),
            new Paragraph({ children: [bold(`TOTAL HT : ${formatEur(totalHt)} €`)], spacing: { before: 160 } }),
            new Paragraph({ children: [bold(`TOTAL TVA : ${formatEur(totalTva)} €`)] }),
            new Paragraph({ children: [bold(`TOTAL TTC : ${formatEur(totalTtc)} €`)], spacing: { after: 80 } }),
            new Paragraph({ children: [normal(`Soit en toutes lettres (HT) : ${montantEnLettres(totalHt)} hors taxes`)] }),
            new Paragraph({ children: [normal(`Soit en toutes lettres (TTC) : ${montantEnLettres(totalTtc)} toutes taxes comprises`)], spacing: { after: 200 } }),
            sectionTitle('V – SIGNATURE'),
            br(),
            infoTable([
              ['Fait à :', ''],
              ['Le :', new Date().toLocaleDateString('fr-FR')],
              ['Signature :', ''],
              ['Nom & Qualité :', `${form.nom_signataire || ''}${form.qualite_signataire ? ' – ' + form.qualite_signataire : ''}`],
            ]),
          ],
        }],
      })

      const blob = await Packer.toBlob(doc)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `acte-engagement-${Date.now()}.docx`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('[ActeEngagementForm] export error:', err)
      alert('Erreur lors de la génération du fichier. Réessayez.')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3.5">
        <svg className="shrink-0 mt-0.5" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
        <p className="font-syne text-[13px] text-amber-800 leading-relaxed">
          <strong>Document d&apos;aide</strong> — vérifiez et reportez les informations sur le formulaire exigé par l&apos;acheteur. Ce document ne remplace pas l&apos;acte officiel.
        </p>
      </div>

      {analyses.length > 0 && (
        <div className="bg-surface border border-border rounded-2xl p-6 shadow-[0_2px_12px_rgba(37,99,235,0.04)]">
          <SectionHeader label="Pré-remplir depuis une analyse" />
          <Field label="Sélectionner une analyse (optionnel)">
            <select
              value={form.analyse_id ?? ''}
              onChange={e => { if (e.target.value) prefillFromAnalyse(e.target.value); else update('analyse_id', null) }}
              className={inputClass}
            >
              <option value="">— Saisie manuelle —</option>
              {analyses.map(a => (
                <option key={a.id} value={a.id}>
                  {a.objet_marche || 'Analyse sans titre'} · {new Date(a.created_at).toLocaleDateString('fr-FR')}
                </option>
              ))}
            </select>
          </Field>
        </div>
      )}

      <div className="bg-surface border border-border rounded-2xl p-6 shadow-[0_2px_12px_rgba(37,99,235,0.04)]">
        <SectionHeader label="Identification du candidat (titulaire)" />
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Field label="Raison sociale">
              <input type="text" value={form.raison_sociale} onChange={e => update('raison_sociale', e.target.value)} placeholder="Entreprise SAS" className={inputClass} />
            </Field>
            <Field label="Forme juridique">
              <input type="text" value={form.forme_juridique} onChange={e => update('forme_juridique', e.target.value)} placeholder="SAS, SARL, SA…" className={inputClass} />
            </Field>
          </div>
          <Field label="Adresse du siège social">
            <input type="text" value={form.adresse_siege} onChange={e => update('adresse_siege', e.target.value)} placeholder="12 rue de la Paix, 75002 Paris" className={inputClass} />
          </Field>
          <Field label="N° SIRET">
            <input type="text" value={form.siret} onChange={e => update('siret', e.target.value)} placeholder="123 456 789 00012" className={inputClass} />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Field label="Nom du signataire">
              <input type="text" value={form.nom_signataire} onChange={e => update('nom_signataire', e.target.value)} placeholder="Jean Dupont" className={inputClass} />
            </Field>
            <Field label="Qualité du signataire">
              <input type="text" value={form.qualite_signataire} onChange={e => update('qualite_signataire', e.target.value)} placeholder="Président, Gérant…" className={inputClass} />
            </Field>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Field label="IBAN (optionnel)">
              <input type="text" value={form.iban} onChange={e => update('iban', e.target.value)} placeholder="FR76 3000 6000…" className={inputClass} />
            </Field>
            <Field label="BIC / SWIFT (optionnel)">
              <input type="text" value={form.bic} onChange={e => update('bic', e.target.value)} placeholder="BNPAFRPPXXX" className={inputClass} />
            </Field>
          </div>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-2xl p-6 shadow-[0_2px_12px_rgba(37,99,235,0.04)]">
        <SectionHeader label="Marché" />
        <div className="space-y-5">
          <Field label="Acheteur / Pouvoir adjudicateur">
            <input type="text" value={form.acheteur} onChange={e => update('acheteur', e.target.value)} placeholder="Commune de Paris, CHU de Bordeaux…" className={inputClass} />
          </Field>
          <Field label="Objet du marché">
            <textarea value={form.objet} onChange={e => update('objet', e.target.value)} placeholder="Travaux de rénovation thermique de l'école primaire…" rows={2} className={`${inputClass} resize-none`} />
          </Field>
          <Field label="Délai d'exécution">
            <input type="text" value={form.delai_execution} onChange={e => update('delai_execution', e.target.value)} placeholder="12 mois à compter de l'ordre de service" className={inputClass} />
          </Field>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-2xl p-6 shadow-[0_2px_12px_rgba(37,99,235,0.04)]">
        <div className="flex items-center justify-between gap-2.5 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-1 h-4 rounded-full bg-brand-amber" />
            <p className="font-syne text-[11px] font-semibold text-text-muted uppercase tracking-widest">Lots & montants</p>
          </div>
          <div className="flex items-center gap-3">
            <label className="font-syne text-[12px] font-semibold text-text-muted">TVA</label>
            <div className="flex items-center gap-1">
              <input type="number" min="0" max="100" step="0.1" value={form.taux_tva} onChange={e => update('taux_tva', e.target.value)}
                className="w-16 bg-background border border-border rounded-lg px-2 py-1.5 font-syne text-[13px] text-text text-center focus:border-accent focus:ring-2 focus:ring-accent/10 outline-none" />
              <span className="font-syne text-[13px] text-text-muted">%</span>
            </div>
          </div>
        </div>
        <div className="space-y-4">
          {form.lots.map((lot, i) => (
            <div key={i} className="bg-background border border-border rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <p className="font-syne text-[12px] font-semibold text-text-muted">Lot {i + 1}</p>
                {form.lots.length > 1 && (
                  <button type="button" onClick={() => removeLot(i)} className="p-1.5 text-text-subtle hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors duration-150" aria-label="Supprimer le lot">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                    </svg>
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-syne text-[11px] font-semibold text-text-subtle">N° lot</label>
                  <input type="text" value={lot.numero} onChange={e => updateLot(i, 'numero', e.target.value)} placeholder="1" className={inputClass} />
                </div>
                <div className="sm:col-span-2 space-y-1">
                  <label className="font-syne text-[11px] font-semibold text-text-subtle">Désignation</label>
                  <input type="text" value={lot.designation} onChange={e => updateLot(i, 'designation', e.target.value)} placeholder="Gros œuvre, charpente…" className={inputClass} />
                </div>
              </div>
              <div className="space-y-1">
                <label className="font-syne text-[11px] font-semibold text-text-subtle">Montant HT (€)</label>
                <input type="number" min="0" step="0.01" value={lot.montant_ht} onChange={e => updateLot(i, 'montant_ht', e.target.value)} placeholder="50000.00" className={inputClass} />
              </div>
              {parseNum(lot.montant_ht) > 0 && (
                <div className="grid grid-cols-3 gap-2 pt-1">
                  {[
                    ['HT', formatEur(lotsCalcules[i].ht)],
                    [`TVA ${form.taux_tva}%`, formatEur(lotsCalcules[i].montantTva)],
                    ['TTC', formatEur(lotsCalcules[i].ttc)],
                  ].map(([k, v]) => (
                    <div key={k} className="bg-surface border border-border rounded-lg px-3 py-2 text-center">
                      <p className="font-syne text-[10px] text-text-subtle uppercase tracking-wider">{k}</p>
                      <p className="font-syne text-[13px] font-bold text-text mt-0.5">{v} €</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
        <button type="button" onClick={addLot} className="mt-4 flex items-center gap-1.5 font-syne text-[12px] font-semibold text-accent hover:text-accent-dark transition-colors duration-150">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Ajouter un lot
        </button>
        {totalHt > 0 && (
          <div className="mt-5 border-t border-border pt-4 grid grid-cols-3 gap-3">
            {[['Total HT', formatEur(totalHt)], ['Total TVA', formatEur(totalTva)], ['Total TTC', formatEur(totalTtc)]].map(([k, v]) => (
              <div key={k} className="bg-accent/5 border border-accent/15 rounded-xl px-3 py-3 text-center">
                <p className="font-syne text-[10px] text-accent/70 uppercase tracking-wider">{k}</p>
                <p className="font-syne text-[14px] font-bold text-accent mt-0.5">{v} €</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {hasResults && (
        <div className="bg-surface border border-border rounded-2xl p-6 shadow-[0_2px_12px_rgba(37,99,235,0.04)]">
          <SectionHeader label="Montants en toutes lettres" />
          <div className="space-y-3">
            {lotsCalcules.filter(l => l.ht > 0).map(l => (
              <CopyBlock key={l.numero} label={`Lot ${l.numero}${l.designation ? ' – ' + l.designation : ''}`} value={`${formatEur(l.ht)} € HT — ${montantEnLettres(l.ht)} hors taxes`} />
            ))}
            {form.lots.length > 1 && (
              <>
                <CopyBlock label="Total global HT" value={`${formatEur(totalHt)} € HT — ${montantEnLettres(totalHt)} hors taxes`} />
                <CopyBlock label="Total global TTC" value={`${formatEur(totalTtc)} € TTC — ${montantEnLettres(totalTtc)} toutes taxes comprises`} />
              </>
            )}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-4 pt-1 flex-wrap">
        <div className="flex items-center gap-4">
          {saveState && 'success' in saveState && <span className="font-syne text-[13px] font-semibold text-accent">Brouillon enregistré ✓</span>}
          {saveState && 'error' in saveState && <span className="font-syne text-[13px] font-semibold text-red-600">{saveState.error}</span>}
        </div>
        <div className="flex items-center gap-3">
          <button type="button" onClick={handleSave} disabled={isPending}
            className="px-5 py-2.5 bg-background border border-border hover:border-accent text-text font-syne font-bold text-[13px] rounded-xl transition-all duration-200 disabled:opacity-40">
            {isPending ? 'Enregistrement…' : 'Sauvegarder le brouillon'}
          </button>
          <button type="button" onClick={handleExport} disabled={isExporting}
            className="group relative flex items-center gap-2 px-6 py-2.5 bg-accent hover:bg-accent-dark text-white font-syne font-bold text-[13px] rounded-xl transition-all duration-200 overflow-hidden shadow-[0_4px_16px_rgba(37,99,235,0.25)] disabled:opacity-40 disabled:cursor-not-allowed">
            <span aria-hidden="true" className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/15 to-transparent" />
            <svg className="relative" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span className="relative">{isExporting ? 'Génération…' : 'Télécharger .docx'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
