# 07 — Dubbi e incongruenze del manuale

Fonte: foglio Google **"Xerioth manuale"** (`10MTkM8BeIe4qSYCV3zb6eZmKClOfZ4eQEeke8rZ8deI`). Il manuale si legge e basta: non si modifica mai.

**Il manuale ha ragione su tutto**, salvo le eccezioni decise dal Master (elencate in 01). Questo file raccoglie:

1. i dubbi ancora aperti;
2. le incongruenze interne al manuale;
3. i testi dell'app che non vengono dal manuale.

I dati del manuale sono nei cataloghi del database (02 §1), scritti con la migrazione `20261118012220_catalogs.sql`.

Quando un punto è risolto, si toglie da qui e si riporta nel documento giusto (01 o 02).

---

## 1. Dubbi aperti

### Coefficienti PF mancanti

Senza coefficiente l'app non calcola i PF massimi di quella razza.

| Razza | Coefficiente |
|---|---|
| Mezzelfo | ❓ |
| Mezzorco | ❓ |
| Icaro | ❓ |

Il foglio del Master dà un solo coefficiente **Elfo = 6**: oggi vale per tutti e sei gli elfi (grigio, bianco, nero, oscuro, dei deserti, marino). ❓ È giusto?

### Razze

- **Goblin** e **Satiro**: hanno un coefficiente nel foglio del Master (7 e 6) ma non sono tra le razze del manuale, quindi nessuna descrizione. Sono nel gruppo "Altre razze". ❓
- Campi vuoti nel manuale (nell'app restano vuoti e non compaiono). ❓
  - **Aspetto**: Orco, Vampiro, Tiefling, Leodon.
  - **Taglia e longevità**: Elfo bianco, nero, oscuro, dei deserti, marino; Minotauro, Orco, Vampiro, Mezzelfo, Tiefling, Leodon.
  - **Allineamento tipico**: Elfo marino, Nano, Halfling, Minotauro, Orco, Troll, Icaro, Vampiro, Mezzelfo, Tiefling, Leodon.
  - **Tratti speciali**: Elfo grigio, Elfo oscuro, Elfo marino, Mezzelfo, Tiefling, Leodon.

### Classi e carriere

- **Guerriero**: il manuale non lo ha né tra le classi né tra le carriere. Compare solo nei testi (Nano: "Spesso Guerrieri o Sacerdoti"; Incantatori: "possono lavorare con guerrieri"). Per ora è tolto dall'elenco. ❓ Classe, carriera, o niente?
- **Ayla, Rya, Droy, Enion** (divinità degli elementi): si possono scegliere come divinità di un Sacerdote, ma il manuale non ha una tab per loro: niente motto, arma divina, esterni, esempi di miracoli. Come dominio c'è l'elemento ("Aria", "Acqua", "Fuoco", "Terra"), ricavato dalla tab Elementalisti. ❓
- **Sacerdote**: il manuale ha una tab per ogni divinità ma nessuna per la classe. Motto e frase iniziale sono vuoti; nel dettaglio ci sono solo le "Capacità collegate", uguali in tutte le tab dei Sacerdoti. ❓
- **Carriere**: Assassini e Ladri "si affiancano a una classe". Per gli Alchimisti il manuale non lo dice. Per ora la creazione personaggio chiede almeno una classe. ❓ Un personaggio può avere solo una carriera, senza classe?
- **Druido**: "manipola la magia divina, il dono può venire da Xenea o dalla natura stessa". ❓ Si sceglie una divinità come per il Sacerdote, o no?

### Capacità

- **Studio**: il manuale dice "3 punti esperienza, +2 per ogni giorno di studio"; il foglio *Avanzamenti* la usa come capacità di supporto dell'allenamento (+1, +1, +2, +4 + booster ai livelli 1–4, docs/01 §6). Nel catalogo c'è il testo del manuale, l'allenamento usa la tabella di *Avanzamenti*. ❓ Le due regole convivono?
- **Identificazione oggetti magici**: caratteristica, requisiti e livello massimo non noti. Nel catalogo c'è con Intelligenza provvisoria. ❓

### Armi e armature

Voci che il manuale lascia da definire:

| Arma | Nota del manuale |
|---|---|
| Ascia da battaglia | Armi medie o pesanti? |
| Balestra pesante | Categoria da definire |
| Martello da guerra | Martello medio o pesante? |
| Stiletto | Categoria da definire |
| Katana | Categoria da definire |
| Rete | nessuna informazione |
| Scudo | nessuna informazione |

---

## 2. Incongruenze interne al manuale

| Dove | Incongruenza |
|---|---|
| Ladri › Capacità utili | "Creare trappole (**Agilità** 13 + Intelligenza 12)"; nella tab Capacità e in Alteratori è **Abilità** 13 |
| Classi › Elementalista del Fuoco | esempio "**Fiammata**"; nella tab Elementalisti è "**palla di fuoco**" |
| Capacità › Armi medie | elenca **Martello** e **Mazza**; la tab Armi ha **Mazza ferrata** e non ha il Martello (c'è solo "Martello da guerra", da definire) |
| Capacità › Brandire Armi pesanti | elenca **Ascia pesante**, **Flagello a due mani**, **Martello pesante**, che non sono nella tab Armi |
| Capacità › Armi leggere | "**Spadino**"; nella tab Armi "**Spadino / Daga**" |
| Razze › allineamento tipico | Elfo dei deserti "**Neutrale**" (Neutrale Puro?); Mezzorco "**Tende al male**" (non è un allineamento). Si tiene come testo libero. |
| Capacità | **Pedinare** compare due volte: in Abilità (requisito Muoversi silenziosamente 3) e in Intelligenza (Muoversi silenziosamente 1), con descrizioni diverse. Nell'app la seconda si chiama "Pedinare (Intelligenza)" per distinguerle. |
| Necromanti › Nemici | refuso "Sacrdoti" (il testo si importa identico) |
| Sacerdoti di Ydelx | l'arma divina non ha nome, e manca "Comanda i suoi esterni", presente per gli altri dei |

---

## 3. Testi che non vengono dal manuale

Tutto il resto è copiato identico dalle tab. Queste sono le eccezioni:

| Dove | Cosa c'è nell'app | Perché |
|---|---|---|
| Razza **Vampiro** | nome "Vampiro di Morgoroth" (nel manuale "Vampiro") | è giocabile solo il figlio di Morgoroth |
| Capacità **Pedinare (Intelligenza)** | nome con "(Intelligenza)" | distinguerla dall'altra "Pedinare" |
| Capacità **Resistenza fisica** | descrizione della scheda di Omnia (percentuali sotto 0 PF) | il manuale non ha descrizione; la regola serve (01 §2) |
| Capacità **Destrezza**, **Resistenza alla Fatica**, **Resilienza** | descrizioni da *Xerioth Master › Avanzamenti* | non sono nel manuale (01 §8) |
| Divinità **Ayla, Rya, Droy, Enion** | dominio = nome dell'elemento | il manuale ha solo il nome (vedi §1) |
| Classi | tolte le righe "Risorsa" (c'è il campo risorsa) e "Tipo" delle carriere (c'è il gruppo Carriera); tolte le righe con etichetta senza testo ("Origine del potere", "Oggetti legati" della Magia Pura) | doppioni o vuote |
| Incantatore › Ruolo nel Gioco | le tre righe del manuale (due senza etichetta) unite in un blocco | stessa sezione |
| Gruppi di razze | "Umani", "Elfi", "Altre razze", "Razze ibride" (nel manuale in maiuscolo) | solo la forma |
