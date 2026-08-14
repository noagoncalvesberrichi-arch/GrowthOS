import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { MemoireForm } from './MemoireForm'

export const metadata = { title: 'Mémoire technique — Stratly' }

export type AnalyseItem = {
  id: string
  objet_marche: string | null
  nom_fichier: string
  created_at: string
  go_no_go_verdict: string | null
}

export default async function MemoirePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: rawAnalyses } = await supabase
    .from('analyses')
    .select('id, objet_marche, nom_fichier, created_at, resultat')
    .order('created_at', { ascending: false })
    .limit(20)

  const analyses: AnalyseItem[] = (rawAnalyses ?? []).map((a) => ({
    id: a.id as string,
    objet_marche: a.objet_marche as string | null,
    nom_fichier: a.nom_fichier as string,
    created_at: a.created_at as string,
    go_no_go_verdict: (a.resultat as { go_no_go?: { verdict?: string } } | null)?.go_no_go?.verdict ?? null,
  }))

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 sm:px-8 sm:py-14">

      <div className="mb-8">
        <p className="font-syne text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-amber mb-3">
          Réponse aux appels d&apos;offres
        </p>
        <h1 className="font-fraunces text-[26px] sm:text-[32px] text-text tracking-tight leading-tight mb-3">
          Mémoire technique
        </h1>
        <p className="font-syne text-[14px] text-text-muted leading-relaxed max-w-lg">
          Génère une trame structurée et pré-remplie à partir de ton analyse d&apos;AO ou d&apos;une description du marché.
          Les passages <span className="font-semibold text-text">[À COMPLÉTER]</span> t&apos;indiquent ce que tu dois personnaliser.
        </p>
      </div>

      <MemoireForm analyses={analyses} />
    </div>
  )
}
