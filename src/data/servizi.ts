import type { LucideIcon } from "lucide-react";
import { BarChart3, Compass, Cpu, FileText, Gavel, GraduationCap, HardHat, Image, Lightbulb, Megaphone, ShieldCheck, Workflow } from "lucide-react";

export interface Servizio {
  slug: string;
  icon: LucideIcon;
  categoria: "Su misura" | "Consulenza" | "Soluzioni AI";
  titolo: string;
  /** Etichetta corta per indici e menu. */
  breve: string;
  sintesi: string;
  perChi: string;
  cosaFacciamo: string[];
  risultato: string;
  link?: { label: string; href: string };
}

/**
 * Elenco unico dei servizi: lo usano la sezione in Home e la pagina /servizi.
 * Edilizia.io NON fa progettazione edilizia: sviluppa sistemi AI che aiutano
 * imprese e tecnici (architetti, ingegneri, geometri) a fare il loro lavoro.
 */
export const SERVIZI: Servizio[] = [
  {
    slug: "automazione-ai",
    icon: Workflow,
    categoria: "Soluzioni AI",
    titolo: "Automazione AI dei processi",
    breve: "Automazione AI",
    sintesi: "Agenti AI che si occupano del lavoro ripetitivo: telefono, WhatsApp, rapportini, assistenze e pratiche.",
    perChi: "Imprese edili, serramentisti, installatori e studi tecnici che perdono tempo dietro a richieste e passaggi ripetitivi.",
    cosaFacciamo: [
      "Agenti vocali che rispondono 24/7, qualificano e fissano appuntamenti",
      "WhatsApp AI per clienti, squadre e aggiornamenti di cantiere",
      "Rapportini operai, assistenze e garanzie gestiti in automatico",
      "Pratiche ENEA, GSE, CILA e SCIA preparate e tenute sotto controllo",
    ],
    risultato: "Nessuna chiamata persa, meno passaggi a mano e un team che lavora sulle cose che contano.",
    link: { label: "Vedi le soluzioni di automazione", href: "/soluzioni" },
  },
  {
    slug: "preventivazione-ai",
    icon: FileText,
    categoria: "Soluzioni AI",
    titolo: "Preventivazione AI",
    breve: "Preventivazione AI",
    sintesi: "Preventivi, computi e stime preparati dall'AI con i tuoi listini, il tuo formato e i tuoi margini.",
    perChi: "Uffici commerciali e tecnici che passano ore su preventivi, computi e confronto delle offerte.",
    cosaFacciamo: [
      "Preventivi da nota vocale, foto o testo, sul tuo listino",
      "Computo metrico e stima preliminare da planimetrie e misure",
      "Confronto automatico delle offerte dei fornitori",
      "Richiamo dei preventivi scaduti e non chiusi",
    ],
    risultato: "Preventivi professionali in minuti invece che in ore, con i margini sempre sotto controllo.",
    link: { label: "Vedi il preventivatore AI", href: "/soluzioni" },
  },
  {
    slug: "render-ai",
    icon: Image,
    categoria: "Soluzioni AI",
    titolo: "Render AI fotorealistici",
    breve: "Render AI",
    sintesi: "Da una foto dello stato di fatto, il cliente vede il lavoro finito: infissi, bagno, facciata, pavimenti, persiane, stanze e tetti.",
    perChi: "Imprese che vogliono chiudere più trattative e progettisti che devono presentare le varianti al committente.",
    cosaFacciamo: [
      "7 moduli: infissi, bagno, facciata, persiane, pavimento, stanza, tetto",
      "Varianti di materiali, colori e finiture in pochi minuti",
      "Confronto prima/dopo sulla foto reale dell'immobile",
      "Render condivisibili via WhatsApp, email o PDF",
    ],
    risultato: "Il cliente decide prima, perché vede il risultato e non deve immaginarlo.",
    link: { label: "Vedi i render AI", href: "/soluzioni" },
  },
  {
    slug: "ai-per-progettisti",
    icon: Compass,
    categoria: "Soluzioni AI",
    titolo: "AI per architetti, ingegneri e geometri",
    breve: "AI per progettisti",
    sintesi: "Non progettiamo al posto tuo: ti diamo l'AI che toglie le ore di carte, telefonate e documenti, così hai più tempo per il progetto.",
    perChi: "Studi di architettura e ingegneria, geometri, direttori lavori e uffici tecnici d'impresa.",
    cosaFacciamo: [
      "Agente vocale che filtra le richieste e passa solo gli incarichi veri",
      "Lettura di capitolati, bandi e PDF con sintesi dei punti critici",
      "Bozze di computi, relazioni tecniche e documentazione nel tuo formato",
      "Supporto BIM: quantità e controlli dai modelli, render e aggiornamenti al committente",
    ],
    risultato: "Ore recuperate ogni settimana. Il progetto e la firma restano sempre tuoi.",
    link: { label: "Scopri la pagina per i progettisti", href: "/per-chi-e/progettisti-studi-tecnici" },
  },
  {
    slug: "controllo-e-analisi",
    icon: BarChart3,
    categoria: "Soluzioni AI",
    titolo: "Controllo margini, amministrazione e analisi",
    breve: "Controllo e analisi",
    sintesi: "L'AI incrocia costi, avanzamento, fatture e vendite e ti dice in tempo dove stai guadagnando, dove no e cosa sta per scadere.",
    perChi: "Titolari e direzione che vogliono numeri chiari ogni settimana, non a fine anno.",
    cosaFacciamo: [
      "Margine di ogni commessa aggiornato in tempo reale",
      "Report commerciali su lead, preventivi e chiusure",
      "Avvisi quando una commessa va fuori budget",
      "Scadenzario di incassi e pagamenti, con previsione di cassa",
    ],
    risultato: "Decisioni prese sui numeri, prima che il problema diventi una perdita.",
    link: { label: "Vedi le soluzioni di analisi", href: "/soluzioni" },
  },
  {
    slug: "gare-e-appalti-ai",
    icon: Gavel,
    categoria: "Soluzioni AI",
    titolo: "Gare d'appalto con l'AI",
    breve: "Gare e appalti",
    sintesi: "Dal monitoraggio dei bandi alla documentazione di gara: l'AI legge, verifica e prepara, il tuo ufficio gare decide e firma.",
    perChi: "Imprese che partecipano a gare pubbliche e private, general contractor e studi tecnici che seguono le offerte.",
    cosaFacciamo: [
      "Monitoraggio dei bandi adatti alle tue categorie e alla tua zona",
      "Analisi di requisiti e convenienza per decidere se partecipare",
      "Sintesi di disciplinare e capitolato con checklist dei documenti",
      "Bozze di offerta tecnica e analisi prezzi, sempre riviste da voi",
    ],
    risultato: "Più gare valutate con lo stesso ufficio, meno esclusioni per un documento dimenticato.",
  },
  {
    slug: "sicurezza-e-conformita-ai",
    icon: ShieldCheck,
    categoria: "Soluzioni AI",
    titolo: "Sicurezza e conformità di cantiere",
    breve: "Sicurezza e conformità",
    sintesi: "Documenti di sicurezza, scadenze di imprese e lavoratori e controlli in cantiere tenuti in ordine dall'AI.",
    perChi: "Imprese edili, general contractor, coordinatori della sicurezza e RSPP.",
    cosaFacciamo: [
      "Bozze di POS e documenti di sicurezza da verificare dal tecnico",
      "Scadenzario di DURC, formazione, visite mediche e attestati",
      "Verifica documentale di subappaltatori e fornitori",
      "Controlli da foto in cantiere, nel rispetto di privacy e Statuto dei lavoratori",
    ],
    risultato: "Documenti sempre aggiornati e nessuna scadenza scoperta all'ultimo momento.",
  },
  {
    slug: "cantiere-e-acquisti-ai",
    icon: HardHat,
    categoria: "Soluzioni AI",
    titolo: "Cantiere, acquisti e magazzino",
    breve: "Cantiere e acquisti",
    sintesi: "Cronoprogramma, avanzamento, ordini e materiali: l'AI collega cantiere e ufficio acquisti e segnala i problemi prima che costino.",
    perChi: "Imprese con più cantieri aperti, capicantiere, uffici acquisti e magazzini.",
    cosaFacciamo: [
      "Previsione dei ritardi sul cronoprogramma",
      "Avanzamento lavori dalle foto e dai rapportini",
      "Ordini materiali in base all'avanzamento e ai tempi di consegna",
      "Lettura automatica di DDT e fatture fornitori, con controllo sugli ordini",
    ],
    risultato: "Cantieri che non si fermano per un materiale mancante e acquisti sempre allineati alle commesse.",
  },
  {
    slug: "marketing-e-vendite-ai",
    icon: Megaphone,
    categoria: "Soluzioni AI",
    titolo: "Marketing e acquisizione clienti",
    breve: "Marketing AI",
    sintesi: "Contenuti, campagne, recensioni e follow-up commerciali preparati con l'AI per portare più richieste qualificate.",
    perChi: "Imprese e studi tecnici che vogliono più contatti dal web e un commerciale che non perde nessuno.",
    cosaFacciamo: [
      "Testi di annunci, post e pagine pensati per il tuo mercato locale",
      "Risposte alle recensioni Google e richiesta di recensioni ai clienti soddisfatti",
      "Follow-up automatici dopo sopralluogo e preventivo",
      "Analisi di quali canali portano clienti veri",
    ],
    risultato: "Più richieste dal web e nessun contatto lasciato senza risposta.",
  },
  {
    slug: "progettazione-sistemi-ai",
    icon: Cpu,
    categoria: "Su misura",
    titolo: "Sistemi AI su misura",
    breve: "Sistemi su misura",
    sintesi: "Quando serve qualcosa di specifico, progettiamo e sviluppiamo il sistema AI attorno ai tuoi processi e ai tuoi dati.",
    perChi: "Aziende e studi che vogliono un sistema loro, collegato agli strumenti che usano già.",
    cosaFacciamo: [
      "Mappatura dei processi di ufficio, studio e cantiere",
      "Progetto del sistema AI: dati, flussi, chi fa cosa",
      "Sviluppo di agenti e automazioni dedicate",
      "Collegamento a EdiliziaInCloud o al tuo gestionale, email, Excel, cartelle e WhatsApp",
    ],
    risultato: "Un sistema AI cucito sulla tua realtà, che lavora con i tuoi listini, documenti e modelli.",
  },
  {
    slug: "consulenza-ai",
    icon: Lightbulb,
    categoria: "Consulenza",
    titolo: "Consulenza strategica sull'AI",
    breve: "Consulenza AI",
    sintesi: "Ti aiutiamo a capire dove l'AI rende davvero, quanto costa e in che ordine introdurla.",
    perChi: "Titolari d'impresa e di studio che vogliono decidere con numeri alla mano, prima di investire.",
    cosaFacciamo: [
      "Analisi dei processi e dei costi attuali",
      "Individuazione delle attività da automatizzare",
      "Piano di introduzione con priorità e tempi",
      "Stima del ritorno economico per ogni intervento",
    ],
    risultato: "Una roadmap chiara: cosa fare subito, cosa dopo e cosa non conviene fare.",
  },
  {
    slug: "formazione-e-affiancamento",
    icon: GraduationCap,
    categoria: "Consulenza",
    titolo: "Formazione e affiancamento",
    breve: "Formazione",
    sintesi: "Insegniamo al tuo team a usare l'AI ogni giorno e restiamo al tuo fianco dopo l'avvio.",
    perChi: "Imprese e studi che vogliono rendere autonomo il personale con gli strumenti AI.",
    cosaFacciamo: [
      "Formazione pratica per ufficio, tecnici, commerciali e progettisti",
      "Guide e procedure scritte sui vostri casi reali",
      "Assistenza continuativa e miglioramenti mensili",
      "Verifica periodica dei risultati ottenuti",
    ],
    risultato: "Un team che usa l'AI con sicurezza e un sistema che migliora mese dopo mese.",
  },
];

