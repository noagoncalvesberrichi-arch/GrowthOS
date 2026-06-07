import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export const metadata = { title: 'Mes analyses — Stratly' }

type AnalyseRow = {
  id: string
  created_at: string
  nom_fichier: string
  objet_marche: string
  tronque: boolean
}

export default async function MesAnalysesPage() {
  const supabase = await createClient()
  const { data: analyses } = await supabase
    .from('analyses')
    .select('id, created_at, nom_fichier, objet_marche, tronque')
    .order('created_at', { ascending: false }) as { data: AnalyseRow[] | null }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 sm:px-8 sm:py-14">

      {/* Header */}
      <div className="mb-8">
        <p className="font-syne text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-amber mb-3">
          Historique
        </p>
        <h1 className="font-fraunces text-[26px] sm:text-[32px] text-text tracking-tight leading-tight">
          Mes analyses
        </h1>
        <p className="font-syne text-[14px] text-text-muted mt-1.5">
          Retrouve ici toutes tes analyses d&apos;appels d&apos;offres.
        </p>
      </div>

      {!analyses || analyses.length === 0 ? (
        <div className="bg-surface border border-border rounded-2xl px-5 py-12 sm:px-8 sm:py-16 text-center shadow-[0_2px_16px_rgba(37,99,235,0.04)]">
          <div
            className="w-13 h-13 rounded-xl flex items-center justify-center mx-auto mb-5"
            style={{ background: 'linear-gradient(135deg, #EFF6FF, #DBEAFE)', width: 52, height: 52 }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          </div>
          <p className="font-fraunces text-[20px] text-text mb-2">Aucune analyse pour l&apos;instant</p>
          <p className="font-syne text-[13px] text-text-muted mb-7">
            Analyse ton premier appel d&apos;offres pour le retrouver ici.
          </p>
          <Link
            href="/dashboard/analyser"
            className="inline-flex items-center font-syne font-bold text-[13px] text-white bg-accent hover:bg-accent-dark px-5 py-2.5 rounded-xl shadow-[0_4px_16px_rgba(37,99,235,0.2)] transition-all duration-200"
          >
            Analyser un AO →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {analyses.map((a) => {
            const date = new Date(a.created_at).toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })
            return (
              <Link
                key={a.id}
                href={`/dashboard/mes-analyses/${a.id}`}
                className="group flex items-center justify-between gap-4 bg-surface border border-border hover:border-accent/40 rounded-xl px-5 py-4 transition-all duration-200 hover:shadow-[0_4px_20px_rgba(37,99,235,0.08)]"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div
                    className="w-9 h-9 rounded-lg shrink-0 flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, #EFF6FF, #DBEAFE)' }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className="font-syne text-[14px] font-bold text-text leading-snug truncate">
                      {a.objet_marche}
                    </p>
                    <p className="font-syne text-[12px] text-text-muted mt-0.5 truncate">
                      {a.nom_fichier} · {date}
                      {a.tronque && (
                        <span className="ml-2 text-amber-600 font-semibold">⚠ tronqué</span>
                      )}
                    </p>
                  </div>
                </div>
                <span className="font-syne text-[13px] font-semibold text-accent shrink-0 group-hover:translate-x-0.5 transition-transform duration-150">
                  Voir →
                </span>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
