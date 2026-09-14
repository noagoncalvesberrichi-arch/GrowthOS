import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { sendEmail, emailWrapper } from '@/lib/email'

// ─── Plan constants ────────────────────────────────────────────────────────────

const PLAN_INFO: Record<string, { label: string; prix: string }> = {
  essentiel:  { label: 'Essentiel',  prix: '190&nbsp;&euro; HT/mois' },
  pro:        { label: 'Pro',        prix: '390&nbsp;&euro; HT/mois' },
  fondateurs: { label: 'Fondateurs', prix: '190&nbsp;&euro; HT/mois (tarif &agrave; vie)' },
}

// ─── HTML templates ───────────────────────────────────────────────────────────

function htmlConfirmation(planLabel: string, prix: string, nextBilling: string): string {
  return emailWrapper(`
  <h1 style="font-size:20px;font-weight:700;color:#0F1B4D;margin:0 0 12px 0;">Abonnement ${planLabel} activ&eacute;</h1>
  <p style="font-size:14px;color:#374151;line-height:1.6;margin:0 0 20px 0;">
    Merci pour votre confiance. Votre abonnement Stratly ${planLabel} est confirm&eacute; et toutes les fonctionnalit&eacute;s sont accessibles.
  </p>
  <table style="width:100%;border-collapse:collapse;margin:0 0 24px 0;background:#f9fafb;border-radius:8px;overflow:hidden;">
    <tr>
      <td style="font-size:13px;color:#6b7280;padding:10px 16px;border-bottom:1px solid #f3f4f6;">Plan</td>
      <td style="font-size:13px;color:#0F1B4D;font-weight:700;padding:10px 16px;border-bottom:1px solid #f3f4f6;text-align:right;">${planLabel}</td>
    </tr>
    <tr>
      <td style="font-size:13px;color:#6b7280;padding:10px 16px;${nextBilling ? 'border-bottom:1px solid #f3f4f6;' : ''}">Montant</td>
      <td style="font-size:13px;color:#0F1B4D;font-weight:700;padding:10px 16px;${nextBilling ? 'border-bottom:1px solid #f3f4f6;' : ''}text-align:right;">${prix}</td>
    </tr>
    ${nextBilling ? `
    <tr>
      <td style="font-size:13px;color:#6b7280;padding:10px 16px;">Prochain pr&eacute;l&egrave;vement</td>
      <td style="font-size:13px;color:#0F1B4D;font-weight:700;padding:10px 16px;text-align:right;">${nextBilling}</td>
    </tr>
    ` : ''}
  </table>
  <a href="https://stratly.fr/dashboard" style="display:inline-block;background:#2563EB;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 24px;border-radius:8px;margin-bottom:16px;">
    Acc&eacute;der &agrave; mon tableau de bord &rarr;
  </a>
  <p style="font-size:12px;color:#9ca3af;margin:16px 0 0 0;">
    Pour g&eacute;rer votre abonnement, rendez-vous dans
    <a href="https://stratly.fr/dashboard/parametres" style="color:#2563EB;text-decoration:none;">Param&egrave;tres</a>.
  </p>
`)
}

const HTML_ECHEC_PAIEMENT = emailWrapper(`
  <h1 style="font-size:20px;font-weight:700;color:#0F1B4D;margin:0 0 12px 0;">&Eacute;chec du pr&eacute;l&egrave;vement</h1>
  <p style="font-size:14px;color:#374151;line-height:1.6;margin:0 0 16px 0;">
    Nous n&apos;avons pas pu pr&eacute;lever votre abonnement Stratly. Votre acc&egrave;s reste actif le temps de r&eacute;gulariser la situation.
  </p>
  <p style="font-size:14px;color:#374151;line-height:1.6;margin:0 0 24px 0;">
    Merci de mettre &agrave; jour votre moyen de paiement dans vos param&egrave;tres pour &eacute;viter une interruption de service.
  </p>
  <a href="https://stratly.fr/dashboard/parametres" style="display:inline-block;background:#2563EB;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 24px;border-radius:8px;">
    Mettre &agrave; jour ma carte &rarr;
  </a>
`)

