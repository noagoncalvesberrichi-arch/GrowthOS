create table if not exists public.chiffrages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  nom_fichier_acheteur text not null,
  nom_fichier_crm text not null,
  nb_lignes integer not null default 0,
  nb_rapprochees integer not null default 0,
  montant_total_ht numeric,
  statut text not null default 'ok'
);

alter table public.chiffrages enable row level security;

create policy "chiffrages_own" on public.chiffrages
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists chiffrages_user_id_idx on public.chiffrages(user_id);
