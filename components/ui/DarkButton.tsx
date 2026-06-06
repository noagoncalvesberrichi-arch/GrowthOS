'use client'

import Link from 'next/link'
import { useState } from 'react'

function ArrowRight() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  )
}

export function DarkButton({ href, children }: { href: string; children: React.ReactNode }) {
  const [hovered, setHovered] = useState(false)
  return (
    <Link
      href={href}
      className="group inline-flex items-center gap-2 font-syne font-bold text-[14px] text-white px-6 py-3 rounded-lg transition-colors duration-200"
      style={{ backgroundColor: hovered ? '#1E40AF' : '#1D4ED8' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {children}
      <ArrowRight />
    </Link>
  )
}
