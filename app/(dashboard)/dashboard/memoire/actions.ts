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
}

type AnalyseResultat = {
  objet?: string
  type_procedure?: string
  acheteur?: string
  lots?: { numero: string; designation: string }[]
  criteres_notation?: { critere: string; ponderation: string }[]
  points_de_vigilance?: string[]
}

const SYSTEM_PROMPT = `Tu es un expert en réponse aux marchés publics français, spécialisé dans la rédaction de mémoires techniques.
Tu génères des TRAMES de mémoires techniques — des bases de travail structurées et pré-remplies, pas des documents finaux.
L'objectif est d'éliminer la page blanche et de guider l'entreprise dans sa rédaction.
Tu réponds UNIQUEMENT avec le texte de la trame, sans commentaire, sans markdown entourant le document.`

function buildProfilBlock(profil: ProfilRow | null): string {
  if (!profil) return 'Profil non renseigné — utiliser des formulations génériques.'
  return [
    profil.raison_sociale ? `Raison sociale : ${profil.raison_sociale}` : null,
    profil.domaines?.length ? `Domaines d'activité : ${profil.domaines.join(', ')}` : null,
    profil.effectif != null ? `Effectif : ${profil.effectif} personne(s)` : null,
    profil.annees_experience != null ? `Années d'expérience : ${profil.annees_experience} ans` : null,
    profil.ca_dernier_exercice != null ? `CA : ${profil.ca_dernier_exercice.toLocaleString('fr-FR')} €` : null,
    profil.certifications?.length ? `Certifications : ${profil.certifications.join(', ')}` : null,
    profil.zone_geographique ? `Zone géographique : ${profil.zone_geographique}` : null,
  ].filter(Boolean).join('\n')
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
  if (resultat.criteres_notation?.length) {
    const criteres = resultat.criteres_notation.map(c => `${c.critere} (${c.ponderation})`).join(', ')
    lines.push(`Critères de notation : ${criteres}`)
  }
  if (resultat.points_de_vigilance?.length) {
    lines.push(`Points de vigilance : ${resultat.points_de_vigilance.slice(0, 3).join(' / ')}`)
  }
  return lines.join('\n')
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

    // Load profil entreprise
    const { data: profilData } = await supabase
      .from('profil_entreprise')
      .select('raison_sociale, ca_dernier_exercice, effectif, annees_experience, certifications, domaines, zone_geographique')
      .maybeSingle()
    const profil = profilData as ProfilRow | null

    // Load analyse if selected
    let resultat: AnalyseResultat | null = null
    if (analyseId) {
      const { data: analyse } = await supabase
        .from('analyses')
        .select('objet_marche, resultat')
        .eq('id', analyseId)
        .single()
      if (analyse?.resultat) {
        resultat = analyse.resultat as AnalyseResultat
      }
    }

    const profilBlock = buildProfilBlock(profil)
    const marcheBlock = buildMarcheBlock(resultat, descriptionManuelle)

    const prompt = `Génère une trame de mémoire technique pour le marché ci-dessous, adaptée au profil de l'entreprise.

PROFIL DE L'ENTREPRISE :
${profilBlock}

MARCHÉ :
${marcheBlock}

INSTRUCTIONS DE GÉNÉRATION :
- Commence le document par : "TRAME DE MÉMOIRE TECHNIQUE"
- Puis une ligne vide, puis : "⚠ Document de travail — Complétez les passages [À COMPLÉTER : ...] avec vos informations réelles avant envoi."
- Puis une ligne vide, puis les 8 sections numérotées
- Chaque section : titre en MAJUSCULES précédé du numéro, puis le contenu sur les lignes suivantes
- Chaque section doit faire 2 à 4 paragraphes bien rédigés, professionnels, adaptés au type de marché
- Utilise [À COMPLÉTER : description précise de ce qu'il faut insérer] pour : références de projets similaires, noms de collaborateurs, certifications avec numéro, dates, montants, équipements spécifiques
- Dans la section 1 (Présentation), utilise directement les données du profil si disponibles
- Dans la section 2 (Compréhension), reformule les enjeux du marché de façon professionnelle
- Dans les sections 3 à 8, adapte le contenu au type de prestation détecté dans la description du marché
- Ton professionnel, phrases complètes, sans bullet points excessifs — c'est un document de candidature
- IMPORTANT : tu dois impérativement générer les 8 sections en intégralité, jusqu'à la dernière. Ne t'arrête pas avant d'avoir complètement terminé la section 8.

Sections à inclure (toutes obligatoires, dans cet ordre) :
1. PRÉSENTATION DE L'ENTREPRISE
2. COMPRÉHENSION DU BESOIN ET DES ENJEUX DU MARCHÉ
3. MÉTHODOLOGIE D'INTERVENTION ET ORGANISATION DE LA PRESTATION
4. MOYENS HUMAINS ET COMPÉTENCES DE L'ÉQUIPE AFFECTÉE
5. MOYENS MATÉRIELS ET TECHNIQUES
6. PLANNING PRÉVISIONNEL ET GESTION DES DÉLAIS
7. DÉMARCHE QUALITÉ, HYGIÈNE ET SÉCURITÉ
8. ENGAGEMENTS ENVIRONNEMENTAUX ET DÉVELOPPEMENT DURABLE`

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 8192,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: prompt }],
    })

    let trame = message.content[0].type === 'text' ? message.content[0].text : ''
    if (!trame.trim()) return { error: 'Réponse vide du modèle. Réessaie.' }

    // Safety net: if Claude hit the token limit, append a visible warning
    if (message.stop_reason === 'max_tokens') {
      trame += '\n\n⚠ GÉNÉRATION INCOMPLÈTE — La trame a été tronquée (limite de tokens atteinte). Régénérez pour obtenir le document complet.'
    }

    return { trame }
  } catch (err) {
    console.error('[genererMemoire]', err)
    return { error: "Erreur lors de la génération. Vérifie ta connexion et réessaie." }
  }
}
