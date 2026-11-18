-- Cataloghi del manuale nel database (docs/02 §1). Testi identici a "Xerioth manuale"; dubbi in docs/07.
-- Si scrivono solo con le migrazioni: per l'app sono in sola lettura.

create type public.class_kind as enum ('class', 'career');

create table public.race_families (
  key text primary key,
  name text not null,
  intro text not null default '',
  sort_order int not null default 0
);

create table public.races (
  key text primary key,
  name text not null,
  family_key text not null references public.race_families (key),
  hp_coefficient int check (hp_coefficient > 0),
  appearance text not null default '',
  size_lifespan text not null default '',
  typical_alignment text not null default '',
  society text not null default '',
  traits text not null default '',
  sort_order int not null default 0
);
create index races_family_key_idx on public.races (family_key);

create table public.classes (
  key text primary key,
  name text not null,
  kind public.class_kind not null,
  motto text not null default '',
  summary text not null default '',
  sections jsonb not null default '[]'::jsonb check (jsonb_typeof(sections) = 'array'),
  resource_key text check (resource_key in ('spirito', 'mana', 'mente', 'anima')),
  power_kind public.power_kind,
  power_label text,
  power_singular text,
  power_attribute public.attribute_key,
  requires_deity boolean not null default false,
  requires_element boolean not null default false,
  sort_order int not null default 0,
  constraint classes_power_complete check (
    (power_kind is null and power_label is null and power_singular is null and power_attribute is null)
    or (power_kind is not null and power_label is not null and power_singular is not null and power_attribute is not null)
  ),
  constraint classes_career_plain check (kind = 'class' or (power_kind is null and resource_key is null and not requires_deity and not requires_element))
);

create table public.deities (
  key text primary key,
  name text not null,
  motto text not null default '',
  domain text not null default '',
  lore text not null default '',
  divine_weapon text not null default '',
  outsiders text not null default '',
  miracle_examples text not null default '',
  sort_order int not null default 0
);

create table public.elements (
  key text primary key,
  name text not null,
  nature text not null default '',
  spell_examples text not null default '',
  creatures text not null default '',
  opposite_key text references public.elements (key),
  deity_key text references public.deities (key),
  sort_order int not null default 0
);
create index elements_opposite_key_idx on public.elements (opposite_key);
create index elements_deity_key_idx on public.elements (deity_key);

create table public.alignments (
  key text primary key,
  code text not null unique,
  name text not null,
  archetype text not null default '',
  description text not null default '',
  example text not null default '',
  sort_order int not null default 0
);

create table public.skills (
  key text primary key,
  name text not null,
  attribute public.attribute_key not null,
  max_level int not null check (max_level between 0 and 20),
  description text not null default '',
  requirements jsonb not null default '[]'::jsonb check (jsonb_typeof(requirements) = 'array'),
  sort_order int not null default 0
);

create table public.weapons (
  key text primary key,
  name text not null,
  category text not null default '',
  skill_key text references public.skills (key),
  requirement text not null default '',
  note text not null default '',
  sort_order int not null default 0
);
create index weapons_skill_key_idx on public.weapons (skill_key);

create table public.armors (
  key text primary key,
  name text not null,
  armor_type text not null default '',
  description text not null default '',
  requirement text not null default '',
  note text not null default '',
  sort_order int not null default 0
);

-- Permessi: lettura per chi ha fatto l'accesso, nessuna scrittura dall'app.
alter table public.race_families enable row level security;
create policy "race_families_select" on public.race_families for select to authenticated using (true);
revoke insert, update, delete, truncate on public.race_families from anon, authenticated;
alter table public.races enable row level security;
create policy "races_select" on public.races for select to authenticated using (true);
revoke insert, update, delete, truncate on public.races from anon, authenticated;
alter table public.classes enable row level security;
create policy "classes_select" on public.classes for select to authenticated using (true);
revoke insert, update, delete, truncate on public.classes from anon, authenticated;
alter table public.deities enable row level security;
create policy "deities_select" on public.deities for select to authenticated using (true);
revoke insert, update, delete, truncate on public.deities from anon, authenticated;
alter table public.elements enable row level security;
create policy "elements_select" on public.elements for select to authenticated using (true);
revoke insert, update, delete, truncate on public.elements from anon, authenticated;
alter table public.alignments enable row level security;
create policy "alignments_select" on public.alignments for select to authenticated using (true);
revoke insert, update, delete, truncate on public.alignments from anon, authenticated;
alter table public.skills enable row level security;
create policy "skills_select" on public.skills for select to authenticated using (true);
revoke insert, update, delete, truncate on public.skills from anon, authenticated;
alter table public.weapons enable row level security;
create policy "weapons_select" on public.weapons for select to authenticated using (true);
revoke insert, update, delete, truncate on public.weapons from anon, authenticated;
alter table public.armors enable row level security;
create policy "armors_select" on public.armors for select to authenticated using (true);
revoke insert, update, delete, truncate on public.armors from anon, authenticated;

-- Dati
insert into public.race_families (key, name, intro, sort_order) values
  ('umani', 'Umani', '', 0),
  ('elfi', 'Elfi', 'Tutti gli elfi sono leggeri, flessuosi e longilinei, con grazia nei movimenti e un''agilità superiore alle altre creature.', 1),
  ('altre', 'Altre razze', '', 2),
  ('ibride', 'Razze ibride', '', 3);
