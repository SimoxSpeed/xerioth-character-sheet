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

## Git

- Si lavora su `dev`; `main` è il branch di rilascio e Cloudflare Pages pubblica ogni suo push. Le release partono da `main` dopo un merge di `dev`.
- Messaggi di commit: una sola riga, Conventional Commits con gitmoji, in inglese, all'imperativo e in minuscolo, senza scope, body o trailer (niente `Co-Authored-By`). Brevi e diretti: cosa cambia, non perché né come. Esempi: `feat: ✨ add google sign-in`, `fix: 🐛 display sign-in errors`, `ci: 👷 keep supabase project awake`.
- Le modifiche a questo file e a `docs/` vanno nel commit che implementa ciò che descrivono: niente commit `docs` separati, niente fixup del commit che le ha introdotte.
- Commit, push e riscritture della history solo su richiesta.
- Il commit di release (`chore(release): 🚀 release X.Y.Z`, unica eccezione alla regola senza scope) lo crea solo `scripts/release.ps1`, mai a mano.

## Release

- **Versione:** unica fonte `version` in `package.json` (e `package-lock.json`). La incrementa solo lo script.
- **Pubblicare** (Windows, da `main` dopo il merge di `dev`): `.\scripts\release.cmd patch|minor|major`. Lo lancia chi fa la release, non Claude. Richiede GitHub CLI autenticata con permesso di push (`gh auth login`).
  1. Controlla branch pulito e allineato a origin, `dev` già unito, tag libero; poi apre il Blocco note per le note di rilascio. **Le note sono per i giocatori**, anche quando le scrive Claude: cosa cambia per loro, in italiano, testo semplice con trattini; niente dettagli di sviluppo (script, test, migrazioni, refactoring, nomi di file).
  2. Incrementa la versione (`npm version --no-git-tag-version`).
  3. Lancia `npm test` e `npm run build`.
  4. Dopo conferma: commit, tag annotato `vX.Y.Z` e push atomico di `main` e tag. Cloudflare Pages pubblica il sito.
  5. Con `gh release create` crea la release su GitHub con le note.
  6. Porta `dev` (locale e origin) al commit di release, se è un avanzamento semplice.
  Se fallisce prima del commit, rimette `package.json` e `package-lock.json` com'erano.
- Gli script stanno in `scripts/` come `.ps1` salvati in UTF-8 **con BOM** (PowerShell 5.1 senza BOM legge male le lettere accentate), con accanto un `.cmd` che li lancia senza toccare la ExecutionPolicy. La radice del repo per lo script è `Split-Path -Parent $PSScriptRoot`; uno script che fallisce esce con `exit 1`.