function htmlResiliation(finAcces: string): string {
  return emailWrapper(`
  <h1 style="font-size:20px;font-weight:700;color:#0F1B4D;margin:0 0 12px 0;">Abonnement r&eacute;sili&eacute;</h1>
  <p style="font-size:14px;color:#374151;line-height:1.6;margin:0 0 16px 0;">
    Nous avons bien pris en compte la r&eacute;siliation de votre abonnement Stratly.
    ${finAcces
      ? `Votre acc&egrave;s aux fonctionnalit&eacute;s payantes se termine le <strong>${finAcces}</strong>.`
      : "L&apos;acc&egrave;s aux fonctionnalit&eacute;s payantes est termin&eacute;."}
  </p>
  <p style="font-size:14px;color:#374151;line-height:1.6;margin:0 0 24px 0;">
    Votre compte reste actif en version gratuite &mdash; vous pouvez continuer &agrave; utiliser Stratly avec les fonctionnalit&eacute;s de base.
    Si vous souhaitez revenir, la porte est ouverte.
  </p>
  <a href="https://stratly.fr/pricing" style="display:inline-block;background:#2563EB;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 24px;border-radius:8px;">
    Voir les offres &rarr;
  </a>
`)
}

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

        // Determine plan from metadata (set during session creation)
        const planMeta = (session.metadata?.plan ?? 'pro') as 'essentiel' | 'pro' | 'fondateurs'
        const dbPlan = planMeta === 'essentiel' ? 'essentiel' : 'pro'

        const { error } = await getSupabaseAdmin()
          .from('abonnements')
          .update({
            plan: dbPlan,
            statut_paiement: 'active',
            stripe_subscription_id: session.subscription as string | null,
            stripe_customer_id: session.customer as string | null,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId)

        if (error) {
          console.error('[webhook] checkout.session.completed update failed:', error)
        } else {
          console.log(`[webhook] user passé en ${dbPlan} (plan: ${planMeta}):`, userId)

          const email = session.customer_details?.email ?? session.customer_email ?? null
          if (email) {
            try {
              // Retrieve next billing date from subscription
              let nextBillingStr = ''
              const subscriptionId = session.subscription as string | null
              if (subscriptionId) {
                try {
                  const sub = await stripe.subscriptions.retrieve(subscriptionId)
                  // In Stripe v22, current_period_end is on the first subscription item
                  const periodEnd = sub.items?.data?.[0]?.current_period_end
                  if (periodEnd) {
                    const d = new Date(periodEnd * 1000)
                    nextBillingStr = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
                  }
                } catch {
                  // Non-bloquant — date omise si échec
                }
              }

              const info = PLAN_INFO[planMeta] ?? PLAN_INFO.pro
              const html = htmlConfirmation(info.label, info.prix, nextBillingStr)
              await sendEmail(email, `Votre abonnement Stratly ${info.label} est actif`, html)
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

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        if (typeof invoice.customer === 'string') {
          try {
            const customer = await stripe.customers.retrieve(invoice.customer)
            const email = customer.deleted ? null : customer.email
            if (email) {
              await sendEmail(email, 'Échec du prélèvement Stratly — action requise', HTML_ECHEC_PAIEMENT)
              console.log('[webhook] email échec paiement envoyé:', email)
            } else {
              console.warn('[webhook] invoice.payment_failed: email introuvable')
            }
          } catch (err) {
            console.error('[webhook] invoice.payment_failed email failed (non-bloquant):', err)
          }
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription

        // Date de fin d'accès = current_period_end sur le premier item (Stripe v22)
        const periodEnd = subscription.items?.data?.[0]?.current_period_end
        const finAcces = periodEnd
          ? new Date(periodEnd * 1000)
              .toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
          : ''

        const { error } = await getSupabaseAdmin()
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

          if (typeof subscription.customer === 'string') {
            try {
              const customer = await stripe.customers.retrieve(subscription.customer)
              const email = customer.deleted ? null : customer.email
              if (email) {
                try {
                  await sendEmail(email, 'Votre abonnement Stratly a été résilié', htmlResiliation(finAcces))
                  console.log('[webhook] email résiliation envoyé:', email)
                } catch (emailErr) {
                  console.error('[webhook] email résiliation failed (non-bloquant):', emailErr)
                }
              } else {
                console.warn('[webhook] customer.subscription.deleted: email introuvable')
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
        const { error } = await getSupabaseAdmin()
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
