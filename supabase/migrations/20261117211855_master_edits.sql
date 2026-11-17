-- Modifiche del Master alle schede dei giocatori: segnalate al giocatore e conservate nello storico.
-- Le scrive un trigger, così nessuna modifica sfugge; la motivazione arriva nell'intestazione
-- x-edit-reason della richiesta (base64 di UTF-8).

create type public.edit_target as enum ('character', 'class', 'attribute', 'resource', 'skill', 'power', 'item', 'xp');
create type public.edit_action as enum ('insert', 'update', 'delete');

create table public.master_edits (
  id           uuid primary key default gen_random_uuid(),
  character_id uuid not null references public.characters (id) on delete cascade,
  target_type  public.edit_target not null,
  target_id    text,
  target_label text not null default '',
  action       public.edit_action not null,
  field        text,
  old_value    jsonb,
  new_value    jsonb,
  reason       text,
  edited_by    uuid references public.profiles (id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  dismissed_at timestamptz
);

create index master_edits_character_id_idx on public.master_edits (character_id, created_at desc);
create index master_edits_edited_by_idx on public.master_edits (edited_by);
-- Modifica ancora segnalata sullo stesso valore: si aggiorna invece di crearne un'altra
create index master_edits_open_idx on public.master_edits (character_id, target_type, target_id, field)
  where dismissed_at is null;

alter table public.master_edits enable row level security;

create policy "master_edits_select" on public.master_edits for select to authenticated
  using (private.is_character_owner(character_id) or private.is_master_of_character(character_id));

alter publication supabase_realtime add table public.master_edits;

-- -----------------------------------------------------------------------------
-- Motivazione dalla richiesta
-- -----------------------------------------------------------------------------
create function private.edit_reason()
returns text
language plpgsql
stable
set search_path = ''
as $$
declare
  v_raw text := nullif(current_setting('request.headers', true), '')::json ->> 'x-edit-reason';
begin
  if v_raw is null or v_raw = '' then
    return null;
  end if;
  return nullif(trim(convert_from(decode(v_raw, 'base64'), 'UTF8')), '');
exception when others then
  return null;
end;
$$;

-- -----------------------------------------------------------------------------
-- Registrazione
-- -----------------------------------------------------------------------------
create function private.log_master_edit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user      uuid := (select auth.uid());
  v_row       jsonb := case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end;
  v_old       jsonb := case when tg_op = 'INSERT' then '{}'::jsonb else to_jsonb(old) end;
  v_character uuid;
  v_owner     uuid;
  v_campaign  uuid;
  v_target    public.edit_target;
  v_target_id text;
  v_label     text;
  v_action    public.edit_action := lower(tg_op)::public.edit_action;
  v_reason    text;
  v_key       text;
  v_before    jsonb;
  v_after     jsonb;
  v_existing  uuid;
begin
  if v_user is null then
    return null;
  end if;

  v_character := case when tg_table_name = 'characters' then (v_row ->> 'id')::uuid else (v_row ->> 'character_id')::uuid end;

  -- Personaggio già eliminato (cancellazione a cascata): niente da segnalare
  select c.owner_id, c.campaign_id into v_owner, v_campaign from public.characters c where c.id = v_character;
  if not found or v_owner = v_user then
    return null;
  end if;
  if not exists (
    select 1 from public.campaign_members m
    where m.campaign_id = v_campaign and m.user_id = v_user and m.role = 'master'
  ) then
    return null;
  end if;

  case tg_table_name
    when 'characters' then
      v_target := 'character'; v_target_id := null; v_label := v_row ->> 'name';
    when 'character_classes' then
      v_target := 'class'; v_target_id := v_row ->> 'id'; v_label := v_row ->> 'class_key';
    when 'character_attributes' then
      v_target := 'attribute'; v_target_id := v_row ->> 'attribute'; v_label := v_row ->> 'attribute';
    when 'character_resources' then
      v_target := 'resource'; v_target_id := v_row ->> 'resource_key'; v_label := v_row ->> 'resource_key';
    when 'character_skills' then
      v_target := 'skill'; v_target_id := v_row ->> 'id';
      v_label := coalesce(nullif(v_row ->> 'custom_name', ''), v_row ->> 'skill_key', '');
    when 'character_powers' then
      v_target := 'power'; v_target_id := v_row ->> 'id'; v_label := v_row ->> 'name';
    when 'character_items' then
      v_target := 'item'; v_target_id := v_row ->> 'id'; v_label := v_row ->> 'name';
    when 'character_xp_entries' then
      v_target := 'xp'; v_target_id := v_row ->> 'id'; v_label := v_row ->> 'note';
  end case;

  v_reason := private.edit_reason();

  -- Caratteristiche e risorse: la prima scrittura crea la riga, ma per il giocatore è un valore cambiato
  if tg_op = 'INSERT' and v_target in ('attribute', 'resource') then
    v_action := 'update';
  end if;

  if v_action <> 'update' then
    insert into public.master_edits (character_id, target_type, target_id, target_label, action, old_value, new_value, reason, edited_by)
    values (
      v_character, v_target, v_target_id, coalesce(v_label, ''), v_action,
      null,
      case when v_target = 'xp' and v_action = 'insert' then v_row -> 'amount' end,
      v_reason, v_user
    );
    return null;
  end if;

  -- Una riga per ogni colonna cambiata
  for v_key, v_after in select * from jsonb_each(v_row) loop
    continue when v_key in ('id', 'character_id', 'created_at', 'updated_at', 'sort_order', 'search');
    v_before := v_old -> v_key;
    continue when v_before is not distinct from v_after;

    select e.id into v_existing
    from public.master_edits e
    where e.character_id = v_character
      and e.target_type = v_target
      and e.target_id is not distinct from v_target_id
      and e.field = v_key
      and e.action = 'update'
      and e.dismissed_at is null
    order by e.created_at desc
    limit 1;

    if found then
      update public.master_edits
      set new_value = v_after, target_label = coalesce(v_label, ''), reason = v_reason, edited_by = v_user, updated_at = now()
      where id = v_existing;
    else
      insert into public.master_edits (character_id, target_type, target_id, target_label, action, field, old_value, new_value, reason, edited_by)
      values (v_character, v_target, v_target_id, coalesce(v_label, ''), 'update', v_key, v_before, v_after, v_reason, v_user);
    end if;
  end loop;

  return null;
end;
$$;

revoke execute on function private.log_master_edit() from public, anon, authenticated;

create trigger characters_master_edit after update on public.characters
  for each row execute function private.log_master_edit();
create trigger character_classes_master_edit after insert or update or delete on public.character_classes
  for each row execute function private.log_master_edit();
create trigger character_attributes_master_edit after insert or update or delete on public.character_attributes
  for each row execute function private.log_master_edit();
create trigger character_resources_master_edit after insert or update or delete on public.character_resources
  for each row execute function private.log_master_edit();
create trigger character_skills_master_edit after insert or update or delete on public.character_skills
  for each row execute function private.log_master_edit();
create trigger character_powers_master_edit after insert or update or delete on public.character_powers
  for each row execute function private.log_master_edit();
create trigger character_items_master_edit after insert or update or delete on public.character_items
  for each row execute function private.log_master_edit();
create trigger character_xp_entries_master_edit after insert or update or delete on public.character_xp_entries
  for each row execute function private.log_master_edit();

-- -----------------------------------------------------------------------------
-- Il giocatore toglie il segno (la modifica resta nello storico)
-- -----------------------------------------------------------------------------
create function public.dismiss_master_edits(p_ids uuid[])
returns void
language sql
security definer
set search_path = ''
as $$
  update public.master_edits
  set dismissed_at = now()
  where id = any (p_ids)
    and dismissed_at is null
    and private.is_character_owner(character_id);
$$;

revoke execute on function public.dismiss_master_edits(uuid[]) from public, anon;
grant execute on function public.dismiss_master_edits(uuid[]) to authenticated;
