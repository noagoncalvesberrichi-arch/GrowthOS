'use server'

import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/email'

function emailWrapper(content: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0;padding:0;background:#f8fafc;font-family:'Helvetica Neue',Arial,sans-serif;">
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

const HTML_BIENVENUE = emailWrapper(`
  <h1 style="font-size:20px;font-weight:700;color:#0F1B4D;margin:0 0 12px 0;">Bienvenue sur Stratly&nbsp;!</h1>
  <p style="font-size:14px;color:#374151;line-height:1.6;margin:0 0 16px 0;">
    Votre compte est pr&ecirc;t. Stratly est con&ccedil;u pour vous aider &agrave; r&eacute;pondre aux march&eacute;s publics plus efficacement &mdash; voici ce que vous pouvez faire d&egrave;s maintenant&nbsp;:
  </p>
  <ul style="font-size:14px;color:#374151;line-height:2.2;margin:0 0 24px 0;padding-left:20px;">
    <li><strong>Analyser un appel d&apos;offres</strong> &mdash; d&eacute;posez un PDF, obtenez une synth&egrave;se structur&eacute;e en quelques secondes</li>
    <li><strong>G&eacute;n&eacute;rer une trame de m&eacute;moire technique</strong> &mdash; une base solide et personnalis&eacute;e en un clic</li>
    <li><strong>Trouver des AO pertinents</strong> &mdash; veille BOAMP filtr&eacute;e selon votre zone et vos m&eacute;tiers</li>
  </ul>
  <a href="https://stratly.fr/dashboard" style="display:inline-block;background:#2563EB;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 24px;border-radius:8px;">
    Acc&eacute;der &agrave; mon tableau de bord &rarr;
  </a>
`)

export async function verifierEtEnvoyerBienvenue(): Promise<void> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user?.email) return

    // Check if welcome email was already sent for this user
    const { data: abo } = await supabaseAdmin
      .from('abonnements')
      .select('bienvenue_envoyee')
      .eq('user_id', user.id)
      .maybeSingle()

    if (abo?.bienvenue_envoyee === true) return

    // Send the welcome email
    await sendEmail(user.email, 'Bienvenue sur Stratly', HTML_BIENVENUE)

    // Mark as sent — upsert: updates the flag if row exists, inserts with DB defaults if not
    // On conflict (row exists): only bienvenue_envoyee is updated, other columns untouched
    await supabaseAdmin
      .from('abonnements')
      .upsert({ user_id: user.id, bienvenue_envoyee: true }, { onConflict: 'user_id' })

    console.log('[bienvenue] email envoyé à:', user.email)
  } catch (err) {
    console.error('[bienvenue] erreur (non-bloquante):', err)
    // Never throws — caller must not be affected by email failure
  }
}
