import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export const metadata = { title: 'Tableau de bord — Stratly' }

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const firstName = user?.email?.split('@')[0] ?? 'toi'

  return (
    <div className="max-w-3xl mx-auto px-8 py-16">
      <div className="mb-2 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-accent" />
        <span className="font-syne text-[12px] font-semibold text-accent uppercase tracking-wider">
          Tableau de bord
        </span>
      </div>
      <h1 className="font-syne text-[32px] font-extrabold text-text tracking-tight mb-2">
        Bonjour, {firstName}&nbsp;👋
      </h1>
      <p className="font-syne text-[15px] text-text-muted mb-10">
        Que veux-tu faire aujourd&apos;hui ?
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Link
          href="/dashboard/analyser"
          className="group bg-surface border border-border hover:border-accent rounded-2xl p-7 transition-all duration-150 hover:shadow-card"
        >
          <div className="w-10 h-10 rounded-xl bg-accent-subtle flex items-center justify-center mb-5">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="12" y1="18" x2="12" y2="12" />
              <line x1="9" y1="15" x2="15" y2="15" />
            </svg>
          </div>
          <h2 className="font-syne text-[16px] font-bold text-text mb-1.5">Analyser un AO</h2>
          <p className="font-syne text-[13px] text-text-muted leading-relaxed">
            Dépose un PDF d&apos;appel d&apos;offres et obtiens une analyse structurée en quelques secondes.
          </p>
          <p className="font-syne text-[13px] font-semibold text-accent mt-4 group-hover:translate-x-0.5 transition-transform duration-150">
            Démarrer →
          </p>
        </Link>

        <Link
          href="/dashboard/mes-analyses"
          className="group bg-surface border border-border hover:border-accent rounded-2xl p-7 transition-all duration-150 hover:shadow-card"
        >
          <div className="w-10 h-10 rounded-xl bg-accent-subtle flex items-center justify-center mb-5">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
              <line x1="8" y1="6" x2="21" y2="6" />
              <line x1="8" y1="12" x2="21" y2="12" />
              <line x1="8" y1="18" x2="21" y2="18" />
              <line x1="3" y1="6" x2="3.01" y2="6" />
              <line x1="3" y1="12" x2="3.01" y2="12" />
              <line x1="3" y1="18" x2="3.01" y2="18" />
            </svg>
          </div>
          <h2 className="font-syne text-[16px] font-bold text-text mb-1.5">Mes analyses</h2>
          <p className="font-syne text-[13px] text-text-muted leading-relaxed">
            Retrouve et consulte toutes tes analyses passées classées par date.
          </p>
          <p className="font-syne text-[13px] font-semibold text-accent mt-4 group-hover:translate-x-0.5 transition-transform duration-150">
            Voir l&apos;historique →
          </p>
        </Link>
      </div>
    </div>
  )
}
