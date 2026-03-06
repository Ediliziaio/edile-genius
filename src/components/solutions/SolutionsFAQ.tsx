import { useState, useRef } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

const faqs = [
  { q: "Posso attivare una sola soluzione o devo prenderle tutte?", a: "Puoi iniziare con una sola soluzione — la più urgente per la tua azienda. Molti clienti iniziano con l'Agente Vocale per la qualifica lead, e poi aggiungono soluzioni nel tempo. Non c'è obbligo di pacchetti. Cresci al tuo ritmo." },
  { q: "Le soluzioni si integrano con il mio CRM attuale?", a: "Sì. Ci integriamo con i principali CRM utilizzati nel settore edile italiano: HubSpot, Salesforce, Monday, Pipedrive, e i software gestionali più diffusi. Se usi un sistema proprietario, valutiamo insieme le possibilità di integrazione via API." },
  { q: "Quanto tempo ci vuole prima di vedere i primi risultati?", a: "Per gli Agenti Vocali, i primi risultati arrivano dalla prima settimana di operatività — risposte automatiche, appuntamenti fissati, lead qualificati. Per le soluzioni di analisi dati o BI, i risultati più significativi si consolidano nel primo mese, quando il sistema ha elaborato un volume sufficiente di dati." },
  { q: "Le voci degli Agenti Vocali suonano robottiche?", a: "No. Utilizziamo modelli vocali di ultima generazione, addestrati sull'italiano, con gestione naturale delle interruzioni, esitazioni e ritmi del parlato normale. Il cliente non percepisce di stare parlando con un AI. Percepisce che, finalmente, qualcuno ha risposto." },
  { q: "Cosa succede se un cliente pone una domanda che l'agente non sa gestire?", a: "L'agente è configurato per riconoscere le situazioni fuori dal suo perimetro di competenza. In questi casi effettua un trasferimento intelligente all'operatore umano giusto, comunicando al cliente in modo naturale il passaggio. Nessuna risposta errata — solo escalation gestita." },
  { q: "Come viene gestita la privacy dei dati dei miei clienti?", a: "Tutti i dati sono trattati nel rispetto del GDPR. Le conversazioni vengono registrate e archiviate su server europei. Forniamo il DPA (Data Processing Agreement) necessario. Nessun dato viene utilizzato per addestrare modelli di terze parti." },
  { q: "Posso personalizzare il tono di voce e il linguaggio dell'agente?", a: "Assolutamente. Durante la fase di configurazione definiamo insieme il tono (formale, informale, tecnico), le frasi di apertura e chiusura, le risposte alle obiezioni tipiche del tuo settore, e il nome che l'agente usa per presentarsi. L'agente parla come un tuo dipendente — non come un robot generico." },
  { q: "Cosa include la garanzia 30 giorni?", a: "Se dopo 30 giorni operativi la soluzione non ha prodotto almeno i risultati minimi concordati nella call di analisi iniziale, ti rimborsamo integralmente il primo mese di servizio. Nessuna domanda. Nessuna clausola. Questo è il nostro impegno." },
];

const SolutionsFAQ = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
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

        <div className="space-y-3">
          {faqs.map((faq, i) => {
            const isOpen = openIndex === i;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: i * 0.07, duration: 0.5, ease: [0.25, 1, 0.35, 1] }}
                className={`bg-white border rounded-xl overflow-hidden transition-colors ${isOpen ? 'border-l-primary border-l-[3px] border-neutral-200' : 'border-neutral-200'}`}
              >
                <button
                  className="w-full flex items-center justify-between px-6 py-5 text-left"
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                >
                  <span className="font-display font-semibold text-neutral-900 pr-4">{faq.q}</span>
                  <motion.span animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.25, ease: "easeInOut" }}>
                    <ChevronDown size={20} className="text-neutral-400 shrink-0" />
                  </motion.span>
                </button>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                    >
                      <div className="px-6 pb-5 text-neutral-600 leading-relaxed">{faq.a}</div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default SolutionsFAQ;
