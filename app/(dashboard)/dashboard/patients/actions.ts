'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type PatientActionState = { error: string } | { success: true } | null

function normalizePhone(raw: string): string | null {
  const cleaned = raw.replace(/[\s\-\.]/g, '')
  if (cleaned.startsWith('0')) return '+33' + cleaned.slice(1)
  if (cleaned.startsWith('+')) return cleaned
  return null
}

const E164_RE = /^\+[1-9]\d{7,14}$/

export async function addPatient(
  _prevState: PatientActionState,
  formData: FormData
): Promise<PatientActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié. Reconnecte-toi.' }

  const { data: cabinet } = await supabase
    .from('cabinets')
    .select('id')
    .eq('user_id', user.id)
    .single()
  if (!cabinet) return { error: 'Cabinet introuvable.' }

  const firstName = (formData.get('first_name') as string)?.trim()
  const phoneRaw = formData.get('phone') as string
  const appointmentAt = formData.get('appointment_at') as string

  if (!firstName) return { error: 'Le prénom est requis.' }

  const phone = normalizePhone(phoneRaw ?? '')
  if (!phone || !E164_RE.test(phone)) {
    return { error: 'Format de téléphone invalide. Exemple : 06 12 34 56 78' }
  }

  if (!appointmentAt) return { error: 'La date du RDV est requise.' }
  const apptDate = new Date(appointmentAt)
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
  if (apptDate < oneDayAgo) {
    return { error: 'La date du RDV ne peut pas être antérieure à plus de 24h.' }
  }

  const { error } = await supabase.from('patients').insert({
    cabinet_id: cabinet.id,
    first_name: firstName,
    phone,
    appointment_at: apptDate.toISOString(),
  })

  if (error) {
    console.error('[addPatient]', error)
    return { error: "Erreur lors de l'ajout du patient. Réessaie." }
  }

  revalidatePath('/dashboard/patients')
  return { success: true }
}

export async function markSmsSent(patientId: string): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié.' }

  const { data: cabinet } = await supabase
    .from('cabinets')
    .select('id')
    .eq('user_id', user.id)
    .single()
  if (!cabinet) return { error: 'Cabinet introuvable.' }

  const { data: patient, error: fetchError } = await supabase
    .from('patients')
    .select('id, cabinet_id')
    .eq('id', patientId)
    .eq('cabinet_id', cabinet.id)
    .single()
  if (fetchError || !patient) return { error: 'Patient introuvable ou accès refusé.' }

  const now = new Date().toISOString()

  const { error: updateError } = await supabase
    .from('patients')
    .update({ sms_sent_at: now, sms_status: 'sent' })
    .eq('id', patientId)

  if (updateError) {
    console.error('[markSmsSent] update', updateError)
    return { error: "Erreur lors de la mise à jour du statut SMS." }
  }

  const { error: logError } = await supabase.from('sms_logs').insert({
    patient_id: patientId,
    cabinet_id: cabinet.id,
    twilio_sid: null,
    status: 'sent',
    error_message: 'placeholder — Twilio non intégré',
    cost_cents: null,
  })

  if (logError) {
    console.error('[markSmsSent] insert sms_logs', logError)
    return { error: "Erreur lors de l'enregistrement du log SMS." }
  }

  revalidatePath('/dashboard/patients')
  return { error: null }
}
