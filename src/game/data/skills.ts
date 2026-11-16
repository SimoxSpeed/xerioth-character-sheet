// Catalogo delle capacità — fonte: foglio "Capacità" della scheda di Omnia
// (+ Destrezza, Resistenza alla Fatica e Resilienza da Xerioth Master › Avanzamenti).
// Il livello massimo è solo indicativo: il MAX reale lo comunica il Master (interruttore nella scheda).

import type { AttributeKey } from './attributes'

export type Requirement =
  | { type: 'attribute'; attribute: AttributeKey; min: number }
  | { type: 'skill'; skill: string; min: number }
  | { type: 'power'; name: string }
  | { type: 'note'; text: string }

export interface SkillDefinition {
  key: string
  name: string
  attribute: AttributeKey
  maxLevel: number
  description: string
  requirements: Requirement[]
}

const attr = (attribute: AttributeKey, min: number): Requirement => ({ type: 'attribute', attribute, min })
const skill = (key: string, min: number): Requirement => ({ type: 'skill', skill: key, min })

export const SKILLS: readonly SkillDefinition[] = [
  // ---------------------------------------------------------------- Abilità
  {
    key: 'ambidestro',
    name: 'Ambidestro',
    attribute: 'abilita',
    maxLevel: 6,
    description:
      'Quanto riesci a usare la sinistra e va a livelli perché leva il malus della mano che non è la tua. A livello 1 il malus è -6 alla sinistra e -1 alla destra puoi fare 2 attacchi di spada a turno. Man mano che si aumenta il malus della sinistra diminuisce di 1 e la sinistra si azzera',
    requirements: [],
  },
  {
    key: 'armi_medie',
    name: 'Armi medie',
    attribute: 'abilita',
    maxLevel: 10,
    description: 'Ascia Bastone Bolas Flagello Frusta Martello Mazza Spada Spada Bastarda',
    requirements: [],
  },
  {
    key: 'armi_tiro_medie',
    name: 'Armi da tiro medie',
    attribute: 'abilita',
    maxLevel: 10,
    description: 'Arco Medio, Balestra ecc',
    requirements: [],
  },
  {
    key: 'armi_leggere',
    name: 'Armi leggere',
    attribute: 'abilita',
    maxLevel: 10,
    description: 'Accetta, arco corto, balestra leggera, cerbottana, falcetto, fionda, spadino, pugnali',
    requirements: [],
  },
  { key: 'arrampicarsi', name: 'Arrampicarsi', attribute: 'abilita', maxLevel: 10, description: '', requirements: [skill('agilita', 2)] },
  { key: 'cavalcare', name: 'Cavalcare', attribute: 'abilita', maxLevel: 10, description: 'Cavalcare', requirements: [] },
  { key: 'conciare_pelli', name: 'Conciare pelli', attribute: 'abilita', maxLevel: 10, description: 'Conciare pelli', requirements: [] },
  {
    key: 'costruire_armature',
    name: 'Costruire Armature',
    attribute: 'abilita',
    maxLevel: 10,
    description: '',
    requirements: [skill('conoscenza_armi_armature', 3)],
  },
  {
    key: 'costruire_armi',
    name: 'Costruire Armi',
    attribute: 'abilita',
    maxLevel: 10,
    description: '',
    requirements: [skill('conoscenza_armi_armature', 3)],
  },
  {
    key: 'crea_oggetti_magici',
    name: 'Crea oggetti magici',
    attribute: 'abilita',
    maxLevel: 10,
    description: '',
    requirements: [attr('intelligenza', 18), { type: 'power', name: 'Fondere incantesimi' }],
  },
  {
    key: 'crea_reliquie',
    name: 'Crea Reliquie',
    attribute: 'abilita',
    maxLevel: 10,
    description: '',
    requirements: [skill('crea_oggetti_magici', 8), skill('teologia', 5)],
  },
  {
    key: 'creare_rune',
    name: 'Creare Rune',
    attribute: 'abilita',
    maxLevel: 10,
    description: '',
    requirements: [skill('conoscenza_rune', 5), attr('intelligenza', 15)],
  },
  {
    key: 'creare_trappole',
    name: 'Creare trappole',
    attribute: 'abilita',
    maxLevel: 10,
    description: '',
    requirements: [attr('abilita', 13), attr('intelligenza', 12)],
  },
  {
    key: 'furtivita',
    name: 'Furtività',
    attribute: 'abilita',
    maxLevel: 10,
    description: 'Non visto, non udito, non notato',
    requirements: [skill('muoversi_silenziosamente', 3)],
  },
  {
    key: 'leggere_rune',
    name: 'Leggere Rune',
    attribute: 'abilita',
    maxLevel: 10,
    description: '',
    requirements: [skill('conoscenza_rune', 5), attr('intelligenza', 15)],
  },
  {
    key: 'muoversi_silenziosamente',
    name: 'Muoversi silenziosamente',
    attribute: 'abilita',
    maxLevel: 10,
    description: '',
    requirements: [attr('riflessi', 10)],
  },
  { key: 'nuotare', name: 'Nuotare', attribute: 'abilita', maxLevel: 10, description: 'Nuotare', requirements: [] },
  {
    key: 'pedinare',
    name: 'Pedinare',
    attribute: 'abilita',
    maxLevel: 10,
    description: 'Segui la persona senza che lui ti nota.',
    requirements: [skill('muoversi_silenziosamente', 3)],
  },
  {
    key: 'produrre_veleni',
    name: 'Produrre allucinogeni / Veleni / Droghe',
    attribute: 'abilita',
    maxLevel: 10,
    description: '',
    requirements: [skill('erboristeria', 3)],
  },
  {
    key: 'produrre_pozioni',
    name: 'Produrre pozioni',
    attribute: 'abilita',
    maxLevel: 10,
    description: '',
    requirements: [skill('erboristeria', 5)],
  },
  {
    key: 'riparare_armature',
    name: 'Riparare Armature',
    attribute: 'abilita',
    maxLevel: 10,
    description: '',
    requirements: [skill('conoscenza_armi_armature', 3)],
  },
  {
    key: 'riparare_armi',
    name: 'Riparare Armi',
    attribute: 'abilita',
    maxLevel: 10,
    description: '',
    requirements: [skill('conoscenza_armi_armature', 3)],
  },
  { key: 'scassinare', name: 'Scassinare', attribute: 'abilita', maxLevel: 10, description: 'Aprire forzando la serratura.', requirements: [] },
  {
    key: 'seguire_tracce',
    name: 'Seguire tracce',
    attribute: 'abilita',
    maxLevel: 10,
    description: 'Capire tramite odori, impronte ecc..cosa è accaduto in quel luogo e come poi si è sviluppato.',
    requirements: [],
  },
  {
    key: 'sopravvivenza',
    name: 'Sopravvivenza',
    attribute: 'abilita',
    maxLevel: 10,
    description:
      'Attitudine a resistere a condizioni sfavorevoli o avverse. recuperi acqua dal terreno, se fa freddo come scaldasi',
    requirements: [],
  },

  // ----------------------------------------------------------- Costituzione
  {
    key: 'apnea',
    name: 'Apnea',
    attribute: 'costituzione',
    maxLevel: 10,
    description: 'Arresto volontario o patologico dei movimenti respiratori.',
    requirements: [attr('costituzione', 12)],
  },
  {
    key: 'armi_pesanti',
    name: 'Brandire Armi pesanti',
    attribute: 'costituzione',
    maxLevel: 10,
    description: 'Alabarda Arco lungo Ascia pesante Falce Flagello a due mani Lancia Martello pesante Spadone Tridente',
    requirements: [{ type: 'note', text: 'Costituzione 13, altrimenti malus del 40% sulla lentezza dei movimenti' }],
  },
  {
    key: 'forza',
    name: 'Forza',
    attribute: 'costituzione',
    maxLevel: 10,
    description:
      "Attitudine di un muscolo a compiere un lavoro, in rapporto all'integrità dei vari complessi anatomici, alla disponibilità delle sostanze energetiche e alle condizioni di allenamento.",
    requirements: [attr('costituzione', 12)],
  },
  {
    key: 'resistenza_caldo_freddo',
    name: 'Resistenza al freddo e al caldo',
    attribute: 'costituzione',
    maxLevel: 10,
    description: '',
    requirements: [attr('costituzione', 12)],
  },
  {
    key: 'resistenza_veleni',
    name: 'Resistenza Veleni',
    attribute: 'costituzione',
    maxLevel: 10,
    description: '',
    requirements: [skill('conoscere_veleni', 1)],
  },
  {
    key: 'resistenza_tortura',
    name: 'Resistenza alla tortura',
    attribute: 'costituzione',
    maxLevel: 10,
    description: '',
    requirements: [attr('freddezza', 10), attr('costituzione', 10)],
  },
  {
    key: 'resistenza_fisica',
    name: 'Resistenza Fisica',
    attribute: 'costituzione',
    maxLevel: 10,
    description:
      'Capacità di resistere al danno. Da 1 a 3, 10% punti ferita sotto prima di morire - da 4 a 6, 20% - da 7 a 9, 30% - a 10, 50%. Il giocatore comunica il numero al Master.',
    requirements: [attr('costituzione', 12)],
  },
  {
    key: 'stordire',
    name: 'Stordire',
    attribute: 'costituzione',
    maxLevel: 10,
    description:
      'Mettere in una condizione di confuso turbamento, privando della capacità di agire o reagire; rintontire, rintronare.',
    requirements: [skill('anatomia', 1)],
  },
  {
    key: 'armature_pesanti',
    name: 'Indossare Armature Pesanti',
    attribute: 'costituzione',
    maxLevel: 10,
    description: '',
    requirements: [{ type: 'note', text: 'Costituzione 13, altrimenti malus del 40% sulla lentezza dei movimenti' }],
  },

  // ----------------------------------------------------------- Intelligenza
  { key: 'anatomia', name: 'Anatomia', attribute: 'intelligenza', maxLevel: 10, description: 'Conoscenza del corpo a livello Medico.', requirements: [] },
  {
    key: 'avverti_presenza',
    name: 'Avverti presenza',
    attribute: 'intelligenza',
    maxLevel: 10,
    description:
      'Non sente morti perchè cerca le menti. Sente i fantasmi. se il mago è potente non la senti perchè si occulta. Avverti presenza si usa anche al contrario occultando la propria presenza',
    requirements: [],
  },
  {
    key: 'botanica',
    name: 'Botanica',
    attribute: 'intelligenza',
    maxLevel: 10,
    description: 'Ramo delle scienze naturali che studia la morfologia, la fisiologia e la sistematica degli organismi vegetali.',
    requirements: [],
  },
  { key: 'cartografia_geografia', name: 'Cartografia/Geografia', attribute: 'intelligenza', maxLevel: 10, description: 'Conoscenza dei luoghi', requirements: [] },
  {
    key: 'chirurgia',
    name: 'Chirurgia',
    attribute: 'intelligenza',
    maxLevel: 10,
    description: 'Conoscenza del corpo e eventuale intervento Chirurgico',
    requirements: [skill('anatomia', 5)],
  },
  { key: 'conoscenza_bestiario', name: 'Conoscenza Bestiario', attribute: 'intelligenza', maxLevel: 10, description: 'Conoscenza Bestiario', requirements: [] },
  { key: 'conoscenza_razze', name: 'Conoscenza delle razze', attribute: 'intelligenza', maxLevel: 10, description: 'Conoscenza delle razze', requirements: [] },
  { key: 'conoscenza_non_morti', name: 'Conoscenza Non Morti', attribute: 'intelligenza', maxLevel: 10, description: 'Conoscenza Non Morti', requirements: [] },
  { key: 'conoscere_veleni', name: 'Conoscere veleni', attribute: 'intelligenza', maxLevel: 10, description: 'Veleni Droghe allucinogeni', requirements: [] },
  {
    key: 'consapevolezza',
    name: 'Consapevolezza Individuare',
    attribute: 'intelligenza',
    maxLevel: 10,
    description: 'Sente pure i morti ma è quello che vedi e non se qualcuno sta nascoto per bene',
    requirements: [],
  },
  { key: 'demonologia', name: 'Demonologia', attribute: 'intelligenza', maxLevel: 10, description: 'Lo studio e la conoscenza dei Demoni', requirements: [] },
  { key: 'conoscenza_malattie', name: 'Conoscenza Malattie', attribute: 'intelligenza', maxLevel: 10, description: '', requirements: [skill('anatomia', 2)] },
  {
    key: 'erboristeria',
    name: 'Erboristeria',
    attribute: 'intelligenza',
    maxLevel: 10,
    description:
      'Conoscenze delle piante, dai loro effetti alla loro lavorazione, alle aree geografiche in cui trovarne. Utilizzabile anche per riconoscere preparati erboristici, è la capacità base per produrre pozioni e veleni.',
    requirements: [],
  },
  {
    key: 'esplosivi',
    name: 'Saper fare Esplosivi e conoscerli',
    attribute: 'intelligenza',
    maxLevel: 10,
    description:
      'Preparati chimici instabili che mossi in un certo modo esplodono. Più porti in alto il livello più sapraio fare tu esplosivi.',
    requirements: [attr('intelligenza', 15), attr('abilita', 15)],
  },
  {
    key: 'memoria',
    name: 'Memoria',
    attribute: 'intelligenza',
    maxLevel: 10,
    description: 'La capacità di ricordare nomi, luoghi, avvenimenti ecc..',
    requirements: [attr('intelligenza', 16)],
  },
  { key: 'linguaggio_comune', name: 'Linguaggio comune', attribute: 'intelligenza', maxLevel: 4, description: 'Linguaggio comune', requirements: [] },
  {
    key: 'lingue',
    name: 'Lingue',
    attribute: 'intelligenza',
    maxLevel: 10,
    description:
      'Ogni lingua ha una sua capacità, si deve scegliere la lingua e di conseguenza prendere la capacità. Esempio: Elfico antico, Demoniaco ecc...',
    requirements: [],
  },
  {
    key: 'nascondersi',
    name: 'Nascondersi',
    attribute: 'intelligenza',
    maxLevel: 10,
    description: 'Tenere celato qlcu. o qlco., in modo che non sia visto o trovato',
    requirements: [skill('furtivita', 1)],
  },
  {
    key: 'nascondi_presenza',
    name: 'Nascondi presenza',
    attribute: 'intelligenza',
    maxLevel: 10,
    description: '(contrario - vedi avverti presenza)',
    requirements: [skill('avverti_presenza', 4), attr('intelligenza', 13)],
  },
  {
    key: 'pedinare_intelligenza',
    name: 'Pedinare (Intelligenza)',
    attribute: 'intelligenza',
    maxLevel: 10,
    description:
      'Seguire qualcuno passo passo, a una certa distanza e con circospezione, per controllarne movimenti e comportamenti.',
    requirements: [skill('muoversi_silenziosamente', 1)],
  },
  {
    key: 'pensiero_magico',
    name: 'Pensiero magico',
    attribute: 'intelligenza',
    maxLevel: 1,
    description: "Casta gli incantesimi senza l'ausilio della parola",
    requirements: [],
  },
  {
    key: 'percezione_magica',
    name: 'Percezione magica',
    attribute: 'intelligenza',
    maxLevel: 10,
    description:
      "Vede le scuole di magia dei nemici - Riesce ad intravedere l'aura magica che delimita il mago, ogni scuola di magia è identificata da 1 colore",
    requirements: [],
  },
  {
    key: 'percezione_sacra',
    name: 'Percezione sacra',
    attribute: 'intelligenza',
    maxLevel: 10,
    description: 'Vede a che Dio è devoto il sacerdote. Se non si conosce il Dio non si riesce a vedere',
    requirements: [],
  },
  { key: 'storia', name: 'Storia', attribute: 'intelligenza', maxLevel: 10, description: 'Storia', requirements: [] },
  {
    key: 'teologia',
    name: 'Teologia',
    attribute: 'intelligenza',
    maxLevel: 10,
    description: 'Conoscenza del sacro, dei simboli della storia della religione',
    requirements: [],
  },
  {
    key: 'studio',
    name: 'Studio',
    attribute: 'intelligenza',
    maxLevel: 4,
    description:
      "Applicazione volta all'apprendimento di una o più discipline mentali. Aumenta l'intensità dell'apprendimento senza aumentare le ore. Deve insegnartelo qualcuno.",
    requirements: [],
  },
  {
    key: 'valutare_ferite',
    name: 'Valutare ferite',
    attribute: 'intelligenza',
    maxLevel: 10,
    description:
      'Oltre che le ferite si capisce anche quanto ci vuole per uccidere qualcuno o quanto manca alla sua morte',
    requirements: [skill('anatomia', 2)],
  },
  {
    key: 'verbo_magico',
    name: 'Verbo Magico',
    attribute: 'intelligenza',
    maxLevel: 1,
    description: 'Non gesticoli mentre lanci incantesimo',
    requirements: [skill('pensiero_magico', 1)],
  },
  {
    key: 'conoscenza_armi_armature',
    name: 'Conoscenza Armi / Armature',
    attribute: 'intelligenza',
    maxLevel: 10,
    description: '',
    requirements: [attr('intelligenza', 13)],
  },
  { key: 'conoscenza_rune', name: 'Conoscenza Rune', attribute: 'intelligenza', maxLevel: 10, description: '', requirements: [attr('intelligenza', 13)] },
  {
    key: 'resilienza',
    name: 'Resilienza',
    attribute: 'intelligenza',
    maxLevel: 4,
    description:
      "Aumenta l'intensità dell'apprendimento di discipline fisiche o mentali senza aumentare le ore. Si sblocca quando Concentrazione + Resistenza alla Fatica = 8.",
    requirements: [],
  },

  // --------------------------------------------------------------- Riflessi
  {
    key: 'contrattacco',
    name: 'Contrattacco',
    attribute: 'riflessi',
    maxLevel: 10,
    description:
      'Reazione a un attacco nemico. Spesso usato nel corpo a corpo. Massimo di attacchi nel contrattacco: uno per mano.',
    requirements: [skill('ambidestro', 3)],
  },
  {
    key: 'lottare',
    name: 'Lottare',
    attribute: 'riflessi',
    maxLevel: 10,
    description: "Uso di oggetti dell'ambiente come arma. Non è solo lottare a mani nude.",
    requirements: [],
  },
  {
    key: 'borseggiare',
    name: 'Borseggiare',
    attribute: 'riflessi',
    maxLevel: 10,
    description: 'Derubare qualcuno con destrezza, sottraendogli ciò che ha in borsa o nelle tasche.',
    requirements: [skill('muoversi_silenziosamente', 3)],
  },
  {
    key: 'schivare',
    name: 'Schivare',
    attribute: 'riflessi',
    maxLevel: 10,
    description: 'Evitare un ostacolo materiale, un colpo, un urto con un brusco scarto o un rapido spostamento.',
    requirements: [attr('riflessi', 10)],
  },
  {
    key: 'lancio_rapido',
    name: 'Lancio rapido',
    attribute: 'riflessi',
    maxLevel: 10,
    description:
      'Diminuisce il tempo di lancio degli incantesimi: −30% + 5% per ogni livello in più. Il costo aumenta della stessa percentuale.',
    requirements: [],
  },
  {
    key: 'agilita',
    name: 'Agilità',
    attribute: 'riflessi',
    maxLevel: 10,
    description: "Salto, lancio, getto, scatto e reazione. L'insieme delle capacità di un corpo Atletico e allenato.",
    requirements: [attr('riflessi', 13)],
  },
  {
    key: 'destrezza',
    name: 'Destrezza',
    attribute: 'riflessi',
    maxLevel: 4,
    description:
      "Aumenta l'intensità dell'apprendimento di discipline fisiche senza aumentare le ore. Si sblocca quando livello + Costituzione + Abilità = 30.",
    requirements: [],
  },
  {
    key: 'resistenza_fatica',
    name: 'Resistenza alla Fatica',
    attribute: 'riflessi',
    maxLevel: 4,
    description:
      "Fa durare più ore l'allenamento delle discipline fisiche. Si sblocca quando livello + Costituzione + Abilità = 30.",
    requirements: [],
  },

  // -------------------------------------------------------------- Freddezza
  {
    key: 'torturare',
    name: 'Torturare',
    attribute: 'freddezza',
    maxLevel: 10,
    description:
      "L'essere bravo a mantenere in vita una persona facendogli male. Quindi quanto sei bravo a non farlo morire ma fargli male.",
    requirements: [attr('freddezza', 10)],
  },
  {
    key: 'concentrazione',
    name: 'Concentrazione',
    attribute: 'freddezza',
    maxLevel: 4,
    description:
      'Serve per i maghi e i sacerdoti per continuare a evocare o lanciare incantesimi se vengono attaccati. Fa durare più ore l’allenamento delle discipline mentali.',
    requirements: [attr('freddezza', 12)],
  },
  {
    key: 'meditazione',
    name: 'Meditazione',
    attribute: 'freddezza',
    maxLevel: 4,
    description:
      'Serve a prendere punti mana senza dormire. A livello 1 ci metti 4 ore, scala 1 ora a livello: a livello 4 ci mette 1 ora a recuperare.',
    requirements: [attr('freddezza', 12)],
  },
  {
    key: 'liberarsi',
    name: 'Liberarsi',
    attribute: 'freddezza',
    maxLevel: 4,
    description: 'Acquistare libertà, sottrarsi, sciogliersi, disimpegnarsi da catene, corde ecc..',
    requirements: [attr('freddezza', 12), attr('abilita', 12)],
  },
  {
    key: 'mira',
    name: 'Mira',
    attribute: 'freddezza',
    maxLevel: 10,
    description: "La posizione corrispondente al colpo efficace nel puntamento di un'arma",
    requirements: [attr('freddezza', 12)],
  },
  {
    key: 'pronto_soccorso',
    name: 'Pronto soccorso',
    attribute: 'freddezza',
    maxLevel: 10,
    description: 'La sveltezza e la risolutezza nell’intervenire per aiutare un ferito',
    requirements: [skill('anatomia', 1), attr('freddezza', 12)],
  },

  // ---------------------------------------------------------------- Fascino
  {
    key: 'carisma',
    name: 'Carisma',
    attribute: 'fascino',
    maxLevel: 10,
    description: 'Capacità di esercitare una forte influenza su altre persone',
    requirements: [attr('fascino', 12)],
  },
  {
    key: 'oratoria',
    name: 'Oratoria',
    attribute: 'fascino',
    maxLevel: 10,
    description: "L'arte del parlare rivolgendosi a un pubblico su argomenti d'interesse",
    requirements: [attr('intelligenza', 13)],
  },
  {
    key: 'mondanita',
    name: 'Mondanità',
    attribute: 'fascino',
    maxLevel: 10,
    description: 'Maniera di vivere frivola e brillante, tipica delle classi più agiate, e tutto quanto le si riferisce',
    requirements: [],
  },
  {
    key: 'comandare',
    name: 'Comandare',
    attribute: 'fascino',
    maxLevel: 10,
    description: 'Posizione di preminenza con funzione di guida in uno schieramento culturale, o in una attività o in un gruppo.',
    requirements: [attr('fascino', 15), skill('carisma', 1)],
  },
  {
    key: 'recitare',
    name: 'Recitare / Mentire / Ingannare / Persuadere',
    attribute: 'fascino',
    maxLevel: 10,
    description: 'Dire deliberatamente il falso, alterare o falsificare consapevolmente la verità',
    requirements: [attr('freddezza', 13)],
  },
  {
    key: 'sedurre',
    name: 'Sedurre',
    attribute: 'fascino',
    maxLevel: 10,
    description: 'Avvincere in modo irresistibile, affascinare, allettare',
    requirements: [attr('fascino', 12)],
  },
  {
    key: 'diplomazia',
    name: 'Diplomazia',
    attribute: 'fascino',
    maxLevel: 10,
    description:
      'Tatto, finezza, abilità nel trattare questioni delicate o nel mantenere rapporti con persone suscettibili.',
    requirements: [attr('fascino', 10)],
  },
  {
    key: 'falsificare',
    name: 'Falsificare',
    attribute: 'fascino',
    maxLevel: 10,
    description: 'Manipolare a danno della verità, travisare.',
    requirements: [attr('abilita', 12)],
  },
  {
    key: 'addestramento_animali',
    name: 'Addestramento animali',
    attribute: 'fascino',
    maxLevel: 10,
    description:
      "Si riferisce all'acquisizione di conoscenze, abilità e capacità come risultato di un insegnamento o della pratica ad una certa disciplina.",
    requirements: [],
  },
  {
    key: 'galateo',
    name: 'Galateo e etichetta',
    attribute: 'fascino',
    maxLevel: 10,
    description: "L'insieme di norme comportamentali con cui si identifica la buona educazione.",
    requirements: [],
  },
  {
    key: 'travestimento',
    name: 'Travestimento',
    attribute: 'fascino',
    maxLevel: 10,
    description:
      'Abbigliamento speciale, completato da un particolare trucco e talvolta dall’aggiunta di elementi posticci, allo scopo di rendersi irriconoscibile.',
    requirements: [],
  },
  { key: 'interrogare', name: 'Interrogare', attribute: 'fascino', maxLevel: 10, description: '', requirements: [attr('intelligenza', 10)] },
]

const SKILL_INDEX = new Map(SKILLS.map((s) => [s.key, s]))

export function findSkill(key: string | null | undefined): SkillDefinition | undefined {
  return key ? SKILL_INDEX.get(key) : undefined
}
