'use server'

import { createClient } from '@/lib/supabase/server'

export type ActeLot = {
  numero: string
  designation: string
  montant_ht: string
}

export type ActeEngagementData = {
  raison_sociale: string
  forme_juridique: string
  adresse_siege: string
  siret: string
  nom_signataire: string
  qualite_signataire: string
  iban: string
  bic: string
  objet: string
  acheteur: string
  delai_execution: string
  lots: ActeLot[]
  taux_tva: string
  analyse_id: string | null
}

type SaveResult = { success: true } | { error: string }

export async function sauvegarderActeEngagement(
  data: ActeEngagementData
): Promise<SaveResult> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Non authentifié. Reconnectez-vous.' }

    const { error } = await supabase
      .from('actes_engagement')
      .upsert(
        {
          user_id: user.id,
          analyse_id: data.analyse_id || null,
          donnees: data,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      )

    if (error) {
      console.error('[sauvegarderActeEngagement]', error)
      return { error: 'Erreur lors de la sauvegarde.' }
    }

    return { success: true }
  } catch (err) {
    console.error('[sauvegarderActeEngagement]', err)
    return { error: 'Erreur inattendue.' }
  }
}

export async function chargerActeEngagement(): Promise<ActeEngagementData | null> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data } = await supabase
      .from('actes_engagement')
      .select('donnees')
      .eq('user_id', user.id)
      .maybeSingle()

    return (data?.donnees as ActeEngagementData) ?? null
  } catch {
    return null
  }
}
