import Link from 'next/link'

export function Footer() {
  return (
    <footer className="bg-surface border-t border-border py-8 px-6">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-accent flex items-center justify-center shrink-0">
            <svg width="10" height="10" viewBox="0 0 14 14" fill="none">
              <path d="M2 11L5 5.5L8 8.5L10 5.5L12.5 11" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="font-syne font-bold text-[13px] text-text">GrowthOS</span>
          <span className="font-syne text-[12px] text-text-subtle ml-2">© 2025 Tous droits réservés.</span>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/pricing" className="font-syne text-[12px] text-text-subtle hover:text-text transition-colors">Pricing</Link>
          <Link href="/login" className="font-syne text-[12px] text-text-subtle hover:text-text transition-colors">Connexion</Link>
          <Link href="/dashboard" className="font-syne text-[12px] text-text-subtle hover:text-text transition-colors">Application</Link>
        </div>
      </div>
    </footer>
  )
}
