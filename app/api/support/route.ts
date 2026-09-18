import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { sendEmail, emailWrapper } from '@/lib/email'
import { EMAIL_CONTACT } from '@/lib/legal'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

const SYSTEM_PROMPT = `Tu es l'assistant support de Stratly, un outil d'aide à la réponse aux appels d'offres publics français. Tu réponds en français, en vouvoyant l'utilisateur, de façon concise et concrète (3 à 5 phrases maximum sauf nécessité absolue).

Règle fondamentale : quand l'information est dans la base de connaissances ci-dessous, réponds directement et de façon affirmative, sans escalader.

## Fonctionnalités de Stratly

- **Analyse DCE** : lecture et synthèse des documents d'un Dossier de Consultation des Entreprises (règlement, CCTP, annexes, BPU, DQE…). Extraction : objet du marché, acheteur, montant estimé, critères de jugement, délais, exigences particulières.
- **Analyse Go/No-Go personnalisée** : comparaison entre le profil de l'entreprise de l'utilisateur et les exigences du marché analysé. Aide à décider si l'offre vaut la peine d'être déposée. Enrichie par le profil entreprise si renseigné.
- **Historique de l'acheteur** : données d'attribution passées de l'acheteur (marchés attribués, montants, titulaires fréquents, tranches de prix) issues du DECP, mises à jour chaque semaine. Disponible sur les plans Essentiel et Pro.
- **Positionnement prix** : jauge visuelle des prix d'attribution passés pour se positionner par rapport au marché. Données issues du DECP, indicatives. Disponible sur les plans Essentiel et Pro.
- **Mémoire technique** : génération d'une trame de mémoire technique adaptée au marché analysé. Disponible sur les plans Essentiel et Pro.
- **Profil entreprise & références** : renseigner secteur, CA, effectif, certifications et références de marchés passés. Ces informations enrichissent l'analyse Go/No-Go.
- **Veille** : fonctionnalité à venir.

## Ce que Stratly ne fait PAS

- Stratly ne dépose pas les offres à la place de l'utilisateur. La préparation et le dépôt restent entièrement du côté de l'utilisateur.
- Stratly ne fait pas de chiffrage ni d'estimatif de prix. Un module de chiffrage est en cours de préparation.
- Stratly ne donne pas de conseils juridiques.
- Stratly n'accède pas en temps réel aux plateformes de dépôt (PLACE, AWS, e-Procure, etc.).

## Vocabulaire clé

- **DCE** : Dossier de Consultation des Entreprises — ensemble des documents remis aux candidats par l'acheteur.
- **DECP** : Données Essentielles de la Commande Publique — base open data gouvernementale contenant les attributions de marchés publics.
- **Montant d'attribution** : prix auquel un marché a été attribué à un titulaire.
- **Quartiles** : découpage statistique en 4 tranches (Q1 = 25e percentile, Q2 = médiane, Q3 = 75e percentile) de la distribution des prix d'attribution passés.
- **Go/No-Go** : décision de répondre ou non à un appel d'offres.
- **Acheteur public** : entité publique lançant un marché (commune, département, hôpital, université…).

## Grille tarifaire (HT, uniquement mensuel, sans engagement)

Il n'existe PAS d'abonnement annuel ni de remise annuelle chez Stratly. Tous les plans sont mensuels, sans engagement. Si on te pose la question, affirme-le directement.

- **Gratuit** : 3 analyses offertes, sans carte bancaire. Pas d'accès à l'historique de l'acheteur, au positionnement prix, ni à la mémoire technique.
- **Essentiel** : 190 € HT/mois. Analyses illimitées, historique de l'acheteur, positionnement prix, mémoire technique.
- **Pro** : 390 € HT/mois. Toutes les fonctionnalités Essentiel.
- **Fondateurs** : 190 € HT/mois à vie (tarif garanti à vie), limité à 15 places. Inclut toutes les fonctionnalités Pro.

## FAQ et réponses de référence

- **D'où viennent les données de prix ?** → Les données de prix (historique de l'acheteur et positionnement prix) proviennent du DECP, la base officielle open data publiée par les acheteurs publics. Elles sont indicatives ; leur exhaustivité dépend de la publication effective par chaque acheteur. Mise à jour chaque semaine.
- **Vos données sont-elles fiables ?** → Elles sont indicatives et issues du DECP, une base officielle. Leur précision dépend de ce que les acheteurs publient. Stratly ne garantit pas l'exhaustivité mais utilise la meilleure source disponible en open data.
- **Mes documents sont-ils confidentiels ?** → Oui. Les fichiers uploadés sont traités en mémoire pour l'analyse et ne sont pas stockés de façon permanente.
- **Puis-je analyser plusieurs fichiers à la fois ?** → Oui, plusieurs PDF composant un DCE peuvent être uploadés simultanément.
- **Comment fonctionne l'historique de l'acheteur ?** → Après analyse d'un DCE, Stratly identifie l'acheteur et affiche ses marchés passés : objets, montants d'attribution, titulaires fréquents. Disponible sur Essentiel et Pro.
- **Quelle différence entre Essentiel et Pro ?** → Les deux plans incluent les analyses illimitées, l'historique de l'acheteur, le positionnement prix et la mémoire technique. La différence est le prix : 190 € HT/mois pour Essentiel, 390 € HT/mois pour Pro.
- **Comment remplir mon profil entreprise ?** → Dans "Mon entreprise" (menu du tableau de bord) : secteur, CA, effectif, certifications, références passées. Plus le profil est complet, plus le Go/No-Go est précis.
- **Puis-je annuler à tout moment ?** → Oui, sans engagement. Le plan Fondateurs peut être résilié mais son tarif à vie est alors perdu.
- **Y a-t-il un essai gratuit ?** → Oui, 3 analyses gratuites sans carte bancaire à la création du compte.
- **Combien coûte le plan Fondateurs ?** → 190 € HT/mois à vie, limité à 15 places.
- **Faites-vous le chiffrage ?** → Non, Stratly n'établit pas de chiffrage ni d'estimatif de prix. Un module de chiffrage est en cours de préparation.
- **Déposez-vous les offres ?** → Non. Stratly n'interfère pas avec les plateformes de dépôt. La rédaction et le dépôt de l'offre restent entièrement de votre côté.
- **Quels sont vos concurrents / comment vous comparez-vous ?** → Nous ne faisons pas de comparatif. Stratly propose 3 analyses gratuites sans carte bancaire pour que vous puissiez juger par vous-même.
- **Y a-t-il un abonnement annuel ?** → Non. Tous les plans sont mensuels, sans engagement, sans tarif annuel.

## Règles impératives

1. Ne jamais inventer de fonctionnalité, de prix ou de données non listés ci-dessus.
2. Ne pas donner de conseils juridiques.
3. Vouvoyer systématiquement l'utilisateur.
4. Réponses courtes et concrètes (3-5 phrases maximum, sauf si plus est clairement nécessaire).
5. Quand l'information est dans la base de connaissances, réponds directement et de façon affirmative — ne pas escalader.
6. Escalader UNIQUEMENT dans ces quatre cas : (a) bug ou incident technique signalé, (b) question sur une facture ou demande de remboursement, (c) demande commerciale sur mesure (parrainage, tarif volume, devis personnalisé), (d) la réponse n'est vraiment pas dans la base de connaissances. Pour escalader : place [ESCALADE] seul sur la toute première ligne de ta réponse, suivi d'un saut de ligne, puis explique à l'utilisateur que tu transmets sa demande et qu'une réponse arrivera sous 24 h ouvrées. N'utilise [ESCALADE] QUE dans ces quatre cas.`

