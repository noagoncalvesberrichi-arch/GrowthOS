import { NextRequest, NextResponse } from 'next/server'
import { anthropic } from '@/lib/anthropic'

const SYSTEM_PROMPT = `Tu es un CMO expert qui adapte ses recommandations au type exact de business du client. Tu maîtrises les spécificités de chaque modèle : SaaS B2B (cycle de vente long, MRR), SaaS B2C (acquisition volume, conversion freemium), E-commerce (panier moyen, LTV, ROAS), Service/Agence (prospection directe, pricing à la mission), Créateur/Média (audience, monétisation, communauté).

Tu adaptes ton vocabulaire, tes recommandations, et tes exemples au contexte exact donné. JAMAIS de conseils génériques.

CONTRAINTES STRICTES :
- N'invente JAMAIS de chiffres, statistiques, pourcentages que tu ne peux pas justifier (pas de "47% des SaaS", "j'ai analysé 20 fondateurs", etc.)
- N'invente JAMAIS de features, ressources, sessions, ebooks, ou outils qui ne sont pas explicitement décrits par l'utilisateur
- Pour les CTA dans les emails : limite-toi à des actions simples (répondre à l'email, accéder au produit, visiter la landing page)
- Si tu mentionnes un asset (ressource, étude, témoignage), il doit pouvoir être créé facilement par l'utilisateur lui-même

Tu dois répondre UNIQUEMENT avec un objet JSON valide, sans markdown autour, sans backticks, sans commentaires.

La structure exacte :
{
  "linkedin_posts": "...",
  "onboarding_emails": "...",
  "prospection_script": "...",
  "influenceur_messages": "...",
  "analyse_strategique": "..."
}

Sois concis et efficace. Chaque livrable doit être complet mais pas verbeux.
Posts LinkedIn : 150-200 mots max chacun.
Emails : 200 mots max chacun.
Script : structuré, sans répétitions.
Messages influenceurs : 100 mots max.
Analyse : 300 mots max.`

const projectTypeLabels: Record<string, string> = {
  saas_b2b: 'SaaS B2B',
  saas_b2c: 'SaaS B2C',
  ecommerce: 'E-commerce / DTC',
  service: 'Service / Agence / Freelance',
  createur: 'Créateur / Média',
  autre: 'Autre',
}

const goalLabels: Record<string, string> = {
  acquerir: 'acquérir de nouveaux clients',
  fideliser: 'fidéliser les clients existants',
  lancer: 'lancer un nouveau produit',
  audience: 'construire une audience',
}

const stageLabels: Record<string, string> = {
  '0': '0 client (pré-lancement)',
  '1-10': '1 à 10 clients (early stage)',
  '10+': 'plus de 10 clients (croissance)',
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      projectType,
      projectDescription,
      mainGoal,
      productName,
      targetClient,
      growthStage,
      currentMRR,
      targetMRR,
    } = body

    if (!projectType || !projectDescription || !mainGoal || !productName || !targetClient || !growthStage) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const prompt = `CONTEXTE DU PROJET :
- Type : ${projectTypeLabels[projectType] || projectType}
- Description : ${projectDescription}
- Nom : ${productName}
- Cible client : ${targetClient}
- Stade : ${stageLabels[growthStage] || growthStage}
- MRR actuel : ${currentMRR || '0'}€
- Objectif MRR : ${targetMRR || '?'}€
- Objectif principal : ${goalLabels[mainGoal] || mainGoal}

Génère 5 livrables marketing parfaitement adaptés à ce contexte exact.
Adapte ton vocabulaire et tes recommandations au type de projet.
Pour un e-commerce, parle de panier moyen et conversion. Pour un créateur, parle d'audience et monétisation. Pour un SaaS B2B, parle de MRR et churn. Pour un service, parle de leads qualifiés et taux de closing.

Retourne dans le JSON :

linkedin_posts : 5 posts LinkedIn prêts à publier, adaptés au type de projet, chacun avec un hook fort, du contenu de valeur, et un CTA. Formats distincts (storytelling, data, opinion, how-to, behind-the-scenes). Numéroter 1/ à 5/.

onboarding_emails : Séquence de 3 emails d'onboarding (Jour 0, Jour 3, Jour 7). Chaque email : Objet / Corps / CTA simple. Ton direct, personnalisé, axé valeur. Adapte le ton au type de projet.

prospection_script : Script de prospection complet adapté au canal le plus pertinent pour ce type de projet (téléphone pour B2B, DM/email pour B2C, LinkedIn pour service). Accroche / qualification / pitch / 2 objections / closing.

influenceur_messages : 3 messages d'approche partenaires en styles différents (directe, valeur d'abord, collaboration), adaptés à la cible ${targetClient}. La proposition doit être réaliste pour le stade actuel.

analyse_strategique : Analyse stratégique — 3 priorités d'acquisition adaptées au type de projet, 2 risques à surveiller, 1 quick win réalisable cette semaine, KPI à suivre adaptés au modèle.

Sois précis, concret, actionnable. Adapte tout au contexte exact de ${productName}.`

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 16000,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: prompt }],
    })

    if (message.stop_reason === 'max_tokens') {
      console.error('[CMO] Response truncated at max_tokens limit')
      return NextResponse.json({ error: 'Response truncated, increase max_tokens' }, { status: 500 })
    }

    const content = message.content[0].type === 'text' ? message.content[0].text : ''

    console.log('[CMO] stop_reason:', message.stop_reason)
    console.log('[CMO] Raw Claude response:', content)

    const firstBrace = content.indexOf('{')
    const lastBrace = content.lastIndexOf('}')
    const cleaned = firstBrace !== -1 && lastBrace !== -1
      ? content.slice(firstBrace, lastBrace + 1).trim()
      : content.trim()

    console.log('[CMO] Cleaned content:', cleaned)

    let parsed: Record<string, string>
    try {
      parsed = JSON.parse(cleaned)
    } catch (parseError) {
      console.error('[CMO] JSON.parse failed:', parseError)
      console.error('[CMO] Raw content was:', content)
      console.error('[CMO] Cleaned content was:', cleaned)
      return NextResponse.json({ error: 'Invalid JSON from model' }, { status: 500 })
    }

    const expectedKeys = [
      'linkedin_posts',
      'onboarding_emails',
      'prospection_script',
      'influenceur_messages',
      'analyse_strategique',
    ]

    const sections: Record<string, string> = {}
    for (const key of expectedKeys) {
      if (!parsed[key]) {
        console.warn(`[CMO] Section "${key}" not found in response`)
      }
      sections[key] = parsed[key] ?? ''
    }

    return NextResponse.json({
      sections: {
        LINKEDIN_POSTS: sections.linkedin_posts,
        ONBOARDING_EMAILS: sections.onboarding_emails,
        PROSPECTION_SCRIPT: sections.prospection_script,
        INFLUENCEUR_MESSAGES: sections.influenceur_messages,
        ANALYSE_STRATEGIQUE: sections.analyse_strategique,
      },
    })
  } catch (error) {
    console.error('[CMO] Generation error:', error)
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 })
  }
}