insert into public.races (key, family_key, name, hp_coefficient, appearance, size_lifespan, typical_alignment, society, traits, sort_order) values
  ('umano', 'umani', 'Umano', 7, 'Pelle dal quasi nero al rosa pallido; capelli dal nero al biondo chiaro, bianchi negli anziani. Barba di ogni tipo, assente nelle femmine.', 'Taglia media. 150–180+ cm, 55–110+ kg. Maturità a 20 anni, vita media 70, può superare i 100.', 'Nessuno in particolare', 'Insediamenti di ogni dimensione, spesso riuniti in regni e stati. Neutrali verso le altre razze, più tolleranti con i mezzelfi.', 'Comune più una lingua a scelta. Imparano facilmente le lingue altrui e le mescolano nei discorsi.', 0),
  ('elfo_grigio', 'elfi', 'Elfo grigio', 6, 'Pelle rosata, orecchie leggermente a punta, tratti delicati, corporatura snella.', 'Da meno di 1,5 a oltre 1,8 m. Adulti (e nome da adulto) intorno ai 100 anni, vivono fino a 750.', 'Neutrale Puro', 'Il più comune degli elfi.', '', 1),
  ('elfo_bianco', 'elfi', 'Elfo bianco', 6, 'Pelle diafana, capelli chiari.', '', 'Neutrale Buono', 'Vivono nella foresta di Tanden sotto un loro sovrano. Non escono mai dalla foresta e non si mischiano con altre razze.', 'La razza più antica del pianeta insieme agli Elfi neri, creata da Zeria.', 2),
  ('elfo_nero', 'elfi', 'Elfo nero', 6, 'Pelle grigia, capelli scuri.', '', 'Legale Malvagio', 'Vivono nella foresta di Valenwood sotto un loro sovrano. Non escono mai dalla foresta e non si mischiano con altre razze.', 'La razza più antica del pianeta insieme agli Elfi bianchi, creata da Zeria.', 3),
  ('elfo_oscuro', 'elfi', 'Elfo oscuro', 6, 'Pelle leggermente violacea, capelli scuri.', '', 'Caotico Malvagio', 'Detti i reietti: solitari, si avvistano quasi per sbaglio. Il nome viene dalla loro fama.', '', 4),
  ('elfo_dei_deserti', 'elfi', 'Elfo dei deserti', 6, 'Pelle dorata, dal pallido crepuscolare al marrone caramello. Capelli dal marrone scuro al giallo chiaro, raramente neri o platino. Occhi gialli, marroni o nocciola, lineamenti spigolosi.', '', 'Neutrale', 'Pochi e visti di rado. Si dice siano nati dai granelli del tempo.', 'Superano automaticamente le prove di Costituzione contro l''esaurimento da calore e ignorano i terreni difficili di sabbia. La loro trance li aiuta nelle lunghe distanze.', 5),
  ('elfo_marino', 'elfi', 'Elfo marino', 6, 'Pelle leggermente bluastra.', '', '', 'Elfi dalla pelle leggermente bluastra, molto meno numerosi degli Elfi grigi. Leggeri, flessuosi e longilinei, sono dotati di grazia e di un''agilità superiore alle altre creature. Le loro nazioni sottomarine sono antiche e potenti quanto quelle dei cugini di terra: abitano le parti meno profonde dell''oceano, di solito entro poche miglia dalla costa, perché le acque più profonde sono troppo fredde e buie per i loro gusti. Sono divisi in sette dinastie, guidate dai Sette Re Fratelli Eldorin. Hanno un profondo rispetto per le creature marine, che considerano parte di Xenea come loro, e sono eccellenti lavoratori del vetro.', '', 6),
  ('nano', 'altre', 'Nano', 8, 'Lunghe barbe curatissime.', 'Spesso non supera 1,5 m.', '', 'Lavoratori instancabili della pietra e del ferro, stimati guerrieri e artigiani. Spesso Guerrieri o Sacerdoti.', 'Detestano orchi e orchetti.', 7),
  ('halfling', 'altre', 'Halfling', 6, 'Come umani in proporzioni ridotte; orecchie leggermente a punta, glabri. La barba indica sangue misto umano.', 'Mai oltre 1 m, circa 30 kg.', '', 'Discreti guerrieri, coraggiosi se motivati ma prudenti: non rischiano più del necessario.', 'Resistenza alla magia simile a quella dei nani.', 8),
  ('minotauro', 'altre', 'Minotauro', 9, 'Torso possente, testa di toro. Corna da 30 cm a tre volte tanto, spesso ornate o rivestite di metallo.', '', '', 'Società fondata su onore e forza. Feroci predoni e marinai tra i più abili del mondo. Credono di essere destinati a dominare il mondo; addestrati alle armi fin da piccoli.', 'A loro agio in terra e in mare. Tengono a forza, astuzia e intelletto.', 9),
  ('orco', 'altre', 'Orco', 9, '', '', '', 'Tribù con un capo e guardie; più tribù formano un clan, con un simbolo che ogni membro porta addosso. Si alleano facilmente davanti a una minaccia comune.', 'Astuti, forza eccezionale, buon rapporto con la magia. Amano gli oggetti belli e di valore.', 10),
  ('troll', 'altre', 'Troll', 9, 'Gobbi, brutti, artigli affilati.', 'Circa 4 m, 500 kg.', '', 'Maschi solitari; le femmine crescono i piccoli in gruppo con grande tenerezza. Devono mangiare enormemente e difendono un territorio di caccia.', 'Rigenerano quasi ogni ferita. Solo il fuoco li fa esitare. Dagli arti più grandi può rinascere un troll completo: vanno bruciati.', 11),
  ('icaro', 'altre', 'Icaro', null, 'Albini di pelle e peli, ali totalmente nere sulla schiena, corporatura media.', 'Vita media 50 anni (metabolismo velocissimo).', '', 'Razza molto rara. Vivono in gruppi civilizzati, piccoli o grandi, e hanno una loro lingua.', 'Volano grazie alle ossa cave; ali potenti usate anche come armi. Appetito enorme senza ingrassare.', 12),
  ('vampiro', 'altre', 'Vampiro di Morgoroth', 7, '', '', '', 'Due tipi: necromantici (evocati, senza intelletto ai livelli bassi) e figli di Morgoroth (intelletto e personalità, caste da 1 a 5). Clan Strigoi e Talamur, legati dal codice d''onore Sayoga.', 'Il Sayoga vieta di unirsi con altre creature: ne nascerebbe un Dampyr, il cui tocco è spesso mortale per i vampiri.', 13),
  ('goblin', 'altre', 'Goblin', 7, '', '', '', '', '', 14),
  ('satiro', 'altre', 'Satiro', 6, '', '', '', '', '', 15),
  ('mezzelfo', 'ibride', 'Mezzelfo', null, 'Caratteristiche varie.', '', '', 'Nati dall''unione di umani ed elfi. Cercano sempre di essere accettati da tutti.', '', 16),
  ('mezzorco', 'ibride', 'Mezzorco', null, 'Pelle grigio-verde, fronte alta e sfuggente, mascella prominente, canini inferiori sporgenti, folta peluria.', 'Alto come un umano ma più pesante. Vita media 75 anni.', 'Tende al male', 'Testardo, irascibile, rozzo, spesso violento. Vive tra le tribù di orchi o tra umani che lo accettano. Antipatia per elfi e mezzelfi, odio per nani e gnomi.', 'Scurovisione. Parla Orchesco e Comune.', 17),
  ('tiefling', 'ibride', 'Tiefling', 6, '', '', '', 'Nati in un laboratorio necromantico dalla fusione di demoni e umani.', '', 18),
  ('leodon', 'ibride', 'Leodon', 8, '', '', '', 'Nati in un laboratorio necromantico dalla fusione di leoni e umani, creati per l''esercito di un necromante. Il nome significa "uomo-leone".', '', 19);
