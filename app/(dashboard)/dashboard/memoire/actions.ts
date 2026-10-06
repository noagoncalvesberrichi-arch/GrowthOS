'use server'

import { anthropic } from '@/lib/anthropic'
import { createClient } from '@/lib/supabase/server'

export type MemoireResult = { trame: string } | { error: string }

// ─── Types pour génération V2 section par section ────────────────────────────

export type SectionPlan = {
  titre: string
  ponderation: string
  blocs: { id: string; titre: string; categorie: string }[]
  targetWords?: number
}

export type SectionResult = {
  titre: string
  ponderation: string
  text: string
  blocs: { id: string; titre: string }[]
  wordCount: number
  targetWords?: number
}

export type GenPlanResult = { sections: SectionPlan[]; introBlocs: { id: string; titre: string }[]; missingFields: string[] } | { error: string }
export type GenSectionResult = { text: string; blocs: { id: string; titre: string }[]; wordCount: number } | { error: string }

type ProfilRow = {
  raison_sociale: string | null
  ca_dernier_exercice: number | null
  effectif: number | null
  annees_experience: number | null
  certifications: string[] | null
  domaines: string[] | null
  zone_geographique: string | null
  notes: string | null
  moyens_humains: string | null
  moyens_materiels: string | null
  methodologies: string | null
}

type ReferenceChantier = {
  titre: string
  maitre_ouvrage: string | null
  annee: number | null
  montant: number | null
  description: string | null
  domaines: string[]
  site_occupe: boolean
}

type DatesCles = {
  date_limite_offres: string | null
  visite: string | null
  validite_offres: string | null
  autres_dates: { libelle: string; date: string }[]
}

type AnalyseResultat = {
  objet?: string
  type_procedure?: string
  acheteur?: string
  lots?: { numero: string; designation: string }[]
  criteres_notation?: { critere: string; ponderation: string }[]
  pieces_a_fournir?: string[]
  dates_cles?: DatesCles
  montant_estime?: number | null
  points_de_vigilance?: string[]
}

const SYSTEM_PROMPT = `Tu es un expert en réponse aux marchés publics français, spécialisé dans la rédaction de mémoires techniques.
Tu génères des TRAMES de mémoires techniques — des bases de travail structurées et pré-remplies, pas des documents finaux.
L'objectif est d'éliminer la page blanche et de guider l'entreprise dans sa rédaction.
Tu réponds UNIQUEMENT avec le texte de la trame, sans commentaire, sans markdown entourant le document.`

function formatDate(s: string | null): string {
  if (!s) return 'à définir'
  try {
    return new Date(s).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  } catch {
    return s
  }
}

function buildProfilBlock(profil: ProfilRow | null): string {
  if (!profil) return 'Profil non renseigné — utiliser des formulations génériques.'
  const lines = [
    profil.raison_sociale
      ? `Raison sociale : ${profil.raison_sociale}`
      : `Raison sociale : [À COMPLÉTER : raison sociale]`,
    profil.domaines?.length ? `Domaines d'activité : ${profil.domaines.join(', ')}` : null,
    profil.effectif != null ? `Effectif : ${profil.effectif} personne(s)` : null,
    profil.annees_experience != null ? `Années d'expérience : ${profil.annees_experience} ans` : null,
    profil.ca_dernier_exercice != null
      ? `CA : ${profil.ca_dernier_exercice.toLocaleString('fr-FR')} €`
      : null,
    profil.certifications?.length
      ? `Certifications : ${profil.certifications.join(', ')}`
      : null,
    profil.zone_geographique ? `Zone géographique : ${profil.zone_geographique}` : null,
    profil.notes ? `Informations complémentaires : ${profil.notes}` : null,
    profil.moyens_humains ? `Moyens humains : ${profil.moyens_humains}` : null,
    profil.moyens_materiels ? `Moyens matériels : ${profil.moyens_materiels}` : null,
    profil.methodologies ? `Méthodologies & démarches : ${profil.methodologies}` : null,
  ].filter(Boolean).join('\n')
  return lines || 'Profil non renseigné — utiliser des formulations génériques.'
}

function buildMarcheBlock(
  resultat: AnalyseResultat | null,
  descriptionManuelle: string | null
): string {
  if (descriptionManuelle) return descriptionManuelle.trim()
  if (!resultat) return 'Marché non renseigné.'

  const lines: string[] = []
  if (resultat.objet) lines.push(`Objet : ${resultat.objet}`)
  if (resultat.type_procedure) lines.push(`Procédure : ${resultat.type_procedure}`)
  if (resultat.acheteur) lines.push(`Acheteur : ${resultat.acheteur}`)
  if (resultat.lots?.length) {
    lines.push(`Lots : ${resultat.lots.map(l => l.designation).join(' / ')}`)
  }
  if (resultat.montant_estime != null) {
    lines.push(`Montant estimé : ${resultat.montant_estime.toLocaleString('fr-FR')} € HT`)
  }
  if (resultat.criteres_notation?.length) {
    lines.push('Critères de notation :')
    resultat.criteres_notation.forEach(c => lines.push(`  - ${c.critere} : ${c.ponderation}`))
  }
  const dc = resultat.dates_cles
  if (dc) {
    const dlines: string[] = []
    if (dc.date_limite_offres) {
      dlines.push(`  - Limite de remise des offres : ${formatDate(dc.date_limite_offres)}`)
    }
    if (dc.visite) dlines.push(`  - Visite du site : ${formatDate(dc.visite)}`)
    if (dc.validite_offres) dlines.push(`  - Validité des offres : ${dc.validite_offres}`)
    dc.autres_dates?.forEach(d => dlines.push(`  - ${d.libelle} : ${formatDate(d.date)}`))
    if (dlines.length) {
      lines.push('Dates clés :')
      lines.push(...dlines)
    }
  }
  if (resultat.pieces_a_fournir?.length) {
    lines.push(`Pièces à fournir : ${resultat.pieces_a_fournir.join(', ')}`)
  }
  return lines.join('\n')
}

