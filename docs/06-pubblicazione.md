# 06 — Pubblicazione e accesso con Google

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

---

## Accesso con Google

Flusso: l'app manda a Google → Google torna su `https://rratuwwmqgvkvyvvpqiy.supabase.co/auth/v1/callback` → Supabase rimanda all'app con la sessione. Google quindi conosce solo l'indirizzo di Supabase; gli indirizzi dell'app si autorizzano su Supabase.

### Passo 1 — Google Cloud *(tu)*

1. <https://console.cloud.google.com> → nuovo progetto `Xerioth`.
2. **Google Auth Platform → Branding**:
   - App name `Xerioth`, email di supporto tua;
   - **Authorized domains**: `rratuwwmqgvkvyvvpqiy.supabase.co`.
3. **Audience**: *External*. Poi **Publish app** (stato *In production*). Con i soli permessi base non serve la verifica di Google; in stato *Testing* invece entrerebbero solo gli indirizzi aggiunti a mano come test user.
4. **Data Access**: solo `openid`, `.../auth/userinfo.email`, `.../auth/userinfo.profile`.
5. **Clients → Create client** → *Web application*:
   - **Authorized JavaScript origins**: `http://localhost:5173`, `https://xerioth.pages.dev`
   - **Authorized redirect URIs**: `https://rratuwwmqgvkvyvvpqiy.supabase.co/auth/v1/callback`
   - copia **Client ID** e **Client secret** (il secret non va in chat né su git).

Nella schermata di consenso Google mostrerà "accedi a rratuwwmqgvkvyvvpqiy.supabase.co": per mostrare un dominio proprio servirebbe il custom domain di Supabase, che è a pagamento.

### Passo 2 — Supabase *(tu, dalla dashboard)*

*Authentication*:
- **Sign In / Providers → Google**: attiva, incolla Client ID e Client secret, salva.
- **URL Configuration**:
  - **Site URL**: `https://xerioth.pages.dev`
  - **Redirect URLs**: `http://localhost:5173/**`, `https://xerioth.pages.dev/**`, `https://*.xerioth.pages.dev/**` (anteprime)
- Se ti sei già registrato con email e password usando lo stesso indirizzo Gmail, al primo accesso con Google Supabase collega i due metodi allo stesso utente: schede e ruolo Master restano.

### Nell'app

- **Pagina di accesso**: pulsante **Accedi con Google** in cima, poi "oppure" e il form email e password (resta attivo). Il logo "G" è un SVG in `components/GoogleIcon.tsx`, esportato da `icons.ts` (lucide non ha i loghi dei marchi). Al ritorno da Google si torna alla pagina da cui si era partiti.
- **Client Supabase**: flusso `pkce`.
- **Profilo**: il nome visualizzato arriva dall'account Google (vedi `profiles` in [02-database.md](02-database.md)).
