import { NextRequest, NextResponse } from 'next/server'
import { anthropic } from '@/lib/anthropic'

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

    const prompt = `Tu es un CMO expert en B2B SaaS avec 10 ans d'expérience. Tu aides ${productName}, un produit qui cible ${targetClient}, actuellement au stade ${stageLabels[growthStage] || growthStage} avec un MRR de ${currentMRR || '0'}€ et un objectif de ${targetMRR || '?'}€.

Génère exactement les livrables suivants, formatés en markdown, séparés par des délimiteurs clairs :

---LINKEDIN_POSTS---
Génère 5 posts LinkedIn prêts à publier, chacun avec un hook fort, du contenu de valeur, et un call-to-action. Chaque post doit être distinct en format (storytelling, data, opinion, how-to, behind-the-scenes). Numéroter 1/ à 5/.

---ONBOARDING_EMAILS---
Génère une séquence de 3 emails d'onboarding (Jour 0, Jour 3, Jour 7). Chaque email : Objet / Corps / CTA. Ton direct, personnalisé, axé valeur.

---PROSPECTION_SCRIPT---
Génère 1 script de prospection téléphonique complet : accroche (30 sec), qualification (3 questions), pitch valeur (2 min), gestion des 2 objections principales, closing. Format conversationnel.

---INFLUENCEUR_MESSAGES---
Génère 3 messages d'approche influenceurs/partenaires différents en style (directe, valeur d'abord, collaboration), adaptés à la cible ${targetClient}.

---ANALYSE_STRATEGIQUE---
Génère 1 analyse stratégique de la semaine : 3 priorités d'acquisition immédiates, 2 risques à surveiller, 1 quick win à activer cette semaine, KPI à suivre.

Sois précis, concret, actionnable. Évite les généralités. Adapte tout au contexte exact de ${productName}.`

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }],
    })

    const content = message.content[0].type === 'text' ? message.content[0].text : ''

    const sections: Record<string, string> = {}
    const delimiters = [
      'LINKEDIN_POSTS',
      'ONBOARDING_EMAILS',
      'PROSPECTION_SCRIPT',
      'INFLUENCEUR_MESSAGES',
      'ANALYSE_STRATEGIQUE',
    ]

    delimiters.forEach((key, i) => {
      const startMarker = `---${key}---`
      const nextKey = delimiters[i + 1]
      const endMarker = nextKey ? `---${nextKey}---` : null

      const startIdx = content.indexOf(startMarker)
      if (startIdx === -1) return

      const afterStart = content.slice(startIdx + startMarker.length).trim()
      const endIdx = endMarker ? afterStart.indexOf(endMarker) : -1
      sections[key] = endIdx !== -1 ? afterStart.slice(0, endIdx).trim() : afterStart.trim()
    })

    return NextResponse.json({ sections })
  } catch (error) {
    console.error('CMO generation error:', error)
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 })
  }
}