const MAX_REFS_IN_PROMPT = 25

function extractAOKeywords(
  resultat: AnalyseResultat | null,
  profil: ProfilRow | null
): string[] {
  const raw: string[] = []
  if (resultat?.objet) raw.push(...resultat.objet.toLowerCase().split(/[\s,;/()]+/))
  resultat?.lots?.forEach(l => raw.push(...l.designation.toLowerCase().split(/[\s,;/()]+/)))
  profil?.domaines?.forEach(d => raw.push(...d.toLowerCase().split(/[\s,;/()]+/)))

  const stop = new Set([
    'de','du','des','le','la','les','un','une','et','en','à','au','aux','pour','par',
    'sur','dans','avec','ou','qui','que','se','ce','il','elle','ils','elles','je','tu',
    'nous','vous','mais','donc','car','ni','or','est','sont','a','ont','été','avoir',
    'd','l','s','n','j','y','c','m','t','qu',
  ])
  return [...new Set(raw.filter(w => w.length > 3 && !stop.has(w)))]
}

function scoreRef(ref: ReferenceChantier, keywords: string[]): number {
  if (keywords.length === 0) return 0
  const haystack = [
    ...(ref.domaines ?? []),
    ref.description ?? '',
    ref.titre ?? '',
  ].join(' ').toLowerCase()
  return keywords.filter(kw => haystack.includes(kw)).length
}

function selectTopReferences(
  refs: ReferenceChantier[],
  resultat: AnalyseResultat | null,
  profil: ProfilRow | null
): { selected: ReferenceChantier[]; summaryLine: string | null } {
  if (refs.length <= MAX_REFS_IN_PROMPT) return { selected: refs, summaryLine: null }

  const keywords = extractAOKeywords(resultat, profil)

  const scored = refs.map(ref => ({
    ref,
    score: scoreRef(ref, keywords),
    annee: ref.annee ?? 0,
    hasMontant: ref.montant != null ? 1 : 0,
  }))

  scored.sort((a, b) =>
    b.score !== a.score ? b.score - a.score :
    b.annee !== a.annee ? b.annee - a.annee :
    b.hasMontant - a.hasMontant
  )

  const selected = scored.slice(0, MAX_REFS_IN_PROMPT).map(s => s.ref)
  const rest = scored.slice(MAX_REFS_IN_PROMPT)

  const restYears = rest.map(s => s.annee).filter(y => y > 0)
  const minYear = restYears.length > 0 ? Math.min(...restYears) : null
  const maxYear = restYears.length > 0 ? Math.max(...restYears) : null

  let summaryLine = `+ ${rest.length} autres références similaires`
  if (minYear && maxYear) {
    summaryLine += minYear === maxYear ? ` en ${minYear}` : ` entre ${minYear} et ${maxYear}`
  }

  return { selected, summaryLine }
}

function buildReferencesBlock(refs: ReferenceChantier[], summaryLine: string | null = null): string {
  const body = refs
    .map((ref, i) => {
      const montantStr = ref.montant != null
        ? `${ref.montant.toLocaleString('fr-FR')} € HT`
        : null
      const meta = [
        ref.maitre_ouvrage ? `Maître d'ouvrage : ${ref.maitre_ouvrage}` : null,
        ref.annee != null ? `Année : ${ref.annee}` : null,
        montantStr ? `Montant : ${montantStr}` : null,
      ].filter(Boolean).join('   ')

      const domStr = ref.domaines.length > 0
        ? `Domaines : ${ref.domaines.join(', ')}`
        : null

      const lines = [
        `${i + 1}. ${ref.titre}`,
        meta ? `   ${meta}` : null,
        ref.description ? `   Description : ${ref.description}` : null,
        [domStr, ref.site_occupe ? 'Réalisé en site occupé' : null]
          .filter(Boolean)
          .join('   ')
          ? `   ${[domStr, ref.site_occupe ? 'Réalisé en site occupé' : null].filter(Boolean).join('   ')}`
          : null,
      ].filter(Boolean)

      return lines.join('\n')
    })
    .join('\n\n')
  return summaryLine ? body + '\n\n' + summaryLine : body
}

