'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

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

type OnboardingData = {
  raison_sociale: string
  siret: string | null
  forme_juridique: string | null
  adresse_siege: string | null
  domaines: string[]
  zone_geographique: string | null
}

export async function sauvegarderProfilOnboarding(
  data: OnboardingData
): Promise<{ ok: true } | { error: string }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Non authentifié. Reconnectez-vous.' }

    const { error } = await supabase
      .from('profil_entreprise')
      .upsert(
        {
          user_id: user.id,
          raison_sociale: data.raison_sociale,
          siret: data.siret,
          forme_juridique: data.forme_juridique,
          adresse_siege: data.adresse_siege,
          domaines: data.domaines,
          zone_geographique: data.zone_geographique,
          onboarding_masque: false,
        },
        { onConflict: 'user_id' }
      )

    if (error) return { error: error.message }

    revalidatePath('/dashboard')
    revalidatePath('/onboarding')
    return { ok: true }
  } catch (err) {
    console.error('[sauvegarderProfilOnboarding]', err)
    return { error: 'Erreur serveur. Réessayez.' }
  }
}