insert into public.deities (key, name, motto, domain, lore, divine_weapon, outsiders, miracle_examples, sort_order) values
  ('xenea', 'Xenea', 'Ciò che cresce, Xenea custodisce', 'Dea della terra e della natura vegetale e animale.', 'Figlia di Enion. È la dea da cui discendono i Druidi, eletti di Xenea fin dalla nascita.', 'Mantello di Xenea: crea flora e fauna, le cura e può cambiare l''allineamento di una creatura. Comanda i suoi esterni.', 'Ciclope, Driade, Ent, Ninfa, Satiro / Fauno, Guardiano, Wurm.', 'Affinità animale
Corteccia epidermica', 0),
  ('vex', 'Vex', 'Finché c''è vita, c''è Vex', 'Dea della vita e della prosperità.', 'Creatrice di vita, figlia di Simrael: dopo la sua nascita le donne di tutte le razze iniziarono a partorire. Modella la carne dei defunti per creare nuovi corpi e vi infonde il suo soffio di vita.', 'Diadema di Vex, detto Corona della Vita: infonde vita in corpi inanimati, ma non può infondere un''anima. Dona l''immortalità a chi lo indossa. Comanda i suoi esterni.', 'Grifone, Ippogrifo, Pegaso. Sua figlia è Niamara, la Plasmatrice.', 'Blocca non morto
Guarigione', 1),
  ('morgoroth', 'Morgoroth', 'Ogni respiro è un debito con la morte', 'Dio della morte.', 'Figlio di Tarooth, creato alla morte del primo umano. Impasta la carne dei defunti per creare lich, segugi infernali, demoni e vampiri.', 'Frusta di Morgoroth, detta Distruttrice: mantiene i morti nella loro dimensione. Su un non morto lo uccide all''istante, esiliandolo nel regno dei morti. Comanda i suoi esterni.', 'Vampiri di Morgoroth, Lich, Segugio Infernale, Custode Infernale, Mastino della Morte, Dryder / Aracne.', 'Avvizzimento
Parlare con i morti', 2),
  ('tarooth', 'Tarooth', 'Il tempo non dimentica', 'Dio del tempo e dello spazio.', 'Fratello di Zeria e Simrael, padre di Morgoroth.', 'Clessidra di Tarooth, detta Tessitrice: ogni granello regola il tempo in uno spazio. Un granello rotto riporta il tempo indietro di 24 ore; girata sottosopra fa scorrere il tempo al contrario, distruggendo tutte le creature; se si rompe, tutto decade e scompare. Comanda i suoi esterni.', 'Chimera, Leone Nero, Manticora, Sfinge.', 'Ferma tempo
Stasi corporale', 3),
  ('ydelx', 'Ydelx', 'La vittoria si sceglie prima della battaglia', 'Dea Madre della guerra e della strategia.', 'Creata da Zeria dopo la nascita di Xudux Nero, quando gli umani iniziarono le guerre.', 'Uno scudo che infonde coraggio e altre sensazioni.', 'Colosso, Lamia, Medusa.', 'Armatura benedetta
Barriera di lame', 4),
  ('xudux_nero', 'Xudux Nero', 'Ogni anima ha un prezzo', 'Dio del male e delle anime.', 'Il contenitore dei mali dell''anima. Nell''antichità era venerato insieme a Xudux Bianco come un''unica entità, il Bifronte, dio delle anime e dell''equilibrio. I nomi dei suoi figli finiscono in -el.', 'Kalya, condivisa con Xudux Bianco: cambia forma in base all''anima di chi la porta. Puntata contro un nemico, rende chi la brandisce dello stesso grado del nemico. È l''unica arma divina bandita da Zeria per la sua pericolosità.', 'Banshee, Ghoul, Succube, Incubo.', 'Cambia allineamento
Follia', 5),
  ('xudux_bianco', 'Xudux Bianco', 'Ogni anima merita la luce', 'Dio del bene e delle anime.', 'Il contenitore delle virtù dell''anima. Nell''antichità era venerato insieme a Xudux Nero come un''unica entità, il Bifronte, dio delle anime e dell''equilibrio. I nomi dei suoi figli iniziano con El.', 'Kalya, condivisa con Xudux Nero: cambia forma in base all''anima di chi la porta. Puntata contro un nemico, rende chi la brandisce dello stesso grado del nemico. È l''unica arma divina bandita da Zeria per la sua pericolosità.', 'Unicorno, Fenice. Per sconfiggere un Incubo servono molti sacerdoti di Xudux Bianco.', 'Allevia dolore
Fortuna', 6),
  ('zeria', 'Zeria', 'Dalla magia nasce il creato', 'Dio della magia e del creato.', 'La divinità creatrice, dio degli dei, della Creazione e della Magia Pura. Fratello di Tarooth e Simrael.', 'Frusta di Zeria, detta Mano di Dio: scomunica definitivamente qualsiasi sacerdote o esterno dal suo dio. Comanda i suoi esterni.', 'Drago (tutti i dragonidi sono figli di Zeria), Beholder, Naga, Viverna.', 'Blocca incantesimo
Fondi incantesimo', 7),
  ('simrael', 'Simrael', 'Plasmo la carne, abito la mente', 'Dio delle razze e della mente.', 'Fratello di Zeria e Tarooth. Bandito per le sue azioni.', '', 'Arpia, Varshak, Licantropo', 'Menomazione
Metamorfosi', 8),
  ('ayla', 'Ayla', '', 'Aria', '', '', '', '', 9),
  ('rya', 'Rya', '', 'Acqua', '', '', '', '', 10),
  ('droy', 'Droy', '', 'Fuoco', '', '', '', '', 11),
  ('enion', 'Enion', '', 'Terra', '', '', '', '', 12);
insert into public.elements (key, name, nature, spell_examples, creatures, opposite_key, deity_key, sort_order) values
  ('aria', 'Aria', 'Vento, fulmini, levitazione e invisibilità. È l''elemento della rapidità e del movimento; alla sua scuola appartiene anche il controllo della gravità.', 'Evoca fulmine
Aumentare la gravità', 'Elementale dell''Aria (rapido, volante, primitivo e territoriale)
Genio dell''Aria', 'terra', 'ayla', 0),
  ('acqua', 'Acqua', 'Elemento della pazienza e dell''inflessibilità. Governa l''acqua in tutte le sue forme, dal movimento sulle onde al ghiaccio.', 'Camminare nell''acqua
Dardo di ghiaccio', 'Elementale dell''Acqua (paziente e inflessibile, aspetto unico per ognuno)
Ondine / Nereidi
Sirene
Genio dell''Acqua', 'fuoco', 'rya', 1),
  ('fuoco', 'Fuoco', 'Elemento della velocità e della ferocia. Governa fiamme e calore. Gli elementali del fuoco non possono entrare nell''acqua.', 'Controlla temperatura
palla di fuoco', 'Elementale del Fuoco (veloce e crudele)
Genio del Fuoco', 'acqua', 'droy', 2),
  ('terra', 'Terra', 'Elemento della solidità e dell''ostinazione. Governa pietra e suolo, e la protezione del corpo. È la via più diffusa.', 'Fondersi con la terra
Armatura coriacea', 'Elementale della Terra (lento e ostinato)
Golem
Genio della Terra', 'aria', 'enion', 3),
  ('puro', 'Puro', 'Padroneggia tutti e quattro gli elementi: aria, acqua, fuoco e terra.', 'Incantesimi di tutte e quattro le vie', 'Tutti gli elementi', null, null, 4);
insert into public.classes (key, name, kind, motto, summary, sections, resource_key, power_kind, power_label, power_singular, power_attribute, requires_deity, requires_element, sort_order) values
  ('alteratore', 'Alteratore', 'class', 'Niente è come sembra', 'L''Alteratore è un trasfiguratore: modifica ciò che è organico e inorganico, cambiandone stato e condizione. Può mutare il proprio aspetto o quello degli oggetti, e lavora con rune e trappole.', '[{"title":"Descrizione Generale","text":"L''Alterazione agisce sulla materia invece di crearla o evocarla. L''Alteratore prende qualcosa che esiste già, un corpo, un oggetto o una sostanza, e ne cambia le proprietà: forma, colore, odore, sapore, stato o condizione."},{"title":"Abilità e Poteri","text":"Alterazione del corpo: può manipolare il proprio aspetto e trasformare parti del proprio corpo, fino a mutare un arto in un''arma.\nAlterazione degli oggetti: cambia colore, odore e sapore di oggetti e sostanze, e ne modifica stato e condizione."},{"title":"Rune e trappole","text":"L''Alteratore lavora con le rune e con le trappole, legando i propri effetti a simboli e meccanismi che scattano anche quando lui non è presente."},{"title":"Ruolo nel Gioco","text":"Infiltrazione e inganno grazie al cambio d''aspetto, combattimento ravvicinato con gli arti trasformati in armi, controllo del terreno con rune e trappole."},{"title":"Capacità collegate","text":"Conoscenza Rune (Intelligenza 13)\nLeggere Rune e Creare Rune (Conoscenza Rune 5 + Intelligenza 15)\nCreare trappole (Abilità 13 + Intelligenza 12)"},{"title":"Esempi di incantesimi","text":"Altera colore, odore o sapore\nArto in arma"}]'::jsonb, 'mana', 'spell', 'Incantesimi', 'Incantesimo', 'intelligenza', false, false, 0),
  ('evocatore', 'Evocatore', 'class', 'Ogni mondo risponde a chi sa chiamare', 'L''evocatore è un maestro nelle arti che gestiscono le dimensioni. Conosce le creature extradimensionali e sa gestirle per ottenere aiuto.', '[{"title":"Descrizione Generale","text":"Sente la presenza degli esterni e riesce anche a bandirli. Gli evocatori sono estremamente rari, perché l''evocazione è sempre stata considerata un pericolo per l''equilibrio."},{"title":"Gli esterni","text":"Creature delle altre dimensioni, legate alle divinità e divise in caste. Il capogilda degli evocatori percepisce gli esterni entro un perimetro, con tipo e casta. Le divinità non si percepiscono, e gli esterni di casta da 3 a 1 si fanno percepire solo se lo vogliono."},{"title":"Esempi di incantesimi","text":"Invoca\nProtezione dagli esterni"}]'::jsonb, 'mana', 'spell', 'Incantesimi', 'Incantesimo', 'intelligenza', false, false, 1),
  ('elementalista', 'Elementalista', 'class', 'Quattro elementi, un''unica volontà', 'L''Elementalista incanala le forze naturali del suo elemento: aria, acqua, fuoco e terra. Può infliggere danni enormi con un singolo attacco e abbattere i nemici a distanza prima che diventino una minaccia, ma ciò che lo rende davvero temibile è la versatilità: sa adattarsi ai nuovi pericoli scegliendo l''elemento più adatto.', '[{"title":"Descrizione Generale","text":"Ogni Elementalista segue una delle quattro vie elementali e ne apprende gli incantesimi nella gilda corrispondente. Quando entra in armonia con il proprio elemento riceve bonus intrinseci che ne accrescono il potere. Gli Elementalisti Puri padroneggiano tutti e quattro gli elementi e hanno gilde proprie."},{"title":"Elementi opposti","text":"Terra ↔ Aria. Acqua ↔ Fuoco."}]'::jsonb, 'mana', 'spell', 'Incantesimi', 'Incantesimo', 'intelligenza', false, true, 2),
  ('necromante', 'Necromante', 'class', 'La morte è solo l''inizio', 'La Scuola di Necromanzia esplora le forze cosmiche della morte e della non morte. Il necromante studia questa tradizione per manipolare l''energia che anima tutto ciò che vive.', '[{"title":"Descrizione Generale","text":"Quando padroneggia la sua arte, il necromante impara a fiaccare l''energia vitale di una creatura, a distruggerne il corpo con la magia e a trasformare quell''energia vitale in altro potere magico da manipolare."},{"title":"Origine","text":"La Necromanzia nacque dal primo non morto della storia: un elfo oscuro maledetto dagli dei, privato del tempo, della magia, dell''anima e della vita. Rimasto senza magia, inventò la Necromanzia, l''arte dell''assenza di vita, di anima e di tempo, e fondò la prima gilda dei necromanti."},{"title":"Creature legate","text":"Vampiri necromantici: evocati dalla magia, privi di intelletto (ai livelli alti arrivano a un intelletto pari a quello umano).\nLich: maghi non morti che usano la magia nera, privi di anima.\nRazze nate da esperimenti necromantici: Tiefling, Leodon, Durrikan."},{"title":"Nemici","text":"Sacrdoti di Vex e di Morgoroth"},{"title":"Capacità collegate","text":"Conoscenza Non Morti"},{"title":"Esempi di incantesimi","text":"Animazione dei morti\nDolore"}]'::jsonb, 'mana', 'spell', 'Incantesimi', 'Incantesimo', 'intelligenza', false, false, 3),
  ('magia_pura', 'Magia Pura', 'class', 'Tutto è mana', 'L''arte della Magia Pura abbraccia tutto ciò che è dotato di mana: lo gestisce, lo manipola e lo altera a piacimento. Da qualcuno è stata definita "l''elementalista della magia", e l''appellativo le calza a pennello.', '[{"title":"Descrizione Generale","text":"Il mago di Magia Pura non lavora su un elemento o su una materia, ma sul mana stesso. Può gestire, manipolare e alterare qualsiasi cosa sia dotata di mana, compresi gli incantesimi degli altri."},{"title":"Il mana","text":"Energia di coesione della materia. Si manipola con la lingua Arcanti. Svanisce dai corpi morti. Esistono inibitori di mana: zone o oggetti che lo bloccano."},{"title":"Capacità collegate","text":"Crea oggetti magici (Intelligenza 18 + incantesimo Fondere incantesimi della Magia Pura)\nIdentificazione oggetti magici"},{"title":"Esempi di incantesimi","text":"Blocca incantesimo\nFondi incantesimo"}]'::jsonb, 'mana', 'spell', 'Incantesimi', 'Incantesimo', 'intelligenza', false, false, 4),
  ('mentalista', 'Mentalista', 'class', 'Ogni mente è una porta, io sono la chiave', 'Le arti psioniche sono la capacità di sfruttare il potenziale della mente.', '[{"title":"Descrizione Generale","text":"Il potere mentale è una capacità innata, che però può restare latente nella mente di molti individui ed essere sviluppata con una rigida disciplina mentale."},{"title":"Regola","text":"Le magie mentali sono spesso a scontro di livello."},{"title":"Capacità collegate","text":"Avverti presenza: cerca le menti, quindi non sente i morti ma sente i fantasmi. Un mago potente può occultarsi.\nNascondi presenza (Avverti presenza 4 + Intelligenza 13)"},{"title":"Esempi di incantesimi","text":"Controllo mentale\nDistruzione di un senso"}]'::jsonb, 'mente', 'mental', 'Poteri mentali', 'Potere mentale', 'intelligenza', false, false, 5),
  ('incantatore', 'Incantatore', 'class', 'Ciò che vedi è ciò che voglio io', 'L''Incantatore è una classe estremamente flessibile e strategica, in grado di influenzare il corso degli eventi con la sua capacità di manipolare le percezioni e la realtà. Che si tratti di evocare alleati magici, confondere i nemici con illusioni ingannevoli, o incantare oggetti per superare sfide, l''Incantatore è una risorsa preziosa in qualsiasi gruppo di avventurieri.', '[{"title":"Descrizione Generale","text":"Gli Incantatori sono una classe magica unica, specializzata nell''arte di manipolare e creare illusioni, evocare creature mistiche, e incantare oggetti o persone. A differenza di altre classi magiche che si focalizzano su specifici elementi o scuole di magia, gli Incantatori hanno una gamma più ampia di abilità che abbracciano diversi aspetti della magia, pur mantenendo un focus sulla manipolazione delle percezioni e della realtà."},{"title":"Abilità e Poteri","text":"Evocazione di Creature: Gli Incantatori possono evocare creature mistiche come destrieri magici per supportare loro stessi e i loro compagni. Queste creature possono essere utilizzate per vari scopi, come trasporto, combattimento, o esplorazione.\n\nIllusione: Una delle capacità distintive degli Incantatori è la creazione di illusioni. Queste illusioni possono essere usate per ingannare nemici, nascondere la presenza del gruppo, o creare diversivi tattici. L''abilità di manipolare le percezioni altrui rende l''Incantatore un maestro della confusione e del controllo del campo di battaglia."},{"title":"Regola","text":"Le magie mentali e le illusioni sono spesso a scontro di livello."},{"title":"Ruolo nel Gioco","text":"Supporto Tattico: In combattimento, l''Incantatore gioca un ruolo chiave nel controllo del campo di battaglia. Grazie alle sue illusioni, può distorcere la percezione dei nemici, nascondere la vera posizione del gruppo o far sembrare un gruppo più numeroso di quanto non sia in realtà.\n\nVersatilità: L''abilità di evocare destrieri e altre creature permette all''Incantatore di adattarsi a molte situazioni diverse. Possono fungere da esploratori, inviare creature per sondare un''area pericolosa, o creare difese magiche temporanee per il gruppo.\n\nManipolazione della Realtà: Oltre alle illusioni, gli Incantatori possono incantare oggetti per renderli più potenti o dare effetti temporanei a persone o armi. Questo li rende estremamente utili in preparazione a grandi battaglie o per superare ostacoli particolarmente difficili."},{"title":"Connessione con altre Carriere","text":"Gli Incantatori si integrano bene con altre classi, specialmente quelle che richiedono supporto tattico o il potenziamento di abilità esistenti. Possono lavorare con guerrieri per potenziare le loro armi, o con ladri per creare diversivi che facilitino l''infiltrazione."},{"title":"","text":"Nell''ambito di un gioco di ruolo, gli Incantatori possono usare le loro abilità magiche per influenzare non solo la realtà circostante, ma anche l''aspetto fisico e l''attrazione sessuale. Questo aspetto può essere particolarmente utile in situazioni sociali, diplomatiche o di infiltrazione."}]'::jsonb, 'anima', 'spell', 'Incantesimi', 'Incantesimo', 'intelligenza', false, false, 6),
  ('druido', 'Druido', 'class', 'La natura non perdona lo spreco', 'Il Druido è un eletto di Xenea fin dalla nascita: un sacerdote della natura.', '[{"title":"Descrizione Generale","text":"Fin dall''infanzia viene rivendicato dalla comunità druidica e dedica la vita allo studio della natura e all''equilibrio della vita. Abbandona le comodità delle città per vivere e meditare in solitudine in boschi, foreste, deserti, tundre e altri ambienti naturali."},{"title":"Equilibrio","text":"Col tempo diventa custode del territorio in cui vive e punisce chi toglie la vita o danneggia altri esseri viventi senza motivo. Punisce con la morte chi uccide solo se l''uccisione è stata inutile. Per lui conta il ciclo naturale della vita: anche gli atti benevoli non sono automaticamente ben accetti. Spesso è Neutrale Puro."},{"title":"Fonte del potere","text":"Manipola la magia divina. Il dono può venire da una divinità legata alla natura, come Xenea, o dalla natura stessa."},{"title":"Linguaggio segreto","text":"I druidi hanno un linguaggio segreto del loro ordine, con cui comunicano tra loro e lasciano messaggi nascosti a chi non ne fa parte."},{"title":"Creature sacre","text":"I Folletti sono considerati sacri dai Druidi."},{"title":"Oggetti legati","text":"Oggetto di trasformazione dello spirito: trasforma nell''animale più affine al proprio spirito, senza possibilità di scelta. Dura 8 ore, utilizzabile ogni 60 giorni. Al primo uso lo spirito guida parla e spiega il perché (dono dei druidi al party)."},{"title":"Esempi di incantesimi","text":"Affinità animale\nAffinità vegetale"}]'::jsonb, 'anima', 'spell', 'Incantesimi', 'Incantesimo', 'intelligenza', false, false, 7),
  ('sacerdote', 'Sacerdote', 'class', '', '', '[{"title":"Capacità collegate","text":"Concentrazione (Freddezza 12): permette di continuare a lanciare miracoli anche se attaccati.\nTeologia: conoscenza del sacro, dei simboli e della storia della religione.\nPercezione sacra: chi la possiede vede a quale dio è devoto un sacerdote."}]'::jsonb, 'spirito', 'miracle', 'Miracoli', 'Miracolo', 'intelligenza', true, false, 8),
  ('assassino', 'Assassino', 'career', 'Un''ombra, un colpo, nessun nome', 'Gli Assassini di Xerioth: una carriera che si affianca a una classe.', '[{"title":"La gilda","text":"Gilda segreta e nascosta, nella quale si entra solo su invito. I membri sono le Ombre Nere e portano il marchio delle Ombre Nere."},{"title":"Veleno nelle armi","text":"Tipi di veleno: da contatto (molto debole), da ferita (entra in circolo), da ingestione (il più potente).\nPiù il veleno è potente, più si consuma a contatto con l''aria.\nSulle frecce va applicato in combattimento e scoccato subito: si perde 1 turno per bagnare la freccia."},{"title":"Capacità utili","text":"Muoversi silenziosamente (Riflessi 10)\nFurtività (Muoversi silenziosamente 3)\nNascondersi (Furtività 1)\nPedinare\nNascondi presenza (Avverti presenza 4 + Intelligenza 13)\nConoscere veleni\nTravestimento"}]'::jsonb, null, null, null, null, null, false, false, 9),
  ('ladro', 'Ladro', 'career', 'Ciò che è chiuso aspetta solo me', 'I Ladri di Xerioth: una carriera che si affianca a una classe.', '[{"title":"La gilda","text":"Gilda segreta e nascosta, nella quale si entra solo su invito."},{"title":"Capacità utili","text":"Scassinare\nBorseggiare (Muoversi silenziosamente 3)\nMuoversi silenziosamente (Riflessi 10)\nFurtività (Muoversi silenziosamente 3)\nNascondersi (Furtività 1)\nPedinare\nCreare trappole (Agilità 13 + Intelligenza 12)\nFalsificare (Abilità 12)\nTravestimento"}]'::jsonb, null, null, null, null, null, false, false, 10),
  ('alchimista', 'Alchimista', 'career', 'Una goccia guarisce, una goccia uccide', 'Gli Alchimisti di Xerioth: l''arte delle erbe, delle pozioni e dei composti alchemici.', '[{"title":"Formazione","text":"Gli Alchimisti vengono sempre instradati da un maestro che insegna loro l''arte, dall''erboristeria fino a pozioni e composti alchemici."},{"title":"Capacità utili","text":"Erboristeria: base per produrre pozioni e veleni. Riconosce piante e preparati.\nProdurre allucinogeni/Veleni/Droghe (Erboristeria 3)\nProdurre pozioni (Erboristeria 5)\nConoscere veleni: veleni, droghe, allucinogeni.\nResistenza veleni (Conoscere veleni 1)"}]'::jsonb, null, null, null, null, null, false, false, 11);
insert into public.alignments (key, code, name, archetype, description, example, sort_order) values
  ('legale_buono', 'LB', 'Legale Buono', 'Il Crociato', 'Il difensore dei deboli e il raddrizzatore di torti, l''eroe per eccellenza. Cerca con tutte le sue forze di fare il bene, ma difficilmente mette in discussione le leggi o la gerarchia in cui si trova. Dice la verità, mantiene la parola data, aiuta i bisognosi e combatte il male senza tregua. Il suo dilemma più grande è dover infrangere la legge per difendere i più deboli.', 'Il paladino che segue una morale rigida. Salvare un innocente punito da un governo altrimenti giusto, o rubare per sfamare un bambino, lo metterebbe in grande difficoltà.', 0),
  ('neutrale_buono', 'NB', 'Neutrale Buono', 'Il Benefattore', 'Fa sempre del suo meglio per aiutare gli altri nei limiti delle sue possibilità. Lavora volentieri con regnanti e tutori dell''ordine, ma non sente alcun legame verso di loro. È il personaggio più guidato dal bene incondizionato: il suo istinto di fare il bene difficilmente viene frenato da qualcosa.', 'Salva l''innocente e ruba per sfamare il bambino senza esitare.', 1),
  ('caotico_buono', 'CB', 'Caotico Buono', 'Il Ribelle', 'Segue solo la propria coscienza benevola, senza curarsi di ciò che gli altri si aspettano da lui, anche se questo significa infrangere leggi che trova ingiuste. Vive da fuorilegge ma resta gentile e ben disposto. Odia chi intimorisce gli altri o vuole imporre le proprie regole.', 'Un anarchico votato al bene: il Robin Hood del gioco.', 2),
  ('legale_neutrale', 'LN', 'Legale Neutrale', 'Il Giudice', 'Agisce secondo le leggi, le tradizioni o il proprio codice d''onore. Ordine e organizzazione sono per lui di vitale importanza: crede nel proprio ordine e vive secondo un codice preciso, oppure crede nell''ordine collettivo e partecipa a sistemi di governo fortemente organizzati.', '', 3),
  ('neutrale_puro', 'N', 'Neutrale Puro', 'L''Indeciso o l''Equilibrato', 'Si comporta secondo istinto e conoscenze, senza costrizioni né pregiudizi. Considera il bene migliore del male, ma non si sente obbligato a perseguirlo sempre. A volte considera dannosi gli estremi (legge e caos, bene e male) e cerca di mantenere un sano equilibrio. Ai fini del gioco è in genere un personaggio difficile da interpretare.', 'I druidi sono spesso Neutrali Puri: per loro la neutralità è l''equilibrio della natura. Il leone uccide la gazzella per sopravvivere, non per sadismo.', 4),
  ('caotico_neutrale', 'CN', 'Caotico Neutrale', 'Il Cinico', 'L''individualista per eccellenza: si scaglia contro tradizioni e leggi solo perché limitano la sua libertà. Non si sa mai cosa farà né che danni causerà, perché agisce secondo l''umore del momento. Da un suo piccolo gesto possono nascere grandi sofferenze o aiuti inaspettati. Per lui bene e male non contano nelle scelte: è forse la forma più concreta e instabile del caos.', 'L''attaccabrighe fine a se stesso, senza alcun rispetto per la legge e la società.', 5),
  ('legale_malvagio', 'LM', 'Legale Malvagio', 'Il Dominatore', 'L''incarnazione della tirannia: è zelante nel fare il male quanto il Crociato nel fare il bene. Rispetta e idolatra ordine, gerarchia, tradizioni, disciplina e il proprio codice morale, e giudica gli altri solo in base a queste regole.', 'L''ufficiale di un esercito mercenario con un forte senso dell''onore e della gerarchia: non tradirebbe mai un commilitone, ma ucciderebbe donne e bambini senza scrupoli se gli venisse ordinato, o se gli convenisse.', 6),
  ('neutrale_malvagio', 'NM', 'Neutrale Malvagio', 'L''Opportunista', 'Fa qualsiasi cosa gli porti un guadagno personale, senza rimorso per il dolore che infligge, purché riesca a cavarsela. Non crede nell''ordine più di quanto creda nel caos: segue l''uno o l''altro a seconda di dove sta il suo guadagno. È uno degli allineamenti più semplici da interpretare, ma non è banale: davanti a ogni evento ha la scelta più ampia di comportamenti plausibili.', '', 7),
  ('caotico_malvagio', 'CM', 'Caotico Malvagio', 'Il Distruttore', 'Lo psicotico assassino che si abbandona a esplosioni di furia incontrollata, senza alcun rimorso. Ha una personalità instabile e fidarsi di lui può essere letale: qualunque cosa succeda, cercherà sempre di salvare se stesso. Non rispetta i compagni né le loro vite, gode nell''uccidere e non conosce pietà. Tra i caotici malvagi non esiste alcuna fratellanza, a differenza degli altri allineamenti.', 'È l''allineamento più comune tra i mostri, gli antagonisti dei giocatori.', 8);
insert into public.skills (key, name, attribute, max_level, description, requirements, sort_order) values
  ('ambidestro', 'Ambidestro', 'abilita', 7, 'Elimina il malus della mano non dominante. A livello 1: -7 alla sinistra e -2 alla destra, con 2 attacchi di spada a turno. A ogni livello il malus della sinistra scende di 1 e quello della destra si azzera.', '[]'::jsonb, 0),
  ('armi_medie', 'Armi medie', 'abilita', 10, 'Ascia, Bastone, Bolas, Flagello, Frusta, Martello, Mazza, Spada, Spada bastarda.', '[]'::jsonb, 1),
  ('armi_tiro_medie', 'Armi da tiro medie', 'abilita', 10, 'Arco medio, Balestra, ecc.', '[]'::jsonb, 2),
  ('armi_leggere', 'Armi leggere', 'abilita', 10, 'Accetta, Arco corto, Balestra leggera, Cerbottana, Falcetto, Fionda, Spadino, Pugnali.', '[]'::jsonb, 3),
  ('arrampicarsi', 'Arrampicarsi', 'abilita', 10, '', '[{"type":"skill","skill":"agilita","min":2}]'::jsonb, 4),
  ('cavalcare', 'Cavalcare', 'abilita', 10, '', '[]'::jsonb, 5),
  ('conciare_pelli', 'Conciare pelli', 'abilita', 10, '', '[]'::jsonb, 6),
  ('costruire_armature', 'Costruire Armature', 'abilita', 10, '', '[{"type":"skill","skill":"conoscenza_armi_armature","min":3}]'::jsonb, 7),
  ('costruire_armi', 'Costruire Armi', 'abilita', 10, '', '[{"type":"skill","skill":"conoscenza_armi_armature","min":3}]'::jsonb, 8),
  ('crea_oggetti_magici', 'Crea oggetti magici', 'abilita', 10, '', '[{"type":"attribute","attribute":"intelligenza","min":18},{"type":"power","name":"Fondere incantesimi"}]'::jsonb, 9),
  ('crea_reliquie', 'Crea Reliquie', 'abilita', 10, '', '[{"type":"skill","skill":"crea_oggetti_magici","min":8},{"type":"skill","skill":"teologia","min":5}]'::jsonb, 10),
  ('creare_rune', 'Creare Rune', 'abilita', 10, '', '[{"type":"skill","skill":"conoscenza_rune","min":5},{"type":"attribute","attribute":"intelligenza","min":15}]'::jsonb, 11),
  ('creare_trappole', 'Creare trappole', 'abilita', 10, '', '[{"type":"attribute","attribute":"abilita","min":13},{"type":"attribute","attribute":"intelligenza","min":12}]'::jsonb, 12),
  ('furtivita', 'Furtività', 'abilita', 10, 'Non visto, non udito, non notato.', '[{"type":"skill","skill":"muoversi_silenziosamente","min":3}]'::jsonb, 13),
  ('leggere_rune', 'Leggere Rune', 'abilita', 10, '', '[{"type":"skill","skill":"conoscenza_rune","min":5},{"type":"attribute","attribute":"intelligenza","min":15}]'::jsonb, 14),
  ('muoversi_silenziosamente', 'Muoversi silenziosamente', 'abilita', 10, '', '[{"type":"attribute","attribute":"riflessi","min":10}]'::jsonb, 15),
  ('nuotare', 'Nuotare', 'abilita', 10, '', '[]'::jsonb, 16),
  ('pedinare', 'Pedinare', 'abilita', 10, 'Seguire una persona senza che se ne accorga.', '[{"type":"skill","skill":"muoversi_silenziosamente","min":3}]'::jsonb, 17),
  ('produrre_veleni', 'Produrre allucinogeni / veleni / droghe', 'abilita', 10, '', '[{"type":"skill","skill":"erboristeria","min":3}]'::jsonb, 18),
  ('produrre_pozioni', 'Produrre pozioni', 'abilita', 10, '', '[{"type":"skill","skill":"erboristeria","min":5}]'::jsonb, 19),
  ('riparare_armature', 'Riparare Armature', 'abilita', 10, '', '[{"type":"skill","skill":"conoscenza_armi_armature","min":3}]'::jsonb, 20),
  ('riparare_armi', 'Riparare Armi', 'abilita', 10, '', '[{"type":"skill","skill":"conoscenza_armi_armature","min":3}]'::jsonb, 21),
  ('scassinare', 'Scassinare', 'abilita', 10, 'Aprire forzando la serratura.', '[]'::jsonb, 22),
  ('seguire_tracce', 'Seguire tracce', 'abilita', 10, 'Capire da odori, impronte e altri segni cosa è successo in un luogo e come si è sviluppato.', '[]'::jsonb, 23),
  ('sopravvivenza', 'Sopravvivenza', 'abilita', 10, 'Resistere a condizioni sfavorevoli: recuperare acqua dal terreno, scaldarsi al freddo, ecc.', '[]'::jsonb, 24),
  ('apnea', 'Apnea', 'costituzione', 10, 'Trattenere volontariamente il respiro.', '[{"type":"attribute","attribute":"costituzione","min":12}]'::jsonb, 25),
  ('armi_pesanti', 'Brandire Armi pesanti', 'costituzione', 10, 'Alabarda, Arco lungo, Ascia pesante, Falce, Flagello a due mani, Lancia, Martello pesante, Spadone, Tridente.', '[{"type":"note","text":"Costituzione 13 (senza: malus del 40% sulla velocità dei movimenti)"}]'::jsonb, 26),
  ('forza', 'Forza', 'costituzione', 10, 'Capacità dei muscoli di compiere un lavoro, in base al fisico, all''energia e all''allenamento.', '[{"type":"attribute","attribute":"costituzione","min":12}]'::jsonb, 27),
  ('resistenza_caldo_freddo', 'Resistenza al freddo e al caldo', 'costituzione', 10, '', '[{"type":"attribute","attribute":"costituzione","min":12}]'::jsonb, 28),
  ('resistenza_veleni', 'Resistenza ai veleni', 'costituzione', 10, '', '[{"type":"skill","skill":"conoscere_veleni","min":1}]'::jsonb, 29),
  ('resistenza_tortura', 'Resistenza alla tortura', 'costituzione', 10, '', '[{"type":"attribute","attribute":"freddezza","min":10},{"type":"attribute","attribute":"costituzione","min":10}]'::jsonb, 30),
  ('resistenza_fisica', 'Resistenza fisica', 'costituzione', 10, 'Capacità di resistere al danno. Da 1 a 3, 10% punti ferita sotto prima di morire - da 4 a 6, 20% - da 7 a 9, 30% - a 10, 50%. Il giocatore comunica il numero al Master.', '[{"type":"attribute","attribute":"costituzione","min":12}]'::jsonb, 31),
  ('stordire', 'Stordire', 'costituzione', 10, 'Mettere qualcuno in uno stato confuso che gli impedisce di agire o reagire.', '[{"type":"skill","skill":"anatomia","min":1}]'::jsonb, 32),
  ('armature_pesanti', 'Indossare Armature Pesanti', 'costituzione', 10, '', '[{"type":"note","text":"Costituzione 13 (senza: malus del 40% sulla velocità dei movimenti)"}]'::jsonb, 33),
  ('anatomia', 'Anatomia', 'intelligenza', 10, 'Conoscenza del corpo a livello medico.', '[]'::jsonb, 34),
  ('avverti_presenza', 'Avverti presenza', 'intelligenza', 10, 'Cerca le menti: non sente i morti ma sente i fantasmi. Un mago potente può occultarsi. Si usa anche al contrario, per nascondere la propria presenza.', '[]'::jsonb, 35),
  ('botanica', 'Botanica', 'intelligenza', 10, 'Studio delle piante: forma, funzionamento e classificazione.', '[]'::jsonb, 36),
  ('cartografia_geografia', 'Cartografia / Geografia', 'intelligenza', 10, 'Conoscenza dei luoghi.', '[]'::jsonb, 37),
  ('chirurgia', 'Chirurgia', 'intelligenza', 10, 'Conoscenza del corpo ed eventuale intervento chirurgico.', '[{"type":"skill","skill":"anatomia","min":5}]'::jsonb, 38),
  ('conoscenza_bestiario', 'Conoscenza Bestiario', 'intelligenza', 10, '', '[]'::jsonb, 39),
  ('conoscenza_razze', 'Conoscenza delle razze', 'intelligenza', 10, '', '[]'::jsonb, 40),
  ('conoscenza_non_morti', 'Conoscenza Non Morti', 'intelligenza', 10, '', '[]'::jsonb, 41),
  ('conoscere_veleni', 'Conoscere veleni', 'intelligenza', 10, 'Veleni, droghe, allucinogeni.', '[]'::jsonb, 42),
  ('consapevolezza', 'Consapevolezza / Individuare', 'intelligenza', 10, 'Percepisce anche i morti, ma solo ciò che si vede: non scopre chi è nascosto bene.', '[]'::jsonb, 43),
  ('demonologia', 'Demonologia', 'intelligenza', 10, 'Studio e conoscenza dei demoni.', '[]'::jsonb, 44),
  ('conoscenza_malattie', 'Conoscenza Malattie', 'intelligenza', 10, '', '[{"type":"skill","skill":"anatomia","min":2}]'::jsonb, 45),
  ('erboristeria', 'Erboristeria', 'intelligenza', 10, 'Conoscenza delle piante: effetti, lavorazione e dove trovarle. Serve anche a riconoscere preparati erboristici ed è la base per produrre pozioni e veleni.', '[]'::jsonb, 46),
  ('esplosivi', 'Esplosivi', 'intelligenza', 10, 'Conoscere e preparare composti instabili che esplodono se mossi in un certo modo. Più alto è il livello, più si è capaci di fabbricarli.', '[{"type":"attribute","attribute":"intelligenza","min":15},{"type":"attribute","attribute":"abilita","min":15}]'::jsonb, 47),
  ('memoria', 'Memoria', 'intelligenza', 10, 'Ricordare nomi, luoghi, avvenimenti, ecc.', '[{"type":"attribute","attribute":"intelligenza","min":16}]'::jsonb, 48),
  ('linguaggio_comune', 'Linguaggio comune', 'intelligenza', 4, '', '[]'::jsonb, 49),
  ('lingue', 'Lingue', 'intelligenza', 10, 'Ogni lingua è una capacità a sé: si sceglie la lingua (es. Elfico antico, Demoniaco) e si prende la capacità corrispondente.', '[]'::jsonb, 50),
  ('nascondersi', 'Nascondersi', 'intelligenza', 10, 'Tenere nascosto qualcuno o qualcosa in modo che non venga visto o trovato.', '[{"type":"skill","skill":"furtivita","min":1}]'::jsonb, 51),
  ('nascondi_presenza', 'Nascondi presenza', 'intelligenza', 10, 'Il contrario di Avverti presenza.', '[{"type":"skill","skill":"avverti_presenza","min":4},{"type":"attribute","attribute":"intelligenza","min":13}]'::jsonb, 52),
  ('pedinare_intelligenza', 'Pedinare (Intelligenza)', 'intelligenza', 10, 'Seguire qualcuno passo passo, a distanza e con cautela, per controllarne movimenti e comportamenti.', '[{"type":"skill","skill":"muoversi_silenziosamente","min":1}]'::jsonb, 53),
  ('pensiero_magico', 'Pensiero magico', 'intelligenza', 1, 'Lanciare incantesimi senza pronunciare parole.', '[]'::jsonb, 54),
  ('percezione_magica', 'Percezione magica', 'intelligenza', 10, 'Vede l''aura magica che circonda un mago: ogni scuola di magia ha un colore.', '[]'::jsonb, 55),
  ('percezione_sacra', 'Percezione sacra', 'intelligenza', 10, 'Vede a quale dio è devoto un sacerdote. Se non si conosce il dio, non si vede.', '[]'::jsonb, 56),
  ('storia', 'Storia', 'intelligenza', 10, '', '[]'::jsonb, 57),
  ('teologia', 'Teologia', 'intelligenza', 10, 'Conoscenza del sacro, dei simboli e della storia della religione.', '[]'::jsonb, 58),
  ('studio', 'Studio', 'intelligenza', 4, 'Imparare una o più discipline: 3 punti esperienza, +2 per ogni giorno di studio.', '[]'::jsonb, 59),
  ('valutare_ferite', 'Valutare ferite', 'intelligenza', 10, 'Valuta le ferite e capisce quanto serve per uccidere qualcuno o quanto gli manca a morire.', '[{"type":"skill","skill":"anatomia","min":2}]'::jsonb, 60),
  ('verbo_magico', 'Verbo magico', 'intelligenza', 1, 'Lanciare incantesimi senza gesticolare.', '[{"type":"skill","skill":"pensiero_magico","min":1}]'::jsonb, 61),
  ('conoscenza_armi_armature', 'Conoscenza Armi / Armature', 'intelligenza', 10, '', '[{"type":"attribute","attribute":"intelligenza","min":13}]'::jsonb, 62),
  ('conoscenza_rune', 'Conoscenza Rune', 'intelligenza', 10, '', '[{"type":"attribute","attribute":"intelligenza","min":13}]'::jsonb, 63),
  ('identificazione_oggetti_magici', 'Identificazione oggetti magici', 'intelligenza', 10, '', '[]'::jsonb, 64),
  ('resilienza', 'Resilienza', 'intelligenza', 4, 'Aumenta l''intensità dell''apprendimento di discipline fisiche o mentali senza aumentare le ore. Si sblocca quando Concentrazione + Resistenza alla Fatica = 8.', '[]'::jsonb, 65),
  ('contrattacco', 'Contrattacco', 'riflessi', 10, 'Reazione a un attacco nemico, usata soprattutto nel corpo a corpo. Massimo un attacco per mano.', '[{"type":"skill","skill":"ambidestro","min":3}]'::jsonb, 66),
  ('lottare', 'Lottare', 'riflessi', 10, 'Usare oggetti dell''ambiente come arma, non solo combattere a mani nude.', '[]'::jsonb, 67),
  ('borseggiare', 'Borseggiare', 'riflessi', 10, 'Derubare qualcuno con destrezza, prendendo ciò che ha in borsa o nelle tasche.', '[{"type":"skill","skill":"muoversi_silenziosamente","min":3}]'::jsonb, 68),
  ('schivare', 'Schivare', 'riflessi', 10, 'Evitare un ostacolo, un colpo o un urto con uno scatto rapido.', '[{"type":"attribute","attribute":"riflessi","min":10}]'::jsonb, 69),
  ('lancio_rapido', 'Lancio rapido', 'riflessi', 10, 'Riduce il tempo di lancio degli incantesimi del 30%, +5% per ogni livello in più, ma aumenta il costo in mana della stessa percentuale.', '[]'::jsonb, 70),
  ('agilita', 'Agilità', 'riflessi', 10, 'Salto, lancio, scatto e reazione: l''insieme delle capacità di un corpo atletico e allenato.', '[{"type":"attribute","attribute":"riflessi","min":13}]'::jsonb, 71),
  ('destrezza', 'Destrezza', 'riflessi', 4, 'Aumenta l''intensità dell''apprendimento di discipline fisiche senza aumentare le ore. Si sblocca quando livello + Costituzione + Abilità = 30.', '[]'::jsonb, 72),
  ('resistenza_fatica', 'Resistenza alla Fatica', 'riflessi', 4, 'Fa durare più ore l''allenamento delle discipline fisiche. Si sblocca quando livello + Costituzione + Abilità = 30.', '[]'::jsonb, 73),
  ('torturare', 'Torturare', 'freddezza', 10, 'Far soffrire qualcuno mantenendolo in vita, anche creature delicate come le driadi.', '[{"type":"attribute","attribute":"freddezza","min":10}]'::jsonb, 74),
  ('concentrazione', 'Concentrazione', 'freddezza', 4, 'Per maghi e sacerdoti: continuare a evocare o lanciare incantesimi anche se attaccati, mentre si cammina o si corre.', '[{"type":"attribute","attribute":"freddezza","min":12}]'::jsonb, 75),
  ('meditazione', 'Meditazione', 'freddezza', 4, 'Recuperare punti mana senza dormire. A livello 1 servono 4 ore, poi un''ora in meno per livello: a livello 4 basta 1 ora.', '[{"type":"attribute","attribute":"freddezza","min":12}]'::jsonb, 76),
  ('liberarsi', 'Liberarsi', 'freddezza', 4, 'Sottrarsi a catene, corde e simili.', '[{"type":"attribute","attribute":"freddezza","min":12},{"type":"attribute","attribute":"abilita","min":12}]'::jsonb, 77),
  ('mira', 'Mira', 'freddezza', 10, 'Puntare un''arma nella posizione giusta per un colpo efficace.', '[{"type":"attribute","attribute":"freddezza","min":12}]'::jsonb, 78),
  ('pronto_soccorso', 'Pronto soccorso', 'freddezza', 10, 'Intervenire con prontezza per aiutare un ferito.', '[{"type":"skill","skill":"anatomia","min":1},{"type":"attribute","attribute":"freddezza","min":12}]'::jsonb, 79),
  ('carisma', 'Carisma', 'fascino', 10, 'Esercitare una forte influenza sugli altri.', '[{"type":"attribute","attribute":"fascino","min":12}]'::jsonb, 80),
  ('oratoria', 'Oratoria', 'fascino', 10, 'L''arte di parlare in pubblico.', '[{"type":"attribute","attribute":"intelligenza","min":13}]'::jsonb, 81),
  ('mondanita', 'Mondanità', 'fascino', 10, 'Vivere in modo brillante, come le classi più agiate, e tutto ciò che ne fa parte.', '[]'::jsonb, 82),
  ('comandare', 'Comandare', 'fascino', 10, 'Guidare un gruppo, uno schieramento o un''attività.', '[{"type":"attribute","attribute":"fascino","min":15},{"type":"skill","skill":"carisma","min":1}]'::jsonb, 83),
  ('recitare', 'Recitare / Mentire', 'fascino', 10, 'Ingannare o persuadere: dire il falso o alterare consapevolmente la verità.', '[{"type":"attribute","attribute":"freddezza","min":13}]'::jsonb, 84),
  ('sedurre', 'Sedurre', 'fascino', 10, 'Affascinare e attrarre in modo irresistibile.', '[{"type":"attribute","attribute":"fascino","min":12}]'::jsonb, 85),
  ('diplomazia', 'Diplomazia', 'fascino', 10, 'Tatto e finezza nel trattare questioni delicate o persone suscettibili.', '[{"type":"attribute","attribute":"fascino","min":10}]'::jsonb, 86),
  ('falsificare', 'Falsificare', 'fascino', 10, 'Manipolare la verità, contraffare.', '[{"type":"attribute","attribute":"abilita","min":12}]'::jsonb, 87),
  ('addestramento_animali', 'Addestramento animali', 'fascino', 10, 'Insegnare abilità e comportamenti agli animali.', '[]'::jsonb, 88),
  ('galateo', 'Galateo ed etichetta', 'fascino', 10, 'Le regole di comportamento della buona educazione.', '[]'::jsonb, 89),
  ('travestimento', 'Travestimento', 'fascino', 10, 'Abiti, trucco ed elementi posticci per creare una maschera o rendersi irriconoscibili.', '[]'::jsonb, 90),
  ('interrogare', 'Interrogare', 'fascino', 10, '', '[{"type":"attribute","attribute":"intelligenza","min":10}]'::jsonb, 91);
insert into public.weapons (key, name, category, skill_key, requirement, note, sort_order) values
  ('accetta', 'Accetta', 'Leggera', 'armi_leggere', '', '', 0),
  ('arco_corto', 'Arco corto', 'Leggera', 'armi_leggere', '', '', 1),
  ('balestra_leggera', 'Balestra leggera', 'Leggera', 'armi_leggere', '', '', 2),
  ('cerbottana', 'Cerbottana', 'Leggera', 'armi_leggere', '', '', 3),
  ('falcetto', 'Falcetto', 'Leggera', 'armi_leggere', '', '', 4),
  ('fionda', 'Fionda', 'Leggera', 'armi_leggere', '', '', 5),
  ('spadino_daga', 'Spadino / Daga', 'Leggera', 'armi_leggere', '', '', 6),
  ('pugnali', 'Pugnali', 'Leggera', 'armi_leggere', '', '', 7),
  ('ascia', 'Ascia', 'Media', 'armi_medie', '', '', 8),
  ('bastone', 'Bastone', 'Media', 'armi_medie', '', '', 9),
  ('bolas', 'Bolas', 'Media', 'armi_medie', '', '', 10),
  ('flagello', 'Flagello', 'Media', 'armi_medie', '', '', 11),
  ('frusta', 'Frusta', 'Media', 'armi_medie', '', '', 12),
  ('mazza_ferrata', 'Mazza ferrata', 'Media', 'armi_medie', '', '', 13),
  ('spada', 'Spada', 'Media', 'armi_medie', '', '', 14),
  ('spada_bastarda', 'Spada bastarda', 'Media', 'armi_medie', '', '', 15),
  ('alabarda', 'Alabarda', 'Pesante', 'armi_pesanti', 'Costituzione 13 (senza: malus del 40% sulla velocità dei movimenti)', '', 16),
  ('arco_lungo', 'Arco lungo', 'Pesante', 'armi_pesanti', 'Costituzione 13 (senza: malus del 40% sulla velocità dei movimenti)', '', 17),
  ('falce', 'Falce', 'Pesante', 'armi_pesanti', 'Costituzione 13 (senza: malus del 40% sulla velocità dei movimenti)', '', 18),
  ('lancia', 'Lancia', 'Pesante', 'armi_pesanti', 'Costituzione 13 (senza: malus del 40% sulla velocità dei movimenti)', '', 19),
  ('spadone', 'Spadone', 'Pesante', 'armi_pesanti', 'Costituzione 13 (senza: malus del 40% sulla velocità dei movimenti)', '', 20),
  ('tridente', 'Tridente', 'Pesante', 'armi_pesanti', 'Costituzione 13 (senza: malus del 40% sulla velocità dei movimenti)', '', 21),
  ('arco_medio', 'Arco medio', 'Da tiro media', 'armi_tiro_medie', '', '', 22),
  ('balestra', 'Balestra', 'Da tiro media', 'armi_tiro_medie', '', '', 23),
  ('ascia_da_battaglia', 'Ascia da battaglia', '', null, '', 'Categoria da definire (Armi medie o pesanti?)', 24),
  ('balestra_pesante', 'Balestra pesante', '', null, '', 'Categoria da definire', 25),
  ('martello_da_guerra', 'Martello da guerra', '', null, '', 'Categoria da definire (Martello medio o pesante?)', 26),
  ('stiletto', 'Stiletto', '', null, '', 'Categoria da definire', 27),
  ('katana', 'Katana', '', null, '', 'Categoria da definire', 28),
  ('rete', 'Rete', '', null, '', '', 29),
  ('scudo', 'Scudo', '', null, '', '', 30),
  ('frecce', 'Frecce', 'Munizioni', null, '', 'Confezione da 20', 31),
  ('dardi_quadrelli', 'Dardi / quadrelli', 'Munizioni', null, '', 'Per cerbottana e balestra: 50 / 20', 32);
insert into public.armors (key, name, armor_type, description, requirement, note, sort_order) values
  ('cuoio', 'Cuoio', 'Leggera', 'Il corpetto e gli spallacci sono di cuoio indurito, bollito nell''olio. Il resto dell''armatura è fatto di materiali più morbidi e flessibili.', '', '', 0),
  ('cuoio_rinforzato', 'Cuoio rinforzato', 'Leggera', 'Cuoio duro ma flessibile, rinforzato da rivetti o borchie.', '', '', 1),
  ('piastre_parziali', 'Piastre parziali', 'Media', 'Detta anche Mezza a Piastre: piastre di metallo sagomate che coprono gran parte del corpo. Per le gambe ha solo dei semplici schinieri legati con lacci di cuoio.', '', '', 2),
  ('maglia', 'Maglia', 'Media', 'Cotta e gambali di cuoio (a volte con una gonna separata) coperti da pezzi di metallo sovrapposti, come le scaglie di un pesce. Comprende i guanti.', '', '', 3),
  ('completa_a_piastre', 'Completa a piastre', 'Pesante', 'Piastre di metallo sagomate a incastro che coprono tutto il corpo. Comprende guanti, stivali di cuoio pesanti, elmo con visiera e uno spesso strato di imbottitura. Fibbie e lacci distribuiscono il peso su tutto il corpo.', 'Indossare Armature Pesanti: Costituzione 13 (senza: malus del 40% sulla velocità dei movimenti)', '', 4);

-- Schede: chiavi esterne verso i cataloghi.
alter table public.characters
  add constraint characters_race_key_fkey foreign key (race_key) references public.races (key),
  add constraint characters_alignment_key_fkey foreign key (alignment_key) references public.alignments (key);
create index if not exists characters_race_key_idx on public.characters (race_key);
create index if not exists characters_alignment_key_idx on public.characters (alignment_key);

alter table public.character_classes
  add column element_key text references public.elements (key),
  add constraint character_classes_class_key_fkey foreign key (class_key) references public.classes (key),
  add constraint character_classes_deity_key_fkey foreign key (deity_key) references public.deities (key);
create index if not exists character_classes_class_key_idx on public.character_classes (class_key);
create index if not exists character_classes_deity_key_idx on public.character_classes (deity_key);
create index if not exists character_classes_element_key_idx on public.character_classes (element_key);

alter table public.character_skills
  add constraint character_skills_skill_key_fkey foreign key (skill_key) references public.skills (key);
create index if not exists character_skills_skill_key_idx on public.character_skills (skill_key);

-- Divinità solo per le classi che la richiedono (Sacerdote), elemento solo per l'Elementalista.
create function private.check_character_class()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  cls public.classes;
begin
  select * into cls from public.classes where key = new.class_key;
  if not found then
    return new; -- ci pensa la chiave esterna
  end if;
  if cls.requires_deity <> (new.deity_key is not null) then
    raise exception 'La classe % %', cls.name,
      case when cls.requires_deity then 'richiede una divinità' else 'non ha una divinità' end;
  end if;
  if cls.requires_element <> (new.element_key is not null) then
    raise exception 'La classe % %', cls.name,
      case when cls.requires_element then 'richiede un elemento' else 'non ha un elemento' end;
  end if;
  return new;
end;
$$;

create trigger character_classes_check
before insert or update of class_key, deity_key, element_key on public.character_classes
for each row execute function private.check_character_class();
