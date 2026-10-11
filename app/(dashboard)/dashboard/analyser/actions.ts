'use server'

import { extractText, getDocumentProxy } from 'unpdf'
import { anthropic } from '@/lib/anthropic'
import { createClient } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import JSZip from 'jszip'

// ─── Types ────────────────────────────────────────────────────────────────────

export type GoNoGoCritere = {
  critere: string
  exigence_marche: string
  situation_entreprise: string
  statut: 'ok' | 'manquant' | 'incertain'
}

export type GoNoGo = {
  verdict: 'GO' | 'NO_GO' | 'VIGILANCE'
  score_eligibilite: number
  criteres: GoNoGoCritere[]
  synthese: string
}

export type AOResult = {
  objet: string
  type_procedure: string
  acheteur: string
  lieu_execution: string | null
  siret_acheteur: string | null
  code_cpv: string | null
  montant_estime: number | null
  lots: { numero: string; designation: string; estimation: string | null }[]
  criteres_notation: { critere: string; ponderation: string }[]
  pieces_a_fournir: string[]
  dates_cles: {
    date_limite_offres: string | null
    visite: string | null
    validite_offres: string | null
    autres_dates: { libelle: string; date: string }[]
  }
  points_de_vigilance: string[]
  go_no_go: GoNoGo | null
  /** C4 — documents de l'acheteur à compléter (acte d'engagement, DPGF, cadre technique…) */
  documents_a_remplir: { nom_fichier: string; type_document: string }[]
}

// C2 — statut détaillé par fichier
export type FichierStatut = {
  nom: string
  statut: 'analysé' | 'ignoré'
  raison?: string
}

export type AOMetadata = {
  tronque: boolean
  chars_traites: number
  chars_total: number
  fichiers_lus: string[]
  fichiers_illisibles: string[]
  /** C2 — liste complète avec statut pour chaque fichier reçu */
  fichiers_statuts: FichierStatut[]
  /** C3 — avertissement si pièces essentielles manquantes */
  dossier_incomplet: boolean
  pieces_essentielles_manquantes: string[]
}

export type AnalyserAOState =
  | { data: AOResult; meta: AOMetadata; analyse_id?: string; analyses_restantes?: number }
  | { quota_atteint: true; analyses_utilisees: number; quota_gratuit: number }
  | { error: string }
  | null

// ─── Internal types ───────────────────────────────────────────────────────────

type ProfilRow = {
  raison_sociale: string | null
  ca_dernier_exercice: number | null
  effectif: number | null
  annees_experience: number | null
  certifications: string[] | null
  domaines: string[] | null
  zone_geographique: string | null
  capacite_caution: boolean
}

type ReferenceChantierItem = {
  titre: string
  maitre_ouvrage: string | null
  annee: number | null
  montant: number | null
  site_occupe: boolean
}

type AbonnementRow = {
  plan: string
  analyses_utilisees: number
  quota_gratuit: number
}

// ─── Prompts ──────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `Tu es un expert en marchés publics français. Tu analyses des appels d'offres et tu extrais les informations clés de manière structurée.
Tu réponds UNIQUEMENT avec un objet JSON valide, sans markdown, sans backticks, sans commentaires.`

function buildRefsBlock(refs: ReferenceChantierItem[]): string {
  return refs.map(r => {
    const parts = [r.titre]
    if (r.maitre_ouvrage) parts.push(`maître d'ouvrage : ${r.maitre_ouvrage}`)
    if (r.annee != null) parts.push(`${r.annee}`)
    if (r.montant != null) parts.push(`${r.montant.toLocaleString('fr-FR')} € HT`)
    if (r.site_occupe) parts.push('site occupé')
    return `- ${parts.join(', ')}`
  }).join('\n')
}

