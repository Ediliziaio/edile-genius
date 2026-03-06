import { useRef } from "react";
import { motion, useInView } from "framer-motion";

const steps = [
  { num: "01", title: "CALL DI ANALISI — GIORNO 1", text: "Analizziamo insieme il tuo processo attuale, i tuoi prodotti, il tuo mercato locale e il tuo CRM. Definiamo gli obiettivi misurabili: quanti lead, quale tasso di conversione, quali KPI monitorare. Niente template — parte tutto dalla tua realtà." },
  { num: "02", title: "CONFIGURAZIONE & TRAINING — GIORNI 1-7", text: "Configuriamo l'agente sul tuo linguaggio commerciale, i tuoi prodotti, le tue obiezioni tipiche. Per gli Agenti Vocali: training sulla voce, sul dialetto locale, sulle interruzioni naturali. Test su decine di scenari prima di andare live." },
  { num: "03", title: "TEST & VALIDAZIONE — GIORNI 7-12", text: "L'agente viene testato in ambiente controllato. Simuliamo chiamate reali, scenari difficili, clienti esigenti. Solo quando supera i nostri standard qualitativi — e i tuoi — andiamo live. Non c'è fretta: meglio farlo bene una volta sola." },
  { num: "04", title: "GO LIVE & OTTIMIZZAZIONE CONTINUA — DAL GIORNO 14", text: "L'agente è operativo. Da questo momento ogni settimana analizziamo le conversazioni, ottimizziamo gli script, miglioriamo i tassi di conversione. Non è un prodotto che si compra e si dimentica — è un sistema che migliora ogni giorno." },
];

const ImplementationSteps = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="bg-white py-20 md:py-24">
      <div ref={ref} className="max-w-[900px] mx-auto px-6">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-[rgba(62,207,110,0.1)] rounded-full px-4 py-1.5 mb-6">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-primary font-medium">Come Si Implementa</span>
          </div>
          <h2 className="font-display text-[36px] md:text-[48px] font-extrabold text-neutral-900 leading-[1.1]">
            Da Zero a Operativo<br />in <span className="text-primary">7-14 Giorni.</span><br />Per Ogni Soluzione.
          </h2>
        </div>

        <div className="space-y-8 md:space-y-12">
          {steps.map((step, i) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, x: i % 2 === 0 ? -40 : 40 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.15, ease: [0.25, 1, 0.35, 1] }}
              className={`relative ${i % 2 === 1 ? 'md:ml-auto' : ''} md:max-w-[75%]`}
            >
              <div className="absolute -left-4 md:left-0 top-0 font-display text-[100px] md:text-[120px] font-extrabold text-neutral-100 leading-none -z-0 select-none pointer-events-none">
                {step.num}
              </div>
              <div className="relative bg-white border-l-[3px] border-l-primary shadow-card rounded-2xl p-7 md:p-8">
                <p className="font-mono text-xs text-primary uppercase tracking-wider font-medium mb-2">{step.title}</p>
                <p className="text-neutral-600 leading-relaxed">{step.text}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ImplementationSteps;
