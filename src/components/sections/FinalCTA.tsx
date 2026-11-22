import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import EicForm from "@/components/EicForm";

const FinalCTA = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="cta-finale" className="relative bg-neutral-900 py-16 md:py-24 overflow-hidden">
      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage: "linear-gradient(hsl(var(--neutral-700)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--neutral-700)) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
      {/* Blob */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/10 rounded-full blur-[120px]" />

      <motion.div
        ref={ref}
        className="relative max-w-3xl mx-auto px-6"
        initial={{ clipPath: "inset(100% 0 0 0)" }}
        animate={inView ? { clipPath: "inset(0% 0 0 0)" } : {}}
        transition={{ duration: 0.9, ease: "easeOut" }}
      >
        <div className="text-center mb-10 space-y-4">
          <div className="inline-flex items-center gap-2 bg-accent-orange/20 rounded-full px-4 py-1.5 font-mono text-xs uppercase tracking-wider text-accent-orange font-semibold">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            ⚡ Posti Limitati — 12 Aziende al Mese
          </div>

          <h2 className="font-display text-[28px] sm:text-[28px] sm:text-[36px] md:text-[72px] font-extrabold text-white leading-[1.05]">
            Progettiamo<br />
            <span className="text-primary">il tuo sistema AI.</span><br />
            Parti dall'analisi.
          </h2>

          <p className="text-neutral-500 text-lg max-w-xl mx-auto leading-relaxed">
            30 minuti con uno specialista, gratis. Analizziamo come lavori,
            individuiamo dove l'intelligenza artificiale ti fa risparmiare
            tempo e denaro e ti mostriamo il progetto, con numeri concreti.
          </p>
        </div>

        {/* Form Card — embed EdiliziaInCloud (i lead arrivano direttamente a EiC) */}
        <div className="bg-neutral-800 rounded-3xl p-4 md:p-6 border border-neutral-700">
          <p className="font-mono text-xs text-primary uppercase tracking-wider font-medium mb-4 text-center">
            Consulenza gratuita — Progetta il tuo sistema AI
          </p>
          <EicForm source="Home — Consulenza gratuita" />
          <p className="font-mono text-[11px] text-neutral-500 text-center mt-4">
            🔒 Dati protetti · 📅 Risposta entro 4 ore · ✓ Nessun venditore aggressivo
          </p>
        </div>

        {/* P.S. */}
        <div className="mt-10 space-y-4 text-[15px] italic text-neutral-500">
          <p>
            <span className="font-bold text-primary not-italic">P.S.</span> — Nel peggiore dei casi esci con una mappa chiara dei tuoi
            processi e di dove l'AI può aiutarti subito. Nel migliore dei casi,
            hai già il progetto del sistema che ti farà risparmiare ogni mese.
          </p>
          <p>
            <span className="font-bold text-primary not-italic">P.P.S.</span> — Lavoriamo solo con titolari e soci che prendono decisioni.
            Se sei uno di loro, questa è la tua chiamata.
          </p>
        </div>
      </motion.div>
    </section>
  );
};

export default FinalCTA;