function buildUserPrompt(texte: string, nbDocs: number, profil: ProfilRow | null, references: ReferenceChantierItem[], fichiersLus: string[] = []): string {
  const profilBlock = profil ? `

PROFIL DE L'ENTREPRISE (pour l'analyse Go/No-Go) :
- Raison sociale : ${profil.raison_sociale ?? 'non renseigné'}
- CA dernier exercice : ${profil.ca_dernier_exercice != null ? `${profil.ca_dernier_exercice} €` : 'non renseigné'}
- Effectif : ${profil.effectif != null ? `${profil.effectif} personne(s)` : 'non renseigné'}
- Années d'expérience : ${profil.annees_experience != null ? profil.annees_experience : 'non renseigné'}
- Certifications : ${profil.certifications?.length ? profil.certifications.join(', ') : 'aucune renseignée'}
- Domaines d'activité : ${profil.domaines?.length ? profil.domaines.join(', ') : 'non renseignés'}
- Zone géographique : ${profil.zone_geographique ?? 'non renseignée'}
- Capacité caution bancaire : ${profil.capacite_caution ? 'oui' : 'non'}` : ''

  const goNoGoSchema = profil
    ? `  "go_no_go": {
    "verdict": "GO | NO_GO | VIGILANCE",
    "score_eligibilite": 75,
    "criteres": [
      {
        "critere": "string — ex: Chiffre d'affaires, Certification QUALIBAT, Zone géographique",
        "exigence_marche": "string — ce que le DCE exige ou laisse entendre",
        "situation_entreprise": "string — situation du profil ci-dessus",
        "statut": "ok | manquant | incertain"
      }
    ],
    "synthese": "string — 2-3 phrases : verdict, raisons principales, recommandation"
  }`
    : `  "go_no_go": null`

  const refsBlock = profil && references.length > 0 ? `

RÉFÉRENCES CHANTIERS RÉALISÉES (pour valider l'expérience) :
${buildRefsBlock(references)}` : ''

  // C4 — list of uploaded filenames to help identify fillable docs
  const fichiersBlock = fichiersLus.length > 0
    ? `\n\nFICHIERS DÉPOSÉS DANS CE DCE :\n${fichiersLus.map(f => `- ${f}`).join('\n')}`
    : ''

  const goNoGoRules = profil ? `

RÈGLES pour go_no_go :
- Compare UNIQUEMENT les données du profil entreprise ci-dessus aux exigences détectées dans le DCE.
- verdict "NO_GO" si une condition éliminatoire n'est pas remplie (CA insuffisant par rapport aux seuils mentionnés, certification obligatoire absente, zone hors périmètre).
- verdict "GO" si tous les critères vérifiables sont satisfaits.
- verdict "VIGILANCE" si des éléments importants sont incertains ou si le DCE ne précise pas les exigences.
- Inclure dans criteres uniquement les points pertinents (capacités financières, certifications requises, domaines, zone, caution si exigée).
- score_eligibilite : entier de 0 (aucune chance) à 100 (toutes conditions remplies).
- Si une info du profil est "non renseigné", marquer le critère correspondant "incertain".${references.length > 0 ? '\n- RÉFÉRENCES : si des références ci-dessus correspondent au type de marché (domaines, ampleur similaire), les mentionner dans situation_entreprise pour justifier les critères d\'expérience.' : ''}` : ''

  return `Voici le contenu d'un dossier de consultation des entreprises (DCE)${nbDocs > 1 ? ` composé de ${nbDocs} documents` : ''}. Analyse l'ensemble${nbDocs > 1 ? ' en croisant les informations de tous les documents' : ''} et extrais les informations clés en JSON.${profilBlock}${refsBlock}${fichiersBlock}

TEXTE DU DOSSIER :
${texte}

Retourne UNIQUEMENT ce JSON (toutes les clés sont requises, utilise null si l'information est absente) :
{
  "objet": "string — objet ou intitulé du marché",
  "type_procedure": "string — ex: procédure adaptée, appel d'offres ouvert, etc.",
  "acheteur": "string — nom du pouvoir adjudicateur",
  "lieu_execution": "string ou null — commune ou département principal d'exécution des prestations/travaux (ex: 'Paris 15e', 'Gironde', 'Lyon'). null si non mentionné.",
  "siret_acheteur": "string ou null — SIRET (14 chiffres) du pouvoir adjudicateur si mentionné dans le DCE, sinon null",
  "code_cpv": "string ou null — code CPV principal du marché (8 chiffres, ex. 45214210) si mentionné dans le DCE, sinon null",
  "montant_estime": "number ou null — montant estimé du marché ou du lot principal en € HT s'il figure dans le DCE (nombre brut sans unité, ex. 450000), sinon null",
  "lots": [
    { "numero": "string", "designation": "string", "estimation": "string ou null" }
  ],
  "criteres_notation": [
    { "critere": "string", "ponderation": "string" }
  ],
  "pieces_a_fournir": ["string"],
  "dates_cles": {
    "date_limite_offres": "string ou null — date ET heure limite de remise des offres uniquement",
    "visite": "string ou null — visite du site préalable uniquement. Précise si obligatoire ou facultative. Si aucune visite prévue, mettre 'Aucune visite prévue'",
    "validite_offres": "string ou null — durée de validité des offres",
    "autres_dates": [
      { "libelle": "string — ex: Réunion de lancement, Date de démarrage, Limite questions écrites, etc.", "date": "string" }
    ]
  },
  "points_de_vigilance": ["string"],
  "documents_a_remplir": [
    { "nom_fichier": "string — nom exact du fichier parmi FICHIERS DÉPOSÉS ou mentionné dans le DCE", "type_document": "string — ex: Acte d'engagement, DPGF, DQE, BPU, Cadre de réponse technique, Mémoire technique, DC1, DC2, DUME" }
  ],
${goNoGoSchema}
}

RÈGLES STRICTES pour dates_cles :
- date_limite_offres : UNIQUEMENT la date/heure de dépôt des offres. Pas de réunion, pas de visite.
- visite : UNIQUEMENT la visite physique du site. Pas la réunion de lancement.
- autres_dates : tout le reste (réunion de lancement, date prévisionnelle de démarrage, période de questions, notification du marché, etc.)
- Ne duplique jamais une date dans plusieurs champs.

RÈGLES STRICTES pour documents_a_remplir :
- Identifie UNIQUEMENT les documents fournis par l'acheteur que le soumissionnaire doit compléter et retourner : acte d'engagement, DPGF, DQE, BPU, cadre de réponse technique, DC1, DC2, mémoire technique imposé avec grille.
- Si le fichier figure dans FICHIERS DÉPOSÉS, utilise son nom exact. Sinon, utilise le nom mentionné dans le DCE.
- N'inclus pas les documents à rédiger librement (références, RIB, attestations Urssaf) ni les documents informatifs (CCTP, RC, plans).
- Si aucun document à remplir n'est identifiable, retourner [].${goNoGoRules}`
}

