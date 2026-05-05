import { NextRequest, NextResponse } from 'next/server'
import { anthropic } from '@/lib/anthropic'

const SYSTEM_PROMPT = `Tu es un CMO expert en B2B SaaS avec 10 ans d'expérience.
Tu dois répondre UNIQUEMENT avec un objet JSON valide, sans markdown autour, sans backticks, sans commentaires.
La structure doit être exactement :
{
  "linkedin_posts": "...",
  "onboarding_emails": "...",
  "prospection_script": "...",
  "influenceur_messages": "...",
  "analyse_strategique": "..."
}
Chaque valeur est une chaîne de texte (avec sauts de ligne \\n si besoin). Aucun autre champ. Aucun texte avant ou après le JSON.`

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { productName, targetClient, growthStage, currentMRR, targetMRR } = body

    if (!productName || !targetClient || !growthStage) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const stageLabels: Record<string, string> = {
      '0': '0 client (pré-lancement)',
      '1-10': '1 à 10 clients (early stage)',
      '10+': 'plus de 10 clients (croissance)',
    }

    const prompt = `Tu aides ${productName}, un produit qui cible ${targetClient}, au stade ${stageLabels[growthStage] || growthStage} avec un MRR de ${currentMRR || '0'}€ et un objectif de ${targetMRR || '?'}€.

Génère les 5 livrables suivants et retourne-les dans le JSON demandé :

linkedin_posts : 5 posts LinkedIn prêts à publier, chacun avec un hook fort, du contenu de valeur, et un call-to-action. Formats distincts (storytelling, data, opinion, how-to, behind-the-scenes). Numéroter 1/ à 5/.

onboarding_emails : Séquence de 3 emails d'onboarding (Jour 0, Jour 3, Jour 7). Chaque email : Objet / Corps / CTA. Ton direct, personnalisé, axé valeur.

prospection_script : Script de prospection téléphonique complet — accroche (30 sec), qualification (3 questions), pitch valeur (2 min), gestion des 2 objections principales, closing. Format conversationnel.

influenceur_messages : 3 messages d'approche influenceurs/partenaires en styles différents (directe, valeur d'abord, collaboration), adaptés à la cible ${targetClient}.

analyse_strategique : Analyse stratégique — 3 priorités d'acquisition immédiates, 2 risques à surveiller, 1 quick win à activer cette semaine, KPI à suivre.

Sois précis, concret, actionnable. Adapte tout au contexte exact de ${productName}.`

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4000,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: prompt }],
    })

    const content = message.content[0].type === 'text' ? message.content[0].text : ''

    console.log('[CMO] Raw Claude response:', content)

    let parsed: Record<string, string>
    try {
      parsed = JSON.parse(content)
    } catch (parseError) {
      console.error('[CMO] JSON.parse failed:', parseError)
      console.error('[CMO] Content was:', content)
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

