import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { anthropic } from '@/lib/anthropic'
import { applyMapping, matchRows } from '@/lib/chiffrage/rowMatching'
import { parseNumber } from '@/lib/chiffrage/normalize'
import type { FileAnalysis, ColumnMapping, MatchedRow, ParsedRow } from '@/lib/chiffrage/types'

export const maxDuration = 60

type RapprochBody = {
  acheteur: FileAnalysis
  crm: FileAnalysis
  acheteurMappings: Record<string, ColumnMapping>
  crmMappings: Record<string, ColumnMapping>
}

// Returns true if a CRM sheet has at least one non-null price
function sheetHasPrices(sheet: { rawRows: { values: (string | number | boolean | null)[] }[] }, puIdx: number | undefined): boolean {
  if (puIdx === undefined) return false
  return sheet.rawRows.some(raw => {
    const v = raw.values[puIdx]
    return typeof v === 'number' && v > 0
  })
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

    const body = await req.json() as RapprochBody
    const { acheteur, crm, acheteurMappings, crmMappings } = body

    // Build acheteur ParsedRows from ALL visible sheets
    const acheteurRows: ParsedRow[] = []
    for (const sheet of acheteur.sheets) {
      if (sheet.isHidden) continue
      const mapping = acheteurMappings[sheet.sheetName] ?? sheet.mapping
      for (const raw of sheet.rawRows) {
        const row = applyMapping(raw, mapping, sheet.sheetName)
        if (!row.isTitle && !row.isSubtotal && row.designation) {
          acheteurRows.push(row)
        }
      }
    }

    // Build CRM ParsedRows — auto-select ONLY the sheet(s) that have prices.
    // This prevents a "Devis Non Chiffré" sheet from overwriting the priced sheet.
    const visibleCrmSheets = crm.sheets.filter(s => !s.isHidden)
    const crmSheetsWithPrices = visibleCrmSheets.filter(sheet => {
      const mapping = crmMappings[sheet.sheetName] ?? sheet.mapping
      return sheetHasPrices(sheet, mapping.pu_ht)
    })
    const crmSheetsToUse = crmSheetsWithPrices.length > 0 ? crmSheetsWithPrices : visibleCrmSheets

    const crmRows: ParsedRow[] = []
    for (const sheet of crmSheetsToUse) {
      const mapping = crmMappings[sheet.sheetName] ?? sheet.mapping
      for (const raw of sheet.rawRows) {
        const row = applyMapping(raw, mapping, sheet.sheetName)
        if (!row.isTitle && !row.isSubtotal && row.designation) {
          // Filter out rows without prices even within selected sheets
          // (to avoid section total rows or zero-price entries overwriting real prices)
          if (crmSheetsWithPrices.length > 0) {
            const puVal = parseNumber(row.pu_ht as unknown as string | number | null)
            if (puVal == null || puVal === 0) continue
          }
          crmRows.push(row)
        }
      }
    }

    const { matched, unmatched } = matchRows(acheteurRows, crmRows)
    const allMatches: MatchedRow[] = [...matched]

    // Claude batch for unmatched rows
    if (unmatched.length > 0) {
      try {
        const msg = await anthropic.messages.create({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 2048,
          system: 'Tu rapproches des lignes d\'un bordereau de prix avec les lignes du devis entreprise. IMPORTANT : rapproche d\'abord par désignation, le numéro de poste est secondaire. Réponds UNIQUEMENT avec un tableau JSON, sans aucun texte autour.',
          messages: [{
            role: 'user',
            content: `Lignes acheteur non rapprochées:\n${JSON.stringify(unmatched.map((r, i) => ({ idx: i, designation: r.designation, numero: r.numero, unite: r.unit })))}\n\nToutes les lignes devis disponibles:\n${JSON.stringify(crmRows.map((r, i) => ({ idx: i, designation: r.designation, numero: r.numero, pu_ht: r.pu_ht })))}\n\nRéponds avec un tableau JSON: [{"acheteur_idx": number, "crm_idx": number|null, "confiance": number}] où confiance est entre 0 et 1. crm_idx = null si aucune correspondance trouvée.`,
          }],
        })
        const text = msg.content[0].type === 'text' ? msg.content[0].text : ''
        const firstBracket = text.indexOf('[')
        const lastBracket = text.lastIndexOf(']')
        if (firstBracket >= 0 && lastBracket >= 0) {
          const results = JSON.parse(text.slice(firstBracket, lastBracket + 1)) as { acheteur_idx: number; crm_idx: number | null; confiance: number }[]
          for (const r of results) {
            const aRow = unmatched[r.acheteur_idx]
            if (!aRow) continue
            const cRow = r.crm_idx != null ? crmRows[r.crm_idx] : null
            const unitMismatch =
              aRow.unit != null && cRow?.unit != null &&
              aRow.unit.toLowerCase().trim() !== cRow.unit.toLowerCase().trim()
            allMatches.push({
              acheteurRowId: aRow.id,
              crmRowId: cRow?.id ?? null,
              confidence: r.confiance ?? 0,
              pu_ht_crm: cRow?.pu_ht ?? null,
              qty_crm: cRow?.quantity ?? null,
              unit_acheteur: aRow.unit,
              unit_crm: cRow?.unit ?? null,
              quantityMismatch: aRow.quantity != null && cRow?.quantity != null && aRow.quantity !== cRow.quantity,
              unitMismatch,
              numeroMismatch: false,
            })
          }
          // Add rows Claude didn't handle
          const claudeHandled = new Set(results.map(r => unmatched[r.acheteur_idx]?.id))
          for (const uRow of unmatched) {
            if (!claudeHandled.has(uRow.id)) {
              allMatches.push({ acheteurRowId: uRow.id, crmRowId: null, confidence: 0, pu_ht_crm: null, qty_crm: null, unit_acheteur: uRow.unit, unit_crm: null, quantityMismatch: false, unitMismatch: false, numeroMismatch: false })
            }
          }
        } else {
          for (const uRow of unmatched) {
            allMatches.push({ acheteurRowId: uRow.id, crmRowId: null, confidence: 0, pu_ht_crm: null, qty_crm: null, unit_acheteur: uRow.unit, unit_crm: null, quantityMismatch: false, unitMismatch: false, numeroMismatch: false })
          }
        }
      } catch {
        for (const uRow of unmatched) {
          allMatches.push({ acheteurRowId: uRow.id, crmRowId: null, confidence: 0, pu_ht_crm: null, qty_crm: null, unit_acheteur: uRow.unit, unit_crm: null, quantityMismatch: false, unitMismatch: false, numeroMismatch: false })
        }
      }
    }

    return NextResponse.json({ matches: allMatches })
  } catch (err) {
    console.error('[chiffrage/rapprocher]', err)
    return NextResponse.json({ error: 'Erreur lors du rapprochement.' }, { status: 500 })
  }
}
