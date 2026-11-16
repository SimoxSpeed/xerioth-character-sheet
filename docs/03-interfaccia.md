# 03 — Interfaccia

Lingua: italiano. Pensata per il **tavolo da gioco**: portatile e telefono hanno la stessa importanza (navigazione in basso su telefono). Tema scuro di default, tema chiaro opzionale. Stili scritti in **LESS**.

---

## Pagine

| Percorso | Pagina | Chi |
|---|---|---|
| `/accesso` | Accedi con Google, oppure email + password; cambio tema in alto a destra; link "Privacy" in fondo | tutti |
| `/privacy` | Privacy policy (richiesta da Google per pubblicare l'accesso con Google) | tutti, anche senza accesso |
| `/` | **Le mie campagne e i miei personaggi** (il Master vede tutti i personaggi della sua campagna) | tutti |
| `/personaggi/:id` | **Scheda personaggio** | proprietario, Master |
| `/master` | **Pannello Master** (Fase 2) | Master |
| `/compendio` | Allineamenti, divinità, razze, classi, catalogo capacità e requisiti (dati da git, sola lettura) | tutti |
| `/mondo/...` | Pagine informative a moduli (Fase 3), es. `/mondo/pantheon`, `/mondo/png/sereena` | in base alla visibilità |

---

## Scheda personaggio

Due principi (revamp del 15/11/2026):
1. **Immediatezza**: tutti i valori sono **a vista**, nel posto dove un giocatore esperto se li aspetta (come sulla scheda cartacea). Niente valori nascosti dietro un tocco: si espande solo il **testo** (descrizioni, requisiti).
2. **Rustica e vivace**: pergamena con grana (tema chiaro) o cuoio a lume di candela (tema scuro), riquadri con **borchie agli angoli**, didascalie **a nastro**, un **colore per ogni risorsa** (PF rosso, Spirito azzurro, Mana blu, Follia viola, Fato verde, Oro dorato, Esperienza ambra), dado animato, lampo rosso/verde su danno e cura.

La scheda occupa **tutta la pagina**, senza link "indietro" (si torna con il logo Xerioth). Mixin in `tokens.less`: `.sheet-box()`, `.sheet-caption()`, `.rollable()`.

```
┌ Intestazione ─────────────────────────────────────────────────────────────┐
│ (O) OMNIA TENEM                                │ PF 154/198 │Spirito│Follia│
│     Classe ◆ Razza ◆ Allineamento              │ ▓▓▓▓▓▓░░░  │125/600│ 16 ±│
│     Età 26 · Altezza 175 cm · Peso 75 · Occhi… │ Danni Temp │ Fato  │ Oro  │
│     [Liv. 23 ▓▓▓▓▓▓▓▓▓░░ 6.858 / 3.000 Livello!]│  Bonus     │  5 ±  │262.609│
└───────────────────────────────────────────────────────────────────────────┘
┌ Caratteristiche ┐  ┌ Capacità │ Miracoli │ Inventario │ Diario │ Allen. │ Domande │ Tiri ┐
│ Abilità 15 (+1) │  │ Cerca…  [Tutte][ABI][COS]…                                       │
│ ▓░░ 13/605   ⚀ │  │ ABILITÀ                                              15 (+1)    │
│ …               │  │ Spada (armi medie)               1   ▓░░ 7/100        ⚀  ›     │
├ Sbloccabili ────┤  │ …                                                               │
├ Equipaggiato ───┤  └─────────────────────────────────────────────────────────────────┘
└─────────────────┘                                                         (dado) ← tiro libero
```

- **La pagina non scorre mai**: la scheda occupa esattamente lo schermo (`100dvh`). Intestazione e linguette restano fisse; scorrono solo le colonne, ognuna per conto suo (caratteristiche, pannello della linguetta, colonna destra). Cambiando linguetta il pannello riparte dall'alto.
- **Intestazione** (desktop): targhetta (ritratto, nome, classe ◆ razza ◆ allineamento, aspetto su una riga, barra **livello + esperienza**) e, accanto, i parametri vitali **su una fila**: **PF** più largo con danni/temporanei/bonus a vista, risorse di classe con barra, **Follia** e **Fato** con −/+ sempre visibili, **oro**. Sotto i 1300 px i parametri vitali vanno sotto la targhetta, sempre su una fila.
- **Colonna sinistra** (≥ 1100 px): Caratteristiche — nome con avanzamento sottile sotto, a destra **Val 15 · Mod +1** (etichetta accanto al numero, niente ovali); sotto, Sbloccabili ed Equipaggiato.
- **Schermi larghi** (≥ 1600 px): terza colonna a destra con Sbloccabili ed Equipaggiato. Quando il pannello è largo (≥ 880 px) i gruppi di capacità si dispongono su due colonne.
- **Area principale** a linguette, in ordine di uso: Capacità, Poteri (una linguetta; se ci sono più tipi di potere, scelta in cima), Inventario, Diario, Allenamenti, Domande, Tiri.
- **Sotto i 1100 px** le caratteristiche e gli sbloccabili stanno in cima alla linguetta Capacità.
- **Telefono** (≤ 720 px): in alto una **fascia fissa** con ritratto, nome, livello con barra dell'esperienza, PF con barra e i chip di risorse, Follia, Fato e Oro. Un tocco sul nome apre i dettagli (classe ◆ razza ◆ allineamento, aspetto, riga del livello). In basso la **barra delle linguette** — Capacità, Poteri, **dado** (sporge al centro), Inventario, Diario, Altro (Allenamenti, Domande, Tiri). In mezzo scorre la sezione. Le finestre salgono dal basso.

### Sempre modificabile (niente modalità Modifica)
La scheda è **sempre modificabile**, come una scheda di carta con la matita in mano. Non esiste un pulsante "Modifica".
- **Tiro**: un tocco su una caratteristica, capacità o potere **tira subito** il d20. **Pressione lunga** (o clic destro, o Maiusc+Invio) apre le opzioni prima del tiro: dado fisico, tiro nascosto.
- **Numeri** (valore della caratteristica, livello, riuscita per il Master, aspetto): un clic sul numero lo modifica (bordo tratteggiato al passaggio); il clic sul resto della riga, barra di avanzamento compresa, tira.
- **Campo in modifica**: grande quanto il numero, stesso carattere; niente riquadro, solo una **sottolineatura "a matita"** e un velo di colore. Lo stesso vale per il campo "quanti punti", compatto e in riga (− + ✕ senza bordi).
- **Avanzamento**: un clic sui punti ("7 / 100") apre il campo per aggiungere o togliere punti.
- **Controlli dell'elemento** (MAX, caratteristica usata nei tiri, acquisizione, modifica completa, elimina, domanda al Master): nel **dettaglio** che si apre con la freccia a destra, per tenere pulite le righe.
- **Elemento aperto**: riga e dettaglio diventano **una scheda sola** (sfondo proprio, bordo, ombra leggera, banda d'accento a sinistra, nome nel colore d'accento); il dettaglio è separato dalla riga solo da un tratteggio. Così è chiaro a chi appartiene ciò che si è aperto. Vale per capacità, poteri e oggetti.
- Sempre a portata: PF, risorse, Follia, Fato, oro, esperienza, quantità, cariche, "Usa", "In uso", e **Aggiungi** in ogni sezione.

**Pulsanti**: il pulsante principale (`.btn--primary`) ha bordo e testo nel colore d'accento su sfondo tenue e si riempie solo al passaggio; niente blocchi pieni, gradienti o ombre interne. Nelle barre delle sezioni ha la forma a pillola come gli altri controlli (filtri, Raggruppa).

### Parametri vitali
- Tocco su PF, risorsa, oro o barra del livello → finestra con il valore grande e un campo **quantità** con due pulsanti grandi: **Danno / Cura** per i PF, **Togli / Aggiungi** per il resto. Invio = pulsante di destra. Il numero grande resta modificabile direttamente.
- PF: i danni consumano prima i temporanei; nella finestra si correggono anche danni, temporanei e bonus.
- Livello: −/+ nella finestra dell'esperienza.
- **Annulla al posto delle conferme**: ogni cambio mostra un avviso in basso (es. "PF 154 → 147") con **Annulla** per 5 secondi.

**Icone**: solo icone vere (lucide-react, elenco in `src/components/icons.ts`), mai emoji. Ogni campo principale dell'intestazione ha la sua icona (livello, PE, PF, risorse, Follia, Fato, monete d'oro).

