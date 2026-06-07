// Document à faire valider juridiquement avant mise en production.

export const metadata = { title: 'Politique de confidentialité — Stratly' }

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

export default function ConfidentialitePage() {
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
            RGPD
          </p>
          <h1
            className="font-fraunces text-white tracking-tight leading-tight"
            style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)' }}
          >
            Politique de confidentialité
          </h1>
        </div>
      </section>

      {/* Content */}
      <section className="py-10 px-5 sm:px-6 md:py-14">
        <div className="max-w-2xl mx-auto">

          <p className="font-syne text-[14px] text-text-muted leading-relaxed mb-10 border-l-4 border-brand-amber/40 pl-4">
            [RAISON SOCIALE], éditeur de Stratly, s&apos;engage à protéger la vie privée des utilisateurs de sa plateforme. La présente politique décrit quelles données sont collectées, pour quelles finalités, sur quelle base légale, et quels droits vous pouvez exercer conformément au Règlement général sur la protection des données (RGPD — Règlement UE 2016/679).
          </p>

          <Section num="1" title="Responsable du traitement">
            <p>
              Le responsable du traitement des données personnelles collectées via Stratly est :
            </p>
            <p>
              <span className="font-semibold text-text">[RAISON SOCIALE]</span> — [STATUT JURIDIQUE], SIRET [SIRET], dont le siège social est situé [ADRESSE COMPLÈTE].
            </p>
            <p>
              Pour toute question relative à vos données : <span className="font-semibold text-text">[EMAIL DE CONTACT DPO OU RESPONSABLE]</span>
            </p>
          </Section>

          <Section num="2" title="Données collectées">
            <p>Stratly collecte les catégories de données suivantes :</p>

            <div className="space-y-4">
              <div className="bg-surface border border-border rounded-xl p-4">
                <p className="font-semibold text-text mb-2">Données de compte</p>
                <ul className="list-disc list-inside space-y-1 pl-1">
                  <li>Adresse email (identifiant de connexion)</li>
                  <li>Mot de passe (stocké sous forme hachée)</li>
                  <li>Date et heure de création du compte</li>
                </ul>
              </div>

              <div className="bg-surface border border-border rounded-xl p-4">
                <p className="font-semibold text-text mb-2">Profil entreprise (renseigné volontairement)</p>
                <ul className="list-disc list-inside space-y-1 pl-1">
                  <li>Raison sociale, SIRET, code NAF</li>
                  <li>Secteur d&apos;activité, chiffre d&apos;affaires, effectif</li>
                  <li>Certifications, domaines de compétences</li>
                  <li>Zones géographiques d&apos;intervention</li>
                </ul>
              </div>

              <div className="bg-surface border border-border rounded-xl p-4">
                <p className="font-semibold text-text mb-2">Dossiers d&apos;appels d&apos;offres</p>
                <ul className="list-disc list-inside space-y-1 pl-1">
                  <li>Fichiers PDF déposés pour analyse</li>
                  <li>Résultats d&apos;analyse générés</li>
                  <li>Historique des analyses effectuées</li>
                </ul>
              </div>

              <div className="bg-surface border border-border rounded-xl p-4">
                <p className="font-semibold text-text mb-2">Données de navigation et techniques</p>
                <ul className="list-disc list-inside space-y-1 pl-1">
                  <li>Adresse IP (collectée par l&apos;hébergeur)</li>
                  <li>Type de navigateur et système d&apos;exploitation</li>
                  <li>Pages consultées, horodatage des connexions</li>
                </ul>
              </div>

              <div className="bg-surface border border-border rounded-xl p-4">
                <p className="font-semibold text-text mb-2">Données de facturation</p>
                <ul className="list-disc list-inside space-y-1 pl-1">
                  <li>Informations de paiement (traitées exclusivement par Stripe — non stockées chez Stratly)</li>
                  <li>Historique des transactions et des abonnements</li>
                </ul>
              </div>
            </div>
          </Section>

          <Section num="3" title="Finalités et bases légales">
            <div className="overflow-x-auto">
            <div className="bg-surface border border-border rounded-xl overflow-hidden min-w-[520px]">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-4 py-3 font-semibold text-text">Finalité</th>
                    <th className="text-left px-4 py-3 font-semibold text-text">Base légale</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['Fourniture du Service (création de compte, authentification)', "Exécution du contrat (art. 6.1.b RGPD)"],
                    ['Analyse des dossiers par IA', "Exécution du contrat (art. 6.1.b RGPD)"],
                    ['Gestion des abonnements et facturation', "Exécution du contrat (art. 6.1.b RGPD)"],
                    ['Prévention de la fraude et sécurité', "Intérêt légitime (art. 6.1.f RGPD)"],
                    ['Amélioration du service (données agrégées, anonymisées)', "Intérêt légitime (art. 6.1.f RGPD)"],
                    ['Obligations légales et comptables', "Obligation légale (art. 6.1.c RGPD)"],
                  ].map(([finalite, base]) => (
                    <tr key={finalite} className="border-b border-border last:border-0">
                      <td className="px-4 py-3 text-text-muted">{finalite}</td>
                      <td className="px-4 py-3 text-text-muted">{base}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            </div>
          </Section>

          <Section num="4" title="Durée de conservation">
            <ul className="list-disc list-inside space-y-2 pl-1">
              <li><span className="font-semibold text-text">Données de compte</span> : conservées pendant toute la durée de l&apos;abonnement actif, puis pendant 3 ans après la dernière activité ou la résiliation (prospection commerciale).</li>
              <li><span className="font-semibold text-text">Profil entreprise</span> : conservé tant que le compte est actif. Supprimé sur demande.</li>
              <li><span className="font-semibold text-text">Dossiers d&apos;appels d&apos;offres et analyses</span> : conservés pendant la durée de l&apos;abonnement actif. [DURÉE À PRÉCISER SELON POLITIQUE DE RÉTENTION]</li>
              <li><span className="font-semibold text-text">Données de facturation</span> : conservées 10 ans conformément aux obligations comptables légales.</li>
              <li><span className="font-semibold text-text">Journaux de connexion</span> : conservés 12 mois conformément à la législation française.</li>
            </ul>
          </Section>

          <Section num="5" title="Sous-traitants et transferts de données">
            <p>
              Stratly fait appel aux sous-traitants suivants dans le cadre de la fourniture du Service :
            </p>
            <div className="space-y-3">
              {[
                {
                  nom: 'Supabase Inc.',
                  role: 'Hébergement de la base de données (authentification, profils, données structurées)',
                  localisation: 'États-Unis / AWS eu-west (Europe)',
                  garantie: 'Data Processing Agreement (DPA) conforme RGPD, clauses contractuelles types CE',
                },
                {
                  nom: 'Vercel Inc.',
                  role: 'Hébergement de l&apos;application (infrastructure front-end et back-end)',
                  localisation: 'États-Unis / régions AWS/Cloudflare',
                  garantie: 'DPA conforme RGPD, clauses contractuelles types CE',
                },
                {
                  nom: 'Stripe Payments Europe Ltd',
                  role: 'Traitement des paiements et gestion des abonnements',
                  localisation: 'Irlande (UE)',
                  garantie: 'Entité basée dans l&apos;UE, certifiée PCI-DSS',
                },
                {
                  nom: 'Anthropic PBC',
                  role: 'Moteur d&apos;intelligence artificielle pour l&apos;analyse des dossiers',
                  localisation: 'États-Unis',
                  garantie: 'DPA disponible — vos données ne sont pas utilisées pour entraîner les modèles (API usage policy)',
                },
              ].map((st) => (
                <div key={st.nom} className="bg-surface border border-border rounded-xl p-4">
                  <p className="font-semibold text-text text-[13px] mb-1">{st.nom}</p>
                  <p className="text-[12px] text-text-muted mb-1"><span className="font-medium">Rôle :</span> <span dangerouslySetInnerHTML={{ __html: st.role }} /></p>
                  <p className="text-[12px] text-text-muted mb-1"><span className="font-medium">Localisation :</span> {st.localisation}</p>
                  <p className="text-[12px] text-text-muted"><span className="font-medium">Garanties :</span> <span dangerouslySetInnerHTML={{ __html: st.garantie }} /></p>
                </div>
              ))}
            </div>
            <p>
              Aucune donnée personnelle n&apos;est vendue ou cédée à des tiers à des fins commerciales.
            </p>
          </Section>

          <Section num="6" title="Vos droits RGPD">
            <p>
              Conformément au RGPD, vous disposez des droits suivants sur vos données personnelles :
            </p>
            <ul className="space-y-2">
              {[
                ['Droit d\'accès', 'obtenir une copie des données que nous détenons sur vous'],
                ['Droit de rectification', 'corriger des données inexactes ou incomplètes'],
                ['Droit à l\'effacement (« droit à l\'oubli »)', 'demander la suppression de vos données (sous réserve d\'obligations légales)'],
                ['Droit à la limitation', 'restreindre temporairement le traitement de vos données'],
                ['Droit à la portabilité', 'recevoir vos données dans un format structuré et lisible par machine'],
                ['Droit d\'opposition', 'vous opposer à un traitement fondé sur l\'intérêt légitime'],
              ].map(([droit, desc]) => (
                <li key={droit} className="flex gap-2">
                  <span className="text-brand-amber shrink-0 mt-0.5">→</span>
                  <span><span className="font-semibold text-text">{droit}</span> : {desc}.</span>
                </li>
              ))}
            </ul>
            <p>
              Pour exercer vos droits, contactez-nous à : <span className="font-semibold text-text">[EMAIL DE CONTACT DPO]</span>. Nous nous engageons à répondre dans un délai d&apos;un mois.
            </p>
            <p>
              Vous avez également le droit d&apos;introduire une réclamation auprès de la CNIL (Commission nationale de l&apos;informatique et des libertés — <span className="font-semibold text-text">www.cnil.fr</span>).
            </p>
          </Section>

          <Section num="7" title="Cookies et traceurs">
            <p>
              Stratly utilise uniquement des cookies techniques strictement nécessaires au fonctionnement du service (session d&apos;authentification). Aucun cookie publicitaire ou de traçage à des fins marketing n&apos;est déposé. [COMPLÉTER SI OUTILS D&apos;ANALYTICS AJOUTÉS]
            </p>
          </Section>

          <Section num="8" title="Sécurité">
            <p>
              Stratly met en œuvre des mesures techniques et organisationnelles appropriées pour protéger vos données : chiffrement des communications (HTTPS/TLS), authentification gérée par Supabase Auth, accès aux données restreint par des politiques de sécurité au niveau des lignes (Row Level Security), mots de passe stockés sous forme hachée.
            </p>
          </Section>

          <Section num="9" title="Modifications de la politique">
            <p>
              La présente politique peut être mise à jour pour refléter l&apos;évolution du Service ou des obligations légales. Toute modification substantielle sera notifiée aux utilisateurs par email. La date de dernière mise à jour figure ci-dessous.
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
