# 06 — Pubblicazione

L'app è un sito statico (`npm run build` → `dist/`) che parla direttamente con Supabase: serve solo un hosting statico gratuito con fallback SPA (ogni percorso, es. `/personaggi/123`, deve restituire `index.html`).

Progetto Supabase: `rratuwwmqgvkvyvvpqiy` → `https://rratuwwmqgvkvyvvpqiy.supabase.co`.

---

## Hosting: Cloudflare Pages

| | Cloudflare Pages | Vercel (Hobby) | Netlify (Free) | GitHub Pages |
|---|---|---|---|---|
| Banda | illimitata | 100 GB/mese | a crediti (300/mese) | 100 GB/mese |
| Fallback SPA | automatico | serve `vercel.json` | serve `_redirects` | non c'è (trucco `404.html`) |
| Anteprime per branch | sì | sì | sì | no |
| Vincoli | 500 build/mese | solo uso non commerciale | i crediti finiscono anche con le build | serve una GitHub Action |

**Scelta: Cloudflare Pages.** Nessun file di configurazione, nessun limite di banda e un indirizzo per ogni branch/commit utile per provare le modifiche. Vercel è un ripiego equivalente.

### Branch

- `main` = **produzione** (`https://xerioth.pages.dev`), ci si fa merge di `dev` quando una versione è pronta;
- `dev` e gli altri branch = **anteprime** (`https://<branch>.xerioth.pages.dev`).

### Configurazione *(tu, dalla dashboard Cloudflare)*

1. <https://dash.cloudflare.com> → registrati (piano Free).
2. **Workers & Pages → Create → Pages → Connect to Git** (se la dashboard propone Workers, scegli il link per Pages) → autorizza GitHub → repo `xerioth-character-sheet`.
3. Impostazioni di build:
   - **Project name**: `xerioth` (se è preso, Cloudflare aggiunge un suffisso: l'indirizzo cambia di conseguenza in tutti i passi sotto)
   - **Production branch**: `main`
   - **Framework preset**: *React (Vite)* → build `npm run build`, output `dist`
   - **Environment variables** (sia *Production* che *Preview*):
     - `VITE_SUPABASE_URL` = `https://rratuwwmqgvkvyvvpqiy.supabase.co`
     - `VITE_SUPABASE_PUBLISHABLE_KEY` = la stessa di `.env.local`
4. **Save and Deploy**. Ogni push su GitHub rifà la build da solo.

Le variabili `VITE_*` finiscono nel JavaScript pubblicato: è previsto, la publishable key è pubblica e la sicurezza sta nelle RLS. La secret key non va mai qui.

La versione di Node la fisso io con un file `.node-version` (`22`), richiesto da Vite 8.