function buildPrompt(
  profilBlock: string,
  marcheBlock: string,
  resultat: AnalyseResultat | null,
  references: ReferenceChantier[],
  summaryLine: string | null = null
): string {
  const parts: string[] = [
    "Génère une trame de mémoire technique pour le marché ci-dessous, adaptée au profil de l'entreprise.",
    '',
    'PROFIL DE L\'ENTREPRISE :',
    profilBlock,
    '',
    'MARCHÉ :',
    marcheBlock,
  ]

  // References block
  if (references.length > 0) {
    parts.push(
      '',
      'RÉFÉRENCES CHANTIERS RÉALISÉES :',
      buildReferencesBlock(references, summaryLine),
      '',
      "DIRECTIVE RÉFÉRENCES : utilise en priorité les références dont les domaines ou le contexte (site occupé, type d'ouvrage) correspondent au marché analysé. Cite-les nommément (titre, maître d'ouvrage, année, montant si disponible) dans l'introduction et dans les parties où elles appuient la démonstration de compétence. N'invente JAMAIS une référence qui ne figure pas dans cette liste."
    )
  }

  // Resources block
  const profil = profilBlock // used to check moyens fields — they're embedded in profilBlock already
  void profil // suppress unused warning — the actual check is on the original profil object
  // We need the actual profil object to check moyens fields; they are included in profilBlock if present.
  // Build the resources directive based on what's in profilBlock.
  const hasMoyensHumains = profilBlock.includes('Moyens humains :')
  const hasMoyensMateriels = profilBlock.includes('Moyens matériels :')
  const hasMethodologies = profilBlock.includes('Méthodologies & démarches :')

  if (hasMoyensHumains || hasMoyensMateriels || hasMethodologies) {
    parts.push(
      '',
      'DIRECTIVE RESSOURCES TECHNIQUES : les moyens humains, matériels et méthodologies renseignés dans le profil ci-dessus sont réels. Intègre-les dans les sections correspondantes du mémoire en remplacement des [À COMPLÉTER]. Conserve [À COMPLÉTER : ...] uniquement si une information spécifique manque.'
    )
  }

  // All vigilance points — no truncation
  const vigilance = resultat?.points_de_vigilance ?? []
  if (vigilance.length > 0) {
    parts.push(
      '',
      'POINTS DE VIGILANCE DÉTECTÉS DANS LE DCE :',
      ...vigilance.map(p => `- ${p}`),
      "DIRECTIVE : chacun de ces points lié à l'exécution (site occupé, phasage, accès restreint, délais contraints, coordination avec d'autres corps d'état, continuité de service...) DOIT être adressé nommément dans la section méthodologie correspondante avec une réponse concrète et rassurante pour l'acheteur. Ne pas les ignorer."
    )
  }

  parts.push(
    '',
    'INSTRUCTIONS :',
    '- Commence par : "TRAME DE MÉMOIRE TECHNIQUE"',
    '- Ligne vide, puis : "⚠ Document de travail — Complétez les passages [À COMPLÉTER : ...] avec vos informations réelles avant envoi."',
    '- Utilise [À COMPLÉTER : description précise] pour : références de projets similaires réalisés, noms et profils des intervenants, numéros de certifications, équipements spécifiques, dates et montants précis',
    "- Phrases complètes, ton professionnel de candidature, pas de bullet points excessifs — c'est un document de réponse à un marché public",
    "- IMPORTANT : génère le document en intégralité jusqu'à la dernière section, sans t'arrêter.",
    "- Planning : si une date de démarrage peut être déduite des dates clés (délai de notification estimé à ~2 mois après remise des offres) et qu'une durée de travaux figure dans le DCE, calcule le mois de fin de chantier plutôt que de laisser [À COMPLÉTER : date de fin]."
  )

  const criteres = (resultat?.criteres_notation ?? []).filter(c => c.critere && c.ponderation)

  if (criteres.length > 0) {
    const criteLines = criteres.map((c, i) => `${i + 1}. ${c.critere} (${c.ponderation})`)
    parts.push(
      '',
      'STRUCTURE DU MÉMOIRE — ALIGNÉE SUR LA GRILLE DE NOTATION DE L\'ACHETEUR :',
      "La structure suit EXACTEMENT les critères de la valeur technique du DCE, dans leur ordre, avec leur intitulé exact en titre de section.",
      "Si un critère « Prix » figure dans la liste, ne lui consacre pas de section — le mémoire technique ne porte que sur les critères qualitatifs.",
      '',
      'PROPORTIONNEMENT DU CONTENU : le volume de chaque section est proportionnel à sa pondération.',
      'Règle : 10 points de pondération ≈ 1 paragraphe dense (5-8 lignes). Minimum 1 paragraphe, maximum 6 par section.',
      'Exemples : 40 % → 4 paragraphes | 25 % → 2-3 paragraphes | 15 % → 1-2 paragraphes | 10 % → 1 paragraphe.',
      '',
      'Critères (ordre à respecter) :',
      ...criteLines,
      '',
      'PLAN DU DOCUMENT (respecter strictement) :',
      'TRAME DE MÉMOIRE TECHNIQUE',
      '⚠ Document de travail — Complétez les passages [À COMPLÉTER : ...] avec vos informations réelles avant envoi.',
      '',
      'INTRODUCTION — PRÉSENTATION DE L\'ENTREPRISE',
      "[Synthèse en 1 à 2 paragraphes : profil, domaines d'activité, expérience, certifications, zone géographique]",
      '',
      "[Pour chaque critère qualitatif dans l'ordre exact ci-dessus, générer une section :]",
      '[numéro]. [INTITULÉ EXACT DU CRITÈRE EN MAJUSCULES] ([pondération])',
      '[paragraphes proportionnels à la pondération, avec [À COMPLÉTER : ...] pour les données spécifiques]',
      '',
      'CONCLUSION — NOS ENGAGEMENTS',
      "[1 paragraphe synthétisant les engagements de l'entreprise sur ce marché]"
    )
  } else {
    // Fallback: fixed 8-section plan
    parts.push(
      '',
      'STRUCTURE DU MÉMOIRE — PLAN STANDARD :',
      "Aucun critère de notation n'a été détecté dans le DCE. Utilise le plan standard en 8 sections (toutes obligatoires, dans cet ordre) :",
      '',
      'PLAN DU DOCUMENT :',
      'TRAME DE MÉMOIRE TECHNIQUE',
      '⚠ Document de travail — Complétez les passages [À COMPLÉTER : ...] avec vos informations réelles avant envoi.',
      '',
      '1. PRÉSENTATION DE L\'ENTREPRISE',
      '2. COMPRÉHENSION DU BESOIN ET DES ENJEUX DU MARCHÉ',
      '3. MÉTHODOLOGIE D\'INTERVENTION ET ORGANISATION DE LA PRESTATION',
      '4. MOYENS HUMAINS ET COMPÉTENCES DE L\'ÉQUIPE AFFECTÉE',
      '5. MOYENS MATÉRIELS ET TECHNIQUES',
      '6. PLANNING PRÉVISIONNEL ET GESTION DES DÉLAIS',
      '7. DÉMARCHE QUALITÉ, HYGIÈNE ET SÉCURITÉ',
      '8. ENGAGEMENTS ENVIRONNEMENTAUX ET DÉVELOPPEMENT DURABLE',
      '',
      'Chaque section : 2 à 4 paragraphes rédigés, professionnels, adaptés au type de marché.'
    )
  }

  return parts.join('\n')
}

