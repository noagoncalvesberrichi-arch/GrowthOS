import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { anthropic } from '@/lib/anthropic'
import { parseXlsx } from '@/lib/chiffrage/excelParser'
import type { SheetAnalysis, ColumnMapping } from '@/lib/chiffrage/types'

export const maxDuration = 60

const MAX_FILE_BYTES = 10 * 1024 * 1024 // 10 MB
const MAX_CHIFFRAGES_PER_DAY = 20

async function checkAuth() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return { supabase, user }
}

export async function POST(req: NextRequest) {
  try {
    const { supabase, user } = await checkAuth()
    if (!user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

    // Plan check
    const { data: aboData } = await supabase
      .from('abonnements')
      .select('plan')
      .maybeSingle()
    const plan: string = (aboData as { plan: string } | null)?.plan ?? 'gratuit'
    if (plan !== 'pro' && !plan.startsWith('essai_pro') && plan !== 'fondateurs') {
      return NextResponse.json({ error: 'Fonctionnalité réservée au plan Pro.' }, { status: 403 })
    }

    // Rate limit
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const { count } = await supabase
      .from('chiffrages')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today.toISOString())
    if ((count ?? 0) >= MAX_CHIFFRAGES_PER_DAY) {
      return NextResponse.json({ error: 'Limite journalière atteinte (20 chiffrages/jour).' }, { status: 429 })
    }

    const formData = await req.formData()
    const acheteurFile = formData.get('acheteur') as File | null
    const crmFile = formData.get('crm') as File | null

    if (!acheteurFile || !crmFile) {
      return NextResponse.json({ error: 'Les deux fichiers sont requis.' }, { status: 400 })
    }
    if (acheteurFile.size > MAX_FILE_BYTES || crmFile.size > MAX_FILE_BYTES) {
      return NextResponse.json({ error: 'Fichier trop volumineux (max 10 Mo).' }, { status: 400 })
    }

    const [acheteurBuf, crmBuf] = await Promise.all([
      acheteurFile.arrayBuffer(),
      crmFile.arrayBuffer(),
    ])

    const [acheteur, crm] = await Promise.all([
      parseXlsx(acheteurBuf, acheteurFile.name),
      parseXlsx(crmBuf, crmFile.name),
    ])

    // Claude disambiguation for ambiguous sheets
    const ambiguousSheets = [
      ...acheteur.sheets.filter(s => s.mappingAmbiguous && !s.isHidden).map(s => ({ file: 'acheteur' as const, sheet: s })),
      ...crm.sheets.filter(s => s.mappingAmbiguous && !s.isHidden).map(s => ({ file: 'crm' as const, sheet: s })),
    ]

    await Promise.all(ambiguousSheets.map(async ({ file, sheet }) => {
      try {
        const preview = sheet.rawRows.slice(0, 15).map(r => r.values)
        const msg = await anthropic.messages.create({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 256,
          system: 'Tu identifies les colonnes d\'un tableau Excel de marché public. Réponds UNIQUEMENT avec un objet JSON contenant les indices de colonnes (0-based) pour chaque rôle détecté, sans aucun texte autour.',
          messages: [{
            role: 'user',
            content: `Fichier: ${file === 'acheteur' ? acheteur.fileName : crm.fileName}\nOnglet: ${sheet.sheetName}\nEn-têtes (indices 0-based): ${JSON.stringify(sheet.headerValues)}\nPremières lignes: ${JSON.stringify(preview)}\n\nRenvoie un objet JSON: { "designation"?: number, "unit"?: number, "quantity"?: number, "pu_ht"?: number, "total_ht"?: number, "numero"?: number }`,
          }],
        })
        const text = msg.content[0].type === 'text' ? msg.content[0].text : ''
        const firstBrace = text.indexOf('{')
        const lastBrace = text.lastIndexOf('}')
        if (firstBrace >= 0 && lastBrace >= 0) {
          const parsed = JSON.parse(text.slice(firstBrace, lastBrace + 1)) as ColumnMapping
          const targetFile = file === 'acheteur' ? acheteur : crm
          const targetSheet = targetFile.sheets.find(s => s.sheetName === sheet.sheetName)
          if (targetSheet) {
            Object.assign(targetSheet.mapping, parsed)
            targetSheet.mappingAmbiguous = false
          }
        }
      } catch { /* keep original detection on error */ }
    }))

    return NextResponse.json({ acheteur, crm })
  } catch (err) {
    console.error('[chiffrage/analyser]', err)
    return NextResponse.json({ error: 'Erreur lors de l\'analyse. Vérifiez vos fichiers.' }, { status: 500 })
  }
}
