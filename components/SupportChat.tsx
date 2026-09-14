'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const SUGGESTIONS = [
  "Comment fonctionne l’historique acheteur ?",
  'Quelle différence entre Essentiel et Pro ?',
  'Comment remplir mon profil ?',
]

const MAX_MESSAGES = 30

export function SupportChat() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [conversationId] = useState<string>(() => crypto.randomUUID())
  const [visitorEmail, setVisitorEmail] = useState('')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data }) => {
        if (data.user) setIsLoggedIn(true)
      })
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen])

  const userMessageCount = messages.filter(m => m.role === 'user').length
  const limitReached = userMessageCount >= MAX_MESSAGES

  const send = async (text: string) => {
    if (!text.trim() || isStreaming || limitReached) return

    const userMsg: Message = { role: 'user', content: text.trim() }
    const messagesToSend = [...messages, userMsg]

    setMessages([...messagesToSend, { role: 'assistant', content: '' }])
    setInput('')
    setIsStreaming(true)
    setError(null)

    try {
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          messages: messagesToSend,
          email: !isLoggedIn && visitorEmail.trim() ? visitorEmail.trim() : undefined,
        }),
      })

      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error((json as { error?: string }).error ?? 'Erreur de connexion')
      }

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let accumulated = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        accumulated += decoder.decode(value, { stream: true })
        const display = accumulated.replace(/^\[ESCALADE\]\s*/i, '')
        setMessages(prev => {
          const copy = [...prev]
          copy[copy.length - 1] = { role: 'assistant', content: display }
          return copy
        })
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur inconnue'
      setError(msg)
      setMessages(prev => {
        const copy = [...prev]
        copy[copy.length - 1] = {
          role: 'assistant',
          content: 'Désolé, une erreur est survenue. Veuillez réessayer.',
        }
        return copy
      })
    } finally {
      setIsStreaming(false)
    }
  }

  return (
    <>
      {/* Panel */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: '80px',
            right: '16px',
            zIndex: 9999,
            width: 'min(384px, calc(100vw - 2rem))',
            maxHeight: 'min(580px, calc(100vh - 120px))',
            display: 'flex',
            flexDirection: 'column',
            background: '#ffffff',
            borderRadius: '16px',
            boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
            border: '1px solid #e5e7eb',
          }}
        >
          {/* Header */}
          <div
            style={{
              background: '#0F1B4D',
              borderRadius: '16px 16px 0 0',
              padding: '14px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexShrink: 0,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#4ADE80' }} />
              <span
                style={{
                  fontFamily: 'var(--font-syne, sans-serif)',
                  fontWeight: 700,
                  color: '#ffffff',
                  fontSize: '14px',
                }}
              >
                Support Stratly
              </span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                color: 'rgba(255,255,255,0.6)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
              }}
              aria-label="Fermer"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              minHeight: 0,
            }}
          >
            {/* Message d'accueil statique */}
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <div
                style={{
                  maxWidth: '85%',
                  padding: '10px 14px',
                  borderRadius: '14px 14px 14px 2px',
                  background: '#F3F4F6',
                  color: '#1F2937',
                  fontSize: '13px',
                  lineHeight: '1.6',
                  fontFamily: 'var(--font-syne, sans-serif)',
                }}
              >
                Bonjour&nbsp;! Une question sur Stratly&nbsp;? Je r&eacute;ponds 24&nbsp;h/24.
              </div>
            </div>

            {/* Suggestions (avant le premier message) */}
            {messages.length === 0 && !isStreaming && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingTop: '4px' }}>
                {SUGGESTIONS.map(s => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    style={{
                      textAlign: 'left',
                      padding: '8px 12px',
                      borderRadius: '10px',
                      border: '1px solid #E5E7EB',
                      background: '#fff',
                      cursor: 'pointer',
                      fontFamily: 'var(--font-syne, sans-serif)',
                      fontSize: '12px',
                      color: '#374151',
                      transition: 'border-color 0.15s, background 0.15s',
                    }}
                    onMouseEnter={e => {
                      const el = e.currentTarget
                      el.style.borderColor = '#2563EB'
                      el.style.background = '#EFF6FF'
                    }}
                    onMouseLeave={e => {
                      const el = e.currentTarget
                      el.style.borderColor = '#E5E7EB'
                      el.style.background = '#fff'
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* Messages de la conversation */}
            {messages.map((msg, i) => (
              <div
                key={i}
                style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}
              >
                <div
                  style={{
                    maxWidth: '85%',
                    padding: '10px 14px',
                    borderRadius:
                      msg.role === 'user' ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                    background: msg.role === 'user' ? '#2563EB' : '#F3F4F6',
                    color: msg.role === 'user' ? '#ffffff' : '#1F2937',
                    fontSize: '13px',
                    lineHeight: '1.6',
                    fontFamily: 'var(--font-syne, sans-serif)',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  {msg.content ||
                    (isStreaming && i === messages.length - 1 ? (
                      <span style={{ color: '#9CA3AF', letterSpacing: '2px' }}>•••</span>
                    ) : null)}
                </div>
              </div>
            ))}

            {error && (
              <p
                style={{
                  textAlign: 'center',
                  fontSize: '12px',
                  color: '#EF4444',
                  fontFamily: 'var(--font-syne, sans-serif)',
                  margin: 0,
                }}
              >
                {error}
              </p>
            )}

            {limitReached && (
              <p
                style={{
                  textAlign: 'center',
                  fontSize: '12px',
                  color: '#9CA3AF',
                  fontFamily: 'var(--font-syne, sans-serif)',
                  margin: 0,
                }}
              >
                Limite de 30 messages atteinte. Rechargez la page pour une nouvelle conversation.
              </p>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Email visiteur (optionnel, affiché avant le premier message) */}
          {!isLoggedIn && messages.length === 0 && (
            <div style={{ padding: '0 12px 8px', flexShrink: 0 }}>
              <input
                type="email"
                value={visitorEmail}
                onChange={e => setVisitorEmail(e.target.value)}
                placeholder="Votre email (optionnel, pour un suivi)"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  fontSize: '12px',
                  fontFamily: 'var(--font-syne, sans-serif)',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  color: '#374151',
                  outline: 'none',
                  boxSizing: 'border-box',
                  background: '#F9FAFB',
                }}
              />
            </div>
          )}

          {/* Zone de saisie */}
          <form
            onSubmit={e => {
              e.preventDefault()
              send(input)
            }}
            style={{
              padding: '10px',
              borderTop: '1px solid #E5E7EB',
              display: 'flex',
              gap: '8px',
              flexShrink: 0,
            }}
          >
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={limitReached ? 'Limite atteinte' : 'Votre question…'}
              disabled={isStreaming || limitReached}
              style={{
                flex: 1,
                padding: '8px 12px',
                fontSize: '13px',
                fontFamily: 'var(--font-syne, sans-serif)',
                background: '#F9FAFB',
                border: '1px solid #E5E7EB',
                borderRadius: '10px',
                color: '#1F2937',
                outline: 'none',
                opacity: isStreaming || limitReached ? 0.5 : 1,
                minWidth: 0,
              }}
            />
            <button
              type="submit"
              disabled={!input.trim() || isStreaming}
              aria-label="Envoyer"
              style={{
                width: '36px',
                height: '36px',
                flexShrink: 0,
                borderRadius: '10px',
                background: '#2563EB',
                border: 'none',
                cursor: !input.trim() || isStreaming ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: !input.trim() || isStreaming ? 0.4 : 1,
                transition: 'opacity 0.15s',
              }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </form>
        </div>
      )}

      {/* Bouton flottant */}
      <button
        onClick={() => setIsOpen(o => !o)}
        aria-label={isOpen ? 'Fermer le support' : 'Aide et support'}
        style={{
          position: 'fixed',
          bottom: '16px',
          right: '16px',
          zIndex: 9999,
          width: '52px',
          height: '52px',
          borderRadius: '50%',
          background: '#0F1B4D',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 20px rgba(15,27,77,0.35)',
          transition: 'transform 0.2s, box-shadow 0.2s',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = 'scale(1.08)'
          e.currentTarget.style.boxShadow = '0 6px 28px rgba(15,27,77,0.5)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = 'scale(1)'
          e.currentTarget.style.boxShadow = '0 4px 20px rgba(15,27,77,0.35)'
        }}
      >
        {isOpen ? (
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        )}
      </button>
    </>
  )
}