export async function genererMemoire(
  analyseId: string | null,
  descriptionManuelle: string | null,
  longueur: 'court' | 'standard' | 'complet' = 'standard'
): Promise<MemoireResult> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Non authentifié.' }

    if (!analyseId && (!descriptionManuelle || descriptionManuelle.trim().length < 20)) {
      return { error: 'Décrivez le marché (au moins 20 caractères) ou sélectionnez une analyse.' }
    }

    const [{ data: profilData }, { data: refsData }] = await Promise.all([
      supabase
        .from('profil_entreprise')
        .select('raison_sociale, ca_dernier_exercice, effectif, annees_experience, certifications, domaines, zone_geographique, notes, moyens_humains, moyens_materiels, methodologies')
        .maybeSingle(),
      supabase
        .from('references_chantiers')
        .select('titre, maitre_ouvrage, annee, montant, description, domaines, site_occupe')
        .order('annee', { ascending: false }),
    ])

    const profil = profilData as ProfilRow | null
    const references = (refsData ?? []) as ReferenceChantier[]

    let resultat: AnalyseResultat | null = null
    if (analyseId) {
      const { data: analyse } = await supabase
        .from('analyses')
        .select('resultat')
        .eq('id', analyseId)
        .single()
      if (analyse?.resultat) resultat = analyse.resultat as AnalyseResultat
    }

    const { selected: selectedRefs, summaryLine } = selectTopReferences(references, resultat, profil)

    const profilBlock = buildProfilBlock(profil)
    const marcheBlock = buildMarcheBlock(resultat, descriptionManuelle)
    const prompt = buildPrompt(profilBlock, marcheBlock, resultat, selectedRefs, summaryLine)

    const maxTokensV1 = longueur === 'court' ? 5000 : longueur === 'complet' ? 12000 : 8192

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: maxTokensV1,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: prompt }],
    })

    let trame = message.content[0].type === 'text' ? message.content[0].text : ''
    if (!trame.trim()) return { error: 'Réponse vide du modèle. Réessaie.' }

    if (message.stop_reason === 'max_tokens') {
      trame +=
        '\n\n⚠ GÉNÉRATION INCOMPLÈTE — La trame a été tronquée (limite de tokens atteinte). Régénérez pour obtenir le document complet.'
    }

    // Auto-save on generation when linked to an analysis
    if (analyseId) {
      const { error: saveError } = await supabase
        .from('memoires')
        .upsert(
          {
            user_id: user.id,
            analyse_id: analyseId,
            contenu: trame,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,analyse_id' }
        )
      if (saveError) console.error('[genererMemoire] save error:', saveError)
    }

    return { trame }
  } catch (err) {
    console.error('[genererMemoire]', err)
    return { error: "Erreur lors de la génération. Vérifiez votre connexion et réessayez." }
  }
}

