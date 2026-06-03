import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { AOResultDisplay } from '../../analyser/AOResultDisplay'
import type { AOResult, AOMetadata } from '../../analyser/actions'

export default async function AnalyseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data } = await supabase
    .from('analyses')
    .select('id, created_at, nom_fichier, objet_marche, resultat, tronque')
    .eq('id', id)
    .single()

  if (!data) notFound()

  const date = new Date(data.created_at as string).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const meta: AOMetadata = { tronque: data.tronque as boolean, chars_traites: 0, chars_total: 0 }

  return (
    <div className="max-w-2xl mx-auto px-8 py-10">
      <Link
        href="/dashboard/mes-analyses"
        className="inline-flex items-center gap-1.5 font-syne text-[12px] font-semibold text-text-muted hover:text-text transition-colors duration-150 mb-6"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M12 5l-7 7 7 7" />
        </svg>
        Mes analyses
      </Link>

      <div className="mb-2">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full bg-accent" />
          <span className="font-syne text-[12px] font-semibold text-accent uppercase tracking-wider">Analyse</span>
        </div>
        <h1 className="font-syne text-[24px] font-extrabold text-text tracking-tight leading-tight">
          {data.objet_marche as string}
        </h1>
        <p className="font-syne text-[12px] text-text-muted mt-1.5">
          {data.nom_fichier as string} · {date}
        </p>
      </div>

      <AOResultDisplay data={data.resultat as AOResult} meta={meta} />
    </div>
  )
}
