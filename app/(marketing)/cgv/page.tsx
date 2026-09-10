// Document à faire valider juridiquement avant mise en production.

import {
  RAISON_SOCIALE,
  EMAIL_CONTACT,
  VILLE,
  DATE_MAJ,
} from '@/lib/legal'

export const metadata = { title: 'Conditions générales de vente — Stratly' }

function Section({ num, title, children }: { num: string; title: string; children: React.ReactNode }) {
  return (
    <div className="mb-10">
      <h2 className="font-fraunces text-[22px] text-text mb-4">
        <span className="text-brand-amber mr-2">{num}.</span>{title}
      </h2>
      <div className="space-y-3 font-syne text-[14px] text-text-muted leading-relaxed">
        {children}
      </div>
    </div>
  )
}

export default function CgvPage() {
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
            Conditions générales de vente
          </h1>
        </div>
      </section>

      {/* Content */}
      <section className="py-10 px-5 sm:px-6 md:py-14">
        <div className="max-w-2xl mx-auto">

          <p className="font-syne text-[14px] text-text-muted leading-relaxed mb-10 border-l-4 border-brand-amber/40 pl-4">
            Les présentes conditions générales de vente (CGV) régissent les relations contractuelles entre {RAISON_SOCIALE} (ci-après « Stratly » ou le « Prestataire ») et tout utilisateur qui souscrit à un abonnement payant via la plateforme accessible à l&apos;adresse stratly.fr.
          </p>

          <Section num="1" title="Objet">
            <p>
              Les présentes CGV ont pour objet de définir les conditions dans lesquelles Stratly fournit à ses clients un accès à son service d&apos;analyse automatisée de dossiers d&apos;appels d&apos;offres publics (ci-après le « Service »).
            </p>
          </Section>

          <Section num="2" title="Description du Service">
            <p>
              Stratly est un outil SaaS (Software as a Service) permettant à ses utilisateurs de déposer des documents PDF constituant un dossier de consultation des entreprises (DCE) — règlement de consultation, cahier des clauses techniques, cahier des clauses administratives, etc. — afin d&apos;en obtenir une synthèse automatisée comprenant notamment :
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>l&apos;objet et les caractéristiques du marché ;</li>
              <li>les critères de sélection et de notation ;</li>
              <li>les dates et délais clés ;</li>
              <li>la liste des pièces à fournir ;</li>
              <li>les points de vigilance ;</li>
              <li>un avis Go / No-Go basé sur le profil de l&apos;entreprise utilisatrice ;</li>
              <li>l&apos;historique des attributions de l&apos;acheteur public (plans Essentiel et Pro) ;</li>
              <li>le positionnement prix (fourchette p25/médiane/p75) de l&apos;acheteur (plan Pro) ;</li>
              <li>la génération d&apos;une trame de mémoire technique structurée sur la grille de notation du DCE (plans Essentiel et Pro).</li>
            </ul>
            <p>
              Les analyses sont produites par intelligence artificielle à titre indicatif. Elles ne constituent pas un conseil juridique et n&apos;engagent pas la responsabilité de Stratly quant à l&apos;issue d&apos;une procédure de marchés publics.
            </p>
            <p>
              Les données relatives à l&apos;historique des acheteurs et au positionnement prix sont issues de sources publiques (données essentielles de la commande publique — DECP, publiées par l&apos;État français). Ces données sont fournies à titre indicatif et peuvent ne pas refléter l&apos;intégralité des attributions d&apos;un acheteur.
            </p>
          </Section>

          <Section num="3" title="Accès au Service et création de compte">
            <p>
              L&apos;accès au Service nécessite la création d&apos;un compte utilisateur en renseignant une adresse email valide et un mot de passe. Le client est seul responsable de la confidentialité de ses identifiants.
            </p>
            <p>
              Un plan gratuit permettant 3 analyses complètes est proposé à tout nouvel utilisateur, sans engagement et sans obligation de fournir un moyen de paiement.
            </p>
          </Section>

          <Section num="4" title="Offres et tarification">
            <p>Les offres disponibles sont les suivantes :</p>
            <div className="overflow-x-auto">
            <div className="bg-surface border border-border rounded-xl overflow-hidden min-w-[480px]">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-4 py-3 font-semibold text-text">Offre</th>
                    <th className="text-left px-4 py-3 font-semibold text-text">Prix HT</th>
                    <th className="text-left px-4 py-3 font-semibold text-text">Engagement</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border">
                    <td className="px-4 py-3 text-text-muted">Plan Gratuit</td>
                    <td className="px-4 py-3 text-text-muted">0 €</td>
                    <td className="px-4 py-3 text-text-muted">3 analyses, sans durée limite</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="px-4 py-3 text-text-muted">Essentiel</td>
                    <td className="px-4 py-3 text-text-muted">190 € HT / mois</td>
                    <td className="px-4 py-3 text-text-muted">Sans engagement, résiliable à tout moment</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="px-4 py-3 text-text-muted">Pro</td>
                    <td className="px-4 py-3 text-text-muted">390 € HT / mois</td>
                    <td className="px-4 py-3 text-text-muted">Sans engagement, résiliable à tout moment</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-text-muted">Offre Fondateurs</td>
                    <td className="px-4 py-3 text-text-muted">190 € HT / mois</td>
                    <td className="px-4 py-3 text-text-muted">Tarif à vie bloqué — 15 places limitées</td>
                  </tr>
                </tbody>
              </table>
            </div>
            </div>
            <p>
              Les prix s&apos;entendent hors taxes (HT). La TVA applicable est ajoutée au taux en vigueur au moment de la facturation. {RAISON_SOCIALE} se réserve le droit de modifier ses tarifs à tout moment, avec un préavis d&apos;au moins 30 jours pour les abonnés actifs. Le tarif fondateurs est bloqué à vie pour les souscripteurs de cette offre.
            </p>
          </Section>

          <Section num="5" title="Modalités de paiement">
            <p>
              Le paiement des abonnements payants est traité par Stripe Payments Europe Ltd (service de paiement en ligne sécurisé). {RAISON_SOCIALE} ne collecte ni ne stocke les données de carte bancaire des clients.
            </p>
            <p>
              L&apos;abonnement est prélevé automatiquement chaque mois à la date anniversaire de la souscription.
            </p>
            <p>
              En cas d&apos;échec de paiement, l&apos;accès aux fonctionnalités payantes peut être suspendu jusqu&apos;à régularisation.
            </p>
          </Section>

          <Section num="6" title="Durée et résiliation">
            <p>
              L&apos;abonnement est conclu pour une durée d&apos;un mois, renouvelable par tacite reconduction. Il peut être résilié à tout moment depuis l&apos;espace de facturation Stripe ; la résiliation prend effet à la fin de la période en cours.
            </p>
            <p>
              {RAISON_SOCIALE} se réserve le droit de suspendre ou résilier un compte en cas de violation des présentes CGV.
            </p>
          </Section>

          <Section num="7" title="Droit de rétractation">
            <p>
              Conformément à l&apos;article L.221-28 du Code de la consommation, le droit de rétractation ne s&apos;applique pas aux contrats de fourniture de contenu numérique non fourni sur support matériel dont l&apos;exécution a commencé avec l&apos;accord préalable exprès du consommateur.
            </p>
            <p>
              En souscrivant à un abonnement et en accédant au Service, le client reconnaît expressément renoncer à son droit de rétractation dès lors que le service a commencé à être fourni.
            </p>
            <p>
              Pour les clients professionnels (B2B), le droit de rétractation ne s&apos;applique pas.
            </p>
          </Section>

          <Section num="8" title="Responsabilité et garanties">
            <p>
              Stratly s&apos;engage à mettre en œuvre tous les moyens raisonnables pour assurer la disponibilité et la qualité du Service. Toutefois, {RAISON_SOCIALE} ne saurait être tenu responsable de toute décision prise par le client sur la base des analyses fournies par Stratly.
            </p>
            <p>
              La responsabilité de {RAISON_SOCIALE} est limitée aux montants effectivement payés par le client au cours des 12 derniers mois précédant le fait générateur du dommage.
            </p>
          </Section>

          <Section num="9" title="Données personnelles">
            <p>
              Le traitement des données personnelles collectées dans le cadre de l&apos;utilisation du Service est décrit dans la <a href="/confidentialite" className="text-accent underline underline-offset-2 hover:text-accent-dark">Politique de confidentialité</a> de Stratly.
            </p>
          </Section>

          <Section num="10" title="Modifications des CGV">
            <p>
              {RAISON_SOCIALE} se réserve le droit de modifier les présentes CGV à tout moment. Les clients abonnés seront informés par email au moins 30 jours avant toute modification substantielle. La poursuite de l&apos;utilisation du Service après cette période vaut acceptation des nouvelles CGV.
            </p>
          </Section>

          <Section num="11" title="Contact">
            <p>
              Pour toute question relative aux présentes CGV, vous pouvez nous contacter à :{' '}
              <a href={`mailto:${EMAIL_CONTACT}`} className="text-accent underline underline-offset-2 hover:text-accent-dark">
                {EMAIL_CONTACT}
              </a>
            </p>
          </Section>

          <Section num="12" title="Droit applicable et juridiction">
            <p>
              Les présentes CGV sont soumises au droit français. En cas de litige, les parties s&apos;efforceront de trouver une solution amiable. À défaut, le litige sera soumis aux tribunaux compétents du ressort de {VILLE}.
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
