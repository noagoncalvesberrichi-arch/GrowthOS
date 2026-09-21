const ONES = [
  '', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept',
  'huit', 'neuf', 'dix', 'onze', 'douze', 'treize', 'quatorze',
  'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf',
]

// isLast = true  → cent/vingt may take 's' (final position, or before million/milliard which are nouns)
// isLast = false → cent/vingt keep no 's' (before 'mille', which is a numeral adjective)
function belowHundred(n: number, isLast: boolean): string {
  if (n === 0) return ''
  if (n < 20) return ONES[n]

  if (n < 70) {
    const t = Math.floor(n / 10)
    const u = n % 10
    const tens = ['', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante'][t]
    if (u === 0) return tens
    if (u === 1) return tens + ' et un'
    return tens + '-' + ONES[u]
  }

  if (n < 80) {
    const sub = n - 60
    if (sub === 11) return 'soixante et onze'
    return 'soixante-' + ONES[sub]
  }

  const u = n - 80
  if (u === 0) return isLast ? 'quatre-vingts' : 'quatre-vingt'
  return 'quatre-vingt-' + ONES[u]
}

function belowThousand(n: number, isLast: boolean): string {
  if (n === 0) return ''
  if (n < 100) return belowHundred(n, isLast)

  const h = Math.floor(n / 100)
  const r = n % 100

  const hundredPart =
    h === 1
      ? 'cent'
      : ONES[h] + ' cent' + (r === 0 && isLast ? 's' : '')

  if (r === 0) return hundredPart
  return hundredPart + ' ' + belowHundred(r, isLast)
}

export function nombreEnLettres(n: number): string {
  if (n === 0) return 'zéro'

  const parts: string[] = []
  let rem = n

  if (rem >= 1_000_000_000) {
    const m = Math.floor(rem / 1_000_000_000)
    rem %= 1_000_000_000
    parts.push(belowThousand(m, true) + ' milliard' + (m > 1 ? 's' : ''))
  }

  if (rem >= 1_000_000) {
    const m = Math.floor(rem / 1_000_000)
    rem %= 1_000_000
    parts.push(belowThousand(m, true) + ' million' + (m > 1 ? 's' : ''))
  }

  if (rem >= 1_000) {
    const m = Math.floor(rem / 1_000)
    rem %= 1_000
    const mStr = m === 1 ? 'mille' : belowThousand(m, false) + ' mille'
    parts.push(mStr)
  }

  if (rem > 0) {
    parts.push(belowThousand(rem, true))
  }

  return parts.join(' ')
}

export function montantEnLettres(montant: number): string {
  if (isNaN(montant) || !isFinite(montant)) return '(montant invalide)'
  if (montant < 0) return 'moins ' + montantEnLettres(-montant)

  const totalCentimes = Math.round(montant * 100)
  const euros = Math.floor(totalCentimes / 100)
  const centimes = totalCentimes % 100

  const eurosWords = nombreEnLettres(euros)
  const eurosLabel = euros <= 1 ? 'euro' : 'euros'
  let result = eurosWords + ' ' + eurosLabel

  if (centimes > 0) {
    const centimesWords = nombreEnLettres(centimes)
    const centimesLabel = centimes <= 1 ? 'centime' : 'centimes'
    result += ' et ' + centimesWords + ' ' + centimesLabel
  }

  return result
}