export async function sauvegarderMemoire(
  analyseId: string,
  contenu: string
): Promise<{ ok: boolean }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { ok: false }

    const { error } = await supabase
      .from('memoires')
      .upsert(
        {
          user_id: user.id,
          analyse_id: analyseId,
          contenu,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,analyse_id' }
      )

    if (error) {
      console.error('[sauvegarderMemoire]', error)
      return { ok: false }
    }
    return { ok: true }
  } catch (err) {
    console.error('[sauvegarderMemoire]', err)
    return { ok: false }
  }
}

export async function chargerMemoire(
  analyseId: string
): Promise<{ contenu: string | null }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { contenu: null }

    const { data } = await supabase
      .from('memoires')
      .select('contenu')
      .eq('analyse_id', analyseId)
      .maybeSingle()

    return { contenu: data?.contenu ?? null }
  } catch (err) {
    console.error('[chargerMemoire]', err)
    return { contenu: null }
  }
}

// ─── V2 : génération section par section ─────────────────────────────────────

type BlocBiblio = {
  id: string
  titre: string
  categorie: string
  contenu: string
  resume: string
  mots_cles: string[]
}

// Mots-clés attendus par catégorie (pour scorer les sections)
const CAT_KEYWORDS: Record<string, string[]> = {
  presentation:      ['présentation', 'entreprise', 'société', 'profil', 'introduction', 'historique', 'savoir-faire'],
  moyens_humains:    ['humains', 'personnel', 'équipe', 'effectif', 'intervenants', 'ressources', 'encadrement', 'chef'],
  moyens_materiels:  ['matériels', 'équipement', 'matériel', 'outillage', 'véhicule', 'machines', 'matériaux'],
  procede_execution: ['méthodologie', 'procédé', 'organisation', 'exécution', 'intervention', 'prestation', 'travaux', 'méthode', 'démarche', 'réalisation', 'mode opératoire'],
  securite:          ['sécurité', 'santé', 'sst', 'prévention', 'risque', 'ppsps', 'accident'],
  environnement:     ['environnement', 'développement durable', 'écologie', 'carbone', 'déchets', 'nuisances'],
  qualite:           ['qualité', 'certification', 'iso', 'assurance qualité', 'contrôle', 'qhse'],
  planning:          ['planning', 'délais', 'calendrier', 'délai', 'phasage', 'avancement'],
}

function scoreBlocForSection(bloc: BlocBiblio, sectionTitre: string): number {
  const titre = sectionTitre.toLowerCase()
  let score = 0

  // Category match via keywords in section title
  for (const [cat, kws] of Object.entries(CAT_KEYWORDS)) {
    if (bloc.categorie === cat) {
      for (const kw of kws) {
        if (titre.includes(kw)) score += 3
      }
    }
  }

  // Direct keyword match: bloc's mots_cles appear in section title
  for (const kw of bloc.mots_cles) {
    if (titre.includes(kw.toLowerCase())) score += 2
  }

  // Bloc title words in section title
  const blocWords = bloc.titre.toLowerCase().split(/\s+/).filter(w => w.length > 3)
  for (const w of blocWords) {
    if (titre.includes(w)) score += 1
  }

  // Resume words in section title
  const resumeWords = bloc.resume.toLowerCase().split(/\s+/).filter(w => w.length > 3)
  for (const w of resumeWords) {
    if (titre.includes(w)) score += 1
  }

  return score
}

function parsePonderation(s: string): number {
  const m = s.match(/(\d+(?:[.,]\d+)?)/)
  return m ? parseFloat(m[1].replace(',', '.')) : 10
}

/** Sélectionne les blocs pertinents par section via Claude. Lève une erreur si le parsage échoue. */
async function selectionnerBlocsParSections(
  sections: { titre: string; ponderation: string }[],
  blocs: { id: string; titre: string; categorie: string; resume: string }[]
): Promise<Record<string, string[]>> {
  if (!blocs.length || !sections.length) return {}

  const prompt = `Tu es un expert en réponse aux marchés publics. Sélectionne les blocs de contenu les plus pertinents pour chaque section d'un mémoire technique.

SECTIONS (${sections.length}) :
${sections.map((s, i) => `${i + 1}. "${s.titre}" (${s.ponderation})`).join('\n')}

BLOCS DISPONIBLES (${blocs.length}) :
${blocs.map(b => `[${b.id}] "${b.titre}" [${b.categorie}]${b.resume ? ` — ${b.resume}` : ''}`).join('\n')}

Pour chaque section, donne les IDs des 2-3 blocs les plus pertinents ([] si aucun ne correspond).
Réponds UNIQUEMENT avec ce JSON (clés = titres exacts des sections) :
{${sections.map(s => `"${s.titre}":[]`).join(',')}}`

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1200,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : ''
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('JSON non trouvé dans la réponse de sélection')
  return JSON.parse(match[0]) as Record<string, string[]>
}

