'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

function Arrow() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  )
}

export function HeroCTA() {
  const [href, setHref] = useState('/signup')
  const [label, setLabel] = useState('Essayer gratuitement')

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => {
      if (data.user) {
        setHref('/dashboard')
        setLabel('Mon espace')
      }
    })
  }, [])

  return (
    <Link
      href={href}
      className="group relative inline-flex items-center gap-2 font-syne font-bold text-[15px] bg-brand-amber hover:bg-brand-amber-dark text-[#1E3A8A] px-7 py-3.5 rounded-xl transition-all duration-200 overflow-hidden shadow-[0_4px_24px_rgba(217,119,6,0.35)]"
    >
      <span
        aria-hidden="true"
        className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none"
      />
      <span className="relative">{label}</span>
      <Arrow />
    </Link>
  )
}

export function FinalCTA() {
  const [href, setHref] = useState('/signup')
  const [label, setLabel] = useState('Démarrer maintenant')

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => {
      if (data.user) {
        setHref('/dashboard')
        setLabel('Mon espace')
      }
    })
  }, [])

  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 font-syne font-bold text-[14px] text-[#1E3A8A] bg-white hover:bg-white/92 px-7 py-3.5 rounded-xl transition-colors duration-200 shadow-[0_2px_16px_rgba(0,0,0,0.25)]"
    >
      {label}
      <Arrow />
    </Link>
  )
}
