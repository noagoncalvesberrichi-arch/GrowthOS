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
  const { Document, HeadingLevel, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle } = await import('docx')

  const montant_tva = Math.round(data.montant_ht * data.taux_tva / 100 * 100) / 100
  const montant_ttc = Math.round(data.montant_ht * (1 + data.taux_tva / 100) * 100) / 100

  function h1(text: string) {
    return new Paragraph({ text, heading: HeadingLevel.HEADING_1, spacing: { before: 240, after: 120 } })
  }
  function h2(text: string) {
    return new Paragraph({ text, heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 80 } })
  }
  function p(text: string) {
    return new Paragraph({
      children: [new TextRun({ text, size: 22 })],
      spacing: { after: 80 },
    })
  }
  function label(key: string, value: string) {
    return new Paragraph({
      children: [
        new TextRun({ text: key + ' : ', bold: true, size: 22 }),
        new TextRun({ text: value || '[À compléter]', size: 22 }),
      ],
      spacing: { after: 60 },
    })
  }

  const noBorder = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }
  const cellBorder = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder }

  const table = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Désignation', bold: true, size: 22 })] })], borders: cellBorder }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Montant HT', bold: true, size: 22 })], alignment: AlignmentType.RIGHT })], borders: cellBorder }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `TVA ${data.taux_tva} %`, bold: true, size: 22 })], alignment: AlignmentType.RIGHT })], borders: cellBorder }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Montant TTC', bold: true, size: 22 })], alignment: AlignmentType.RIGHT })], borders: cellBorder }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Montant total de l'offre", size: 22 })] })], borders: cellBorder }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: formatEuro(data.montant_ht), size: 22 })], alignment: AlignmentType.RIGHT })], borders: cellBorder }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: formatEuro(montant_tva), size: 22 })], alignment: AlignmentType.RIGHT })], borders: cellBorder }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: formatEuro(montant_ttc), size: 22 })], alignment: AlignmentType.RIGHT })], borders: cellBorder }),
        ],
      }),
    ],
  })

  const children = [
    h1("ACTE D'ENGAGEMENT"),
    p('Formulaire ATTRI1 — Marché public'),
    new Paragraph({ text: '', spacing: { after: 120 } }),

    h2("1. IDENTIFICATION DE L'ACHETEUR PUBLIC"),
    label("Pouvoir adjudicateur", data.acheteur),
    new Paragraph({ text: '', spacing: { after: 80 } }),

    h2("2. OBJET DU MARCHÉ"),
    label("Objet", data.objet),
    label("Lieu d'exécution", data.lieu_execution || '[À compléter]'),
    label("Durée du marché", data.duree_marche || '[À compléter]'),
    new Paragraph({ text: '', spacing: { after: 80 } }),

    h2("3. IDENTIFICATION DU CANDIDAT"),
    label("Raison sociale", data.raison_sociale),
    label("Forme juridique", data.forme_juridique),
    label("Adresse du siège", data.adresse_siege),
    label("SIRET", data.siret),
    new Paragraph({ text: '', spacing: { after: 80 } }),

    h2("4. ENGAGEMENT DU CANDIDAT"),
    p("Le candidat s'engage, aux prix figurant dans son offre, à exécuter les prestations demandées aux conditions ci-après :"),
    new Paragraph({ text: '', spacing: { after: 80 } }),
    table,
    new Paragraph({ text: '', spacing: { after: 80 } }),
    new Paragraph({
      children: [
        new TextRun({ text: 'Montant en toutes lettres (HT) : ', bold: true, size: 22 }),
        new TextRun({ text: montantEnLettres(data.montant_ht), size: 22 }),
      ],
      spacing: { after: 60 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: 'Montant en toutes lettres (TTC) : ', bold: true, size: 22 }),
        new TextRun({ text: montantEnLettres(montant_ttc), size: 22 }),
      ],
      spacing: { after: 80 },
    }),

    h2("5. DURÉE ET LIEU D'EXÉCUTION"),
    label("Durée du marché", data.duree_marche || '[À compléter]'),
    label("Lieu d'exécution", data.lieu_execution || '[À compléter]'),
    new Paragraph({ text: '', spacing: { after: 80 } }),

    h2("6. COORDONNÉES BANCAIRES"),
    ...(data.iban
      ? [label("IBAN", data.iban), label("BIC", data.bic ?? '[À compléter]')]
      : [p('Coordonnées bancaires : [À COMPLÉTER]')]
    ),
    new Paragraph({ text: '', spacing: { after: 80 } }),

    h2("7. SIGNATURE"),
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
