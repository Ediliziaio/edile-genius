/**
 * Titoli e descrizioni per Google degli articoli del blog.
 * Il titolo visibile nell'articolo resta quello lungo (in blogPosts.ts); qui teniamo
 * le versioni brevi che non vengono tagliate nei risultati: titolo ≤ 65 caratteri,
 * descrizione ≤ 160, parola chiave all'inizio.
 */
export const BLOG_SEO: Record<string, { title: string; description: string }> = {
  "gestionale-edilizia-cloud-ediliziaincloud": {
    title: "Gestionale per Imprese Edili in Cloud con AI | Edilizia.io",
    description:
      "Cosa deve fare un gestionale edile, perché Excel non basta più e come EdiliziaInCloud gestisce cantieri, fatture, margini e personale in un unico posto.",
  },
  "agenti-vocali-ai-edilizia": {
    title: "Agenti vocali AI per imprese edili: guida e controlli",
    description:
      "Agenti vocali per imprese edili: raccolta richieste, calendario, passaggio al team, dati personali e verifica della prova. Metodo pratico.",
  },
  "intelligenza-artificiale-serramenti": {
    title: "Intelligenza Artificiale per Serramentisti | Edilizia.io",
    description:
      "AI per serramentisti: richieste, misure, cataloghi, preventivi, render e passaggio alla posa. Metodo per collegare showroom, ufficio e tecnici.",
  },
  "automazione-preventivi-edilizia": {
    title: "Automazione Preventivi in Edilizia con l'AI | Edilizia.io",
    description:
      "Automazione dei preventivi edili con listini verificati, controlli e varianti. Metodo operativo, esempi e calcolatore dei tempi di lavoro.",
  },
  "ai-fotovoltaico-vendite": {
    title: "AI per Installatori Fotovoltaico: Più Vendite | Edilizia.io",
    description:
      "Come l'intelligenza artificiale aiuta a vendere impianti fotovoltaici: lead qualificati in automatico, preventivi rapidi e follow-up. Con caso studio.",
  },
  "ridurre-costi-operativi-impresa-edile": {
    title: "Ridurre i Costi Operativi dell'Impresa Edile con l'AI",
    description:
      "5 modi concreti per ridurre i costi operativi di un'impresa edile con l'AI: chiamate perse, sopralluoghi inutili, preventivi, rapportini, assistenza.",
  },
  "call-center-ai-ristrutturazioni": {
    title: "Call Center AI per Imprese di Ristrutturazione",
    description:
      "Call center AI per ristrutturazioni: chiamate gestite 24/7, lead qualificati e sopralluoghi in agenda. Confronto con le alternative e caso studio.",
  },
  "bonus-edilizi-ai-gestione": {
    title: "Bonus Edilizi e AI: Pratiche e Scadenze | Edilizia.io",
    description:
      "Come l'AI aiuta a gestire pratiche ENEA, documenti e scadenze dei bonus edilizi senza errori. Checklist, esempi e caso reale di un'impresa italiana.",
  },
  "gestione-cantiere-digitale": {
    title: "Gestione Cantiere Digitale con l'AI | Edilizia.io",
    description:
      "Gestione del cantiere con l'AI: meno ritardi, errori e sprechi, rapportini automatici e avanzamento in tempo reale. Guida pratica con casi studio.",
  },
  "preventivi-online-edilizia": {
    title: "Preventivi Online per l'Edilizia: Guida all'AI | Edilizia.io",
    description:
      "Come creare preventivi edili automatici con l'AI: dai tempi di ore a minuti, più preventivi chiusi e follow-up senza dimenticanze. Guida completa.",
  },
  "crm-edilizia-intelligenza-artificiale": {
    title: "CRM per l'Edilizia con Intelligenza Artificiale",
    description:
      "CRM edile con AI: contatti, follow-up e pipeline gestiti in automatico, senza perdere clienti. Cosa deve avere e come sceglierlo, con esempi reali.",
  },
  "marketing-digitale-imprese-edili": {
    title: "Marketing Digitale per Imprese Edili | Edilizia.io",
    description:
      "Strategia di marketing digitale per imprese edili: Google, social e AI per generare lead qualificati ogni mese. Budget realistici e risultati misurati.",
  },
  "sopralluoghi-virtuali-ai": {
    title: "Sopralluoghi Virtuali con AI per l'Edilizia | Edilizia.io",
    description:
      "Come pre-qualificare i lavori da remoto con sopralluoghi virtuali e AI: meno ore in auto, più appuntamenti utili. Metodo, strumenti e caso studio.",
  },
};
