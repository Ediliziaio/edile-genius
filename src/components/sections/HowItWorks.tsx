import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import AnimatedBadge from "@/components/custom/AnimatedBadge";

const steps = [
  {
    num: "01",
    icon: "🔍",
    title: "Analisi & Progetto",
    days: "GIORNI 1–3",
    text: "Studiamo i tuoi processi di ufficio e cantiere, i tuoi documenti, i tuoi listini e il tuo modo di vendere. Ti presentiamo il progetto del sistema: cosa fa, con quali dati e quanto ti fa risparmiare. Non un template, un sistema costruito sulla tua azienda.",
  },
  {
    num: "02",
    icon: "⚡",
    title: "Sviluppo & Test",
    days: "GIORNI 3–7",
    text: "Sviluppiamo agenti e automazioni, li colleghiamo ai tuoi strumenti e li mettiamo alla prova su casi reali del settore edile: telefonate, preventivi, documenti tecnici. Il sistema parte solo dopo aver superato i nostri standard di qualità.",
  },
  {
    num: "03",
    icon: "🚀",
    title: "Avvio & Affiancamento",
    days: "DAL GIORNO 7 IN POI",
    text: "Il sistema è attivo e lavora per te ogni giorno. Formiamo il tuo team, misuriamo i risultati e ogni settimana miglioriamo risposte, automazioni e documenti.",
  },
];

const item = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.25, 1, 0.35, 1] as const } },
};

const HowItWorks = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <section id="come-funziona" className="bg-neutral-50 py-16 md:py-24">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16 space-y-4">
          <AnimatedBadge variant="verde">IL PROCESSO</AnimatedBadge>
          <h2 className="font-display text-[32px] md:text-5xl font-extrabold text-neutral-900 leading-tight">
            Operativo in<br />Circa 7 Giorni.<br />
            <span className="text-primary">Senza Mal di Testa.</span>
          </h2>
        </div>

        <motion.div
          ref={ref}
          className="grid md:grid-cols-3 gap-8 relative"
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          variants={{ visible: { transition: { staggerChildren: 0.15 } } }}
        >
          {/* Connector line (desktop) */}
          <div className="hidden md:block absolute top-12 left-[16.67%] right-[16.67%] h-px border-t-2 border-dashed border-primary/30" />

          {steps.map((step) => (
            <motion.div key={step.num} variants={item} className="text-center space-y-4 relative">
              <div className="text-3xl mb-2">{step.icon}</div>
              <div className="relative inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary text-primary-foreground font-display font-extrabold text-sm mx-auto">
                {step.num}
                <motion.span
                  className="absolute inset-0 rounded-full border-2 border-primary"
                  initial={{ scale: 1, opacity: 0.6 }}
                  animate={inView ? { scale: 1.8, opacity: 0 } : {}}
                  transition={{ duration: 1, delay: 0.3 }}
                />
              </div>
              <h3 className="font-display text-xl font-bold text-neutral-900">{step.title}</h3>
              <span className="inline-block font-mono text-[10px] uppercase tracking-wider bg-primary-light text-primary-dark px-3 py-1 rounded-full font-medium">
                {step.days}
              </span>
              <p className="text-sm text-neutral-500 leading-relaxed max-w-xs mx-auto">{step.text}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default HowItWorks;
