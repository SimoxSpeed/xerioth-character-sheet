-- =============================================================================
-- Xerioth Character Sheet — schema iniziale
-- Vedi docs/02-database.md
--
-- Dati statici (razze, classi, divinità, allineamenti, catalogo capacità,
-- tabelle dei costi) NON stanno qui: sono in src/game/data/ (git) e vengono
-- referenziati con chiavi testuali (race_key, class_key, skill_key, ...).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Tipi enumerati
-- -----------------------------------------------------------------------------
create type public.member_role as enum ('player', 'master');
create type public.attribute_key as enum ('abilita', 'costituzione', 'intelligenza', 'riflessi', 'freddezza', 'fascino');
create type public.power_kind as enum ('miracle', 'spell', 'mental');
create type public.item_category as enum ('usable', 'equipment');
create type public.item_slot as enum ('weapon', 'armor');
create type public.journal_kind as enum ('prayer', 'note', 'todo', 'purchase', 'communication', 'conversation', 'story', 'lore', 'npc');
create type public.journal_visibility as enum ('private', 'master');
create type public.thread_target as enum ('character', 'attribute', 'skill', 'power', 'item', 'journal');
create type public.thread_status as enum ('open', 'answered', 'closed');
create type public.die_kind as enum ('d20', 'd4', 'coin');

-- Funzioni di supporto in uno schema NON esposto dalle API.
create schema if not exists private;
grant usage on schema private to authenticated;

create function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- Utenti
-- -----------------------------------------------------------------------------
create table public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create trigger profiles_updated_at before update on public.profiles
  for each row execute function private.set_updated_at();

-- Crea il profilo alla registrazione.
create function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'display_name', ''), split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function private.handle_new_user();

