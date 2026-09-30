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
