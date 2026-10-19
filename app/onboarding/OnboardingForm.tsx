'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { sauvegarderProfilOnboarding, passerOnboarding } from './actions'

const DOMAINES_SUGGERES = [
  'Espaces verts', 'Voirie / VRD', 'Bâtiment', 'Génie civil',
  'Terrassement', 'Éclairage public', 'Signalisation', 'Sport / Loisirs',
  'Réseaux', 'Maçonnerie', 'Paysagisme',
]

type SiretData = {
  raison_sociale: string
  forme_juridique: string
  adresse: string
}

async function rechercherSiret(siret: string): Promise<SiretData | null> {
  try {
    const r = await fetch(
      `https://recherche-entreprises.api.gouv.fr/search?q=${encodeURIComponent(siret)}&page=1&per_page=1`,
      { signal: AbortSignal.timeout(5000) }
    )
    if (!r.ok) return null
    const json = await r.json()
    const result = json?.results?.[0]
    if (!result) return null
    return {
      raison_sociale: result.nom_complet ?? result.nom_raison_sociale ?? '',
      forme_juridique: result.nature_juridique_libelle ?? result.forme_juridique ?? '',
      adresse: result.siege?.adresse ?? result.siege?.geo_adresse ?? '',
    }
  } catch {
    return null
  }
}

