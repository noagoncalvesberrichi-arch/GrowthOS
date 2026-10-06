import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { listerBibliotheque } from './actions'
import { BibliothequeClient } from './BibliothequeClient'

export const metadata = { title: 'Bibliothèque de contenus — Stratly' }

export default async function BibliothequePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const blocs = await listerBibliotheque()

  return <BibliothequeClient initialBlocs={blocs} />
}
