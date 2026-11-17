-- Si tira solo sui propri personaggi: il Master non tira per i giocatori.
alter policy "dice_rolls_insert" on public.dice_rolls
  with check (
    roller_id = (select auth.uid())
    and private.is_character_owner(character_id)
    and exists (select 1 from public.characters c where c.id = character_id and c.campaign_id = dice_rolls.campaign_id)
  );
