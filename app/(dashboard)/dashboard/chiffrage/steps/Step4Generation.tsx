'use client'

import { useState, useEffect } from 'react'
import type { FileAnalysis, ColumnMapping, MatchedRow } from '@/lib/chiffrage/types'
import type { ProfilEntreprise } from '@/app/(dashboard)/dashboard/mon-entreprise/actions'
import type { ActeData } from '@/lib/chiffrage/acteEngagement'

type Props = {
  acheteurFile: File
  acheteurAnalysis: FileAnalysis
  acheteurMappings: Record<string, ColumnMapping>
  matches: MatchedRow[]
  profil: Partial<ProfilEntreprise> | null
  onReset: () => void
}

const INPUT = 'w-full bg-background border border-border rounded-xl px-4 py-3 font-syne text-[13px] text-text placeholder:text-text-subtle focus:outline-none focus:border-brand-amber focus:ring-2 focus:ring-brand-amber/10 transition-all'

export function Step4Generation({ acheteurFile, acheteurAnalysis, acheteurMappings, matches, profil, onReset }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [generated, setGenerated] = useState(false)
  const [montantHt, setMontantHt] = useState(0)
  const [nbLignes, setNbLignes] = useState(0)
  const [nbRapprochees, setNbRapprochees] = useState(0)
  const [avertissements, setAvertissements] = useState<string[]>([])

  // Acte d'engagement form
  const [acteObjet, setActeObjet] = useState('')
  const [acteAcheteur, setActeAcheteur] = useState('')
  const [acteDuree, setActeDuree] = useState('')
  const [acteLieu, setActeLieu] = useState('')
  const [acteTva, setActeTva] = useState('20')
  const [acteLoading, setActeLoading] = useState(false)
  const [acteError, setActeError] = useState<string | null>(null)

  // Auto-generate on mount
  useEffect(() => {
    if (!loading && !generated && !error) {
      handleGenerate()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleGenerate = async () => {
    setLoading(true)
    setError(null)
    try {
      const fd = new FormData()
      fd.append('acheteur', acheteurFile)
      fd.append('matches', JSON.stringify(matches.filter(m => m.pu_ht_crm != null).map(m => ({ rowId: m.acheteurRowId, pu_ht: m.pu_ht_crm }))))
      fd.append('acheteurMappings', JSON.stringify(acheteurMappings))
      fd.append('acheteurStructure', JSON.stringify(acheteurAnalysis))

      const res = await fetch('/api/chiffrage/generer', { method: 'POST', body: fd })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error ?? 'Erreur serveur')
      }

      const ht = parseFloat(res.headers.get('X-Montant-Total-Ht') ?? '0')
      const nb = parseInt(res.headers.get('X-Nb-Lignes') ?? '0', 10)
      const nbR = parseInt(res.headers.get('X-Nb-Rapprochees') ?? '0', 10)

      setMontantHt(isNaN(ht) ? 0 : ht)
      setNbLignes(isNaN(nb) ? 0 : nb)
      setNbRapprochees(isNaN(nbR) ? 0 : nbR)
      setGenerated(true)

      // Download
      const blob = await res.blob()
      const baseName = acheteurFile.name.replace(/\.xlsx$/i, '')
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${baseName}_chiffré.xlsx`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur lors de la génération.')
    } finally {
      setLoading(false)
    }
  }

  const handleActeEngagement = async () => {
    setActeLoading(true)
    setActeError(null)
    try {
      const { genererActeEngagementDocx } = await import('@/lib/chiffrage/acteEngagement')
      const data: ActeData = {
        objet: acteObjet,
        acheteur: acteAcheteur,
        raison_sociale: profil?.raison_sociale ?? '',
        forme_juridique: profil?.forme_juridique ?? '',
        adresse_siege: profil?.adresse_siege ?? '',
        siret: profil?.siret ?? '',
        nom_signataire: profil?.nom_signataire ?? '',
        qualite_signataire: profil?.qualite_signataire ?? '',
        iban: profil?.iban ?? null,
        bic: profil?.bic ?? null,
        montant_ht: montantHt,
        taux_tva: parseFloat(acteTva) || 20,
        duree_marche: acteDuree,
        lieu_execution: acteLieu,
      }
      await genererActeEngagementDocx(data)
    } catch (e) {
      setActeError(e instanceof Error ? e.message : 'Erreur lors de la génération de l\'acte.')
    } finally {
      setActeLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <svg className="animate-spin text-brand-amber" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0" opacity="0.2" /><path d="M21 12a9 9 0 00-9-9" />
        </svg>
        <p className="font-syne text-[14px] text-text-muted">Génération du fichier chiffré…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="bg-red-500/8 border border-red-500/20 rounded-xl px-4 py-4">
          <p className="font-syne text-[13px] text-red-400">{error}</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleGenerate} className="font-syne text-[13px] font-semibold px-5 py-2.5 rounded-xl bg-brand-amber text-background hover:bg-brand-amber/90 transition-colors">
            Réessayer
          </button>
          <button onClick={onReset} className="font-syne text-[13px] font-semibold px-5 py-2.5 rounded-xl border border-border text-text-muted hover:text-text transition-colors">
            Recommencer
          </button>
        </div>
      </div>
    )
  }

  if (!generated) return null

  return (
    <div className="space-y-6">
      {/* Success */}
      <div className="bg-green-500/6 border border-green-500/20 rounded-xl p-5 space-y-3">
        <div className="flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="text-green-400">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <p className="font-syne text-[14px] font-semibold text-text">Fichier généré et téléchargé</p>
        </div>
        <div className="flex flex-wrap gap-4 text-[12px] font-mono text-text-muted">
          <span>{nbRapprochees} / {nbLignes} lignes remplies</span>
          {montantHt > 0 && (
            <span>Total HT : {montantHt.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</span>
          )}
        </div>
        {avertissements.length > 0 && (
          <ul className="space-y-1">
            {avertissements.map((w, i) => (
              <li key={i} className="font-syne text-[12px] text-yellow-400 flex items-start gap-2">
                <span>⚠</span><span>{w}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Acte d'engagement */}
      <div className="bg-surface border border-border rounded-xl p-5 space-y-4">
        <p className="font-syne text-[14px] font-semibold text-text">Remplir l&apos;acte d&apos;engagement</p>
        <p className="font-syne text-[12px] text-text-muted">
          Génère un acte d&apos;engagement (.docx) au format ATTRI1 avec le montant total HT calculé.
        </p>

        {/* Pre-filled profil fields (read-only) */}
        {(profil?.raison_sociale || profil?.siret) && (
          <div className="bg-background rounded-xl border border-border p-4 space-y-1">
            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-text-muted mb-2">Depuis votre profil entreprise</p>
            {profil.raison_sociale && <p className="font-syne text-[12px] text-text">{profil.raison_sociale} {profil.forme_juridique ? `— ${profil.forme_juridique}` : ''}</p>}
            {profil.siret && <p className="font-mono text-[11px] text-text-muted">SIRET : {profil.siret}</p>}
            {(!profil.raison_sociale || !profil.siret || !profil.nom_signataire) && (
              <p className="font-syne text-[11px] text-yellow-400 mt-1">
                Complétez votre profil entreprise (raison sociale, SIRET, signataire) pour un acte pré-rempli.
              </p>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="font-syne text-[11px] text-text-muted block mb-1">Objet du marché</label>
            <input className={INPUT} value={acteObjet} onChange={e => setActeObjet(e.target.value)} placeholder="Ex : Rénovation des revêtements de sol…" />
          </div>
          <div>
            <label className="font-syne text-[11px] text-text-muted block mb-1">Acheteur public</label>
            <input className={INPUT} value={acteAcheteur} onChange={e => setActeAcheteur(e.target.value)} placeholder="Ex : Mairie de Paris" />
          </div>
          <div>
            <label className="font-syne text-[11px] text-text-muted block mb-1">Durée du marché</label>
            <input className={INPUT} value={acteDuree} onChange={e => setActeDuree(e.target.value)} placeholder="Ex : 6 mois" />
          </div>
          <div>
            <label className="font-syne text-[11px] text-text-muted block mb-1">Lieu d&apos;exécution</label>
            <input className={INPUT} value={acteLieu} onChange={e => setActeLieu(e.target.value)} placeholder="Ex : 75015 Paris" />
          </div>
          <div>
            <label className="font-syne text-[11px] text-text-muted block mb-1">Taux TVA (%)</label>
            <input className={INPUT} type="number" min="0" max="100" value={acteTva} onChange={e => setActeTva(e.target.value)} />
          </div>
        </div>

        {montantHt > 0 && (
          <div className="bg-background border border-border rounded-xl px-4 py-3 flex justify-between items-center">
            <span className="font-syne text-[12px] text-text-muted">Montant total HT</span>
            <span className="font-mono text-[14px] font-semibold text-text">
              {montantHt.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
            </span>
          </div>
        )}

        {acteError && (
          <p className="font-syne text-[12px] text-red-400">{acteError}</p>
        )}

        <button
          onClick={handleActeEngagement}
          disabled={acteLoading || !acteObjet || !acteAcheteur}
          className="font-syne text-[13px] font-semibold px-6 py-2.5 rounded-xl bg-brand-amber text-background hover:bg-brand-amber/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          {acteLoading && (
            <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0" opacity="0.3" /><path d="M21 12a9 9 0 00-9-9" /></svg>
          )}
          Télécharger l&apos;acte d&apos;engagement (.docx)
        </button>
      </div>

      <div className="flex justify-end">
        <button onClick={onReset} className="font-syne text-[13px] text-text-muted hover:text-text transition-colors">
          ← Nouveau chiffrage
        </button>
      </div>
    </div>
  )
}
