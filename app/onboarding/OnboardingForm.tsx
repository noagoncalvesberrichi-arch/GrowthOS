'use client'

import { useActionState } from 'react'
import { createCabinet, type CreateCabinetState } from './actions'

export function OnboardingForm() {
  const [state, formAction, pending] = useActionState<CreateCabinetState, FormData>(
    createCabinet,
    null
  )

  return (
    <form action={formAction} className="space-y-5">
      {state?.error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          <p className="font-syne text-[13px] text-red-600">{state.error}</p>
        </div>
      )}

      {/* Nom du cabinet */}
      <div>
        <label className="block font-syne text-[12px] font-semibold text-text-muted mb-1.5">
          Nom du cabinet
        </label>
        <input
          type="text"
          name="name"
          placeholder="Cabinet Dr Dupont"
          required
          className="w-full bg-background border border-border rounded-lg px-3.5 py-2.5 font-syne text-[14px] text-text placeholder:text-text-subtle transition-all duration-150 focus:border-accent focus:ring-2 focus:ring-accent/10 outline-none"
        />
      </div>

      {/* URL Google Business */}
      <div>
        <label className="block font-syne text-[12px] font-semibold text-text-muted mb-1.5">
          URL de ta fiche Google Business Profile
        </label>
        <input
          type="url"
          name="google_review_url"
          placeholder="https://g.page/r/..."
          required
          className="w-full bg-background border border-border rounded-lg px-3.5 py-2.5 font-syne text-[14px] text-text placeholder:text-text-subtle transition-all duration-150 focus:border-accent focus:ring-2 focus:ring-accent/10 outline-none"
        />
        <p className="font-syne text-[12px] text-text-subtle mt-1.5">
          Va sur Google Maps, ouvre ta fiche, copie l&apos;URL de partage
        </p>

        {/* Helper dropdown */}
        <details className="mt-2 group">
          <summary className="inline-flex items-center gap-1 font-syne text-[12px] font-semibold text-accent cursor-pointer list-none hover:text-accent-dark transition-colors">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform duration-200 group-open:rotate-90">
              <path d="M9 18l6-6-6-6" />
            </svg>
            Comment trouver mon URL Google ?
          </summary>
          <div className="mt-2 bg-background border border-border rounded-lg px-4 py-3 space-y-1.5">
            <p className="font-syne text-[12px] text-text-muted leading-relaxed">
              1. Ouvre <strong>Google Maps</strong> et recherche le nom de ton cabinet
            </p>
            <p className="font-syne text-[12px] text-text-muted leading-relaxed">
              2. Clique sur ta fiche → bouton <strong>&laquo;&nbsp;Partager&nbsp;&raquo;</strong>
            </p>
            <p className="font-syne text-[12px] text-text-muted leading-relaxed">
              3. Copie le lien court <strong>g.page/r/…</strong> qui apparaît
            </p>
          </div>
        </details>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="group relative w-full py-3 bg-accent hover:bg-accent-dark text-white font-syne font-bold text-[14px] rounded-xl transition-all duration-200 overflow-hidden shadow-card mt-2 disabled:opacity-60"
      >
        <span
          aria-hidden="true"
          className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/15 to-transparent"
        />
        {pending ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Création en cours…
          </span>
        ) : (
          <span className="relative">Continuer →</span>
        )}
      </button>
    </form>
  )
}
