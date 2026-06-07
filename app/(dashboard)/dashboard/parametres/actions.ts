'use server'

import { headers } from 'next/headers'
import { stripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'

export type PortailResult = { url: string } | { error: string }

export async function creerSessionPortail(): Promise<PortailResult> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Non authentifié.' }

    const { data: abo } = await supabase
      .from('abonnements')
      .select('stripe_customer_id')
      .maybeSingle()

    if (!abo?.stripe_customer_id) {
      return { error: 'Aucun abonnement Stripe trouvé. Contacte le support si le problème persiste.' }
    }

    const headersList = await headers()
    const host = headersList.get('host') ?? 'localhost:3000'
    const proto = headersList.get('x-forwarded-proto') ?? 'http'
    const baseUrl = `${proto}://${host}`

    const session = await stripe.billingPortal.sessions.create({
      customer: abo.stripe_customer_id,
      return_url: `${baseUrl}/dashboard/parametres`,
    })

    return { url: session.url }
  } catch (err) {
    console.error('[creerSessionPortail]', err)
    return { error: "Erreur lors de l'ouverture du portail de facturation. Réessaie." }
  }
}
