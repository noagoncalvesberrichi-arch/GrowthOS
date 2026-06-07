'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

// ─── Types ────────────────────────────────────────────────────────────────────

type AuthState = 'loading' | { email: string } | null

// ─── Atoms ────────────────────────────────────────────────────────────────────

function LogoMark() {
  return (
    <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center shrink-0">
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M2 11L5 5.5L8 8.5L10 5.5L12.5 11" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  )
}

function HamburgerIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

// ─── Account dropdown ─────────────────────────────────────────────────────────

function AccountDropdown({
  email,
  onLogout,
  onClose,
}: {
  email: string
  onLogout: () => void
  onClose: () => void
}) {
  const dropdownLinks = [
    { href: '/dashboard', label: 'Analyse', icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    )},
    { href: '/dashboard/mon-entreprise', label: 'Mon entreprise', icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 22V4a2 2 0 012-2h8a2 2 0 012 2v18"/><path d="M6 12H4a2 2 0 00-2 2v6a2 2 0 002 2h2"/><path d="M18 9h2a2 2 0 012 2v9a2 2 0 01-2 2h-2"/><path d="M10 6h4M10 10h4M10 14h4M10 18h4"/>
      </svg>
    )},
    { href: '/pricing', label: 'Tarifs', icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
      </svg>
    )},
  ]

  return (
    <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-border rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.1)] overflow-hidden z-50">
      <div className="px-4 py-3 border-b border-[#EEF2FF]">
        <p className="font-syne text-[11px] text-text-subtle truncate">{email}</p>
      </div>
      <div className="py-1.5">
        {dropdownLinks.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={onClose}
            className="flex items-center gap-3 px-4 py-2.5 font-syne text-[13px] font-semibold text-text hover:bg-[#F5F7FF] transition-colors duration-100 first:font-bold"
          >
            <span className="text-accent">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </div>
      <div className="py-1.5 border-t border-[#EEF2FF]">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 font-syne text-[13px] text-red-500 hover:bg-red-50 transition-colors duration-100"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Se déconnecter
        </button>
      </div>
    </div>
  )
}

// ─── TopNav ───────────────────────────────────────────────────────────────────

const NAV_LINKS = [
  { href: '/', label: 'Accueil' },
  { href: '/pricing', label: 'Tarifs' },
  { href: '/faq', label: 'FAQ' },
]