**Avanzamento**: ogni barra (caratteristiche, capacità, poteri, allenamenti) ha il pulsante **−/+** per togliere o aggiungere punti; il valore resta anche modificabile direttamente. Ovunque il **−** sta a sinistra e il **+** a destra.

**Caratteri**: si scelgono dall'intestazione (icona "T"), la scelta resta nel browser. Coppie titoli / testo (`src/styles/fonts.ts`): **Manuale** (Alegreya SC / Alegreya Sans, predefinito), Classico (Cinzel / Inter), Pergamena (Cormorant SC / EB Garamond), Grimorio (Uncial Antiqua / Spectral), Nitido (Marcellus SC / Source Sans 3). I numeri sono sempre allineati.

### 2. Capacità
Interruttore **Raggruppa** (la scelta resta nel browser): acceso, gruppi per **caratteristica** (titolo con valore e modificatore, testo semplice); spento, elenco unico in ordine alfabetico con la sigla della caratteristica accanto al nome. Filtro rapido per caratteristica (ABI, COS…) e ricerca. Niente somma e niente stima dei giorni (stanno in *Allenamenti*).

**Gerarchia della riga** (in Gioco): devono saltare all'occhio solo **nome** e **livello**. Meno tabelle possibile: ogni numero ha la sua etichetta piccola **sopra**, non intestazioni di colonna.
```
Spada (armi medie)                    LIV
▬▬───────────────────── 7 / 100        1

Destrezza                             LIV
[MAX]                                  4
```
- Nome a sinistra (a capo solo tra parole, mai tagliato); a destra **Liv** sopra e livello grande sotto, centrati (NA tenue).
- Avanzamento: linea sottile sotto il nome con i punti piccoli; al MAX la scritta **MAX** prende il posto della barra.
- Dado: compare solo al passaggio del mouse (il tocco tira comunque). Freccia della descrizione tenue, piena al passaggio.
- Separatori leggeri tra le righe.
- Freccia a destra: descrizione e domanda al Master. **Niente requisiti**: la capacità è già posseduta (i requisiti si vedono solo nel catalogo, quando la si aggiunge).
- **Aggiungi** (sempre visibile nella barra in alto): dal catalogo (filtrabile, con requisiti soddisfatti/mancanti) oppure capacità personalizzata.
- Clic sul livello per cambiarlo, sui punti per aggiungere/togliere; nel dettaglio: **MAX**, caratteristica usata nei tiri, domanda al Master, elimina.

