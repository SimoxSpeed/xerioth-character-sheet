# 01 — Regole di gioco (motore di calcolo)

Fonti: scheda "Omnia Tenem - Sacerdote di Tarooth" e "Xerioth Master" (fogli *Avanzamenti*, *Critico negativo*, *Punti fato*, *Allineamenti*).

**Dove stanno le regole**: tabelle e formule che non cambiano stanno **nel repository git**, come file TypeScript in `src/game/data/`, e non nel database. Le modifiche passano da una correzione al codice.

**Principio generale**: l'app calcola solo ciò che ha una formula certa. Il resto (riuscite decise dal Master, Punti Spirito comunicati dal Master…) è un campo che il giocatore compila. Le altre formule si aggiungeranno caso per caso.

---

## 1. Caratteristiche

Sei caratteristiche: **Abilità, Costituzione, Intelligenza, Riflessi, Freddezza, Fascino**.

Ogni caratteristica ha:
- **valore** (es. 23);
- **modificatore** (calcolato);
- **avanzamento**: punti accumulati finora verso il valore successivo.

### Modificatore e booster

| Valore | Modificatore | Booster |
|---|---|---|
| fino a 12 | 0 | ×1 |
| 13–15 | 1 | ×1 |
| 16–18 | 2 | ×2 |
| 19–21 | 3 | ×2 |
| 22–24 | 4 | ×2 |
| 25–27 | 5 | ×3 |
| 28–30 | 6 | ×3 |
| 31–33 | 7 | ×3 |
| 34–36 | 8 | ×3 |
| 37–39 | 9 | ×3 |
| 40–42 | 10 | ×4 |
| 43–45 | 11 | ×4 |
| 46–48 | 12 | ×4 |

Formula: `modificatore = max(0, floor((valore − 10) / 3))`. Sotto 9 vale 0.

Verifica (Omnia): Intelligenza 23 → +4, Riflessi 18 → +2, Abilità 15 → +1, Fascino 11 → 0. ✅

### Costo per arrivare al valore N

Il costo indicato è quello per **arrivare** a N. La barra di avanzamento mostra `avanzamento / costo(valore + 1)`.

| N | Abilità | Costituzione | Fascino | Freddezza | Intelligenza | Riflessi |
|---|---|---|---|---|---|---|
| 4 | 60 | 30 | 30 | 20 | 50 | 75 |
| 5 | 90 | 45 | 45 | 45 | 75 | 110 |
| 6 | 120 | 60 | 60 | 70 | 100 | 145 |
| 7 | 150 | 75 | 75 | 85 | 125 | 180 |
| 8 | 185 | 95 | 95 | 100 | 150 | 220 |
| 9 | 220 | 120 | 120 | 120 | 175 | 260 |
| 10 | 260 | 145 | 145 | 145 | 210 | 305 |
| 11 | 300 | 170 | 170 | 170 | 245 | 350 |
| 12 | 350 | 205 | 205 | 205 | 290 | 405 |
| 13 | 400 | 240 | 240 | 240 | 335 | 460 |
| 14 | 450 | 275 | 275 | 275 | 380 | 515 |
| 15 | 500 | 310 | 310 | 310 | 425 | 570 |
| 16 | 605 | 345 | 345 | 345 | 470 | 625 |
| 17 | 660 | 390 | 390 | 380 | 525 | 690 |
| 18 | 725 | 445 | 445 | 420 | 590 | 765 |
| 19 | 800 | 520 | 520 | 460 | 675 | 840 |
| 20 | 870 | 595 | 595 | 500 | 930 | 915 |
| 21 | 940 | 670 | 670 | 540 | 1015 | 990 |
| 22 | 1010 | 745 | 745 | 590 | 1070 | 1070 |
| 23 | 1080 | 825 | 825 | 640 | 1150 | 1150 |
| 24 | 1160 | 905 | 905 | 690 | 1230 | 1230 |
| 25 | 1240 | 985 | 985 | 740 | 1310 | 1310 |
| 26 | 1320 | 1065 | 1065 | 790 | 1390 | 1395 |
| 27 | 1400 | 1145 | 1145 | 840 | 1475 | 1480 |
| 28 | 1490 | 1225 | 1225 | 900 | 1560 | 1565 |
| 29 | 1580 | 1310 | 1310 | 960 | 1645 | 1655 |
| 30 | 1670 | 1395 | 1395 | 1020 | 1735 | 1745 |

