import Link from 'next/link'
import { Logo } from '@/components/Logo'

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
            <Link href="/" className="flex items-center mb-4">
              <Logo variant="dark" />
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