### 3. Poteri (Miracoli / Incantesimi / Poteri mentali)
- Una linguetta sola; con più tipi di potere si sceglie il tipo in cima. Due classi dello stesso tipo condividono la sezione.
- Ogni potere è una **riga** (stessa gerarchia delle capacità): nome intero in evidenza (badge "Speciale" / "Vortex"); sotto, la linea dell'avanzamento (al MAX la scritta **MAX** al suo posto); a destra **tre blocchi** in riquadri, sempre a vista:
  ```
  Fulmine Sacro     ╭─────────────╮╭────────────╮╭──────────────────────╮
  ▬▬▬──── 7 / 100   │ LIV RIUSCITA││COSTO LANCIO││RAGGIO  AREA   DURATA │
                    │  4     43   ││ 15     3   ││  9m     3m    1 min  │
                    ╰─────────────╯╰────────────╯╰──────────────────────╯
  ```
  - **Tiro** (Liv, Riuscita): evidenziato, sfondo d'accento, livello grande.
  - **Lancio** (Costo, Lancio) ed **Effetto** (Raggio, Area, Durata): tenui, valori più piccoli. Valore vuoto = "—" tenue; raggio e area uguali = un solo valore **Raggio/Area** su due colonne.
  - Etichetta piccola sopra (11px, niente icone), valore sotto, centrati; colonne a larghezza fissa, incolonnate tra le righe; testi lunghi coi puntini (intero nel tooltip).
  - Come nelle capacità, il **dado sta a sinistra del Tiro**, 18px, tenue, al passaggio del mouse. Se il pannello è stretto (< 820px) i blocchi vanno sotto il nome, a capo se serve, e il dado sparisce.
