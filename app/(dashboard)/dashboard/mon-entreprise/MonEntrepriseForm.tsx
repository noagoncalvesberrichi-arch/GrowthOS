'use client'

import { useState, useTransition } from 'react'
import type { KeyboardEvent } from 'react'
import { sauvegarderProfil, type ProfilEntreprise, type ProfilFormData, type ProfilState } from './actions'

// ─── Sub-components ───────────────────────────────────────────────────────────

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
              className="inline-flex items-center gap-1.5 bg-background border border-border rounded-lg px-3 py-1 font-syne text-[12px] text-text"
            >
              {tag}
              {!disabled && (
                <button
                  type="button"
                  onClick={() => onRemove(tag)}
                  className="text-text-subtle hover:text-red-500 transition-colors duration-150"
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
  }
}

const inputClass = 'w-full bg-background border border-border rounded-lg px-3.5 py-2.5 font-syne text-[14px] text-text placeholder:text-text-subtle focus:border-accent focus:ring-2 focus:ring-accent/10 outline-none transition-all duration-150 disabled:opacity-50'

// ─── Main component ───────────────────────────────────────────────────────────

export function MonEntrepriseForm({ profil }: { profil: ProfilEntreprise | null }) {
  const [form, setForm] = useState<ProfilFormData>(() => initForm(profil))
  const [state, setState] = useState<ProfilState>(null)
  const [isPending, startTransition] = useTransition()

  const update = <K extends keyof ProfilFormData>(key: K, value: ProfilFormData[K]) => {
    setForm(prev => ({ ...prev, [key]: value }))
    setState(null)
  }

  const handleSave = () => {
    startTransition(async () => {
      const result = await sauvegarderProfil(form)
      setState(result)
    })
  }

  return (
    <div className="space-y-5">

      {/* Identité */}
      <div className="bg-surface border border-border rounded-2xl p-6 space-y-5">
        <p className="font-syne text-[11px] font-semibold text-text-subtle uppercase tracking-widest">Identité</p>

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

      {/* Compétences */}
      <div className="bg-surface border border-border rounded-2xl p-6 space-y-5">
        <p className="font-syne text-[11px] font-semibold text-text-subtle uppercase tracking-widest">Compétences &amp; certifications</p>

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

      {/* Capacités */}
      <div className="bg-surface border border-border rounded-2xl p-6 space-y-5">
        <p className="font-syne text-[11px] font-semibold text-text-subtle uppercase tracking-widest">Capacités</p>

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

      {/* Notes */}
      <div className="bg-surface border border-border rounded-2xl p-6">
        <Field label="Notes complémentaires" hint="Spécificités techniques, contraintes, atouts, références pertinentes…">
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

      {/* Footer */}
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
          className="group relative px-6 py-3 bg-accent hover:bg-accent-dark text-white font-syne font-bold text-[14px] rounded-xl transition-all duration-200 overflow-hidden shadow-card disabled:opacity-40 disabled:cursor-not-allowed"
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

    </div>
  )
}
