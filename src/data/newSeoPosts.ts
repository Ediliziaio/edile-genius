import type { BlogPost, BlogSection } from "./blogPosts";
import offers from "../content/blog/confrontare-offerte-fornitori-ai-edilizia.md?raw";
import reports from "../content/blog/rapportini-cantiere-voce-ai.md?raw";
import quantities from "../content/blog/computo-metrico-ai-prezzari-controlli.md?raw";
import renders from "../content/blog/render-ai-ristrutturazione-foto-progetto.md?raw";

function sections(markdown: string): BlogSection[] {
  return markdown.trim().split(/^## /m).filter(Boolean).map((part) => {
    const newline = part.indexOf("\n");
    return { heading: part.slice(0, newline).trim(), content: part.slice(newline + 1).trim() };
  });
}

export const newSeoPosts: BlogPost[] = [
  {
    slug: "computo-metrico-ai-prezzari-controlli",
    title: "Computo metrico con AI: quantità, prezzari e controlli del tecnico",
    description: "Come usare l'AI nel computo metrico: misure con fonte, ricerca delle voci di prezzario, esempio di calcolo e approvazione del tecnico.",
    date: "2026-11-23", readTime: "12 min", category: "Guide",
    tags: ["computo metrico AI", "prezzari edilizia", "AI per studi tecnici"],
    heroImage: "https://edilizia.io/blog/covers/computo-metrico-ai.png",
    heroImageAlt: "Schema originale del computo metrico con AI: progetto, quantità documentate, voci di prezzo e verifica tecnica.",
    summary: "L'AI può organizzare lavorazioni, leggere dati e proporre voci di prezzario per una bozza di computo metrico. Ogni quantità e prezzo devono avere una fonte; misurazioni, corrispondenze e documento finale restano da verificare e approvare dal professionista incaricato.",
    keyTakeaways: ["Distingui stima preliminare, computo e offerta commerciale.", "Conserva formula, unità e documento di origine per ogni quantità.", "Usa il prezzario e l'edizione scelti dal tecnico, senza codici inventati.", "Controlla i calcoli con formule ripetibili e conserva le revisioni."],
    sections: sections(quantities),
    faqs: [
      { question: "L'AI può preparare un computo metrico da una foto?", answer: "Può aiutare a organizzare una bozza, ma una foto non sostituisce un rilievo. Misure, scala e criteri di misurazione devono essere confermati dal professionista." },
      { question: "Quale prezzario deve usare un sistema AI?", answer: "La fonte e l'edizione vengono scelte dal responsabile del lavoro. Il sistema deve riportare codici e riferimenti verificabili e segnalare i casi senza corrispondenza adeguata." },
      { question: "Come si controllano gli importi generati?", answer: "Con quantità e prezzi approvati, formule deterministiche, verifica di righe e subtotali e confronto tra le versioni. Una seconda risposta testuale del modello non sostituisce il controllo aritmetico." },
    ],
  },
  {
    slug: "render-ai-ristrutturazione-foto-progetto",
    title: "Render AI per ristrutturazioni: dalle foto a una proposta chiara",
    description: "Render AI per ristrutturazioni: foto, brief, varianti, controllo dei dettagli e collegamento al preventivo senza confondere immagini e progetto.",
    date: "2026-11-23", readTime: "12 min", category: "Guide",
    tags: ["render AI ristrutturazioni", "render da foto", "AI edilizia"],
    heroImage: "https://edilizia.io/blog/covers/render-ai-ristrutturazioni.png",
    heroImageAlt: "Schema originale del render AI: foto dello stato di fatto, vincoli, proposta illustrativa e verifica prima della presentazione.",
    summary: "Un render AI aiuta a discutere finiture e scelte estetiche di una ristrutturazione. Per usarlo correttamente servono foto di riferimento, vincoli espliciti e controllo della proposta: un'immagine realistica non dimostra misure, fattibilità o corrispondenza a un prodotto commerciale.",
    keyTakeaways: ["Parti da una decisione precisa e modifica poche variabili alla volta.", "Confronta la proposta con la foto originale e i vincoli del progetto.", "Distingui materiali illustrativi, prodotti identificati e lavorazioni comprese.", "Non presentare un render come fotografia di un lavoro realizzato."],
    sections: sections(renders),
    faqs: [
      { question: "Un render AI dimostra che una ristrutturazione è fattibile?", answer: "No. È una visualizzazione da collegare alle verifiche del progetto. Misure, fattibilità e requisiti tecnici richiedono i controlli dei professionisti incaricati." },
      { question: "Come si mantengono le dimensioni della stanza?", answer: "Si forniscono misure confermate e vincoli nel brief, poi si controlla ogni immagine rispetto all'originale. L'istruzione al modello non garantisce da sola che la geometria venga conservata." },
      { question: "Si possono scegliere i materiali direttamente dal render?", answer: "Il render aiuta a discutere l'effetto estetico. La scelta di un prodotto preciso richiede codice, scheda e campione verificati; una somiglianza visiva non prova la corrispondenza al catalogo." },
    ],
  },
  {
    slug: "confrontare-offerte-fornitori-ai-edilizia",
    title: "Confrontare offerte di fornitori edili con l'AI: metodo ed esempio",
    description: "Come confrontare offerte di fornitori edili con l'AI: quantità, costi inclusi, consegne, esempio numerico e controlli prima dell'ordine.",
    date: "2026-11-23", readTime: "12 min", category: "Operativo",
    tags: ["AI acquisti edilizia", "confronto offerte fornitori", "gestione acquisti cantiere"],
    heroImage: "https://edilizia.io/blog/covers/confronto-offerte-ai.png",
    heroImageAlt: "Schema originale del confronto offerte: documenti, estrazione AI, verifica e approvazione umana.",
    summary: "L'AI può estrarre e ordinare le offerte dei fornitori edili in una tabella con quantità, unità, prezzi e condizioni. Il confronto parte da una richiesta uguale per tutti e termina con la verifica tecnica ed economica del responsabile: i valori assenti non vanno inventati.",
    keyTakeaways: ["Usa una richiesta e un perimetro uguali per tutti i fornitori.", "Mantieni il riferimento a documento e pagina per ogni dato estratto.", "Confronta il costo della fornitura completa, comprese le condizioni di consegna.", "Fai approvare il confronto prima di emettere un ordine."],
    sections: sections(offers),
    faqs: [
      { question: "L'AI può scegliere da sola il fornitore edile?", answer: "Può preparare un confronto e segnalare differenze. La scelta richiede la verifica di caratteristiche, costo complessivo e tempi da parte dei responsabili incaricati." },
      { question: "Come si confrontano offerte con unità diverse?", answer: "Si conserva l'unità originale e si usa un fattore di conversione documentato. Se manca il dato necessario, si chiede un chiarimento al fornitore senza stimarlo." },
      { question: "Quali documenti servono per un primo progetto?", answer: "Una richiesta di acquisto, alcune offerte relative allo stesso fabbisogno e il modello di approvazione già usato dall'impresa. Per le prove si possono usare documenti depurati dai dati non necessari." },
    ],
  },
  {
    slug: "rapportini-cantiere-voce-ai",
    title: "Rapportini di cantiere con voce e AI: guida al flusso di lavoro",
    description: "Rapportini di cantiere con voce e AI: modello, esempio di dettatura, controllo di ore e materiali, foto, approvazione e collegamento al gestionale.",
    date: "2026-11-23", readTime: "12 min", category: "Operativo",
    tags: ["rapportini cantiere AI", "rapportini vocali", "automazione cantiere"],
    heroImage: "https://edilizia.io/blog/covers/rapportini-voce-ai.png",
    heroImageAlt: "Schema originale del rapportino vocale: aggiornamento della squadra, bozza AI, controllo e rapporto approvato.",
    summary: "Un sistema di rapportini vocali usa l'AI per trasformare un aggiornamento della squadra in una bozza con attività, ore dichiarate, materiali e impedimenti. L'autore controlla il contenuto e il responsabile approva il rapporto prima del suo utilizzo negli altri processi aziendali.",
    keyTakeaways: ["Seleziona commessa e data prima di registrare l'aggiornamento.", "Distingui lavori eseguiti, attività in corso e previsioni.", "Non ricavare ore o quantità che non sono state dichiarate.", "Prevedi correzioni, versioni, sincronizzazione e approvazione umana."],
    sections: sections(reports),
    faqs: [
      { question: "Un rapportino AI è già un documento approvato?", answer: "No. È una bozza da controllare e approvare secondo il processo dell'impresa. Non sostituisce automaticamente documenti tecnici o contrattuali richiesti dalla commessa." },
      { question: "L'AI può ricostruire le ore mancanti dalla descrizione?", answer: "Non dovrebbe stimarle. Le ore devono arrivare dalla rilevazione o dalla dichiarazione prevista dall'impresa; un valore assente resta da completare e verificare." },
      { question: "I rapportini vocali funzionano senza connessione?", answer: "Dipende dal sistema adottato. Prima di usarlo in cantiere occorre provare salvataggio locale, sincronizzazione, conferma di ricezione e gestione degli invii ripetuti." },
    ],
  },
];