/** Décompose un critère composé "A / B / C" en critères individuels avec pondération au prorata */
function maybeExpandCritere(c: { critere: string; ponderation: string }): { critere: string; ponderation: string }[] {
  const parts = c.critere.split(' / ').map(p => p.trim()).filter(p => p.length > 0)
  if (parts.length < 2) return [c]
  const total = parsePonderation(c.ponderation)
  const perPart = Math.round(total / parts.length)
  return parts.map((p, i) => ({
    critere: p,
    ponderation: `${i < parts.length - 1 ? perPart : total - perPart * (parts.length - 1)}%`,
  }))
}

const WORD_TARGETS_TOTAL: Record<string, number> = { court: 3000, standard: 7000, complet: 12000 }

const EXTRA_CHAPTER_DEFS = [
  { category: 'moyens_humains', titre: 'Moyens humains et organisation des équipes', keywords: ['humain', 'personnel', 'effectif', 'équipe'] },
  { category: 'moyens_materiels', titre: 'Moyens matériels et équipements', keywords: ['matériel', 'équipement', 'outil', 'engin'] },
  { category: 'procede_execution', titre: "Procédés d'exécution et méthodologie", keywords: ['méthodol', 'procédé', 'exécution', 'intervent'] },
  { category: 'qualite', titre: 'Démarche qualité', keywords: ['qualité', 'certification', 'iso', 'qhse', 'contrôle'] },
  { category: 'securite', titre: 'Sécurité et prévention des risques', keywords: ['sécurité', 'prévention', 'sst', 'risque'] },
  { category: 'environnement', titre: 'Engagement environnemental', keywords: ['environnement', 'durable', 'carbone', 'déchets'] },
  { category: 'planning', titre: 'Planning et respect des délais', keywords: ['planning', 'délai', 'calendrier', 'phasage'] },
] as const

/** Prépare le plan de génération : pour chaque section, sélectionne les blocs pertinents */
export async function preparerGenerationV2(
  analyseId: string | null,
  descriptionManuelle: string | null,
  longueur: 'court' | 'standard' | 'complet' = 'standard'
): Promise<GenPlanResult> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Non authentifié.' }

    // Load analyse critères
    let criteres: { critere: string; ponderation: string }[] = []
    if (analyseId) {
      const { data: analyse } = await supabase
        .from('analyses')
        .select('resultat')
        .eq('id', analyseId)
        .single()
      const res = analyse?.resultat as { criteres_notation?: typeof criteres } | null
      criteres = res?.criteres_notation?.filter(c => c.critere && c.ponderation && !c.critere.toLowerCase().includes('prix')) ?? []
    }

    // Load bibliothèque blocs + profil in parallel
    const [{ data: blocsData }, { data: profilData }] = await Promise.all([
      supabase.from('bibliotheque_contenus')
        .select('id, titre, categorie, contenu, resume, mots_cles')
        .order('ordre', { ascending: true }),
      supabase.from('profil_entreprise')
        .select('raison_sociale, domaines, effectif, moyens_humains, moyens_materiels')
        .maybeSingle(),
    ])

    const biblio = (blocsData ?? []) as BlocBiblio[]
    const profil = profilData as Pick<ProfilRow, 'raison_sociale' | 'domaines' | 'effectif' | 'moyens_humains' | 'moyens_materiels'> | null

    // Detect missing profile fields
    const missingFields: string[] = []
    if (!profil?.raison_sociale) missingFields.push('Raison sociale (Profil → Mon entreprise)')
    if (!profil?.domaines?.length) missingFields.push("Domaines d'activité")
    if (!profil?.effectif) missingFields.push('Effectif')
    if (!profil?.moyens_humains) missingFields.push('Moyens humains')
    if (!profil?.moyens_materiels) missingFields.push('Moyens matériels')

    if (!biblio.length) {
      return { sections: [], introBlocs: [], missingFields }
    }

    // Expand compound criteria (e.g. "Organisation / Délais / Sécurité" → 3 sections)
    const expandedCriteres = criteres.flatMap(maybeExpandCritere)

    // Select blocs for introduction
    const introBlocs = biblio
      .filter(b => b.categorie === 'presentation')
      .slice(0, 2)
      .map(b => ({ id: b.id, titre: b.titre }))

    // Essai de sélection par Claude, repli sur score par mots-clés
    let claudeSelection: Record<string, string[]> | null = null
    if (expandedCriteres.length > 0 && biblio.length > 0) {
      try {
        claudeSelection = await selectionnerBlocsParSections(
          expandedCriteres.map(c => ({ titre: c.critere, ponderation: c.ponderation })),
          biblio.map(b => ({ id: b.id, titre: b.titre, categorie: b.categorie, resume: b.resume }))
        )
      } catch (err) {
        console.warn('[preparerGenerationV2] Claude selection failed, using keyword scoring:', err)
      }
    }

    // Build section plans with word targets
    const totalTargetWords = WORD_TARGETS_TOTAL[longueur] ?? 7000
    const sections: SectionPlan[] = expandedCriteres.map(c => {
      const pondVal = parsePonderation(c.ponderation)
      const targetWords = Math.max(150, Math.round(totalTargetWords * pondVal / 100))

      let selectedBlocs: { id: string; titre: string; categorie: string }[]
      if (claudeSelection && Array.isArray(claudeSelection[c.critere]) && claudeSelection[c.critere].length > 0) {
        const selectedIds = new Set(claudeSelection[c.critere])
        selectedBlocs = biblio
          .filter(b => selectedIds.has(b.id))
          .map(b => ({ id: b.id, titre: b.titre, categorie: b.categorie }))
      } else {
        const scored = biblio
          .map(b => ({ b, score: scoreBlocForSection(b, c.critere) }))
          .filter(x => x.score > 0)
          .sort((a, b) => b.score - a.score)
          .slice(0, 3)
        selectedBlocs = scored.map(x => ({ id: x.b.id, titre: x.b.titre, categorie: x.b.categorie }))
      }

      return { titre: c.critere, ponderation: c.ponderation, blocs: selectedBlocs, targetWords }
    })

    // Standard/Complet: add chapters for library categories not covered by graded sections
    if (longueur !== 'court' && expandedCriteres.length > 0) {
      const coveredText = sections.map(s => s.titre.toLowerCase()).join(' ')
      const extraTargetWords = longueur === 'complet' ? 500 : 300
      for (const def of EXTRA_CHAPTER_DEFS) {
        if (def.keywords.some(kw => coveredText.includes(kw))) continue
        const catBlocs = biblio.filter(b => b.categorie === def.category).slice(0, 2)
        if (!catBlocs.length) continue
        sections.push({
          titre: def.titre,
          ponderation: '',
          blocs: catBlocs.map(b => ({ id: b.id, titre: b.titre, categorie: b.categorie })),
          targetWords: extraTargetWords,
        })
      }
    }

    return { sections, introBlocs, missingFields }
  } catch (err) {
    console.error('[preparerGenerationV2]', err)
    return { error: 'Erreur lors de la préparation.' }
  }
}

