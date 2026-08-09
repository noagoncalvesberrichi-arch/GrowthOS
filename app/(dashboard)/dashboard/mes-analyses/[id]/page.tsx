import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { AOResultDisplay } from '../../analyser/AOResultDisplay'
import { RecoPrix } from '@/components/RecoPrix'
import { HistoriqueAcheteur } from '@/components/HistoriqueAcheteur'
import type { AOResult, AOMetadata } from '../../analyser/actions'

export default async function AnalyseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data }, { data: abo }] = await Promise.all([
    supabase
      .from('analyses')
      .select('id, created_at, nom_fichier, objet_marche, resultat, tronque')
      .eq('id', id)
      .single(),
    supabase.from('abonnements').select('plan').maybeSingle(),
  ])

  if (!data) notFound()
  const isPro = abo?.plan === 'pro'

  const date = new Date(data.created_at as string).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const meta: AOMetadata = {
    tronque: data.tronque as boolean,
    chars_traites: 0,
    chars_total: 0,
    fichiers_lus: [],
    fichiers_illisibles: [],
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 sm:px-8 sm:py-14">

      {/* Back */}
      <Link
        href="/dashboard/mes-analyses"
        className="inline-flex items-center gap-1.5 font-syne text-[12px] font-semibold text-text-muted hover:text-text transition-colors duration-150 mb-8"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M12 5l-7 7 7 7" />
        </svg>
        Mes analyses
      </Link>

      {/* Header */}
      <div className="mb-6">
        <p className="font-syne text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-amber mb-3">
          Analyse
        </p>
        <h1 className="font-fraunces text-[28px] text-text tracking-tight leading-tight mb-2">
          {data.objet_marche as string}
        </h1>
        <p className="font-syne text-[12px] text-text-muted">
          {data.nom_fichier as string} · {date}
        </p>
      </div>

      {/* Résultat — NE PAS MODIFIER */}
      <div className="overflow-x-auto">
        <AOResultDisplay data={data.resultat as AOResult} meta={meta} />
      </div>

      {/* Positionnement prix */}
      {(data.resultat as AOResult)?.siret_acheteur && (data.resultat as AOResult)?.code_cpv && (
        <div className="mt-8">
          <RecoPrix
            siret={(data.resultat as AOResult).siret_acheteur!}
            cpv={(data.resultat as AOResult).code_cpv!}
            montant={(data.resultat as AOResult).montant_estime}
            locked={!isPro}
          />
        </div>
      )}

      {/* Historique acheteur */}
      {(data.resultat as AOResult)?.siret_acheteur && (
        <div className="mt-8">
          <HistoriqueAcheteur
            siret={(data.resultat as AOResult).siret_acheteur!}
            cpv={(data.resultat as AOResult).code_cpv}
            locked={!isPro}
          />
        </div>
      )}
    </div>
  )
}
