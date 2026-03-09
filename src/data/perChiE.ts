export interface PerChiECategory {
  slug: string;
  name: string;
  icon: string; // lucide icon name
  group: "dimensione" | "settore";
  heroTitle: string;
  heroSubtitle: string;
  stats: { value: string; label: string }[];
  problems: { title: string; description: string }[];
  solutions: { title: string; description: string }[];
  roi: { metric: string; value: string }[];
  caseStudy: {
    company: string;
    location: string;
    quote: string;
    result: string;
  };
  ctaLine: string;
}

export const perChiECategories: PerChiECategory[] = [
  // === DIMENSIONE ===
  {
    slug: "artigiani-micro-imprese",
    name: "Artigiani e Micro Imprese",
    icon: "Wrench",
    group: "dimensione",
    heroTitle: "Sei Un Artigiano? Stai Perdendo Clienti Mentre Lavori In Cantiere.",
    heroSubtitle: "Chi ti chiama alle 8 di mattina mentre sei sul ponteggio? Nessuno. E quel cliente va dal competitor che risponde.",
    stats: [
      { value: "67%", label: "Chiamate perse durante il lavoro" },
      { value: "€2.400", label: "Persi al mese in lead non gestiti" },
      { value: "3h", label: "Al giorno sprecate al telefono" },
    ],
    problems: [
      { title: "Non puoi rispondere mentre lavori", description: "Sei in cantiere con le mani sporche. Il telefono suona. Quando richiami, il cliente ha già trovato un altro." },
      { title: "Preventivi fatti la sera a casa", description: "Dopo 10 ore di lavoro fisico, ti tocca ancora fare preventivi, rispondere a email, gestire appuntamenti." },
      { title: "Zero marketing, zero crescita", description: "Non hai tempo per farti pubblicità. I clienti arrivano solo col passaparola — e quando si ferma, il lavoro si ferma." },
    ],
    solutions: [
      { title: "Receptionist AI 24/7", description: "Risponde a ogni chiamata, qualifica il cliente, fissa l'appuntamento. Tu lavori, l'AI gestisce." },
      { title: "Preventivi automatici", description: "L'AI raccoglie le informazioni dal cliente e prepara una bozza di preventivo. Tu la rivedi e invii." },
      { title: "Follow-up automatico", description: "Nessun cliente viene dimenticato. L'AI richiama, manda WhatsApp, chiude il cerchio." },
    ],
    roi: [
      { metric: "Lead recuperati", value: "+340%" },
      { metric: "Ore risparmiate/mese", value: "60+" },
      { metric: "Costo vs segretaria", value: "-85%" },
    ],
    caseStudy: {
      company: "Rossi Impianti",
      location: "Brescia",
      quote: "Prima perdevo 3 clienti a settimana perché non rispondevo. Ora l'AI risponde in 2 secondi e mi fissa gli appuntamenti. Ho aumentato il fatturato del 40%.",
      result: "+40% fatturato in 90 giorni",
    },
    ctaLine: "Ogni chiamata persa è un lavoro che va al tuo competitor. Smetti di perderli.",
  },
  {
    slug: "piccole-imprese",
    name: "Piccole Imprese",
    icon: "Building",
    group: "dimensione",
    heroTitle: "Hai 6-25 Dipendenti? La Tua Segretaria Non Basta Più.",
    heroSubtitle: "Stai pagando una persona per fare il lavoro che un'AI fa meglio, più veloce e a un decimo del costo.",
    stats: [
      { value: "€36K", label: "Costo annuo segretaria" },
      { value: "42%", label: "Chiamate fuori orario perse" },
      { value: "€8K", label: "Risparmiati al mese con AI" },
    ],
    problems: [
      { title: "La segretaria è un collo di bottiglia", description: "Una persona non può gestire 50 chiamate al giorno, rispondere su WhatsApp e seguire i lead. Fisicamente impossibile." },
      { title: "Lead che cadono nel vuoto", description: "Il foglio Excel dei contatti è pieno di nomi mai richiamati. Ogni riga è un cantiere perso." },
      { title: "Costi fissi che salgono", description: "TFR, ferie, malattia, contributi. La segretaria costa €36K/anno e non risponde di notte." },
    ],
    solutions: [
      { title: "AI che sostituisce il front-office", description: "Gestisce chiamate, qualifica lead, fissa sopralluoghi. Lavora 24/7, costa come 2 giorni di segretaria al mese." },
      { title: "CRM automatico", description: "Ogni conversazione viene trascritta, il lead viene catalogato, il follow-up parte automaticamente." },
      { title: "Campagne outbound", description: "L'AI chiama la tua lista contatti, presenta i tuoi servizi, fissa appuntamenti. Tu arrivi e chiudi." },
    ],
    roi: [
      { metric: "Risparmio annuo", value: "€30K+" },
      { metric: "Lead qualificati/mese", value: "3x" },
      { metric: "Tempo risposta", value: "<3 sec" },
    ],
    caseStudy: {
      company: "Edilcomfort Srl",
      location: "Padova",
      quote: "Abbiamo eliminato la segretaria e messo l'AI. In 60 giorni abbiamo gestito il triplo dei lead spendendo un terzo.",
      result: "€30K risparmiati, +200% lead gestiti",
    },
    ctaLine: "Stai pagando €3.000/mese per una persona che l'AI sostituisce a €297/mese.",
  },
  {
    slug: "medie-imprese",
    name: "Medie Imprese",
    icon: "Building2",
    group: "dimensione",
    heroTitle: "26-100 Dipendenti? Il Tuo Reparto Commerciale Sta Bruciando Budget.",
    heroSubtitle: "3 commerciali a €45K l'uno. Quanti contratti chiudono davvero? L'AI ne chiude di più, a una frazione del costo.",
    stats: [
      { value: "€135K", label: "Costo annuo 3 commerciali" },
      { value: "23%", label: "Tasso conversione medio" },
      { value: "€50K+", label: "Risparmiabili con AI" },
    ],
    problems: [
      { title: "Commerciali costosi e inefficienti", description: "Sopralluoghi a vuoto, lead non qualificati, tempo perso in telefonate inutili. Il ROI non torna." },
      { title: "Nessun controllo sui dati", description: "Non sai quante chiamate fa ogni commerciale, quanti lead converte, dove perde tempo." },
      { title: "Scaling impossibile", description: "Per crescere del 30% devi assumere altri 2 commerciali. Più costi fissi, più rischio." },
    ],
    solutions: [
      { title: "Pre-qualifica AI automatica", description: "L'AI chiama, qualifica, e passa al commerciale solo i lead pronti. Zero sopralluoghi a vuoto." },
      { title: "Dashboard analytics completa", description: "Ogni chiamata tracciata, ogni lead scorato, ogni conversazione trascritta. Controllo totale." },
      { title: "Scaling senza assunzioni", description: "Raddoppia le chiamate senza raddoppiare il team. L'AI scala linearmente, i costi no." },
    ],
    roi: [
      { metric: "Costo per lead", value: "-65%" },
      { metric: "Conversione", value: "+180%" },
      { metric: "Sopralluoghi qualificati", value: "+250%" },
    ],
    caseStudy: {
      company: "Costruzioni Venete SpA",
      location: "Treviso",
      quote: "L'AI pre-qualifica ogni lead prima che il commerciale esca. I sopralluoghi a vuoto sono scesi dal 60% al 12%.",
      result: "-80% sopralluoghi inutili, +45% chiusure",
    },
    ctaLine: "I tuoi commerciali dovrebbero chiudere contratti, non fare telefonate. Lascia quello all'AI.",
  },
  {
    slug: "grandi-aziende-general-contractor",
    name: "Grandi Aziende e General Contractor",
    icon: "Factory",
    group: "dimensione",
    heroTitle: "100+ Dipendenti? Senza AI, Stai Combattendo Con Le Armi Del 2010.",
    heroSubtitle: "I tuoi competitor più agili stanno già automatizzando. Ogni mese che aspetti è market share perso.",
    stats: [
      { value: "€500K+", label: "Budget commerciale annuo" },
      { value: "15%", label: "Efficienza media team vendite" },
      { value: "10x", label: "ROI dell'AI nel primo anno" },
    ],
    problems: [
      { title: "Processi lenti e burocratizzati", description: "Dalla prima chiamata al preventivo passano settimane. Il cliente nel frattempo ha già firmato con un altro." },
      { title: "Team commerciale difficile da gestire", description: "Turnover alto, formazione costosa, performance inconsistenti tra i venditori." },
      { title: "Dati frammentati", description: "CRM che nessuno aggiorna, report manuali, zero visibilità real-time sulle performance." },
    ],
    solutions: [
      { title: "AI come primo filtro commerciale", description: "Gestisce il primo contatto, qualifica, raccoglie dati tecnici. Il team riceve solo opportunità concrete." },
      { title: "Automazione report e follow-up", description: "Report giornalieri automatici, follow-up AI su ogni lead, zero task manuali ripetitivi." },
      { title: "Integrazione completa", description: "Si collega al tuo CRM, ERP, calendario. Un ecosistema unico, non un altro tool isolato." },
    ],
    roi: [
      { metric: "Efficienza commerciale", value: "+300%" },
      { metric: "Time-to-quote", value: "-70%" },
      { metric: "ROI anno 1", value: "10x" },
    ],
    caseStudy: {
      company: "Gruppo Edil Italia",
      location: "Milano",
      quote: "Abbiamo integrato l'AI su 3 divisioni. Il time-to-quote è passato da 14 giorni a 3. I competitor non capiscono come facciamo.",
      result: "-78% tempi di preventivazione, +60% win rate",
    },
    ctaLine: "Le aziende che adottano l'AI oggi domineranno il mercato domani. Le altre spariranno.",
  },

  // === SETTORE ===
  {
    slug: "serramentisti-infissi",
    name: "Serramentisti e Infissi",
    icon: "DoorOpen",
    group: "settore",
    heroTitle: "Sei Un Serramentista? I Tuoi Competitor Chiudono Contratti Mentre Tu Fai Preventivi.",
    heroSubtitle: "Il cliente chiama 5 serramentisti. Chi risponde per primo, vince. E tu stai ancora rispondendo per ultimo.",
    stats: [
      { value: "78%", label: "Dei clienti sceglie chi risponde prima" },
      { value: "€4.200", label: "Valore medio commessa infissi" },
      { value: "5min", label: "Tempo medio per perdere un lead" },
    ],
    problems: [
      { title: "Lead che chiedono preventivi e spariscono", description: "Spendi 2 ore a fare un preventivo dettagliato. Il cliente non risponde più. È andato da chi ha risposto prima." },
      { title: "Sopralluoghi a vuoto", description: "Vai a misurare, prepari il preventivo, il cliente 'ci deve pensare'. Il 60% non torna mai." },
      { title: "Stagionalità che ti uccide", description: "Da ottobre a marzo il telefono non suona. Non hai un sistema per generare domanda costante." },
    ],
    solutions: [
      { title: "Risposta istantanea ai lead", description: "L'AI risponde in 2 secondi, raccoglie misure, tipologia infissi, budget. Tu arrivi al sopralluogo già preparato." },
      { title: "Qualifica prima del sopralluogo", description: "L'AI verifica budget, tempistiche, decisore. Vai solo dove c'è un contratto da chiudere." },
      { title: "Campagne anti-stagionalità", description: "L'AI chiama i vecchi clienti, propone manutenzione, sostituzione. Lavoro anche nei mesi morti." },
    ],
    roi: [
      { metric: "Sopralluoghi qualificati", value: "+200%" },
      { metric: "Tempo preventivazione", value: "-50%" },
      { metric: "Contratti chiusi/mese", value: "+85%" },
    ],
    caseStudy: {
      company: "Infissi Modena",
      location: "Modena",
      quote: "L'AI pre-qualifica ogni richiesta. Ora faccio sopralluoghi solo dove so che chiudo. Il tasso di chiusura è passato dal 25% al 72%.",
      result: "+188% tasso di chiusura",
    },
    ctaLine: "Ogni preventivo fatto a vuoto è tempo rubato alla tua famiglia. Smetti di sprecare ore.",
  },
  {
    slug: "installatori-fotovoltaico",
    name: "Installatori Fotovoltaico",
    icon: "Sun",
    group: "settore",
    heroTitle: "Installi Fotovoltaico? Il Boom È Adesso. Ma Stai Perdendo l'80% Dei Lead.",
    heroSubtitle: "La domanda esplode, ma senza un sistema per gestire i contatti, stai lasciando milioni sul tavolo.",
    stats: [
      { value: "€15K", label: "Valore medio impianto residenziale" },
      { value: "80%", label: "Lead persi senza follow-up" },
      { value: "€120K", label: "Fatturato recuperabile/anno" },
    ],
    problems: [
      { title: "Troppe richieste, poco tempo", description: "Il boom del fotovoltaico porta 50 richieste a settimana. Ne gestisci 10. Le altre 40 vanno ai competitor." },
      { title: "Clienti confusi dagli incentivi", description: "Ogni cliente chiede spiegazioni su bonus, detrazioni, cessione del credito. Ore perse a fare il consulente fiscale." },
      { title: "Installazioni che slittano", description: "Il cliente dice sì ma poi rimanda. Nessuno lo segue. Dopo 3 mesi ha cambiato idea." },
    ],
    solutions: [
      { title: "Gestione lead massiva", description: "L'AI risponde a tutte le 50 richieste, qualifica, spiega gli incentivi, fissa il sopralluogo. Tu installi." },
      { title: "Educazione automatica", description: "L'AI spiega bonus fiscali, tempi di rientro, risparmio in bolletta. Il cliente arriva già convinto." },
      { title: "Follow-up anti-rinvio", description: "L'AI segue il cliente fino alla firma. Promemoria, aggiornamenti, urgenza. Zero clienti persi per inerzia." },
    ],
    roi: [
      { metric: "Lead gestiti", value: "5x" },
      { metric: "Tempo al sopralluogo", value: "-60%" },
      { metric: "Impianti chiusi/mese", value: "+150%" },
    ],
    caseStudy: {
      company: "SolarTech Italia",
      location: "Roma",
      quote: "Gestivamo 10 lead a settimana, ora ne gestiamo 50. L'AI spiega tutto al cliente, noi arriviamo e installiamo.",
      result: "+400% lead gestiti, +150% installazioni",
    },
    ctaLine: "Il boom del fotovoltaico non dura per sempre. Chi non automatizza oggi, resterà indietro domani.",
  },
  {
    slug: "imprese-ristrutturazione",
    name: "Imprese di Ristrutturazione",
    icon: "Hammer",
    group: "settore",
    heroTitle: "Ristrutturi Case? Il 70% Dei Tuoi Preventivi Finisce Nel Cestino.",
    heroSubtitle: "Spendi ore a fare sopralluoghi e preventivi per clienti che non firmeranno mai. L'AI cambia le regole.",
    stats: [
      { value: "70%", label: "Preventivi rifiutati" },
      { value: "€25K", label: "Valore medio ristrutturazione" },
      { value: "14gg", label: "Tempo medio preventivo" },
    ],
    problems: [
      { title: "Preventivi che richiedono giorni", description: "Sopralluogo, misure, contatti fornitori, calcolo costi. 14 giorni per un preventivo che il cliente rifiuta." },
      { title: "Clienti che 'ci devono pensare'", description: "Il classico 'Le faccio sapere' che significa mai. Zero follow-up strutturato." },
      { title: "Dipendenza dal passaparola", description: "Quando il passaparola si ferma, il lavoro si ferma. Nessun sistema attivo di acquisizione clienti." },
    ],
    solutions: [
      { title: "Pre-qualifica budget e tempistiche", description: "L'AI verifica budget reale, tempistiche, decisore prima che tu muova un dito. Solo clienti seri." },
      { title: "Follow-up automatico post-preventivo", description: "L'AI richiama il cliente dopo 3, 7, 14 giorni. Risponde alle obiezioni. Chiude il cerchio." },
      { title: "Acquisizione attiva", description: "Campagne AI su vecchi contatti, clienti passati, zona geografica. Lavoro costante tutto l'anno." },
    ],
    roi: [
      { metric: "Preventivi accettati", value: "+120%" },
      { metric: "Tempo commerciale", value: "-70%" },
      { metric: "Fatturato annuo", value: "+45%" },
    ],
    caseStudy: {
      company: "Casa Nuova Ristrutturazioni",
      location: "Firenze",
      quote: "L'AI ha eliminato i perditempo. Ora facciamo preventivi solo a chi ha budget e tempistiche reali. Il tasso di chiusura è triplicato.",
      result: "3x tasso di chiusura, +45% fatturato",
    },
    ctaLine: "Ogni preventivo fatto a un perditempo è un cantiere vero che non stai seguendo.",
  },
  {
    slug: "imprese-edili-generali",
    name: "Imprese Edili Generali",
    icon: "HardHat",
    group: "settore",
    heroTitle: "Impresa Edile? I Tuoi Costi Fissi Ti Stanno Soffocando.",
    heroSubtitle: "Segretaria, commerciali, ufficio. Ogni mese bruci €15K prima ancora di posare un mattone. L'AI taglia il 60%.",
    stats: [
      { value: "€180K", label: "Costi fissi annui medi" },
      { value: "60%", label: "Riducibili con automazione AI" },
      { value: "€108K", label: "Risparmiabili ogni anno" },
    ],
    problems: [
      { title: "Costi fissi fuori controllo", description: "Segretaria, commerciale, amministrazione. €15K/mese prima di vedere un euro di fatturato." },
      { title: "Gare e appalti: troppo tempo, pochi risultati", description: "Prepari documentazione per 10 gare, ne vinci 1. Il tempo investito non ha ROI." },
      { title: "Coordinamento subappaltatori caotico", description: "Telefonate, WhatsApp, email. Nessuno sa chi deve fare cosa e quando. Ritardi e costi extra." },
    ],
    solutions: [
      { title: "Front-office AI completo", description: "Gestione chiamate, lead, appuntamenti, follow-up. Zero personale aggiuntivo." },
      { title: "Pre-screening gare automatico", description: "L'AI analizza i bandi, verifica i requisiti, ti segnala solo quelli che puoi vincere." },
      { title: "Coordinamento automatizzato", description: "Notifiche AI ai subappaltatori, reminder scadenze, aggiornamenti automatici al cliente." },
    ],
    roi: [
      { metric: "Costi fissi", value: "-60%" },
      { metric: "Win rate gare", value: "+90%" },
      { metric: "Ritardi cantiere", value: "-45%" },
    ],
    caseStudy: {
      company: "Edil Futura Srl",
      location: "Bologna",
      quote: "Abbiamo tagliato €8K/mese di costi fissi e gestiamo il triplo dei cantieri. L'AI coordina tutto.",
      result: "-60% costi, +200% cantieri gestiti",
    },
    ctaLine: "Ogni euro speso in costi fissi inutili è un euro tolto al tuo utile. Taglia adesso.",
  },
  {
    slug: "posatori-pavimentisti",
    name: "Posatori e Pavimentisti",
    icon: "Grid3x3",
    group: "settore",
    heroTitle: "Posi Pavimenti? Il Tuo Telefono Suona Mentre Hai Le Ginocchia a Terra.",
    heroSubtitle: "Non puoi rispondere con le mani nella colla. Ma quel cliente non richiamerà. Va dal prossimo su Google.",
    stats: [
      { value: "€3.500", label: "Valore medio lavoro" },
      { value: "45%", label: "Chiamate perse in cantiere" },
      { value: "€5K", label: "Persi ogni mese" },
    ],
    problems: [
      { title: "Impossibile rispondere in cantiere", description: "Stai posando, non puoi fermarti. Il telefono suona 5 volte, nessuno risponde. 5 clienti persi." },
      { title: "Preventivi sottopagati", description: "Non sai quanto vale il tuo tempo. Accetti lavori sottopagati perché 'meglio di niente'." },
      { title: "Zero visibilità online", description: "I clienti cercano su Google. Tu non ci sei. Il lavoro arriva solo dal passaparola." },
    ],
    solutions: [
      { title: "Receptionist AI dedicato", description: "Risponde mentre lavori, raccoglie tipo pavimento, metratura, tempistiche. Tu richiami solo chi vale." },
      { title: "Qualifica budget automatica", description: "L'AI chiede il budget prima che tu faccia il sopralluogo. Basta lavori sottopagati." },
      { title: "Follow-up e recensioni", description: "L'AI chiede recensioni Google ai clienti soddisfatti. Più recensioni = più visibilità = più lavoro." },
    ],
    roi: [
      { metric: "Chiamate gestite", value: "100%" },
      { metric: "Valore medio lavoro", value: "+35%" },
      { metric: "Recensioni Google", value: "+400%" },
    ],
    caseStudy: {
      company: "Pavimenti D'Arte",
      location: "Verona",
      quote: "L'AI risponde mentre poso. Non perdo più neanche una chiamata. E il valore medio dei lavori è salito perché ora seleziono i clienti.",
      result: "+35% valore medio, zero chiamate perse",
    },
    ctaLine: "Ogni chiamata persa mentre sei in cantiere è un lavoro che va a qualcun altro.",
  },
  {
    slug: "lattonieri-coperture",
    name: "Lattonieri e Coperture",
    icon: "Umbrella",
    group: "settore",
    heroTitle: "Lavori Sui Tetti? Il Tuo Business È a Terra Senza Un Sistema Di Lead.",
    heroSubtitle: "I danni da maltempo generano picchi di richieste. Se non rispondi in 10 minuti, il cliente chiama un altro.",
    stats: [
      { value: "€6.000", label: "Valore medio intervento" },
      { value: "10min", label: "Finestra per rispondere" },
      { value: "€72K", label: "Persi in lead non gestiti/anno" },
    ],
    problems: [
      { title: "Picchi di domanda ingestibili", description: "Dopo una grandinata arrivano 100 chiamate in un giorno. Ne gestisci 15. Le altre 85 vanno ai competitor." },
      { title: "Urgenze vs lavori programmati", description: "Le emergenze ti fanno saltare i lavori programmati. I clienti programmati si arrabbiano." },
      { title: "Preventivi complessi da remoto", description: "Devi salire sul tetto per capire il danno. Ma il cliente vuole un prezzo prima del sopralluogo." },
    ],
    solutions: [
      { title: "Gestione picchi automatica", description: "L'AI gestisce 100 chiamate simultanee. Ogni cliente viene registrato, classificato per urgenza, richiamato." },
      { title: "Triage intelligente", description: "L'AI classifica urgenze vs programmati, gestisce le aspettative, pianifica gli interventi." },
      { title: "Pre-assessment fotografico", description: "L'AI chiede foto al cliente via WhatsApp, stima il danno, ti prepara prima del sopralluogo." },
    ],
    roi: [
      { metric: "Lead gestiti nei picchi", value: "+500%" },
      { metric: "Tempo organizzazione", value: "-60%" },
      { metric: "Fatturato post-eventi", value: "+300%" },
    ],
    caseStudy: {
      company: "Coperture Sicure",
      location: "Bergamo",
      quote: "Dopo la grandinata di giugno, l'AI ha gestito 200 richieste in 48 ore. Noi da soli ne avremmo fatte 30.",
      result: "+567% richieste gestite durante i picchi",
    },
    ctaLine: "La prossima grandinata porterà 200 richieste. Quante ne perderai senza l'AI?",
  },
  {
    slug: "impianti-idraulici-termici",
    name: "Impianti Idraulici e Termici",
    icon: "Droplets",
    group: "settore",
    heroTitle: "Idraulico? Le Emergenze Non Aspettano. E Nemmeno I Tuoi Clienti.",
    heroSubtitle: "Tubo rotto alle 3 di notte. Il cliente chiama. Se non rispondi, chiama il prossimo su Google. Per sempre.",
    stats: [
      { value: "€1.800", label: "Valore medio intervento" },
      { value: "24/7", label: "Quando i clienti chiamano" },
      { value: "€4K", label: "Persi al mese in emergenze non gestite" },
    ],
    problems: [
      { title: "Emergenze h24 impossibili da gestire", description: "I tubi si rompono di notte, nei weekend, a Natale. Non puoi essere sempre disponibile." },
      { title: "Manutenzioni programmate dimenticate", description: "Il cliente dovrebbe fare il tagliando alla caldaia ogni anno. Ma nessuno lo richiama. Perdi il rinnovo." },
      { title: "Concorrenza feroce sui prezzi", description: "Il cliente chiama 5 idraulici e sceglie il più economico. Non hai modo di differenziarti." },
    ],
    solutions: [
      { title: "Pronto intervento AI h24", description: "L'AI risponde di notte, valuta l'urgenza, prenota l'intervento per la mattina dopo. Il cliente è gestito." },
      { title: "Recall manutenzione automatico", description: "L'AI chiama ogni cliente a scadenza caldaia/impianto. Rinnovi automatici senza sforzo." },
      { title: "Qualifica e differenziazione", description: "L'AI spiega perché il tuo servizio vale di più. Garanzia, tempistiche, professionalità. Non solo prezzo." },
    ],
    roi: [
      { metric: "Interventi notturni gestiti", value: "+100%" },
      { metric: "Rinnovi manutenzione", value: "+250%" },
      { metric: "Valore percepito", value: "+60%" },
    ],
    caseStudy: {
      company: "Termoidraulica Rapida",
      location: "Torino",
      quote: "L'AI risponde alle 3 di notte e prenota l'intervento. Il cliente è tranquillo, io dormo. La mattina vado e fatturo.",
      result: "+100% interventi gestiti, clienti più soddisfatti",
    },
    ctaLine: "Il prossimo tubo si romperà alle 2 di notte. Chi risponde al tuo cliente?",
  },
  {
    slug: "impianti-elettrici",
    name: "Impianti Elettrici",
    icon: "Zap",
    group: "settore",
    heroTitle: "Elettricista? I Cantieri Ti Chiamano, Ma Tu Sei In Un Altro Cantiere.",
    heroSubtitle: "Mentre tiri cavi in un appartamento, stai perdendo il lavoro nel condominio dall'altra parte della città.",
    stats: [
      { value: "€2.500", label: "Valore medio intervento" },
      { value: "55%", label: "Chiamate perse durante lavori" },
      { value: "€6K", label: "Persi al mese" },
    ],
    problems: [
      { title: "Sempre in cantiere, mai al telefono", description: "Non puoi rispondere con le mani nei cavi elettrici. Le chiamate vanno a vuoto, i clienti vanno altrove." },
      { title: "Certificazioni e burocrazia", description: "DiCo, DiRi, conformità. Passi ore a fare pratiche invece di fare impianti." },
      { title: "Preventivi tecnici complessi", description: "Ogni impianto è diverso. Fare un preventivo richiede sopralluogo e ore di calcolo." },
    ],
    solutions: [
      { title: "Receptionist tecnico AI", description: "L'AI risponde, capisce il tipo di intervento (nuovo impianto, manutenzione, emergenza), qualifica e prenota." },
      { title: "Pre-raccolta dati tecnici", description: "L'AI chiede al cliente planimetria, potenza attuale, tipo di impianto. Tu arrivi già con le idee chiare." },
      { title: "Follow-up certificazioni", description: "L'AI ricorda ai clienti le scadenze di conformità. Nuovi interventi senza cercare clienti." },
    ],
    roi: [
      { metric: "Chiamate gestite", value: "100%" },
      { metric: "Tempo pre-sopralluogo", value: "-40%" },
      { metric: "Clienti da recall", value: "+180%" },
    ],
    caseStudy: {
      company: "Elettro Service",
      location: "Napoli",
      quote: "Prima perdevo metà delle chiamate. Ora l'AI le gestisce tutte e mi manda un riepilogo a fine giornata. Ho più lavoro di prima.",
      result: "Zero chiamate perse, +55% interventi mensili",
    },
    ctaLine: "Ogni filo che tiri è importante. Ma anche ogni chiamata che perdi.",
  },
  {
    slug: "cartongessisti-finiture",
    name: "Cartongessisti e Finiture",
    icon: "PaintBucket",
    group: "settore",
    heroTitle: "Cartongessista? Il Tuo Lavoro È Perfetto. Il Tuo Marketing È Inesistente.",
    heroSubtitle: "Fai controsoffitti da paura ma nessuno ti trova online. L'AI porta clienti mentre tu lavori.",
    stats: [
      { value: "€2.000", label: "Valore medio lavoro" },
      { value: "90%", label: "Dei clienti cerca online" },
      { value: "€3K", label: "Persi al mese senza presenza online" },
    ],
    problems: [
      { title: "Invisibile online", description: "Il 90% dei clienti cerca su Google. Tu non ci sei. Tutto il tuo lavoro arriva dal passaparola." },
      { title: "Lavoro stagionale e intermittente", description: "Mesi pieni alternati a mesi vuoti. Nessun sistema per riempire i buchi." },
      { title: "Clienti che non capiscono i costi", description: "'Ma quanto costa un controsoffitto?' Il cliente non capisce la complessità e vuole prezzi da discount." },
    ],
    solutions: [
      { title: "Lead generation automatica", description: "L'AI gestisce le richieste online, qualifica il cliente, spiega il valore del tuo lavoro." },
      { title: "Campagne anti-buchi", description: "L'AI chiama vecchi clienti, propone lavori aggiuntivi, riempie i mesi vuoti." },
      { title: "Educazione al valore", description: "L'AI spiega perché il cartongesso professionale costa di più e vale di più. Clienti educati = margini migliori." },
    ],
    roi: [
      { metric: "Lead da online", value: "+300%" },
      { metric: "Mesi vuoti/anno", value: "-80%" },
      { metric: "Margine medio", value: "+25%" },
    ],
    caseStudy: {
      company: "Finiture Perfette",
      location: "Milano",
      quote: "L'AI mi ha portato più clienti in 2 mesi che il passaparola in 2 anni. E sono clienti che capiscono il valore.",
      result: "+300% lead, margini più alti",
    },
    ctaLine: "Il tuo lavoro parla da solo. Ma prima qualcuno deve trovarti. L'AI ti fa trovare.",
  },
  {
    slug: "progettisti-studi-tecnici",
    name: "Progettisti e Studi Tecnici",
    icon: "Compass",
    group: "settore",
    heroTitle: "Architetto? Geometra? Passi Più Tempo Al Telefono Che Al Tecnigrafo.",
    heroSubtitle: "Ogni ora spesa a rispondere a richieste generiche è un'ora tolta ai progetti che pagano. L'AI filtra per te.",
    stats: [
      { value: "€8K", label: "Valore medio progetto" },
      { value: "4h/gg", label: "Spese in comunicazione" },
      { value: "€48K", label: "Valore tempo perso/anno" },
    ],
    problems: [
      { title: "Telefonate che interrompono il lavoro", description: "Stai progettando, il telefono suona. Perdi concentrazione. Ci metti 20 minuti a riprendere il filo." },
      { title: "Richieste generiche e perditempo", description: "'Quanto costa ristrutturare?' Domande vaghe che richiedono 30 minuti di conversazione per capire che non c'è budget." },
      { title: "Gestione cantiere a distanza", description: "Devi coordinare imprese, aggiornare il cliente, gestire varianti. Tutto via telefono e email. Caos." },
    ],
    solutions: [
      { title: "Filtro intelligente chiamate", description: "L'AI risponde, capisce il tipo di progetto, verifica budget e tempistiche. Ti passa solo i clienti seri." },
      { title: "Aggiornamenti cantiere automatici", description: "L'AI manda report settimanali al cliente con foto e avanzamento. Zero telefonate di aggiornamento." },
      { title: "Acquisizione progettuale", description: "L'AI contatta costruttori, imprese, proprietari per proporre i tuoi servizi di progettazione." },
    ],
    roi: [
      { metric: "Ore produttive/giorno", value: "+3h" },
      { metric: "Clienti qualificati", value: "+200%" },
      { metric: "Progetti seguiti contemporaneamente", value: "+80%" },
    ],
    caseStudy: {
      company: "Studio Tecnico Arch. Bianchi",
      location: "Roma",
      quote: "L'AI filtra le chiamate e mi passa solo chi ha un progetto vero con budget vero. Ho recuperato 3 ore al giorno di lavoro produttivo.",
      result: "+3h/giorno produttive, +80% progetti gestiti",
    },
    ctaLine: "Il tuo tempo vale €100/ora. Quante ore stai regalando ai perditempo?",
  },
];

export const dimensioneCategories = perChiECategories.filter(c => c.group === "dimensione");
export const settoreCategories = perChiECategories.filter(c => c.group === "settore");
