import Link from 'next/link'

export const metadata = {
  title: "Guide d'utilisation — Stratly",
  description: "Apprenez à utiliser Stratly : analyser un appel d'offres, générer un mémoire technique, chiffrer automatiquement et bien plus.",
}

const sections = [
  { id: 'demarrer', label: 'Bien démarrer' },
  { id: 'analyse', label: 'Analyser un AO' },
  { id: 'historique', label: 'Historique acheteur' },
  { id: 'references', label: 'Références chantiers' },
  { id: 'bibliotheque', label: 'Bibliothèque de contenus' },
  { id: 'memoire', label: 'Mémoire technique' },
  { id: 'chiffrage', label: 'Chiffrage automatique' },
  { id: 'veille', label: 'Veille AO' },
  { id: 'compte', label: 'Abonnement & support' },
]

function SectionApport({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl px-5 py-4 mb-6">
      <p className="font-syne text-[11px] font-bold uppercase tracking-wider text-[#1D4ED8] mb-1.5">
        Ce que ça vous apporte
      </p>
      <p className="font-syne text-[14px] text-[#1e3a8a] leading-relaxed">{children}</p>
    </div>
  )
}

function Astuce({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 mt-6 flex gap-3">
      <span className="text-amber-500 shrink-0 mt-0.5">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </span>
      <div>
        <p className="font-syne text-[11px] font-bold uppercase tracking-wider text-amber-700 mb-1">Astuce</p>
        <p className="font-syne text-[14px] text-amber-900 leading-relaxed">{children}</p>
      </div>
    </div>
  )
}

function ProBadge() {
  return (
    <span className="inline-flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-700 rounded-full px-2 py-0.5 font-syne text-[11px] font-bold ml-2 align-middle">
      <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
      Plan Pro
    </span>
  )
}

function Steps({ items }: { items: string[] }) {
  return (
    <ol className="space-y-3 mt-4">
      {items.map((item, i) => (
        <li key={i} className="flex gap-3.5">
          <span className="shrink-0 w-6 h-6 rounded-full bg-[#2563EB]/10 text-[#2563EB] font-syne text-[11px] font-bold flex items-center justify-center mt-0.5">
            {i + 1}
          </span>
          <p className="font-syne text-[14px] text-[#374151] leading-relaxed" dangerouslySetInnerHTML={{ __html: item }} />
        </li>
      ))}
    </ol>
  )
}

