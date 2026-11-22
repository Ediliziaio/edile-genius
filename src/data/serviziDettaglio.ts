/**
 * Contenuti delle pagine /servizi/:slug. Lo slug coincide con SERVIZI (src/data/servizi.ts).
 * Regole: nessun prezzo (non c'è listino), nessuna progettazione edilizia al posto dei tecnici,
 * EdiliziaInCloud è il gestionale del gruppo a cui i sistemi si collegano.
 */

export interface Blocco {
  titolo: string;
  testo: string;
}

export interface ServizioDettaglio {
  slug: string;
  seoTitle: string;
  seoDescription: string;
  eyebrow: string;
  heroTitolo: string;
  heroEvidenza: string;
  heroSottotitolo: string;
  problemi: Blocco[];
  capacita: Blocco[];
  passi: Blocco[];
  perChi: string[];
  /** id delle soluzioni in src/data/solutions.ts da mostrare come esempi. */
  soluzioni: number[];
  faq: { q: string; a: string }[];
  /** Mostra la fascia EdiliziaInCloud (servizi che vivono sopra il gestionale). */
  eic?: boolean;
}

export const SERVIZI_DETTAGLIO: ServizioDettaglio[] = [
  {
    slug: "automazione-ai",
    seoTitle: "Automazione AI per Imprese Edili e Studi Tecnici | Edilizia.io",
    seoDescription:
      "Agenti vocali che rispondono 24/7, WhatsApp AI, rapportini, assistenze e pratiche automatizzate per imprese edili, serramentisti, installatori e studi tecnici.",
    eyebrow: "Automazione AI",
    heroTitolo: "Il lavoro ripetitivo lo fa l'AI.",
    heroEvidenza: "Il tuo team si occupa dei clienti.",
    heroSottotitolo:
      "Telefonate, messaggi WhatsApp, rapportini, assistenze, pratiche: agenti AI che lavorano 24 ore su 24 dentro i tuoi processi, collegati agli strumenti che usi già.",
    problemi: [
      { titolo: "Chiamate senza risposta", testo: "L'ufficio è al telefono, in pausa o in cantiere. Il cliente chiama il concorrente e il preventivo è perso." },
      { titolo: "Messaggi e richieste sparsi ovunque", testo: "WhatsApp, email, telefono: le informazioni arrivano da mille canali e qualcosa si perde sempre." },
      { titolo: "Ore di lavoro d'ufficio ripetitivo", testo: "Rapportini da ricopiare, assistenze da smistare, pratiche da rincorrere. Tempo tolto al lavoro che conta." },
    ],
    capacita: [
      { titolo: "Agente vocale 24/7", testo: "Risponde con voce naturale in italiano, qualifica la richiesta (lavoro, misure, budget, tempi) e fissa il sopralluogo in agenda." },
      { titolo: "Passaggio a una persona quando serve", testo: "Se la richiesta esce dal suo ambito, trasferisce la chiamata a te o al commerciale, oppure fissa un richiamo." },
      { titolo: "WhatsApp AI", testo: "Risponde ai clienti, raccoglie foto e documenti, manda aggiornamenti di cantiere e promemoria." },
      { titolo: "Rapportini dal cantiere", testo: "Ore, materiali e foto inviati dal capocantiere via WhatsApp diventano un rapportino ordinato per commessa." },
      { titolo: "Assistenze e garanzie", testo: "Le richieste post-vendita vengono classificate per urgenza, assegnate al tecnico giusto e seguite fino alla chiusura." },
      { titolo: "Pratiche sotto controllo", testo: "Raccolta documenti e scadenze per ENEA, GSE, CILA e SCIA. La firma resta sempre del professionista." },
    ],
    passi: [
      { titolo: "Mappiamo i passaggi ripetitivi", testo: "Guardiamo insieme dove si perde tempo: telefono, messaggi, documenti, cantiere." },
      { titolo: "Configuriamo gli agenti", testo: "Script, domande di qualifica, regole di passaggio a una persona, collegamento a calendario e CRM." },
      { titolo: "Test su casi reali", testo: "Proviamo gli agenti su telefonate e richieste tipiche del tuo lavoro prima di accenderli." },
      { titolo: "Avvio e miglioramento", testo: "Il sistema parte e ogni settimana rivediamo conversazioni e risultati per migliorarlo." },
    ],
    perChi: ["Serramentisti e infissi", "Installatori fotovoltaico", "Imprese di ristrutturazione", "Imprese edili", "Impiantisti", "Studi tecnici"],
    soluzioni: [1, 19, 15, 17, 12, 13],
    faq: [
      {
        q: "I clienti capiscono che parlano con un'AI?",
        a: "L'agente parla in italiano naturale, con pause e tono conversazionale, e gestisce interruzioni e cambi di argomento. Se il cliente lo chiede, l'agente dice di essere un assistente digitale: la trasparenza viene prima di tutto.",
      },
      {
        q: "E se il cliente fa una domanda che l'AI non sa gestire?",
        a: "L'agente è configurato per passare la chiamata a te o al tuo commerciale quando la richiesta esce dal suo ambito. In alternativa prende nota e fissa un richiamo: il cliente non si perde.",
      },
      {
        q: "Posso ascoltare le chiamate?",
        a: "Sì. Ogni chiamata viene registrata e trascritta, con il riepilogo della richiesta e il livello di qualifica del contatto.",
      },
      {
        q: "Si collega ai miei strumenti?",
        a: "Sì: calendario, email, WhatsApp, CRM, Excel ed EdiliziaInCloud, il gestionale del nostro gruppo. Non devi cambiare il modo in cui lavori.",
      },
    ],
    eic: true,
  },
  {
    slug: "preventivazione-ai",
    seoTitle: "Preventivazione AI per l'Edilizia — Preventivi, Computi e Offerte | Edilizia.io",
    seoDescription:
      "Preventivi da nota vocale, foto o testo sul tuo listino, computo metrico e stima preliminare, confronto offerte fornitori e richiamo dei preventivi scaduti.",
    eyebrow: "Preventivazione AI",
    heroTitolo: "Preventivi pronti in minuti,",
    heroEvidenza: "con i tuoi listini e i tuoi margini.",
    heroSottotitolo:
      "L'AI prepara preventivi, computi e stime partendo da una nota vocale, una foto o un rilievo. Tu controlli, correggi e invii: il lavoro di battitura lo fa lei.",
    problemi: [
      { titolo: "Serate passate a fare preventivi", testo: "Misure, listini, sconti, IVA, descrizioni: ogni preventivo porta via ore, spesso dopo il cantiere." },
      { titolo: "Margini che si scoprono dopo", testo: "Un listino non aggiornato o uno sconto di troppo, e la commessa parte già in perdita." },
      { titolo: "Preventivi inviati e dimenticati", testo: "Nessuno richiama chi non ha risposto. Il cliente firma con chi si è fatto sentire per primo." },
    ],
    capacita: [
      { titolo: "Preventivo da voce, foto o testo", testo: "Detti le misure in cantiere o mandi una foto: l'AI imposta il preventivo con le voci del tuo listino." },
      { titolo: "I tuoi listini, sempre aggiornati", testo: "Listini in Excel o CSV importati con prezzi, varianti e accessori. Funziona per serramenti, porte, persiane, fotovoltaico, impianti e ristrutturazioni." },
      { titolo: "IVA e detrazioni guidate", testo: "Poche domande su intervento, edificio e cliente, e il preventivo applica l'aliquota corretta." },
      { titolo: "Computo e stima preliminare", testo: "Da planimetrie e misure, una bozza di computo metrico con range di costo, da usare come base tecnica." },
      { titolo: "Confronto offerte fornitori", testo: "Le offerte vengono lette e messe a confronto su prezzo, tempi e condizioni, con un riepilogo per decidere." },
      { titolo: "Richiamo dei preventivi aperti", testo: "Chi non ha risposto viene ricontattato al momento giusto, per telefono o WhatsApp." },
    ],
    passi: [
      { titolo: "Carichiamo listini e modelli", testo: "Importiamo i tuoi listini, le condizioni e il formato del tuo preventivo." },
      { titolo: "Impostiamo le regole", testo: "Margini minimi, sconti massimi, aliquote, voci obbligatorie: il sistema le rispetta sempre." },
      { titolo: "Prove sui preventivi veri", testo: "Rifacciamo con l'AI preventivi che hai già fatto, per verificare che i conti tornino." },
      { titolo: "Uso quotidiano", testo: "I commerciali preparano preventivi da telefono o computer; tu vedi tutto e approvi." },
    ],
    perChi: ["Serramentisti e infissi", "Installatori fotovoltaico", "Imprese di ristrutturazione", "Imprese edili", "Uffici tecnici d'impresa"],
    soluzioni: [2, 11, 16, 4, 6],
    faq: [
      {
        q: "Posso caricare i listini dei miei fornitori?",
        a: "Sì, in Excel o CSV. Il sistema importa prezzi, varianti e accessori e li tiene aggiornati.",
      },
      {
        q: "Funziona solo per i serramenti?",
        a: "No. Funziona per qualsiasi prodotto o lavorazione edile: serramenti, porte, persiane, tende, fotovoltaico, climatizzazione, ristrutturazioni. Basta configurare il catalogo.",
      },
      {
        q: "I miei commerciali riusciranno a usarlo?",
        a: "Se sanno usare WhatsApp, sanno usare il preventivatore. È pensato per chi lavora in cantiere, non per informatici.",
      },
      {
        q: "Posso allegare un render al preventivo?",
        a: "Sì: con il servizio Render AI, il render del lavoro finito si allega al PDF del preventivo.",
      },
    ],
    eic: true,
  },
  {
    slug: "render-ai",
    seoTitle: "Render AI Fotorealistici per l'Edilizia — Infissi, Bagni, Facciate | Edilizia.io",
    seoDescription:
      "Render AI da una foto dello stato di fatto: infissi, bagno, facciata, persiane, pavimento, stanza e tetto. Per imprese che vogliono chiudere più trattative e progettisti che presentano le varianti.",
    eyebrow: "Render AI",
    heroTitolo: "Il cliente vede il lavoro finito",
    heroEvidenza: "prima ancora di firmare.",
    heroSottotitolo:
      "Scatti una foto, scegli materiali e colori, e in pochi secondi mostri il risultato sulla casa vera del cliente. Sette moduli, dagli infissi al tetto.",
    problemi: [
      { titolo: "Il cliente non riesce a immaginare", testo: "Un campione di colore e un catalogo PDF non bastano: il cliente rimanda la decisione." },
      { titolo: "Trattative giocate solo sul prezzo", testo: "Se il cliente non vede la differenza tra le proposte, sceglie quella che costa meno." },
      { titolo: "Render tradizionali lenti", testo: "Un render fatto a mano richiede giorni. Nel frattempo il cliente ha già parlato con altri." },
    ],
    capacita: [
      { titolo: "Infissi e persiane", testo: "Riconosce finestre, porte e oscuranti e li sostituisce mantenendo prospettiva, luce e ombre." },
      { titolo: "Bagno e stanze", testo: "Restyling leggero, rifacimento completo o sostituzione di singoli elementi, sulla foto reale." },
      { titolo: "Facciate e cappotto", testo: "Intonaci, colori, rivestimenti e cappotto visti sull'edificio del cliente." },
      { titolo: "Pavimenti", testo: "Gres, parquet, marmo o resina con pattern di posa, fughe e luce della stanza." },
      { titolo: "Tetti e coperture", testo: "Coppi, tegole, lamiera, ardesia, gronde, lucernari e pannelli solari integrati." },
      { titolo: "Prima/dopo da condividere", testo: "Confronto con cursore, esportazione in PDF e invio via WhatsApp o email." },
    ],
    passi: [
      { titolo: "Foto dello stato di fatto", testo: "Anche dal telefono, durante il sopralluogo." },
      { titolo: "Scelta di materiali e colori", testo: "Dal tuo catalogo o da quelli dei produttori che tratti." },
      { titolo: "Render in pochi secondi", testo: "Più varianti da mostrare subito, sul tablet o sul telefono." },
      { titolo: "Allegato al preventivo", testo: "Il render entra nel PDF del preventivo e resta al cliente." },
    ],
    perChi: ["Serramentisti", "Imprese di ristrutturazione", "Posatori e pavimentisti", "Coperture e lattonieri", "Architetti e interior designer"],
    soluzioni: [21, 22, 23, 24, 25, 26, 27],
    faq: [
      {
        q: "I render sono abbastanza realistici da mostrare al cliente?",
        a: "Sì, per la fase di vendita e di scelta sono più che sufficienti. Non sostituiscono un render 3D fatto a mano per un progetto esecutivo, ma li hai in pochi secondi invece che in giorni.",
      },
      {
        q: "Posso usarlo durante l'appuntamento?",
        a: "È pensato proprio per questo: scatti la foto, scegli il prodotto e mostri il render sul tablet o sul telefono, davanti al cliente.",
      },
      {
        q: "Funziona anche per interni e facciate?",
        a: "Sì. Ci sono moduli per infissi, bagno, facciata, persiane, pavimento, stanza e tetto, ciascuno con opzioni dedicate.",
      },
      {
        q: "Lo possono usare anche gli architetti?",
        a: "Sì: è utile per presentare le varianti al committente nelle prime fasi. Il progetto resta del professionista, il render aiuta a decidere prima.",
      },
    ],
  },
  {
    slug: "ai-per-progettisti",
    seoTitle: "AI per Architetti, Ingegneri e Geometri — Strumenti per Studi Tecnici | Edilizia.io",
    seoDescription:
      "Strumenti AI per studi tecnici: filtro delle richieste, sintesi di capitolati e bandi, bozze di computi e relazioni, render per il committente, aggiornamenti in direzione lavori. Il progetto e la firma restano tuoi.",
    eyebrow: "AI per progettisti",
    heroTitolo: "Più tempo per il progetto,",
    heroEvidenza: "meno tempo su telefono e carte.",
    heroSottotitolo:
      "Non progettiamo al posto tuo. Ti diamo gli strumenti AI che filtrano le richieste, leggono i documenti, impostano computi e relazioni e tengono aggiornato il committente. Il progetto e la firma restano sempre tuoi.",
    problemi: [
      { titolo: "Telefonate che interrompono il lavoro", testo: "Stai progettando, il telefono suona per una richiesta generica. Perdi il filo e mezz'ora di lavoro." },
      { titolo: "Giornate sulle carte", testo: "Capitolati, bandi, computi, relazioni da scrivere da zero: lavoro necessario che toglie tempo al progetto." },
      { titolo: "Committente da aggiornare di continuo", testo: "Varianti, avanzamento, decisioni: tutto passa da telefono ed email, e ogni richiesta interrompe." },
    ],
    capacita: [
      { titolo: "Filtro delle richieste", testo: "Un agente vocale risponde a nome dello studio, capisce intervento, tempi e budget e ti passa solo gli incarichi concreti." },
      { titolo: "Sintesi di capitolati e bandi", testo: "Requisiti, voci, quantità e scadenze estratti dai PDF, con i punti critici da verificare." },
      { titolo: "Bozze di computi", testo: "Una prima impostazione del computo metrico da tavole, rilievi e prezzari, da completare e verificare." },
      { titolo: "Bozze di relazioni e documentazione", testo: "Relazioni tecniche e descrizioni nel formato del tuo studio, partendo da appunti, foto e note vocali." },
      { titolo: "Render per il committente", testo: "Varianti fotorealistiche dalla foto dello stato di fatto, per far decidere prima." },
      { titolo: "Supporto alla direzione lavori", testo: "Foto e note dal cantiere ordinate per commessa, bozze di verbali e aggiornamenti periodici al committente." },
      { titolo: "Supporto BIM", testo: "Estrazione di quantità dai modelli, controlli di coerenza e organizzazione della documentazione richiesta dai capitolati informativi." },
      { titolo: "Gare e concorsi", testo: "Sintesi di bandi di progettazione e concorsi, con requisiti, scadenze e documenti da preparare." },
    ],
    passi: [
      { titolo: "Ascoltiamo come lavora lo studio", testo: "Pratiche ricorrenti, modelli, documenti, flusso delle richieste." },
      { titolo: "Scegliamo da dove partire", testo: "Di solito filtro delle chiamate e documenti: i due punti dove si recupera più tempo." },
      { titolo: "Configuriamo sui tuoi modelli", testo: "Formati, intestazioni, stile delle relazioni, prezzari di riferimento." },
      { titolo: "Affiancamento", testo: "Ti seguiamo nelle prime settimane e miglioriamo gli strumenti sui casi reali." },
    ],
    perChi: ["Studi di architettura", "Studi di ingegneria", "Geometri", "Direttori lavori", "Uffici tecnici d'impresa", "Interior designer"],
    soluzioni: [28, 29, 30, 31, 32, 45],
    faq: [
      {
        q: "Fate progettazione edilizia?",
        a: "No. Edilizia.io sviluppa sistemi di intelligenza artificiale. Il progetto, le scelte tecniche e la firma restano sempre del professionista: l'AI prepara bozze e sintesi che tu verifichi.",
      },
      {
        q: "Le bozze sono affidabili?",
        a: "Sono un punto di partenza, non un documento finito. Servono a togliere la pagina bianca e il lavoro di battitura; il controllo e la responsabilità restano tuoi.",
      },
      {
        q: "Posso usare i modelli del mio studio?",
        a: "Sì. Configuriamo gli strumenti sui tuoi formati, intestazioni e modo di scrivere, così le bozze escono già nel tuo stile.",
      },
      {
        q: "I documenti dei miei clienti restano riservati?",
        a: "Sì. I documenti servono solo a far funzionare gli strumenti del tuo studio e non vengono condivisi con altri.",
      },
    ],
  },
  {
    slug: "controllo-e-analisi",
    seoTitle: "Controllo Margini e Analisi con l'AI per Imprese Edili | Edilizia.io",
    seoDescription:
      "Margine di ogni commessa in tempo reale, report commerciali su lead e preventivi, avvisi quando una commessa va fuori budget e riepilogo settimanale per il titolare.",
    eyebrow: "Controllo e analisi",
    heroTitolo: "Sai dove guadagni ogni settimana,",
    heroEvidenza: "non a fine anno.",
    heroSottotitolo:
      "L'AI incrocia costi, avanzamento dei lavori e vendite e ti avvisa in tempo quando una commessa o un canale commerciale non stanno rendendo.",
    problemi: [
      { titolo: "Margini scoperti a dicembre", testo: "Il commercialista ti dice a fine anno che tre commesse erano in perdita. Troppo tardi per intervenire." },
      { titolo: "Dati sparsi in mille fogli", testo: "Costi in un file, ore in un altro, vendite nel CRM. Mettere insieme i numeri porta via giorni." },
      { titolo: "Decisioni prese a sensazione", testo: "Quale canale porta clienti veri? Quale commerciale chiude? Senza numeri chiari si va a intuito." },
    ],
    capacita: [
      { titolo: "Margine per commessa", testo: "Costi di materiali, manodopera e subappalti confrontati con il preventivo, commessa per commessa." },
      { titolo: "Avvisi fuori budget", testo: "Quando una commessa supera la soglia che decidi tu, ricevi un avviso con il motivo." },
      { titolo: "Report commerciali", testo: "Lead, preventivi, chiusure e tempi di risposta, per canale e per commerciale." },
      { titolo: "Riepilogo settimanale", testo: "Ogni settimana un riassunto chiaro per il titolare: cosa va bene, cosa no, cosa fare." },
      { titolo: "Fatture e scadenze", testo: "Fatture fornitori lette in automatico, scadenzario di incassi e pagamenti e solleciti ai clienti in ritardo." },
      { titolo: "Previsione di cassa", testo: "Entrate e uscite previste nelle prossime settimane, per non avere sorprese." },
    ],
    passi: [
      { titolo: "Colleghiamo le fonti", testo: "Gestionale, fogli di calcolo, CRM, rapportini: i dati che hai già." },
      { titolo: "Definiamo gli indicatori", testo: "Margini, soglie e numeri che contano davvero per la tua azienda." },
      { titolo: "Report e avvisi", testo: "Impostiamo cosa ricevi, quando e in che forma." },
      { titolo: "Revisione periodica", testo: "Controlliamo insieme che i numeri tornino e affiniamo gli indicatori." },
    ],
    perChi: ["Titolari d'impresa", "Direzione e amministrazione", "General contractor", "Imprese con più cantieri aperti"],
    soluzioni: [18, 20, 42],
    faq: [
      {
        q: "Devo inserire i dati a mano?",
        a: "No: il sistema legge i dati dalle fonti che usi già, come gestionale, fogli di calcolo, CRM e rapportini.",
      },
      {
        q: "Funziona con EdiliziaInCloud?",
        a: "Sì. EdiliziaInCloud, il gestionale del nostro gruppo, contiene già cantieri, costi e fatture: l'analisi AI lavora direttamente su quei dati.",
      },
      {
        q: "Chi vede i report?",
        a: "Decidi tu: titolare, direzione, responsabili di cantiere o commerciali, ognuno con i numeri che gli servono.",
      },
    ],
    eic: true,
  },
  {
    slug: "gare-e-appalti-ai",
    seoTitle: "AI per le Gare d'Appalto in Edilizia — Bandi, Requisiti, Offerta Tecnica | Edilizia.io",
    seoDescription:
      "Monitoraggio dei bandi, analisi di requisiti e convenienza, sintesi di disciplinare e capitolato, checklist documentale, bozze di offerta tecnica e analisi prezzi per imprese edili e studi tecnici.",
    eyebrow: "Gare e appalti",
    heroTitolo: "Più gare valutate, meno esclusioni,",
    heroEvidenza: "con lo stesso ufficio gare.",
    heroSottotitolo:
      "L'AI trova i bandi giusti, legge disciplinari e capitolati, controlla i requisiti e prepara le bozze. Il tuo ufficio gare decide, verifica e firma: la responsabilità dell'offerta resta vostra.",
    problemi: [
      { titolo: "Bandi trovati tardi o mai", testo: "Le gare adatte escono su piattaforme diverse e ogni giorno. Controllarle tutte a mano è impossibile." },
      { titolo: "Centinaia di pagine da leggere", testo: "Disciplinare, capitolato, allegati, chiarimenti: per capire se conviene partecipare servono giorni." },
      { titolo: "Esclusioni per un dettaglio", testo: "Una dichiarazione mancante o un requisito letto male, e mesi di lavoro finiscono fuori gara." },
    ],
    capacita: [
      { titolo: "Monitoraggio bandi", testo: "Ricerca quotidiana delle gare per categorie, importi e zone che ti interessano, con avviso solo per quelle pertinenti." },
      { titolo: "Analisi partecipo / non partecipo", testo: "Requisiti, categorie, scadenze, criteri di valutazione e rischi messi a confronto con le capacità della tua impresa." },
      { titolo: "Sintesi e checklist", testo: "Disciplinare e capitolato riassunti, con l'elenco di documenti, dichiarazioni, garanzie e scadenze da rispettare." },
      { titolo: "Bozze di offerta tecnica", testo: "Impostazione delle relazioni e delle migliorie sui criteri di valutazione, partendo dalle vostre referenze e procedure." },
      { titolo: "Analisi prezzi e computo", testo: "Supporto all'offerta economica con computi, analisi prezzi e confronto con lo storico delle vostre commesse." },
      { titolo: "Chiarimenti e scadenze", testo: "Raccolta dei chiarimenti pubblicati e promemoria su sopralluoghi, quesiti e termini di presentazione." },
    ],
    passi: [
      { titolo: "Profilo dell'impresa", testo: "Categorie, classifiche, referenze, zone e tipi di gara che vi interessano." },
      { titolo: "Archivio documenti", testo: "Raccogliamo certificazioni, referenze e relazioni già scritte, da riusare nelle offerte." },
      { titolo: "Prima gara insieme", testo: "Proviamo il sistema su una gara reale, dal bando alla checklist completa." },
      { titolo: "Uso continuativo", testo: "Monitoraggio, analisi e bozze diventano parte del lavoro quotidiano dell'ufficio gare." },
    ],
    perChi: ["Imprese edili", "General contractor", "Impiantisti", "Studi tecnici", "Uffici gare"],
    soluzioni: [33, 34, 35, 36],
    faq: [
      {
        q: "Si può usare l'AI per preparare un'offerta di gara?",
        a: "Sì: la giurisprudenza ha chiarito che l'uso dell'AI non rende di per sé l'offerta inaffidabile. Alcuni bandi tipo ANAC chiedono però di dichiarare se l'offerta tecnica è stata preparata con l'AI: lo gestiamo in modo trasparente, e il contenuto resta sempre verificato e firmato da voi.",
      },
      {
        q: "L'AI decide al posto nostro se partecipare?",
        a: "No. Prepara un'analisi chiara di requisiti, rischi e convenienza; la decisione resta del titolare e dell'ufficio gare.",
      },
      {
        q: "Funziona anche per le gare con il BIM?",
        a: "Sì. Con l'obbligo BIM per le stazioni appaltanti, l'AI aiuta a leggere capitolati informativi e requisiti di gestione digitale e a organizzare la documentazione richiesta.",
      },
      {
        q: "Serve un ufficio gare strutturato?",
        a: "No. Anche un'impresa piccola, con una sola persona che segue le gare, può valutarne molte di più con lo stesso tempo.",
      },
    ],
  },
  {
    slug: "sicurezza-e-conformita-ai",
    seoTitle: "AI per la Sicurezza in Cantiere e la Conformità Documentale | Edilizia.io",
    seoDescription:
      "Bozze di POS e documenti di sicurezza, scadenzario di DURC, formazione e visite mediche, verifica documentale dei subappaltatori e controlli da foto in cantiere nel rispetto di privacy e Statuto dei lavoratori.",
    eyebrow: "Sicurezza e conformità",
    heroTitolo: "Documenti in regola e scadenze sotto controllo,",
    heroEvidenza: "senza rincorrere nessuno.",
    heroSottotitolo:
      "L'AI prepara le bozze dei documenti di sicurezza, tiene d'occhio le scadenze di imprese e lavoratori e aiuta nei controlli di cantiere. Le valutazioni e le firme restano dei tecnici abilitati.",
    problemi: [
      { titolo: "Scadenze che sfuggono", testo: "DURC, attestati di formazione, visite mediche: ne scade sempre uno proprio quando serve entrare in cantiere." },
      { titolo: "Documenti dei subappaltatori", testo: "Raccogliere e verificare i documenti di ogni impresa in cantiere è un lavoro continuo e pieno di solleciti." },
      { titolo: "POS e documenti da riscrivere", testo: "Ogni cantiere richiede documenti aggiornati, spesso copiati da quelli vecchi con il rischio di errori." },
    ],
    capacita: [
      { titolo: "Bozze di POS", testo: "Impostazione del Piano Operativo di Sicurezza con i dati del cantiere e delle lavorazioni, da verificare e firmare." },
      { titolo: "Scadenzario intelligente", testo: "DURC, formazione, visite mediche, attestati e mezzi: avvisi prima della scadenza a chi deve agire." },
      { titolo: "Verifica subappaltatori", testo: "Raccolta dei documenti via email o WhatsApp, controllo di completezza e date, solleciti automatici." },
      { titolo: "Checklist di cantiere da foto", testo: "Foto dei sopralluoghi organizzate per cantiere, con segnalazione dei punti da verificare." },
      { titolo: "Visione artificiale sui DPI", testo: "Dove l'azienda lo sceglie, controllo dell'uso dei dispositivi di protezione nel rispetto dell'art. 4 dello Statuto dei lavoratori e del GDPR." },
      { titolo: "Archivio per ispezioni", testo: "Tutti i documenti di cantiere ordinati e pronti da mostrare in caso di controllo." },
    ],
    passi: [
      { titolo: "Mappa dei documenti", testo: "Quali documenti servono, a chi e con quali scadenze." },
      { titolo: "Raccolta iniziale", testo: "Importiamo quello che avete già e segnaliamo cosa manca." },
      { titolo: "Regole e avvisi", testo: "Chi riceve cosa, quando e su quale canale." },
      { titolo: "Controllo continuo", testo: "Il sistema lavora ogni giorno; voi intervenite solo quando serve." },
    ],
    perChi: ["Imprese edili", "General contractor", "Coordinatori per la sicurezza", "RSPP e consulenti", "Impiantisti"],
    soluzioni: [37, 38, 39],
    faq: [
      {
        q: "L'AI può firmare un POS o un PSC?",
        a: "No. L'AI prepara bozze e raccoglie i dati; la valutazione dei rischi e la firma restano del datore di lavoro, del coordinatore o del tecnico incaricato.",
      },
      {
        q: "Il controllo con le telecamere è legale?",
        a: "Si può fare solo rispettando l'art. 4 dello Statuto dei lavoratori, il GDPR e l'AI Act, con accordo sindacale o autorizzazione quando richiesti. Lo progettiamo insieme a voi e ai vostri consulenti, e non è obbligatorio: molte aziende partono dallo scadenzario.",
      },
      {
        q: "Funziona con i documenti che abbiamo già?",
        a: "Sì. Partiamo dal vostro archivio attuale, anche se è fatto di cartelle e PDF sparsi.",
      },
    ],
    eic: true,
  },
  {
    slug: "cantiere-e-acquisti-ai",
    seoTitle: "AI per Cantiere, Acquisti e Magazzino nelle Imprese Edili | Edilizia.io",
    seoDescription:
      "Previsione dei ritardi sul cronoprogramma, avanzamento lavori da foto e rapportini, ordini materiali in base all'avanzamento, lettura di DDT e fatture fornitori e controllo sugli ordini.",
    eyebrow: "Cantiere e acquisti",
    heroTitolo: "Cantieri che non si fermano",
    heroEvidenza: "per un materiale mancante.",
    heroSottotitolo:
      "L'AI collega cantiere, acquisti e magazzino: legge l'avanzamento, prevede i ritardi, suggerisce cosa ordinare e controlla che quello che arriva corrisponda a quello che hai ordinato.",
    problemi: [
      { titolo: "Ritardi scoperti troppo tardi", testo: "Ci si accorge che il cantiere è indietro quando la consegna al cliente è già a rischio." },
      { titolo: "Materiali ordinati all'ultimo", testo: "Il materiale arriva quando la squadra è già ferma, o si accumula in magazzino per mesi." },
      { titolo: "Bolle e fatture da controllare a mano", testo: "DDT, fatture e ordini da confrontare riga per riga: errori e doppi pagamenti sono dietro l'angolo." },
    ],
    capacita: [
      { titolo: "Previsione dei ritardi", testo: "Dallo storico delle commesse e dall'avanzamento reale, segnala le attività che rischiano di slittare." },
      { titolo: "Avanzamento da foto e rapportini", testo: "Foto e rapportini del capocantiere diventano lo stato di avanzamento della commessa." },
      { titolo: "Ordini al momento giusto", testo: "Suggerisce cosa ordinare e quando, in base al cronoprogramma e ai tempi di consegna dei fornitori." },
      { titolo: "Lettura di DDT e fatture", testo: "Bolle e fatture lette da foto o PDF, confrontate con gli ordini, con segnalazione delle differenze." },
      { titolo: "Magazzino aggiornato", testo: "Entrate e uscite registrate dai documenti, materiale assegnato alla commessa giusta." },
      { titolo: "Meteo e squadre", testo: "Avvisi meteo sui cantieri all'aperto e supporto alla pianificazione delle squadre." },
    ],
    passi: [
      { titolo: "Colleghiamo i dati", testo: "Cronoprogrammi, ordini, fornitori, rapportini e magazzino che già usate." },
      { titolo: "Regole di controllo", testo: "Tolleranze, soglie di avviso e responsabili per ogni cantiere." },
      { titolo: "Prova su un cantiere", testo: "Partiamo da un cantiere pilota e verifichiamo i risultati." },
      { titolo: "Estensione", testo: "Estendiamo a tutti i cantieri e all'ufficio acquisti." },
    ],
    perChi: ["Imprese edili", "General contractor", "Capicantiere", "Uffici acquisti", "Magazzini"],
    soluzioni: [40, 41, 42, 43, 15, 16],
    faq: [
      {
        q: "Serve installare qualcosa in cantiere?",
        a: "No. Basta il telefono del capocantiere: foto e rapportini arrivano via WhatsApp o app.",
      },
      {
        q: "Si collega al nostro gestionale?",
        a: "Sì: a EdiliziaInCloud, il gestionale del nostro gruppo, o al gestionale che usate già.",
      },
      {
        q: "Le previsioni dei ritardi sono affidabili?",
        a: "Sono segnalazioni, non certezze: diventano più precise con lo storico delle vostre commesse e servono a intervenire in tempo.",
      },
    ],
    eic: true,
  },
  {
    slug: "marketing-e-vendite-ai",
    seoTitle: "Marketing AI per Imprese Edili e Studi Tecnici — Contenuti, Recensioni, Follow-up | Edilizia.io",
    seoDescription:
      "Testi di annunci, post e pagine per il mercato locale, gestione delle recensioni Google, follow-up automatici dopo sopralluogo e preventivo e analisi dei canali che portano clienti veri.",
    eyebrow: "Marketing AI",
    heroTitolo: "Più richieste dal web,",
    heroEvidenza: "nessun contatto lasciato indietro.",
    heroSottotitolo:
      "L'AI prepara contenuti e campagne pensati per il tuo mercato, cura le recensioni e segue ogni contatto fino al contratto. Tu approvi, lei lavora.",
    problemi: [
      { titolo: "Nessuno ti trova online", testo: "Fai un ottimo lavoro, ma sul web non si vede: i clienti trovano prima i concorrenti." },
      { titolo: "Pubblicità che non rende", testo: "Soldi in campagne senza sapere quali portano clienti veri e quali solo perditempo." },
      { titolo: "Preventivi lasciati cadere", testo: "Dopo il sopralluogo nessuno richiama: il cliente firma con chi si è fatto sentire." },
    ],
    capacita: [
      { titolo: "Contenuti per il tuo territorio", testo: "Testi per annunci, post e pagine con i lavori, le zone e il linguaggio dei tuoi clienti." },
      { titolo: "Recensioni Google", testo: "Richiesta di recensioni ai clienti soddisfatti e bozze di risposta a tutte le recensioni." },
      { titolo: "Follow-up automatici", testo: "Messaggi e richiami dopo sopralluogo e preventivo, al momento giusto e sul canale giusto." },
      { titolo: "Analisi dei canali", testo: "Quali campagne e quali canali portano contratti, non solo contatti." },
    ],
    passi: [
      { titolo: "Analisi della presenza online", testo: "Sito, schede Google, social, campagne attive." },
      { titolo: "Piano dei contenuti", testo: "Cosa comunicare, a chi e su quali canali." },
      { titolo: "Automazioni commerciali", testo: "Follow-up, recensioni e passaggio dei contatti al CRM." },
      { titolo: "Misura e miglioramento", testo: "Ogni mese vediamo cosa porta clienti e spostiamo l'impegno lì." },
    ],
    perChi: ["Serramentisti", "Installatori fotovoltaico", "Imprese di ristrutturazione", "Artigiani", "Studi tecnici"],
    soluzioni: [44, 4, 14],
    faq: [
      {
        q: "Pubblicate contenuti senza il mio consenso?",
        a: "No. L'AI prepara testi e risposte, tu li approvi prima della pubblicazione.",
      },
      {
        q: "Gestite anche le campagne pubblicitarie?",
        a: "Prepariamo testi, segmenti e misurazione dei risultati e collaboriamo con chi gestisce le tue campagne, o le impostiamo insieme a te.",
      },
    ],
  },
  {
    slug: "progettazione-sistemi-ai",
    seoTitle: "Sistemi AI su Misura per Imprese Edili e Studi Tecnici | Edilizia.io",
    seoDescription:
      "Progettiamo e sviluppiamo sistemi di intelligenza artificiale su misura: mappatura dei processi, progetto, sviluppo di agenti e automazioni, collegamento a gestionale, email, Excel e WhatsApp.",
    eyebrow: "Sistemi su misura",
    heroTitolo: "Quando serve qualcosa di tuo,",
    heroEvidenza: "lo costruiamo attorno a te.",
    heroSottotitolo:
      "Non tutte le aziende lavorano allo stesso modo. Quando le soluzioni pronte non bastano, progettiamo e sviluppiamo un sistema AI sui tuoi processi, i tuoi dati e i tuoi strumenti.",
    problemi: [
      { titolo: "Software generici che non si adattano", testo: "Strumenti pensati per altri settori: li usi per forza, e il lavoro vero continua su Excel." },
      { titolo: "Processi unici della tua azienda", testo: "Il tuo modo di preventivare, ordinare o gestire il cantiere non sta in nessun prodotto standard." },
      { titolo: "Strumenti che non si parlano", testo: "Gestionale, email, fogli di calcolo, WhatsApp: ognuno per conto suo, e i dati si ricopiano a mano." },
    ],
    capacita: [
      { titolo: "Mappatura dei processi", testo: "Ufficio, studio, cantiere: chi fa cosa, con quali dati e dove si perde tempo." },
      { titolo: "Progetto del sistema", testo: "Un documento chiaro con cosa fa il sistema, con quali dati, tempi e risultati attesi." },
      { titolo: "Agenti e automazioni dedicate", testo: "Sviluppiamo gli agenti AI e i flussi specifici del tuo modo di lavorare." },
      { titolo: "Integrazioni", testo: "Collegamento a EdiliziaInCloud o al tuo gestionale, email, Excel, cartelle condivise e WhatsApp." },
    ],
    passi: [
      { titolo: "Analisi gratuita", testo: "Una prima consulenza per capire processi, obiettivi e vincoli." },
      { titolo: "Progetto e preventivo", testo: "Ti presentiamo il progetto con costi, tempi e risparmio atteso." },
      { titolo: "Sviluppo e test", testo: "Costruiamo il sistema e lo proviamo sui tuoi casi reali." },
      { titolo: "Avvio e affiancamento", testo: "Formiamo il team e miglioriamo il sistema nel tempo." },
    ],
    perChi: ["Imprese edili strutturate", "General contractor", "Aziende con processi specifici", "Studi tecnici con più sedi"],
    soluzioni: [],
    faq: [
      {
        q: "Quanto tempo serve?",
        a: "Dipende dal progetto. Per i sistemi più semplici bastano pochi giorni; per quelli più articolati ti diamo un calendario preciso nel progetto.",
      },
      {
        q: "Il sistema resta mio?",
        a: "Il sistema è configurato sui tuoi dati e processi, e i dati restano della tua azienda. Le condizioni di utilizzo sono definite nel progetto.",
      },
      {
        q: "Serve un gestionale specifico?",
        a: "No. Ci colleghiamo a quello che usi già. Se cerchi anche un gestionale, il nostro gruppo ha EdiliziaInCloud.",
      },
    ],
    eic: true,
  },
  {
    slug: "consulenza-ai",
    seoTitle: "Consulenza sull'Intelligenza Artificiale per l'Edilizia | Edilizia.io",
    seoDescription:
      "Consulenza AI per imprese edili e studi tecnici: analisi dei processi, attività da automatizzare, piano di introduzione con priorità e stima del ritorno economico.",
    eyebrow: "Consulenza AI",
    heroTitolo: "Prima di investire nell'AI,",
    heroEvidenza: "capisci dove rende davvero.",
    heroSottotitolo:
      "Ti aiutiamo a scegliere con i numeri: quali attività conviene automatizzare, in che ordine, con quali strumenti e quanto ti fanno risparmiare.",
    problemi: [
      { titolo: "Troppe offerte, poca chiarezza", testo: "Tutti vendono AI. Capire cosa serve davvero alla tua azienda è difficile." },
      { titolo: "Paura di sprecare soldi", testo: "Strumenti comprati e mai usati, progetti iniziati e abbandonati: è già successo a molti." },
      { titolo: "Nessuno conosce il settore", testo: "I consulenti generici non sanno cos'è un SAL o un capitolato, e propongono soluzioni che non c'entrano." },
    ],
    capacita: [
      { titolo: "Analisi dei processi", testo: "Come lavorate oggi, dove si perde tempo e quanto costa." },
      { titolo: "Attività da automatizzare", testo: "Una lista ordinata di cosa conviene affidare all'AI e cosa no." },
      { titolo: "Piano di introduzione", testo: "Priorità, tempi e responsabilità, un passo alla volta." },
      { titolo: "Stima del ritorno", testo: "Per ogni intervento, il risparmio di tempo e di costi atteso." },
    ],
    passi: [
      { titolo: "Prima chiamata gratuita", testo: "30 minuti per capire la tua situazione e i tuoi obiettivi." },
      { titolo: "Analisi", testo: "Guardiamo i processi chiave insieme a te e al tuo team." },
      { titolo: "Roadmap", testo: "Ti consegniamo il piano: cosa fare subito, cosa dopo e cosa non conviene fare." },
    ],
    perChi: ["Titolari d'impresa", "Titolari di studio tecnico", "Direzione", "Aziende che valutano l'AI per la prima volta"],
    soluzioni: [],
    faq: [
      {
        q: "La consulenza mi obbliga ad acquistare qualcosa?",
        a: "No. La prima analisi è gratuita e serve a capire se e dove l'AI conviene. Se non conviene, te lo diciamo.",
      },
      {
        q: "Serve preparare qualcosa?",
        a: "Basta conoscere come lavora la tua azienda. Se hai numeri su chiamate, preventivi o commesse, portali: rendono l'analisi più precisa.",
      },
    ],
  },
  {
    slug: "formazione-e-affiancamento",
    seoTitle: "Formazione AI per Imprese Edili e Studi Tecnici | Edilizia.io",
    seoDescription:
      "Formazione pratica sull'intelligenza artificiale per ufficio, tecnici, commerciali e progettisti, con guide sui vostri casi reali e affiancamento continuo.",
    eyebrow: "Formazione",
    heroTitolo: "Un team che usa l'AI ogni giorno,",
    heroEvidenza: "non solo una volta.",
    heroSottotitolo:
      "Formazione pratica sui vostri casi reali e affiancamento dopo l'avvio, perché gli strumenti AI servono solo se il team li usa davvero.",
    problemi: [
      { titolo: "Strumenti che nessuno usa", testo: "Senza formazione, anche lo strumento migliore finisce dimenticato dopo due settimane." },
      { titolo: "Paura di sbagliare", testo: "Il personale non si fida dell'AI o non sa quando fidarsi. E torna al vecchio modo." },
      { titolo: "Corsi generici", testo: "Corsi teorici su ChatGPT che non parlano mai di preventivi, cantieri o capitolati." },
    ],
    capacita: [
      { titolo: "Formazione per ruolo", testo: "Sessioni pratiche per ufficio, tecnici, commerciali e progettisti, ciascuno sui suoi compiti." },
      { titolo: "Guide sui vostri casi", testo: "Procedure scritte con esempi presi dal vostro lavoro, da tenere a portata di mano." },
      { titolo: "Assistenza continua", testo: "Un riferimento a cui chiedere quando serve, e miglioramenti mensili degli strumenti." },
      { titolo: "Verifica dei risultati", testo: "Controlli periodici su come gli strumenti vengono usati e cosa stanno portando." },
    ],
    passi: [
      { titolo: "Chi usa cosa", testo: "Definiamo ruoli e strumenti per ogni persona del team." },
      { titolo: "Sessioni pratiche", testo: "Formazione sui casi reali, in presenza o a distanza." },
      { titolo: "Affiancamento", testo: "Seguiamo il team nelle prime settimane di uso quotidiano." },
    ],
    perChi: ["Uffici tecnici e commerciali", "Personale amministrativo", "Progettisti e collaboratori di studio", "Capicantiere"],
    soluzioni: [],
    faq: [
      {
        q: "Serve essere esperti di tecnologia?",
        a: "No. La formazione parte da zero ed è costruita sui compiti di ogni giorno.",
      },
      {
        q: "La formazione è in presenza?",
        a: "Si può fare in presenza o a distanza, a seconda delle esigenze del team.",
      },
    ],
  },
];

export const getServizioDettaglio = (slug: string) => SERVIZI_DETTAGLIO.find((s) => s.slug === slug);