/** Génère une seule section du mémoire à partir des blocs sélectionnés */
export async function genererSectionV2(params: {
  analyseId: string | null
  descriptionManuelle: string | null
  sectionTitre: string
  sectionPonderation: string
  blocsIds: string[]
  longueur: 'court' | 'standard' | 'complet'
  isIntro?: boolean
  targetWords?: number
}): Promise<GenSectionResult> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Non authentifié.' }

    // Load blocs content
    let blocsContent: BlocBiblio[] = []
    if (params.blocsIds.length > 0) {
      const { data } = await supabase
        .from('bibliotheque_contenus')
        .select('id, titre, categorie, contenu, resume, mots_cles')
        .in('id', params.blocsIds)
      blocsContent = (data ?? []) as BlocBiblio[]
    }

    // Load profil + analyse
    const [{ data: profilData }, analyseData] = await Promise.all([
      supabase.from('profil_entreprise')
        .select('raison_sociale, ca_dernier_exercice, effectif, annees_experience, certifications, domaines, zone_geographique, notes, moyens_humains, moyens_materiels, methodologies')
        .maybeSingle(),
      params.analyseId
        ? supabase.from('analyses').select('resultat').eq('id', params.analyseId).single()
        : Promise.resolve({ data: null }),
    ])

    const profil = profilData as ProfilRow | null
    const resultat = (analyseData as { data: { resultat: unknown } | null }).data?.resultat as AnalyseResultat | null

    const profilBlock = buildProfilBlock(profil)
    const marcheBlock = params.descriptionManuelle
      ? params.descriptionManuelle
      : buildMarcheBlock(resultat, null)

    // Token budget : 2,2 tokens/mot français + 300 de marge, plafonné à 8000 (limite Sonnet)
    const pondVal = parsePonderation(params.sectionPonderation)
    const targetWords = params.targetWords !== undefined
      ? params.targetWords
      : params.isIntro
        ? 200
        : !params.sectionPonderation
          ? 400
          : Math.max(150, Math.round((WORD_TARGETS_TOTAL[params.longueur] ?? 7000) * pondVal / 100))
    const maxT = Math.min(8000, Math.ceil(targetWords * 2.2) + 300)

    const blocsBlock = blocsContent.length > 0
      ? `\nBLOCS DE RÉFÉRENCE DE L'ENTREPRISE (contenu technique réel) :\n${blocsContent.map((b, i) => `[Bloc ${i + 1} — ${b.titre}]\n${b.contenu.slice(0, 1500)}`).join('\n\n')}\n`
      : ''

    const acheteur = resultat?.acheteur ? `\nAcheteur : ${resultat.acheteur}` : ''
    const vigilance = (resultat?.points_de_vigilance ?? []).filter(p => {
      const pt = p.toLowerCase()
      const st = params.sectionTitre.toLowerCase()
      return pt.includes('sécurité') && st.includes('sécurité') ||
             pt.includes('planning') && st.includes('planning') ||
             pt.includes('délai') && (st.includes('planning') || st.includes('délai')) ||
             pt.includes('site occupé') ||
             pt.includes('phasage')
    })

    const userPrompt = `Rédige la section suivante d'un mémoire technique de réponse à appel d'offres.

MARCHÉ :${acheteur}
${marcheBlock}

PROFIL DE L'ENTREPRISE :
${profilBlock}
${blocsBlock}
SECTION À RÉDIGER : ${params.isIntro ? 'INTRODUCTION — PRÉSENTATION DE L\'ENTREPRISE' : params.sectionTitre} ${params.isIntro ? '' : `(${params.sectionPonderation})`}

${vigilance.length > 0 ? `POINTS DE VIGILANCE à adresser dans cette section :\n${vigilance.map(p => `- ${p}`).join('\n')}\n` : ''}
INSTRUCTIONS :
- Commence directement par le titre de la section en majuscules (ex: ## ${params.isIntro ? 'INTRODUCTION — PRÉSENTATION DE L\'ENTREPRISE' : params.sectionTitre.toUpperCase()})
- Utilise les blocs de référence comme BASE de contenu : réécris pour CET appel d'offres spécifique, cite l'acheteur, adapte au contexte. Ne recopie jamais un bloc verbatim.
- N'invente aucun moyen, chiffre ou certification absent des blocs ou du profil. Si une information spécifique manque, écris [À COMPLÉTER : ...].
- Si aucun bloc ne correspond, rédige à partir du profil uniquement et ajoute ⚠ à vérifier en fin de section.
- Cible de longueur : environ ${targetWords} mots${params.sectionPonderation ? `, proportionnel à la pondération ${params.sectionPonderation}` : ''}. ${params.longueur === 'court' ? 'Sois concis et ciblé.' : params.longueur === 'complet' ? 'Développe avec des exemples concrets et des détails.' : 'Équilibre précision et lisibilité.'}
- N'invente jamais la forme juridique ni la raison sociale. Si le profil contient "[À COMPLÉTER : raison sociale]", utilise cette mention exactement, sans la remplacer.
- Style : phrases complètes, ton professionnel de candidature, pas de bullet points excessifs.
- Réponds UNIQUEMENT avec le texte de la section.`

    const firstMsg = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: maxT,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    })

    let text = firstMsg.content[0].type === 'text' ? firstMsg.content[0].text.trim() : ''
    let lastStopReason = firstMsg.stop_reason

    // Continuation si la section a été tronquée (max 2 appels supplémentaires)
    let continueCount = 0
    while (lastStopReason === 'max_tokens' && continueCount < 2) {
      const contMsg = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: Math.min(4000, maxT),
        system: SYSTEM_PROMPT,
        messages: [
          { role: 'user', content: userPrompt },
          { role: 'assistant', content: text },
          { role: 'user', content: 'Continue la rédaction depuis exactement où tu t\'es arrêté. Ne répète rien du texte déjà écrit, continue directement.' },
        ],
      })
      const chunk = contMsg.content[0].type === 'text' ? contMsg.content[0].text : ''
      text += chunk
      lastStopReason = contMsg.stop_reason
      continueCount++
    }

    if (!text) return { error: 'Réponse vide.' }

    const wordCount = text.split(/\s+/).filter(Boolean).length
    return {
      text,
      blocs: blocsContent.map(b => ({ id: b.id, titre: b.titre })),
      wordCount,
    }
  } catch (err) {
    console.error('[genererSectionV2]', err)
    return { error: 'Erreur lors de la génération de la section.' }
  }
}

