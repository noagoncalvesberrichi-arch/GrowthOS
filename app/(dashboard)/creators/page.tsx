export const metadata = { title: 'Growth Créateurs — Stratly' }

export default function CreatorsPage() {
  return (
    <div className="flex min-h-screen">
      <div className="w-[340px] shrink-0 border-r border-border bg-surface min-h-screen flex flex-col">
        <div className="px-6 pt-6 pb-5 border-b border-border">
          <div className="flex items-center gap-2 mb-3">
            <span className="bg-accent-subtle text-accent text-[11px] font-semibold font-syne px-2.5 py-1 rounded-full">Module 03</span>
          </div>
          <h1 className="font-syne text-[22px] font-extrabold text-text leading-tight">Créateurs</h1>
          <p className="font-syne text-[13px] text-text-muted mt-1.5">Social & Viral — TikTok, Instagram, YouTube, LinkedIn.</p>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center bg-background dot-grid p-8 min-h-screen">
        <div className="bg-surface border border-border rounded-2xl shadow-card-md p-8 max-w-sm w-full text-center">
          <div className="w-12 h-12 rounded-xl bg-accent-subtle flex items-center justify-center mx-auto mb-4">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </div>
          <h2 className="font-syne text-[18px] font-bold text-text mb-2">Bientôt disponible</h2>
          <p className="font-syne text-[13px] text-text-muted">Growth Créateurs arrive très prochainement.</p>
        </div>
      </div>
    </div>
  )
}