export function TopNav() {
  const pathname = usePathname()
  const router = useRouter()
  const [auth, setAuth] = useState<AuthState>('loading')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Auth detection + listener
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      setAuth(data.user ? { email: data.user.email ?? '' } : null)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setAuth(session?.user ? { email: session.user.email ?? '' } : null)
    })
    return () => subscription.unsubscribe()
  }, [])

  // Close mobile on route change
  useEffect(() => { setMobileOpen(false) }, [pathname])

  // Close dropdown on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setDropdownOpen(false); setMobileOpen(false) }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    setAuth(null)
    setDropdownOpen(false)
    setMobileOpen(false)
    router.push('/')
    router.refresh()
  }

  const isLoggedIn = auth !== 'loading' && auth !== null
  const userEmail = isLoggedIn ? (auth as { email: string }).email : ''
  const initial = userEmail ? userEmail.charAt(0).toUpperCase() : '?'

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(href + '/')

  const linkClass = (href: string) =>
    `font-syne text-[14px] font-medium px-4 py-2 rounded-lg transition-colors duration-150
     ${isActive(href) ? 'text-text bg-background' : 'text-text-muted hover:text-text hover:bg-background'}`

  return (
    <>
      <header className="sticky top-0 z-50 h-16 bg-surface/90 backdrop-blur-xl border-b border-border">
        <div className="max-w-6xl mx-auto px-6 h-full flex items-center justify-between">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <LogoMark />
            <span className="font-fraunces font-bold text-[17px] text-text tracking-tight">Stratly</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className={linkClass(link.href)}>
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop actions */}
          <div className="hidden md:flex items-center gap-2">
            {auth === 'loading' ? (
              <div className="w-36 h-8 rounded-lg bg-border/40 animate-pulse" />
            ) : isLoggedIn ? (
              <>
                <Link
                  href="/dashboard"
                  className="font-syne text-[14px] font-semibold text-text-muted hover:text-text px-4 py-2 rounded-lg transition-colors duration-150"
                >
                  Analyse
                </Link>
                <div ref={dropdownRef} className="relative">
                  <button
                    onClick={() => setDropdownOpen((o) => !o)}
                    aria-label="Menu compte"
                    className="w-8 h-8 rounded-full bg-accent hover:bg-accent-dark text-white font-syne font-bold text-[13px] flex items-center justify-center transition-colors duration-150 shadow-[0_2px_8px_rgba(37,99,235,0.3)]"
                  >
                    {initial}
                  </button>
                  {dropdownOpen && (
                    <AccountDropdown
                      email={userEmail}
                      onLogout={handleLogout}
                      onClose={() => setDropdownOpen(false)}
                    />
                  )}
                </div>
              </>
            ) : (
              <>
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
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen((o) => !o)}
            className="md:hidden p-2 rounded-lg text-text-muted hover:text-text hover:bg-background transition-colors duration-150"
            aria-label={mobileOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
          >
            {mobileOpen ? <CloseIcon /> : <HamburgerIcon />}
          </button>
        </div>
      </header>

      {/* ── Mobile drawer ──────────────────────────────────────────────────── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          {/* Panel */}
          <div className="absolute right-0 top-0 bottom-0 w-[300px] bg-surface shadow-2xl flex flex-col">

            {/* Panel header */}
            <div className="h-16 px-6 flex items-center justify-between border-b border-border shrink-0">
              <Link href="/" onClick={() => setMobileOpen(false)} className="flex items-center gap-2.5">
                <LogoMark />
                <span className="font-fraunces font-bold text-[17px] text-text">Stratly</span>
              </Link>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-2 rounded-lg text-text-muted hover:text-text hover:bg-background transition-colors"
              >
                <CloseIcon />
              </button>
            </div>

            {/* Nav links */}
            <nav className="flex-1 px-4 py-4 overflow-auto">
              <div className="space-y-1 mb-6">
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={`block px-4 py-2.5 rounded-xl font-syne text-[15px] font-semibold transition-colors duration-150
                      ${isActive(link.href) ? 'bg-accent-subtle text-accent' : 'text-text-muted hover:text-text hover:bg-background'}`}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>

              {/* Auth-dependent section */}
              {auth !== 'loading' && (
                <>
                  {isLoggedIn ? (
                    <>
                      <div className="h-px bg-border mb-4" />
                      <p className="font-syne text-[11px] font-semibold text-text-subtle uppercase tracking-widest px-4 mb-2">
                        Mon compte
                      </p>
                      <div className="space-y-1">
                        {[
                          { href: '/dashboard', label: 'Analyse' },
                          { href: '/dashboard/mon-entreprise', label: 'Mon entreprise' },
                        ].map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setMobileOpen(false)}
                            className="block px-4 py-2.5 rounded-xl font-syne text-[15px] font-semibold text-text-muted hover:text-text hover:bg-background transition-colors duration-150"
                          >
                            {item.label}
                          </Link>
                        ))}
                      </div>
                      {userEmail && (
                        <p className="font-syne text-[11px] text-text-subtle px-4 mt-4 truncate">{userEmail}</p>
                      )}
                      <div className="h-px bg-border my-4" />
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2.5 rounded-xl font-syne text-[15px] font-semibold text-red-500 hover:bg-red-50 transition-colors duration-150"
                      >
                        Se déconnecter
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="h-px bg-border mb-4" />
                      <div className="space-y-2 px-1">
                        <Link
                          href="/login"
                          onClick={() => setMobileOpen(false)}
                          className="block w-full text-center px-4 py-3 rounded-xl font-syne text-[14px] font-semibold text-text-muted border border-border hover:border-accent/40 hover:text-text transition-colors duration-150"
                        >
                          Se connecter
                        </Link>
                        <Link
                          href="/signup"
                          onClick={() => setMobileOpen(false)}
                          className="block w-full text-center px-4 py-3 rounded-xl font-syne text-[14px] font-bold text-[#1E3A8A] bg-brand-amber hover:bg-brand-amber-dark transition-colors duration-150"
                        >
                          Commencer gratuitement →
                        </Link>
                      </div>
                    </>
                  )}
                </>
              )}
            </nav>
          </div>
        </div>
      )}
    </>
  )
}
