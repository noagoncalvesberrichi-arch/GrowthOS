'use server'

import { createClient } from '@/lib/supabase/server'
import { sendEmail, emailWrapper } from '@/lib/email'

const HTML_MOT_DE_PASSE_MODIFIE = emailWrapper(`
  <h1 style="font-size:20px;font-weight:700;color:#0F1B4D;margin:0 0 12px 0;">Mot de passe modifi&eacute;</h1>
  <p style="font-size:14px;color:#374151;line-height:1.6;margin:0 0 16px 0;">
    Votre mot de passe Stratly a bien &eacute;t&eacute; mis &agrave; jour.
  </p>
  <p style="font-size:14px;color:#374151;line-height:1.6;margin:0 0 24px 0;">
    Si vous n&apos;&ecirc;tes pas &agrave; l&apos;origine de cette modification, contactez-nous imm&eacute;diatement &agrave;
    <a href="mailto:noa.goncalvesberrichi@gmail.com" style="color:#2563EB;text-decoration:none;">noa.goncalvesberrichi@gmail.com</a>.
  </p>
  <a href="https://stratly.fr/dashboard" style="display:inline-block;background:#2563EB;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 24px;border-radius:8px;">
    Acc&eacute;der &agrave; mon tableau de bord &rarr;
  </a>
`)

export async function envoyerEmailMotDePasseModifie(): Promise<void> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.email) return
    await sendEmail(user.email, 'Votre mot de passe Stratly a été modifié', HTML_MOT_DE_PASSE_MODIFIE)
    console.log('[reset-password] email envoyé à:', user.email)
  } catch (err) {
    console.error('[reset-password] email failed (non-bloquant):', err)
  }
}