// ─── Server action ────────────────────────────────────────────────────────────

// ─── Extracteurs de texte par format ─────────────────────────────────────────

const FORMATS_SUPPORTES = ['.pdf', '.docx', '.doc', '.xlsx', '.xls', '.csv', '.odt', '.zip']

function extensionFichier(name: string): string {
  return name.toLowerCase().match(/\.[^.]+$/)?.[0] ?? ''
}

async function extraireTexte(
  name: string,
  buffer: Buffer
): Promise<{ texte: string } | { ignore: true; raison: string }> {
  const ext = extensionFichier(name)

  // PDF
  if (ext === '.pdf') {
    try {
      const pdf = await getDocumentProxy(new Uint8Array(buffer))
      const { text } = await extractText(pdf, { mergePages: true })
      const t = text?.trim() ?? ''
      if (t.length < 80) return { ignore: true, raison: 'PDF sans texte sélectionnable (scan image ?)' }
      return { texte: t }
    } catch {
      return { ignore: true, raison: 'Erreur de lecture PDF' }
    }
  }

  // Word .docx / .doc
  if (ext === '.docx' || ext === '.doc') {
    try {
      const mammoth = await import('mammoth')
      const res = await mammoth.extractRawText({ buffer })
      const t = res.value?.trim() ?? ''
      if (t.length < 80) return { ignore: true, raison: 'Fichier Word vide ou illisible' }
      return { texte: t }
    } catch {
      return { ignore: true, raison: 'Erreur de lecture Word' }
    }
  }

  // Excel .xlsx / .xls
  if (ext === '.xlsx' || ext === '.xls') {
    try {
      const XLSX = await import('xlsx')
      const wb = XLSX.read(buffer, { type: 'buffer' })
      const parts: string[] = []
      for (const sheetName of wb.SheetNames) {
        const ws = wb.Sheets[sheetName]
        const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: '' })
        const lines = (rows as (string | number)[][])
          .filter(row => row.some(cell => cell !== '' && cell !== null && cell !== undefined))
          .map(row => row.map(cell => String(cell ?? '')).join('\t'))
        if (lines.length > 0) {
          parts.push(`--- Feuille : ${sheetName} ---\n${lines.join('\n')}`)
        }
      }
      const t = parts.join('\n\n').trim()
      if (t.length < 20) return { ignore: true, raison: 'Fichier Excel vide' }
      return { texte: t }
    } catch {
      return { ignore: true, raison: 'Erreur de lecture Excel' }
    }
  }

  // CSV
  if (ext === '.csv') {
    try {
      const t = buffer.toString('utf-8').trim()
      if (t.length < 20) return { ignore: true, raison: 'Fichier CSV vide' }
      return { texte: t }
    } catch {
      return { ignore: true, raison: 'Erreur de lecture CSV' }
    }
  }

  // ODT (texte brut via XML zip)
  if (ext === '.odt') {
    try {
      const zip = await JSZip.loadAsync(buffer)
      const content = zip.file('content.xml')
      if (!content) return { ignore: true, raison: 'Fichier ODT invalide' }
      const xml = await content.async('text')
      // Strip XML tags
      const t = xml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
      if (t.length < 80) return { ignore: true, raison: 'Fichier ODT vide' }
      return { texte: t }
    } catch {
      return { ignore: true, raison: 'Erreur de lecture ODT' }
    }
  }

  return { ignore: true, raison: `Format non pris en charge (${ext || 'inconnu'})` }
}