Esempio (Omnia): Intelligenza 23 → per arrivare a 24 servono 1230 punti.

---

## 2. Punti Ferita

```
PF massimi = (Costituzione + modificatore Costituzione + livello capacità "Forza") × coefficiente razza
             + bonus PF (es. Bracciale Vita +100)
PF attuali = PF massimi + PF temporanei − danni ricevuti
```

| Razza | Coeff. | Razza | Coeff. |
|---|---|---|---|
| Umano | 7 | Vampiri | 7 |
| Elfo | 6 | Goblin | 7 |
| Nano | 8 | Satiri | 6 |
| Minotauro | 9 | Troll | 9 |
| Orco | 9 | Tiefling | 6 |
| Halfling | 6 | Leodon | 8 |

Verifica (Omnia): (13 + 1 + 0) × 7 + 100 = **198**; 198 − 44 danni = **154**. ✅

- **PF temporanei**: campo libero, si sommano ai PF attuali.
- **Resistenza Fisica** (quanto si può scendere sotto 0): **nessun calcolo**. Il giocatore comunica il numero al Master, che fa il conto finale. La regola resta nella descrizione della capacità.

---

## 3. Risorse e contatori

| Contatore | Gestione |
|---|---|
| **Punti Follia** | contatore del giocatore, nessun calcolo |
| **Punti Fato** | contatore del giocatore, nessun calcolo |
| **Punti Spirito** (sacerdoti) | attuali comunicati dal Master; massimo assoluto **600** (Omnia: 125 attuali) |
| **Punti Mana** (Alteratori, Evocatori, Elementalisti, Necromanti, Magia Pura) | **calcolabili** (vedi sotto) |
| **Punti Mente** (Mentalisti), **Anima** (Incantatori, Druidi) | **calcolabili** come i Punti Mana |
| **Monete d'oro** | contatore |

Il tipo di risorsa dipende dalla **classe** (vedi template di classe in 02).

### Punti Mana, Punti Mente e Anima

Fonte: *Avanzamenti › Calcolo punti mana*. Punti Mente e Anima usano lo **stesso calcolo** e la **stessa tabella del costo di lancio** (`usesManaRules` in `src/game/rules/mana.ts`).

```
Punti Mana = Intelligenza
           + (modificatore Intelligenza)²
           + numero totale incantesimi × 3
           + T(somma dei livelli degli incantesimi)
           + (livello del mago)²
```

`T(s)` è una tabella: 0→0, 1→1, 2→3, 3→6, 4→10, 5→15, 6→21, 7→28, 8→36, 9→45, 10→55, 11→65, 12→75, 13→85, 14→95, 15→105, 16→110, 17→120, 18→131, 19→143, 20→156 … 30→341 … 61→1550. La tabella completa andrà nel codice.

Verifica (esempio del foglio): 21 + 3² + 11×3 + T(28)=296 + 8² = **423**. ✅

### Costo in mana per lanciare

Fonte: *Avanzamenti › A108 (Punti mana che servono per lanciare incantesimi)*. Tabella a doppia entrata: **Bonus** = livello attuale dell'incantesimo (0–10) × **Livello** = livello di acquisizione (1–10). Esempio: acquisizione 3, livello attuale 2 → **25**.

Vale **per chi usa Mana, Punti Mente o Anima** (dipende dalla classe): sotto **Costo** si vede direttamente il valore della tabella, senza etichette. I Sacerdoti (Punti Spirito) non la usano: il costo è quello scritto, anche "ND".

Nell'app il costo **calcolato dalla tabella** compare accanto a ogni potere con livello di acquisizione noto. Il campo "costo" scritto a mano resta e **ha la precedenza**, perché alcuni costi attuali sono diversi (es. Omnia, Ruba tempo: 70).

---

## 4. Capacità, incantesimi e miracoli: costo dei livelli

