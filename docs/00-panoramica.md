# Xerioth Character Sheet — Panoramica

> Stato: **bozza revisionata (2ª versione)**. Le note della prima revisione sono integrate; le domande ancora aperte sono segnate con ❓.

## Obiettivo

Sostituire le schede personaggio su Google Sheets del gioco di ruolo **Xerioth** (mondo di Zeria) con un'app web:

- la **scheda personaggio** prima di tutto: dati, caratteristiche, capacità, poteri, inventario, diario;
- **template di classe**: il sistema è quasi lo stesso per tutti i personaggi, ma la classe decide cosa compare (miracoli, incantesimi, poteri mentali…) e quale risorsa si usa (Spirito, Mana, Mente, Anima…). I template vivono nel codice, insieme alle eventuali tabelle di conversione per calcolare i costi dei poteri;
- **calcoli automatici solo dove esiste una formula certa** (modificatori, PF, costi di avanzamento, Mana, stima dell'allenamento, totale dei tiri). Ciò che decide il Master resta un campo da compilare. Le nuove formule si aggiungono caso per caso;
- il **Master** (per campagna) vede tutte le schede della sua campagna e risponde alle **domande** dei giocatori;
- in una fase successiva, **pagine informative a moduli** per il materiale del Master (testo, tabelle, immagini, date a calendario).

## Documenti

| File | Contenuto |
|---|---|
| [01-regole-di-gioco.md](01-regole-di-gioco.md) | Formule e tabelle: cosa calcola l'app |
| [02-database.md](02-database.md) | Cosa sta su git, cosa nel database; ruoli e permessi |
| [03-interfaccia.md](03-interfaccia.md) | Pagine, scheda, dadi, domande al Master |
| [04-setup-supabase.md](04-setup-supabase.md) | Configurazione di Supabase, passo per passo |
| [05-importazione.md](05-importazione.md) | Import dei personaggi esistenti (rimandato alla fine) |

## Decisioni

- **Frontend**: React + TypeScript con Vite; stili in **LESS**.
- **Backend**: Supabase (Postgres + autenticazione + realtime).
- **Campagne separate** fin da subito. Il ruolo **Master** è per campagna e si assegna **da database**.
- **Dati statici su git** (tabelle, razze, classi, divinità, allineamenti, catalogo capacità). **Dati personali nel database** (personaggi, diari, domande, tiri).
- Un giocatore vede **solo le proprie schede**; il Master vede tutte quelle della sua campagna. I **tiri** sono visibili a tutto il gruppo.
- **Niente approvazione** per salire di livello: al suo posto ci sono le **domande al Master** su qualsiasi elemento.
- **Import** delle schede esistenti alla fine, perché le schede attuali non sono tutte uguali.

## Stack tecnico

| Ambito | Scelta | Note |
|---|---|---|
| Build | Vite | |
| Linguaggio | TypeScript | tipi generati dal database |
| Routing | React Router | |
| Dati dal server | TanStack Query | cache, aggiornamenti immediati (es. +/− PF) |
| Backend | `@supabase/supabase-js` | |
| Stile | **LESS** | variabili per tema scuro/chiaro, CSS Modules per componente |
| Validazione | Zod (facoltativo) | controlla la forma dei dati in form e import; se preferisci evitarlo si fa a mano |
| Test | Vitest | test del motore regole con i valori reali (Omnia: PF 198, Corrosione 43, allenamento 23) |

## Fasi

1. **Fase 1 — Scheda**: accesso, campagne, elenco personaggi, scheda completa modificabile con template di classe, calcoli, lanciatore di dadi, compendio.
2. **Fase 2 — Master**: domande al Master con notifiche, pannello Master, tiri del gruppo in tempo reale.
3. **Fase 3 — Mondo**: pagine informative a moduli, iniziativa, calendario.
4. **Import** delle schede esistenti (Omnia e le altre).

## Domande aperte

1. ⏳ Elenco delle **classi** (risorsa e caratteristica di lancio): arriverà più avanti. Intanto ci sono template provvisori.

Risolte nella 2ª revisione: esperienza (tabella A38, costo per arrivare al livello), costo di lancio (tabella A108, vale anche per lo Spirito), armi e armature nell'equipaggiamento, tiri (il gruppo vede totale ed esito).
