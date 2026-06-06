'use server'

import { createClient } from '@/lib/supabase/server'

export type ProfilEntreprise = {
  user_id?: string
  raison_sociale: string | null
  ca_dernier_exercice: number | null
  effectif: number | null
  annees_experience: number | null
  certifications: string[]
  domaines: string[]
  zone_geographique: string | null
  capacite_caution: boolean
  notes: string | null
  updated_at?: string
}

export type ProfilFormData = {
  raison_sociale: string
  ca_dernier_exercice: string
  effectif: string
  annees_experience: string
  certifications: string[]
  domaines: string[]
  zone_geographique: string
  capacite_caution: boolean
  notes: string
}

export type ProfilState = { success: true } | { error: string } | null

export async function sauvegarderProfil(profil: ProfilFormData): Promise<ProfilState> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Non authentifié. Reconnecte-toi.' }

    const { error } = await supabase
      .from('profil_entreprise')
      .upsert(
        {
          user_id: user.id,
          raison_sociale: profil.raison_sociale.trim() || null,
          ca_dernier_exercice: profil.ca_dernier_exercice !== '' ? parseFloat(profil.ca_dernier_exercice) : null,
          effectif: profil.effectif !== '' ? parseInt(profil.effectif, 10) : null,
          annees_experience: profil.annees_experience !== '' ? parseInt(profil.annees_experience, 10) : null,
          certifications: profil.certifications,
          domaines: profil.domaines,
          zone_geographique: profil.zone_geographique.trim() || null,
          capacite_caution: profil.capacite_caution,
          notes: profil.notes.trim() || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      )

    if (error) {
      console.error('[sauvegarderProfil] upsert error:', error)
      return { error: 'Erreur lors de la sauvegarde. Réessaie.' }
    }

    return { success: true }
  } catch (err) {
    console.error('[sauvegarderProfil]', err)
    return { error: 'Erreur inattendue. Réessaie.' }
  }
}
