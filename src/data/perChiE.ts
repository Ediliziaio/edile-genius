export interface ServiceItem {
  icon: string;
  title: string;
  description: string;
}

export interface PerChiECategory {
  slug: string;
  name: string;
  icon: string;
  group: "dimensione" | "settore";
  heroTitle: string;
  heroSubtitle: string;
  stats: { value: string; label: string }[];
  problems: { title: string; description: string }[];
  solutions: { title: string; description: string }[];
  services: ServiceItem[];
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
      { title: "Agente Vocale + WhatsApp H24", description: "L'AI risponde al telefono e su WhatsApp mentre sei in cantiere. Qualifica il cliente, raccoglie dati, fissa l'appuntamento." },
      { title: "Preventivi Automatici in 5 Minuti", description: "L'AI raccoglie misure, materiali, specifiche dal cliente e genera una bozza di preventivo pronta da inviare." },
      { title: "Campagne Outbound Anti-Stagionalità", description: "L'AI chiama i vecchi clienti, propone manutenzioni e nuovi lavori. Lavoro costante anche nei mesi morti." },
    ],
    services: [
      { icon: "Phone", title: "Agente Vocale AI", description: "Risponde a ogni chiamata in <2 secondi, qualifica il cliente, fissa appuntamenti. Funziona mentre sei sul ponteggio." },
      { icon: "MessageSquare", title: "WhatsApp AI", description: "Gestisce le conversazioni WhatsApp, invia foto lavori, risponde a richieste preventivo automaticamente." },
      { icon: "HardHat", title: "Gestione Cantieri", description: "Coordina fornitori e clienti con aggiornamenti automatici sullo stato dei lavori e scadenze." },
      { icon: "FileText", title: "Gestione Documenti", description: "Organizza DDT, fatture, certificazioni di conformità. Tutto digitale, zero carta persa." },
      { icon: "Calculator", title: "Preventivi Automatici", description: "Raccoglie dati dal cliente (misure, materiali, tempistiche) e genera preventivi professionali in automatico." },
      { icon: "Megaphone", title: "Campagne Outbound", description: "Chiama la tua lista clienti passati, propone manutenzioni e nuovi lavori. Tu arrivi e chiudi." },
    ],
    roi: [
      { metric: "Lead recuperati", value: "+340%" },
      { metric: "Ore risparmiate/mese", value: "60+" },
      { metric: "Tempo al telefono", value: "-85%" },
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
    heroTitle: "Hai 6-25 Dipendenti? Il Tuo Ufficio Non Riesce a Stare Dietro a Tutto.",
    heroSubtitle: "Telefono, WhatsApp, lead, preventivi: troppo per una persona sola. L'AI prende il lavoro ripetitivo e il tuo ufficio si concentra sui clienti.",
    stats: [
      { value: "50+", label: "Chiamate al giorno da gestire" },
      { value: "42%", label: "Chiamate fuori orario perse" },
      { value: "24/7", label: "Risposta con l'agente AI" },
    ],
    problems: [
      { title: "L'ufficio è un collo di bottiglia", description: "Una persona non può gestire 50 chiamate al giorno, rispondere su WhatsApp e seguire i lead. Fisicamente impossibile." },
      { title: "Lead che cadono nel vuoto", description: "Il foglio Excel dei contatti è pieno di nomi mai richiamati. Ogni riga è un cantiere perso." },
      { title: "Il telefono non si ferma mai", description: "Sera, weekend, ferie: le richieste arrivano sempre, l'ufficio no. Ogni chiamata senza risposta è un cliente che va altrove." },
    ],
    solutions: [
      { title: "Front-Office AI con Vocale + WhatsApp", description: "Gestisce chiamate e messaggi WhatsApp contemporaneamente. Qualifica lead, fissa sopralluoghi, tutto H24." },
      { title: "Preventivi e Documenti Automatici", description: "L'AI genera preventivi dalla conversazione col cliente e archivia DDT, contratti e certificazioni." },
      { title: "Gestione Cantieri + Campagne Outbound", description: "Coordina i cantieri con aggiornamenti automatici e lancia campagne per acquisire nuovi clienti." },
    ],
    services: [
      { icon: "Phone", title: "Agente Vocale AI", description: "Risponde a ogni chiamata, anche 50+ al giorno, qualifica i lead e fissa appuntamenti. H24, e il tuo ufficio si dedica ai clienti." },
      { icon: "MessageSquare", title: "WhatsApp AI", description: "Risponde ai clienti su WhatsApp, invia preventivi, gestisce follow-up e conferme appuntamento." },
      { icon: "HardHat", title: "Gestione Cantieri", description: "Aggiornamenti automatici ai clienti sullo stato lavori, coordinamento squadre, scadenze materiali." },
      { icon: "FileText", title: "Gestione Documenti", description: "Archiviazione automatica DDT, fatture, contratti. Ricerca istantanea, zero documenti persi." },
      { icon: "Calculator", title: "Preventivi Automatici", description: "Genera preventivi professionali dalla telefonata. Il cliente riceve il preventivo entro 10 minuti." },
      { icon: "Megaphone", title: "Campagne Outbound", description: "L'AI chiama la tua lista contatti, presenta servizi, fissa appuntamenti. Il commerciale chiude." },
    ],
    roi: [
      { metric: "Ore d'ufficio recuperate/mese", value: "60+" },
      { metric: "Lead qualificati/mese", value: "3x" },
      { metric: "Tempo risposta", value: "<3 sec" },
    ],
    caseStudy: {
      company: "Edilcomfort Srl",
      location: "Padova",
      quote: "Abbiamo eliminato la segretaria e messo l'AI. In 60 giorni abbiamo gestito il triplo dei lead spendendo un terzo.",
      result: "€30K risparmiati, +200% lead gestiti",
    },
    ctaLine: "Il tuo ufficio passa ore al telefono: l'AI se ne occupa 24/7, e il team torna a lavorare sui clienti.",
  },
  {
    slug: "medie-imprese",
    name: "Medie Imprese",
    icon: "Building2",
    group: "dimensione",
    heroTitle: "26-100 Dipendenti? Il Tuo Reparto Commerciale Lavora su Troppi Lead Freddi.",
    heroSubtitle: "I tuoi commerciali passano le giornate a richiamare contatti che non compreranno. L'AI qualifica prima, e loro chiudono di più.",
    stats: [
      { value: "23%", label: "Tasso conversione medio" },
      { value: "100%", label: "Lead richiamati e qualificati" },
      { value: "24/7", label: "Pre-qualifica attiva" },
    ],
    problems: [
      { title: "Commerciali costosi e inefficienti", description: "Sopralluoghi a vuoto, lead non qualificati, tempo perso in telefonate inutili. Il ROI non torna." },
      { title: "Nessun controllo sui dati", description: "Non sai quante chiamate fa ogni commerciale, quanti lead converte, dove perde tempo." },
      { title: "Scaling impossibile", description: "Per crescere del 30% devi assumere altri 2 commerciali. Più costi fissi, più rischio." },
    ],
    solutions: [
      { title: "Agente Vocale per Pre-Qualifica", description: "L'AI chiama, qualifica con criteri oggettivi, e passa al commerciale solo i lead pronti a firmare." },
      { title: "WhatsApp AI + Preventivi Automatici", description: "Follow-up automatico via WhatsApp, preventivi generati dalla conversazione, documenti inviati in tempo reale." },
      { title: "Gestione Cantieri + Analytics", description: "Coordinamento cantieri automatizzato, report giornalieri, dashboard performance su ogni lead e commerciale." },
    ],
    services: [
      { icon: "Phone", title: "Agente Vocale AI", description: "Pre-qualifica ogni lead con criteri oggettivi. Il commerciale riceve solo opportunità concrete, pronte alla chiusura." },
      { icon: "MessageSquare", title: "WhatsApp AI", description: "Follow-up automatico post-chiamata, invio preventivi, conferme sopralluogo. Tutto tracciato e misurabile." },
      { icon: "HardHat", title: "Gestione Cantieri", description: "Dashboard cantieri in tempo reale, notifiche automatiche a squadre e clienti, zero ritardi per mancata comunicazione." },
      { icon: "FileText", title: "Gestione Documenti", description: "Generazione automatica contratti, DDT, certificazioni. Firma digitale integrata, archivio consultabile." },
      { icon: "Calculator", title: "Preventivi Automatici", description: "L'AI raccoglie specifiche tecniche dalla chiamata e genera preventivi professionali in minuti, non giorni." },
      { icon: "Megaphone", title: "Campagne Outbound", description: "Scaling commerciale senza assunzioni: l'AI chiama 200 lead/giorno, qualifica e fissa appuntamenti." },
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
      { title: "Agente Vocale + WhatsApp Multicanale", description: "Primo contatto AI su telefono e WhatsApp. Qualifica, raccoglie dati tecnici, smista al reparto giusto." },
      { title: "Preventivi e Documenti Enterprise", description: "Generazione automatica preventivi complessi, gestione documentale integrata con ERP e CRM aziendale." },
      { title: "Gestione Cantieri + Outbound su Scala", description: "Coordinamento multi-cantiere con AI, campagne outbound su migliaia di lead, report automatici giornalieri." },
    ],
    services: [
      { icon: "Phone", title: "Agente Vocale AI", description: "Primo filtro commerciale enterprise: gestisce il contatto iniziale, qualifica, raccoglie dati tecnici e smista." },
      { icon: "MessageSquare", title: "WhatsApp AI", description: "Comunicazione multicanale con clienti e fornitori. Aggiornamenti automatici, conferme, raccolta documenti." },
      { icon: "HardHat", title: "Gestione Cantieri", description: "Coordinamento multi-cantiere: notifiche a subappaltatori, scadenze, varianti, aggiornamenti real-time al cliente." },
      { icon: "FileText", title: "Gestione Documenti", description: "Integrazione ERP/CRM, generazione contratti, DDT, certificazioni. Workflow approvativo automatizzato." },
      { icon: "Calculator", title: "Preventivi Automatici", description: "Preventivi complessi multi-lotto generati dall'AI. Da due settimane a pochi giorni. Integrazione listini fornitori." },
      { icon: "Megaphone", title: "Campagne Outbound", description: "L'AI contatta migliaia di prospect, qualifica per bando/progetto, genera pipeline commerciale automatica." },
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
    ctaLine: "Chi porta l'AI nei propri processi prima, lavora con margini più alti. Parti dall'analisi.",
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
      { title: "Agente Vocale che Raccoglie Misure e Budget", description: "L'AI risponde in 2 secondi, raccoglie tipo infisso, misure, materiale, budget. Tu arrivi al sopralluogo già preparato." },
      { title: "Preventivi Automatici + Follow-up WhatsApp", description: "Preventivo generato dalla chiamata AI, inviato via WhatsApp. Follow-up automatico a 3, 7, 14 giorni." },
      { title: "Campagne Outbound + Gestione Documenti", description: "L'AI chiama vecchi clienti per sostituzione infissi, gestisce certificazioni energetiche e pratiche detrazione." },
    ],
    services: [
      { icon: "Phone", title: "Agente Vocale AI", description: "Risponde in 2 secondi, raccoglie tipo infisso (PVC, alluminio, legno), misure finestre, piano, budget. Qualifica e fissa sopralluogo." },
      { icon: "MessageSquare", title: "WhatsApp AI", description: "Invia catalogo materiali, raccoglie foto finestre attuali, conferma appuntamenti, follow-up post-preventivo." },
      { icon: "HardHat", title: "Gestione Cantieri", description: "Traccia ordini fornitori, tempi di produzione infissi, coordina posa e muratore. Aggiornamenti automatici al cliente." },
      { icon: "FileText", title: "Gestione Documenti", description: "Certificazioni energetiche, pratiche ENEA per detrazioni, DDT, garanzie. Tutto archiviato e tracciabile." },
      { icon: "Calculator", title: "Preventivi Automatici", description: "Dalla telefonata al preventivo in 10 minuti: tipo infisso, misure, accessori, posa, muratura. Pronto da firmare." },
      { icon: "Megaphone", title: "Campagne Outbound", description: "Chiama clienti con infissi vecchi 15+ anni, propone sostituzione con incentivi. Lavoro anche nei mesi morti." },
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
      { title: "Agente Vocale + WhatsApp per Lead Massivi", description: "L'AI gestisce 50+ richieste/settimana, spiega incentivi, qualifica tetto e consumo. Tu installi e basta." },
      { title: "Preventivi Automatici con Simulazione Risparmio", description: "L'AI calcola kWp necessari, risparmio in bolletta, tempi di rientro e genera il preventivo completo." },
      { title: "Gestione Cantieri + Documenti Pratiche GSE", description: "Coordina installazione, gestisce pratiche GSE/ENEA, archivia certificazioni. Zero burocrazia manuale." },
    ],
    services: [
      { icon: "Phone", title: "Agente Vocale AI", description: "Risponde a tutte le richieste, raccoglie consumi bolletta, orientamento tetto, superficie disponibile. Qualifica e fissa sopralluogo." },
      { icon: "MessageSquare", title: "WhatsApp AI", description: "Spiega bonus fiscali, invia simulazione risparmio, raccoglie bollette via foto, follow-up anti-rinvio." },
      { icon: "HardHat", title: "Gestione Cantieri", description: "Pianifica installazioni, coordina elettricista e muratore, notifica cliente su avanzamento e allaccio GSE." },
      { icon: "FileText", title: "Gestione Documenti", description: "Pratiche GSE, comunicazione ENEA, certificazione impianto, garanzie pannelli e inverter. Tutto automatizzato." },
      { icon: "Calculator", title: "Preventivi Automatici", description: "Da bolletta e tetto a preventivo completo: kWp, pannelli, inverter, batteria, costo, risparmio annuo, rientro." },
      { icon: "Megaphone", title: "Campagne Outbound", description: "Chiama proprietari di case in zone target, spiega vantaggi fotovoltaico con incentivi attuali. Pipeline infinita." },
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
      { title: "Agente Vocale per Pre-Qualifica Budget", description: "L'AI verifica budget reale, tempistiche, tipo intervento prima del sopralluogo. Solo clienti seri, zero perditempo." },
      { title: "Preventivi Automatici + Follow-up WhatsApp", description: "Preventivo generato in ore, non giorni. Follow-up AI via WhatsApp a 3, 7, 14 giorni. Chiude il cerchio." },
      { title: "Gestione Cantieri + Documenti + Outbound", description: "Coordina squadre e fornitori, gestisce pratiche edilizie, e lancia campagne per acquisire nuovi clienti." },
    ],
    services: [
      { icon: "Phone", title: "Agente Vocale AI", description: "Pre-qualifica ogni richiesta: tipo intervento, budget, tempistiche, decisore. Passa al commerciale solo chi è pronto." },
      { icon: "MessageSquare", title: "WhatsApp AI", description: "Follow-up post-preventivo automatico, risponde a obiezioni, invia referenze e foto lavori simili completati." },
      { icon: "HardHat", title: "Gestione Cantieri", description: "Coordina muratore, idraulico, elettricista, piastrellista. Aggiornamenti automatici al cliente con foto avanzamento." },
      { icon: "FileText", title: "Gestione Documenti", description: "CILA/SCIA, pratiche comunali, computi metrici, certificazioni fine lavori. Zero burocrazia manuale." },
      { icon: "Calculator", title: "Preventivi Automatici", description: "Da sopralluogo a preventivo dettagliato in ore: demolizioni, impianti, finiture, tempistiche, costi per voce." },
      { icon: "Megaphone", title: "Campagne Outbound", description: "Contatta proprietari di immobili datati nella tua zona, propone ristrutturazione con incentivi. Lead costanti." },
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
    heroTitle: "Impresa Edile? L'Ufficio Si Mangia il Margine dei Cantieri.",
    heroSubtitle: "Telefonate, preventivi, rapportini, documenti: ore ogni giorno prima ancora di posare un mattone. L'AI ne automatizza la maggior parte.",
    stats: [
      { value: "60%", label: "Attività d'ufficio automatizzabili" },
      { value: "24/7", label: "Sistemi AI sempre attivi" },
      { value: "1", label: "Regia unica su lead, cantieri e margini" },
    ],
    problems: [
      { title: "Ufficio sommerso dal lavoro ripetitivo", description: "Telefono, preventivi, rapportini, amministrazione. Ore ogni giorno prima di vedere un euro di fatturato." },
      { title: "Gare e appalti: troppo tempo, pochi risultati", description: "Prepari documentazione per 10 gare, ne vinci 1. Il tempo investito non ha ROI." },
      { title: "Coordinamento subappaltatori caotico", description: "Telefonate, WhatsApp, email. Nessuno sa chi deve fare cosa e quando. Ritardi e costi extra." },
    ],
    solutions: [
      { title: "Agente Vocale + WhatsApp come Front-Office", description: "Gestisce chiamate, qualifica lead, fissa sopralluoghi, risponde su WhatsApp. Senza appesantire l'ufficio, H24." },
      { title: "Preventivi Automatici + Screening Gare", description: "L'AI genera preventivi da specifiche tecniche e analizza bandi di gara per segnalarti solo quelli vincibili." },
      { title: "Gestione Cantieri + Documenti Completa", description: "Coordina subappaltatori con notifiche AI, gestisce DDT, certificazioni, sicurezza cantiere. Zero caos." },
    ],
    services: [
      { icon: "Phone", title: "Agente Vocale AI", description: "Front-office completo: gestisce chiamate clienti, fornitori, subappaltatori. Smista per urgenza e tipo richiesta." },
      { icon: "MessageSquare", title: "WhatsApp AI", description: "Canale dedicato per aggiornamenti cantiere, coordinamento squadre, invio foto e documenti in tempo reale." },
      { icon: "HardHat", title: "Gestione Cantieri", description: "Dashboard multi-cantiere: scadenze, materiali, avanzamento, sicurezza. Notifiche automatiche a tutte le parti." },
      { icon: "FileText", title: "Gestione Documenti", description: "DDT, POS, PSC, certificazioni SOA, DURC. Tutto digitalizzato, scadenze monitorate, alert automatici." },
      { icon: "Calculator", title: "Preventivi Automatici", description: "Computi metrici automatici, listini integrati, preventivi multi-lotto. Da settimane a ore." },
      { icon: "Megaphone", title: "Campagne Outbound", description: "Contatta amministratori condominio, costruttori, studi tecnici. Presenta i tuoi servizi, genera pipeline." },
    ],
    roi: [
      { metric: "Tempo amministrativo", value: "-60%" },
      { metric: "Win rate gare", value: "+90%" },
      { metric: "Ritardi cantiere", value: "-45%" },
    ],
    caseStudy: {
      company: "Edil Futura Srl",
      location: "Bologna",
      quote: "Abbiamo tagliato €8K/mese di costi fissi e gestiamo il triplo dei cantieri. L'AI coordina tutto.",
      result: "-60% costi, +200% cantieri gestiti",
    },
    ctaLine: "Ogni ora che l'ufficio passa su carte e telefonate è margine tolto ai cantieri. Riprenditelo.",
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
      { title: "Agente Vocale Mentre Sei a Terra", description: "L'AI risponde mentre posi, raccoglie tipo pavimento, metratura, tempistiche. Tu richiami solo chi vale." },
      { title: "Preventivi Automatici + Qualifica Budget", description: "L'AI chiede budget e specifiche, genera preventivo con margine giusto. Basta lavori sottopagati." },
      { title: "WhatsApp AI + Campagne Recensioni", description: "Follow-up via WhatsApp, richiesta recensioni Google automatica. Più recensioni = più visibilità = più lavoro." },
    ],
    services: [
      { icon: "Phone", title: "Agente Vocale AI", description: "Risponde mentre posi: raccoglie tipo pavimento (gres, parquet, marmo), metratura, piano, tempistiche." },
      { icon: "MessageSquare", title: "WhatsApp AI", description: "Invia catalogo materiali, raccoglie foto ambiente, conferma appuntamenti. Chiede recensioni post-lavoro." },
      { icon: "HardHat", title: "Gestione Cantieri", description: "Pianifica lavori settimanali, coordina consegna materiali, notifica cliente su inizio e fine lavori." },
      { icon: "FileText", title: "Gestione Documenti", description: "DDT materiali, fatture, garanzie pavimenti. Archiviazione digitale, ricerca istantanea per cliente." },
      { icon: "Calculator", title: "Preventivi Automatici", description: "Da metratura e tipo pavimento a preventivo completo: materiale, massetto, posa, battiscopa, costo totale." },
      { icon: "Megaphone", title: "Campagne Outbound", description: "Contatta imprese di ristrutturazione, architetti, negozi ceramiche. Propone collaborazione continuativa." },
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
      { title: "Agente Vocale per Gestione Picchi", description: "L'AI gestisce 100 chiamate simultanee. Ogni cliente viene registrato, classificato per urgenza, richiamato." },
      { title: "WhatsApp AI per Triage e Foto Danni", description: "L'AI chiede foto del danno via WhatsApp, classifica urgenza, ti prepara prima del sopralluogo." },
      { title: "Gestione Cantieri + Preventivi per Urgenze", description: "Pianifica interventi urgenti vs programmati, genera preventivi rapidi da foto e descrizione danno." },
    ],
    services: [
      { icon: "Phone", title: "Agente Vocale AI", description: "Gestisce 100+ chiamate simultanee post-maltempo. Registra ogni richiesta, classifica per urgenza, prenota intervento." },
      { icon: "MessageSquare", title: "WhatsApp AI", description: "Raccoglie foto danni via WhatsApp, stima gravità, invia tempistiche intervento. Triage automatico." },
      { icon: "HardHat", title: "Gestione Cantieri", description: "Pianifica interventi urgenti e programmati su mappa, coordina squadre, ottimizza percorsi giornalieri." },
      { icon: "FileText", title: "Gestione Documenti", description: "Perizie danni, documentazione assicurativa, certificazioni impermeabilizzazione. Tutto digitalizzato." },
      { icon: "Calculator", title: "Preventivi Automatici", description: "Da foto danno e descrizione a preventivo rapido: tipo copertura, metratura stimata, materiali, costo." },
      { icon: "Megaphone", title: "Campagne Outbound", description: "Contatta proprietari zona per ispezioni preventive tetti, manutenzione grondaie. Lavoro costante tutto l'anno." },
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
      { title: "Agente Vocale H24 per Emergenze", description: "L'AI risponde di notte, valuta urgenza (tubo rotto vs rubinetto che gocciola), prenota intervento prioritario." },
      { title: "WhatsApp AI + Recall Manutenzione", description: "Richiama ogni cliente a scadenza caldaia/impianto via WhatsApp. Rinnovi automatici senza sforzo." },
      { title: "Preventivi Automatici + Gestione Documenti", description: "Genera preventivi da tipo intervento, gestisce libretti impianto, certificazioni F-Gas, garanzie." },
    ],
    services: [
      { icon: "Phone", title: "Agente Vocale AI", description: "Pronto intervento H24: valuta urgenza, classifica tipo problema, prenota intervento. Risponde anche alle 3 di notte." },
      { icon: "MessageSquare", title: "WhatsApp AI", description: "Recall manutenzione caldaie, invio promemoria tagliandi, raccolta foto problemi per pre-diagnosi." },
      { icon: "HardHat", title: "Gestione Cantieri", description: "Pianifica interventi giornalieri, ottimizza percorsi, coordina consegna materiali e ricambi." },
      { icon: "FileText", title: "Gestione Documenti", description: "Libretti impianto, certificazioni F-Gas, rapporti di intervento, garanzie. Scadenze monitorate automaticamente." },
      { icon: "Calculator", title: "Preventivi Automatici", description: "Da tipo intervento (caldaia, bagno, riscaldamento) a preventivo: materiali, manodopera, tempistiche, costo." },
      { icon: "Megaphone", title: "Campagne Outbound", description: "Chiama clienti con caldaie in scadenza revisione, propone contratti manutenzione annuali. Ricavi ricorrenti." },
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
      { title: "Agente Vocale Tecnico Specializzato", description: "L'AI risponde, capisce tipo intervento (nuovo impianto, manutenzione, emergenza), raccoglie dati tecnici e prenota." },
      { title: "WhatsApp AI + Gestione Documenti", description: "Raccoglie planimetrie via WhatsApp, gestisce DiCo/DiRi, reminder scadenze conformità ai clienti." },
      { title: "Preventivi Automatici + Outbound", description: "Genera preventivi da specifiche tecniche, contatta condomini e imprese per proporre verifiche impianti." },
    ],
    services: [
      { icon: "Phone", title: "Agente Vocale AI", description: "Receptionist tecnico: capisce tipo intervento, raccoglie kW, numero punti luce, tipo impianto. Qualifica e prenota." },
      { icon: "MessageSquare", title: "WhatsApp AI", description: "Raccoglie planimetrie e foto quadri elettrici, invia preventivi, reminder scadenze conformità." },
      { icon: "HardHat", title: "Gestione Cantieri", description: "Pianifica interventi multi-cantiere, coordina forniture cavi e materiali, traccia avanzamento." },
      { icon: "FileText", title: "Gestione Documenti", description: "DiCo, DiRi, certificazioni conformità, schemi impianto. Generazione automatica, archivio digitale." },
      { icon: "Calculator", title: "Preventivi Automatici", description: "Da planimetria e specifiche a preventivo: punti luce, prese, quadro, canalizzazioni, costo dettagliato." },
      { icon: "Megaphone", title: "Campagne Outbound", description: "Contatta amministratori condominio per verifiche impianti, aziende per manutenzione programmata." },
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
      { title: "Agente Vocale + WhatsApp per Lead Online", description: "L'AI gestisce ogni richiesta online e telefonica, qualifica il cliente, spiega il valore del lavoro professionale." },
      { title: "Preventivi Automatici con Educazione al Valore", description: "L'AI genera preventivi dettagliati spiegando ogni voce. Il cliente capisce perché il lavoro vale quel prezzo." },
      { title: "Campagne Outbound + Gestione Cantieri", description: "Chiama imprese di ristrutturazione per collaborazioni, gestisce planning lavori settimanale. Zero mesi vuoti." },
    ],
    services: [
      { icon: "Phone", title: "Agente Vocale AI", description: "Gestisce richieste: tipo lavoro (controsoffitto, pareti, isolamento), metratura, altezze, finiture. Qualifica budget." },
      { icon: "MessageSquare", title: "WhatsApp AI", description: "Invia portfolio lavori, raccoglie foto ambienti, preventivi rapidi. Educa il cliente sul valore artigianale." },
      { icon: "HardHat", title: "Gestione Cantieri", description: "Pianifica lavori settimanali, coordina consegna lastre e profili, notifica cliente su inizio/fine lavori." },
      { icon: "FileText", title: "Gestione Documenti", description: "Schede tecniche materiali, certificazioni acustiche/termiche, DDT, fatture. Tutto digitalizzato." },
      { icon: "Calculator", title: "Preventivi Automatici", description: "Da metratura e tipo lavoro a preventivo: struttura, lastre, stuccatura, pittura, dettaglio per voce." },
      { icon: "Megaphone", title: "Campagne Outbound", description: "Contatta imprese di ristrutturazione, architetti, interior designer. Propone collaborazione continuativa." },
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
    heroTitle: "Architetto, Ingegnere, Geometra? Passi Più Tempo su Telefono e Carte che sul Progetto.",
    heroSubtitle: "Non progettiamo al posto tuo: ti diamo l'AI che filtra le richieste, legge capitolati, imposta computi e relazioni, crea i render per il committente e tiene aggiornato il cantiere. Il progetto e la firma restano tuoi.",
    stats: [
      { value: "€8K", label: "Valore medio progetto" },
      { value: "4h/gg", label: "Spese in comunicazione" },
      { value: "€48K", label: "Valore tempo perso/anno" },
    ],
    problems: [
      { title: "Telefonate che interrompono il lavoro", description: "Stai progettando, il telefono suona. Perdi concentrazione. Ci metti 20 minuti a riprendere il filo." },
      { title: "Richieste generiche e perditempo", description: "'Quanto costa ristrutturare?' Domande vaghe che richiedono 30 minuti di conversazione per capire che non c'è budget." },
      { title: "Gestione cantiere a distanza", description: "Devi coordinare imprese, aggiornare il cliente, gestire varianti. Tutto via telefono e email. Caos." },
      { title: "Ore perse su carte e documenti", description: "Capitolati da leggere, computi da impostare, relazioni da scrivere da zero. Lavoro necessario che ruba giornate alla progettazione." },
      { title: "Il committente non riesce a immaginare il progetto", description: "Tavole e descrizioni non bastano: il cliente rimanda le decisioni e le varianti si moltiplicano." },
    ],
    solutions: [
      { title: "Agente Vocale come Filtro Intelligente", description: "L'AI risponde, capisce tipo progetto, verifica budget e tempistiche. Ti passa solo i clienti con progetti reali." },
      { title: "WhatsApp AI + Gestione Cantieri", description: "Aggiornamenti cantiere automatici via WhatsApp con foto e avanzamento. Zero telefonate di aggiornamento." },
      { title: "Documenti Tecnici + Render + Preventivi", description: "Sintesi di capitolati, bozze di computi e relazioni, render AI per il committente e preventivi di onorario. Tu rivedi e firmi." },
    ],
    services: [
      { icon: "Phone", title: "Agente Vocale AI", description: "Filtro intelligente: capisce tipo progetto, dimensione, budget. Ti passa solo chi ha un incarico vero da affidare." },
      { icon: "MessageSquare", title: "WhatsApp AI", description: "Aggiornamenti cantiere con foto ai committenti, raccolta documenti da imprese, comunicazioni DL." },
      { icon: "HardHat", title: "Gestione Cantieri", description: "Coordinamento imprese esecutrici, verbali avanzamento, gestione varianti e SAL. Report automatici." },
      { icon: "FileText", title: "Pratiche e Documenti", description: "Raccolta documenti e bozze per CILA, SCIA, permessi e pratiche catastali, con scadenze sotto controllo. Firma e responsabilità restano del professionista." },
      { icon: "Calculator", title: "Preventivi di Onorario", description: "Da brief del committente a proposta economica: fasi, tempistiche, onorari, spese tecniche. Professionale in minuti." },
      { icon: "Image", title: "Render AI per il Committente", description: "Dalla foto dello stato di fatto, varianti fotorealistiche di facciate, interni, bagni e coperture per far decidere il committente." },
      { icon: "Megaphone", title: "Campagne Outbound", description: "Contatta costruttori, imprese, proprietari immobili per proporre servizi di progettazione e DL." },
      { icon: "FileSearch", title: "Capitolati e Relazioni AI", description: "Lettura automatica di capitolati, tavole e PDF, bozze di relazioni tecniche e supporto ai computi metrici. Sempre rivisti e firmati da te." },
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
    ctaLine: "Il tuo tempo vale €100/ora. Quante ore stai regalando a telefonate, perditempo e documenti da scrivere da zero?",
  },
];


/** Servizi in più per ogni scheda: l'offerta oggi va oltre l'agente vocale (gare, render, sicurezza, cantiere, BIM). */
const EXTRA_SERVICES: Record<string, ServiceItem[]> = {
  "artigiani-micro-imprese": [
    { icon: "Calculator", title: "Preventivo da Nota Vocale", description: "Detti misure e lavorazioni in cantiere: il preventivo si prepara sul tuo listino e parte al cliente su WhatsApp." },
  ],
  "piccole-imprese": [
    { icon: "BarChart3", title: "Margini per Commessa", description: "Costi, ore e fatture incrociati ogni settimana: sai dove guadagni e dove perdi prima che sia tardi." },
  ],
  "medie-imprese": [
    { icon: "Gavel", title: "Gare d'Appalto AI", description: "Bandi filtrati per categorie e zone, requisiti verificati, checklist di gara e bozze di offerta tecnica." },
    { icon: "ShieldCheck", title: "Sicurezza e Scadenze", description: "DURC, formazione, visite mediche e documenti dei subappaltatori sotto controllo, con solleciti automatici." },
  ],
  "grandi-aziende-general-contractor": [
    { icon: "Gavel", title: "Gare d'Appalto AI", description: "Monitoraggio bandi, analisi partecipo/non partecipo, sintesi di disciplinare e capitolato, bozze di offerta tecnica e analisi prezzi." },
    { icon: "ShieldCheck", title: "Sicurezza e Conformità", description: "Bozze di POS, scadenzario e verifica documentale dei subappaltatori su tutti i cantieri." },
    { icon: "Package", title: "Cantiere e Acquisti", description: "Previsione dei ritardi, avanzamento da foto, ordini in base al cronoprogramma, DDT e fatture controllati sugli ordini." },
  ],
  "serramentisti-infissi": [
    { icon: "Image", title: "Render AI Infissi", description: "Il cliente vede i nuovi infissi e le persiane sulla sua facciata prima di firmare." },
  ],
  "installatori-fotovoltaico": [
    { icon: "Image", title: "Render AI Tetto e Pannelli", description: "Il cliente vede l'impianto sul suo tetto, con pannelli integrati nella copertura reale." },
    { icon: "ShieldCheck", title: "Sicurezza e Scadenze", description: "Lavori in quota, formazione, DURC e documenti delle squadre sempre in regola." },
  ],
  "imprese-ristrutturazione": [
    { icon: "Image", title: "Render AI Interni e Facciate", description: "Bagni, stanze, pavimenti e facciate mostrati sulla foto reale per far decidere prima il cliente." },
    { icon: "Package", title: "Cantiere e Acquisti", description: "Materiali ordinati in base all'avanzamento, bolle e fatture controllate sugli ordini." },
  ],
  "imprese-edili-generali": [
    { icon: "Gavel", title: "Gare d'Appalto AI", description: "Bandi adatti alla tua impresa, requisiti verificati, checklist documentale e bozze di offerta tecnica." },
    { icon: "ShieldCheck", title: "Sicurezza e Conformità", description: "Bozze di POS, scadenzario sicurezza e documenti dei subappaltatori sotto controllo." },
    { icon: "Package", title: "Cantiere e Acquisti", description: "Ritardi previsti in anticipo, avanzamento da foto, ordini e magazzino allineati ai cantieri." },
  ],
  "posatori-pavimentisti": [
    { icon: "Image", title: "Render AI Pavimenti", description: "Gres, parquet, marmo o resina visti nella stanza del cliente, con pattern di posa e fughe." },
  ],
  "lattonieri-coperture": [
    { icon: "Image", title: "Render AI Coperture", description: "Nuovo manto, gronde e lucernari mostrati sulla foto del tetto del cliente." },
    { icon: "ShieldCheck", title: "Sicurezza Lavori in Quota", description: "Formazione, attestati e documenti delle squadre sempre aggiornati, con avvisi prima delle scadenze." },
  ],
  "impianti-idraulici-termici": [
    { icon: "ShieldCheck", title: "Scadenze e Certificazioni", description: "Patentini, formazione, DURC e documenti di conformità sotto controllo, con avvisi automatici." },
  ],
  "impianti-elettrici": [
    { icon: "ShieldCheck", title: "Scadenze e Certificazioni", description: "Abilitazioni, formazione, DURC e documenti per le dichiarazioni di conformità sempre in ordine." },
  ],
  "cartongessisti-finiture": [
    { icon: "Image", title: "Render AI Stanze", description: "Controsoffitti, pareti e finiture mostrati sulla foto reale dell'ambiente." },
    { icon: "Megaphone", title: "Marketing AI Locale", description: "Contenuti per Google e social, recensioni gestite, follow-up dopo ogni preventivo." },
  ],
  "progettisti-studi-tecnici": [
    { icon: "Box", title: "Supporto AI al BIM", description: "Quantità estratte dai modelli, controlli di coerenza e documentazione per i capitolati informativi." },
    { icon: "Gavel", title: "Gare e Concorsi", description: "Sintesi di bandi di progettazione e concorsi con requisiti, scadenze e documenti da preparare." },
  ],
};

perChiECategories.forEach((c) => {
  const extra = EXTRA_SERVICES[c.slug];
  if (extra) c.services.push(...extra);
});

export const dimensioneCategories = perChiECategories.filter(c => c.group === "dimensione");
export const settoreCategories = perChiECategories.filter(c => c.group === "settore");
