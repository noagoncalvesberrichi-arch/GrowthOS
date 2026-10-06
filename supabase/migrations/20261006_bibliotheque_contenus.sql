-- Bibliothèque de contenus réutilisables pour la génération de mémoires
-- La table est créée côté Supabase ; ce fichier sert de référence dans le dépôt.

create table if not exists public.bibliotheque_contenus (
  id           uuid        primary key default gen_random_uuid(),
  user_id      uuid        not null references auth.users(id) on delete cascade,
  titre        text        not null,
  categorie    text        not null default 'autre',
  contenu      text        not null default '',
  resume       text        not null default '',
  mots_cles    text[]      not null default '{}',
  source_fichier text,
  ordre        int         not null default 0,
  nb_mots      int         not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- RLS
alter table public.bibliotheque_contenus enable row level security;

create policy "Users can manage their own contenus"
  on public.bibliotheque_contenus
  for all
  using  ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Index de recherche rapide par user + catégorie
create index if not exists bibliotheque_contenus_user_id_idx
  on public.bibliotheque_contenus (user_id);

create index if not exists bibliotheque_contenus_categorie_idx
  on public.bibliotheque_contenus (user_id, categorie);

-- Catégories valides :
-- presentation | moyens_humains | moyens_materiels | procede_execution
-- securite | environnement | qualite | planning | autre
