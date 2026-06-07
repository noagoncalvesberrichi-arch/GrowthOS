// Document à faire valider juridiquement avant mise en production.

export const metadata = { title: 'Mentions légales — Stratly' }

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-10">
      <h2 className="font-fraunces text-[22px] text-text mb-4">{title}</h2>
      <div className="space-y-3 font-syne text-[14px] text-text-muted leading-relaxed">
        {children}
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <p>
      <span className="font-semibold text-text">{label} : </span>
      {value}
    </p>
  )
}

export default function MentionsLegalesPage() {
  return (
    <div className="bg-background">

      {/* Header */}
      <section
        className="relative overflow-hidden py-20 px-6 text-center"
        style={{ background: 'linear-gradient(135deg, #0C1647 0%, #1E3A8A 55%, #2563EB 100%)' }}
      >
        <div className="absolute inset-0 dot-grid opacity-[0.06] pointer-events-none" />
        <div className="relative max-w-3xl mx-auto">
          <p className="font-syne text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-amber mb-4">
            Légal
          </p>
          <h1
            className="font-fraunces text-white tracking-tight leading-tight"
            style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)' }}
          >
            Mentions légales
          </h1>
        </div>
      </section>

      {/* Content */}
      <section className="py-14 px-6">
        <div className="max-w-2xl mx-auto">

          <Section title="Éditeur du site">
            <Row label="Dénomination sociale" value="[RAISON SOCIALE]" />
            <Row label="Forme juridique" value="[STATUT JURIDIQUE — ex : SAS, SASU, auto-entrepreneur]" />
            <Row label="SIRET" value="[SIRET]" />
            <Row label="Adresse du siège social" value="[ADRESSE COMPLÈTE]" />
            <Row label="Email" value="[EMAIL DE CONTACT]" />
            <Row label="Directeur de la publication" value="[NOM DU DIRIGEANT]" />
          </Section>

          <Section title="Hébergement">
            <p>Le site Stratly est hébergé par :</p>
            <Row label="Hébergeur" value="[NOM HÉBERGEUR]" />
            <Row label="Adresse" value="[ADRESSE HÉBERGEUR]" />
            <p>
              La base de données est opérée par Supabase Inc., 970 Toa Payoh North, #07-04, Singapour 318992.
            </p>
          </Section>

          <Section title="Propriété intellectuelle">
            <p>
              L&apos;ensemble des éléments constituant le site Stratly (textes, graphismes, logiciels, photographies, images, sons, plans, noms, logos, marques, etc.) est la propriété exclusive de [RAISON SOCIALE] ou de ses partenaires. Toute reproduction, représentation, modification, publication ou adaptation de tout ou partie des éléments du site, quel que soit le moyen ou le procédé utilisé, est interdite, sauf autorisation écrite préalable de [RAISON SOCIALE].
            </p>
            <p>
              Les documents d&apos;appels d&apos;offres déposés par les utilisateurs restent leur propriété. Stratly n&apos;acquiert aucun droit sur ces documents.
            </p>
          </Section>

          <Section title="Limitation de responsabilité">
            <p>
              [RAISON SOCIALE] s&apos;efforce d&apos;assurer l&apos;exactitude et la mise à jour des informations diffusées sur ce site. Toutefois, [RAISON SOCIALE] ne peut garantir l&apos;exactitude, la précision ou l&apos;exhaustivité des informations mises à disposition sur ce site.
            </p>
            <p>
              Les analyses produites par Stratly sont fournies à titre indicatif. Elles ne constituent pas un conseil juridique ou une garantie de résultat dans le cadre d&apos;une procédure de marchés publics.
            </p>
          </Section>

          <Section title="Contact">
            <p>
              Pour toute question relative au site ou à son contenu, vous pouvez nous contacter à l&apos;adresse suivante : <span className="font-semibold text-text">[EMAIL DE CONTACT]</span>
            </p>
          </Section>

          <p className="font-syne text-[12px] text-text-subtle mt-8">
            Dernière mise à jour : [DATE]
          </p>
        </div>
      </section>
    </div>
  )
}
