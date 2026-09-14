// Document à faire valider juridiquement avant mise en production.

import {
  RAISON_SOCIALE,
  STATUT_JURIDIQUE,
  SIRET,
  ADRESSE,
  EMAIL_CONTACT,
  DIRECTEUR_PUBLICATION,
  HEBERGEUR_NOM,
  HEBERGEUR_ADRESSE,
  DATE_MAJ,
} from '@/lib/legal'

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

function Row({ label, value, href }: { label: string; value: string; href?: string }) {
  return (
    <p>
      <span className="font-semibold text-text">{label} : </span>
      {href ? (
        <a href={href} className="text-accent hover:underline underline-offset-2">{value}</a>
      ) : (
        value
      )}
    </p>
  )
}

export default function MentionsLegalesPage() {
  return (
    <div className="bg-background">

      {/* Header */}
      <section
        className="relative overflow-hidden py-14 px-5 sm:px-6 md:py-20 text-center"
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
      <section className="py-10 px-5 sm:px-6 md:py-14">
        <div className="max-w-2xl mx-auto">

          <Section title="Éditeur du site">
            <Row label="Dénomination sociale" value={RAISON_SOCIALE} />
            <Row label="Forme juridique" value={STATUT_JURIDIQUE} />
            <Row label="SIRET" value={SIRET} />
            <Row label="Adresse du siège social" value={ADRESSE} />
            <Row label="Email" value={EMAIL_CONTACT} href={`mailto:${EMAIL_CONTACT}`} />
            <Row label="Directeur de la publication" value={DIRECTEUR_PUBLICATION} />
          </Section>

          <Section title="Hébergement">
            <p>Le site Stratly est hébergé par :</p>
            <Row label="Hébergeur" value={HEBERGEUR_NOM} />
            <Row label="Adresse" value={HEBERGEUR_ADRESSE} />
            <p>
              La base de données est opérée par Supabase Inc., 970 Toa Payoh North, #07-04, Singapour 318992.
            </p>
          </Section>

          <Section title="Propriété intellectuelle">
            <p>
              L&apos;ensemble des éléments constituant le site Stratly (textes, graphismes, logiciels, photographies, images, sons, plans, noms, logos, marques, etc.) est la propriété exclusive de {RAISON_SOCIALE} ou de ses partenaires. Toute reproduction, représentation, modification, publication ou adaptation de tout ou partie des éléments du site, quel que soit le moyen ou le procédé utilisé, est interdite, sauf autorisation écrite préalable de {RAISON_SOCIALE}.
            </p>
            <p>
              Les documents d&apos;appels d&apos;offres déposés par les utilisateurs restent leur propriété. Stratly n&apos;acquiert aucun droit sur ces documents.
            </p>
          </Section>

          <Section title="Limitation de responsabilité">
            <p>
              {`${RAISON_SOCIALE} s'efforce d'assurer l'exactitude et la mise à jour des informations diffusées sur ce site. Toutefois, ${RAISON_SOCIALE} ne peut garantir l'exactitude, la précision ou l'exhaustivité des informations mises à disposition sur ce site.`}
            </p>
            <p>
              Les analyses produites par Stratly sont fournies à titre indicatif. Elles ne constituent pas un conseil juridique ou une garantie de résultat dans le cadre d&apos;une procédure de marchés publics.
            </p>
          </Section>

          <Section title="Contact">
            <p>
              Pour toute question relative au site ou à son contenu, vous pouvez nous contacter à l&apos;adresse suivante :{' '}
              <a href={`mailto:${EMAIL_CONTACT}`} className="font-semibold text-accent hover:underline underline-offset-2">
                {EMAIL_CONTACT}
              </a>
            </p>
          </Section>

          <p className="font-syne text-[12px] text-text-subtle mt-8">
            Dernière mise à jour : {DATE_MAJ}
          </p>
        </div>
      </section>
    </div>
  )
}
