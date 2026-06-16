import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import { supabaseAdmin } from '@/lib/supabase/admin'

// ─── Resend helper (fetch natif, aucune dépendance) ───────────────────────────

async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: 'Stratly <noreply@stratly.fr>', to, subject, html }),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Resend ${res.status}: ${text.slice(0, 200)}`)
  }
}

// ─── HTML templates ───────────────────────────────────────────────────────────

function emailWrapper(content: string): string {
  return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f8fafc;font-family:'Helvetica Neue',Arial,sans-serif;">
<div style="max-width:520px;margin:40px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 8px rgba(0,0,0,0.08);">
  <div style="background:#0F1B4D;padding:28px 32px;">
    <span style="font-size:20px;font-weight:700;color:#ffffff;letter-spacing:-0.02em;">Stratly</span>
  </div>
  <div style="padding:32px;">${content}</div>
  <div style="padding:20px 32px;border-top:1px solid #e5e7eb;">
    <p style="font-size:12px;color:#9ca3af;margin:0;">Stratly &middot; La plateforme des entreprises qui r&eacute;pondent aux march&eacute;s publics.</p>
  </div>
</div></body></html>`
}

const HTML_CONFIRMATION = emailWrapper(`
  <h1 style="font-size:20px;font-weight:700;color:#0F1B4D;margin:0 0 12px 0;">Votre abonnement Pro est actif</h1>
  <p style="font-size:14px;color:#374151;line-height:1.6;margin:0 0 16px 0;">
    Bienvenue dans Stratly Pro. Votre abonnement est confirm&eacute; et toutes les fonctionnalit&eacute;s sont maintenant disponibles&nbsp;:
  </p>
  <ul style="font-size:14px;color:#374151;line-height:2.2;margin:0 0 24px 0;padding-left:20px;">
    <li>Analyses d&apos;appels d&apos;offres illimit&eacute;es</li>
    <li>G&eacute;n&eacute;ration de trame de m&eacute;moire technique</li>
    <li>Pr&eacute;-qualification IA des appels d&apos;offres BOAMP</li>
    <li>Veille march&eacute;s personnalis&eacute;e selon votre profil</li>
  </ul>
  <a href="https://stratly.fr/dashboard" style="display:inline-block;background:#2563EB;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 24px;border-radius:8px;">
    Acc&eacute;der &agrave; mon tableau de bord &rarr;
  </a>
`)

const HTML_RESILIATION = emailWrapper(`
  <h1 style="font-size:20px;font-weight:700;color:#0F1B4D;margin:0 0 12px 0;">Votre abonnement a &eacute;t&eacute; r&eacute;sili&eacute;</h1>
  <p style="font-size:14px;color:#374151;line-height:1.6;margin:0 0 16px 0;">
    Nous avons bien pris en compte la r&eacute;siliation de votre abonnement Stratly Pro. L&apos;acc&egrave;s aux fonctionnalit&eacute;s Pro est maintenant termin&eacute;.
  </p>
  <p style="font-size:14px;color:#374151;line-height:1.6;margin:0 0 16px 0;">
    Votre compte reste actif en version gratuite &mdash; vous pouvez continuer &agrave; utiliser Stratly avec les fonctionnalit&eacute;s de base.
  </p>
  <p style="font-size:14px;color:#374151;line-height:1.6;margin:0 0 24px 0;">
    Si vous souhaitez revenir &agrave; Pro &agrave; tout moment, la porte est ouverte.
  </p>
  <a href="https://stratly.fr/pricing" style="display:inline-block;background:#2563EB;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 24px;border-radius:8px;">
    Voir les offres &rarr;
  </a>
`)

// ─── Webhook handler ──────────────────────────────────────────────────────────

export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature') ?? ''

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('[webhook] signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {

      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.client_reference_id
        if (!userId) {
          console.error('[webhook] checkout.session.completed: client_reference_id manquant')
          break
        }

        const { error } = await supabaseAdmin
          .from('abonnements')
          .update({
            plan: 'pro',
            statut_paiement: 'active',
            stripe_subscription_id: session.subscription as string | null,
            stripe_customer_id: session.customer as string | null,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId)

        if (error) {
          console.error('[webhook] checkout.session.completed update failed:', error)
        } else {
          console.log('[webhook] user passé en Pro:', userId)

          // Email de confirmation — échec non bloquant
          const email = session.customer_details?.email ?? session.customer_email ?? null
          if (email) {
            try {
              await sendEmail(email, 'Votre abonnement Stratly Pro est actif', HTML_CONFIRMATION)
              console.log('[webhook] email confirmation envoyé:', email)
            } catch (emailErr) {
              console.error('[webhook] email confirmation failed (non-bloquant):', emailErr)
            }
          } else {
            console.warn('[webhook] checkout.session.completed: email introuvable, email non envoyé')
          }
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription

        const { error } = await supabaseAdmin
          .from('abonnements')
          .update({
            plan: 'gratuit',
            statut_paiement: 'canceled',
            stripe_subscription_id: null,
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id)

        if (error) {
          console.error('[webhook] customer.subscription.deleted update failed:', error)
        } else {
          console.log('[webhook] abonnement résilié:', subscription.id)

          // Récupère l'email du client via Stripe — échec non bloquant
          if (typeof subscription.customer === 'string') {
            try {
              const customer = await stripe.customers.retrieve(subscription.customer)
              const email = customer.deleted ? null : customer.email
              if (email) {
                try {
                  await sendEmail(email, 'Votre abonnement Stratly a été résilié', HTML_RESILIATION)
                  console.log('[webhook] email résiliation envoyé:', email)
                } catch (emailErr) {
                  console.error('[webhook] email résiliation failed (non-bloquant):', emailErr)
                }
              } else {
                console.warn('[webhook] customer.subscription.deleted: email introuvable, email non envoyé')
              }
            } catch (customerErr) {
              console.error('[webhook] retrieve customer failed (non-bloquant):', customerErr)
            }
          }
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const { error } = await supabaseAdmin
          .from('abonnements')
          .update({
            statut_paiement: subscription.status,
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id)
        if (error) console.error('[webhook] customer.subscription.updated update failed:', error)
        break
      }

      default:
        break
    }
  } catch (err) {
    console.error('[webhook] handler error:', err)
    // Toujours 200 : on ne veut pas que Stripe relance un event déjà traité
  }

  return NextResponse.json({ received: true })
}
