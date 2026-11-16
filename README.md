# Xerioth — Schede personaggio

App web per le schede dei personaggi del gioco di ruolo **Xerioth**: React + TypeScript (Vite), stili in LESS, backend Supabase.

La documentazione di progetto è in [docs/](docs/00-panoramica.md).

## Avvio

```bash
npm install
npm run dev        # http://localhost:5173
```

Serve un file `.env.local` con URL e publishable key del progetto Supabase (vedi [.env.example](.env.example) e [docs/04-setup-supabase.md](docs/04-setup-supabase.md)).

## Comandi

| Comando | Cosa fa |
|---|---|
| `npm run dev` | server di sviluppo |
| `npm test` | test del motore regole (valori reali della scheda di Omnia) |
| `npm run typecheck` | controllo dei tipi |
| `npm run build` | build di produzione in `dist/` |

## Struttura

```
src/
  game/data/     dati statici versionati (tabelle, razze, classi, divinità, allineamenti)
  game/rules/    motore regole: funzioni pure + test
  lib/           client Supabase e tipi generati dal database
  features/      auth, campagne, personaggi (scheda)
  components/    componenti comuni
  styles/        LESS: variabili e stili globali
supabase/
  migrations/    schema del database (applicato)
  pending/       migrazioni preparate ma NON applicate
```

Dopo ogni migrazione vanno rigenerati i tipi in `src/lib/database.types.ts`.
