'use server'

import { headers } from 'next/headers'
import { stripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'

type CheckoutResult = { url: string } | { error: string }

export async function creerSessionCheckout(plan: 'mensuel' | 'annuel'): Promise<CheckoutResult> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Connecte-toi pour souscrire à un abonnement.' }

    // Retrieve or create Stripe customer
    const { data: abo } = await supabase
      .from('abonnements')
      .select('stripe_customer_id')
      .maybeSingle()

    let customerId: string

    if (abo?.stripe_customer_id) {
      customerId = abo.stripe_customer_id as string
    } else {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { user_id: user.id },
      })
      customerId = customer.id

      await supabase
        .from('abonnements')
        .upsert({ user_id: user.id, stripe_customer_id: customerId }, { onConflict: 'user_id' })
    }

    // Build absolute base URL from request headers
    const headersList = await headers()
    const host = headersList.get('host') ?? 'localhost:3000'
    const proto = headersList.get('x-forwarded-proto') ?? 'http'
    const baseUrl = `${proto}://${host}`

    const priceId = plan === 'mensuel'
      ? process.env.STRIPE_PRICE_ID_MENSUEL!
      : process.env.STRIPE_PRICE_ID_ANNUEL!

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${baseUrl}/pricing?success=true`,
      cancel_url: `${baseUrl}/pricing?canceled=true`,
      client_reference_id: user.id,
      metadata: { user_id: user.id },
    })

    if (!session.url) return { error: 'Impossible de créer la session de paiement.' }

    return { url: session.url }
  } catch (err) {
    console.error('[creerSessionCheckout]', err)
    return { error: 'Erreur lors de la création de la session de paiement. Réessaie.' }
  }
}
