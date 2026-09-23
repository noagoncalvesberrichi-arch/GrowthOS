import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { anthropic } from '@/lib/anthropic'
import { applyMapping, matchRows } from '@/lib/chiffrage/rowMatching'
import type { FileAnalysis, ColumnMapping, MatchedRow, ParsedRow } from '@/lib/chiffrage/types'

export const maxDuration = 60

type RapprochBody = {
  acheteur: FileAnalysis
  crm: FileAnalysis
  acheteurMappings: Record<string, ColumnMapping>
  crmMappings: Record<string, ColumnMapping>
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

    const body = await req.json() as RapprochBody
    const { acheteur, crm, acheteurMappings, crmMappings } = body

    // Build ParsedRows from raw rows using user-confirmed mappings
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

    const crmRows: ParsedRow[] = []
    for (const sheet of crm.sheets) {
      if (sheet.isHidden) continue
      const mapping = crmMappings[sheet.sheetName] ?? sheet.mapping
      for (const raw of sheet.rawRows) {
        const row = applyMapping(raw, mapping, sheet.sheetName)
        if (!row.isTitle && !row.isSubtotal && row.designation) {
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
          system: 'Tu rapproches des lignes d\'un bordereau de prix avec les lignes du CRM de l\'entreprise. Réponds UNIQUEMENT avec un tableau JSON, sans aucun texte autour.',
          messages: [{
            role: 'user',
            content: `Lignes acheteur non rapprochées:\n${JSON.stringify(unmatched.map((r, i) => ({ idx: i, designation: r.designation, unite: r.unit })))}\n\nToutes les lignes CRM disponibles:\n${JSON.stringify(crmRows.map((r, i) => ({ idx: i, designation: r.designation })))}\n\nRéponds avec un tableau JSON: [{"acheteur_idx": number, "crm_idx": number|null, "confiance": number}] où confiance est entre 0 et 1. crm_idx = null si aucune correspondance trouvée.`,
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
            allMatches.push({
              acheteurRowId: aRow.id,
              crmRowId: cRow?.id ?? null,
              confidence: r.confiance ?? 0,
              pu_ht_crm: cRow?.pu_ht ?? null,
              quantityMismatch: aRow.quantity != null && cRow?.quantity != null && aRow.quantity !== cRow.quantity,
            })
          }
          // Add unmatched rows that Claude also couldn't match (missing from Claude response)
          const claudeHandled = new Set(results.map(r => unmatched[r.acheteur_idx]?.id))
          for (const uRow of unmatched) {
            if (!claudeHandled.has(uRow.id)) {
              allMatches.push({ acheteurRowId: uRow.id, crmRowId: null, confidence: 0, pu_ht_crm: null, quantityMismatch: false })
            }
          }
        } else {
          // Claude returned no usable response — mark all as unmatched
          for (const uRow of unmatched) {
            allMatches.push({ acheteurRowId: uRow.id, crmRowId: null, confidence: 0, pu_ht_crm: null, quantityMismatch: false })
          }
        }
      } catch {
        for (const uRow of unmatched) {
          allMatches.push({ acheteurRowId: uRow.id, crmRowId: null, confidence: 0, pu_ht_crm: null, quantityMismatch: false })
        }
      }
    }

    return NextResponse.json({ matches: allMatches })
  } catch (err) {
    console.error('[chiffrage/rapprocher]', err)
    return NextResponse.json({ error: 'Erreur lors du rapprochement.' }, { status: 500 })
  }
}
