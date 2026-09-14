'use server'

import { createClient } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { sendEmail, emailWrapper } from '@/lib/email'

const HTML_BIENVENUE = emailWrapper(`
  <h1 style="font-size:20px;font-weight:700;color:#0F1B4D;margin:0 0 12px 0;">Bienvenue sur Stratly&nbsp;!</h1>
  <p style="font-size:14px;color:#374151;line-height:1.6;margin:0 0 8px 0;">
    Votre compte est pr&ecirc;t. Vous disposez de <strong>3 analyses offertes</strong> &mdash; sans carte bancaire.
  </p>
  <p style="font-size:14px;color:#374151;line-height:1.6;margin:0 0 16px 0;">
    Pour d&eacute;marrer&nbsp;:
  </p>
  <ul style="font-size:14px;color:#374151;line-height:2.2;margin:0 0 24px 0;padding-left:20px;">
    <li><strong>D&eacute;posez votre premier appel d&apos;offres</strong> &mdash; obtenez une synth&egrave;se structur&eacute;e et un verdict Go/No-Go en quelques secondes</li>
    <li><strong>Compl&eacute;tez votre profil entreprise</strong> &mdash; il enrichit vos analyses et g&eacute;n&egrave;re des m&eacute;moires techniques personnalis&eacute;s</li>
    <li><strong>G&eacute;n&eacute;rez une trame de m&eacute;moire</strong> &mdash; construite sur la grille de notation du DCE et vos r&eacute;f&eacute;rences chantier</li>
  </ul>
  <a href="https://stratly.fr/dashboard" style="display:inline-block;background:#2563EB;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 24px;border-radius:8px;margin-bottom:20px;">
    Acc&eacute;der &agrave; mon tableau de bord &rarr;
  </a>
  <p style="font-size:12px;color:#9ca3af;margin:0;">
    Conseil&nbsp;: commencez par
    <a href="https://stratly.fr/dashboard/mon-entreprise" style="color:#2563EB;text-decoration:none;">compl&eacute;ter votre profil entreprise</a>
    pour des analyses plus pr&eacute;cises.
  </p>
`)

export async function verifierEtEnvoyerBienvenue(): Promise<void> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user?.email) return

    // Check if welcome email was already sent for this user
    const { data: abo } = await getSupabaseAdmin()
      .from('abonnements')
      .select('bienvenue_envoyee')
      .eq('user_id', user.id)
      .maybeSingle()

    if (abo?.bienvenue_envoyee === true) return

    // Send the welcome email
    await sendEmail(user.email, 'Bienvenue sur Stratly — 3 analyses offertes', HTML_BIENVENUE)

    // Mark as sent — upsert: updates the flag if row exists, inserts with DB defaults if not
    await getSupabaseAdmin()
      .from('abonnements')
      .upsert({ user_id: user.id, bienvenue_envoyee: true }, { onConflict: 'user_id' })

    console.log('[bienvenue] email envoyé à:', user.email)
  } catch (err) {
    console.error('[bienvenue] erreur (non-bloquante):', err)
    // Never throws — caller must not be affected by email failure
  }
}