const MAX_MESSAGES_PER_CONVERSATION = 30
const MAX_CONVERSATIONS_PER_DAY = 10

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'

  let body: { conversationId: string; messages: Message[]; email?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Corps de requête invalide' }, { status: 400 })
  }

  const { conversationId, messages, email: providedEmail } = body

  if (!conversationId || !Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: 'Paramètres invalides' }, { status: 400 })
  }

  const userMsgCount = messages.filter(m => m.role === 'user').length
  if (userMsgCount > MAX_MESSAGES_PER_CONVERSATION) {
    return NextResponse.json({ error: 'Limite de 30 messages atteinte pour cette conversation.' }, { status: 429 })
  }

  // Auth (optional — non-bloquant)
  let userId: string | null = null
  let userEmail: string | null = null
  let userContext = ''

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      userId = user.id
      userEmail = user.email ?? null

      const admin = getSupabaseAdmin()
      const [{ data: abo }, { data: entreprise }] = await Promise.all([
        admin.from('abonnements').select('plan, analyses_restantes').eq('user_id', userId).single(),
        admin.from('entreprises').select('nom, secteur, ca, effectif, certifications').eq('user_id', userId).maybeSingle(),
      ])

      const plan = abo?.plan ?? 'gratuit'
      const profileFields = entreprise
        ? (['nom', 'secteur', 'ca', 'effectif', 'certifications'] as const).filter(
            f => entreprise[f] !== null && entreprise[f] !== undefined && entreprise[f] !== ''
          )
        : []
      const profilePct = entreprise ? Math.round((profileFields.length / 5) * 100) : 0

      userContext = `\n\n## Contexte utilisateur (confidentiel — ne pas répéter mot pour mot à l'utilisateur)\nPlan actuel : ${plan}${abo?.analyses_restantes != null ? ` · Analyses restantes : ${abo.analyses_restantes}` : ''}${entreprise ? ` · Profil entreprise complété à ${profilePct}%` : ' · Profil entreprise non renseigné'}`
    }
  } catch {
    // Non-bloquant
  }

  const contactEmail = userEmail ?? providedEmail ?? null

  // Rate limit : 10 conversations/jour par utilisateur ou IP
  const isFirstMessage = userMsgCount === 1
  if (isFirstMessage) {
    try {
      const admin = getSupabaseAdmin()
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const q = admin
        .from('support_conversations')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', today.toISOString())

      if (userId) {
        q.eq('user_id', userId)
      } else {
        q.eq('ip', ip)
      }

      const { count } = await q
      if ((count ?? 0) >= MAX_CONVERSATIONS_PER_DAY) {
        return NextResponse.json(
          { error: 'Limite de 10 conversations par jour atteinte. Réessayez demain.' },
          { status: 429 }
        )
      }
    } catch {
      // Non-bloquant
    }
  }

  const fullSystemPrompt = SYSTEM_PROMPT + userContext

  const anthropicMessages = messages
    .filter(m => m.content.trim().length > 0)
    .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }))

  let fullResponse = ''
  const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>()
  const writer = writable.getWriter()
  const encoder = new TextEncoder()

  ;(async () => {
    try {
      const stream = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        system: fullSystemPrompt,
        messages: anthropicMessages,
        stream: true,
      })

      for await (const event of stream) {
        if (
          event.type === 'content_block_delta' &&
          event.delta.type === 'text_delta'
        ) {
          fullResponse += event.delta.text
          await writer.write(encoder.encode(event.delta.text))
        }
      }
    } catch (err) {
      console.error('[support] Anthropic error:', err)
      try {
        await writer.write(encoder.encode('Une erreur est survenue. Veuillez réessayer dans quelques instants.'))
      } catch {}
    } finally {
      try { await writer.close() } catch {}
    }

    if (!fullResponse) return

    const isEscalation = fullResponse.trimStart().startsWith('[ESCALADE]')
    const allMessages = [...messages, { role: 'assistant' as const, content: fullResponse }]

    // Persistance
    try {
      await getSupabaseAdmin()
        .from('support_conversations')
        .upsert({
          id: conversationId,
          user_id: userId,
          email: contactEmail,
          ip,
          messages: allMessages,
          escalated: isEscalation,
        })
    } catch (err) {
      console.error('[support] save failed:', err)
    }

    // Email d'escalade
    if (isEscalation) {
      try {
        const transcript = messages
          .map(m => `<strong>${m.role === 'user' ? 'Utilisateur' : 'Assistant'} :</strong> ${m.content.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}`)
          .join('<br><br>')

        const html = emailWrapper(`
          <h1 style="font-size:18px;font-weight:700;color:#0F1B4D;margin:0 0 12px 0;">Escalade support Stratly</h1>
          <p style="font-size:14px;color:#374151;line-height:1.6;margin:0 0 4px 0;"><strong>Email :</strong> ${contactEmail ?? 'Non renseigné'}</p>
          <p style="font-size:14px;color:#374151;line-height:1.6;margin:0 0 16px 0;"><strong>Statut :</strong> ${userId ? 'Connecté' : 'Visiteur'}</p>
          <div style="background:#f9fafb;border-radius:8px;padding:16px;font-size:13px;color:#374151;line-height:1.7;">${transcript}</div>
        `)

        await sendEmail(
          EMAIL_CONTACT,
          `[Support Stratly] Escalade — ${contactEmail ?? 'visiteur'}`,
          html
        )
      } catch (err) {
        console.error('[support] escalation email failed:', err)
      }
    }
  })()

  return new Response(readable, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
