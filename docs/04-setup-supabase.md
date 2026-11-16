# 04 — Configurazione di Supabase

**Sul PC non devi installare niente di nuovo.** Supabase è un servizio online e Node.js (già installato) basta per l'app. Supabase CLI e Docker non servono.

Dopo i passi 1–3 creo io tabelle, regole e dati tramite il collegamento MCP; tu fai solo le parti che richiedono il tuo account.

---

## Passo 1 — Account e progetto *(tu)*

1. Vai su <https://supabase.com> → **Start your project** e registrati (anche con GitHub).
2. Se te lo chiede, crea un'**organizzazione** (es. "Personale", piano **Free**).
3. **New project**:
   - **Name**: `xerioth`
   - **Database password**: clicca *Generate*, poi **salvala** in un posto sicuro. Serve solo per accessi diretti al database.
   - **Region**: *Central EU (Frankfurt)*
4. Attendi 1–2 minuti che il progetto sia pronto.

> Piano Free: dopo **7 giorni senza attività** il progetto va in pausa. Si riattiva dalla dashboard con un clic e i dati non si perdono.

## Passo 2 — Chiavi per l'app *(tu)*

Dashboard del progetto → pulsante **Connect** in alto (oppure *Project Settings → API Keys*). Ti servono:
- **Project URL**: `https://<project-ref>.supabase.co`
- **Publishable key** (`sb_publishable_…`), oppure, nei progetti più vecchi, la **anon key**. È pubblica per definizione: la sicurezza la garantiscono le regole RLS.

Mandami solo **URL** e **project ref** (la parte prima di `.supabase.co`). La chiave la metti tu in `.env.local` (escluso da git):

```
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

⚠️ La **secret / service_role key** non va **mai** nell'app, su git o in chat: scavalca tutte le regole di sicurezza.

## Passo 3 — Collegamento MCP, per farmi lavorare sul database *(tu)*

Da un terminale nella cartella del progetto:

```bash
claude mcp add --scope project --transport http supabase "https://mcp.supabase.com/mcp?project_ref=<project-ref>"
```

Poi apri Claude Code nel terminale (`claude`), digita **`/mcp`**, seleziona **supabase** → *Authenticate* e accedi nel browser. Ricarica VS Code (*Developer: Reload Window*).

`project_ref` limita il mio accesso a **questo** progetto. Prima di qualsiasi operazione distruttiva ti chiedo conferma.

## Passo 4 — Tabelle e regole *(io)*

Scrivo le migrazioni in `supabase/migrations/` e le applico tramite MCP. Poi verifico gli avvisi di sicurezza di Supabase e genero i tipi TypeScript.

Senza MCP si possono comunque applicare a mano: *SQL Editor → New query*, incolla ogni file in ordine e premi **Run**.

## Passo 5 — Autenticazione *(tu, dalla dashboard)*

*Authentication*:
- **Sign In / Providers → Email**: attivo (è il default).
- **Sign In / Providers → Google**: vedi [06-pubblicazione.md](06-pubblicazione.md#accesso-con-google).
- **URL Configuration**: Site URL e Redirect URLs come in [06-pubblicazione.md](06-pubblicazione.md#passo-2--supabase-tu-dalla-dashboard).
- In sviluppo è comodo disattivare **Confirm email**.

## Passo 6 — Campagna e ruolo Master *(io via MCP, oppure tu da SQL Editor)*

Dopo che ti sei registrato nell'app:

```sql
insert into campaigns (name) values ('Xerioth') returning id;

insert into campaign_members (campaign_id, user_id, role)
select '<id-campagna>', id, 'master'   -- oppure 'player'
from auth.users where email = 'email@esempio.it';
```

## Passo 7 — Avvio in locale

```bash
npm install
npm run dev     # http://localhost:5173
```

---

## Pubblicazione online

Cloudflare Pages e accesso con Google: [06-pubblicazione.md](06-pubblicazione.md).
