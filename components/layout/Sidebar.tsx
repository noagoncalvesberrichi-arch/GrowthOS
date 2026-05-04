'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

function LogoMark() {
  return (
    <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center shrink-0">
      <svg width="15" height="15" viewBox="0 0 14 14" fill="none">
        <path d="M2 11L5 5.5L8 8.5L10 5.5L12.5 11" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  )
}

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  )
}

function CMOIcon({ active }: { active: boolean }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5" />
      <path d="M11 13l9-9" /><path d="M15 3h6v6" />
    </svg>
  )
}

function GrowthIcon({ active }: { active: boolean }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </svg>
  )
}

function CreatorsIcon({ active }: { active: boolean }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
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

const primaryLinks = [
  { id: 'dashboard', label: 'Vue d\'ensemble', description: 'Accueil', href: '/dashboard' },
]
const modules = [
  { id: 'cmo', label: 'CMO IA', description: 'Kit marketing B2B', href: '/cmo' },
  { id: 'growth-b2b', label: 'Growth B2B', description: 'Contenu & Visibilité', href: '/growth-b2b' },
  { id: 'creators', label: 'Créateurs', description: 'Social & Viral', href: '/creators' },
]

export function Sidebar() {
  const pathname = usePathname()

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

  const navItemClass = (active: boolean) =>
    `relative flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 border-l-[3px] pl-[9px] group
     ${active ? 'bg-accent-subtle text-accent-fg border-accent' : 'text-text-muted hover:bg-background hover:text-text border-transparent'}`

  const iconClass = (active: boolean) =>
    `shrink-0 transition-colors duration-150 ${active ? 'text-accent' : 'text-text-subtle group-hover:text-text-muted'}`

  return (
    <aside className="w-[240px] min-h-screen border-r border-border flex flex-col shrink-0 bg-surface">

      {/* Logo */}
      <div className="px-5 py-5 border-b border-border">
        <Link href="/" className="flex items-center gap-2.5">
          <LogoMark />
          <div>
            <p className="font-syne font-bold text-[15px] text-text tracking-tight leading-none">Stratly</p>
            <p className="text-[10px] text-text-subtle mt-0.5 font-syne">Intelligence Platform</p>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 pt-4 pb-3 overflow-auto space-y-4">

        {/* Overview */}
        <div>
          <ul className="space-y-0.5">
            {primaryLinks.map((link) => {
              const active = isActive(link.href)
              return (
                <li key={link.id}>
                  <Link href={link.href} className={navItemClass(active)}>
                    <span className={iconClass(active)}><HomeIcon active={active} /></span>
                    <div className="min-w-0">
                      <p className="font-syne text-[13px] font-semibold leading-none">{link.label}</p>
                      <p className="font-syne text-[11px] text-text-subtle mt-0.5">{link.description}</p>
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>

        {/* Modules */}
        <div>
          <p className="text-[10px] font-semibold text-text-subtle uppercase tracking-widest px-3 mb-2 font-syne">
            Modules IA
          </p>
          <ul className="space-y-0.5">
            {modules.map((mod) => {
              const active = isActive(mod.href)
              const Icon = mod.id === 'cmo' ? CMOIcon : mod.id === 'growth-b2b' ? GrowthIcon : CreatorsIcon
              return (
                <li key={mod.id}>
                  <Link href={mod.href} className={navItemClass(active)}>
                    <span className={iconClass(active)}><Icon active={active} /></span>
                    <div className="min-w-0">
                      <p className={`font-syne text-[13px] font-semibold leading-none ${active ? 'text-accent-fg' : ''}`}>
                        {mod.label}
                      </p>
                      <p className="font-syne text-[11px] text-text-subtle mt-0.5 truncate">{mod.description}</p>
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>

        {/* Secondary */}
        <div>
          <div className="mx-1 mb-3 h-px bg-border" />
          <ul className="space-y-0.5">
            <li>
              <Link href="/pricing" className={navItemClass(isActive('/pricing'))}>
                <span className={iconClass(isActive('/pricing'))}><PricingIcon active={isActive('/pricing')} /></span>
                <p className="font-syne text-[13px] font-semibold">Pricing</p>
              </Link>
            </li>
          </ul>
        </div>
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-border">
        <div className="flex items-center gap-2 px-1">
          <div className="relative w-2 h-2 shrink-0">
            <div className="absolute inset-0 rounded-full bg-accent animate-pulse-slow" />
            <div className="absolute inset-0 rounded-full bg-accent/30 animate-ping" />
          </div>
          <span className="font-syne text-[11px] text-text-subtle">Claude AI · Connecté</span>
        </div>
      </div>
    </aside>
  )
}
