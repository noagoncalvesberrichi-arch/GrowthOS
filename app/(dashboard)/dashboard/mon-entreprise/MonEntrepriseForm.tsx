'use client'

import { useState, useTransition, useMemo } from 'react'
import type { KeyboardEvent } from 'react'
import { useRouter } from 'next/navigation'
import {
  sauvegarderProfil,
  ajouterReference,
  modifierReference,
  supprimerReference,
  type ProfilEntreprise,
  type ProfilFormData,
  type ProfilState,
  type ReferenceChantier,
  type ReferenceFormData,
} from './actions'

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeader({ label, action }: { label: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2.5 mb-5">
      <div className="flex items-center gap-2.5">
        <div className="w-1 h-4 rounded-full bg-brand-amber" />
        <p className="font-syne text-[11px] font-semibold text-text-muted uppercase tracking-widest">{label}</p>
      </div>
      {action}
    </div>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block font-syne text-[12px] font-semibold text-text-muted">{label}</label>
      {hint && <p className="font-syne text-[11px] text-text-subtle -mt-0.5">{hint}</p>}
      {children}
    </div>
  )
}

function TagInput({
  tags,
  placeholder,
  onAdd,
  onRemove,
  disabled,
}: {
  tags: string[]
  placeholder: string
  onAdd: (tag: string) => void
  onRemove: (tag: string) => void
  disabled?: boolean
}) {
  const [input, setInput] = useState('')

  const add = () => {
    const val = input.trim()
    if (val && !tags.includes(val)) {
      onAdd(val)
      setInput('')
    }
  }

  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); add() }
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder={placeholder}
          disabled={disabled}
          className="flex-1 bg-background border border-border rounded-lg px-3.5 py-2.5 font-syne text-[14px] text-text placeholder:text-text-subtle focus:border-accent focus:ring-2 focus:ring-accent/10 outline-none transition-all duration-150 disabled:opacity-50"
        />
        <button
          type="button"
          onClick={add}
          disabled={disabled || !input.trim()}
          className="px-4 py-2.5 bg-accent-subtle text-accent font-syne text-[13px] font-semibold rounded-lg hover:bg-accent hover:text-white transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Ajouter
        </button>
      </div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map(tag => (
            <span
              key={tag}
              className="inline-flex items-center gap-1.5 bg-accent-subtle border border-accent/20 rounded-lg px-3 py-1 font-syne text-[12px] text-accent-fg"
            >
              {tag}
              {!disabled && (
                <button
                  type="button"
                  onClick={() => onRemove(tag)}
                  className="text-accent/40 hover:text-red-500 transition-colors duration-150"
                  aria-label={`Retirer ${tag}`}
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Icônes ───────────────────────────────────────────────────────────────────

function PencilIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
    </svg>
  )
}

// ─── Form state ───────────────────────────────────────────────────────────────

function initForm(profil: ProfilEntreprise | null): ProfilFormData {
  return {
    raison_sociale: profil?.raison_sociale ?? '',
    ca_dernier_exercice: profil?.ca_dernier_exercice != null ? String(profil.ca_dernier_exercice) : '',
    effectif: profil?.effectif != null ? String(profil.effectif) : '',
    annees_experience: profil?.annees_experience != null ? String(profil.annees_experience) : '',
    certifications: profil?.certifications ?? [],
    domaines: profil?.domaines ?? [],
    zone_geographique: profil?.zone_geographique ?? '',
    capacite_caution: profil?.capacite_caution ?? false,
    notes: profil?.notes ?? '',
    moyens_humains: profil?.moyens_humains ?? '',
    moyens_materiels: profil?.moyens_materiels ?? '',
    methodologies: profil?.methodologies ?? '',
  }
}

type RefForm = ReferenceFormData

function emptyRefForm(): RefForm {
  return {
    titre: '',
    maitre_ouvrage: '',
    annee: '',
    montant: '',
    description: '',
    domaines: [],
    site_occupe: false,
  }
}

function refToForm(ref: ReferenceChantier): RefForm {
  return {
    titre: ref.titre,
    maitre_ouvrage: ref.maitre_ouvrage ?? '',
    annee: ref.annee != null ? String(ref.annee) : '',
    montant: ref.montant != null ? String(ref.montant) : '',
    description: ref.description ?? '',
    domaines: ref.domaines,
    site_occupe: ref.site_occupe,
  }
}

const inputClass = 'w-full bg-background border border-border rounded-lg px-3.5 py-2.5 font-syne text-[14px] text-text placeholder:text-text-subtle focus:border-accent focus:ring-2 focus:ring-accent/10 outline-none transition-all duration-150 disabled:opacity-50'

// ─── Completeness indicator ───────────────────────────────────────────────────

function CompletenessBar({ score, total }: { score: number; total: number }) {
  const pct = Math.round((score / total) * 100)
  const color =
    pct < 40 ? 'bg-red-500' :
    pct < 70 ? 'bg-amber-400' :
    'bg-emerald-500'
  const textColor =
    pct < 40 ? 'text-red-600' :
    pct < 70 ? 'text-amber-700' :
    'text-emerald-700'

  return (
    <div className="bg-surface border border-border rounded-2xl p-5 shadow-[0_2px_12px_rgba(37,99,235,0.04)]">
      <div className="flex items-center justify-between mb-2">
        <p className={`font-syne text-[12px] font-semibold ${textColor}`}>
          Profil complété à {pct}%
        </p>
        <p className="font-syne text-[11px] text-text-subtle">{score} / {total} champs renseignés</p>
      </div>
      <div className="w-full bg-background rounded-full h-2 border border-border overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="font-syne text-[11px] text-text-subtle mt-2">
        Un profil riche produit des mémoires plus personnalisés.
      </p>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function MonEntrepriseForm({
  profil,
  references: initialReferences,
  redirectOnSave,
}: {
  profil: ProfilEntreprise | null
  references: ReferenceChantier[]
  redirectOnSave?: string
}) {
  const router = useRouter()
  const [form, setForm] = useState<ProfilFormData>(() => initForm(profil))
  const [state, setState] = useState<ProfilState>(null)
  const [isPending, startTransition] = useTransition()

  // References state
  const [references, setReferences] = useState<ReferenceChantier[]>(initialReferences)
  const [editingId, setEditingId] = useState<string | 'new' | null>(null)
  const [refForm, setRefForm] = useState<RefForm>(emptyRefForm())
  const [refPending, setRefPending] = useState(false)
  const [refError, setRefError] = useState<string | null>(null)

  // Completeness score
  const completenessScore = useMemo(() => {
    let score = 0
    if (form.raison_sociale.trim()) score++
    if (form.domaines.length > 0) score++
    if (form.effectif.trim()) score++
    if (form.annees_experience.trim()) score++
    if (form.ca_dernier_exercice.trim()) score++
    if (form.certifications.length > 0) score++
    if (form.zone_geographique.trim()) score++
    if (form.moyens_humains.trim()) score++
    if (form.moyens_materiels.trim()) score++
    if (form.methodologies.trim()) score++
    if (references.length > 0) score++
    return score
  }, [form, references])

  const update = <K extends keyof ProfilFormData>(key: K, value: ProfilFormData[K]) => {
    setForm(prev => ({ ...prev, [key]: value }))
    setState(null)
  }

  const handleSave = () => {
    startTransition(async () => {
      const result = await sauvegarderProfil(form)
      setState(result)
      if (redirectOnSave && result && 'success' in result) {
        router.push(redirectOnSave)
      }
    })
  }

  // ─── Reference handlers ───────────────────────────────────────────────────

  const openAddRef = () => {
    setRefForm(emptyRefForm())
    setRefError(null)
    setEditingId('new')
  }

  const openEditRef = (ref: ReferenceChantier) => {
    setRefForm(refToForm(ref))
    setRefError(null)
    setEditingId(ref.id)
  }

  const closeRefForm = () => {
    setEditingId(null)
    setRefError(null)
  }

  const updateRef = <K extends keyof RefForm>(key: K, value: RefForm[K]) => {
    setRefForm(prev => ({ ...prev, [key]: value }))
  }

  const handleSaveRef = async () => {
    if (!refForm.titre.trim()) {
      setRefError('Le titre est obligatoire.')
      return
    }
    setRefPending(true)
    setRefError(null)

    if (editingId === 'new') {
      const result = await ajouterReference(refForm)
      if (result && 'error' in result) {
        setRefError(result.error)
        setRefPending(false)
        return
      }
      const newId = result && 'id' in result && result.id ? result.id : crypto.randomUUID()
      const newRef: ReferenceChantier = {
        id: newId,
        titre: refForm.titre.trim(),
        maitre_ouvrage: refForm.maitre_ouvrage.trim() || null,
        annee: refForm.annee !== '' ? parseInt(refForm.annee, 10) : null,
        montant: refForm.montant !== '' ? parseFloat(refForm.montant) : null,
        description: refForm.description.trim() || null,
        domaines: refForm.domaines,
        site_occupe: refForm.site_occupe,
      }
      setReferences(prev => [newRef, ...prev])
    } else if (editingId) {
      const result = await modifierReference(editingId, refForm)
      if (result && 'error' in result) {
        setRefError(result.error)
        setRefPending(false)
        return
      }
      setReferences(prev =>
        prev.map(r =>
          r.id === editingId
            ? {
                ...r,
                titre: refForm.titre.trim(),
                maitre_ouvrage: refForm.maitre_ouvrage.trim() || null,
                annee: refForm.annee !== '' ? parseInt(refForm.annee, 10) : null,
                montant: refForm.montant !== '' ? parseFloat(refForm.montant) : null,
                description: refForm.description.trim() || null,
                domaines: refForm.domaines,
                site_occupe: refForm.site_occupe,
              }
            : r
        )
      )
    }

    setRefPending(false)
    closeRefForm()
  }

  const handleDeleteRef = async (id: string) => {
    setReferences(prev => prev.filter(r => r.id !== id))
    const result = await supprimerReference(id)
    if (result && 'error' in result) {
      // Restore on failure
      setReferences(prev => {
        const existed = initialReferences.find(r => r.id === id)
        if (existed) return [existed, ...prev]
        return prev
      })
    }
  }

  return (
    <div className="space-y-5">

      {/* Completeness bar */}
      <CompletenessBar score={completenessScore} total={11} />

      {/* Identité */}
      <div className="bg-surface border border-border rounded-2xl p-6 shadow-[0_2px_12px_rgba(37,99,235,0.04)]">
        <SectionHeader label="Identité" />

        <div className="space-y-5">
          <Field label="Raison sociale">
            <input
              type="text"
              value={form.raison_sociale}
              onChange={e => update('raison_sociale', e.target.value)}
              placeholder="Entreprise SAS"
              disabled={isPending}
              className={inputClass}
            />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <Field label="CA dernier exercice (€)">
              <input
                type="number"
                value={form.ca_dernier_exercice}
                onChange={e => update('ca_dernier_exercice', e.target.value)}
                placeholder="500000"
                min="0"
                step="any"
                disabled={isPending}
                className={inputClass}
              />
            </Field>
            <Field label="Effectif">
              <input
                type="number"
                value={form.effectif}
                onChange={e => update('effectif', e.target.value)}
                placeholder="12"
                min="0"
                disabled={isPending}
                className={inputClass}
              />
            </Field>
            <Field label="Années d'expérience">
              <input
                type="number"
                value={form.annees_experience}
                onChange={e => update('annees_experience', e.target.value)}
                placeholder="8"
                min="0"
                disabled={isPending}
                className={inputClass}
              />
            </Field>
          </div>
        </div>
      </div>

      {/* Compétences */}
      <div className="bg-surface border border-border rounded-2xl p-6 shadow-[0_2px_12px_rgba(37,99,235,0.04)]">
        <SectionHeader label="Compétences &amp; certifications" />

        <div className="space-y-5">
          <Field label="Certifications" hint="QUALIBAT, ISO 9001, RGE, MASE, etc.">
            <TagInput
              tags={form.certifications}
              placeholder="Ex : QUALIBAT 1511"
              onAdd={tag => update('certifications', [...form.certifications, tag])}
              onRemove={tag => update('certifications', form.certifications.filter(t => t !== tag))}
              disabled={isPending}
            />
          </Field>

          <Field label="Domaines d'activité" hint="Gros œuvre, électricité, menuiserie, VRD…">
            <TagInput
              tags={form.domaines}
              placeholder="Ex : Gros œuvre"
              onAdd={tag => update('domaines', [...form.domaines, tag])}
              onRemove={tag => update('domaines', form.domaines.filter(t => t !== tag))}
              disabled={isPending}
            />
          </Field>
        </div>
      </div>

      {/* Capacités */}
      <div className="bg-surface border border-border rounded-2xl p-6 shadow-[0_2px_12px_rgba(37,99,235,0.04)]">
        <SectionHeader label="Capacités" />

        <div className="space-y-5">
          <Field label="Zone géographique d'intervention">
            <input
              type="text"
              value={form.zone_geographique}
              onChange={e => update('zone_geographique', e.target.value)}
              placeholder="Île-de-France, Hauts-de-France…"
              disabled={isPending}
              className={inputClass}
            />
          </Field>

          <div
            onClick={() => !isPending && update('capacite_caution', !form.capacite_caution)}
            className={`flex items-center gap-3 select-none group ${isPending ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <div className={`w-5 h-5 rounded flex items-center justify-center border-2 transition-colors duration-150 shrink-0
              ${form.capacite_caution
                ? 'bg-accent border-accent'
                : 'bg-background border-border group-hover:border-accent'
              }`}
            >
              {form.capacite_caution && (
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </div>
            <span className="font-syne text-[13px] text-text leading-none">Capacité à fournir une caution bancaire</span>
          </div>
        </div>
      </div>

      {/* Ressources techniques */}
      <div className="bg-surface border border-border rounded-2xl p-6 shadow-[0_2px_12px_rgba(37,99,235,0.04)]">
        <SectionHeader label="Ressources techniques" />

        <div className="space-y-5">
          <Field label="Moyens humains">
            <textarea
              value={form.moyens_humains}
              onChange={e => update('moyens_humains', e.target.value)}
              placeholder="Profils clés : conducteur de travaux, chef de chantier, électricien N3… Organigramme type pour ce genre de marché."
              rows={3}
              disabled={isPending}
              className={`${inputClass} resize-none`}
            />
          </Field>

          <Field label="Moyens matériels">
            <textarea
              value={form.moyens_materiels}
              onChange={e => update('moyens_materiels', e.target.value)}
              placeholder="Parc matériel propre : pelle 20t, mini-pelle, nacelle 20m… Équipements spécifiques loués selon besoin."
              rows={3}
              disabled={isPending}
              className={`${inputClass} resize-none`}
            />
          </Field>

          <Field label="Méthodologies & démarches">
            <textarea
              value={form.methodologies}
              onChange={e => update('methodologies', e.target.value)}
              placeholder="Process qualité (ISO 9001, PPSPS systématique), charte chantier vert, méthodologie BIM, coordination OPC…"
              rows={3}
              disabled={isPending}
              className={`${inputClass} resize-none`}
            />
          </Field>
        </div>
      </div>

      {/* Notes */}
      <div className="bg-surface border border-border rounded-2xl p-6 shadow-[0_2px_12px_rgba(37,99,235,0.04)]">
        <SectionHeader label="Notes complémentaires" />
        <Field label="" hint="Spécificités techniques, contraintes, atouts, références pertinentes…">
          <textarea
            value={form.notes}
            onChange={e => update('notes', e.target.value)}
            placeholder="Ex : Spécialisés en rénovation thermique de bâtiments publics, référence préfecture de Seine-Saint-Denis…"
            rows={4}
            disabled={isPending}
            className={`${inputClass} resize-none`}
          />
        </Field>
      </div>

      {/* Footer profil */}
      <div className="flex items-center justify-end gap-4 pt-1">
        {state && 'success' in state && (
          <span className="font-syne text-[13px] font-semibold text-accent">Profil enregistré ✓</span>
        )}
        {state && 'error' in state && (
          <span className="font-syne text-[13px] font-semibold text-red-600">{state.error}</span>
        )}
        <button
          onClick={handleSave}
          disabled={isPending}
          className="group relative px-6 py-3 bg-accent hover:bg-accent-dark text-white font-syne font-bold text-[14px] rounded-xl transition-all duration-200 overflow-hidden shadow-[0_4px_16px_rgba(37,99,235,0.25)] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <span
            aria-hidden="true"
            className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/15 to-transparent"
          />
          <span className="relative">
            {isPending ? 'Enregistrement…' : 'Enregistrer →'}
          </span>
        </button>
      </div>

      {/* ── Références chantiers ── */}
      <div className="bg-surface border border-border rounded-2xl p-6 shadow-[0_2px_12px_rgba(37,99,235,0.04)]">
        <SectionHeader
          label="Références chantiers"
          action={
            editingId === null && (
              <button
                type="button"
                onClick={openAddRef}
                className="font-syne text-[12px] font-semibold text-accent hover:text-accent-dark transition-colors duration-150 flex items-center gap-1"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Ajouter
              </button>
            )
          }
        />

        {/* Inline form add/edit */}
        {editingId !== null && (
          <div className="mb-5 bg-background border border-border rounded-xl p-5 space-y-4">
            <p className="font-syne text-[11px] font-semibold text-text-muted uppercase tracking-widest">
              {editingId === 'new' ? 'Nouvelle référence' : 'Modifier la référence'}
            </p>

            <div className="space-y-1.5">
              <label className="block font-syne text-[12px] font-semibold text-text-muted">
                Titre <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={refForm.titre}
                onChange={e => updateRef('titre', e.target.value)}
                placeholder="Rénovation thermique groupe scolaire Paul Bert"
                disabled={refPending}
                className={inputClass}
              />
            </div>

            <div className="space-y-1.5">
              <label className="block font-syne text-[12px] font-semibold text-text-muted">Maître d&apos;ouvrage</label>
              <input
                type="text"
                value={refForm.maitre_ouvrage}
                onChange={e => updateRef('maitre_ouvrage', e.target.value)}
                placeholder="Commune de Montreuil"
                disabled={refPending}
                className={inputClass}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block font-syne text-[12px] font-semibold text-text-muted">Année</label>
                <input
                  type="number"
                  value={refForm.annee}
                  onChange={e => updateRef('annee', e.target.value)}
                  placeholder="2022"
                  min={1990}
                  disabled={refPending}
                  className={inputClass}
                />
              </div>
              <div className="space-y-1.5">
                <label className="block font-syne text-[12px] font-semibold text-text-muted">Montant HT (€)</label>
                <input
                  type="number"
                  value={refForm.montant}
                  onChange={e => updateRef('montant', e.target.value)}
                  placeholder="480000"
                  min={0}
                  step="any"
                  disabled={refPending}
                  className={inputClass}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block font-syne text-[12px] font-semibold text-text-muted">Description</label>
              <p className="font-syne text-[11px] text-text-subtle">2-3 phrases décrivant la nature des travaux, la technicité, le contexte.</p>
              <textarea
                value={refForm.description}
                onChange={e => updateRef('description', e.target.value)}
                rows={3}
                disabled={refPending}
                className={`${inputClass} resize-none`}
              />
            </div>

            <div className="space-y-1.5">
              <label className="block font-syne text-[12px] font-semibold text-text-muted">Domaines</label>
              <TagInput
                tags={refForm.domaines}
                placeholder="Ex : Gros œuvre"
                onAdd={tag => updateRef('domaines', [...refForm.domaines, tag])}
                onRemove={tag => updateRef('domaines', refForm.domaines.filter(d => d !== tag))}
                disabled={refPending}
              />
            </div>

            <div
              onClick={() => !refPending && updateRef('site_occupe', !refForm.site_occupe)}
              className={`flex items-center gap-3 select-none group ${refPending ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className={`w-5 h-5 rounded flex items-center justify-center border-2 transition-colors duration-150 shrink-0
                ${refForm.site_occupe
                  ? 'bg-accent border-accent'
                  : 'bg-background border-border group-hover:border-accent'
                }`}
              >
                {refForm.site_occupe && (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>
              <span className="font-syne text-[13px] text-text leading-none">Réalisé en site occupé</span>
            </div>

            {refError && (
              <p className="font-syne text-[12px] font-semibold text-red-600">{refError}</p>
            )}

            <div className="flex items-center justify-end gap-3 pt-1">
              <button
                type="button"
                onClick={closeRefForm}
                disabled={refPending}
                className="font-syne text-[13px] font-semibold text-text-muted hover:text-text transition-colors duration-150 disabled:opacity-40"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleSaveRef}
                disabled={refPending || !refForm.titre.trim()}
                className="px-5 py-2 bg-accent hover:bg-accent-dark text-white font-syne font-bold text-[13px] rounded-xl transition-all duration-200 shadow-[0_2px_8px_rgba(37,99,235,0.2)] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {refPending ? 'Enregistrement…' : 'Enregistrer'}
              </button>
            </div>
          </div>
        )}

        {/* References list */}
        {references.length === 0 && editingId === null ? (
          <div className="rounded-xl border border-dashed border-border px-5 py-8 text-center">
            <p className="font-syne text-[13px] text-text-subtle">
              Aucune référence ajoutée. Les références permettent à Stratly de citer vos chantiers nommément dans le mémoire.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {references.map(ref => (
              <div key={ref.id} className="bg-background border border-border rounded-xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-syne text-[14px] font-semibold text-text truncate">{ref.titre}</p>
                    <p className="font-syne text-[12px] text-text-muted mt-0.5">
                      {[
                        ref.maitre_ouvrage,
                        ref.annee != null ? String(ref.annee) : null,
                        ref.montant != null
                          ? `${ref.montant.toLocaleString('fr-FR')} € HT`
                          : null,
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                    {ref.description && (
                      <p className="font-syne text-[12px] text-text-subtle mt-1.5 line-clamp-2 leading-relaxed">
                        {ref.description}
                      </p>
                    )}
                    {(ref.domaines.length > 0 || ref.site_occupe) && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {ref.domaines.map(d => (
                          <span
                            key={d}
                            className="inline-flex items-center bg-accent-subtle border border-accent/20 rounded-md px-2 py-0.5 font-syne text-[11px] text-accent-fg"
                          >
                            {d}
                          </span>
                        ))}
                        {ref.site_occupe && (
                          <span className="inline-flex items-center bg-amber-50 border border-amber-200 rounded-md px-2 py-0.5 font-syne text-[11px] text-amber-700">
                            Site occupé
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => openEditRef(ref)}
                      className="p-2 text-text-subtle hover:text-accent rounded-lg hover:bg-accent-subtle transition-colors duration-150"
                      aria-label="Modifier"
                    >
                      <PencilIcon />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteRef(ref.id)}
                      className="p-2 text-text-subtle hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors duration-150"
                      aria-label="Supprimer"
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}
