'use client'

import { useState } from 'react'

interface OutputSectionProps {
  title: string
  tag: string
  content: string
  index: number
  sectionKey: string
}

function getIcon(sectionKey: string) {
  switch (sectionKey) {
    case 'LINKEDIN_POSTS':
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
        </svg>
      )
    case 'ONBOARDING_EMAILS':
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
          <polyline points="22,6 12,13 2,6" />
        </svg>
      )
    case 'PROSPECTION_SCRIPT':
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.67A2 2 0 012.18 1h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 8.15a16 16 0 006.94 6.94l1.51-1.51a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
        </svg>
      )
    case 'INFLUENCEUR_MESSAGES':
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 00-3-3.87" />
          <path d="M16 3.13a4 4 0 010 7.75" />
        </svg>
      )
    case 'ANALYSE_STRATEGIQUE':
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
      )
    default:
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
      )
  }
}

function CopyIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

export function OutputSection({ title, tag, content, index, sectionKey }: OutputSectionProps) {
  const [copied, setCopied] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const isLong = content.length > 700

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      className="bg-surface border border-border rounded-xl shadow-card overflow-hidden animate-fade-in"
      style={{ animationDelay: `${(index - 1) * 60}ms`, animationFillMode: 'both' }}
    >
      {/* Card header */}
      <div className="flex items-center justify-between px-5 py-3.5 bg-surface-raised border-b border-border">
        <div className="flex items-center gap-3">
          {/* Icon badge */}
          <div className="w-8 h-8 rounded-lg bg-accent-subtle flex items-center justify-center shrink-0 text-accent">
            {getIcon(sectionKey)}
          </div>
          <div>
            <h3 className="font-syne text-[14px] font-semibold text-text leading-tight">{title}</h3>
            <p className="font-syne text-[11px] text-text-subtle mt-0.5">{tag}</p>
          </div>
        </div>

        <button
          onClick={handleCopy}
          className={`
            flex items-center gap-1.5 font-syne text-[12px] font-medium
            px-3 py-1.5 rounded-lg border transition-all duration-200
            ${copied
              ? 'border-accent/30 text-accent bg-accent-subtle'
              : 'border-border text-text-muted hover:border-border-focus hover:text-text hover:bg-background'
            }
          `}
        >
          {copied ? <CheckIcon /> : <CopyIcon />}
          {copied ? 'Copié !' : 'Copier'}
        </button>
      </div>

      {/* Content */}
      <div className="relative">
        <div className={`px-5 py-5 overflow-hidden transition-[max-height] duration-500 ease-in-out ${!expanded && isLong ? 'max-h-52' : 'max-h-[9999px]'}`}>
          <pre className="font-syne text-[13px] text-text-muted leading-[1.8] whitespace-pre-wrap break-words">
            {content}
          </pre>
        </div>

        {/* Fade + expand */}
        {isLong && !expanded && (
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-surface to-transparent flex items-end justify-center pb-3 pointer-events-none">
            <button
              onClick={() => setExpanded(true)}
              className="pointer-events-auto font-syne text-[12px] font-medium text-text-muted hover:text-accent transition-colors duration-150 px-4 py-1.5 border border-border hover:border-accent/40 rounded-lg bg-surface shadow-card"
            >
              Afficher tout ↓
            </button>
          </div>
        )}

        {isLong && expanded && (
          <div className="flex justify-center py-3 border-t border-border">
            <button
              onClick={() => setExpanded(false)}
              className="font-syne text-[12px] font-medium text-text-subtle hover:text-text-muted transition-colors duration-150"
            >
              Réduire ↑
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
