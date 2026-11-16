-- Registro dell'esperienza: ogni +/− è una voce. Il totale si calcola sempre sommando le voci,
-- non si salva. characters.xp_total resta solo come valore storico dell'import e non si usa più.

create table public.character_xp_entries (
  id           uuid primary key default gen_random_uuid(),
  character_id uuid not null references public.characters (id) on delete cascade,
  amount       integer not null check (amount <> 0),
  note         text not null default '',
  created_by   uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at   timestamptz not null default now()
);

create index character_xp_entries_character_id_idx on public.character_xp_entries (character_id, created_at);

alter table public.character_xp_entries enable row level security;

-- Registro in sola aggiunta: un errore si corregge con una voce di segno opposto.
create policy "character_xp_entries_select" on public.character_xp_entries for select to authenticated
  using (private.can_access_character(character_id));
create policy "character_xp_entries_insert" on public.character_xp_entries for insert to authenticated
  with check (private.can_access_character(character_id) and created_by = (select auth.uid()));

-- Esperienza già accumulata (dal foglio): una voce iniziale per personaggio.
insert into public.character_xp_entries (character_id, amount, note, created_by)
select id, xp_total, 'Esperienza dal foglio', null
from public.characters
where xp_total > 0;
