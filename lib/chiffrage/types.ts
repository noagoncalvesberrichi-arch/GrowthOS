export type ColumnRole = 'numero' | 'designation' | 'unit' | 'quantity' | 'pu_ht' | 'total_ht'
export type ColumnMapping = Partial<Record<ColumnRole, number>>

export type RawRow = {
  rowIndex: number
  values: (string | number | boolean | null)[]
  isTitle: boolean
  isSubtotal: boolean
  formulaCols: number[]
}

export type SheetAnalysis = {
  sheetName: string
  sheetIndex: number
  isHidden: boolean
  headerRowIndex: number
  headerValues: string[]
  mapping: ColumnMapping
  mappingAmbiguous: boolean
  rawRows: RawRow[]
}

export type FileAnalysis = {
  fileName: string
  sheets: SheetAnalysis[]
}

export type ParsedRow = {
  id: string
  sheetName: string
  rowIndex: number
  isTitle: boolean
  isSubtotal: boolean
  numero: string | null
  designation: string | null
  unit: string | null
  quantity: number | null
  pu_ht: number | null
  total_ht: number | null
  totalHasFormula: boolean
}

export type MatchedRow = {
  acheteurRowId: string
  crmRowId: string | null
  confidence: number
  pu_ht_crm: number | null
  quantityMismatch: boolean
}

export type GenererResult =
  | { ok: true; montantTotalHt: number; nbLignes: number; nbRapprochees: number; avertissements: string[] }
  | { error: string }