export default function GuidePage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-12 sm:px-8 sm:py-16">

      {/* Page header */}
      <div className="mb-12">
        <p className="font-syne text-[11px] font-semibold uppercase tracking-[0.16em] text-[#F59E0B] mb-3">
          Documentation
        </p>
        <h1 className="font-fraunces text-[32px] sm:text-[42px] text-[#0F1B4D] tracking-tight leading-tight mb-4">
          Guide d&apos;utilisation
        </h1>
        <p className="font-syne text-[15px] text-[#6B7280] max-w-xl leading-relaxed">
          Tout ce qu&apos;il faut savoir pour tirer le meilleur de Stratly, de la création de compte à l&apos;export du mémoire.
        </p>
      </div>

      <div className="flex gap-10 items-start">

        {/* Sticky table of contents — desktop */}
        <aside className="hidden lg:block w-52 shrink-0 sticky top-8">
          <p className="font-syne text-[10px] font-semibold uppercase tracking-widest text-[#9CA3AF] mb-3">
            Sommaire
          </p>
          <nav>
            <ul className="space-y-1">
              {sections.map(s => (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    className="font-syne text-[13px] text-[#6B7280] hover:text-[#2563EB] transition-colors duration-150 block py-0.5"
                  >
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        {/* Mobile TOC */}
        <div className="lg:hidden w-full mb-8">
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-4">
            <p className="font-syne text-[10px] font-semibold uppercase tracking-widest text-[#9CA3AF] mb-3">
              Sommaire
            </p>
            <div className="flex flex-wrap gap-2">
              {sections.map(s => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className="font-syne text-[12px] font-semibold text-[#2563EB] bg-[#EFF6FF] border border-[#BFDBFE] rounded-full px-3 py-1 hover:bg-[#DBEAFE] transition-colors duration-150"
                >
                  {s.label}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0 space-y-14">

          {/* ── Bien démarrer ── */}
          <section id="demarrer" className="scroll-mt-8">
            <h2 className="font-fraunces text-[24px] sm:text-[28px] text-[#0F1B4D] tracking-tight mb-5">
              Bien démarrer
            </h2>
            <SectionApport>
              Un compte prêt en 10 minutes, et des résultats fidèles à votre entreprise dès la première analyse.
            </SectionApport>
            <Steps items={[
              'Créez votre compte avec votre email professionnel et confirmez-le depuis le mail reçu.',
              'Complétez votre profil entreprise : raison sociale, métiers, chiffre d\'affaires, effectif, zone d\'intervention, certifications, capacité de caution.',
              'Ajoutez vos moyens humains, matériels et vos méthodes : ils alimentent le mémoire technique.',
              'Importez vos références chantiers (voir la section <a href="#references" class="text-[#2563EB] font-semibold hover:underline">Références</a>).',
              'Lancez votre première analyse.',
            ]} />
            <Astuce>
              La barre de complétude du profil vous indique ce qui manque. Plus elle est haute, plus le Go/No-Go et le mémoire sont précis.
            </Astuce>
          </section>

          {/* ── Analyser un AO ── */}
          <section id="analyse" className="scroll-mt-8">
            <h2 className="font-fraunces text-[24px] sm:text-[28px] text-[#0F1B4D] tracking-tight mb-5">
              Analyser un appel d&apos;offres
            </h2>
            <SectionApport>
              En 2 minutes, tout ce qu&apos;il faut savoir sur un dossier de 200 pages.
            </SectionApport>
            <Steps items={[
              'Menu « Analyser un AO », déposez le DCE : un PDF, plusieurs PDF ou un ZIP (règlement de consultation, CCAP, CCTP, avis).',
              'Patientez pendant l\'analyse (2 minutes environ), vous pouvez naviguer ailleurs.',
              'Lisez la synthèse : objet, acheteur, lots, dates clés, pièces à fournir, critères de notation et pondérations, points de vigilance, montant estimé.',
              'Consultez le verdict Go / No-Go : il croise le dossier avec votre profil et argumente sa recommandation.',
              'Retrouvez toutes vos analyses dans « Mes analyses ».',
            ]} />
            <Astuce>
              Déposez toujours le règlement de consultation, c&apos;est lui qui contient les critères de notation et les dates.
            </Astuce>
          </section>

          {/* ── Historique acheteur ── */}
          <section id="historique" className="scroll-mt-8">
            <h2 className="font-fraunces text-[24px] sm:text-[28px] text-[#0F1B4D] tracking-tight mb-1">
              Historique de l&apos;acheteur et positionnement prix
              <ProBadge />
            </h2>
            <p className="font-syne text-[13px] text-[#9CA3AF] mb-5">Disponible sur les plans Essentiel et Pro.</p>
            <SectionApport>
              Ce que cet acheteur a réellement payé sur ses marchés similaires, et à qui.
            </SectionApport>
            <Steps items={[
              'Sur la page d\'une analyse, descendez jusqu\'à « Historique de l\'acheteur ».',
              'Vous voyez le nombre de marchés similaires attribués, le montant médian et moyen, et les entreprises qui gagnent chez lui.',
              'Dans « Positionnement prix », saisissez le montant HT de votre offre pour le lot visé (pas du programme entier).',
              'Votre prix est placé sur la fourchette des prix gagnants : sous le marché, dans le marché, au-dessus.',
            ]} />
            <Astuce>
              Les montants sont des montants d&apos;attribution hors taxes issus des données publiques (DECP). Ils sont indicatifs : certains acheteurs publient avec retard.
            </Astuce>
          </section>

          {/* ── Références chantiers ── */}
          <section id="references" className="scroll-mt-8">
            <h2 className="font-fraunces text-[24px] sm:text-[28px] text-[#0F1B4D] tracking-tight mb-5">
              Références chantiers
            </h2>
            <SectionApport>
              Des références réelles dans chaque mémoire, et un Go/No-Go qui connaît votre expérience.
            </SectionApport>
            <Steps items={[
              'Menu « Mon entreprise », onglet « Références ».',
              'Pour importer une liste : « Importer depuis Excel », déposez votre fichier (.xlsx ou .csv). Stratly détecte les colonnes ; vérifiez la correspondance (titre, maître d\'ouvrage, année, montant, description).',
              'Les doublons (même titre et même année) sont signalés avant l\'import. Maximum 500 références par import.',
              'Pour saisir à la main : « Ajouter une référence », remplissez titre, maître d\'ouvrage, année, montant, domaines, site occupé.',
              'Modifiez ou supprimez une référence depuis la liste.',
            ]} />
            <Astuce>
              Indiquez les domaines (gazon synthétique, VRD, électricité…) : le mémoire sélectionne les références les plus proches de l&apos;appel d&apos;offres.
            </Astuce>
          </section>

          {/* ── Bibliothèque de contenus ── */}
          <section id="bibliotheque" className="scroll-mt-8">
            <h2 className="font-fraunces text-[24px] sm:text-[28px] text-[#0F1B4D] tracking-tight mb-1">
              Bibliothèque de contenus
            </h2>
            <p className="font-syne text-[13px] text-[#6B7280] mb-6">Disponible sur tous les plans</p>
            <SectionApport>
              Votre bibliothèque stocke les contenus de vos mémoires types (présentation, procédés, sécurité, environnement…).
              À la génération, Stratly les récupère et <strong>réécrit chaque section pour l&apos;appel d&apos;offres en cours</strong> — vous gardez votre fond technique, adapté à chaque marché.
            </SectionApport>
            <Steps items={[
              'Allez dans « Bibliothèque » dans le menu lateral.',
              'Cliquez sur « Importer un .docx » pour charger votre mémoire type : le document est découpé en blocs selon vos titres (H1/H2/H3).',
              "Vérifiez et ajustez la catégorisation proposée par l'IA (présentation, procédés, sécurité, etc.).",
              'Créez aussi des blocs manuellement, ou fusionnez deux blocs similaires en un seul.',
              'Retournez sur « Mémoire technique » : si la bibliothèque est renseignée, la génération se fait section par section avec une barre de progression.',
            ]} />
            <Astuce>
              Plus vos blocs sont précis et bien catégorisés, plus la personnalisation sera fine. Un bloc « Procédés d&apos;exécution » avec des chiffres réels (effectifs, équipements, certifications) donnera un mémoire bien plus fort qu&apos;un bloc générique.
            </Astuce>
          </section>

          {/* ── Mémoire technique ── */}
          <section id="memoire" className="scroll-mt-8">
            <h2 className="font-fraunces text-[24px] sm:text-[28px] text-[#0F1B4D] tracking-tight mb-1">
              Mémoire technique
              <ProBadge />
            </h2>
            <p className="font-syne text-[13px] text-[#9CA3AF] mb-5">Disponible sur les plans Essentiel et Pro.</p>
            <SectionApport>
              Une trame complète, construite sur la grille de notation de l&apos;acheteur, avec vos références et vos moyens.
            </SectionApport>
            <Steps items={[
              'Depuis la page d\'une analyse, cliquez « Générer le mémoire technique ».',
              'Patientez 1 à 3 minutes : le mémoire est structuré selon les sous-critères du règlement de consultation, avec un volume proportionnel à chaque pondération.',
              'Relisez et modifiez librement dans l\'éditeur ; la sauvegarde est automatique.',
              'Exportez en Word (.docx) pour finaliser la mise en page et ajouter vos illustrations.',
            ]} />
            <Astuce>
              C&apos;est un brouillon avancé, pas un document à envoyer tel quel. Relisez chaque point de vigilance : le mémoire y répond nommément, vérifiez que la réponse correspond à votre organisation réelle.
            </Astuce>
          </section>

          {/* ── Chiffrage automatique ── */}
          <section id="chiffrage" className="scroll-mt-8">
            <h2 className="font-fraunces text-[24px] sm:text-[28px] text-[#0F1B4D] tracking-tight mb-1">
              Chiffrage automatique
              <ProBadge />
            </h2>
            <p className="font-syne text-[13px] text-[#9CA3AF] mb-5">Disponible sur le plan Pro.</p>
            <SectionApport>
              Plus de copier-coller ligne par ligne de votre chiffrage dans le fichier de l&apos;acheteur, et un acte d&apos;engagement rempli avec les montants en lettres.
            </SectionApport>
            <Steps items={[
              'Menu « Chiffrage », étape 1 : déposez le bordereau de l\'acheteur (DPGF, DQE ou BPU au format .xlsx) et l\'export de votre chiffrage (.xlsx ou .csv, issu de votre CRM ou de votre Excel).',
              'Étape 2 : vérifiez les colonnes détectées (désignation, unité, quantité, prix unitaire, montant) pour chaque onglet, corrigez si besoin.',
              'Étape 3 : contrôlez le rapprochement des lignes. Vert : correspondance sûre. Orange : à vérifier. Rouge : non trouvée, choisissez la ligne dans la liste ou laissez vide.',
              'Étape 4 : téléchargez le bordereau rempli. Les prix unitaires sont copiés, la mise en forme et les formules de l\'acheteur sont conservées.',
              'Renseignez l\'objet, l\'acheteur, la durée et le lieu, puis téléchargez l\'acte d\'engagement (.docx) : montants HT, TVA et TTC en chiffres et en toutes lettres.',
            ]} />
            <Astuce>
              Vos fichiers de prix ne sont pas conservés. Seul le récapitulatif (nombre de lignes, total) reste dans votre historique. Si les quantités diffèrent entre votre chiffrage et le bordereau, la quantité de l&apos;acheteur est conservée et l&apos;écart vous est signalé.
            </Astuce>
          </section>

          {/* ── Veille ── */}
          <section id="veille" className="scroll-mt-8">
            <h2 className="font-fraunces text-[24px] sm:text-[28px] text-[#0F1B4D] tracking-tight mb-1">
              Veille appels d&apos;offres
              <ProBadge />
            </h2>
            <p className="font-syne text-[13px] text-[#9CA3AF] mb-5">Disponible sur le plan Pro.</p>
            <SectionApport>
              Les nouveaux dossiers qui correspondent à votre profil, sans surveiller les plateformes.
            </SectionApport>
            <Steps items={[
              'Menu « Appels d\'offres ».',
              'Les dossiers remontés correspondent à vos métiers et votre zone ; affinez avec les filtres.',
              'Ouvrez un dossier et lancez l\'analyse en un clic.',
            ]} />
          </section>

          {/* ── Abonnement & support ── */}
          <section id="compte" className="scroll-mt-8">
            <h2 className="font-fraunces text-[24px] sm:text-[28px] text-[#0F1B4D] tracking-tight mb-5">
              Abonnement, facturation, support
            </h2>
            <Steps items={[
              'Menu <a href="/pricing" class="text-[#2563EB] font-semibold hover:underline">« Tarifs »</a> pour passer en Pro ; paiement sécurisé par carte, sans engagement, résiliable à tout moment depuis « Paramètres ».',
              'Vos factures sont envoyées par email à chaque prélèvement.',
              'Une question ? L\'assistant en bas à droite répond 24h/24 et transmet à l\'équipe ce qu\'il ne peut pas traiter. Vous pouvez aussi écrire à l\'adresse de contact indiquée dans les <a href="/mentions-legales" class="text-[#2563EB] font-semibold hover:underline">mentions légales</a>.',
            ]} />
          </section>

          {/* CTA */}
          <div className="pt-4 border-t border-[#E5E7EB]">
            <p className="font-syne text-[13px] text-[#9CA3AF] mb-4">Prêt à commencer ?</p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 bg-[#2563EB] text-white font-syne font-bold text-[13px] rounded-xl px-5 py-2.5 hover:bg-[#1D4ED8] transition-colors duration-150"
              >
                Créer mon compte →
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 bg-white border border-[#E5E7EB] text-[#374151] font-syne font-semibold text-[13px] rounded-xl px-5 py-2.5 hover:border-[#2563EB]/40 hover:text-[#2563EB] transition-colors duration-150"
              >
                Accéder au tableau de bord
              </Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
