/** Minimal profil shape needed to decide about onboarding redirect */
export type ProfilMinimal = {
  raison_sociale?: string | null
  onboarding_masque?: boolean | null
}

/**
 * Returns true when the user should be redirected to /onboarding.
 *
 * Rules:
 * - No profil row at all → redirect
 * - Row exists + raison_sociale filled → no redirect (profile complete enough)
 * - Row exists + onboarding_masque → no redirect (user explicitly skipped)
 * - Row exists but empty raison_sociale and not skipped → redirect
 */
export function shouldRedirectToOnboarding(profil: ProfilMinimal | null): boolean {
  if (!profil) return true
  if (profil.onboarding_masque) return false
  if (profil.raison_sociale?.trim()) return false
  return true
}
