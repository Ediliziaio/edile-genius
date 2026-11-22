import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import FaqList from "@/components/custom/FaqList";

export const faqs = [
  { q: "Posso attivare una sola soluzione o devo prenderle tutte?", a: "Puoi iniziare con una sola soluzione — la più urgente per la tua azienda. Molti clienti partono da ciò che pesa di più, spesso telefono o preventivi, e aggiungono il resto nel tempo. Non c'è obbligo di pacchetti. Cresci al tuo ritmo." },
  { q: "Le soluzioni si integrano con il mio CRM attuale?", a: "Sì. Ci integriamo con i principali CRM utilizzati nel settore edile italiano: HubSpot, Salesforce, Monday, Pipedrive, e i software gestionali più diffusi, ed EdiliziaInCloud, il gestionale del nostro gruppo. Se usi un sistema proprietario, valutiamo insieme le possibilità di integrazione via API." },
  { q: "Quanto tempo ci vuole prima di vedere i primi risultati?", a: "Per gli Agenti Vocali, i primi risultati arrivano dalla prima settimana di operatività — risposte automatiche, appuntamenti fissati, lead qualificati. Per le soluzioni di analisi dati o BI, i risultati più significativi si consolidano nel primo mese, quando il sistema ha elaborato un volume sufficiente di dati." },
  { q: "Le voci degli Agenti Vocali suonano robottiche?", a: "No. Utilizziamo modelli vocali di ultima generazione, addestrati sull'italiano, con gestione naturale delle interruzioni, esitazioni e ritmi del parlato normale. Il cliente non percepisce di stare parlando con un AI. Percepisce che, finalmente, qualcuno ha risposto." },
  { q: "Cosa succede se un cliente pone una domanda che l'agente non sa gestire?", a: "L'agente è configurato per riconoscere le situazioni fuori dal suo perimetro di competenza. In questi casi effettua un trasferimento intelligente all'operatore umano giusto, comunicando al cliente in modo naturale il passaggio. Nessuna risposta errata — solo escalation gestita." },
  { q: "Come viene gestita la privacy dei dati dei miei clienti?", a: "Tutti i dati sono trattati nel rispetto del GDPR. Le conversazioni vengono registrate e archiviate su server europei. Forniamo il DPA (Data Processing Agreement) necessario. Nessun dato viene utilizzato per addestrare modelli di terze parti." },
  { q: "Posso personalizzare il tono di voce e il linguaggio dell'agente?", a: "Assolutamente. Durante la fase di configurazione definiamo insieme il tono (formale, informale, tecnico), le frasi di apertura e chiusura, le risposte alle obiezioni tipiche del tuo settore, e il nome che l'agente usa per presentarsi. L'agente parla come un tuo dipendente — non come un robot generico." },
  { q: "Cosa include la garanzia 30 giorni?", a: "Se dopo 30 giorni operativi la soluzione non ha prodotto almeno i risultati minimi concordati nella call di analisi iniziale, ti rimborsiamo integralmente quanto pagato per quel sistema. Nessuna domanda. Nessuna clausola. Questo è il nostro impegno." },
];

const SolutionsFAQ = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <section className="bg-neutral-50 py-20 md:py-24">
      <div ref={ref} className="max-w-[800px] mx-auto px-6">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-[rgba(62,207,110,0.1)] rounded-full px-4 py-1.5 mb-6">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-primary font-medium">Domande Frequenti</span>
          </div>
          <h2 className="font-display text-[36px] md:text-[48px] font-extrabold text-neutral-900 leading-[1.1]">
            Hai Domande?<br />Abbiamo le Risposte.
          </h2>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5 }}>
          <FaqList items={faqs} group="faq-soluzioni" itemClassName="bg-white" />
        </motion.div>
      </div>
    </section>
  );
};

export default SolutionsFAQ;
