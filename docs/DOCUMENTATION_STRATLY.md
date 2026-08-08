# Stratly — Documentation technique de passation

> Dernière mise à jour : 8 août 2026. Objectif : permettre à un développeur
> de reprendre le projet sans dépendre de la mémoire du fondateur.

## 1. Vue d'ensemble

Stratly (stratly.fr) est un SaaS d'analyse d'appels d'offres BTP pour les PME.
L'utilisateur uploade un DCE/avis de marché (PDF), l'application produit :
une analyse structurée (dates clés, lots, critères, pièces, points de vigilance),
un verdict Go/No-Go avec score d'éligibilité basé sur le profil de son entreprise,
et une section "Historique de l'acheteur" basée sur les données publiques
d'attribution (DECP).

## 2. Stack technique

- **Frontend/Backend** : Next.js (App Router, TypeScript), repo GitHub
  `noagoncalvesberrichi-arch/GrowthOS` (nom historique du repo, le produit est Stratly)
- **Hébergement** : Vercel (déploiement automatique à chaque push sur `main`)
- **Base de données & Auth** : Supabase (projet "Stratly", ref `focftfqgbwnxbwvkpzbm`,
  région eu-west-1, Postgres 17) — plan Free au 8 août 2026 (⚠️ passage Pro prévu
  avec les premiers clients : supprime la mise en pause auto après inactivité et
  débloque la protection "leaked passwords")
- **IA d'analyse** : API Claude (Anthropic) — extraction structurée JSON depuis le PDF
- **Paiement** : Stripe (mode live, Price IDs dans les variables d'env Vercel :
  `STRIPE_PRICE_ID_MENSUEL` etc.)
- **Email** : Resend (email de bienvenue au premier login)
- **CI** : GitHub Actions (ingestion DECP hebdomadaire, voir §5)

## 3. Structure du repo (dossiers clés)

- `app/(marketing)/` — landing, pricing (actions Stripe)
- `app/(dashboard)/dashboard/mes-analyses/[id]/` — page de détail d'une analyse
- `app/onboarding/` — écran de saisie du profil entreprise
- `app/(dashboard)/dashboard/analyser/actions.ts` — cœur de l'analyse : appel Claude, type `AOResult`
  (contient notamment `siret_acheteur: string | null` et `code_cpv: string | null`)
- `components/HistoriqueAcheteur.tsx` — section historique acheteur (voir §6)
- `app/(dashboard)/dashboard/analyser/UploadForm.tsx` — upload + affichage du résultat immédiat
- `scripts/ingest_decp.py` — ingestion DECP (voir §5)
- `.github/workflows/ingest-decp.yml` — cron d'ingestion
- `supabase/migrations/` — migrations SQL versionnées

## 4. Base de données (schéma public)

Toutes les tables ont RLS activé.

