import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export const metadata = { title: 'Tableau de bord — Stratly' }

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const firstName = user?.email?.split('@')[0] ?? 'toi'

  return (
    <div className="max-w-3xl mx-auto px-8 py-14">

      {/* Header */}
      <div className="mb-10">
        <p className="font-syne text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-amber mb-3">
          Tableau de bord
        </p>
        <h1 className="font-fraunces text-[36px] text-text tracking-tight leading-tight mb-2">
          Bonjour, {firstName}&nbsp;👋
        </h1>
        <p className="font-syne text-[15px] text-text-muted">
          Que veux-tu faire aujourd&apos;hui ?
        </p>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Link
          href="/dashboard/analyser"
          className="group bg-surface border border-border hover:border-accent/40 rounded-2xl p-7 transition-all duration-200 hover:shadow-[0_8px_32px_rgba(37,99,235,0.1)]"
        >
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center mb-5"
            style={{ background: 'linear-gradient(135deg, #EFF6FF, #DBEAFE)' }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="12" y1="18" x2="12" y2="12" />
              <line x1="9" y1="15" x2="15" y2="15" />
            </svg>
          </div>
          <h2 className="font-fraunces text-[19px] text-text mb-1.5 leading-snug">Analyser un AO</h2>
          <p className="font-syne text-[13px] text-text-muted leading-relaxed">
            Dépose un PDF d&apos;appel d&apos;offres et obtiens une analyse structurée en quelques secondes.
          </p>
          <p className="font-syne text-[13px] font-semibold text-accent mt-5 group-hover:translate-x-0.5 transition-transform duration-150">
            Démarrer →
          </p>
        </Link>

        <Link
          href="/dashboard/mes-analyses"
          className="group bg-surface border border-border hover:border-accent/40 rounded-2xl p-7 transition-all duration-200 hover:shadow-[0_8px_32px_rgba(37,99,235,0.1)]"
        >
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center mb-5"
            style={{ background: 'linear-gradient(135deg, #EFF6FF, #DBEAFE)' }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <line x1="8" y1="6" x2="21" y2="6" />
              <line x1="8" y1="12" x2="21" y2="12" />
              <line x1="8" y1="18" x2="21" y2="18" />
              <line x1="3" y1="6" x2="3.01" y2="6" />
              <line x1="3" y1="12" x2="3.01" y2="12" />
              <line x1="3" y1="18" x2="3.01" y2="18" />
            </svg>
          </div>
          <h2 className="font-fraunces text-[19px] text-text mb-1.5 leading-snug">Mes analyses</h2>
          <p className="font-syne text-[13px] text-text-muted leading-relaxed">
            Retrouve et consulte toutes tes analyses passées classées par date.
          </p>
          <p className="font-syne text-[13px] font-semibold text-accent mt-5 group-hover:translate-x-0.5 transition-transform duration-150">
            Voir l&apos;historique →
          </p>
        </Link>
      </div>

    </div>
  )
}
