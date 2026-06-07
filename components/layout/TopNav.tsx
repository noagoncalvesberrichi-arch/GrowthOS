'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

function LogoMark() {
  return (
    <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center shrink-0">
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M2 11L5 5.5L8 8.5L10 5.5L12.5 11" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  )
}

const navLinks = [
  { href: '/#modules', label: 'Fonctionnalités' },
  { href: '/pricing', label: 'Tarifs' },
]

export function TopNav() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-50 h-16 bg-surface/90 backdrop-blur-xl border-b border-border">
      <div className="max-w-6xl mx-auto px-6 h-full flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <LogoMark />
          <span className="font-fraunces font-bold text-[17px] text-text tracking-tight">Stratly</span>
        </Link>

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`font-syne text-[14px] font-medium px-4 py-2 rounded-lg transition-colors duration-150
                ${pathname === link.href ? 'text-text bg-background' : 'text-text-muted hover:text-text hover:bg-background'}
              `}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="font-syne text-[14px] font-medium text-text-muted hover:text-text px-4 py-2 rounded-lg transition-colors duration-150"
          >
            Se connecter
          </Link>
          <Link
            href="/signup"
            className="group relative font-syne text-[14px] font-bold text-[#1E3A8A] bg-brand-amber hover:bg-brand-amber-dark px-4 py-2 rounded-lg transition-all duration-200 overflow-hidden shadow-[0_2px_12px_rgba(217,119,6,0.25)]"
          >
            <span
              aria-hidden="true"
              className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none"
            />
            <span className="relative">Commencer →</span>
          </Link>
        </div>
      </div>
    </header>
  )
}
