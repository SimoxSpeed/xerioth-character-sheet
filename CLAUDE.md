# Xerioth — schede personaggio

App web per le schede del GdR Xerioth, al posto delle schede su Google Sheets. Le decisioni di progetto sono in `docs/` (00–06) e sono la fonte di verità: aggiornale quando cambia una regola, lo schema o l'interfaccia.

## Comandi

- `npm run dev`: Vite su :5173 (serve `.env.local`, vedi `.env.example`)
- `npm test`: Vitest, solo `src/**/*.test.ts`
- `npm run typecheck`: `tsc -b`
- `npm run build`

Prima di dichiarare finito un lavoro su `.ts`/`.tsx`: `npm run typecheck`; se hai toccato `src/game/rules` anche `npm test`.

## Stack

- **Frontend:** React 19, TypeScript strict (`noUncheckedIndexedAccess`, `verbatimModuleSyntax`), Vite, React Router, TanStack Query, LESS con CSS Modules, lucide-react (versione fissata a 1.66.0), Vitest.
- **Backend:** Supabase (progetto `rratuwwmqgvkvyvvpqiy`, Francoforte) via `@supabase/supabase-js`: Postgres con RLS, Auth (email e password, Google con flusso PKCE), Realtime per il registro dei tiri.
- **Hosting:** Cloudflare Pages, progetto `xerioth-character-sheet` → `https://xerioth-character-sheet.pages.dev`. Sito statico (`dist/`), Node 22 da `.node-version`, variabili `VITE_*` impostate su Cloudflare.
- **GitHub Actions:** `keep-supabase-awake.yml` interroga il database il lunedì e il giovedì (il piano Free di Supabase va in pausa dopo 7 giorni senza attività).

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
- Dopo ogni migrazione: rinomina il file con la versione che il database ha registrato (`list_migrations`: l'MCP usa l'orario dell'applicazione, non il nome del file), poi `generate_typescript_types` in `src/lib/database.types.ts`, `get_advisors` per la sicurezza e aggiorna `docs/02-database.md`.
- L'integrazione GitHub di Supabase controlla le migrazioni a ogni push su `main` ("Supabase Preview"): fallisce se una versione del database non ha il file con lo stesso numero.
- I permessi stanno nelle policy RLS: il giocatore vede solo le sue schede, il Master (per campagna: chi la crea o chi entra con un invito da Master) tutte quelle della campagna, i tiri sono visibili a tutto il gruppo.

## Git

- Si lavora su `dev`; `main` è la produzione (vedi "Pubblicare").
- Messaggi di commit: una sola riga, Conventional Commits con gitmoji, in inglese, all'imperativo e in minuscolo, senza scope, body o trailer (niente `Co-Authored-By`). Brevi e diretti: cosa cambia, non perché né come. Esempi: `feat: ✨ add google sign-in`, `fix: 🐛 display sign-in errors`, `ci: 👷 keep supabase project awake`.
- Le modifiche a questo file e a `docs/` vanno nel commit che implementa ciò che descrivono: niente commit `docs` separati, niente fixup del commit che le ha introdotte.
- Commit, push e riscritture della history solo su richiesta.

## Pubblicare

Pubblicare significa mettere online la versione nuova del sito su `https://xerioth-character-sheet.pages.dev`.

- Il sito è sempre quello che c'è su `main`: a ogni push su `main` Cloudflare Pages scarica il codice da GitHub, lancia `npm run build` e sostituisce il sito in 1–2 minuti. Su Cloudflare non si fa niente.
- Un push su `dev` non cambia il sito: crea solo un'anteprima su `https://dev.xerioth-character-sheet.pages.dev`.
- Come si pubblica: `npm run typecheck` e `npm test`, poi `git checkout main`, `git merge dev`, `git push`, `git checkout dev`.
- Il database non si pubblica: le migrazioni sono già applicate via MCP quando si scrivono. Al push su `main` il check "Supabase Preview" verifica solo che i file delle migrazioni corrispondano al database.
- Se cambiano le variabili `VITE_*` su Cloudflare, servono un nuovo deploy (*Deployments → ⋯ → Retry deployment*) o un nuovo push su `main`.
