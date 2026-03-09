import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import Navbar from "@/components/sections/Navbar";
import Footer from "@/components/sections/Footer";
import AnimatedBadge from "@/components/custom/AnimatedBadge";
import ImplementationSteps from "@/components/solutions/ImplementationSteps";

const steps = [
  {
    num: "01",
    icon: "🔍",
    title: "Analisi & Configurazione",
    days: "GIORNI 1–7",
    text: "Studiamo il tuo processo di vendita, il tuo mercato, i tuoi prodotti. Configuriamo ogni agente sulla tua lingua commerciale, le tue obiezioni comuni, il tuo territory. Non un template — un sistema costruito sulla tua azienda.",
    details: [
      "Analisi approfondita del tuo ciclo di vendita attuale",
      "Mappatura dei prodotti, listini e margini per commessa",
      "Configurazione CRM con i tuoi campi personalizzati",
      "Setup agente vocale con il linguaggio del tuo settore",
    ],
  },
  {
    num: "02",
    icon: "⚡",
    title: "Training & Test",
    days: "GIORNI 7–12",
    text: "Training su centinaia di scenari reali del settore edile italiano. Test su dialetti, obiezioni tecniche, situazioni complesse. L'agente va live solo dopo aver superato i nostri standard di qualità.",
    details: [
      "Simulazione di chiamate reali con scenari difficili",
      "Test su dialetti regionali e obiezioni tecniche",
      "Validazione con il tuo team prima del go-live",
      "Ottimizzazione degli script di conversazione",
    ],
  },
  {
    num: "03",
    icon: "🚀",
    title: "Go Live & Ottimizzazione",
    days: "DAL GIORNO 14 IN POI",
    text: "L'agente è attivo. Da questo momento lavora per te ogni ora di ogni giorno. Ogni settimana analizziamo le conversazioni, ottimizziamo gli script, miglioriamo le conversion.",
    details: [
      "Monitoraggio continuo delle performance",
      "Report settimanali con KPI e suggerimenti",
      "Ottimizzazione automatica degli script",
      "Supporto dedicato per ogni necessità",
    ],
  },
];

const item = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.25, 1, 0.35, 1] as const } },
};

const ComeFunziona = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        {/* Hero */}
        <section className="bg-primary-bg py-20 md:py-28">
          <div className="max-w-4xl mx-auto px-6 text-center space-y-6">
            <AnimatedBadge variant="verde">IL PROCESSO</AnimatedBadge>
            <h1 className="font-display text-[36px] md:text-[56px] font-extrabold text-neutral-900 leading-[1.1]">
              Operativo in 7-14 Giorni.<br />
              <span className="text-primary">Senza Mal di Testa.</span>
            </h1>
            <p className="text-lg md:text-xl text-neutral-500 max-w-2xl mx-auto leading-relaxed">
              Dal primo contatto al go-live, ti guidiamo in ogni passaggio.
              Nessuna configurazione complicata, nessun consulente che non conosce il tuo settore.
            </p>
          </div>
        </section>

        {/* 3 Step espansi */}
        <section className="bg-background py-16 md:py-24">
          <div className="max-w-5xl mx-auto px-6">
            <motion.div
              ref={ref}
              className="space-y-12"
              initial="hidden"
              animate={inView ? "visible" : "hidden"}
              variants={{ visible: { transition: { staggerChildren: 0.2 } } }}
            >
              {steps.map((step, i) => (
                <motion.div
                  key={step.num}
                  variants={item}
                  className="grid md:grid-cols-[120px_1fr] gap-6 md:gap-10 items-start"
                >
                  <div className="flex flex-col items-center md:items-start gap-3">
                    <div className="text-4xl">{step.icon}</div>
                    <div className="w-14 h-14 rounded-full bg-primary text-primary-foreground font-display font-extrabold text-lg flex items-center justify-center">
                      {step.num}
                    </div>
                    <span className="font-mono text-[10px] uppercase tracking-wider bg-primary-light text-primary-dark px-3 py-1 rounded-full font-medium">
                      {step.days}
                    </span>
                  </div>
                  <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-8 space-y-4">
                    <h3 className="font-display text-2xl font-bold text-neutral-900">{step.title}</h3>
                    <p className="text-neutral-500 leading-relaxed">{step.text}</p>
                    <ul className="grid sm:grid-cols-2 gap-3 pt-2">
                      {step.details.map((d, j) => (
                        <li key={j} className="flex items-start gap-2 text-sm text-neutral-600">
                          <span className="text-primary mt-0.5">✓</span>
                          {d}
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Implementation Steps dettagliati */}
        <ImplementationSteps />

        {/* CTA */}
        <section className="bg-primary-bg py-16 md:py-20">
          <div className="max-w-2xl mx-auto px-6 text-center space-y-6">
            <h2 className="font-display text-[28px] md:text-4xl font-extrabold text-neutral-900">
              Pronto a partire?
            </h2>
            <p className="text-neutral-500 text-lg">
              Prenota una call di analisi gratuita. In 30 minuti ti mostriamo esattamente come funziona per la tua azienda.
            </p>
            <a
              href="/soluzioni"
              className="inline-block bg-primary text-primary-foreground px-8 py-4 rounded-xl text-base font-bold hover:bg-primary-dark hover:scale-[1.02] shadow-button-green transition-all"
            >
              Prenota Demo Gratuita →
            </a>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default ComeFunziona;