// C3 — Detect if essential DCE documents are present
function detecterDossierIncomplet(fichiersLus: string[]): { incomplet: boolean; manquants: string[] } {
  const all = fichiersLus.map(n => n.toLowerCase())
  const hasRC = all.some(n => /r[eèé]glement|r\.c\.|rc[_\s-]|reglement.consult/i.test(n))
  const hasCCTP = all.some(n => /cctp|cahier.*(clauses|technique)|technique.*prestations/i.test(n))
  const manquants: string[] = []
  if (!hasRC) manquants.push('Règlement de consultation (RC)')
  if (!hasCCTP) manquants.push('Cahier des clauses techniques particulières (CCTP)')
  return { incomplet: manquants.length > 0, manquants }
}

export async function analyserAO(formData: FormData): Promise<AnalyserAOState> {
  try {
    const files = (formData.getAll('files') as File[]).filter(f => f.size > 0)
    if (files.length === 0) return { error: 'Aucun fichier reçu.' }

    // C1 — Expand ZIP files into their contents
    const expanded: { name: string; buffer: Buffer }[] = []
    for (const file of files) {
      const ext = extensionFichier(file.name)
      const buf = Buffer.from(await file.arrayBuffer())
      if (ext === '.zip') {
        try {
          const zip = await JSZip.loadAsync(buf)
          for (const [path, entry] of Object.entries(zip.files)) {
            if (entry.dir) continue
            const fname = path.split('/').pop() ?? path
            if (fname.startsWith('.') || fname.startsWith('__MACOSX')) continue
            const subExt = extensionFichier(fname)
            if (!FORMATS_SUPPORTES.includes(subExt)) continue
            const subBuf = Buffer.from(await entry.async('arraybuffer'))
            expanded.push({ name: fname, buffer: subBuf })
          }
        } catch {
          expanded.push({ name: file.name, buffer: buf }) // traiter comme fichier brut si unzip échoue
        }
      } else {
        expanded.push({ name: file.name, buffer: buf })
      }
    }

    // C2 — Extract text + build status for each file
    const fichiers_lus: string[] = []
    const fichiers_illisibles: string[] = []
    const fichiers_statuts: FichierStatut[] = []
    const parts: string[] = []

    // Guard total size (Vercel)
    const MAX_UPLOAD_BYTES = 4 * 1024 * 1024
    let totalBytes = 0

    for (const { name, buffer } of expanded) {
      const ext = extensionFichier(name)
      if (!FORMATS_SUPPORTES.includes(ext)) {
        fichiers_statuts.push({ nom: name, statut: 'ignoré', raison: `Format non pris en charge (${ext || 'inconnu'})` })
        continue
      }
      totalBytes += buffer.length
      if (totalBytes > MAX_UPLOAD_BYTES) {
        fichiers_statuts.push({ nom: name, statut: 'ignoré', raison: 'Volume total trop important — déposer séparément' })
        continue
      }

      const res = await extraireTexte(name, buffer)
      if ('ignore' in res) {
        fichiers_illisibles.push(name)
        fichiers_statuts.push({ nom: name, statut: 'ignoré', raison: res.raison })
      } else {
        fichiers_lus.push(name)
        fichiers_statuts.push({ nom: name, statut: 'analysé' })
        parts.push(`\n\n===== DOCUMENT : ${name} =====\n\n${res.texte}`)
      }
    }

    if (fichiers_lus.length === 0) {
      return { error: 'Aucun fichier lisible. Les PDFs sont peut-être des scans image sans texte sélectionnable. Formats acceptés : PDF, Word (.docx), Excel (.xlsx), CSV, ODT, ZIP.' }
    }

    // C3 — Check for missing essential documents
    const { incomplet: dossier_incomplet, manquants: pieces_essentielles_manquantes } = detecterDossierIncomplet(fichiers_lus)

    const texteTotal = parts.join('')
    const LIMIT = 500000
    const tronque = texteTotal.length > LIMIT
    const texteEnvoye = tronque ? texteTotal.slice(0, LIMIT) : texteTotal
    const meta: AOMetadata = {
      tronque,
      chars_traites: texteEnvoye.length,
      chars_total: texteTotal.length,
      fichiers_lus,
      fichiers_illisibles,
      fichiers_statuts,
      dossier_incomplet,
      pieces_essentielles_manquantes,
    }

    // Load user
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // ── Quota check (BEFORE Claude call) ─────────────────────────────────────
    let abonnement: AbonnementRow | null = null
    if (user) {
      const { data: existingAbo } = await supabase
        .from('abonnements')
        .select('plan, analyses_utilisees, quota_gratuit')
        .maybeSingle()

      if (!existingAbo) {
        const { data: newAbo, error: createError } = await supabase
          .from('abonnements')
          .insert({ user_id: user.id })
          .select('plan, analyses_utilisees, quota_gratuit')
          .single()
        if (createError) {
          console.error('[analyserAO] create abonnement failed:', createError)
        } else {
          abonnement = newAbo as AbonnementRow
        }
      } else {
        abonnement = existingAbo as AbonnementRow
      }

      if (abonnement && abonnement.plan === 'gratuit' && abonnement.analyses_utilisees >= abonnement.quota_gratuit) {
        return {
          quota_atteint: true,
          analyses_utilisees: abonnement.analyses_utilisees,
          quota_gratuit: abonnement.quota_gratuit,
        }
      }
    }

    // Load profil + references for Go/No-Go (in parallel)
    let profil: ProfilRow | null = null
    let references: ReferenceChantierItem[] = []
    if (user) {
      const [{ data: profilData }, { data: refsData }] = await Promise.all([
        supabase
          .from('profil_entreprise')
          .select('raison_sociale, ca_dernier_exercice, effectif, annees_experience, certifications, domaines, zone_geographique, capacite_caution')
          .maybeSingle(),
        supabase
          .from('references_chantiers')
          .select('titre, maitre_ouvrage, annee, montant, site_occupe')
          .order('annee', { ascending: false }),
      ])
      profil = profilData as ProfilRow | null
      references = (refsData ?? []) as ReferenceChantierItem[]
    }

    // Call Claude
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: profil ? 8192 : 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: buildUserPrompt(texteEnvoye, fichiers_lus.length, profil, references, fichiers_lus) }],
    })

    const content = message.content[0].type === 'text' ? message.content[0].text : ''
    const firstBrace = content.indexOf('{')
    const lastBrace = content.lastIndexOf('}')
    if (firstBrace === -1 || lastBrace === -1) {
      return { error: 'Réponse inattendue du modèle. Réessaie.' }
    }
    const cleaned = content.slice(firstBrace, lastBrace + 1)

    let data: AOResult
    try {
      data = JSON.parse(cleaned)
    } catch {
      console.error('[analyserAO] JSON parse failed:', cleaned)
      return { error: 'Impossible de parser la réponse du modèle. Réessaie.' }
    }

    // Analysis succeeded — persist and update quota
    let analyse_id: string | undefined
    if (user) {
      // Save analysis to DB
      try {
        const { data: inserted, error: insertError } = await supabase
          .from('analyses')
          .insert({
            user_id: user.id,
            nom_fichier: files.map(f => f.name).join(', '),
            objet_marche: data.objet,
            resultat: data,
            tronque,
          })
          .select('id')
          .single()
        if (insertError) {
          console.error('[analyserAO] insert failed:', insertError)
        } else {
          analyse_id = inserted.id as string
        }
      } catch (saveErr) {
        console.error('[analyserAO] save error:', saveErr)
      }

      // Increment quota counter — via admin client (RLS bypassed, UPDATE policy removed)
      if (abonnement) {
        try {
          const { error: incrError } = await getSupabaseAdmin()
            .from('abonnements')
            .update({
              analyses_utilisees: abonnement.analyses_utilisees + 1,
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', user.id)
          if (incrError) console.error('[analyserAO] quota increment failed:', incrError)
        } catch (incrErr) {
          console.error('[analyserAO] quota increment error:', incrErr)
        }
      }
    }

    const analyses_restantes = abonnement?.plan === 'gratuit'
      ? Math.max(0, abonnement.quota_gratuit - abonnement.analyses_utilisees - 1)
      : undefined

    return { data, meta, analyse_id, analyses_restantes }
  } catch (err) {
    console.error('[analyserAO]', err)
    return { error: "Erreur lors de l'analyse. Vérifie les fichiers et réessaie." }
  }
}
