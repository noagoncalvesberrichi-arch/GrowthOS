// Pure utilities — no server directive, importable from both server and client

export const DEPT_NAMES: Record<string, string> = {
  '01': 'Ain', '02': 'Aisne', '03': 'Allier', '04': 'Alpes-de-Haute-Provence',
  '05': 'Hautes-Alpes', '06': 'Alpes-Maritimes', '07': 'Ardèche', '08': 'Ardennes',
  '09': 'Ariège', '10': 'Aube', '11': 'Aude', '12': 'Aveyron',
  '13': 'Bouches-du-Rhône', '14': 'Calvados', '15': 'Cantal', '16': 'Charente',
  '17': 'Charente-Maritime', '18': 'Cher', '19': 'Corrèze',
  '2A': 'Corse-du-Sud', '2B': 'Haute-Corse',
  '21': "Côte-d'Or", '22': "Côtes-d'Armor", '23': 'Creuse',
  '24': 'Dordogne', '25': 'Doubs', '26': 'Drôme', '27': 'Eure',
  '28': 'Eure-et-Loir', '29': 'Finistère', '30': 'Gard', '31': 'Haute-Garonne',
  '32': 'Gers', '33': 'Gironde', '34': 'Hérault', '35': 'Ille-et-Vilaine',
  '36': 'Indre', '37': 'Indre-et-Loire', '38': 'Isère', '39': 'Jura',
  '40': 'Landes', '41': 'Loir-et-Cher', '42': 'Loire', '43': 'Haute-Loire',
  '44': 'Loire-Atlantique', '45': 'Loiret', '46': 'Lot', '47': 'Lot-et-Garonne',
  '48': 'Lozère', '49': 'Maine-et-Loire', '50': 'Manche', '51': 'Marne',
  '52': 'Haute-Marne', '53': 'Mayenne', '54': 'Meurthe-et-Moselle', '55': 'Meuse',
  '56': 'Morbihan', '57': 'Moselle', '58': 'Nièvre', '59': 'Nord',
  '60': 'Oise', '61': 'Orne', '62': 'Pas-de-Calais', '63': 'Puy-de-Dôme',
  '64': 'Pyrénées-Atlantiques', '65': 'Hautes-Pyrénées', '66': 'Pyrénées-Orientales',
  '67': 'Bas-Rhin', '68': 'Haut-Rhin', '69': 'Rhône', '70': 'Haute-Saône',
  '71': 'Saône-et-Loire', '72': 'Sarthe', '73': 'Savoie', '74': 'Haute-Savoie',
  '75': 'Paris', '76': 'Seine-Maritime', '77': 'Seine-et-Marne', '78': 'Yvelines',
  '79': 'Deux-Sèvres', '80': 'Somme', '81': 'Tarn', '82': 'Tarn-et-Garonne',
  '83': 'Var', '84': 'Vaucluse', '85': 'Vendée', '86': 'Vienne',
  '87': 'Haute-Vienne', '88': 'Vosges', '89': 'Yonne',
  '90': 'Territoire de Belfort', '91': 'Essonne', '92': 'Hauts-de-Seine',
  '93': 'Seine-Saint-Denis', '94': 'Val-de-Marne', '95': "Val-d'Oise",
}

// Normalize: remove accents, lowercase
function norm(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
}

const REGION_TO_DEPTS: [string, string[]][] = [
  ['ile-de-france', ['75', '77', '78', '91', '92', '93', '94', '95']],
  ['auvergne-rhone-alpes', ['01', '03', '07', '15', '26', '38', '42', '43', '63', '69', '73', '74']],
  ['provence-alpes-cote d azur', ['04', '05', '06', '13', '83', '84']],
  ['paca', ['04', '05', '06', '13', '83', '84']],
  ['occitanie', ['09', '11', '12', '30', '31', '32', '34', '46', '48', '65', '66', '81', '82']],
  ['nouvelle-aquitaine', ['16', '17', '19', '23', '24', '33', '40', '47', '64', '79', '86', '87']],
  ['bretagne', ['22', '29', '35', '56']],
  ['normandie', ['14', '27', '50', '61', '76']],
  ['hauts-de-france', ['02', '59', '60', '62', '80']],
  ['grand est', ['08', '10', '51', '52', '54', '55', '57', '67', '68', '88']],
  ['pays de la loire', ['44', '49', '53', '72', '85']],
  ['centre-val de loire', ['18', '28', '36', '37', '41', '45']],
  ['bourgogne-franche-comte', ['21', '25', '39', '58', '70', '71', '89', '90']],
  ['corse', ['2A', '2B']],
]

export function extractDepts(zone: string | null): string[] {
  if (!zone) return []

  // Extract explicit 2-digit codes
  const explicit = zone.match(/\b\d{2}\b/g)
  if (explicit && explicit.length > 0) return [...new Set(explicit)]

  // Match against region names
  const normalized = norm(zone)
  for (const [regionKey, depts] of REGION_TO_DEPTS) {
    if (normalized.includes(regionKey) || regionKey.includes(normalized.split(' ')[0])) {
      return depts
    }
  }

  return []
}

// Domain expansions: for each key word found in domain, add synonyms
const DOMAIN_EXPANSIONS: [string, string[]][] = [
  ['electri', ['électrique', 'courants forts', 'courant fort', 'installation électrique']],
  ['plomberi', ['sanitaire', 'plomberie', 'eau potable']],
  ['chauffage', ['CVC', 'climatisation', 'ventilation']],
  ['cvc', ['chauffage', 'climatisation', 'ventilation', 'génie climatique']],
  ['genie civil', ['terrassement', 'voirie', 'VRD', 'réseaux']],
  ['vrd', ['voirie', 'réseaux', 'terrassement', 'génie civil']],
  ['informatique', ['numérique', 'logiciel', 'système information', 'digital']],
  ['numerique', ['informatique', 'logiciel', 'système information']],
  ['nettoyage', ['propreté', 'hygiène', 'entretien des locaux']],
  ['securite', ['gardiennage', 'surveillance', 'sûreté']],
  ['menuiseri', ['charpente', 'fermeture', 'fenêtre', 'porte']],
  ['peinture', ['revêtement', 'ravalement', 'enduit']],
  ['maconneri', ["gros œuvre", 'béton', 'construction']],
  ['assainissement', ['réseau eau', 'épuration', 'eaux usées', 'pluvial']],
  ['espaces verts', ['jardinage', 'entretien végétal', 'paysage']],
  ['restauration', ['cuisine', 'traiteur', 'alimentation']],
  ['formation', ['enseignement', 'apprentissage', 'stage']],
  ['transport', ['logistique', 'livraison', 'fret']],
  ['ascenseur', ['élévateur', 'levage', 'monte-charge']],
  ['toiture', ['couverture', 'zinguerie', 'étanchéité']],
  ['etancheite', ['toiture', 'couverture', 'imperméabilisation']],
]

export function expandDomainKeywords(domaines: string[]): string[] {
  if (!domaines.length) return []

  const keywords = new Set<string>()

  for (const domaine of domaines) {
    // Always include the original domain word(s) — strip short words
    for (const word of domaine.split(/\s+/)) {
      if (word.length >= 4) keywords.add(domaine) // keep full phrase
    }

    const normalized = norm(domaine)

    for (const [key, expansions] of DOMAIN_EXPANSIONS) {
      if (normalized.includes(key)) {
        for (const exp of expansions) keywords.add(exp)
      }
    }
  }

  // Cap at 8 keywords to keep ODSQL query length reasonable
  return [...keywords].slice(0, 8)
}
