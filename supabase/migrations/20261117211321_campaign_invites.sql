-- Campagne create dall'app, link d'invito e richieste di ingresso approvate dal Master.
-- Il proprietario accede ai suoi personaggi solo se è ancora membro della campagna.

-- -----------------------------------------------------------------------------
-- Inviti
-- -----------------------------------------------------------------------------
create table public.campaign_invites (
  id          uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns (id) on delete cascade,
  role        public.member_role not null default 'player',
  single_use  boolean not null default false,
  created_at  timestamptz not null default now(),
  expires_at  timestamptz not null default now() + interval '7 days',
  revoked_at  timestamptz,
  created_by  uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  -- Durata fissa: 7 giorni
  constraint campaign_invites_fixed_duration check (expires_at = created_at + interval '7 days')
);

create index campaign_invites_campaign_id_idx on public.campaign_invites (campaign_id);
create index campaign_invites_created_by_idx on public.campaign_invites (created_by);

-- -----------------------------------------------------------------------------
-- Richieste di ingresso
-- -----------------------------------------------------------------------------
create type public.join_request_status as enum ('pending', 'accepted', 'rejected');

create table public.campaign_join_requests (
  id          uuid primary key default gen_random_uuid(),
  invite_id   uuid not null references public.campaign_invites (id) on delete cascade,
  campaign_id uuid not null references public.campaigns (id) on delete cascade,
  user_id     uuid not null references public.profiles (id) on delete cascade,
  role        public.member_role not null,
  status      public.join_request_status not null default 'pending',
  decided_by  uuid references public.profiles (id) on delete set null,
  decided_at  timestamptz,
  created_at  timestamptz not null default now(),
  -- Una richiesta per utente e invito: dopo un rifiuto serve un invito nuovo
  constraint campaign_join_requests_invite_user_key unique (invite_id, user_id)
);

-- Al massimo una richiesta in attesa per utente e campagna
create unique index campaign_join_requests_pending_idx
  on public.campaign_join_requests (campaign_id, user_id) where status = 'pending';
create index campaign_join_requests_user_id_idx on public.campaign_join_requests (user_id);
create index campaign_join_requests_decided_by_idx on public.campaign_join_requests (decided_by);

-- -----------------------------------------------------------------------------
-- Funzioni per le regole di accesso
-- -----------------------------------------------------------------------------

-- L'utente corrente ha una richiesta in attesa verso la campagna?
create function private.has_pending_request(p_campaign_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.campaign_join_requests r
    where r.campaign_id = p_campaign_id and r.user_id = (select auth.uid()) and r.status = 'pending'
  );
$$;

-- L'utente indicato ha chiesto di entrare in una campagna di cui l'utente corrente è Master?
create function private.requested_my_campaign(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.campaign_join_requests r
    join public.campaign_members m on m.campaign_id = r.campaign_id
    where r.user_id = p_user_id
      and r.status = 'pending'
      and m.user_id = (select auth.uid())
      and m.role = 'master'
  );
$$;

-- Proprietario del personaggio e ancora membro della sua campagna?
create or replace function private.is_character_owner(p_character_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.characters c
    join public.campaign_members m on m.campaign_id = c.campaign_id and m.user_id = c.owner_id
    where c.id = p_character_id and c.owner_id = (select auth.uid())
  );
$$;

-- Proprietario (ancora membro) oppure Master della campagna del personaggio?
create or replace function private.can_access_character(p_character_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.characters c
    join public.campaign_members m on m.campaign_id = c.campaign_id and m.user_id = (select auth.uid())
    where c.id = p_character_id
      and (c.owner_id = (select auth.uid()) or m.role = 'master')
  );
$$;

grant execute on all functions in schema private to authenticated;

-- -----------------------------------------------------------------------------
-- Regole di accesso
-- -----------------------------------------------------------------------------
alter table public.campaign_invites       enable row level security;
alter table public.campaign_join_requests enable row level security;

-- Inviti: solo il Master della campagna. Si scelgono ruolo e tipo; si modifica solo la revoca.
create policy "campaign_invites_select_master" on public.campaign_invites for select to authenticated
  using (private.is_campaign_master(campaign_id));
create policy "campaign_invites_insert_master" on public.campaign_invites for insert to authenticated
  with check (private.is_campaign_master(campaign_id) and created_by = (select auth.uid()));
create policy "campaign_invites_update_master" on public.campaign_invites for update to authenticated
  using (private.is_campaign_master(campaign_id)) with check (private.is_campaign_master(campaign_id));

revoke insert, update on public.campaign_invites from anon, authenticated;
grant insert (campaign_id, role, single_use) on public.campaign_invites to authenticated;
grant update (revoked_at) on public.campaign_invites to authenticated;

-- Richieste: le vedono chi ha chiesto e il Master; si scrivono solo dalle funzioni qui sotto.
create policy "campaign_join_requests_select" on public.campaign_join_requests for select to authenticated
  using (user_id = (select auth.uid()) or private.is_campaign_master(campaign_id));

-- Il Master rimuove i giocatori (non sé stesso, non altri Master).
create policy "campaign_members_delete_master" on public.campaign_members for delete to authenticated
  using (private.is_campaign_master(campaign_id) and role = 'player' and user_id <> (select auth.uid()));

-- Nome della campagna visibile anche a chi ha chiesto di entrare.
alter policy "campaigns_select" on public.campaigns
  using (private.is_campaign_member(id) or private.has_pending_request(id));

-- Nome di chi chiede di entrare visibile al Master.
alter policy "profiles_select" on public.profiles
  using (id = (select auth.uid()) or private.shares_campaign_with(id) or private.requested_my_campaign(id));