- `analyses` — id, user_id, created_at, nom_fichier, objet_marche,
  `resultat` (jsonb, l'AOResult complet), tronque (bool)
- `profil_entreprise` — profil déclaré par le client (domaines d'activité,
  certifications, CA, zone…), utilisé pour le Go/No-Go
- `abonnements` — état des abonnements Stripe
- `prospects` — CRM interne de prospection (RLS sans policy = accès backend
  service_role uniquement, c'est voulu)
- `sms_logs` — ⚠️ legacy d'un ancien projet (colonnes patient_id/cabinet_id),
  candidate à suppression
- `decp_attributions` — attributions de marchés publics BTP (voir §5).
  Clé primaire composite : `(uid, modification_id, titulaire_id)`.
  `titulaire_id` ne doit JAMAIS être NULL (chaîne vide si absent).
  Index sur acheteur_siret, code_cpv, date_notification.
  Policy : lecture pour `authenticated`, écriture service_role uniquement.

## 5. Pipeline DECP (données d'attribution)

- **Source** : DECP consolidées format tabulaire (data.gouv.fr, jeu maintenu
  par Colin Maudry / decp.info, mis à jour quotidiennement).
  URL de la ressource Parquet (≈230 Mo, ~3,2M lignes) :
  `https://www.data.gouv.fr/api/1/datasets/r/11cea8e8-df3e-4ed1-932b-781e2635e432`
  ⚠️ Ne pas confondre avec l'URL du *schéma* (9a4144c0-…) qui renvoie un petit
  fichier de description.
- **Filtre** : CPV commençant par `45` (travaux BTP) → ~1,38M lignes
- **Script** : `scripts/ingest_decp.py`. Transformations :
  - mapping colonnes source → colonnes table (voir COLMAP dans le script)
  - dates converties ISO ; dates < 2000 ou > 2030 → NULL
  - `duree_mois` → entier ; chaînes vides → NULL
  - `titulaire_id` NULL → `""` (contrainte de clé primaire)
  - upsert par batchs de 500 sur la clé composite (idempotent : relançable
    sans doublons)
  - garde-fou : si le fichier téléchargé fait < 50 Mo, on annule (l'URL ne
    renvoie plus le bon fichier)
- **Automatisation** : GitHub Actions, cron chaque lundi 03h00 UTC +
  déclenchement manuel (onglet Actions → Run workflow).
  Secret requis : `SUPABASE_SERVICE_KEY` (clé service_role Supabase) dans
  Settings → Secrets and variables → Actions.
- **Nettoyages ponctuels déjà appliqués en base** (7 août 2026) : propagation
  des noms d'acheteurs par SIRET, normalisation chaînes vides.

## 6. Fonctionnalité "Historique de l'acheteur"

- **RPC Postgres** : `get_historique_acheteur(p_siret text, p_cpv_prefix text default null)`
  (migration `rpc_historique_acheteur`). Renvoie un JSON :
  acheteur_nom, nb_marches, montant_moyen, montant_median,
  derniers_marches (10 max), top_titulaires (5 max).
  Déduplique par uid (dernière modification), filtre les montants hors
  [1 000 ; 10 Md€]. `search_path` fixé (sécurité). GRANT execute à authenticated.
- **Extraction côté analyse** : le prompt Claude extrait `siret_acheteur`
  (14 chiffres) et `code_cpv` (8 chiffres) du DCE.
- **Composant** `components/HistoriqueAcheteur.tsx` : appelé avec le SIRET + CPV extraits.
  Logique en 2 temps : appel avec `cpv.slice(0,4)` ; si < 10 marchés → repli
  sur le préfixe `"45"` avec label "ensemble des marchés de travaux" ; sinon
  label "marchés similaires (CPV XXXXxxxx)".
- **Affichage** : sur la page de résultat immédiat (`app/(dashboard)/dashboard/analyser/UploadForm.tsx`)
  ET sur `app/(dashboard)/dashboard/mes-analyses/[id]/page.tsx`. Ne s'affiche que si
  `siret_acheteur` est présent (les analyses antérieures au 6 août 2026 n'en ont pas).

## 7. Points connus / TODO technique

- 197 acheteurs (≈6 300 lignes, 0,9 %) sans nom dans la source → enrichissement
  possible via l'API SIRENE (INSEE) à partir du SIRET.
- `sms_logs` : table legacy à supprimer après vérification qu'aucun code n'y accède.
- Supabase plan Free : projet mis en pause après ~1 semaine d'inactivité
  (incident du 6 août 2026 : restauré via API). Passer au plan Pro dès les
  premiers clients.
- Activer "Leaked password protection" (Auth → Attack Protection) une fois en Pro.
- Extraction SIRET/CPV : fiable sur les avis structurés ; à surveiller sur les
  DCE scannés ou mal structurés.

## 8. Roadmap produit validée

1. **V2 pricing intelligence** : score de probabilité de gain + recommandation
   de prix, à partir de decp_attributions (la donnée est déjà en base).
2. **Veille personnalisée** : alertes quotidiennes par client (CPV + zone),
   levier de rétention n°1.
3. **Self-serve complet** : essai → paiement Stripe sans intervention humaine.
4. **Monitoring** : alertes uptime + échec d'ingestion (Sentry ou équivalent).

## 9. Accès à connaître (ne jamais commiter de secrets)

- Vercel : variables d'env (Stripe live, Supabase URL/keys, Resend, Anthropic)
- Supabase : clés dans Dashboard → Settings → API ; la service_role ne doit
  exister que côté serveur (Vercel env) et dans le secret GitHub Actions
- GitHub : secret `SUPABASE_SERVICE_KEY` pour le workflow d'ingestion
