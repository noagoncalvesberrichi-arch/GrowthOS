'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Logo } from '@/components/Logo'

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  )
}

function DocumentIcon({ active }: { active: boolean }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="12" y1="18" x2="12" y2="12" />
      <line x1="9" y1="15" x2="15" y2="15" />
    </svg>
  )
}

function ListIcon({ active }: { active: boolean }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  )
}

function BuildingIcon({ active }: { active: boolean }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 22V4a2 2 0 012-2h8a2 2 0 012 2v18" />
      <path d="M6 12H4a2 2 0 00-2 2v6a2 2 0 002 2h2" />
      <path d="M18 9h2a2 2 0 012 2v9a2 2 0 01-2 2h-2" />
      <path d="M10 6h4M10 10h4M10 14h4M10 18h4" />
    </svg>
  )
}

function SettingsIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  )
}

function PricingIcon({ active }: { active: boolean }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
    </svg>
  )
}

const mainLinks = [
  {
    id: 'analyser',
    label: 'Analyser un AO',
    description: 'Nouveau PDF',
    href: '/dashboard/analyser',
    icon: (active: boolean) => <DocumentIcon active={active} />,
  },
  {
    id: 'mes-analyses',
    label: 'Mes analyses',
    description: 'Historique',
    href: '/dashboard/mes-analyses',
    icon: (active: boolean) => <ListIcon active={active} />,
  },
  {
    id: 'mon-entreprise',
    label: 'Mon entreprise',
    description: 'Profil Go / No-Go',
    href: '/dashboard/mon-entreprise',
    icon: (active: boolean) => <BuildingIcon active={active} />,
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserEmail(user?.email ?? null)
    })
  }, [])

  useEffect(() => { setDrawerOpen(false) }, [pathname])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setDrawerOpen(false) }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

  const navItemClass = (active: boolean) =>
    `relative flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 border-l-[3px] pl-[9px] group
     ${active
       ? 'bg-white/10 text-white border-brand-amber'
       : 'text-white/50 hover:bg-white/6 hover:text-white/80 border-transparent'}`

  const iconClass = (active: boolean) =>
    `shrink-0 transition-colors duration-150 ${active ? 'text-white' : 'text-white/35 group-hover:text-white/60'}`

  const renderNav = (onClose?: () => void) => (
    <>
      <nav className="flex-1 px-3 pt-4 pb-3 overflow-auto space-y-4">
        <div>
          <ul className="space-y-0.5">
            <li>
              <Link href="/dashboard" onClick={onClose} className={navItemClass(pathname === '/dashboard')}>
                <span className={iconClass(pathname === '/dashboard')}>
                  <HomeIcon active={pathname === '/dashboard'} />
                </span>
                <div className="min-w-0">
                  <p className="font-syne text-[13px] font-semibold leading-none">Vue d&apos;ensemble</p>
                  <p className="font-syne text-[11px] text-white/30 mt-0.5">Accueil</p>
                </div>
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="text-[10px] font-semibold text-white/25 uppercase tracking-widest px-3 mb-2 font-syne">
            Mon espace
          </p>
          <ul className="space-y-0.5">
            {mainLinks.map((link) => {
              const active = isActive(link.href)
              return (
                <li key={link.id}>
                  <Link href={link.href} onClick={onClose} className={navItemClass(active)}>
                    <span className={iconClass(active)}>{link.icon(active)}</span>
                    <div className="min-w-0">
                      <p className="font-syne text-[13px] font-semibold leading-none">{link.label}</p>
                      <p className="font-syne text-[11px] text-white/30 mt-0.5">{link.description}</p>
                    </div>
                  </Link>
                </li>
              )
            })}
            <li>
              <div className="relative flex items-center gap-3 px-3 py-2.5 rounded-lg border-l-[3px] border-transparent opacity-40 cursor-not-allowed pl-[9px]">
                <span className="shrink-0 text-white/35"><SettingsIcon /></span>
                <div className="min-w-0 flex-1">
                  <p className="font-syne text-[13px] font-semibold leading-none text-white/60">Paramètres</p>
                  <p className="font-syne text-[11px] text-white/30 mt-0.5 truncate">Compte &amp; profil</p>
                </div>
                <span className="font-syne text-[9px] font-bold text-white/30 bg-white/8 border border-white/12 px-1.5 py-0.5 rounded-full shrink-0">
                  Bientôt
                </span>
              </div>
            </li>
          </ul>
        </div>

        <div>
          <div className="mx-1 mb-3 h-px bg-white/8" />
          <ul className="space-y-0.5">
            <li>
              <Link href="/pricing" onClick={onClose} className={navItemClass(isActive('/pricing'))}>
                <span className={iconClass(isActive('/pricing'))}>
                  <PricingIcon active={isActive('/pricing')} />
                </span>
                <p className="font-syne text-[13px] font-semibold">Tarifs</p>
              </Link>
            </li>
          </ul>
        </div>
      </nav>

      <div className="px-4 py-4 border-t border-white/8 space-y-3 shrink-0">
        {userEmail && (
          <p className="font-syne text-[11px] text-white/30 px-1 truncate">{userEmail}</p>
        )}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg font-syne text-[12px] font-semibold text-white/40 hover:text-red-300 hover:bg-red-500/10 transition-all duration-150"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Se déconnecter
        </button>
      </div>
    </>
  )

  const navBg = { background: 'linear-gradient(180deg, #0C1647 0%, #0F1B4D 100%)' }

  return (
    <>
      {/* ── Desktop sidebar (md+) ── */}
      <aside
        className="hidden md:flex w-[240px] min-h-screen flex-col shrink-0 border-r border-white/8"
        style={navBg}
      >
        <div className="px-5 py-5 border-b border-white/8">
          <Link href="/" className="flex items-center">
            <Logo variant="dark" />
          </Link>
        </div>
        {renderNav()}
      </aside>

      {/* ── Mobile top bar ── */}
      <div
        className="md:hidden fixed top-0 left-0 right-0 h-14 z-30 px-4 flex items-center justify-between border-b border-white/8"
        style={navBg}
      >
        <Link href="/" className="flex items-center">
          <Logo variant="dark" size="sm" />
        </Link>
        <button
          onClick={() => setDrawerOpen(true)}
          className="w-9 h-9 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/8 rounded-lg transition-colors"
          aria-label="Ouvrir le menu"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
      </div>

      {/* ── Mobile drawer ── */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
          />
          <div
            className="absolute left-0 top-0 bottom-0 w-[280px] flex flex-col border-r border-white/8"
            style={navBg}
          >
            <div className="px-5 py-4 border-b border-white/8 flex items-center justify-between shrink-0">
              <Link href="/" onClick={() => setDrawerOpen(false)} className="flex items-center">
                <Logo variant="dark" />
              </Link>
              <button
                onClick={() => setDrawerOpen(false)}
                className="w-8 h-8 flex items-center justify-center text-white/40 hover:text-white/80 hover:bg-white/8 rounded-lg transition-colors"
                aria-label="Fermer le menu"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            {renderNav(() => setDrawerOpen(false))}
          </div>
        </div>
      )}
    </>
  )
}
