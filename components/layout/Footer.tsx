import Link from 'next/link'

const navLinks = [
  { href: '/', label: 'Accueil' },
  { href: '/pricing', label: 'Tarifs' },
  { href: '/faq', label: 'FAQ' },
]

const legalLinks = [
  { href: '/mentions-legales', label: 'Mentions légales' },
  { href: '/cgv', label: 'CGV' },
  { href: '/confidentialite', label: 'Politique de confidentialité' },
]

export function Footer() {
  return (
    <footer
      className="border-t border-white/8"
      style={{ background: 'linear-gradient(180deg, #0F1B4D 0%, #0C1647 100%)' }}
    >
      <div className="max-w-6xl mx-auto px-8 pt-14 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-12">

          {/* Brand */}
          <div>
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <div className="w-7 h-7 rounded-lg bg-white/15 border border-white/20 flex items-center justify-center shrink-0">
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                  <path d="M2 11L5 5.5L8 8.5L10 5.5L12.5 11" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <span className="font-fraunces font-bold text-[17px] text-white tracking-tight">Stratly</span>
            </Link>
            <p className="font-syne text-[13px] text-white/40 leading-relaxed max-w-[220px]">
              L&apos;outil d&apos;analyse pour les appels d&apos;offres publics.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <p className="font-syne text-[10px] font-semibold text-white/25 uppercase tracking-widest mb-4">
              Navigation
            </p>
            <ul className="space-y-2.5">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="font-syne text-[13px] text-white/45 hover:text-white/75 transition-colors duration-150"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Légal */}
          <div>
            <p className="font-syne text-[10px] font-semibold text-white/25 uppercase tracking-widest mb-4">
              Légal
            </p>
            <ul className="space-y-2.5">
              {legalLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="font-syne text-[13px] text-white/45 hover:text-white/75 transition-colors duration-150"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/8 pt-6">
          <p className="font-syne text-[12px] text-white/25">
            © 2026 Stratly. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  )
}
