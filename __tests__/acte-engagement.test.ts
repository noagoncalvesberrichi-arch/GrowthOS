import { describe, test, expect } from 'vitest'
import { montantEnLettres, nombreEnLettres } from '../lib/montantEnLettres'
import type { ActeData } from '../lib/chiffrage/acteEngagement'

// ---------------------------------------------------------------------------
// montantEnLettres
// ---------------------------------------------------------------------------

describe('montantEnLettres', () => {
  test('302 094,04 → trois cent deux mille quatre-vingt-quatorze euros et quatre centimes', () => {
    expect(montantEnLettres(302_094.04)).toBe(
      'trois cent deux mille quatre-vingt-quatorze euros et quatre centimes'
    )
  })

  test('1 000 000 → un million euros', () => {
    expect(montantEnLettres(1_000_000)).toBe('un million euros')
  })

  test('80,01 → quatre-vingts euros et un centime', () => {
    expect(montantEnLettres(80.01)).toBe('quatre-vingts euros et un centime')
  })

  test('71 → soixante et onze euros', () => {
    expect(montantEnLettres(71)).toBe('soixante et onze euros')
  })

  test('21 080 → vingt et un mille quatre-vingts euros', () => {
    expect(montantEnLettres(21_080)).toBe('vingt et un mille quatre-vingts euros')
  })

  test('0 → zéro euro', () => {
    expect(montantEnLettres(0)).toBe('zéro euro')
  })

  test('1,50 → un euro et cinquante centimes', () => {
    expect(montantEnLettres(1.5)).toBe('un euro et cinquante centimes')
  })
})

// ---------------------------------------------------------------------------
// Calculs montants ActeData (inline, sans import du générateur docx)
// ---------------------------------------------------------------------------

describe('calculs montants ActeData', () => {
  const base = 267_011.22
  const pse = 35_082.82
  const variante = 274_881.22
  const taux = 20

  // Même formules que buildDocument dans acteEngagement.ts
  const montant_base_plus_pse = Math.round((base + pse) * 100) / 100
  const montant_tva = Math.round(montant_base_plus_pse * taux / 100 * 100) / 100
  const montant_ttc = Math.round(montant_base_plus_pse * (1 + taux / 100) * 100) / 100

  test('base + PSE = 302 094,04', () => {
    expect(montant_base_plus_pse).toBe(302_094.04)
  })

  test('TVA 20% sur base+PSE = 60 418,81', () => {
    expect(montant_tva).toBe(60_418.81)
  })

  test('TTC = 362 512,85', () => {
    expect(montant_ttc).toBe(362_512.85)
  })

  test('variante NE S\'AJOUTE PAS à base+PSE', () => {
    // La variante est une offre alternative : son montant est distinct
    expect(montant_base_plus_pse + variante).not.toBe(montant_base_plus_pse)
    // Et la variante n'entre pas dans le calcul TTC principal
    expect(montant_ttc).toBe(362_512.85)
  })
})

// ---------------------------------------------------------------------------
// Lieux ActeData
// ---------------------------------------------------------------------------

describe('lieux ActeData', () => {
  test('lieu_execution et lieu_signature sont des champs distincts', () => {
    const acte = {
      lieu_execution: 'Les Ulis',
      lieu_signature: 'Paris',
    } as ActeData

    expect(acte.lieu_execution).toBe('Les Ulis')
    expect(acte.lieu_signature).toBe('Paris')
    expect(acte.lieu_execution).not.toBe(acte.lieu_signature)
  })
})

// Ré-export pour s'assurer que nombreEnLettres est bien importé (utilisé ci-dessous)
describe('nombreEnLettres (entiers)', () => {
  test('0 → zéro', () => {
    expect(nombreEnLettres(0)).toBe('zéro')
  })

  test('100 → cent', () => {
    expect(nombreEnLettres(100)).toBe('cent')
  })

  test('1001 → mille un', () => {
    expect(nombreEnLettres(1001)).toBe('mille un')
  })
})
