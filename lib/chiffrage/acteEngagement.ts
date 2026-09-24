import { montantEnLettres } from '@/lib/montantEnLettres'

export type ActeData = {
  objet: string
  acheteur: string
  raison_sociale: string
  forme_juridique: string
  adresse_siege: string
  siret: string
  nom_signataire: string
  qualite_signataire: string
  iban: string | null
  bic: string | null
  montant_ht: number
  taux_tva: number
  duree_marche: string
  lieu_execution: string
}

function formatEuro(n: number): string {
  return n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'
}

const DOTS   = '………………………………………………'
const DOTS_S = '…………………'

function val(s: string | null | undefined): string {
  return s && s.trim() ? s : DOTS
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function buildDocument(data: ActeData): Promise<any> {
  const {
    Document, Paragraph, TextRun, Table, TableRow, TableCell,
    WidthType, AlignmentType, BorderStyle, HeightRule, Footer, PageNumber, ShadingType,
  } = await import('docx')

  const montant_tva = Math.round(data.montant_ht * data.taux_tva / 100 * 100) / 100
  const montant_ttc = Math.round(data.montant_ht * (1 + data.taux_tva / 100) * 100) / 100

  const F = 'Arial'
  const B = 20  // 10 pt
  const H = 22  // 11 pt

  // A4 with 2 cm margins: usable width = 210 mm − 40 mm = 170 mm ≈ 9638 twips
  const PW  = 9638
  const L38 = Math.round(PW * 0.38)   // label col  ≈ 3662
  const V62 = PW - L38                 // value col  ≈ 5976
  const H50 = Math.round(PW / 2)       // half       ≈ 4819
  const T33 = Math.round(PW / 3)       // third      ≈ 3213

  const DXA  = WidthType.DXA
  const thin = { style: BorderStyle.SINGLE, size: 4, color: 'BBBBBB' }
  const allThin = { top: thin, bottom: thin, left: thin, right: thin, insideHorizontal: thin, insideVertical: thin }
  const GRAY = { type: ShadingType.SOLID, fill: 'F2F2F2' }

  // ── Cell helpers ────────────────────────────────────────────────────────────

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function headerCell(text: string, widthDxa: number, span = 1): any {
    return new TableCell({
      columnSpan: span > 1 ? span : undefined,
      width: { size: widthDxa, type: DXA },
      shading: GRAY,
      children: [new Paragraph({
        children: [new TextRun({ text, bold: true, size: H, font: F })],
        spacing: { before: 80, after: 80 },
      })],
    })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function lCell(text: string): any {
    return new TableCell({
      width: { size: L38, type: DXA },
      children: [new Paragraph({
        children: [new TextRun({ text, bold: true, size: B, font: F })],
        spacing: { before: 80, after: 80 },
      })],
    })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function vCell(text: string, widthDxa = V62): any {
    return new TableCell({
      width: { size: widthDxa, type: DXA },
      children: [new Paragraph({
        children: [new TextRun({ text, size: B, font: F })],
        spacing: { before: 80, after: 80 },
      })],
    })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function amtCell(text: string, isHeader: boolean): any {
    if (isHeader) {
      return new TableCell({
        width: { size: T33, type: DXA },
        shading: GRAY,
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text, bold: true, size: B, font: F })],
          spacing: { before: 80, after: 80 },
        })],
      })
    }
    return new TableCell({
      width: { size: T33, type: DXA },
      children: [new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [new TextRun({ text, size: B, font: F })],
        spacing: { before: 80, after: 80 },
      })],
    })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function row2(label: string, value: string): any {
    return new TableRow({ children: [lCell(label), vCell(value)] })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function section(letter: string, title: string, rows: any[]): any {
    return new Table({
      width: { size: PW, type: DXA },
      borders: allThin,
      rows: [
        new TableRow({ children: [headerCell(`${letter} – ${title}`, PW, 2)] }),
        ...rows,
      ],
    })
  }

  function spacer() {
    return new Paragraph({ text: '', spacing: { after: 140 } })
  }

  // ── Header info box ─────────────────────────────────────────────────────────

  const infoBox = new Table({
    width: { size: PW, type: DXA },
    borders: allThin,
    rows: [
      new TableRow({ children: [headerCell('Objet du marché', H50), headerCell('Acheteur public', H50)] }),
      new TableRow({ children: [vCell(val(data.objet), H50), vCell(val(data.acheteur), H50)] }),
    ],
  })

  // ── Section D – 3-column amount table ──────────────────────────────────────

  const sectionD = new Table({
    width: { size: PW, type: DXA },
    borders: allThin,
    rows: [
      new TableRow({ children: [headerCell('D – Engagement du candidat', PW, 3)] }),
      new TableRow({
        children: [new TableCell({
          columnSpan: 3,
          width: { size: PW, type: DXA },
          children: [new Paragraph({
            children: [new TextRun({
              text: "Le candidat s'engage, aux prix figurant dans son offre, à exécuter les prestations aux conditions suivantes :",
              size: B, font: F,
            })],
            spacing: { before: 80, after: 80 },
          })],
        })],
      }),
      new TableRow({ children: [amtCell('Montant HT', true), amtCell(`TVA (${data.taux_tva} %)`, true), amtCell('Montant TTC', true)] }),
      new TableRow({ children: [amtCell(formatEuro(data.montant_ht), false), amtCell(formatEuro(montant_tva), false), amtCell(formatEuro(montant_ttc), false)] }),
      new TableRow({
        children: [new TableCell({
          columnSpan: 3,
          width: { size: PW, type: DXA },
          children: [
            new Paragraph({
              children: [
                new TextRun({ text: 'Montant HT en toutes lettres : ', bold: true, size: B, font: F }),
                new TextRun({ text: montantEnLettres(data.montant_ht), italics: true, size: B, font: F }),
              ],
              spacing: { before: 80, after: 60 },
            }),
            new Paragraph({
              children: [
                new TextRun({ text: 'Montant TTC en toutes lettres : ', bold: true, size: B, font: F }),
                new TextRun({ text: montantEnLettres(montant_ttc), italics: true, size: B, font: F }),
              ],
              spacing: { before: 60, after: 80 },
            }),
          ],
        })],
      }),
    ],
  })

  // ── Footer with page numbers ────────────────────────────────────────────────

  const footer = new Footer({
    children: [new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: 'Généré avec Stratly – page ', size: 16, font: F, color: '888888' }),
        new TextRun({ children: [PageNumber.CURRENT], size: 16, font: F, color: '888888' }),
        new TextRun({ text: ' / ', size: 16, font: F, color: '888888' }),
        new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 16, font: F, color: '888888' }),
      ],
    })],
  })

  // ── Reusable spanning cell (for F/G signature frames) ──────────────────────

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function spanCell(children: any[]): any {
    return new TableCell({ columnSpan: 2, width: { size: PW, type: DXA }, children })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function spanRow(children: any[]): any {
    return new TableRow({ children: [spanCell(children)] })
  }

  function frameRow() {
    return new TableRow({
      height: { value: 2268, rule: HeightRule.ATLEAST },
      children: [spanCell([new Paragraph({
        children: [new TextRun({ text: 'Signature et cachet :', bold: true, size: B, font: F })],
        spacing: { before: 80, after: 80 },
      })])],
    })
  }

  // ── Document ────────────────────────────────────────────────────────────────

  return new Document({
    sections: [{
      properties: {
        page: { margin: { top: 1134, bottom: 1134, left: 1134, right: 1134 } },
      },
      footers: { default: footer },
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "ACTE D'ENGAGEMENT", bold: true, size: 32, font: F })],
          spacing: { after: 60 },
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: 'ATTRI1 – Marché public', size: 20, font: F, color: '888888' })],
          spacing: { after: 180 },
        }),

        infoBox, spacer(),

        section('A', "Identification de l'acheteur", [
          row2('Nom / dénomination', val(data.acheteur)),
          row2('Adresse', DOTS),
        ]),
        spacer(),

        section('B', 'Objet du marché', [
          row2('Objet', val(data.objet)),
          row2("Lieu d'exécution", val(data.lieu_execution)),
          row2('Durée du marché', val(data.duree_marche)),
        ]),
        spacer(),

        section('C', 'Identification du candidat', [
          row2('Raison sociale', val(data.raison_sociale)),
          row2('Forme juridique', val(data.forme_juridique)),
          row2('Adresse du siège', val(data.adresse_siege)),
          row2('SIRET', val(data.siret)),
          row2('Représenté par', val(data.nom_signataire)),
          row2('Qualité du représentant', val(data.qualite_signataire)),
        ]),
        spacer(),

        sectionD, spacer(),

        section('E', 'Coordonnées bancaires', [
          row2('IBAN', val(data.iban)),
          row2('BIC', val(data.bic)),
        ]),
        spacer(),

        section('F', 'Signature du candidat', [
          row2('Fait à', `${DOTS_S}  le  ${DOTS_S}`),
          row2('Nom du signataire', val(data.nom_signataire)),
          row2('Qualité', val(data.qualite_signataire)),
          frameRow(),
        ]),
        spacer(),

        section("G", "Acceptation de l'offre par l'acheteur", [
          spanRow([new Paragraph({
            children: [new TextRun({
              text: "À remplir par l'acheteur public – laisser vierge.",
              italics: true, size: 18, font: F, color: '888888',
            })],
            spacing: { before: 60, after: 60 },
          })]),
          row2('Date', DOTS),
          frameRow(),
        ]),
      ],
    }],
  })
}

export async function buildActeEngagementDocx(data: ActeData): Promise<Uint8Array> {
  const { Packer } = await import('docx')
  const doc = await buildDocument(data)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buf = await (Packer.toBuffer(doc) as any)
  return new Uint8Array(buf as ArrayBuffer)
}

export async function genererActeEngagementDocx(data: ActeData): Promise<void> {
  const bytes = await buildActeEngagementDocx(data)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const blob = new Blob([bytes as any], {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  })

  const safe = data.objet
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 50)
  const filename = `Acte_engagement_${safe || 'marche'}.docx`

  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
