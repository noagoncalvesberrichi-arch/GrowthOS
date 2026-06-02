/**
 * Test isolé de l'extraction PDF + analyse Claude.
 *
 * Usage :
 *   npx --env-file=.env.local tsx scripts/test-ao.ts <chemin-vers-le-pdf>
 *
 * Exemple :
 *   npx --env-file=.env.local tsx scripts/test-ao.ts scripts/test.pdf
 */

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { extractText, getDocumentProxy } from 'unpdf'
import Anthropic from '@anthropic-ai/sdk'

// ─── Config ──────────────────────────────────────────────────────────────────

const PDF_PATH = process.argv[2]
if (!PDF_PATH) {
  console.error('❌  Usage : npx --env-file=.env.local tsx scripts/test-ao.ts <chemin.pdf>')
  process.exit(1)
}

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY
if (!ANTHROPIC_API_KEY) {
  console.error('❌  ANTHROPIC_API_KEY manquante. Utilise --env-file=.env.local ou exporte la variable.')
  process.exit(1)
}

// ─── Prompts (copie exacte de actions.ts) ────────────────────────────────────

const SYSTEM_PROMPT = `Tu es un expert en marchés publics français. Tu analyses des appels d'offres et tu extrais les informations clés de manière structurée.
Tu réponds UNIQUEMENT avec un objet JSON valide, sans markdown, sans backticks, sans commentaires.`

const buildUserPrompt = (texte: string) => `Voici le texte d'un appel d'offres. Extrais et structure les informations suivantes en JSON.

TEXTE DE L'APPEL D'OFFRES :
${texte.slice(0, 40000)}

Retourne UNIQUEMENT ce JSON (toutes les clés sont requises, utilise null si l'information est absente) :
{
  "objet": "string — objet ou intitulé du marché",
  "type_procedure": "string — ex: procédure adaptée, appel d'offres ouvert, etc.",
  "acheteur": "string — nom du pouvoir adjudicateur",
  "lots": [
    { "numero": "string", "designation": "string", "estimation": "string ou null" }
  ],
  "criteres_notation": [
    { "critere": "string", "ponderation": "string" }
  ],
  "pieces_a_fournir": ["string"],
  "dates_cles": {
    "limite_remise_offres": "string ou null — date et heure",
    "visite_site": "string ou null",
    "validite_offres": "string ou null"
  },
  "points_de_vigilance": ["string"]
}`

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const absPath = resolve(PDF_PATH)
  console.log(`\n📄  Lecture du PDF : ${absPath}`)

  const buffer = readFileSync(absPath)
  const pdf = await getDocumentProxy(new Uint8Array(buffer))
  const { text } = await extractText(pdf, { mergePages: true })
  const texte = text?.trim() ?? ''

  console.log(`✅  Texte extrait : ${texte.length} caractères`)
  if (texte.length < 100) {
    console.error('❌  PDF illisible ou vide (peut-être un scan image sans texte sélectionnable).')
    process.exit(1)
  }
  console.log(`\n--- Début du texte extrait (500 premiers caractères) ---`)
  console.log(texte.slice(0, 500))
  console.log(`--- Fin de l'aperçu ---\n`)

  console.log('🤖  Appel Claude en cours...')
  const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY })
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: buildUserPrompt(texte) }],
  })

  const content = message.content[0].type === 'text' ? message.content[0].text : ''
  const firstBrace = content.indexOf('{')
  const lastBrace = content.lastIndexOf('}')

  if (firstBrace === -1 || lastBrace === -1) {
    console.error('❌  Réponse inattendue du modèle (pas de JSON trouvé) :')
    console.error(content)
    process.exit(1)
  }

  let data: unknown
  try {
    data = JSON.parse(content.slice(firstBrace, lastBrace + 1))
  } catch (e) {
    console.error('❌  JSON.parse a échoué :')
    console.error(content)
    process.exit(1)
  }

  console.log('\n✅  Résultat JSON :\n')
  console.log(JSON.stringify(data, null, 2))
}

main().catch((err) => {
  console.error('❌  Erreur inattendue :', err)
  process.exit(1)
})
