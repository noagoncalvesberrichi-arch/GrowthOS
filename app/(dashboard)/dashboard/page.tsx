import { createClient } from '@/lib/supabase/server'
import type { Cabinet } from '@/lib/database.types'

export const metadata = { title: 'Dashboard — Stratly' }

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: cabinet } = await supabase
    .from('cabinets')
    .select('*')
    .maybeSingle() as { data: Cabinet | null }

  return (
    <div className="max-w-3xl mx-auto px-8 py-16">
      <div className="mb-2 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-accent" />
        <span className="font-syne text-[12px] font-semibold text-accent uppercase tracking-wider">
          {cabinet?.name ?? 'Mon cabinet'}
        </span>
      </div>
      <h1 className="font-syne text-[32px] font-extrabold text-text tracking-tight mb-10">
        Dashboard
      </h1>

      <div className="bg-surface border border-border rounded-2xl px-8 py-12 text-center">
        <p className="text-4xl mb-4">🚧</p>
        <p className="font-syne text-[18px] font-bold text-text mb-2">Dashboard en construction</p>
        <p className="font-syne text-[14px] text-text-muted">
          L&apos;espace kiné arrive très bientôt. Cabinet configuré&nbsp;:{' '}
          <span className="font-semibold text-text">{cabinet?.name}</span>
        </p>
      </div>
    </div>
  )
}