- Clic sul livello per cambiarlo, sui punti per aggiungere/togliere; nel dettaglio (freccia a destra): descrizione, acquisizione, MAX, domanda al Master, modifica completa, elimina.
- **Riuscita**: il totale fissato (es. 43), in sola lettura nella riga. Il Master la fissa dalla **modifica del potere**: sceglie il **Dado riuscita** e accanto vede la **Riuscita** che ne risulta; al salvataggio si salva quel totale. A livello 0 il dado è bloccato a 20.
- **Lancio Rapido**: interruttore nella barra in alto (solo se il personaggio ha la capacità); acceso, costo e tempo mostrati sono quelli modificati.
- Classi con Punti Mana: sotto **Costo** c'è direttamente il **costo della tabella A108**. Le altre (es. Sacerdoti) vedono il costo scritto, anche "ND". Nessuna etichetta "da tabella".

### 3b. Allenamenti
- Punti al giorno per discipline mentali e fisiche (base, capacità di supporto, booster).
- Elenco di capacità e poteri allenabili: **maestro** (solo qui), punti/giorno, avanzamento con +/− (proposta: i punti di un giorno), punti mancanti e giorni stimati.

### 4. Inventario
Un solo inventario con due categorie: **Oggetti utilizzabili** ed **Equipaggiamento** (con tipo arma/armatura e interruttore "in uso").
- Riga: nome con icona (arma, armatura, oggetto), **In uso**, quantità **−/+**, cariche residue / totali, valore, **Usa**. Gli oggetti in uso stanno in cima.
- **"Usa"**: scala una carica o una quantità, con Annulla. Solo per oggetti utilizzabili o con cariche (non per armi e armature). Gli effetti (es. "Ripristina 130 PF") sono nella descrizione e si applicano a mano.
- Descrizione, domanda al Master, modifica ed elimina con la freccia a destra. Ricerca e filtri rapidi (Tutto, In uso, Equipaggiamento, Utilizzabili).

### 5. Diario
- Raggruppato per **capitolo** e filtrabile per **tipo** (preghiera, appunto, cose da fare, acquisti…).
- Le preghiere mostrano la **conversazione con il Master** (domanda/risposta) e il suo stato.
- "Cose da fare" e "acquisti" con caselle di spunta.
- **Ricerca** testuale; editor markdown semplice.

### 6. Tiri
**Tiro libero**, storico del personaggio e tiri del gruppo.

---

## Lanciatore di dadi (d20 per la scheda)

