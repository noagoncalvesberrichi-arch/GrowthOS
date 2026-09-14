# Templates email Supabase Auth

À copier dans **Supabase Dashboard → Authentication → Email Templates**.
Expéditeur : `Stratly <noreply@stratly.fr>` (à configurer dans SMTP settings).

Variables disponibles : `{{ .ConfirmationURL }}`, `{{ .Token }}`, `{{ .SiteURL }}`, `{{ .Email }}`, `{{ .NewEmail }}`.

---

## 1. Confirmation d'inscription

**Sujet :**
```
Confirmez votre adresse email Stratly
```

**Corps HTML :**
```html
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:'Helvetica Neue',Arial,sans-serif;">
<div style="max-width:520px;margin:40px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 8px rgba(0,0,0,0.08);">
  <div style="background:#0F1B4D;padding:28px 32px;">
    <span style="font-size:20px;font-weight:700;color:#ffffff;letter-spacing:-0.02em;">Stratly</span>
  </div>
  <div style="padding:32px;">
    <h1 style="font-size:20px;font-weight:700;color:#0F1B4D;margin:0 0 12px 0;">Confirmez votre adresse email</h1>
    <p style="font-size:14px;color:#374151;line-height:1.6;margin:0 0 24px 0;">
      Bienvenue sur Stratly. Cliquez sur le bouton ci-dessous pour confirmer votre adresse email et activer votre compte.
    </p>
    <a href="{{ .ConfirmationURL }}" style="display:inline-block;background:#2563EB;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 24px;border-radius:8px;margin-bottom:20px;">
      Confirmer mon adresse email &rarr;
    </a>
    <p style="font-size:12px;color:#9ca3af;margin:16px 0 0 0;">
      Ce lien est valable 24&nbsp;heures. Si vous n'avez pas créé de compte Stratly, ignorez cet email.
    </p>
  </div>
  <div style="padding:20px 32px;border-top:1px solid #e5e7eb;">
    <p style="font-size:12px;color:#9ca3af;margin:0;">L'équipe Stratly &middot; <a href="https://stratly.fr" style="color:#9ca3af;text-decoration:none;">stratly.fr</a></p>
  </div>
</div>
</body>
</html>
```

---

## 2. Réinitialisation du mot de passe

**Sujet :**
```
Réinitialisez votre mot de passe Stratly
```

**Corps HTML :**
```html
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:'Helvetica Neue',Arial,sans-serif;">
<div style="max-width:520px;margin:40px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 8px rgba(0,0,0,0.08);">
  <div style="background:#0F1B4D;padding:28px 32px;">
    <span style="font-size:20px;font-weight:700;color:#ffffff;letter-spacing:-0.02em;">Stratly</span>
  </div>
  <div style="padding:32px;">
    <h1 style="font-size:20px;font-weight:700;color:#0F1B4D;margin:0 0 12px 0;">Réinitialisez votre mot de passe</h1>
    <p style="font-size:14px;color:#374151;line-height:1.6;margin:0 0 16px 0;">
      Vous avez demandé la réinitialisation du mot de passe associé à <strong>{{ .Email }}</strong>.
    </p>
    <p style="font-size:14px;color:#374151;line-height:1.6;margin:0 0 24px 0;">
      Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe.
    </p>
    <a href="{{ .ConfirmationURL }}" style="display:inline-block;background:#2563EB;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 24px;border-radius:8px;margin-bottom:20px;">
      Choisir un nouveau mot de passe &rarr;
    </a>
    <p style="font-size:12px;color:#9ca3af;margin:16px 0 0 0;">
      Ce lien est valable 1&nbsp;heure. Si vous n'avez pas demandé cette réinitialisation, ignorez cet email — votre mot de passe ne sera pas modifié.
    </p>
  </div>
  <div style="padding:20px 32px;border-top:1px solid #e5e7eb;">
    <p style="font-size:12px;color:#9ca3af;margin:0;">L'équipe Stratly &middot; <a href="https://stratly.fr" style="color:#9ca3af;text-decoration:none;">stratly.fr</a></p>
  </div>
</div>
</body>
</html>
```

---

## 3. Magic link (connexion sans mot de passe)

