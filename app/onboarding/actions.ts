'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export type CreateCabinetState = { error: string } | null

export async function createCabinet(
  _prevState: CreateCabinetState,
  formData: FormData
): Promise<CreateCabinetState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Non authentifié. Reconnecte-toi.' }

  const name = (formData.get('name') as string)?.trim()
  const google_review_url = (formData.get('google_review_url') as string)?.trim()

  if (!name) return { error: 'Le nom du cabinet est requis.' }
  if (!google_review_url) return { error: "L'URL Google Business est requise." }

  const subscription_ends_at = new Date(
    Date.now() + 14 * 24 * 60 * 60 * 1000
  ).toISOString()

  const { error } = await supabase.from('cabinets').insert({
    user_id: user.id,
    name,
    google_review_url,
    subscription_ends_at,
  })

  if (error) {
    console.error('[onboarding] insert error:', error)
    return { error: 'Erreur lors de la création du cabinet. Réessaie.' }
  }

  redirect('/dashboard')
}