```
┌───────────────────────────────────┐
│ Ruba tempo                      ✕ │
│ ┌──────┐┌──────┐┌───────┐┌───────┐│
│ │INTELL││ MOD. ││LIVELLO││RIUSC. ││
│ │  23  ││  +4  ││   1   ││  31   ││
│ └──────┘└──────┘└───────┘└───────┘│
│   ╱‾‾‾╲            TOTALE         │
│  │  1  │            29   (rosso)  │
│   ╲___╱                           │
│   ╱‾‾‾╲            LIMITE         │
│  │  2  │             2   (verde)  │
│   ╲___╱                           │
│           ⟳ Nuovo tiro            │
└───────────────────────────────────┘
```
- Con il tocco sulla scheda il tiro parte **subito**: il d20 "rotola" al centro e si ferma sul risultato (il 20 naturale brilla), resta **fermo al centro per 0,5 secondi**, poi **scivola a sinistra** rimpicciolendosi e a destra compare il **totale**, grande, che sale dal valore del dado fino al risultato.
- **Nessuna scritta Successo / Fallimento.** Poteri: l'esito si legge dal totale contro la riuscita, e dado e totale si colorano di verde o rosso. Caratteristiche e capacità: colore neutro, nessun esito (le classi difficoltà le sa il Master).
- Il totale è la somma di d20, caratteristica, modificatore e livello (doc 01 §7), ma la somma **non si scrive**: si vedono i riquadri di riferimento e il totale. Per le caratteristiche il riquadro Livello non c'è.
- **Ritiro (poteri)**: se il primo dado fallisce (rosso) compare **Ritira il fallimento!** (con dado fisico). Al ritiro si tira **davvero un secondo d20 sotto al primo**: il secondo entra crescendo e il primo **sale per fargli spazio**. A destra del secondo c'è il **Limite** (2 × livello; al MAX 19): verde se il ritiro è entro il limite, rosso altrimenti.
- Dalla pressione lunga o da "Nuovo tiro" si parte invece dalle opzioni: **Tira il d20**, dado fisico, tiro nascosto.
- Storico dei tiri: l'esito compare solo per i poteri (automatico); niente menu per segnarlo a mano.

### Tiro libero
Dal dado flottante (o dalla linguetta Tiri): **qualsiasi dado classico** — d4, d6, d8, d10, d12, d20, d100 — anche più d'uno (− 3 + → **Tira 3d6**: si tirano **davvero 3 dadi**, piccoli e in fila, che rotolano e si fermano uno dopo l'altro; fermi tutti, sotto compare il **totale** grande, che sale fino alla somma). Non è legato alla scheda: **niente caratteristica, niente dado fisico, niente esito**; resta solo "Nascosto".

Ogni tiro va nel registro della campagna, visibile al gruppo secondo le regole del doc 02.

---

## Domande al Master

- L'icona domanda sta nel dettaglio di ogni elemento (freccia a destra); per le caratteristiche è in fondo alla riga, tenue, piena al passaggio. Se una domanda è aperta o ha una risposta, accanto al nome compare l'icona colorata (azzurra in attesa, verde con risposta). Il giocatore scrive la domanda; se ce n'è già una aperta, si apre la conversazione.
- Il Master vede una **lista di domande in attesa**. Un clic porta alla scheda, con l'elemento evidenziato.
- Stati: *in attesa del Master* → *risposta ricevuta* → *chiusa* (la chiude il giocatore).

---

## Pannello Master (Fase 2)

- **Domande in attesa** (incluse le preghiere), con notifica.
- **Tiri del gruppo** in tempo reale.
- **Riepilogo personaggi**: PF attuali/massimi, **armi e armature equipaggiate**, risorse (Mana / Spirito / Mente / Anima).
- In seguito: **iniziativa** (ordine dei turni).

---

## Struttura del codice

```
src/
  game/
    data/          dati statici versionati (tabelle, razze, classi, capacità…)
    rules/         funzioni pure: modificatori, PF, costi, mana, allenamento, tiri (+ test)
  lib/supabase.ts  client Supabase
  features/
    auth/          accesso, sessione
    campaigns/     campagne, ruolo nella campagna
    characters/    elenco, creazione, scheda
    skills/        capacità, catalogo, requisiti
    powers/        miracoli/incantesimi/poteri mentali
    inventory/     inventario
    journal/       diario
    threads/       domande al Master
    dice/          lanciatore e registro
    compendium/    compendio
    master/        pannello Master
  components/      componenti comuni (bottoni, input, barre, finestre)
  styles/          LESS: variabili tema, mixin, stili globali
```
