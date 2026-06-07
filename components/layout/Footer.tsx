import Link from 'next/link'

export function Footer() {
  return (
    <footer
      className="py-10 px-6 border-t border-white/8"
      style={{ background: 'linear-gradient(180deg, #0F1B4D 0%, #0C1647 100%)' }}
    >
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-5">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-md bg-white/15 border border-white/20 flex items-center justify-center shrink-0">
            <svg width="11" height="11" viewBox="0 0 14 14" fill="none">
              <path d="M2 11L5 5.5L8 8.5L10 5.5L12.5 11" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="font-fraunces font-bold text-[15px] text-white">Stratly</span>
          <span className="font-syne text-[12px] text-white/30 ml-2">© 2025 Tous droits réservés.</span>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/pricing" className="font-syne text-[12px] text-white/35 hover:text-white/70 transition-colors">Tarifs</Link>
          <Link href="/login" className="font-syne text-[12px] text-white/35 hover:text-white/70 transition-colors">Connexion</Link>
          <Link href="/dashboard" className="font-syne text-[12px] text-white/35 hover:text-white/70 transition-colors">Application</Link>
        </div>
      </div>
    </footer>
  )
}
