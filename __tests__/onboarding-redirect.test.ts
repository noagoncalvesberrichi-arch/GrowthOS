import { describe, test, expect } from 'vitest'
import { shouldRedirectToOnboarding } from '../lib/onboarding'

describe('shouldRedirectToOnboarding', () => {
  test('profil absent (null) → redirect', () => {
    expect(shouldRedirectToOnboarding(null)).toBe(true)
  })

  test('profil avec raison_sociale remplie → pas de redirect', () => {
    expect(shouldRedirectToOnboarding({ raison_sociale: 'ACME SAS', onboarding_masque: false })).toBe(false)
  })

  test('profil avec onboarding_masque → pas de redirect (a cliqué Passer)', () => {
    expect(shouldRedirectToOnboarding({ raison_sociale: null, onboarding_masque: true })).toBe(false)
  })

  test('profil vide sans masque → redirect', () => {
    expect(shouldRedirectToOnboarding({ raison_sociale: '', onboarding_masque: false })).toBe(true)
  })

  test('profil raison_sociale whitespace uniquement → redirect', () => {
    expect(shouldRedirectToOnboarding({ raison_sociale: '   ', onboarding_masque: false })).toBe(true)
  })

  test('profil vide avec masque → pas de redirect', () => {
    expect(shouldRedirectToOnboarding({ raison_sociale: null, onboarding_masque: true })).toBe(false)
  })

  test('profil avec raison_sociale et masque → pas de redirect', () => {
    expect(shouldRedirectToOnboarding({ raison_sociale: 'ACME', onboarding_masque: true })).toBe(false)
  })
})
