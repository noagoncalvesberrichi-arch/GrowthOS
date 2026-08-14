-- Table: memoires
-- Un mémoire technique par (user, analyse). Sauvegarde auto à chaque édition.

create table if not exists memoires (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references auth.users(id) on delete cascade,
  analyse_id  uuid        not null references analyses(id) on delete cascade,
  contenu     text        not null default '',
  updated_at  timestamptz not null default now(),
  unique (user_id, analyse_id)
);

alter table memoires enable row level security;

create policy "users_own_memoires"
  on memoires for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);
