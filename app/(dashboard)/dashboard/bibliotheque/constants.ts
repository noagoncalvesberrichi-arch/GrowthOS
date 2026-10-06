export const CATEGORIES = [
  { id: 'presentation',      label: 'Présentation entreprise' },
  { id: 'moyens_humains',    label: 'Moyens humains' },
  { id: 'moyens_materiels',  label: 'Moyens matériels' },
  { id: 'procede_execution', label: "Procédés d'exécution" },
  { id: 'securite',          label: 'Sécurité / SST' },
  { id: 'environnement',     label: 'Environnement' },
  { id: 'qualite',           label: 'Qualité' },
  { id: 'planning',          label: 'Planning' },
  { id: 'autre',             label: 'Autre' },
] as const

export type CategorieId = typeof CATEGORIES[number]['id']
