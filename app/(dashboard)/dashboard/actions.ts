'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function masquerChecklist() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  await supabase
    .from('profil_entreprise')
    .update({ onboarding_masque: true })
    .eq('user_id', user.id)
  revalidatePath('/dashboard')
}

/** Called when the user clicks "Passer pour l'instant" on the onboarding page.
 *  Creates (or updates) a profil row with onboarding_masque=true so
 *  dashboard/page.tsx stops redirecting to /onboarding. */
export async function passerOnboarding() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }
  await supabase
    .from('profil_entreprise')
    .upsert({ user_id: user.id, onboarding_masque: true }, { onConflict: 'user_id' })
  revalidatePath('/dashboard')
  return { ok: true }
}
