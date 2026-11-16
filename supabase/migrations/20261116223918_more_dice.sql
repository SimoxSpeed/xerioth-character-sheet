-- Tiro libero: tutti i dadi classici, oltre a d20, d4 e Sopra o Sotto.
-- Solo aggiunte all'enum: nessun dato esistente cambia.
alter type public.die_kind add value if not exists 'd6';
alter type public.die_kind add value if not exists 'd8';
alter type public.die_kind add value if not exists 'd10';
alter type public.die_kind add value if not exists 'd12';
alter type public.die_kind add value if not exists 'd100';
