'use server'

import { createClient } from '@/lib/supabase/server'
import { anthropic } from '@/lib/anthropic'
import { CATEGORIES, type CategorieId } from './constants'

export type BlocContenu = {
  id: string
  titre: string
  categorie: CategorieId
  contenu: string
  resume: string
  mots_cles: string[]
  source_fichier: string | null
  nb_mots: number
  ordre: number
  created_at: string
}

export async function listerBibliotheque(): Promise<BlocContenu[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('bibliotheque_contenus')
    .select('id, titre, categorie, contenu, resume, mots_cles, source_fichier, nb_mots, ordre, created_at')
    .order('ordre', { ascending: true })
    .order('created_at', { ascending: false })
  if (error) { console.error('[listerBibliotheque]', error); return [] }
  return (data ?? []) as BlocContenu[]
}

type BlocInput = {
  titre: string
  categorie: CategorieId
  contenu: string
  resume?: string
  mots_cles?: string[]
  source_fichier?: string | null
  ordre?: number
}

function countWords(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length
}

export async function creerBloc(input: BlocInput): Promise<{ ok: boolean; id?: string; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Non authentifié.' }

  const { data, error } = await supabase
    .from('bibliotheque_contenus')
    .insert({
      user_id: user.id,
      titre: input.titre.trim(),
      categorie: input.categorie,
      contenu: input.contenu,
      resume: input.resume ?? '',
      mots_cles: input.mots_cles ?? [],
      source_fichier: input.source_fichier ?? null,
      nb_mots: countWords(input.contenu),
      ordre: input.ordre ?? 0,
      updated_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (error) { console.error('[creerBloc]', error); return { ok: false, error: error.message } }
  return { ok: true, id: data.id }
}

export async function modifierBloc(id: string, input: Partial<BlocInput>): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Non authentifié.' }

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (input.titre !== undefined) update.titre = input.titre.trim()
  if (input.categorie !== undefined) update.categorie = input.categorie
  if (input.contenu !== undefined) { update.contenu = input.contenu; update.nb_mots = countWords(input.contenu) }
  if (input.resume !== undefined) update.resume = input.resume
  if (input.mots_cles !== undefined) update.mots_cles = input.mots_cles
  if (input.ordre !== undefined) update.ordre = input.ordre

  const { error } = await supabase
    .from('bibliotheque_contenus')
    .update(update)
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) { console.error('[modifierBloc]', error); return { ok: false, error: error.message } }
  return { ok: true }
}

export async function supprimerBloc(id: string): Promise<{ ok: boolean }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false }

  const { error } = await supabase
    .from('bibliotheque_contenus')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) { console.error('[supprimerBloc]', error); return { ok: false } }
  return { ok: true }
}

export async function fusionnerBlocs(
  ids: string[],
  titre: string,
  categorie: CategorieId
): Promise<{ ok: boolean; id?: string; error?: string }> {
  if (ids.length < 2) return { ok: false, error: 'Sélectionnez au moins deux blocs.' }
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Non authentifié.' }

  const { data: blocs, error } = await supabase
    .from('bibliotheque_contenus')
    .select('contenu, mots_cles, ordre')
    .in('id', ids)
    .eq('user_id', user.id)
    .order('ordre', { ascending: true })

  if (error || !blocs?.length) return { ok: false, error: 'Blocs introuvables.' }

  const contenuFusion = blocs.map(b => b.contenu).join('\n\n')
  const motsClesFusion = [...new Set(blocs.flatMap(b => b.mots_cles ?? []))]

  const { data: nouveau, error: createError } = await supabase
    .from('bibliotheque_contenus')
    .insert({
      user_id: user.id,
      titre: titre.trim(),
      categorie,
      contenu: contenuFusion,
      resume: '',
      mots_cles: motsClesFusion,
      source_fichier: null,
      nb_mots: countWords(contenuFusion),
      ordre: blocs[0].ordre,
      updated_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (createError) return { ok: false, error: createError.message }

  // Supprimer les blocs d'origine
  await supabase.from('bibliotheque_contenus').delete().in('id', ids).eq('user_id', user.id)

  return { ok: true, id: nouveau.id }
}

// ─── Import batch après import Word ──────────────────────────────────────────

export type BlocImport = {
  titre: string
  categorie: CategorieId
  contenu: string
  resume: string
  mots_cles: string[]
  source_fichier: string
}

export async function importerBlocsWord(blocs: BlocImport[]): Promise<{ ok: boolean; count: number; error?: string }> {
  if (!blocs.length) return { ok: true, count: 0 }
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, count: 0, error: 'Non authentifié.' }

  const rows = blocs.map((b, i) => ({
    user_id: user.id,
    titre: b.titre.trim(),
    categorie: b.categorie,
    contenu: b.contenu,
    resume: b.resume,
    mots_cles: b.mots_cles,
    source_fichier: b.source_fichier,
    nb_mots: countWords(b.contenu),
    ordre: i,
    updated_at: new Date().toISOString(),
  }))

  const { error } = await supabase.from('bibliotheque_contenus').insert(rows)
  if (error) { console.error('[importerBlocsWord]', error); return { ok: false, count: 0, error: error.message } }
  return { ok: true, count: blocs.length }
}

// ─── Catégorisation Claude (batch) ──────────────────────────────────────────

export type RawBlocForCategorisation = {
  titre: string
  contenu: string
}

export type CategorisationResult = {
  titre: string
  categorie: CategorieId
  resume: string
  mots_cles: string[]
}

/**
 * Catégorise un lot de blocs (max 15). Lève une erreur si la catégorisation échoue —
 * l'appelant est responsable de gérer l'erreur et d'afficher un message à l'utilisateur.
 */
export async function categoriserLot(
  blocs: RawBlocForCategorisation[]
): Promise<CategorisationResult[]> {
  if (!blocs.length) return []

  const categoriesList = CATEGORIES.map(c => `"${c.id}" (${c.label})`).join(', ')

  const prompt = `Tu analyses des blocs de contenu d'un mémoire technique BTP/bureau d'études.
Catégories : ${categoriesList}

Pour chaque bloc, détermine :
- categorie : la catégorie la plus appropriée
- resume : une phrase de 10-20 mots résumant le sujet
- mots_cles : 3-5 mots-clés pertinents (minuscules)

${blocs.length} bloc${blocs.length > 1 ? 's' : ''} à analyser :
${blocs.map((b, i) => `[${i}] Titre: "${b.titre}"\nExtrait: ${b.contenu.slice(0, 500)}`).join('\n\n')}

Réponds UNIQUEMENT avec un tableau JSON de ${blocs.length} objets :
[{"categorie":"...","resume":"...","mots_cles":["..."]}]`

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1500,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : ''
  const jsonMatch = text.match(/\[[\s\S]*\]/)
  if (!jsonMatch) throw new Error(`Réponse non parseable : ${text.slice(0, 150)}`)

  const parsed: { categorie: string; resume: string; mots_cles: string[] }[] = JSON.parse(jsonMatch[0])

  return blocs.map((b, i) => ({
    titre: b.titre,
    categorie: (parsed[i]?.categorie as CategorieId) ?? 'autre',
    resume: parsed[i]?.resume ?? '',
    mots_cles: parsed[i]?.mots_cles ?? [],
  }))
}