| Livello | Punti | Somma |
|---|---|---|
| 0 | 35 | 35 |
| 1 | 75 | 110 |
| 2 | 100 | 210 |
| 3 | 190 | 400 |
| 4 | 250 | 650 |
| 5 | 380 | 1030 |
| 6 | 520 | 1550 |
| 7 | 670 | 2220 |
| 8 | 830 | 3050 |
| 9 | 1000 | 4050 |
| 10 | 1180 | 5230 |
| 11 | 1370 | 6600 |
| 12 | 1570 | 8170 |
| 13 | 1780 | 9950 |
| 14 | 2000 | 11950 |
| 15 | 2230 | 14180 |
| 16 | 2470 | 16650 |
| 17 | 2720 | 19370 |
| 18 | 2980 | 22350 |
| 19 | 3250 | 25600 |
| 20 | 3530 | 29130 |

- Non appresa (NA) → il livello 0 costa 35.
- **Per livello successivo** = punti del livello L+1. **Somma** = cumulativo fino a L.
- **MAX**: non si deduce dal catalogo. Ogni capacità/incantesimo ha un interruttore **"Al massimo"** che il giocatore attiva quando il Master lo comunica. Da quel momento il livello è bloccato e non mostra più il costo successivo.
- **Avanzamento**: punti accumulati verso il livello successivo, con barra di progresso (es. Ubiquità 483 / 520).

Verifica (Omnia): Teologia liv. 9 → successivo 1180, somma 4050. ✅

Nota informativa (non calcolata): le classi che usano il mana possono comprare in gilda un incantesimo singolo a 10.000 mo, che si acquisisce a livello 0.

---

## 5. Livello del personaggio ed esperienza

Fonte: *Xerioth Master › Avanzamenti › A38 (Aumento livello personaggio)*.

- Ogni aumento o diminuzione di esperienza (+/−) è una **voce del registro**. L'**esperienza totale** si calcola sempre sommando le voci; l'esperienza "di questo livello" si calcola dal totale.
- Costo per **arrivare** al livello N: `600 + 100 × N` (1 → 700, 23 → 2900, 24 → 3000).
- Esperienza del livello = totale − Σ costi dei livelli da 1 a quello attuale.

Verifica (Omnia): Σ dal livello 1 al 23 = **41.400**; 48.258 − 41.400 = **6.858**. ✅

Quando l'esperienza del livello raggiunge la soglia del livello successivo (Omnia: 6.858 ≥ 3.000), l'app mostra **"Puoi salire di livello"**. Il livello lo alza il giocatore; l'esperienza eccedente resta nel nuovo livello.

---

## 6. Allenamento (stima, non resoconto)

Serve solo per **stimare quanto manca** al prossimo livello di una capacità, mostrandolo al passaggio del mouse (es. "≈ 23 giorni a 23 punti/giorno").

Fonte: *Avanzamenti › Calcolo automatico avanzamento* e *Capacità di avanzamento*.

```
punti al giorno = 2 (base)
                + Σ capacità di supporto adatte alla disciplina: punti(livello) + booster(se liv. 4)
                + punti maestro (se scelto)
                + modificatore della caratteristica della capacità allenata
```

| Capacità di supporto | Vale per | liv. 1 | liv. 2 | liv. 3 | liv. 4 |
|---|---|---|---|---|---|
| Studio | discipline mentali (Int, Fas, Fre) | +1 | +1 | +2 | +4 + booster (Int o Fas, il più alto) |
| Concentrazione | mentali | +1 (+1 h) | +1 | +2 (+1 h) | +4 + booster (Int o Fas) (+1 h) |
| Destrezza | discipline fisiche (Cos, Abi, Rif) | +1 | +1 | +2 | +4 + booster (Rif, Cos o Abi, il più alto) |
| Resistenza alla Fatica | fisiche | +1 (+1 h) | +1 | +2 (+1 h) | +4 + booster (Rif, Cos o Abi) (+1 h) |
| Resilienza | fisiche e mentali | +1 | +1 | +2 | +4 + booster (caratteristica più alta, tranne Freddezza) |

- **Booster** = modificatore × moltiplicatore booster (tabella §1).
- **Maestro**: liv. 1 → 2 punti, liv. 2 → 5, liv. 3 → 10, liv. 4 → 15. Vale **solo per l'allenamento**: si sceglie nella scheda *Allenamenti*, per ogni cosa che si allena.
- **Miracoli e poteri** si allenano su **Intelligenza**. Le altre capacità usano la loro caratteristica.

Verifica (esempio del foglio): 2 + (4+1) + (4+1) + (4+1) + 5 + 1 = **23**. ✅

