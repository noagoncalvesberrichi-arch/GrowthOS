'use client'

import { useActionState, useEffect, useRef } from 'react'
import { addPatient, type PatientActionState } from './actions'

export function PatientForm({ cabinetId }: { cabinetId: string }) {
  const formRef = useRef<HTMLFormElement>(null)
  const [state, formAction, pending] = useActionState<PatientActionState, FormData>(
    addPatient,
    null
  )

  useEffect(() => {
    if (state && 'success' in state) {
      formRef.current?.reset()
    }
  }, [state])

  const defaultDatetime = new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16)

  return (
    <div className="bg-surface border border-border rounded-2xl p-6">
      <h2 className="font-syne text-[16px] font-bold text-text mb-5">Ajouter un patient</h2>

      <form ref={formRef} action={formAction} className="space-y-4">
        <input type="hidden" name="cabinet_id" value={cabinetId} />

        {state && 'error' in state && state.error && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            <p className="font-syne text-[13px] text-red-600">{state.error}</p>
          </div>
        )}

        {state && 'success' in state && (
          <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3">
            <p className="font-syne text-[13px] text-green-700">Patient ajouté avec succès.</p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block font-syne text-[12px] font-semibold text-text-muted mb-1.5">
              Prénom
            </label>
            <input
              type="text"
              name="first_name"
              placeholder="Pierre"
              required
              className="w-full bg-background border border-border rounded-lg px-3.5 py-2.5 font-syne text-[14px] text-text placeholder:text-text-subtle focus:border-accent focus:ring-2 focus:ring-accent/10 outline-none transition-all duration-150"
            />
          </div>

          <div>
            <label className="block font-syne text-[12px] font-semibold text-text-muted mb-1.5">
              Téléphone
            </label>
            <input
              type="tel"
              name="phone"
              placeholder="06 12 34 56 78"
              required
              className="w-full bg-background border border-border rounded-lg px-3.5 py-2.5 font-syne text-[14px] text-text placeholder:text-text-subtle focus:border-accent focus:ring-2 focus:ring-accent/10 outline-none transition-all duration-150"
            />
          </div>

          <div>
            <label className="block font-syne text-[12px] font-semibold text-text-muted mb-1.5">
              Date & heure du RDV
            </label>
            <input
              type="datetime-local"
              name="appointment_at"
              defaultValue={defaultDatetime}
              required
              className="w-full bg-background border border-border rounded-lg px-3.5 py-2.5 font-syne text-[14px] text-text focus:border-accent focus:ring-2 focus:ring-accent/10 outline-none transition-all duration-150"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={pending}
          className="group relative inline-flex items-center gap-2 py-2.5 px-5 bg-accent hover:bg-accent-dark text-white font-syne font-bold text-[13px] rounded-xl transition-all duration-200 overflow-hidden shadow-card disabled:opacity-60"
        >
          <span
            aria-hidden="true"
            className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/15 to-transparent"
          />
          <span className="relative">
            {pending ? 'Ajout…' : 'Ajouter le patient'}
          </span>
        </button>
      </form>
    </div>
  )
}
