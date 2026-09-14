'use server'

import { headers } from 'next/headers'
import { stripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'

type CheckoutResult = { url: string } | { error: string }

export async function creerSessionCheckout(plan: 'essentiel' | 'pro' | 'fondateurs'): Promise<CheckoutResult> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Connectez-vous pour souscrire à un abonnement.' }

    // Retrieve or create Stripe customer
    const { data: abo } = await supabase
      .from('abonnements')
      .select('stripe_customer_id')
      .maybeSingle()

    let customerId: string | null = null

    const existingId = abo?.stripe_customer_id as string | undefined
    if (existingId) {
      try {
        const retrieved = await stripe.customers.retrieve(existingId)
        if (!retrieved.deleted) customerId = retrieved.id
      } catch (err: unknown) {
        // resource_missing = customer doesn't exist in this Stripe mode (e.g. test→live switch)
        const code = (err as { code?: string })?.code
        if (code !== 'resource_missing') throw err
      }
    }

    if (!customerId) {
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

    // Both 'pro' and 'fondateurs' use the Pro price; 'fondateurs' applies a fixed coupon instead of open promo codes
    const priceId = plan === 'essentiel'
      ? process.env.STRIPE_PRICE_ID_ESSENTIEL
      : process.env.STRIPE_PRICE_ID_PRO

    if (!priceId) {
      const varName = plan === 'essentiel' ? 'STRIPE_PRICE_ID_ESSENTIEL' : 'STRIPE_PRICE_ID_PRO'
      console.error(`[creerSessionCheckout] Variable d'environnement manquante : ${varName}`)
      return { error: `Configuration de paiement incomplète (${varName} absent). Contactez le support.` }
    }

    // Resolve discount options — fondateurs uses a promo code (not a coupon ID)
    let discountOptions: { discounts: [{ promotion_code: string }] } | { allow_promotion_codes: boolean }
    if (plan === 'fondateurs') {
      const codes = await stripe.promotionCodes.list({ code: 'FONDATEURS', active: true, limit: 1 })
      if (codes.data.length === 0) {
        return { error: "Le code promotionnel FONDATEURS est introuvable ou inactif. Contactez le support." }
      }
      discountOptions = { discounts: [{ promotion_code: codes.data[0].id }] }
    } else {
      discountOptions = { allow_promotion_codes: true }
    }

    console.log(`[creerSessionCheckout] plan=${plan} priceId=${priceId} customer=${customerId}`)

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${baseUrl}/pricing?success=true`,
      cancel_url: `${baseUrl}/pricing?canceled=true`,
      client_reference_id: user.id,
      metadata: { user_id: user.id },
      ...discountOptions,
    })

    if (!session.url) return { error: 'Impossible de créer la session de paiement.' }

    return { url: session.url }
  } catch (err) {
    console.error('[creerSessionCheckout] erreur complète :', err)
    const msg = err instanceof Error ? err.message : String(err)
    return { error: `Erreur lors de la création de la session de paiement : ${msg}` }
  }
}
