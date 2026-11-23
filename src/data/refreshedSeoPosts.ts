import type { BlogPost } from "./blogPosts";
import { SITE_VISUALS, visualPath } from "./siteVisuals";
import { articleWordCount, markdownSections } from "@/lib/blogContent";
import voice from "../content/blog/agenti-vocali-ai-edilizia.md?raw";
import windows from "../content/blog/intelligenza-artificiale-serramenti.md?raw";
import estimates from "../content/blog/automazione-preventivi-edilizia.md?raw";

const posts: BlogPost[] = [
  {
    slug: "agenti-vocali-ai-edilizia",
    title: "Agenti vocali AI per imprese edili: chiamate, appuntamenti e controlli",
    description: "Come progettare un agente vocale per un'impresa edile: richieste, calendario, passaggio al team, dati personali e verifica della prova iniziale.",
    date: "2025-06-15", dateModified: "2026-11-23", readTime: "12 min", category: "Vocale",
    tags: ["agenti vocali AI", "chiamate imprese edili", "appuntamenti", "automazione ufficio"],
    heroImage: `https://edilizia.io${visualPath(SITE_VISUALS.voice)}`,
    heroImageAlt: SITE_VISUALS.voice.alt, heroVisual: SITE_VISUALS.voice,
    relatedSlugs: ["rapportini-cantiere-voce-ai", "intelligenza-artificiale-serramenti", "automazione-preventivi-edilizia"],
    summary: "Un agente vocale AI può raccogliere le richieste telefoniche di un'impresa edile e preparare il passaggio al team. Servono informazioni aziendali approvate, dati da confermare, regole per gli appuntamenti e una procedura quando deve intervenire una persona. La prova va valutata su richieste gestite, qualità delle schede e tempi effettivi.",
    keyTakeaways: ["Inizia da una categoria di chiamate e da un problema misurabile.", "Distingui preferenza del cliente, richiesta inviata e appuntamento confermato.", "Prevedi il passaggio a una persona e i collegamenti che possono fallire.", "Verifica dati personali, accessi e conservazione prima dell'avvio.", "Misura processo telefonico ed esito commerciale separatamente."],
    sections: markdownSections(voice),
    faqs: [
      { question: "Un agente vocale AI può gestire tutte le chiamate dell'impresa?", answer: "Il perimetro va definito nel progetto. Richieste fuori ambito, difficoltà di comprensione, reclami e domande tecniche possono richiedere una persona e una procedura di richiamo." },
      { question: "Può fissare automaticamente un sopralluogo?", answer: "Solo con un collegamento e regole adeguate per durata, tecnico, zona e disponibilità. La prenotazione va ricontrollata alla conferma; una preferenza raccolta non è ancora un appuntamento." },
      { question: "Come si valuta se il sistema funziona?", answer: "Con casi di prova e misure definite prima dell'avvio: completezza delle richieste, consegna al referente, appuntamenti confermati, correzioni e tempo del team. Non basta valutare quanto la voce sembri naturale." },
      { question: "L'AI impara automaticamente da qualsiasi telefonata?", answer: "Non bisogna presumerlo. Il progetto deve spiegare come vengono aggiornate informazioni, regole e configurazioni, chi approva le modifiche e quali prove vengono ripetute." },
    ],
  },
  {
    slug: "intelligenza-artificiale-serramenti",
    title: "AI per serramentisti: dal primo contatto al preventivo e alla posa",
    description: "AI per aziende di serramenti: richieste, misure, cataloghi, preventivi, render, showroom e passaggio alla posa. Metodo con esempi e controlli.",
    date: "2025-06-10", dateModified: "2026-11-23", readTime: "12 min", category: "Operativo",
    tags: ["AI serramenti", "serramentisti", "preventivi infissi", "render finestre", "showroom"],
    heroImage: `https://edilizia.io${visualPath(SITE_VISUALS.windows)}`,
    heroImageAlt: SITE_VISUALS.windows.alt, heroVisual: SITE_VISUALS.windows,
    relatedSlugs: ["render-ai-ristrutturazione-foto-progetto", "automazione-preventivi-edilizia", "agenti-vocali-ai-edilizia"],
    summary: "Per un serramentista l'AI può organizzare contatti, bozze di offerta, proposte visive e passaggi tra showroom, ufficio e posa. Ogni apertura deve essere riconoscibile e i dati del cliente vanno distinti dal rilievo verificato. Prodotti, misure, condizioni e versione destinata all'ordine restano soggetti al controllo del team.",
    keyTakeaways: ["Collega foto, richieste e documenti alla stessa pratica.", "Identifica ogni apertura e distingui misure indicative e dati approvati.", "Usa prodotti e configurazioni presenti nel catalogo verificato dell'azienda.", "Presenta il render come illustrazione, insieme ai riferimenti reali del prodotto.", "Mantieni la versione confermata riconoscibile per fornitura, posa e assistenza."],
    sections: markdownSections(windows),
    faqs: [
      { question: "L'AI può preparare un preventivo per la sostituzione degli infissi?", answer: "Può predisporre una bozza con prodotti, quantità e regole di prezzo approvati. Il team deve verificare rilievo, configurazioni, lavorazioni, inclusioni ed esclusioni prima di inviare l'offerta." },
      { question: "Una foto basta per ordinare una finestra?", answer: "No. Una foto aiuta a raccogliere informazioni, ma non sostituisce il rilievo e i controlli richiesti per il prodotto e il lavoro. Le misure indicative devono restare distinguibili da quelle confermate." },
      { question: "Il render AI riproduce esattamente il serramento del catalogo?", answer: "Non è garantito. Geometrie, accessori e finiture possono essere modificati dal modello. Il render va verificato e presentato come proposta visiva, affiancato a documentazione e riferimenti del prodotto." },
      { question: "Da quale processo conviene iniziare in uno showroom?", answer: "Da un passaggio ripetitivo con responsabilità chiare, per esempio la raccolta delle nuove richieste. Definisci i campi da verificare, il destinatario e i casi di prova prima di estendere il sistema agli ordini." },
    ],
  },
  {
    slug: "automazione-preventivi-edilizia",
    title: "Automazione preventivi edili con AI: dal dato alla bozza verificata",
    description: "Come automatizzare i preventivi edili: richiesta, perimetro, listini, calcoli, revisione e varianti. Esempi e calcolatore dei tempi di lavoro.",
    date: "2025-06-05", dateModified: "2026-11-23", readTime: "12 min", category: "Operativo",
    tags: ["automazione preventivi edilizia", "preventivi AI", "listini", "revisione offerte"],
    heroImage: `https://edilizia.io${visualPath(SITE_VISUALS.estimates)}`,
    heroImageAlt: SITE_VISUALS.estimates.alt, heroVisual: SITE_VISUALS.estimates,
    relatedSlugs: ["computo-metrico-ai-prezzari-controlli", "confrontare-offerte-fornitori-ai-edilizia", "intelligenza-artificiale-serramenti"],
    summary: "L'automazione dei preventivi edili parte da dati, perimetro del lavoro e fonti di prezzo approvati. L'AI organizza la richiesta e prepara una bozza; i calcoli devono essere ripetibili e la proposta va verificata prima dell'invio. Il risultato si misura includendo raccolta dei dati, revisione e correzioni, senza dedurre automaticamente un aumento delle vendite.",
    keyTakeaways: ["Distingui stima preliminare, computo e offerta commerciale.", "Usa listini identificati e segnala le voci senza corrispondenza.", "Affida importi e totali a formule controllabili.", "Collega ogni variante alla versione precedente e a una decisione approvata.", "Misura il tempo dell'intero processo, incluso il controllo umano."],
    sections: markdownSections(estimates),
    faqs: [
      { question: "L'AI può inviare un preventivo senza revisione?", answer: "In questo metodo prepara una bozza da controllare. Dati, perimetro, prezzi e condizioni vengono approvati dal responsabile prima della produzione e dell'invio della versione definitiva." },
      { question: "Come evitare prezzi inventati?", answer: "Definisci le fonti ammesse, conserva il riferimento per ogni voce e lascia aperti i casi senza corrispondenza. Un importo plausibile generato dal modello non sostituisce un prezzo approvato." },
      { question: "Come si calcola il tempo risparmiato?", answer: "Moltiplica il numero di preventivi per il tempo medio rilevato prima e durante la prova, includendo revisione e correzioni. La differenza riguarda le attività misurate e non è una previsione di vendite." },
      { question: "Si possono automatizzare anche le varianti?", answer: "Si può preparare il confronto tra le versioni, indicando voci e condizioni cambiate. La variante resta una decisione da verificare e approvare, soprattutto quando modifica il perimetro del lavoro." },
    ],
  },
];

export const refreshedSeoPosts = posts.map((post) => ({ ...post, readTime: `${Math.ceil((articleWordCount(post.sections) + (post.faqs || []).map((faq) => `${faq.question} ${faq.answer}`).join(" ").split(/\s+/).filter(Boolean).length) / 200)} min` }));
