-- =============================================================================
-- Tiri: il gruppo vede solo totale ed esito (docs/02-database.md §2.4)
--   dice_rolls      → tiro completo, visibile a chi tira e al Master
--   dice_roll_feed  → proiezione pubblica (personaggio, dado, totale, esito), per tutto il gruppo
-- Scritta senza DROP/DELETE: i tiri nascosti restano nel feed con hidden = true
-- e la regola di lettura li esclude.
-- =============================================================================

create type public.roll_outcome as enum ('success', 'failure', 'critical_failure');

alter table public.dice_rolls
  alter column outcome type public.roll_outcome using outcome::public.roll_outcome;

-- Il tiro completo ora lo vedono solo chi tira e il Master.
alter policy "dice_rolls_select" on public.dice_rolls
  using (roller_id = (select auth.uid()) or private.is_campaign_master(campaign_id));

-- Chi tira (o il Master) può aggiornare l'esito dopo il tiro (es. "successo" deciso al tavolo).
create policy "dice_rolls_update" on public.dice_rolls for update to authenticated
  using (roller_id = (select auth.uid()) or private.is_campaign_master(campaign_id))
  with check (roller_id = (select auth.uid()) or private.is_campaign_master(campaign_id));

create table public.dice_roll_feed (
  roll_id        uuid primary key references public.dice_rolls (id) on delete cascade,
  campaign_id    uuid not null references public.campaigns (id) on delete cascade,
  character_id   uuid not null references public.characters (id) on delete cascade,
  character_name text not null,
  die            public.die_kind not null,
  total          integer,
  outcome        public.roll_outcome,
  hidden         boolean not null default false,
  created_at     timestamptz not null
);

create index dice_roll_feed_campaign_created_idx on public.dice_roll_feed (campaign_id, created_at desc);
create index dice_roll_feed_character_id_idx on public.dice_roll_feed (character_id);

alter table public.dice_roll_feed enable row level security;

-- Sola lettura per i membri della campagna (tiri nascosti esclusi); si scrive solo tramite trigger.
create policy "dice_roll_feed_select" on public.dice_roll_feed for select to authenticated
  using (private.is_campaign_member(campaign_id) and not hidden);

create function private.sync_dice_roll_feed()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.dice_roll_feed (roll_id, campaign_id, character_id, character_name, die, total, outcome, hidden, created_at)
  select new.id, new.campaign_id, new.character_id, c.name, new.die, new.total, new.outcome, new.hidden, new.created_at
  from public.characters c
  where c.id = new.character_id
  on conflict (roll_id) do update
    set total   = excluded.total,
        outcome = excluded.outcome,
        hidden  = excluded.hidden;
  return new;
end;
$$;

revoke execute on function private.sync_dice_roll_feed() from public, anon, authenticated;

create trigger dice_rolls_sync_feed after insert or update on public.dice_rolls
  for each row execute function private.sync_dice_roll_feed();

-- Realtime: il gruppo ascolta il feed; chi tira e il Master ascoltano anche dice_rolls.
alter publication supabase_realtime add table public.dice_roll_feed;
