import heroAgentiVocali from "@/assets/blog/hero-agenti-vocali.jpg";
import heroSerramenti from "@/assets/blog/hero-serramenti.jpg";
import heroPreventivi from "@/assets/blog/hero-preventivi.jpg";
import heroFotovoltaico from "@/assets/blog/hero-fotovoltaico.jpg";
import heroCostiOperativi from "@/assets/blog/hero-costi-operativi.jpg";
import heroCallCenter from "@/assets/blog/hero-call-center.jpg";

export interface BlogStat {
  label: string;
  value: string;
}

export interface BlogSection {
  heading: string;
  content: string;
  type?: "text" | "stats" | "comparison" | "example";
  image?: string;
  imageAlt?: string;
  stats?: BlogStat[];
  callout?: string;
}

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  dateModified?: string;
  readTime: string;
  category: "Vocale" | "Operativo" | "Guide";
  tags: string[];
  heroImage: string;
  heroImageAlt: string;
  sections: BlogSection[];
}

export const blogPosts: BlogPost[] = [
  {
    slug: "agenti-vocali-ai-edilizia",
    title: "Come gli Agenti Vocali AI Stanno Rivoluzionando l'Edilizia",
    description: "Scopri come gli agenti vocali AI stanno trasformando il settore edile italiano: dalla gestione chiamate alla qualificazione lead automatica.",
    date: "2025-06-15",
    dateModified: "2025-06-20",
    readTime: "8 min",
    category: "Vocale",
    tags: ["agenti vocali", "AI edilizia", "automazione"],
    heroImage: heroAgentiVocali,
    heroImageAlt: "Ufficio di impresa edile con dashboard AI per la gestione chiamate e lead",
    sections: [
      {
        heading: "Il problema: chiamate perse e opportunità sfumate",
        content: "Nel settore edile italiano, si stima che il **35-40% delle chiamate** in ingresso vada perso. Ogni chiamata persa è un potenziale cliente che si rivolge alla concorrenza. Per un'impresa di serramenti che riceve 50 chiamate al giorno, questo significa perdere fino a 20 opportunità commerciali quotidiane.\n\nIl problema è strutturale: gli artigiani e i titolari d'impresa sono spesso in cantiere, in sopralluogo o impegnati in riunioni. Non possono rispondere al telefono in tempo reale, e un messaggio in segreteria raramente viene richiamato con la stessa urgenza.",
        type: "text",
        callout: "💡 Esempio pratico: Un serramentista di Vicenza riceveva 45 chiamate/giorno. Ne perdeva 18. Con un agente vocale AI, oggi risponde al 100% — e ha aumentato i preventivi del 35% in soli 2 mesi."
      },
      {
        heading: "Cosa sono gli agenti vocali AI per l'edilizia",
        content: "Un agente vocale AI è un assistente telefonico intelligente che risponde alle chiamate 24/7 con una voce naturale in italiano. A differenza dei vecchi sistemi IVR (\"premi 1 per...\"), un agente vocale AI è in grado di:\n\n• Comprendere il linguaggio naturale del chiamante\n• Rispondere a domande specifiche su servizi e disponibilità\n• Qualificare il lead raccogliendo informazioni chiave (tipo di lavoro, budget, urgenza)\n• Fissare appuntamenti direttamente in agenda\n• Inviare un riepilogo via WhatsApp o email al titolare\n\nIl tutto senza che il cliente percepisca di parlare con una macchina.",
        type: "text"
      },
      {
        heading: "Risultati concreti: i numeri del settore",
        content: "Le imprese edili che hanno adottato agenti vocali AI riportano risultati significativi. Questi numeri non sorprendono: nel settore edile, la velocità di risposta è il fattore #1 nella scelta del fornitore. Chi risponde per primo, vince il preventivo.",
        type: "stats",
        stats: [
          { label: "Lead qualificati", value: "+40%" },
          { label: "Tempo gestione telefonica", value: "-60%" },
          { label: "Tasso di conversione", value: "+25%" },
          { label: "ROI medio (primo trimestre)", value: "5x" }
        ]
      },
      {
        heading: "Come implementare un agente vocale nella tua impresa",
        content: "L'implementazione di un agente vocale AI con Edilizia.io richiede solo 3 step:\n\n**1. Configurazione (30 minuti):** Definisci il tuo settore, i servizi offerti e le domande di qualificazione. Il sistema genera automaticamente il prompt ottimale per il tuo business.\n\n**2. Attivazione numero:** Ricevi un numero dedicato o trasferisci le chiamate dal tuo numero esistente. L'agente è operativo in meno di 24 ore.\n\n**3. Monitoraggio e ottimizzazione:** Dashboard in tempo reale con transcript delle chiamate, lead qualificati e analytics. Ottimizza continuamente le performance dell'agente.",
        type: "example",
        callout: "🏗️ Caso reale: L'impresa edile \"Costruzioni Bianchi\" di Torino ha configurato il suo agente AI in 25 minuti. Il giorno dopo ha ricevuto 3 lead qualificati che si sono trasformati in 2 contratti da €45.000 totali."
      },
      {
        heading: "Il futuro dell'edilizia è conversazionale",
        content: "L'intelligenza artificiale vocale non è una moda passeggera: è il futuro della comunicazione nel settore edile. Le imprese che adottano oggi questa tecnologia costruiscono un vantaggio competitivo duraturo.\n\nCon costi a partire da **€0,10/minuto** e nessun vincolo contrattuale, il rischio è zero. Il costo di NON adottare un agente vocale AI — in termini di chiamate perse e clienti sfumati — è molto più alto.",
        type: "text"
      }
    ]
  },
  {
    slug: "intelligenza-artificiale-serramenti",
    title: "Intelligenza Artificiale per Serramentisti: Guida Completa",
    description: "Guida completa all'uso dell'intelligenza artificiale per serramentisti e aziende di infissi: dalla gestione clienti alla preventivazione automatica.",
    date: "2025-06-10",
    dateModified: "2025-06-18",
    readTime: "10 min",
    category: "Guide",
    tags: ["serramenti", "infissi", "AI", "guida"],
    heroImage: heroSerramenti,
    heroImageAlt: "Showroom moderno di serramenti e infissi con tecnologia digitale integrata",
    sections: [
      {
        heading: "Perché i serramentisti hanno bisogno dell'AI",
        content: "Il settore dei serramenti e infissi sta vivendo una trasformazione profonda. Con l'aumento della domanda legata ai bonus edilizi e alla riqualificazione energetica, le aziende di serramenti si trovano a gestire volumi di richieste senza precedenti.\n\nIl problema? La maggior parte delle aziende di infissi è strutturata per gestire 10-15 richieste al giorno, ma ne riceve **30-50**. Il risultato è un collo di bottiglia nella gestione commerciale che porta a tempi di risposta lunghi, preventivi ritardati e clienti che scelgono la concorrenza.",
        type: "text"
      },
      {
        heading: "5 applicazioni AI per il settore infissi",
        content: "**1. Risposta automatica alle richieste di preventivo**\nUn agente AI può raccogliere tutte le informazioni necessarie per un preventivo (dimensioni, tipo di infisso, materiale, accessori) direttamente al telefono, riducendo i tempi di preventivazione del 70%.\n\n**2. Qualificazione lead automatica**\nNon tutte le richieste meritano un sopralluogo. L'AI filtra i lead per budget, urgenza e tipo di intervento, permettendoti di concentrarti sui clienti più promettenti.\n\n**3. Follow-up intelligente**\nIl 60% dei preventivi viene accettato dopo il secondo o terzo contatto. L'AI gestisce automaticamente i follow-up, richiamando i clienti al momento giusto.\n\n**4. Gestione post-vendita**\nAssistenza tecnica, programmazione manutenzioni e gestione garanzie — tutto automatizzato.\n\n**5. Analisi predittiva della domanda**\nPrevisione dei picchi di richieste per ottimizzare l'approvvigionamento materiali e la pianificazione installazioni.",
        type: "text"
      },
      {
        heading: "Case study: Serramenti Rossi — da 12 a 45 preventivi/settimana",
        content: "Serramenti Rossi, un'azienda di infissi con 8 dipendenti in provincia di Brescia, ha implementato un agente vocale AI Edilizia.io a gennaio 2025.",
        type: "stats",
        stats: [
          { label: "Preventivi/settimana (prima)", value: "12" },
          { label: "Preventivi/settimana (dopo)", value: "45" },
          { label: "Tempo medio risposta", value: "4 min" },
          { label: "Tasso conversione", value: "+78%" }
        ],
        callout: "📣 Il titolare Marco Rossi: \"L'agente AI ha cambiato il nostro modo di lavorare. Ora non perdiamo più nessuna chiamata e i clienti sono impressionati dalla velocità di risposta.\""
      },
      {
        heading: "Come iniziare: guida passo-passo",
        content: "**Step 1 — Analisi del flusso attuale:** Quante chiamate ricevi? Quante ne perdi? Qual è il tuo tempo medio di risposta?\n\n**Step 2 — Configurazione dell'agente:** Con Edilizia.io, il setup per serramentisti è pre-configurato. L'agente conosce già la terminologia del settore (PVC, alluminio, legno-alluminio, triplo vetro, Uw, etc.).\n\n**Step 3 — Periodo di test:** 30 giorni di prova con garanzia soddisfatti o rimborsati. Zero rischi.\n\n**Step 4 — Ottimizzazione continua:** Analizza i report settimanali e affina le risposte dell'agente per massimizzare le conversioni.",
        type: "example",
        callout: "🔧 Suggerimento: Inizia configurando l'agente con le 10 domande più frequenti che ricevi al telefono. Il sistema impara e migliora automaticamente con ogni conversazione."
      }
    ]
  },
  {
    slug: "automazione-preventivi-edilizia",
    title: "Automazione Preventivi nell'Edilizia: Risparmiare Tempo e Chiudere Più Contratti",
    description: "Come automatizzare la preventivazione nel settore edile con l'AI: riduzione tempi del 70% e aumento del tasso di chiusura contratti.",
    date: "2025-06-05",
    dateModified: "2025-06-12",
    readTime: "7 min",
    category: "Operativo",
    tags: ["preventivi", "automazione", "edilizia", "efficienza"],
    heroImage: heroPreventivi,
    heroImageAlt: "Impresario edile che utilizza software di preventivazione automatica su tablet in cantiere",
    sections: [
      {
        heading: "Il collo di bottiglia della preventivazione edile",
        content: "Nel settore edile, la preventivazione è il processo più critico e più inefficiente. Un titolare d'impresa spende in media **8-12 ore a settimana** nella preparazione di preventivi, molti dei quali non si trasformeranno mai in contratti.\n\nIl ciclo tipico è: sopralluogo → calcolo materiali → calcolo manodopera → margine → presentazione al cliente → negoziazione → revisione. Ogni step richiede tempo, attenzione e competenza specifica.",
        type: "text"
      },
      {
        heading: "Come l'AI trasforma il processo di preventivazione",
        content: "L'intelligenza artificiale non sostituisce l'esperienza del preventivista, ma la amplifica:\n\n• **Raccolta dati automatica:** L'agente vocale raccoglie al telefono tutte le specifiche del lavoro (metrature, materiali, tempistiche), eliminando la necessità di richiamare il cliente per chiarimenti.\n\n• **Pre-compilazione preventivo:** Basandosi sui dati raccolti e sui prezzi storici, il sistema genera una bozza di preventivo in pochi secondi.\n\n• **Analisi competitiva:** L'AI confronta il tuo preventivo con i range di prezzo di mercato, suggerendo aggiustamenti per massimizzare competitività e margine.\n\n• **Follow-up automatizzato:** Dopo l'invio del preventivo, l'AI richiama il cliente dopo 48-72 ore per raccogliere feedback e gestire obiezioni.",
        type: "text"
      },
      {
        heading: "ROI dell'automazione preventivi: i numeri",
        content: "Un'impresa edile media che gestisce 20 preventivi a settimana può aspettarsi risultati significativi già dal primo mese.\n\nConsiderando un costo dell'agente AI di circa **€200/mese**, il ROI si raggiunge tipicamente entro la prima settimana di utilizzo.",
        type: "stats",
        stats: [
          { label: "Tempo risparmiato", value: "-70%" },
          { label: "Velocità risposta", value: "Stesso giorno" },
          { label: "Tasso di chiusura", value: "+87%" },
          { label: "Fatturato incrementale/anno", value: "+€300k" }
        ],
        callout: "💰 Esempio concreto: Un'impresa di ristrutturazioni di Milano che gestiva 25 preventivi/settimana ha risparmiato 7 ore/settimana e aumentato il fatturato di €280.000 nel primo anno."
      },
      {
        heading: "Integrazione con i tuoi strumenti esistenti",
        content: "Edilizia.io si integra con i principali strumenti utilizzati nel settore edile:\n\n• **CRM:** Salesforce, HubSpot, Pipedrive e CRM di settore\n• **Calendario:** Google Calendar, Outlook per la pianificazione sopralluoghi\n• **WhatsApp Business:** Invio automatico di conferme e riepiloghi\n• **Software di preventivazione:** Esportazione dati in formato compatibile con i principali software di computo metrico\n\nL'integrazione avviene tramite webhook e API, senza necessità di competenze tecniche.",
        type: "text"
      }
    ]
  },
  {
    slug: "ai-fotovoltaico-vendite",
    title: "Come l'AI Aumenta le Vendite nel Fotovoltaico del 40%",
    description: "Strategie AI per installatori di impianti fotovoltaici: dalla qualificazione lead alla chiusura contratti, con risultati misurabili.",
    date: "2025-05-28",
    dateModified: "2025-06-08",
    readTime: "9 min",
    category: "Vocale",
    tags: ["fotovoltaico", "vendite", "AI", "lead generation"],
    heroImage: heroFotovoltaico,
    heroImageAlt: "Installazione pannelli fotovoltaici su tetto residenziale italiano con tecnici al lavoro",
    sections: [
      {
        heading: "Il mercato fotovoltaico italiano: opportunità e sfide",
        content: "Il mercato fotovoltaico italiano sta vivendo un boom senza precedenti. Con gli incentivi fiscali, la crescente consapevolezza ambientale e l'aumento dei costi energetici, la domanda di impianti fotovoltaici è cresciuta del **150% negli ultimi 2 anni**.\n\nMa con l'aumento della domanda arriva anche l'aumento della competizione. Oggi, un potenziale cliente che cerca un installatore fotovoltaico contatta in media 4-5 aziende. Vince chi risponde per primo con informazioni chiare e un preventivo rapido.",
        type: "text"
      },
      {
        heading: "Perché la velocità di risposta è cruciale nel fotovoltaico",
        content: "I dati del settore sono inequivocabili: la velocità di risposta è il fattore determinante per chiudere un contratto nel fotovoltaico. Un agente vocale AI risponde in meno di 1 secondo, raccoglie subito le informazioni chiave e fissa un sopralluogo in tempo reale.",
        type: "stats",
        stats: [
          { label: "Clienti che scelgono il primo a rispondere", value: "78%" },
          { label: "Tempo medio risposta settore", value: "72 ore" },
          { label: "Conversione con risposta < 5 min", value: "21x" },
          { label: "Risposta agente AI", value: "< 1 sec" }
        ]
      },
      {
        heading: "L'AI nel ciclo di vendita fotovoltaico",
        content: "**Fase 1 — Primo contatto e qualificazione**\nL'agente AI risponde alla chiamata, presenta i vantaggi del fotovoltaico personalizzati sul profilo del chiamante e qualifica il lead con domande mirate.\n\n**Fase 2 — Stima preliminare**\nBasandosi sui dati raccolti, l'AI fornisce una stima di massima dell'impianto e del risparmio annuo, aumentando l'engagement del cliente.\n\n**Fase 3 — Pianificazione sopralluogo**\nL'agente fissa il sopralluogo in base alla disponibilità reale del team tecnico, eliminando i conflitti di calendario.\n\n**Fase 4 — Follow-up post-sopralluogo**\nDopo il sopralluogo, l'AI ricontatta il cliente per raccogliere impressioni, rispondere a dubbi e accelerare la decisione.",
        type: "example",
        callout: "☀️ Caso studio: SolarTech Verona ha chiuso 12 impianti in più nei primi 3 mesi con l'agente AI — un incremento del 44% sul periodo precedente, con un ROI di 15x sull'investimento."
      },
      {
        heading: "Risultati: +40% di vendite in 90 giorni",
        content: "Gli installatori fotovoltaici che utilizzano Edilizia.io registrano risultati eccezionali.\n\nCon un investimento medio di **€200-400/mese**, il ritorno è immediato: basta 1 impianto in più al mese per coprire 10 volte il costo dell'agente AI.",
        type: "stats",
        stats: [
          { label: "Contratti chiusi", value: "+40%" },
          { label: "Costo acquisizione cliente", value: "-55%" },
          { label: "Ore liberate/giorno", value: "+3.2h" },
          { label: "NPS (soddisfazione)", value: "+18 punti" }
        ]
      }
    ]
  },
  {
    slug: "ridurre-costi-operativi-impresa-edile",
    title: "5 Modi per Ridurre i Costi Operativi nella Tua Impresa Edile con l'AI",
    description: "Guida pratica per ridurre i costi operativi della tua impresa edile usando l'intelligenza artificiale: 5 strategie con ROI misurabile.",
    date: "2025-05-20",
    dateModified: "2025-06-01",
    readTime: "6 min",
    category: "Operativo",
    tags: ["costi operativi", "impresa edile", "efficienza", "AI"],
    heroImage: heroCostiOperativi,
    heroImageAlt: "Team di impresa edile in riunione per analizzare la riduzione dei costi operativi con grafici",
    sections: [
      {
        heading: "I costi nascosti che stanno erodendo i tuoi margini",
        content: "Le imprese edili italiane operano con margini sempre più sottili. Tra aumento dei costi delle materie prime, difficoltà nel reperire manodopera qualificata e pressione sui prezzi da parte dei clienti, ogni inefficienza pesa sul bilancio.\n\nMa i costi più insidiosi sono quelli che non si vedono: le ore spese al telefono, i preventivi non seguiti, i sopralluoghi inutili, la mancata pianificazione che genera tempi morti in cantiere. Questi **\"costi invisibili\"** possono rappresentare il **15-25% del fatturato**.",
        type: "text"
      },
      {
        heading: "1. Automazione della gestione telefonica",
        content: "**Costo attuale:** Un receptionist/segretaria dedicato costa €1.800-€2.500/mese tra stipendio, contributi e TFR.\n\n**Con l'AI:** Un agente vocale gestisce illimitate chiamate simultanee, 24/7, a €200-400/mese.\n\nMa il vero risparmio non è sul costo del personale: è sulle opportunità commerciali che non perdi più. Ogni chiamata persa = un preventivo in meno = **€5.000-€50.000** di fatturato potenziale sfumato.",
        type: "stats",
        stats: [
          { label: "Risparmio annuo", value: "€18-25k" },
          { label: "Chiamate gestite", value: "Illimitate" }
        ],
        callout: "📞 Confronto diretto: Receptionist (€2.200/mese, lun-ven 9-18) vs. Agente AI (€300/mese, 24/7/365, chiamate illimitate). Risultato: -86% costi, +100% copertura."
      },
      {
        heading: "2. Qualificazione lead automatica",
        content: "**Il problema:** Il 40% dei sopralluoghi non si trasforma in contratto perché il lead non era qualificato (budget insufficiente, tempistiche incompatibili, tipo di lavoro fuori target).\n\n**Con l'AI:** L'agente vocale qualifica ogni lead prima del sopralluogo, raccogliendo budget, urgenza, tipo di intervento e aspettative. Solo i lead qualificati arrivano al tuo team commerciale.\n\n**Risparmio:** 2-3 sopralluoghi inutili in meno a settimana × €150/sopralluogo = **€15.000-€23.000/anno**",
        type: "text"
      },
      {
        heading: "3. Follow-up sistematico sui preventivi",
        content: "**Il problema:** Solo il 20% dei preventivi inviati riceve un follow-up entro 72 ore. Il resto viene \"dimenticato\" nel caos quotidiano.\n\n**Con l'AI:** Follow-up automatico via telefono a 48h, 1 settimana e 2 settimane dall'invio del preventivo. L'AI gestisce le obiezioni più comuni e riporta feedback dettagliato.\n\n**Impatto:** Aumento del tasso di chiusura dal 15% al 25-30%, che su 100 preventivi/mese da €10.000 medi equivale a **+€100.000-€150.000** di fatturato annuo.",
        type: "example",
        callout: "📊 Esempio: Un'impresa di Padova ha aumentato il tasso di chiusura dal 16% al 29% semplicemente con il follow-up automatizzato — senza cambiare nulla altro nel processo commerciale."
      },
      {
        heading: "4. Reportistica operai automatizzata",
        content: "**Il problema:** Raccogliere i rapportini di fine giornata dagli operai è un'operazione che richiede 30-60 minuti al giorno al capocantiere.\n\n**Con l'AI:** Un agente vocale chiama ogni operaio a fine turno, raccoglie il rapportino vocale (ore lavorate, materiali usati, problemi riscontrati) e genera un report strutturato.\n\n**Risparmio:** 1-2 ore/giorno × 220 giorni lavorativi = **300+ ore/anno** liberate per attività a valore aggiunto.",
        type: "text"
      },
      {
        heading: "5. Gestione assistenze e manutenzioni",
        content: "**Il problema:** Le richieste di assistenza post-vendita sono imprevedibili, urgenti e interrompono il lavoro programmato.\n\n**Con l'AI:** L'agente vocale prende in carico la segnalazione, valuta l'urgenza, fornisce indicazioni immediate (se possibile) e pianifica l'intervento nel primo slot disponibile.\n\n**Risparmio:** Riduzione del 40% delle uscite urgenti non pianificate e miglioramento della customer satisfaction (+30% NPS).",
        type: "text"
      }
    ]
  },
  {
    slug: "call-center-ai-ristrutturazioni",
    title: "Call Center AI per Ristrutturazioni: Mai Più Chiamate Perse",
    description: "Come un call center AI dedicato alle ristrutturazioni gestisce le chiamate 24/7, qualifica i lead e prenota sopralluoghi in automatico.",
    date: "2025-05-12",
    dateModified: "2025-05-25",
    readTime: "7 min",
    category: "Vocale",
    tags: ["call center", "ristrutturazioni", "AI", "chiamate"],
    heroImage: heroCallCenter,
    heroImageAlt: "Call center AI per ristrutturazioni con interfaccia digitale e cuffie su scrivania moderna",
    sections: [
      {
        heading: "Il paradosso delle imprese di ristrutturazione",
        content: "Le imprese di ristrutturazione vivono un paradosso: hanno troppo lavoro per rispondere al telefono, ma se non rispondono al telefono non avranno lavoro domani.\n\nIl titolare è in cantiere dalle 7 alle 18. La segretaria (quando c'è) gestisce anche contabilità, fornitori e burocrazia. Le chiamate dei nuovi clienti competono con quelle dei clienti in corso, dei fornitori e dei subappaltatori.\n\nRisultato: il **30-50% delle nuove richieste** va perso. E con esse, decine di migliaia di euro di fatturato potenziale.",
        type: "text"
      },
      {
        heading: "Come funziona un call center AI per ristrutturazioni",
        content: "Un call center AI dedicato alle ristrutturazioni è molto più di un semplice risponditore automatico. È un sistema intelligente progettato specificamente per il settore.\n\n**Risposta immediata 24/7:** Ogni chiamata viene gestita entro 1 secondo, anche alle 22 di sera o la domenica mattina.\n\n**Qualificazione intelligente:** L'AI pone le domande giuste per capire il tipo di intervento, il budget, l'urgenza e la zona geografica.\n\n**Booking automatico:** L'agente fissa direttamente il sopralluogo nel calendario del tecnico disponibile, considerando zona e competenze.\n\n**Report in tempo reale:** Il titolare riceve un riepilogo via WhatsApp dopo ogni chiamata, con tutti i dati del potenziale cliente.",
        type: "text",
        callout: "🏠 Come funziona in pratica: Il cliente chiama → l'AI risponde con voce naturale → raccoglie tipo di ristrutturazione, metratura, budget → fissa sopralluogo → invia riepilogo al titolare via WhatsApp. Tutto in 3-4 minuti."
      },
      {
        heading: "I vantaggi rispetto a un call center tradizionale",
        content: "Il confronto tra un call center AI e un call center tradizionale per imprese di ristrutturazione è impietoso. L'AI vince su ogni parametro: costi, disponibilità, qualità e scalabilità.",
        type: "stats",
        stats: [
          { label: "Costo/mese (vs. tradizionale)", value: "€300 vs €2.500" },
          { label: "Disponibilità", value: "24/7/365" },
          { label: "Chiamate simultanee", value: "Illimitate" },
          { label: "Errori trascrizione dati", value: "< 2%" }
        ]
      },
      {
        heading: "Risultati reali: imprese che hanno fatto il cambio",
        content: "Le imprese di ristrutturazione che sono passate a un call center AI riportano risultati consistenti.\n\nIl dato più sorprendente? La **customer satisfaction** è più alta con l'AI che con operatori umani. I clienti apprezzano la velocità di risposta, la disponibilità 24/7 e la precisione nella raccolta informazioni.",
        type: "stats",
        stats: [
          { label: "Richieste gestite/mese", value: "+120%" },
          { label: "Lead qualificati", value: "+65%" },
          { label: "Costo per lead", value: "-72%" },
          { label: "Sopralluoghi fissati/settimana", value: "+8" }
        ],
        callout: "⭐ Testimonianza: \"Da quando usiamo il call center AI, non perdiamo più una chiamata. Il sabato e la domenica riceviamo il 25% delle nostre richieste — prima le perdevamo tutte.\" — Giuseppe M., impresa edile Roma"
      }
    ]
  }
];

export const blogCategories = ["Tutti", "Vocale", "Operativo", "Guide"];
