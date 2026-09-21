import { montantEnLettres } from '../montantEnLettres'
import assert from 'node:assert/strict'

type Case = [number, string]

const cases: Case[] = [
  [0,          'zéro euro'],
  [1,          'un euro'],
  [2,          'deux euros'],
  [11,         'onze euros'],
  [21,         'vingt et un euros'],
  [71,         'soixante et onze euros'],
  [80,         'quatre-vingts euros'],
  [81,         'quatre-vingt-un euros'],
  [100,        'cent euros'],
  [200,        'deux cents euros'],
  [201,        'deux cent un euros'],
  [1_000,      'mille euros'],
  [80_000,     'quatre-vingt mille euros'],
  [200_000,    'deux cent mille euros'],
  [50_000.75,  'cinquante mille euros et soixante-quinze centimes'],
]

let passed = 0
let failed = 0

for (const [input, expected] of cases) {
  const result = montantEnLettres(input)
  if (result === expected) {
    console.log(`  ✓  montantEnLettres(${input}) = "${result}"`)
    passed++
  } else {
    console.error(`  ✗  montantEnLettres(${input})`)
    console.error(`     expected: "${expected}"`)
    console.error(`     got:      "${result}"`)
    failed++
  }
}

console.log(`\n${passed} passed, ${failed} failed`)
if (failed > 0) process.exit(1)
