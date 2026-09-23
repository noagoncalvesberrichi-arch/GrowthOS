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

export async function genererActeEngagementDocx(data: ActeData): Promise<void> {
  const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle } = await import('docx')

  const montant_tva = Math.round(data.montant_ht * data.taux_tva / 100 * 100) / 100
  const montant_ttc = Math.round(data.montant_ht * (1 + data.taux_tva / 100) * 100) / 100

  const FONT = 'Arial'
  const SIZE = 22  // 11pt in half-points

  function titleBlock() {
    return new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: "ACTE D'ENGAGEMENT", bold: true, size: 28, font: FONT })],
      spacing: { before: 120, after: 60 },
    })
  }

  function subtitle(text: string) {
    return new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text, size: SIZE, font: FONT })],
      spacing: { after: 200 },
    })
  }

  function sectionHead(text: string) {
    return new Paragraph({
      children: [new TextRun({ text, bold: true, size: SIZE, font: FONT })],
      spacing: { before: 280, after: 100 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: 'AAAAAA' } },
    })
  }

  function p(text: string) {
    return new Paragraph({
      children: [new TextRun({ text, size: SIZE, font: FONT })],
      spacing: { after: 80 },
    })
  }

  function label(key: string, value: string) {
    return new Paragraph({
      children: [
        new TextRun({ text: key + ' : ', bold: true, size: SIZE, font: FONT }),
        new TextRun({ text: value || '[À compléter]', size: SIZE, font: FONT }),
      ],
      spacing: { after: 60 },
    })
  }

  const border = { style: BorderStyle.SINGLE, size: 4, color: '000000' }
  const cellBorders = { top: border, bottom: border, left: border, right: border }

  function headerCell(text: string, right = false) {
    return new TableCell({
      children: [new Paragraph({
        alignment: right ? AlignmentType.RIGHT : AlignmentType.LEFT,
        children: [new TextRun({ text, bold: true, size: SIZE, font: FONT })],
      })],
      borders: cellBorders,
    })
  }

  function valueCell(text: string, right = false) {
    return new TableCell({
      children: [new Paragraph({
        alignment: right ? AlignmentType.RIGHT : AlignmentType.LEFT,
        children: [new TextRun({ text, size: SIZE, font: FONT })],
      })],
      borders: cellBorders,
    })
  }

  const table = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          headerCell('Désignation'),
          headerCell('Montant HT', true),
          headerCell(`TVA ${data.taux_tva} %`, true),
          headerCell('Montant TTC', true),
        ],
      }),
      new TableRow({
        children: [
          valueCell("Montant total de l'offre"),
          valueCell(formatEuro(data.montant_ht), true),
          valueCell(formatEuro(montant_tva), true),
          valueCell(formatEuro(montant_ttc), true),
        ],
      }),
    ],
  })

  const children = [
    titleBlock(),
    subtitle('Formulaire ATTRI1 — Marché public'),

    sectionHead("1. IDENTIFICATION DE L'ACHETEUR PUBLIC"),
    label("Pouvoir adjudicateur", data.acheteur),

    sectionHead("2. OBJET DU MARCHÉ"),
    label("Objet", data.objet),

    sectionHead("3. IDENTIFICATION DU CANDIDAT"),
    label("Raison sociale", data.raison_sociale),
    label("Forme juridique", data.forme_juridique),
    label("Adresse du siège", data.adresse_siege),
    label("SIRET", data.siret),

    sectionHead("4. ENGAGEMENT DU CANDIDAT"),
    p("Le candidat s'engage, aux prix figurant dans son offre, à exécuter les prestations demandées aux conditions ci-après :"),
    new Paragraph({ text: '', spacing: { after: 80 } }),
    table,
    new Paragraph({ text: '', spacing: { after: 80 } }),
    new Paragraph({
      children: [
        new TextRun({ text: 'Montant en toutes lettres (HT) : ', bold: true, size: SIZE, font: FONT }),
        new TextRun({ text: montantEnLettres(data.montant_ht), size: SIZE, font: FONT }),
      ],
      spacing: { after: 60 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: 'Montant en toutes lettres (TTC) : ', bold: true, size: SIZE, font: FONT }),
        new TextRun({ text: montantEnLettres(montant_ttc), size: SIZE, font: FONT }),
      ],
      spacing: { after: 80 },
    }),

    sectionHead("5. DURÉE ET LIEU D'EXÉCUTION"),
    label("Durée du marché", data.duree_marche || '[À compléter]'),
    label("Lieu d'exécution", data.lieu_execution || '[À compléter]'),

    sectionHead("6. COORDONNÉES BANCAIRES"),
    ...(data.iban
      ? [label("IBAN", data.iban), label("BIC", data.bic ?? '[À compléter]')]
      : [p('Coordonnées bancaires : [À COMPLÉTER]')]
    ),

    sectionHead("7. SIGNATURE"),
    label("Nom du signataire", data.nom_signataire),
    label("Qualité", data.qualite_signataire),
    new Paragraph({ text: '', spacing: { after: 120 } }),
    p("Date : ………………………………"),
    new Paragraph({ text: '', spacing: { after: 80 } }),
    p("Signature :"),
    new Paragraph({ text: '', spacing: { after: 240 } }),
  ]

  const doc = new Document({ sections: [{ children }] })
  const blob = await Packer.toBlob(doc)

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