**Sujet :**
```
Votre lien de connexion Stratly
```

**Corps HTML :**
```html
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:'Helvetica Neue',Arial,sans-serif;">
<div style="max-width:520px;margin:40px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 8px rgba(0,0,0,0.08);">
  <div style="background:#0F1B4D;padding:28px 32px;">
    <span style="font-size:20px;font-weight:700;color:#ffffff;letter-spacing:-0.02em;">Stratly</span>
  </div>
  <div style="padding:32px;">
    <h1 style="font-size:20px;font-weight:700;color:#0F1B4D;margin:0 0 12px 0;">Votre lien de connexion</h1>
    <p style="font-size:14px;color:#374151;line-height:1.6;margin:0 0 24px 0;">
      Cliquez sur le bouton ci-dessous pour vous connecter à votre espace Stratly. Aucun mot de passe requis.
    </p>
    <a href="{{ .ConfirmationURL }}" style="display:inline-block;background:#2563EB;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 24px;border-radius:8px;margin-bottom:20px;">
      Me connecter &rarr;
    </a>
    <p style="font-size:12px;color:#9ca3af;margin:16px 0 0 0;">
      Ce lien est valable 1&nbsp;heure et à usage unique. Si vous n'avez pas demandé cette connexion, ignorez cet email.
    </p>
  </div>
  <div style="padding:20px 32px;border-top:1px solid #e5e7eb;">
    <p style="font-size:12px;color:#9ca3af;margin:0;">L'équipe Stratly &middot; <a href="https://stratly.fr" style="color:#9ca3af;text-decoration:none;">stratly.fr</a></p>
  </div>
</div>
</body>
</html>
```

---

## 4. Changement d'adresse email

**Sujet :**
```
Confirmez votre nouvelle adresse email Stratly
```

**Corps HTML :**
```html
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:'Helvetica Neue',Arial,sans-serif;">
<div style="max-width:520px;margin:40px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 8px rgba(0,0,0,0.08);">
  <div style="background:#0F1B4D;padding:28px 32px;">
    <span style="font-size:20px;font-weight:700;color:#ffffff;letter-spacing:-0.02em;">Stratly</span>
  </div>
  <div style="padding:32px;">
    <h1 style="font-size:20px;font-weight:700;color:#0F1B4D;margin:0 0 12px 0;">Confirmez votre nouvelle adresse</h1>
    <p style="font-size:14px;color:#374151;line-height:1.6;margin:0 0 16px 0;">
      Vous avez demandé à changer votre adresse email Stratly pour <strong>{{ .NewEmail }}</strong>.
    </p>
    <p style="font-size:14px;color:#374151;line-height:1.6;margin:0 0 24px 0;">
      Cliquez sur le bouton ci-dessous pour confirmer ce changement.
    </p>
    <a href="{{ .ConfirmationURL }}" style="display:inline-block;background:#2563EB;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 24px;border-radius:8px;margin-bottom:20px;">
      Confirmer ma nouvelle adresse &rarr;
    </a>
    <p style="font-size:12px;color:#9ca3af;margin:16px 0 0 0;">
      Si vous n'avez pas demandé ce changement, ignorez cet email — votre adresse actuelle reste inchangée.
    </p>
  </div>
  <div style="padding:20px 32px;border-top:1px solid #e5e7eb;">
    <p style="font-size:12px;color:#9ca3af;margin:0;">L'équipe Stratly &middot; <a href="https://stratly.fr" style="color:#9ca3af;text-decoration:none;">stratly.fr</a></p>
  </div>
</div>
</body>
</html>
```

---

## Notes de configuration

- Dans **Supabase → Authentication → SMTP Settings** : configurer Resend en SMTP (`smtp.resend.com`, port 465 ou 587, login `resend`, password = clé API Resend) avec `noreply@stratly.fr` comme expéditeur.
- Dans **Authentication → URL Configuration** : le **Site URL** doit pointer vers `https://stratly.fr` et les **Redirect URLs** inclure `https://stratly.fr/**`.
- Le lien de réinitialisation redirige vers `/reset-password` (géré par `app/(marketing)/reset-password/page.tsx`).
