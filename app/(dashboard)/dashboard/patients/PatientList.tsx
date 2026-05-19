'use client'

import { useState } from 'react'
import { markSmsSent } from './actions'
import type { Patient, SmsStatus } from '@/lib/database.types'

function formatPhone(phone: string): string {
  if (phone.startsWith('+33')) {
    const local = '0' + phone.slice(3)
    return local.replace(/(\d{2})(?=\d)/g, '$1 ').trim()
  }
  return phone
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const STATUS_LABELS: Record<SmsStatus, string> = {
  pending: 'En attente',
  sent: 'Envoyé',
  failed: 'Échec',
  delivered: 'Délivré',
}

const STATUS_STYLES: Record<SmsStatus, string> = {
  pending: 'bg-gray-100 text-gray-600 border-gray-200',
  sent: 'bg-green-50 text-green-700 border-green-200',
  failed: 'bg-red-50 text-red-600 border-red-200',
  delivered: 'bg-emerald-50 text-emerald-700 border-emerald-200',
}

export function PatientList({ patients }: { patients: Patient[] }) {
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set())

  if (patients.length === 0) {
    return (
      <div className="bg-surface border border-border rounded-2xl px-8 py-12 text-center">
        <p className="font-syne text-[15px] font-semibold text-text mb-2">Aucun patient pour l&apos;instant</p>
        <p className="font-syne text-[13px] text-text-muted">
          Ajoute ton premier patient avec le formulaire ci-dessus.
        </p>
      </div>
    )
  }

  const handleSendSMS = async (id: string) => {
    setPendingIds(prev => new Set(prev).add(id))
    await markSmsSent(id)
    setPendingIds(prev => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }

  return (
    <div className="bg-surface border border-border rounded-2xl overflow-hidden">
      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-background">
              <th className="text-left font-syne text-[11px] font-semibold text-text-subtle uppercase tracking-wider px-5 py-3">Prénom</th>
              <th className="text-left font-syne text-[11px] font-semibold text-text-subtle uppercase tracking-wider px-5 py-3">Téléphone</th>
              <th className="text-left font-syne text-[11px] font-semibold text-text-subtle uppercase tracking-wider px-5 py-3">Date RDV</th>
              <th className="text-left font-syne text-[11px] font-semibold text-text-subtle uppercase tracking-wider px-5 py-3">Statut SMS</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {patients.map((p) => (
              <tr key={p.id} className="hover:bg-background transition-colors duration-100">
                <td className="px-5 py-3.5 font-syne text-[14px] font-semibold text-text">{p.first_name}</td>
                <td className="px-5 py-3.5 font-syne text-[13px] text-text-muted">{formatPhone(p.phone)}</td>
                <td className="px-5 py-3.5 font-syne text-[13px] text-text-muted">{formatDate(p.appointment_at)}</td>
                <td className="px-5 py-3.5">
                  <span className={`inline-flex font-syne text-[11px] font-semibold px-2 py-0.5 rounded-full border ${STATUS_STYLES[p.sms_status]}`}>
                    {STATUS_LABELS[p.sms_status]}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-right">
                  {p.sms_status === 'pending' && (
                    <button
                      onClick={() => handleSendSMS(p.id)}
                      disabled={pendingIds.has(p.id)}
                      className="font-syne text-[12px] font-semibold text-accent hover:text-accent-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {pendingIds.has(p.id) ? 'Envoi…' : 'Envoyer SMS'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile stacked */}
      <div className="md:hidden divide-y divide-border">
        {patients.map((p) => (
          <div key={p.id} className="px-5 py-4 space-y-1.5">
            <div className="flex items-center justify-between">
              <p className="font-syne text-[14px] font-semibold text-text">{p.first_name}</p>
              <span className={`inline-flex font-syne text-[11px] font-semibold px-2 py-0.5 rounded-full border ${STATUS_STYLES[p.sms_status]}`}>
                {STATUS_LABELS[p.sms_status]}
              </span>
            </div>
            <p className="font-syne text-[13px] text-text-muted">{formatPhone(p.phone)}</p>
            <p className="font-syne text-[12px] text-text-subtle">{formatDate(p.appointment_at)}</p>
            {p.sms_status === 'pending' && (
              <button
                onClick={() => handleSendSMS(p.id)}
                disabled={pendingIds.has(p.id)}
                className="font-syne text-[12px] font-semibold text-accent hover:text-accent-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors mt-1"
              >
                {pendingIds.has(p.id) ? 'Envoi…' : 'Envoyer SMS →'}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
