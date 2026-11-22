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
            <span className="text-primary">L'AI Fa il Lavoro Ripetitivo.</span><br />
            Il Tuo Team Fa il Resto.
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
            <AnimatedBadge variant="verde">CLIENTI E VENDITE</AnimatedBadge>
            <Mic className="text-primary mt-6 mb-4" size={40} strokeWidth={1.5} />
            <h3 className="font-display text-[28px] md:text-[32px] font-extrabold text-neutral-900 leading-tight mb-2">
              Rispondono.<br />Preventivano.<br />Mostrano.
            </h3>
            <p className="font-mono text-xs text-primary-dark font-bold mb-4">
              Si occupa di: telefono, WhatsApp, preventivi, render
            </p>
            <p className="text-neutral-500 leading-relaxed mb-6">
              Dal primo contatto al contratto: l'agente vocale risponde e qualifica,
              il preventivo si prepara da una nota vocale o da una foto, il render
              mostra al cliente il lavoro finito. Tutto tracciato, 24 ore su 24.
            </p>
            <ul className="space-y-2 mb-6">
              {[
                "Agente vocale e WhatsApp H24",
                "Preventivi da nota vocale o foto, sul tuo listino",
                "Render AI per il cliente prima della firma",
                "Riattivazione dei preventivi non chiusi",
              ].map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-neutral-700">
                  <span className="text-primary font-bold">✓</span> {f}
                </li>
              ))}
            </ul>
            <div className="bg-primary-light rounded-xl px-5 py-3 font-mono text-xs text-primary-dark font-medium">
              📅 Attivo 24/7, collegato al tuo calendario e al tuo CRM
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
              Automatizzano.<br />Analizzano.<br />Semplificano.
            </h3>
            <p className="font-mono text-xs text-primary font-bold mb-4">
              Prende in carico: report, confronto offerte, assistenza clienti
            </p>
            <p className="text-neutral-500 leading-relaxed mb-6">
              Gli Agenti AI operativi entrano nei tuoi processi interni e
              si occupano delle attività ripetitive che oggi rallentano l'ufficio.
              Dalla reportistica operai all'analisi delle offerte: precisi,
              veloci e sempre disponibili.
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
              🔗 Collegato ai tuoi strumenti: Excel, email, WhatsApp ed EdiliziaInCloud
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default SolutionSection;
