-- Riuscita fissa dei poteri/miracoli (docs/01-regole-di-gioco.md §7).
-- Il Master sceglie il dado riuscita; in quel momento si salva il totale da raggiungere
-- (dado + caratteristica + modificatore + livello). Il totale resta fisso: alzando poi
-- caratteristica o livello, il potere riesce più facilmente.
-- Regola fissa: un potere a livello 0 parte solo con dado 20.

alter table public.character_powers
  add column success_target integer check (success_target >= 0);

comment on column public.character_powers.success_target is
  'Riuscita fissata dal Master: il potere riesce se d20 + caratteristica + modificatore + livello >= valore. null = da fissare.';

comment on column public.character_powers.success_die is
  'Dado riuscita scelto dal Master (0–20) quando ha fissato success_target. Livello 0 = sempre 20.';

-- Poteri che hanno già il dado: riuscita calcolata con i valori attuali (Intelligenza).
update public.character_powers p
set success_target = p.success_die + coalesce(a.value, 0)
    + greatest(0, floor((coalesce(a.value, 0) - 10) / 3.0))::int
    + coalesce(p.level, 0)
from public.character_attributes a
where p.success_die is not null
  and p.success_target is null
  and a.character_id = p.character_id
  and a.attribute = 'intelligenza';

-- Dado e riuscita li fissa solo il Master della campagna; a livello 0 il dado è 20.
-- Senza utente (SQL Editor / importazione) è sempre permesso.
create or replace function private.guard_power_success_die()
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
    if (new.success_die is not null or new.success_target is not null)
       and not private.is_master_of_character(new.character_id) then
      raise exception 'Il dado riuscita lo fissa il Master' using errcode = '42501';
    end if;
  elsif (new.success_die is distinct from old.success_die or new.success_target is distinct from old.success_target)
        and not private.is_master_of_character(new.character_id) then
    raise exception 'Il dado riuscita lo fissa il Master' using errcode = '42501';
  end if;
  if new.level = 0 and new.success_die is not null and new.success_die <> 20
     and (tg_op = 'INSERT' or new.success_die is distinct from old.success_die) then
    raise exception 'Un potere a livello 0 parte solo con dado 20' using errcode = '23514';
  end if;
  return new;
end;
$$;
