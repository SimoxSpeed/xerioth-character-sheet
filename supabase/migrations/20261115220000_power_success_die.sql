-- Dado riuscita dei poteri/miracoli (docs/01-regole-di-gioco.md §7).
-- Lo fissa il Master: il potere riesce se il d20 è >= success_die (0 = riesce sempre).
-- null = non ancora fissato dal Master.

alter table public.character_powers
  add column success_die integer check (success_die between 0 and 20);

comment on column public.character_powers.success_die is
  'Dado riuscita deciso dal Master: riesce con d20 >= valore. null = da fissare.';

-- Solo il Master della campagna può impostarlo o cambiarlo.
-- Senza utente (SQL Editor / importazione) è sempre permesso.
create function private.guard_power_success_die()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    return new;
  end if;
  if tg_op = 'INSERT' then
    if new.success_die is not null and not private.is_master_of_character(new.character_id) then
      raise exception 'Il dado riuscita lo fissa il Master' using errcode = '42501';
    end if;
  elsif new.success_die is distinct from old.success_die
        and not private.is_master_of_character(new.character_id) then
    raise exception 'Il dado riuscita lo fissa il Master' using errcode = '42501';
  end if;
  return new;
end;
$$;

revoke execute on function private.guard_power_success_die() from public, anon, authenticated;

create trigger character_powers_guard_success_die
  before insert or update on public.character_powers
  for each row execute function private.guard_power_success_die();
