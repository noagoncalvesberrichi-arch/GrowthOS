import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import { supabaseAdmin } from '@/lib/supabase/admin'

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
        if (error) console.error('[webhook] checkout.session.completed update failed:', error)
        else console.log('[webhook] user passé en Pro:', userId)
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
        if (error) console.error('[webhook] customer.subscription.deleted update failed:', error)
        else console.log('[webhook] abonnement résilié:', subscription.id)
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