export function OnboardingForm() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isSkipping, startSkipTransition] = useTransition()

  const [siret, setSiret] = useState('')
  const [siretLoading, setSiretLoading] = useState(false)
  const [siretError, setSiretError] = useState('')
  const [raisonSociale, setRaisonSociale] = useState('')
  const [formeJuridique, setFormeJuridique] = useState('')
  const [adresse, setAdresse] = useState('')
  const [domaines, setDomaines] = useState<string[]>([])
  const [domaineInput, setDomaineInput] = useState('')
  const [zone, setZone] = useState('')
  const [error, setError] = useState('')

  const handleSiretBlur = async () => {
    const clean = siret.replace(/\s/g, '')
    if (clean.length !== 14 || !/^\d+$/.test(clean)) return
    setSiretLoading(true)
    setSiretError('')
    const data = await rechercherSiret(clean)
    setSiretLoading(false)
    if (!data) {
      setSiretError("SIRET introuvable — remplissez manuellement.")
      return
    }
    if (data.raison_sociale && !raisonSociale) setRaisonSociale(data.raison_sociale)
    if (data.forme_juridique && !formeJuridique) setFormeJuridique(data.forme_juridique)
    if (data.adresse && !adresse) setAdresse(data.adresse)
  }

  const toggleDomaine = (d: string) => {
    setDomaines(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d])
  }

  const addDomaineInput = () => {
    const v = domaineInput.trim()
    if (v && !domaines.includes(v)) setDomaines(prev => [...prev, v])
    setDomaineInput('')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!raisonSociale.trim()) { setError('La raison sociale est obligatoire.'); return }
    if (domaines.length === 0) { setError("Sélectionnez au moins un domaine d'activité."); return }
    setError('')
    startTransition(async () => {
      const res = await sauvegarderProfilOnboarding({
        raison_sociale: raisonSociale.trim(),
        siret: siret.replace(/\s/g, '') || null,
        forme_juridique: formeJuridique.trim() || null,
        adresse_siege: adresse.trim() || null,
        domaines,
        zone_geographique: zone.trim() || null,
      })
      if (res && 'error' in res) { setError(res.error); return }
      router.push('/dashboard')
    })
  }

  const handlePasser = () => {
    startSkipTransition(async () => {
      await passerOnboarding()
      router.push('/dashboard')
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* SIRET */}
      <div className="space-y-1.5">
        <label className="block font-syne text-[12px] font-semibold text-text-muted">
          SIRET <span className="text-text-subtle font-normal">(14 chiffres — prérempli automatiquement)</span>
        </label>
        <div className="relative">
          <input
            type="text"
            value={siret}
            onChange={e => setSiret(e.target.value)}
            onBlur={handleSiretBlur}
            placeholder="123 456 789 01234"
            maxLength={17}
            className="w-full bg-surface border border-border rounded-xl px-4 py-2.5 font-syne text-[13px] text-text placeholder:text-text-subtle focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all duration-150"
          />
          {siretLoading && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2">
              <svg className="animate-spin w-4 h-4 text-accent" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </span>
          )}
        </div>
        {siretError && <p className="font-syne text-[11px] text-amber-600">{siretError}</p>}
      </div>

      {/* Raison sociale */}
      <div className="space-y-1.5">
        <label className="block font-syne text-[12px] font-semibold text-text-muted">
          Raison sociale <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={raisonSociale}
          onChange={e => setRaisonSociale(e.target.value)}
          placeholder="ex : ACME Espaces Verts SAS"
          required
          className="w-full bg-surface border border-border rounded-xl px-4 py-2.5 font-syne text-[13px] text-text placeholder:text-text-subtle focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all duration-150"
        />
      </div>

      {/* Zone d'intervention */}
      <div className="space-y-1.5">
        <label className="block font-syne text-[12px] font-semibold text-text-muted">Zone d&apos;intervention</label>
        <input
          type="text"
          value={zone}
          onChange={e => setZone(e.target.value)}
          placeholder="ex : Île-de-France, Grand Est, National…"
          className="w-full bg-surface border border-border rounded-xl px-4 py-2.5 font-syne text-[13px] text-text placeholder:text-text-subtle focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all duration-150"
        />
      </div>

      {/* Domaines d'activité */}
      <div className="space-y-2">
        <label className="block font-syne text-[12px] font-semibold text-text-muted">
          Domaines d&apos;activité <span className="text-red-500">*</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {DOMAINES_SUGGERES.map(d => (
            <button
              key={d}
              type="button"
              onClick={() => toggleDomaine(d)}
              className={`font-syne text-[12px] px-3 py-1.5 rounded-lg border transition-all duration-150 ${
                domaines.includes(d)
                  ? 'bg-accent text-white border-accent'
                  : 'bg-surface text-text-muted border-border hover:border-accent/50'
              }`}
            >
              {d}
            </button>
          ))}
        </div>
        {/* Domaine personnalisé */}
        <div className="flex gap-2 mt-2">
          <input
            type="text"
            value={domaineInput}
            onChange={e => setDomaineInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addDomaineInput() } }}
            placeholder="Autre domaine…"
            className="flex-1 bg-surface border border-border rounded-xl px-4 py-2 font-syne text-[12px] text-text placeholder:text-text-subtle focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all duration-150"
          />
          <button
            type="button"
            onClick={addDomaineInput}
            className="font-syne text-[12px] font-semibold px-3 py-2 bg-surface border border-border rounded-xl hover:border-accent/50 text-text-muted transition-all duration-150"
          >
            Ajouter
          </button>
        </div>
        {domaines.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1">
            {domaines.filter(d => !DOMAINES_SUGGERES.includes(d)).map(d => (
              <span key={d} className="inline-flex items-center gap-1 font-syne text-[11px] bg-accent/10 text-accent border border-accent/20 px-2.5 py-1 rounded-full">
                {d}
                <button type="button" onClick={() => toggleDomaine(d)} className="hover:text-red-500 transition-colors">×</button>
              </span>
            ))}
          </div>
        )}
      </div>

      {error && <p className="font-syne text-[13px] text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</p>}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={isPending || isSkipping}
          className="w-full sm:w-auto sm:flex-1 py-3 bg-accent hover:bg-accent/90 text-white font-syne font-bold text-[14px] rounded-xl transition-all duration-200 shadow-[0_4px_16px_rgba(37,99,235,0.22)] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? 'Enregistrement…' : 'Enregistrer et commencer →'}
        </button>
        <button
          type="button"
          onClick={handlePasser}
          disabled={isPending || isSkipping}
          className="font-syne text-[13px] font-semibold text-text-subtle hover:text-text-muted transition-colors disabled:opacity-50"
        >
          {isSkipping ? 'Redirection…' : 'Passer pour l\'instant'}
        </button>
      </div>
    </form>
  )
}
