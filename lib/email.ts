// Shared Resend utility — server-side only (uses RESEND_API_KEY)

export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
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

export function emailWrapper(content: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0;padding:0;background:#f8fafc;font-family:'Helvetica Neue',Arial,sans-serif;">
<div style="max-width:520px;margin:40px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 8px rgba(0,0,0,0.08);">
  <div style="background:#0F1B4D;padding:28px 32px;">
    <span style="font-size:20px;font-weight:700;color:#ffffff;letter-spacing:-0.02em;">Stratly</span>
  </div>
  <div style="padding:32px;">${content}</div>
  <div style="padding:20px 32px;border-top:1px solid #e5e7eb;">
    <p style="font-size:12px;color:#9ca3af;margin:0;">L&rsquo;&eacute;quipe Stratly &middot; <a href="https://stratly.fr" style="color:#9ca3af;text-decoration:none;">stratly.fr</a></p>
  </div>
</div></body></html>`
}