-- -----------------------------------------------------------------------------
-- Campagne e ruoli (il ruolo si gestisce SOLO da database: nessuna policy
-- di scrittura su campaign_members per gli utenti dell'app)
-- -----------------------------------------------------------------------------
create table public.campaigns (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (length(trim(name)) > 0),
  description text not null default '',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger campaigns_updated_at before update on public.campaigns
  for each row execute function private.set_updated_at();

create table public.campaign_members (
  campaign_id uuid not null references public.campaigns (id) on delete cascade,
  user_id     uuid not null references public.profiles (id) on delete cascade,
  role        public.member_role not null default 'player',
  created_at  timestamptz not null default now(),
  primary key (campaign_id, user_id)
);

create index campaign_members_user_id_idx on public.campaign_members (user_id);

-- -----------------------------------------------------------------------------
-- Personaggi
-- -----------------------------------------------------------------------------
create table public.characters (
  id             uuid primary key default gen_random_uuid(),
  campaign_id    uuid not null references public.campaigns (id) on delete cascade,
  owner_id       uuid not null references public.profiles (id) on delete cascade,
  name           text not null check (length(trim(name)) > 0),
  race_key       text,
  age            integer check (age >= 0),
  alignment_key  text,
  height_cm      integer check (height_cm > 0),
  weight_kg      integer check (weight_kg > 0),
  eyes           text not null default '',
  skin           text not null default '',
  hair           text not null default '',
  level          integer not null default 1 check (level >= 0),
  xp_total       integer not null default 0 check (xp_total >= 0),
  hp_bonus       integer not null default 0,
  temp_hp        integer not null default 0 check (temp_hp >= 0),
  damage_taken   integer not null default 0 check (damage_taken >= 0),
  madness_points integer not null default 0 check (madness_points >= 0),
  fate_points    integer not null default 0 check (fate_points >= 0),
  gold           bigint  not null default 0,
  portrait_url   text,
  background     text not null default '',
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index characters_campaign_id_idx on public.characters (campaign_id);
create index characters_owner_id_idx on public.characters (owner_id);

create trigger characters_updated_at before update on public.characters
  for each row execute function private.set_updated_at();

create table public.character_classes (
  id           uuid primary key default gen_random_uuid(),
  character_id uuid not null references public.characters (id) on delete cascade,
  class_key    text not null,
  deity_key    text,
  patron       text,
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index character_classes_character_id_idx on public.character_classes (character_id);

create trigger character_classes_updated_at before update on public.character_classes
  for each row execute function private.set_updated_at();

create table public.character_resources (
  character_id uuid not null references public.characters (id) on delete cascade,
  resource_key text not null,
  current      integer not null default 0,
  max          integer check (max >= 0),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  primary key (character_id, resource_key)
);

create trigger character_resources_updated_at before update on public.character_resources
  for each row execute function private.set_updated_at();

create table public.character_attributes (
  character_id uuid not null references public.characters (id) on delete cascade,
  attribute    public.attribute_key not null,
  value        integer not null default 10 check (value >= 0),
  advancement  integer not null default 0 check (advancement >= 0),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  primary key (character_id, attribute)
);

create trigger character_attributes_updated_at before update on public.character_attributes
  for each row execute function private.set_updated_at();

create table public.character_skills (
  id           uuid primary key default gen_random_uuid(),
  character_id uuid not null references public.characters (id) on delete cascade,
  skill_key    text,
  custom_name  text,
  attribute    public.attribute_key not null,
  level        integer check (level >= 0),          -- null = non appresa (NA)
  advancement  integer not null default 0 check (advancement >= 0),
  is_maxed     boolean not null default false,
  description  text,
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint character_skills_has_name check (skill_key is not null or length(trim(custom_name)) > 0)
);

create index character_skills_character_id_idx on public.character_skills (character_id);

create trigger character_skills_updated_at before update on public.character_skills
  for each row execute function private.set_updated_at();

create table public.character_powers (
  id                uuid primary key default gen_random_uuid(),
  character_id      uuid not null references public.characters (id) on delete cascade,
  kind              public.power_kind not null,
  name              text not null check (length(trim(name)) > 0),
  level             integer check (level >= 0),     -- null = NA
  is_maxed          boolean not null default false,
  acquisition_level integer check (acquisition_level >= 0),
  range             text not null default '',
  area              text not null default '',
  cast_time         text not null default '',
  cost              text not null default '',
  duration          text not null default '',
  advancement       integer not null default 0 check (advancement >= 0),
  is_special        boolean not null default false,
  granted_by        text,
  description       text not null default '',
  sort_order        integer not null default 0,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index character_powers_character_id_idx on public.character_powers (character_id);

create trigger character_powers_updated_at before update on public.character_powers
  for each row execute function private.set_updated_at();

create table public.character_items (
  id                uuid primary key default gen_random_uuid(),
  character_id      uuid not null references public.characters (id) on delete cascade,
  category          public.item_category not null,
  slot              public.item_slot,
  equipped          boolean not null default false,
  name              text not null check (length(trim(name)) > 0),
  description       text not null default '',
  quantity          integer not null default 1 check (quantity >= 0),
  charges_remaining integer check (charges_remaining >= 0),
  charges_total     integer check (charges_total >= 0),
  value             text,
  sort_order        integer not null default 0,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint character_items_slot_only_equipment check (slot is null or category = 'equipment')
);

create index character_items_character_id_idx on public.character_items (character_id);

create trigger character_items_updated_at before update on public.character_items
  for each row execute function private.set_updated_at();

create table public.journal_entries (
  id           uuid primary key default gen_random_uuid(),
  character_id uuid not null references public.characters (id) on delete cascade,
  kind         public.journal_kind not null default 'note',
  chapter      text,
  title        text,
  body         text not null default '',
  addressed_to text,
  tags         text[] not null default '{}',
  visibility   public.journal_visibility not null default 'master',
  done         boolean not null default false,
  sort_order   integer not null default 0,
  search       tsvector generated always as (
                 to_tsvector('italian', coalesce(title, '') || ' ' || coalesce(chapter, '') || ' ' || body)
               ) stored,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index journal_entries_character_id_idx on public.journal_entries (character_id);
create index journal_entries_search_idx on public.journal_entries using gin (search);

create trigger journal_entries_updated_at before update on public.journal_entries
  for each row execute function private.set_updated_at();

-- -----------------------------------------------------------------------------
-- Domande al Master
-- -----------------------------------------------------------------------------
create table public.master_threads (
  id              uuid primary key default gen_random_uuid(),
  character_id    uuid not null references public.characters (id) on delete cascade,
  target_type     public.thread_target not null default 'character',
  target_id       text,
  title           text not null check (length(trim(title)) > 0),
  status          public.thread_status not null default 'open',
  created_by      uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  last_message_at timestamptz not null default now(),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index master_threads_character_id_idx on public.master_threads (character_id);
create index master_threads_created_by_idx on public.master_threads (created_by);
create index master_threads_target_idx on public.master_threads (character_id, target_type, target_id);

create trigger master_threads_updated_at before update on public.master_threads
  for each row execute function private.set_updated_at();

create table public.thread_messages (
  id         uuid primary key default gen_random_uuid(),
  thread_id  uuid not null references public.master_threads (id) on delete cascade,
  author_id  uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  body       text not null check (length(trim(body)) > 0),
  created_at timestamptz not null default now()
);

create index thread_messages_thread_id_idx on public.thread_messages (thread_id, created_at);
create index thread_messages_author_id_idx on public.thread_messages (author_id);

-- -----------------------------------------------------------------------------
-- Tiri di dado (visibili al gruppo della campagna)
-- -----------------------------------------------------------------------------
create table public.dice_rolls (
  id           uuid primary key default gen_random_uuid(),
  campaign_id  uuid not null references public.campaigns (id) on delete cascade,
  character_id uuid not null references public.characters (id) on delete cascade,
  roller_id    uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  label        text not null default '',
  die          public.die_kind not null default 'd20',
  results      integer[] not null check (cardinality(results) > 0),
  total        integer,
  details      jsonb not null default '{}',
  outcome      text,
  hidden       boolean not null default false,
  created_at   timestamptz not null default now()
);

create index dice_rolls_campaign_created_idx on public.dice_rolls (campaign_id, created_at desc);
create index dice_rolls_character_id_idx on public.dice_rolls (character_id);
create index dice_rolls_roller_id_idx on public.dice_rolls (roller_id);

-- -----------------------------------------------------------------------------
-- Funzioni per le regole di accesso (security definer: evitano ricorsioni RLS)
-- -----------------------------------------------------------------------------
create function private.is_campaign_member(p_campaign_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.campaign_members m
    where m.campaign_id = p_campaign_id and m.user_id = (select auth.uid())
  );
$$;

create function private.is_campaign_master(p_campaign_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.campaign_members m
    where m.campaign_id = p_campaign_id
      and m.user_id = (select auth.uid())
      and m.role = 'master'
  );
$$;

-- Proprietario del personaggio?
create function private.is_character_owner(p_character_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.characters c
    where c.id = p_character_id and c.owner_id = (select auth.uid())
  );
$$;

-- Proprietario oppure Master della campagna del personaggio?
create function private.can_access_character(p_character_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.characters c
    where c.id = p_character_id
      and (
        c.owner_id = (select auth.uid())
        or exists (
          select 1 from public.campaign_members m
          where m.campaign_id = c.campaign_id
            and m.user_id = (select auth.uid())
            and m.role = 'master'
        )
      )
  );
$$;

create function private.is_master_of_character(p_character_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.characters c
    join public.campaign_members m on m.campaign_id = c.campaign_id
    where c.id = p_character_id
      and m.user_id = (select auth.uid())
      and m.role = 'master'
  );
$$;

create function private.can_access_thread(p_thread_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.master_threads t
    where t.id = p_thread_id and private.can_access_character(t.character_id)
  );
$$;

-- Condivide almeno una campagna con l'utente corrente?
create function private.shares_campaign_with(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.campaign_members me
    join public.campaign_members other on other.campaign_id = me.campaign_id
    where me.user_id = (select auth.uid()) and other.user_id = p_user_id
  );
$$;

grant execute on all functions in schema private to authenticated;

-- Nuovo messaggio: aggiorna stato e data della domanda.
-- Messaggio del Master → 'answered' (attende il giocatore); altrimenti → 'open'.
create function private.on_thread_message()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.master_threads t
  set last_message_at = new.created_at,
      status = case
                 when private.is_master_of_character(t.character_id) then 'answered'::public.thread_status
                 else 'open'::public.thread_status
               end
  where t.id = new.thread_id;
  return new;
end;
$$;

create trigger thread_messages_after_insert after insert on public.thread_messages
  for each row execute function private.on_thread_message();

-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------
alter table public.profiles             enable row level security;
alter table public.campaigns            enable row level security;
alter table public.campaign_members     enable row level security;
alter table public.characters           enable row level security;
alter table public.character_classes    enable row level security;
alter table public.character_resources  enable row level security;
alter table public.character_attributes enable row level security;
alter table public.character_skills     enable row level security;
alter table public.character_powers     enable row level security;
alter table public.character_items      enable row level security;
alter table public.journal_entries      enable row level security;
alter table public.master_threads       enable row level security;
alter table public.thread_messages      enable row level security;
alter table public.dice_rolls           enable row level security;

-- profiles: vedo me stesso e chi gioca con me; modifico solo me stesso.
create policy "profiles_select" on public.profiles for select to authenticated
  using (id = (select auth.uid()) or private.shares_campaign_with(id));
create policy "profiles_update_self" on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- campaigns: le vedono i membri; il Master può modificarne nome e descrizione.
create policy "campaigns_select" on public.campaigns for select to authenticated
  using (private.is_campaign_member(id));
create policy "campaigns_update_master" on public.campaigns for update to authenticated
  using (private.is_campaign_master(id)) with check (private.is_campaign_master(id));

-- campaign_members: sola lettura per i membri della stessa campagna.
create policy "campaign_members_select" on public.campaign_members for select to authenticated
  using (private.is_campaign_member(campaign_id));

-- characters: proprietario o Master della campagna.
create policy "characters_select" on public.characters for select to authenticated
  using (owner_id = (select auth.uid()) or private.is_campaign_master(campaign_id));
create policy "characters_insert" on public.characters for insert to authenticated
  with check (
    (owner_id = (select auth.uid()) and private.is_campaign_member(campaign_id))
    or private.is_campaign_master(campaign_id)
  );
create policy "characters_update" on public.characters for update to authenticated
  using (owner_id = (select auth.uid()) or private.is_campaign_master(campaign_id))
  with check (
    (owner_id = (select auth.uid()) and private.is_campaign_member(campaign_id))
    or private.is_campaign_master(campaign_id)
  );
create policy "characters_delete" on public.characters for delete to authenticated
  using (owner_id = (select auth.uid()) or private.is_campaign_master(campaign_id));

-- Tabelle figlie del personaggio: stesse regole del personaggio.
create policy "character_classes_all" on public.character_classes for all to authenticated
  using (private.can_access_character(character_id)) with check (private.can_access_character(character_id));
create policy "character_resources_all" on public.character_resources for all to authenticated
  using (private.can_access_character(character_id)) with check (private.can_access_character(character_id));
create policy "character_attributes_all" on public.character_attributes for all to authenticated
  using (private.can_access_character(character_id)) with check (private.can_access_character(character_id));
create policy "character_skills_all" on public.character_skills for all to authenticated
  using (private.can_access_character(character_id)) with check (private.can_access_character(character_id));
create policy "character_powers_all" on public.character_powers for all to authenticated
  using (private.can_access_character(character_id)) with check (private.can_access_character(character_id));
create policy "character_items_all" on public.character_items for all to authenticated
  using (private.can_access_character(character_id)) with check (private.can_access_character(character_id));

-- journal_entries: scrive solo il proprietario; il Master legge le voci non private.
create policy "journal_select" on public.journal_entries for select to authenticated
  using (
    private.is_character_owner(character_id)
    or (visibility = 'master' and private.is_master_of_character(character_id))
  );
create policy "journal_insert" on public.journal_entries for insert to authenticated
  with check (private.is_character_owner(character_id));
create policy "journal_update" on public.journal_entries for update to authenticated
  using (private.is_character_owner(character_id)) with check (private.is_character_owner(character_id));
create policy "journal_delete" on public.journal_entries for delete to authenticated
  using (private.is_character_owner(character_id));

-- master_threads: proprietario e Master.
create policy "threads_select" on public.master_threads for select to authenticated
  using (private.can_access_character(character_id));
create policy "threads_insert" on public.master_threads for insert to authenticated
  with check (private.can_access_character(character_id) and created_by = (select auth.uid()));
create policy "threads_update" on public.master_threads for update to authenticated
  using (private.can_access_character(character_id)) with check (private.can_access_character(character_id));
create policy "threads_delete" on public.master_threads for delete to authenticated
  using (created_by = (select auth.uid()) or private.is_master_of_character(character_id));

-- thread_messages: si leggono e si scrivono nelle domande accessibili; non si modificano.
create policy "thread_messages_select" on public.thread_messages for select to authenticated
  using (private.can_access_thread(thread_id));
create policy "thread_messages_insert" on public.thread_messages for insert to authenticated
  with check (author_id = (select auth.uid()) and private.can_access_thread(thread_id));

-- dice_rolls: il gruppo vede i tiri non nascosti; i nascosti solo chi tira e il Master.
create policy "dice_rolls_select" on public.dice_rolls for select to authenticated
  using (
    private.is_campaign_member(campaign_id)
    and (not hidden or roller_id = (select auth.uid()) or private.is_campaign_master(campaign_id))
  );
create policy "dice_rolls_insert" on public.dice_rolls for insert to authenticated
  with check (
    roller_id = (select auth.uid())
    and private.can_access_character(character_id)
    and exists (select 1 from public.characters c where c.id = character_id and c.campaign_id = dice_rolls.campaign_id)
  );
create policy "dice_rolls_delete" on public.dice_rolls for delete to authenticated
  using (roller_id = (select auth.uid()) or private.is_campaign_master(campaign_id));

-- -----------------------------------------------------------------------------
-- Realtime: tiri e domande arrivano subito a chi li può vedere
-- -----------------------------------------------------------------------------
alter publication supabase_realtime add table public.dice_rolls, public.master_threads, public.thread_messages;
