# Xerioth — schede personaggio

App web per le schede del GdR Xerioth, al posto delle schede su Google Sheets. Le decisioni di progetto sono in `docs/` (00–06) e sono la fonte di verità: aggiornale quando cambia una regola, lo schema o l'interfaccia.

## Comandi

- `npm run dev`: Vite su :5173 (serve `.env.local`, vedi `.env.example`)
- `npm test`: Vitest, solo `src/**/*.test.ts`
- `npm run typecheck`: `tsc -b`
- `npm run build`

Prima di dichiarare finito un lavoro su `.ts`/`.tsx`: `npm run typecheck`; se hai toccato `src/game/rules` anche `npm test`.

## Stack

React 19, TypeScript strict (`noUncheckedIndexedAccess`, `verbatimModuleSyntax`), Vite, React Router, TanStack Query, `@supabase/supabase-js`, LESS con CSS Modules, lucide-react (versione fissata a 1.66.0).

## Struttura

- `src/game/data/`: dati statici del gioco (razze, classi, divinità, tabelle). Stanno su git, non nel DB.
- `src/game/rules/`: funzioni pure esportate da `index.ts`, con test sui valori reali di Omnia (PF 198, Corrosione 43, allenamento 23).
- `src/features/<area>/api.ts`: query e mutation TanStack di quell'area. Solo gli `api.ts` (e l'auth) importano `lib/supabase`.
- `src/features/characters/sheet/`: la scheda, una cartella per tab.
- `src/components/`: componenti comuni. Le icone si importano solo da `icons.ts`.
- `src/lib/database.types.ts`: tipi generati, non modificarli a mano.
- `src/styles/tokens.less`: variabili del tema scuro/chiaro.

## Convenzioni

- Testi dell'interfaccia e commenti in italiano; identificatori in inglese, `snake_case` nel DB.
- Ogni componente ha il suo `.module.less`; le classi si usano in camelCase (`styles.rowTitle`).
- Query: chiavi raccolte in oggetti `xxxKeys`, colonne esplicite nella `select`, risultato passato a `unwrap()`.
- Calcoli automatici solo dove c'è una formula certa; ciò che decide il Master resta un campo da compilare.

## Database (Supabase)

- Niente Supabase CLI né Docker. Le migrazioni si scrivono in `supabase/migrations/AAAAMMGGHHMMSS_nome.sql` e si applicano con l'MCP `supabase` (`apply_migration`).
- Dopo ogni migrazione: `generate_typescript_types` in `src/lib/database.types.ts`, poi `get_advisors` per la sicurezza, poi aggiorna `docs/02-database.md`.
- I permessi stanno nelle policy RLS: il giocatore vede solo le sue schede, il Master (per campagna, assegnato da DB) tutte quelle della campagna, i tiri sono visibili a tutto il gruppo.
