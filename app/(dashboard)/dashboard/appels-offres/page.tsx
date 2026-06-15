import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { extractDepts, expandDomainKeywords } from './boampHelpers'
import { AppelsOffresClient } from './AppelsOffresClient'

export const metadata = { title: 'Appels d\'offres | GrowthOS' }

export default async function AppelsOffresPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profil } = await supabase
    .from('profil_entreprise')
    .select('zone_geographique, domaines')
    .maybeSingle()

  const baseDepts = extractDepts(profil?.zone_geographique ?? null)
  const baseDomainKeywords = expandDomainKeywords(profil?.domaines ?? [])

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 sm:px-8 sm:py-14">
      <div className="mb-8">
        <h1 className="font-syne text-[26px] sm:text-[30px] font-bold text-text leading-tight">
          Appels d&apos;offres
        </h1>
        <p className="font-syne text-[14px] text-text-subtle mt-1">
          Marchés publics récents issus du BOAMP, filtrés selon votre profil
        </p>
      </div>

      <AppelsOffresClient
        baseDepts={baseDepts}
        baseDomainKeywords={baseDomainKeywords}
        profilZone={profil?.zone_geographique ?? null}
        profilDomaines={profil?.domaines ?? []}
      />
    </div>
  )
}
