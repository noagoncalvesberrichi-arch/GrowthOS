export const metadata = { title: 'Growth B2B — GrowthOS' }

export default function GrowthB2BPage() {
  return (
    <div className="flex min-h-screen">
      <div className="w-[340px] shrink-0 border-r border-border bg-surface min-h-screen flex flex-col">
        <div className="px-6 pt-6 pb-5 border-b border-border">
          <div className="flex items-center gap-2 mb-3">
            <span className="bg-accent-subtle text-accent text-[11px] font-semibold font-syne px-2.5 py-1 rounded-full">Module 02</span>
          </div>
          <h1 className="font-syne text-[22px] font-extrabold text-text leading-tight">Growth B2B</h1>
          <p className="font-syne text-[13px] text-text-muted mt-1.5">Contenu & Visibilité LinkedIn / Newsletter.</p>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center bg-background dot-grid p-8 min-h-screen">
        <div className="bg-surface border border-border rounded-2xl shadow-card-md p-8 max-w-sm w-full text-center">
          <div className="w-12 h-12 rounded-xl bg-accent-subtle flex items-center justify-center mx-auto mb-4">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" />
            </svg>
          </div>
          <h2 className="font-syne text-[18px] font-bold text-text mb-2">Bientôt disponible</h2>
          <p className="font-syne text-[13px] text-text-muted">Growth B2B arrive très prochainement.</p>
        </div>
      </div>
    </div>
  )
}
