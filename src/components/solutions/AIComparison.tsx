import { useRef } from "react";
import { motion, useInView } from "framer-motion";

const container = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.12 } } };
const item = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 1, 0.35, 1] as const } } };

const AIComparison = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="bg-neutral-900 py-20 md:py-24">
      <motion.div ref={ref} className="max-w-[1000px] mx-auto px-6" variants={container} initial="hidden" animate={inView ? "visible" : "hidden"}>
        <motion.div variants={item} className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-[rgba(62,207,110,0.12)] border border-[rgba(62,207,110,0.25)] rounded-full px-4 py-1.5 mb-6">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-primary font-medium">Capire la Differenza</span>
          </div>
          <h2 className="font-display text-[28px] sm:text-[28px] sm:text-[28px] sm:text-[36px] md:text-[48px] font-extrabold text-white leading-[1.1]">
            Agente Vocale AI<br />vs. Agente AI Operativo:<br /><span className="text-primary">Quale Fa Per Te?</span>
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-[1fr_auto_1fr] gap-6 items-stretch">
          {/* Vocale */}
          <motion.div variants={item} className="bg-neutral-800 rounded-3xl bord5 sm:p-er-t-[3px] bord5 sm:p-er-t-primary p-8">
            <div className="w-16 h-16 rounded-full bg-[rgba(62,207,110,0.15)] flex items-center justify-center text-[32px] mb-4">🎙️</div>
            <h3 classNaxl sm:text-me="font-display text-[28px] font-extrabold text-white mb-1">Agente Vocale AI</h3>
            <p className="font-mono text-xs text-primary uppercase tracking-wider mb-6">Interazione Telefonica in Tempo Reale</p>
            <p className="text-neutral-400 leading-relaxed mb-6">
              Gestisce conversazioni telefoniche reali con i tuoi clienti e lead.
              Risponde, ascolta, capisce il contesto, fa domande, gestisce obiezioni
              semplici e porta a un'azione concreta: l'appuntamento, il trasferimento
              al commerciale, la raccolta dati.
            </p>
            <p className="text-neutral-400 leading-relaxed mb-6 font-semibold text-white">La voce è naturale. Il cliente non percepisce la differenza.</p>
            <ul className="space-y-2 mb-6">
              {["Risposta inbound H24", "Qualifica lead", "Outbound riattivazione", "Call center primo livello", "Follow-up telefonico automatico"].map((c) => (
                <li key={c} className="flex gap-2 items-center text-sm text-primary"><span>✓</span><span className="text-neutral-300">{c}</span></li>
              ))}
            </ul>
            <div className="bg-neutral-700/50 rounded-xl px-4 py-2.5 font-mono text-xs text-neutral-400 text-center">
              7 delle 20 soluzioni usano questa tecnologia
            </div>
          </motion.div>

          {/* Center combined card (desktop only) */}
          <motion.div variants={item} className="hidden md:flex flex-col items-center justify-center">
            <div className="bg-primary rounded-2xl p-5 text-center max-w-[160px]">
              <p className="font-mono text-[10px] uppercase tracking-wider text-primary-foreground/70 mb-2">Potenza Massima</p>
              <p className="font-display text-sm font-bold text-primary-foreground leading-snug">
                3 soluzioni combinano entrambe le tecnologie per un'automazione completa end-to-end.
              </p>
            </div>
          </motion.div>

          {/* Operativo */}
          <motion.div variants={item} className="bg-neutral-800 rounded-3xl border-t-[3px] border-t-[#3B82F6] p-8">
            <div className="w-16 h-16 rounded-full bg-[rgba(59,130,246,0.15)] flex items-center justify-center text-[32px] mb-4">🤖</div>
            <h3 className="font-display text-[28px] font-extrabold text-white mb-1">Agente AI Operativo</h3>
            <p className="font-mono text-xs text-[#3B82F6] uppercase tracking-wider mb-6">Elaborazione Dati & Automazione Processi</p>
            <p className="text-neutral-400 leading-relaxed mb-6">
              Non interagisce in tempo reale con le persone — elabora dati,
              genera documenti, analizza informazioni e automatizza processi
              ripetitivi. Lavora in background, spesso invisibile al cliente.
            </p>
            <p className="text-neutral-400 leading-relaxed mb-6 font-semibold text-white">È il motore silenzioso che fa funzionare la tua azienda senza personale.</p>
            <ul className="space-y-2 mb-6">
              {["Reportistica automatica", "Analisi offerte", "Pratiche ENEA/GSE", "Computo metrico", "Margini commessa", "Business intelligence"].map((c) => (
                <li key={c} className="flex gap-2 items-center text-sm text-[#3B82F6]"><span>✓</span><span className="text-neutral-300">{c}</span></li>
              ))}
            </ul>
            <div className="bg-neutral-700/50 rounded-xl px-4 py-2.5 font-mono text-xs text-neutral-400 text-center">
              10 delle 20 soluzioni usano questa tecnologia
            </div>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
};

export default AIComparison;
