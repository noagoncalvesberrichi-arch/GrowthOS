'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type ChiffrageRow = {
  id: string
  created_at: string
  nom_fichier_acheteur: string
  nom_fichier_crm: string
  nb_lignes: number
  nb_rapprochees: number
  montant_total_ht: number | null
  statut: string
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function HistoriqueChiffrages() {
  const [rows, setRows] = useState<ChiffrageRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('chiffrages')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)
      .then(({ data }) => {
        setRows((data ?? []) as ChiffrageRow[])
        setLoading(false)
      })
  }, [])

  if (loading) return null

  return (
    <div className="mt-12 space-y-4">
      <div className="h-px bg-border" />
      <p className="font-syne text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted">
        Historique des chiffrages
      </p>

      {rows.length === 0 ? (
        <p className="font-syne text-[13px] text-text-muted">Aucun chiffrage généré pour l&apos;instant.</p>
      ) : (
        <div className="border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border bg-surface">
                  {['Date', 'Fichier acheteur', 'Fichier CRM', 'Lignes', 'Montant HT', 'Statut'].map(h => (
                    <th key={h} className="font-mono text-[10px] uppercase tracking-[0.1em] text-text-muted px-3 py-2.5">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map(row => (
                  <tr key={row.id} className="border-b border-border/40 last:border-0 hover:bg-surface/40">
                    <td className="px-3 py-2 font-mono text-[11px] text-text-muted whitespace-nowrap">{formatDate(row.created_at)}</td>
                    <td className="px-3 py-2 font-syne text-[12px] text-text max-w-[200px] truncate">{row.nom_fichier_acheteur}</td>
                    <td className="px-3 py-2 font-syne text-[12px] text-text-muted max-w-[160px] truncate">{row.nom_fichier_crm}</td>
                    <td className="px-3 py-2 font-mono text-[11px] text-text-muted whitespace-nowrap">{row.nb_rapprochees} / {row.nb_lignes}</td>
                    <td className="px-3 py-2 font-mono text-[12px] text-text whitespace-nowrap">
                      {row.montant_total_ht != null
                        ? row.montant_total_ht.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'
                        : '—'}
                    </td>
                    <td className="px-3 py-2">
                      <span className={`font-mono text-[10px] px-2 py-0.5 rounded-full border ${row.statut === 'ok' ? 'bg-green-500/8 border-green-500/20 text-green-400' : 'bg-red-500/8 border-red-500/20 text-red-400'}`}>
                        {row.statut}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
