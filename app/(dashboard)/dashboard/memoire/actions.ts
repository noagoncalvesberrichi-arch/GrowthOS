'use server'

import { anthropic } from '@/lib/anthropic'
import { createClient } from '@/lib/supabase/server'

export type MemoireResult = { trame: string } | { error: string }

type ProfilRow = {
  raison_sociale: string | null
  ca_dernier_exercice: number | null
  effectif: number | null
  annees_experience: number | null
  certifications: string[] | null
  domaines: string[] | null
  zone_geographique: string | null
  notes: string | null
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
    profil.raison_sociale ? `Raison sociale : ${profil.raison_sociale}` : null,
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

function buildPrompt(
  profilBlock: string,
  marcheBlock: string,
  resultat: AnalyseResultat | null
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
    "- IMPORTANT : génère le document en intégralité jusqu'à la dernière section, sans t'arrêter."
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
  descriptionManuelle: string | null
): Promise<MemoireResult> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Non authentifié.' }

    if (!analyseId && (!descriptionManuelle || descriptionManuelle.trim().length < 20)) {
      return { error: 'Décrivez le marché (au moins 20 caractères) ou sélectionnez une analyse.' }
    }

    const { data: profilData } = await supabase
      .from('profil_entreprise')
      .select('raison_sociale, ca_dernier_exercice, effectif, annees_experience, certifications, domaines, zone_geographique, notes')
      .maybeSingle()
    const profil = profilData as ProfilRow | null

    let resultat: AnalyseResultat | null = null
    if (analyseId) {
      const { data: analyse } = await supabase
        .from('analyses')
        .select('resultat')
        .eq('id', analyseId)
        .single()
      if (analyse?.resultat) resultat = analyse.resultat as AnalyseResultat
    }

    const profilBlock = buildProfilBlock(profil)
    const marcheBlock = buildMarcheBlock(resultat, descriptionManuelle)
    const prompt = buildPrompt(profilBlock, marcheBlock, resultat)

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 8192,
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
    return { error: "Erreur lors de la génération. Vérifie ta connexion et réessaie." }
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