export const METODO = [
  {
    n: "01",
    titolo: "Analisi",
    testo: "Una prima consulenza gratuita per capire come lavori oggi, dove perdi tempo e dove l'AI può fare la differenza.",
  },
  {
    n: "02",
    titolo: "Progetto",
    testo: "Ti presentiamo il progetto del sistema: cosa fa, con quali dati, quanto costa e quanto ti fa risparmiare.",
  },
  {
    n: "03",
    titolo: "Sviluppo e avvio",
    testo: "Costruiamo il sistema, lo colleghiamo ai tuoi strumenti e lo mettiamo in funzione, di solito in pochi giorni.",
  },
  {
    n: "04",
    titolo: "Affiancamento",
    testo: "Formiamo il team, misuriamo i risultati e miglioriamo il sistema nel tempo.",
  },
];

export const FAQ_SERVIZI = [
  {
    q: "Quanto costa?",
    a: "Non abbiamo un listino: ogni progetto è diverso. Dopo la consulenza gratuita ti presentiamo il progetto con costi, tempi e risparmio atteso, e decidi tu se partire.",
  },
  {
    q: "Devo cambiare il gestionale o i programmi che uso?",
    a: "No. Progettiamo il sistema AI sopra gli strumenti che usi già: gestionale, Excel, cartelle condivise, email e WhatsApp. Se cerchi anche un gestionale, il nostro gruppo ha EdiliziaInCloud, a cui i sistemi si collegano direttamente.",
  },
  {
    q: "Lavorate anche con architetti, ingegneri e geometri?",
    a: "Sì. Non facciamo progettazione al posto vostro: forniamo a studi di architettura, ingegneria e geometri gli strumenti AI per capitolati, computi, relazioni, render, filtro delle richieste e direzione lavori. Il progetto e la firma restano del professionista.",
  },
  {
    q: "Quanto tempo serve per partire?",
    a: "Dopo la consulenza iniziale e l'approvazione del progetto, il primo sistema è operativo di solito in circa 7 giorni.",
  },
  {
    q: "La consulenza iniziale è a pagamento?",
    a: "La prima analisi è gratuita: serve a capire se e dove l'AI conviene davvero alla tua azienda.",
  },
  {
    q: "I miei dati restano riservati?",
    a: "Sì. I dati della tua azienda vengono usati solo per far funzionare il tuo sistema e non vengono condivisi con altre aziende.",
  },
];
