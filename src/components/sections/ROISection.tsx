import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import AnimatedBadge from "@/components/custom/AnimatedBadge";
import CounterStat from "@/components/custom/CounterStat";

const rows = [
  { label: "Gestione chiamate inbound", oggi: "1-2 risorse", conAi: "Agente AI — €0/h" },
  { label: "Ricontatto lead database", oggi: "Mai fatto", conAi: "100% automatico" },
  { label: "Reportistica operai", oggi: "2h/giorno", conAi: "5 minuti/giorno" },
  { label: "Analisi offerte fornitori", oggi: "3h/pratica", conAi: "3 minuti/pratica" },
  { label: "Customer care post-vendita", oggi: "Dedicata", conAi: "Automatica 24/7" },
  { label: "Qualifica lead campagne pub.", oggi: "Commerciale", conAi: "Solo lead caldi" },
];

const ROISection = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <section className="bg-neutral-900 py-16 md:py-24">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-12 space-y-4">
          <AnimatedBadge variant="dark">IL RISPARMIO REALE</AnimatedBadge>
          <h2 className="font-display text-[32px] md:text-5xl font-extrabold text-white leading-tight">
            Quanto Stai<br />Spendendo Oggi<br />in Attività che<br />
            <span className="text-primary">l'AI Può Fare?</span>
          </h2>
          <p className="text-neutral-500 text-lg max-w-xl mx-auto leading-relaxed">
            Considera i costi diretti e indiretti del personale che oggi gestisce
            attività ripetitive automatizzabili. Ogni euro investito in Agenti AI
            produce un ritorno misurabile già dal primo mese.
          </p>
        </div>

        {/* Table */}
        <div ref={ref} className="mb-16 rounded-2xl overflow-hidden border border-neutral-800">
          <div className="grid grid-cols-3 font-mono text-xs uppercase tracking-wider py-3 px-5 border-b border-neutral-800">
            <span className="text-neutral-500">Voce</span>
            <span className="text-neutral-500">Oggi (senza AI)</span>
            <span className="text-primary">Con Edilizia.io</span>
          </div>
          {rows.map((r, i) => (
            <motion.div
              key={r.label}
              className={`grid grid-cols-3 py-3 px-5 text-sm ${i % 2 === 1 ? "bg-neutral-800/50" : ""}`}
              initial={{ opacity: 0, y: 10 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.08, duration: 0.4 }}
            >
              <span className="text-neutral-300 font-medium">{r.label}</span>
              <span className="text-neutral-500">{r.oggi}</span>
              <span className="text-primary font-bold">{r.conAi}</span>
            </motion.div>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:divide-x md:divide-neutral-700">
          <CounterStat value={60} prefix="-" suffix="%" label="Riduzione Costi Fissi" />
          <CounterStat value={3} suffix=".5h" label="Risparmiate Al Giorno" />
          <CounterStat value={1} prefix="ROI +" suffix="°" label="Dal Primo Mese" />
        </div>
      </div>
    </section>
  );
};

export default ROISection;
