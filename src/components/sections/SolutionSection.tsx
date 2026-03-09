import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import AnimatedBadge from "@/components/custom/AnimatedBadge";
import { Mic, Bot } from "lucide-react";

const SolutionSection = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="soluzione" className="bg-neutral-50 py-16 md:py-24">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-12 space-y-4">
          <AnimatedBadge variant="verde">LA SOLUZIONE</AnimatedBadge>
          <h2 className="font-display text-[32px] md:text-5xl font-extrabold text-neutral-900 leading-tight">
            <span className="text-primary">Non Assumiamo Persone.</span><br />
            Le Sostituiamo.
          </h2>
        </div>

        <div ref={ref} className="grid md:grid-cols-2 gap-6">
          {/* Card Vocali */}
          <motion.div
            className="bg-background rounded-3xl shadow-card p-6 md:p-10 border-t-4 border-t-primary"
            initial={{ opacity: 0, x: -60 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <AnimatedBadge variant="verde">AGENTI VOCALI</AnimatedBadge>
            <Mic className="text-primary mt-6 mb-4" size={40} strokeWidth={1.5} />
            <h3 className="font-display text-[28px] md:text-[32px] font-extrabold text-neutral-900 leading-tight mb-2">
              Rispondono.<br />Qualificano.<br />Vendono.
            </h3>
            <p className="font-mono text-xs text-primary-dark font-bold mb-4">
              Sostituisce: Segretaria, Commerciale Inbound, Operatore Call Center
            </p>
            <p className="text-neutral-500 leading-relaxed mb-6">
              Il tuo Agente Vocale AI risponde a ogni chiamata in entrata
              con voce naturale, gestisce la conversazione come un venditore
              esperto, qualifica il lead e fissa l'appuntamento nel tuo calendario.
              Tutto in automatico. Tutto tracciato. Disponibile 24/7, 365 giorni.
            </p>
            <ul className="space-y-2 mb-6">
              {[
                "Gestione chiamate inbound H24",
                "Qualifica e fissaggio appuntamenti automatico",
                "Riattivazione database lead freddi",
                "Chiamate outbound per campagne vendita",
              ].map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-neutral-700">
                  <span className="text-primary font-bold">✓</span> {f}
                </li>
              ))}
            </ul>
            <div className="bg-primary-light rounded-xl px-5 py-3 font-mono text-xs text-primary-dark font-medium">
              💰 Costo Dipendente: €2.800/mese → Costo Agente AI: da €590/mese
            </div>
          </motion.div>

          {/* Card Operativi */}
          <motion.div
            className="bg-neutral-900 rounded-3xl shadow-card p-6 md:p-10 border-t-4 border-t-primary"
            initial={{ opacity: 0, x: 60 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <AnimatedBadge variant="dark">AGENTI AI</AnimatedBadge>
            <Bot className="text-primary mt-6 mb-4" size={40} strokeWidth={1.5} />
            <h3 className="font-display text-[28px] md:text-[32px] font-extrabold text-white leading-tight mb-2">
              Automatizzano.<br />Analizzano.<br />Sostituiscono.
            </h3>
            <p className="font-mono text-xs text-primary font-bold mb-4">
              Sostituisce: Impiegata Reportistica, Analista Offerte, Addetto Customer Care
            </p>
            <p className="text-neutral-500 leading-relaxed mb-6">
              Gli Agenti AI operativi entrano nei tuoi processi interni e
              sostituiscono le figure che oggi gestiscono attività ripetitive.
              Dalla reportistica operai all'analisi delle offerte — precisi,
              veloci, senza ferie, malattie o errori umani.
            </p>
            <ul className="space-y-2 mb-6">
              {[
                "Analisi e comparazione offerte fornitori",
                "Reportistica operai e avanzamento cantieri",
                "Gestione assistenze post-vendita",
                "Gestione call center e smistamento richieste",
                "Customer care automatica multi-canale",
                "Documentazione tecnica e preventivi assistiti",
              ].map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-neutral-300">
                  <span className="text-primary font-bold">✓</span> {f}
                </li>
              ))}
            </ul>
            <div className="bg-neutral-800 rounded-xl px-5 py-3 font-mono text-xs text-primary font-medium">
              💰 Costo Dipendente: €2.400/mese → Costo Agente AI: da €590/mese
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default SolutionSection;