-- Personaggi: il proprietario solo se è ancora membro della campagna.
alter policy "characters_select" on public.characters
  using (
    (owner_id = (select auth.uid()) and private.is_campaign_member(campaign_id))
    or private.is_campaign_master(campaign_id)
  );
alter policy "characters_update" on public.characters
  using (
    (owner_id = (select auth.uid()) and private.is_campaign_member(campaign_id))
    or private.is_campaign_master(campaign_id)
  );
alter policy "characters_delete" on public.characters
  using (
    (owner_id = (select auth.uid()) and private.is_campaign_member(campaign_id))
    or private.is_campaign_master(campaign_id)
  );

-- -----------------------------------------------------------------------------
-- Funzioni chiamate dall'app
-- -----------------------------------------------------------------------------

-- Crea una campagna: chi la crea ne è il primo Master.
create function public.create_campaign(p_name text, p_description text default '')
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_id   uuid;
begin
  if v_user is null then
    raise exception 'Accesso richiesto';
  end if;
  insert into public.campaigns (name, description)
  values (trim(p_name), coalesce(trim(p_description), ''))
  returning id into v_id;
  insert into public.campaign_members (campaign_id, user_id, role) values (v_id, v_user, 'master');
  return v_id;
end;
$$;

-- Informazioni su un invito per chi ha il link (che non può ancora leggere la campagna).
create function public.invite_info(p_invite_id uuid)
returns table (
  campaign_id    uuid,
  campaign_name  text,
  role           public.member_role,
  status         text,
  is_member      boolean,
  request_status public.join_request_status
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    i.campaign_id,
    c.name,
    i.role,
    case
      when i.revoked_at is not null then 'revoked'
      when i.expires_at <= now() then 'expired'
      when i.single_use and exists (
        select 1 from public.campaign_join_requests r
        where r.invite_id = i.id and r.user_id <> (select auth.uid())
      ) then 'used'
      else 'valid'
    end,
    exists (
      select 1 from public.campaign_members m
      where m.campaign_id = i.campaign_id and m.user_id = (select auth.uid())
    ),
    (
      select r.status from public.campaign_join_requests r
      where r.invite_id = i.id and r.user_id = (select auth.uid())
    )
  from public.campaign_invites i
  join public.campaigns c on c.id = i.campaign_id
  where i.id = p_invite_id and (select auth.uid()) is not null;
$$;

-- Chiede di entrare nella campagna con un invito valido.
create function public.request_to_join(p_invite_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user   uuid := (select auth.uid());
  v_invite public.campaign_invites;
begin
  if v_user is null then
    raise exception 'Accesso richiesto';
  end if;

  -- Blocca l'invito: due richieste insieme non consumano due volte un monouso
  select * into v_invite from public.campaign_invites where id = p_invite_id for update;
  if not found then
    raise exception 'Invito non valido';
  end if;
  if v_invite.revoked_at is not null then
    raise exception 'Invito revocato';
  end if;
  if v_invite.expires_at <= now() then
    raise exception 'Invito scaduto';
  end if;
  if exists (select 1 from public.campaign_join_requests r where r.invite_id = p_invite_id and r.user_id = v_user) then
    raise exception 'Hai già usato questo invito';
  end if;
  if v_invite.single_use and exists (select 1 from public.campaign_join_requests r where r.invite_id = p_invite_id) then
    raise exception 'Invito già usato';
  end if;
  if exists (
    select 1 from public.campaign_members m where m.campaign_id = v_invite.campaign_id and m.user_id = v_user
  ) then
    raise exception 'Fai già parte della campagna';
  end if;
  if exists (
    select 1 from public.campaign_join_requests r
    where r.campaign_id = v_invite.campaign_id and r.user_id = v_user and r.status = 'pending'
  ) then
    raise exception 'Hai già una richiesta in attesa per questa campagna';
  end if;

  insert into public.campaign_join_requests (invite_id, campaign_id, user_id, role)
  values (v_invite.id, v_invite.campaign_id, v_user, v_invite.role);
end;
$$;

-- Il Master accetta o rifiuta una richiesta; se la accetta, l'utente entra con il ruolo dell'invito.
create function public.decide_join_request(p_request_id uuid, p_accept boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user    uuid := (select auth.uid());
  v_request public.campaign_join_requests;
begin
  select * into v_request from public.campaign_join_requests where id = p_request_id for update;
  if not found or not private.is_campaign_master(v_request.campaign_id) then
    raise exception 'Richiesta non trovata';
  end if;
  if v_request.status <> 'pending' then
    raise exception 'Richiesta già decisa';
  end if;

  update public.campaign_join_requests
  set status = case when p_accept then 'accepted'::public.join_request_status else 'rejected'::public.join_request_status end,
      decided_by = v_user,
      decided_at = now()
  where id = p_request_id;

  if p_accept then
    insert into public.campaign_members (campaign_id, user_id, role)
    values (v_request.campaign_id, v_request.user_id, v_request.role)
    on conflict (campaign_id, user_id) do nothing;
  end if;
end;
$$;

revoke execute on function public.create_campaign(text, text) from public, anon;
revoke execute on function public.invite_info(uuid) from public, anon;
revoke execute on function public.request_to_join(uuid) from public, anon;
revoke execute on function public.decide_join_request(uuid, boolean) from public, anon;
grant execute on function public.create_campaign(text, text) to authenticated;
grant execute on function public.invite_info(uuid) to authenticated;
grant execute on function public.request_to_join(uuid) to authenticated;
grant execute on function public.decide_join_request(uuid, boolean) to authenticated;
