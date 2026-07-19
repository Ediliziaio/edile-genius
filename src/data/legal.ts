// Testi legali standard per Edilizia.io.
// NOTA: bozze di base da far revisionare a un legale/DPO prima della pubblicazione.
// I segnaposto tra parentesi quadre [ ... ] vanno sostituiti con i dati reali dell'azienda.

export interface LegalSection {
  h: string;
  body: string[];
}

export interface LegalDoc {
  slug: string;
  title: string;
  metaTitle: string;
  description: string;
  updated: string; // data ultimo aggiornamento (formato leggibile)
  intro: string[];
  sections: LegalSection[];
}

const TITOLARE = "[RAGIONE SOCIALE], P.IVA [P.IVA], con sede in [INDIRIZZO]";
const EMAIL = "info@edilizia.io";

export const LEGAL_DOCS: Record<string, LegalDoc> = {
  privacy: {
    slug: "privacy-policy",
    title: "Privacy Policy",
    metaTitle: "Privacy Policy | Edilizia.io",
    description:
      "Informativa sul trattamento dei dati personali di Edilizia.io ai sensi del Regolamento UE 2016/679 (GDPR).",
    updated: "Luglio 2026",
    intro: [
      "La presente informativa descrive le modalità di trattamento dei dati personali degli utenti che consultano il sito edilizia.io e utilizzano i relativi servizi, ai sensi del Regolamento UE 2016/679 (GDPR) e del D.Lgs. 196/2003 come modificato dal D.Lgs. 101/2018.",
    ],
    sections: [
      {
        h: "1. Titolare del trattamento",
        body: [
          `Il Titolare del trattamento è ${TITOLARE}.`,
          `Per qualsiasi richiesta relativa ai dati personali è possibile scrivere a ${EMAIL}.`,
        ],
      },
      {
        h: "2. Tipologie di dati raccolti",
        body: [
          "Dati forniti volontariamente: nome, cognome, ragione sociale, indirizzo email, numero di telefono e altre informazioni comunicate compilando i moduli di contatto o prenotando una demo.",
          "Dati di navigazione: indirizzo IP, tipo di browser, sistema operativo, pagine visitate e dati raccolti tramite cookie e tecnologie analoghe (vedi Cookie Policy).",
        ],
      },
      {
        h: "3. Finalità e base giuridica",
        body: [
          "I dati sono trattati per: (a) rispondere alle richieste di contatto e gestire le demo — base giuridica: misure precontrattuali su richiesta dell'interessato; (b) erogare i servizi richiesti — esecuzione del contratto; (c) adempimenti di legge — obbligo legale; (d) invio di comunicazioni commerciali, previo consenso — consenso dell'interessato.",
        ],
      },
      {
        h: "4. Modalità di trattamento e conservazione",
        body: [
          "Il trattamento avviene con strumenti informatici, adottando misure di sicurezza adeguate a prevenire la perdita, gli accessi non autorizzati e gli usi illeciti dei dati.",
          "I dati sono conservati per il tempo necessario alle finalità per cui sono stati raccolti e nel rispetto degli obblighi di legge.",
        ],
      },
      {
        h: "5. Comunicazione dei dati e fornitori",
        body: [
          "I dati possono essere trattati da fornitori che agiscono in qualità di responsabili del trattamento (es. hosting, infrastruttura database, servizi di comunicazione e telefonia AI). Alcuni fornitori possono trattare dati al di fuori dello Spazio Economico Europeo: in tal caso il trasferimento avviene nel rispetto delle garanzie previste dagli artt. 44 ss. GDPR (es. clausole contrattuali standard).",
        ],
      },
      {
        h: "6. Diritti dell'interessato",
        body: [
          "L'interessato può esercitare in qualsiasi momento i diritti di accesso, rettifica, cancellazione, limitazione, portabilità e opposizione (artt. 15-22 GDPR), oltre a revocare il consenso e proporre reclamo al Garante per la protezione dei dati personali.",
          `Le richieste vanno inviate a ${EMAIL}.`,
        ],
      },
    ],
  },

  cookie: {
    slug: "cookie-policy",
    title: "Cookie Policy",
    metaTitle: "Cookie Policy | Edilizia.io",
    description:
      "Informativa sull'uso dei cookie e delle tecnologie di tracciamento sul sito edilizia.io.",
    updated: "Luglio 2026",
    intro: [
      "Questa Cookie Policy spiega cosa sono i cookie, quali tipologie utilizza il sito edilizia.io e come è possibile gestirli, in conformità alle Linee guida del Garante Privacy e alla direttiva ePrivacy.",
    ],
    sections: [
      {
        h: "1. Cosa sono i cookie",
        body: [
          "I cookie sono piccoli file di testo che i siti visitati inviano al dispositivo dell'utente, dove vengono memorizzati per essere ritrasmessi agli stessi siti alla visita successiva.",
        ],
      },
      {
        h: "2. Tipologie di cookie utilizzati",
        body: [
          "Cookie tecnici e necessari: indispensabili per il corretto funzionamento del sito. Non richiedono consenso.",
          "Cookie analitici: utilizzati, in forma anonimizzata o previo consenso, per raccogliere informazioni statistiche sull'uso del sito.",
          "Cookie di terze parti / marketing: eventualmente installati da servizi esterni per finalità di profilazione o remarketing. Vengono attivati solo previo consenso dell'utente.",
        ],
      },
      {
        h: "3. Gestione dei cookie",
        body: [
          "L'utente può gestire le preferenze tramite l'apposito banner presente sul sito e in qualsiasi momento modificando le impostazioni del proprio browser, che consentono di bloccare o eliminare i cookie.",
          "La disabilitazione dei cookie tecnici può compromettere la fruizione di alcune funzionalità del sito.",
        ],
      },
      {
        h: "4. Titolare e contatti",
        body: [
          `Titolare del trattamento: ${TITOLARE}. Per informazioni: ${EMAIL}.`,
        ],
      },
    ],
  },

  termini: {
    slug: "termini-di-servizio",
    title: "Termini di Servizio",
    metaTitle: "Termini di Servizio | Edilizia.io",
    description:
      "Condizioni generali di utilizzo del sito e dei servizi offerti da Edilizia.io.",
    updated: "Luglio 2026",
    intro: [
      "I presenti Termini di Servizio regolano l'accesso e l'utilizzo del sito edilizia.io e dei servizi in esso descritti. Utilizzando il sito, l'utente accetta le presenti condizioni.",
    ],
    sections: [
      {
        h: "1. Oggetto",
        body: [
          "Edilizia.io offre soluzioni di intelligenza artificiale per il settore edile, tra cui agenti vocali, strumenti di render e preventivazione. Le caratteristiche specifiche e i corrispettivi dei servizi sono definiti nelle offerte e nei contratti sottoscritti dal cliente.",
        ],
      },
      {
        h: "2. Utilizzo del sito",
        body: [
          "L'utente si impegna a utilizzare il sito nel rispetto della legge, non tenendo comportamenti che possano danneggiarne il funzionamento o violare i diritti di terzi.",
        ],
      },
      {
        h: "3. Proprietà intellettuale",
        body: [
          "I contenuti del sito (testi, grafica, loghi, marchi, software) sono di proprietà del Titolare o dei rispettivi aventi diritto e sono protetti dalle normative sul diritto d'autore e sulla proprietà industriale. È vietata la riproduzione non autorizzata.",
        ],
      },
      {
        h: "4. Limitazione di responsabilità",
        body: [
          "Le informazioni pubblicate sul sito hanno finalità illustrativa. Il Titolare non garantisce l'assenza di errori o interruzioni e non è responsabile per eventuali danni derivanti dall'uso del sito, salvo i casi previsti inderogabilmente dalla legge.",
          "Eventuali garanzie sui risultati sono disciplinate esclusivamente dalle condizioni contrattuali sottoscritte con il cliente.",
        ],
      },
      {
        h: "5. Legge applicabile e foro competente",
        body: [
          "I presenti Termini sono regolati dalla legge italiana. Per le controversie con i consumatori si applica il foro di residenza o domicilio dell'utente; negli altri casi il foro competente è quello del luogo in cui ha sede il Titolare.",
        ],
      },
      {
        h: "6. Contatti",
        body: [`Per qualsiasi informazione: ${EMAIL}.`],
      },
    ],
  },
};

export const LEGAL_LIST = Object.values(LEGAL_DOCS);
