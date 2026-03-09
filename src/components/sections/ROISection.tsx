import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import AnimatedBadge from "@/components/custom/AnimatedBadge";
import CounterStat from "@/components/custom/CounterStat";

const rows = [
  { label: "Gestione chiamate inbound", oggi: "Segretaria — €2.200/mese", conAi: "Agente AI — da €590/mese" },
  { label: "Ricontatto lead database", oggi: "Commerciale — mai fatto", conAi: "100% automatico — zero stipendio" },
  { label: "Reportistica operai", oggi: "Impiegata — 2h/giorno", conAi: "5 minuti/giorno — zero stipendio" },
  { label: "Analisi offerte fornitori", oggi: "Analista — 3h/pratica", conAi: "3 minuti/pratica — zero stipendio" },
  { label: "Customer care post-vendita", oggi: "Risorsa dedicata — €2.400/mese", conAi: "Automatica 24/7 — inclusa" },
  { label: "Qualifica lead campagne pub.", oggi: "Commerciale — €3.000/mese", conAi: "Solo lead caldi — automatico" },
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
            Quanto Ti Costa Ogni<br />Dipendente Che Potresti<br />
            <span className="text-primary">Già Aver Sostituito?</span>
          </h2>
          <p className="text-neutral-500 text-lg max-w-xl mx-auto leading-relaxed">
            Ogni figura operativa che oggi gestisce attività ripetitive può
            essere sostituita da un Agente AI. Confronta i costi reali e
            scopri quanto stai sprecando ogni mese in stipendi evitabili.
          </p>
        </div>

        {/* Table */}
        <div ref={ref} className="mb-16 rounded-2xl overflow-hidden border border-neutral-800">
          {/* Desktop table header */}
          <div className="hidden md:grid grid-cols-3 font-mono text-xs uppercase tracking-wider py-3 px-5 border-b border-neutral-800">
            <span className="text-neutral-500">Voce</span>
            <span className="text-neutral-500">Oggi (Dipendente)</span>
            <span className="text-primary">Con Agente AI</span>
          </div>
          {rows.map((r, i) => (
            <motion.div
              key={r.label}
              className={`md:grid md:grid-cols-3 py-4 px-5 text-sm ${i % 2 === 1 ? "bg-neutral-800/50" : ""} ${i > 0 ? "border-t border-neutral-800 md:border-t-0" : ""}`}
              initial={{ opacity: 0, y: 10 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.08, duration: 0.4 }}
            >
              <span className="text-neutral-300 font-medium block mb-2 md:mb-0">{r.label}</span>
              <div className="flex flex-col gap-1 md:contents">
                <span className="text-neutral-500"><span className="md:hidden font-mono text-[10px] uppercase tracking-wider text-neutral-600 mr-2">Oggi:</span>{r.oggi}</span>
                <span className="text-primary font-bold"><span className="md:hidden font-mono text-[10px] uppercase tracking-wider text-neutral-600 mr-2">AI:</span>{r.conAi}</span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:divide-x md:divide-neutral-700">
          <CounterStat value={60} prefix="-" suffix="%" label="Costi del Personale" />
          <CounterStat value={3} suffix=".5h" label="Risparmiate Al Giorno" />
          <CounterStat value={50} prefix="+" suffix="" label="Dipendenti Già Sostituiti" />
        </div>
      </div>
    </section>
  );
};

export default ROISection;
