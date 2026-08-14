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
  moyens_humains: string | null
  moyens_materiels: string | null
  methodologies: string | null
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
  moyens_humains: string
  moyens_materiels: string
  methodologies: string
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
          moyens_humains: profil.moyens_humains.trim() || null,
          moyens_materiels: profil.moyens_materiels.trim() || null,
          methodologies: profil.methodologies.trim() || null,
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

// ─── Références chantiers ─────────────────────────────────────────────────────

export type ReferenceChantier = {
  id: string
  titre: string
  maitre_ouvrage: string | null
  annee: number | null
  montant: number | null
  description: string | null
  domaines: string[]
  site_occupe: boolean
}

export type ReferenceFormData = {
  titre: string
  maitre_ouvrage: string
  annee: string
  montant: string
  description: string
  domaines: string[]
  site_occupe: boolean
}

export type ReferenceState = { success: true; id?: string } | { error: string } | null

export async function ajouterReference(data: ReferenceFormData): Promise<ReferenceState> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Non authentifié. Reconnecte-toi.' }

    const { data: inserted, error } = await supabase
      .from('references_chantiers')
      .insert({
        user_id: user.id,
        titre: data.titre.trim(),
        maitre_ouvrage: data.maitre_ouvrage.trim() || null,
        annee: data.annee !== '' ? parseInt(data.annee, 10) : null,
        montant: data.montant !== '' ? parseFloat(data.montant) : null,
        description: data.description.trim() || null,
        domaines: data.domaines,
        site_occupe: data.site_occupe,
      })
      .select('id')
      .single()

    if (error) {
      console.error('[ajouterReference] insert error:', error)
      return { error: 'Erreur lors de l\'ajout. Réessaie.' }
    }

    return { success: true, id: inserted.id as string }
  } catch (err) {
    console.error('[ajouterReference]', err)
    return { error: 'Erreur inattendue. Réessaie.' }
  }
}

export async function modifierReference(id: string, data: ReferenceFormData): Promise<ReferenceState> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Non authentifié. Reconnecte-toi.' }

    const { error } = await supabase
      .from('references_chantiers')
      .update({
        titre: data.titre.trim(),
        maitre_ouvrage: data.maitre_ouvrage.trim() || null,
        annee: data.annee !== '' ? parseInt(data.annee, 10) : null,
        montant: data.montant !== '' ? parseFloat(data.montant) : null,
        description: data.description.trim() || null,
        domaines: data.domaines,
        site_occupe: data.site_occupe,
      })
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('[modifierReference] update error:', error)
      return { error: 'Erreur lors de la modification. Réessaie.' }
    }

    return { success: true }
  } catch (err) {
    console.error('[modifierReference]', err)
    return { error: 'Erreur inattendue. Réessaie.' }
  }
}

export async function supprimerReference(id: string): Promise<ReferenceState> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Non authentifié. Reconnecte-toi.' }

    const { error } = await supabase
      .from('references_chantiers')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('[supprimerReference] delete error:', error)
      return { error: 'Erreur lors de la suppression. Réessaie.' }
    }

    return { success: true }
  } catch (err) {
    console.error('[supprimerReference]', err)
    return { error: 'Erreur inattendue. Réessaie.' }
  }
}
