# 05 — Importazione dei personaggi esistenti

> **Rimandata alla fine del progetto**: le schede Google attuali non sono tutte identiche, quindi la mappatura si fa una scheda alla volta, quando l'app è pronta.

## Principi già decisi

- I **dati narrativi** (preghiere, diari, appunti) sono personali: vanno **solo nel database**, mai nel repository git. Eventuali file intermedi di lavoro restano fuori da git.
- I **dati statici** (catalogo capacità, razze, divinità, allineamenti, tabelle) vengono estratti dai fogli una volta sola e finiscono in `src/game/data/` (git). Questo serve già per la Fase 1.
- Ogni personaggio importato viene assegnato al suo giocatore e alla sua campagna.
- I testi restano **identici** all'originale, refusi compresi.

## Strumenti previsti

- **Import guidato**: leggo il foglio Google con il connettore e scrivo i dati direttamente nel database tramite il collegamento Supabase (vedi 04), un personaggio alla volta, verificando con te.
- **Esporta / Importa JSON** nell'app, utile come backup.

## Bozza di mappatura (scheda di Omnia)

| Foglio | Destinazione |
|---|---|
| Scheda › intestazione, PF, follia, fato, monete | `characters`, `character_classes`, `character_resources` |
| Scheda › caratteristiche | `character_attributes` |
| Scheda › capacità | `character_skills` |
| Scheda › armi, armature, oggetti, equipaggiamento | `character_items` |
| loot | `character_items` (equipaggiamento) |
| Miracoli, Dadi riuscita | `character_powers` |
| Preghiere, 105 Giorni, Castello Malek, Appunti, Vortex, Matrimonio, Libri, Identificazione Oggetti, Belor, Seenna… | `journal_entries` |
| Master (risposte) | `master_threads` / `thread_messages` collegati alle preghiere |
| Bestiario, Mappa di Zeria | pagine del Mondo (Fase 3) |
