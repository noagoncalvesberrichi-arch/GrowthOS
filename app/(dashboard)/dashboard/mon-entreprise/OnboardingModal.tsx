'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

export function OnboardingModal({ isOnboarding }: { isOnboarding: boolean }) {
  const router = useRouter()
  // mounted = whether to render the modal at all
  const [mounted, setMounted] = useState(isOnboarding)
  // visible = CSS state that drives the enter/exit transition
  const [visible, setVisible] = useState(false)

  // Trigger entrance animation on first render
  useEffect(() => {
    if (!isOnboarding) return
    const t = setTimeout(() => setVisible(true), 30)
    return () => clearTimeout(t)
  }, [isOnboarding])

  // dismiss([redirectTo]) — animated close, then optional navigation
  const dismiss = useCallback(
    (redirectTo?: string) => {
      setVisible(false)
      setTimeout(() => {
        setMounted(false)
        if (redirectTo) router.push(redirectTo)
      }, 220)
    },
    [router],
  )

  // Escape closes (stays on page)
  useEffect(() => {
    if (!mounted) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dismiss()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [mounted, dismiss])

  if (!mounted) return null

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6 transition-colors duration-200"
      style={{ backgroundColor: visible ? 'rgba(0,0,0,0.45)' : 'rgba(0,0,0,0)' }}
      onClick={() => dismiss()}
    >
      {/* Modal card */}
      <div
        className="relative bg-white rounded-2xl w-full max-w-md overflow-hidden transition-all duration-200 shadow-[0_24px_80px_rgba(0,0,0,0.22)]"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'scale(1) translateY(0)' : 'scale(0.96) translateY(8px)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Decorative top stripe */}
        <div
          className="h-1 w-full"
          style={{ background: 'linear-gradient(90deg, #2563EB 0%, #D97706 100%)' }}
        />

        {/* Close button */}
        <button
          onClick={() => dismiss()}
          aria-label="Fermer"
          className="absolute top-4 right-4 w-7 h-7 rounded-lg flex items-center justify-center text-text-subtle hover:text-text hover:bg-background transition-colors duration-150"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Content */}
        <div className="px-8 py-8">
          {/* Icon */}
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center mb-6"
            style={{ background: 'linear-gradient(135deg, #EFF6FF, #DBEAFE)' }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 22V4a2 2 0 012-2h8a2 2 0 012 2v18" />
              <path d="M6 12H4a2 2 0 00-2 2v6a2 2 0 002 2h2" />
              <path d="M18 9h2a2 2 0 012 2v9a2 2 0 01-2 2h-2" />
              <path d="M10 6h4M10 10h4M10 14h4M10 18h4" />
            </svg>
          </div>

          <h2 className="font-fraunces text-[26px] text-text tracking-tight leading-tight mb-3">
            Bienvenue sur Stratly&nbsp;!
          </h2>
          <p className="font-syne text-[14px] text-text-muted leading-relaxed mb-8">
            Renseignez votre entreprise pour obtenir des recommandations
            Go&nbsp;/&nbsp;No-Go personnalisées sur chaque appel d&apos;offres.
            Cela ne prend que quelques minutes.
          </p>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <button
              onClick={() => dismiss()}
              className="group relative w-full py-3 font-syne font-bold text-[14px] text-[#1E3A8A] bg-brand-amber hover:bg-brand-amber-dark rounded-xl transition-all duration-200 overflow-hidden shadow-[0_4px_16px_rgba(217,119,6,0.25)]"
            >
              <span
                aria-hidden="true"
                className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none"
              />
              <span className="relative">Remplir mon profil →</span>
            </button>
            <button
              onClick={() => dismiss('/dashboard')}
              className="w-full py-2.5 font-syne text-[13px] font-semibold text-text-subtle hover:text-text-muted transition-colors duration-150"
            >
              Plus tard
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