### Sblocco automatico (suggerimento dell'app)

Quando si verificano le condizioni, l'app avvisa: *"Puoi segnare X a livello 1"*.
- **Concentrazione**: livello pg + Intelligenza + mod. Int = 30.
- **Destrezza**, **Resistenza alla Fatica**: livello pg + Costituzione + Abilità = 30.
- **Resilienza**: livello Concentrazione + livello Resistenza alla Fatica = 8.
- Allo sblocco si guadagnano i punti esperienza che servivano per portarla da nulla a 1, da aggiungere all'esperienza del livello.

---

## 7. Tiri di dado

**I tiri della scheda si fanno con il d20.** Gli altri dadi (d4, d6, d8, d10, d12, d100) si tirano nel **tiro libero**, senza legarli a niente della scheda. Il risultato del d20 si può **tirare nell'app** o **inserire da un dado fisico**.

### Totale

```
capacità, poteri:   totale = d20 + caratteristica + modificatore + livello   (NA = 0)
caratteristiche:    totale = d20 + caratteristica + modificatore
```

Es. Spada (Abilità 15, mod +1, liv. 1) con d20 = 7 → totale **24**. L'app mostra caratteristica, modificatore e livello come riquadri e poi **solo il totale**, non la somma scritta (`rollBonus` in `src/game/rules/dice.ts`).

### Caratteristiche e capacità

Non hanno un dado riuscita e **non hanno esito**: le classi difficoltà le conosce solo il Master. Si vede solo il totale.

### Poteri e miracoli: riuscita fissata dal Master

- Quando conferisce il potere, il **Master sceglie il dado riuscita** (`success_die`, 0–20) e vede subito la **riuscita** che il personaggio dovrà fare: dado + caratteristica + modificatore + livello **di quel momento** (foglio "Dadi riuscita"; es. Corrosione: 20 + Intelligenza 20 + 3 + liv. 0 = **43**).
- Nel database si salva **il totale** (`success_target`), che poi **resta fisso**: alzando dopo caratteristica o livello il potere riesce più facilmente (es. Corrosione 43 con Intelligenza 23: basta un 16 invece di un 20). Si ricalcola solo se il Master cambia il dado.
- **Regola fissa: un potere a livello 0 parte solo con dado 20** (l'app lo imposta da sola, il database rifiuta altri dadi).
- Il giocatore non può cambiare dado né riuscita (lo impedisce il database).
- Il potere **riesce se il totale del tiro è uguale o maggiore della riuscita**. Finché il Master non l'ha fissata, non c'è esito.
- Riuscite di Omnia prese dal foglio "Dadi riuscita" (colonna Riuscita, calcolate con Intelligenza 20).

### Ritirare il fallimento (solo poteri e miracoli)

Se il totale non raggiunge la riuscita:
1. si **ritira**;
2. se il ritiro (d20 **naturale**, senza somme) è **≤ 2 × livello** del potere, il potere **riesce**; altrimenti **fallisce davvero**;
3. un **20** al ritiro fallisce sempre; con il potere **al massimo** si salva fino a 19 (regola del foglio "Critico negativo").

### Punti Fato

Si usano solo sui propri dadi: scegliere il numero, prendere 20, oppure ritirare (se esce lo stesso numero il punto non si perde). Nell'app il contatore si scala a mano e l'uso **non viene registrato** nello storico.

### Lancio Rapido

Visibile **solo se il personaggio possiede la capacità Lancio Rapido**. È un **interruttore** nella scheda dei poteri: acceso, mostra tempo di lancio ridotto e costo aumentato del 30% + 5% per ogni livello oltre il primo.

---

## 8. Requisiti delle capacità

Dal catalogo *Capacità*: ogni capacità ha una caratteristica di appartenenza e dei **requisiti** (es. *Contrattacco*: Ambidestro 3; *Comandare*: Fascino 15 e Carisma 1). Il catalogo sta in git. L'app mostra ✅/❌ e cosa manca quando si aggiunge una capacità. Il "livello max" del catalogo è solo un'indicazione.

## 9. Allineamenti

I nove allineamenti con le descrizioni stanno nel **Compendio**, una sezione fuori dalla scheda. Nella scheda c'è solo l'allineamento scelto.
