'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { creerSessionPortail } from './actions'
import type { AbonnementData } from './page'

const INPUT_CLASS =
  'w-full bg-background border border-border rounded-xl px-4 py-3 font-syne text-[14px] text-text placeholder:text-text-subtle focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition-all duration-150'

const SECTION_CLASS = 'bg-surface border border-border rounded-2xl p-6 sm:p-8'

const LABEL_CLASS = 'block font-syne text-[11px] font-semibold uppercase tracking-widest text-text-subtle mb-2'

function statutLabel(s: string | null): string {
  if (!s) return '—'
  const map: Record<string, string> = {
    active: 'Actif',
    canceled: 'Résilié',
    past_due: 'Paiement en retard',
    incomplete: 'Incomplet',
    unpaid: 'Impayé',
  }
  return map[s] ?? s
}

export function ParametresClient({
  email,
  abonnement,
}: {
  email: string
  abonnement: AbonnementData
}) {
  // ── Mot de passe ──
  const [nouveauMdp, setNouveauMdp] = useState('')
  const [confirmMdp, setConfirmMdp] = useState('')
  const [mdpLoading, setMdpLoading] = useState(false)
  const [mdpMessage, setMdpMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleChangePassword = async () => {
    setMdpMessage(null)
    if (nouveauMdp.length < 6) {
      setMdpMessage({ type: 'error', text: 'Le mot de passe doit faire au moins 6 caractères.' })
      return
    }
    if (nouveauMdp !== confirmMdp) {
      setMdpMessage({ type: 'error', text: 'Les deux mots de passe ne correspondent pas.' })
      return
    }
    setMdpLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: nouveauMdp })
    setMdpLoading(false)
    if (error) {
      setMdpMessage({ type: 'error', text: error.message })
    } else {
      setMdpMessage({ type: 'success', text: 'Mot de passe mis à jour avec succès.' })
      setNouveauMdp('')
      setConfirmMdp('')
    }
  }

  // ── Portail Stripe ──
  const [portalLoading, setPortalLoading] = useState(false)
  const [portalError, setPortalError] = useState<string | null>(null)

  const handleOpenPortail = async () => {
    setPortalLoading(true)
    setPortalError(null)
    const res = await creerSessionPortail()
    if ('url' in res) {
      window.location.href = res.url
    } else {
      setPortalLoading(false)
      setPortalError(res.error)
    }
  }

  const plan = abonnement?.plan ?? 'gratuit'
  const isPro = plan === 'pro'
  const analysesUtilisees = abonnement?.analyses_utilisees ?? 0
  const quotaGratuit = abonnement?.quota_gratuit ?? 3
  const statutPaiement = abonnement?.statut_paiement ?? null

  return (
    <div className="space-y-6">

      {/* ── Section Compte ── */}
      <div className={SECTION_CLASS}>
        <p className="font-syne text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-amber mb-5">
          Compte
        </p>

        {/* Email */}
        <div className="mb-6">
          <label className={LABEL_CLASS}>Adresse e-mail</label>
          <div className="flex items-center gap-3 bg-background border border-border rounded-xl px-4 py-3">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-text-subtle shrink-0">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
            <span className="font-syne text-[14px] text-text">{email}</span>
            <span className="ml-auto font-syne text-[11px] text-text-subtle">Lecture seule</span>
          </div>
        </div>

        {/* Changer le mot de passe */}
        <div>
          <label className={LABEL_CLASS}>Changer mon mot de passe</label>
          <div className="space-y-3">
            <input
              type="password"
              placeholder="Nouveau mot de passe"
              value={nouveauMdp}
              onChange={e => setNouveauMdp(e.target.value)}
              disabled={mdpLoading}
              className={INPUT_CLASS}
            />
            <input
              type="password"
              placeholder="Confirmer le nouveau mot de passe"
              value={confirmMdp}
              onChange={e => setConfirmMdp(e.target.value)}
              disabled={mdpLoading}
              className={INPUT_CLASS}
            />

            {mdpMessage && (
              <div
                className={`rounded-xl px-4 py-3 font-syne text-[13px] font-medium ${
                  mdpMessage.type === 'success'
                    ? 'bg-green-50 border border-green-200 text-green-700'
                    : 'bg-red-50 border border-red-200 text-red-600'
                }`}
              >
                {mdpMessage.text}
              </div>
            )}

            <button
              onClick={handleChangePassword}
              disabled={mdpLoading || !nouveauMdp || !confirmMdp}
              className="inline-flex items-center gap-2 font-syne text-[13px] font-bold text-white bg-accent hover:bg-accent-dark px-5 py-2.5 rounded-xl transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_4px_12px_rgba(37,99,235,0.2)]"
            >
              {mdpLoading ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Mise à jour…
                </>
              ) : (
                'Mettre à jour le mot de passe'
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── Section Abonnement ── */}
      <div className={SECTION_CLASS}>
        <p className="font-syne text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-amber mb-5">
          Abonnement
        </p>

        {/* Plan actuel */}
        <div className="flex items-center gap-3 mb-6">
          <span
            className={`inline-flex items-center font-syne text-[12px] font-bold px-3 py-1.5 rounded-full ${
              isPro
                ? 'bg-brand-amber/10 text-brand-amber border border-brand-amber/30'
                : 'bg-text-subtle/10 text-text-subtle border border-border'
            }`}
          >
            {isPro ? '✦ Pro' : 'Gratuit'}
          </span>
          {isPro && statutPaiement && (
            <span
              className={`font-syne text-[12px] font-semibold ${
                statutPaiement === 'active'
                  ? 'text-green-600'
                  : statutPaiement === 'past_due'
                  ? 'text-amber-600'
                  : 'text-text-subtle'
              }`}
            >
              · {statutLabel(statutPaiement)}
            </span>
          )}
        </div>

        {/* Si Gratuit */}
        {!isPro && (
          <div className="space-y-5">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-syne text-[13px] text-text-muted">
                  Analyses utilisées
                </span>
                <span className="font-syne text-[13px] font-semibold text-text">
                  {analysesUtilisees} / {quotaGratuit}
                </span>
              </div>
              <div className="h-2 bg-border rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, (analysesUtilisees / quotaGratuit) * 100)}%`,
                    background: analysesUtilisees >= quotaGratuit
                      ? 'linear-gradient(90deg, #ef4444, #dc2626)'
                      : 'linear-gradient(90deg, #2563EB, #3b82f6)',
                  }}
                />
              </div>
              {analysesUtilisees >= quotaGratuit && (
                <p className="font-syne text-[12px] text-red-500 mt-2">
                  Quota atteint — passe à Pro pour continuer.
                </p>
              )}
            </div>

            <div className="pt-1">
              <p className="font-syne text-[13px] text-text-muted mb-4 leading-relaxed">
                Avec le plan Pro, profite d&apos;analyses illimitées, d&apos;un accès prioritaire aux nouvelles fonctionnalités et d&apos;une extraction de nomenclature avancée.
              </p>
              <Link
                href="/pricing"
                className="group inline-flex items-center gap-2 font-syne text-[13px] font-bold text-white bg-brand-amber hover:bg-brand-amber/90 px-5 py-2.5 rounded-xl transition-all duration-200 shadow-[0_4px_12px_rgba(245,158,11,0.3)]"
              >
                Passer à Pro
                <span className="group-hover:translate-x-0.5 transition-transform duration-150">→</span>
              </Link>
            </div>
          </div>
        )}

        {/* Si Pro */}
        {isPro && (
          <div className="space-y-4">
            <p className="font-syne text-[13px] text-text-muted leading-relaxed">
              Gérez votre abonnement, vos factures et vos informations de paiement directement depuis le portail Stripe.
            </p>

            {portalError && (
              <div className="rounded-xl px-4 py-3 bg-red-50 border border-red-200 font-syne text-[13px] text-red-600">
                {portalError}
              </div>
            )}

            <button
              onClick={handleOpenPortail}
              disabled={portalLoading}
              className="inline-flex items-center gap-2 font-syne text-[13px] font-bold text-white bg-accent hover:bg-accent-dark px-5 py-2.5 rounded-xl transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed shadow-[0_4px_12px_rgba(37,99,235,0.2)]"
            >
              {portalLoading ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Ouverture du portail…
                </>
              ) : (
                <>
                  Gérer mon abonnement
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