/** Génère la conclusion */
export async function genererConclusionV2(params: {
  analyseId: string | null
  descriptionManuelle: string | null
  longueur: 'court' | 'standard' | 'complet'
}): Promise<{ text: string } | { error: string }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Non authentifié.' }

    const [{ data: profilData }, analyseData] = await Promise.all([
      supabase.from('profil_entreprise')
        .select('raison_sociale, domaines, certifications')
        .maybeSingle(),
      params.analyseId
        ? supabase.from('analyses').select('resultat').eq('id', params.analyseId).single()
        : Promise.resolve({ data: null }),
    ])

    const profil = profilData as Pick<ProfilRow, 'raison_sociale' | 'domaines' | 'certifications'> | null
    const resultat = (analyseData as { data: { resultat: unknown } | null }).data?.resultat as AnalyseResultat | null

    const acheteur = resultat?.acheteur ?? '[acheteur]'
    const raisonSociale = profil?.raison_sociale ?? '[entreprise]'

    const prompt = `Rédige la conclusion d'un mémoire technique de réponse à un appel d'offres.

Acheteur : ${acheteur}
Entreprise : ${raisonSociale}

Commence par : ## CONCLUSION — NOS ENGAGEMENTS
Contraintes strictes :
- 100-120 mots maximum. Un seul paragraphe.
- Cite 2-3 engagements concrets : délais, disponibilité, interlocuteur dédié, garanties qualité ou sécurité.
- Interdit : "nous mettons tout en œuvre", "fort de notre expérience", "partenaire de confiance", "équipe dédiée", "à votre disposition".
- Si la raison sociale est "[À COMPLÉTER : raison sociale]", conserve cette mention telle quelle.
- Style professionnel et direct, sans superlatifs.
Réponds UNIQUEMENT avec le texte de la conclusion.`

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text.trim() : ''
    return text ? { text } : { error: 'Réponse vide.' }
  } catch (err) {
    console.error('[genererConclusionV2]', err)
    return { error: 'Erreur conclusion.' }
  }
}
