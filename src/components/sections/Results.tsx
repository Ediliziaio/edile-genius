import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import AnimatedBadge from "@/components/custom/AnimatedBadge";
import CounterStat from "@/components/custom/CounterStat";

const metrics = [
  { value: 90, prefix: "+", suffix: "%", label: "Tasso di Risposta ai Lead" },
  { value: 65, prefix: "-", suffix: "%", label: "Tempo Non-Vendita" },
  { value: 25, prefix: "+", suffix: "%", label: "Lead Freddi Riattivati" },
  { value: 3, suffix: "X", label: "Appuntamenti per Commerciale" },
  { value: 60, prefix: "-", suffix: "%", label: "Costi del Personale Operativo" },
];

const Results = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <section id="risultati" className="bg-background py-16 md:py-24">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-12 space-y-4">
          <AnimatedBadge variant="verde">RISULTATI REALI</AnimatedBadge>
          <h2 className="font-display text-[32px] md:text-5xl font-extrabold text-neutral-900 leading-tight">
            50+ Dipendenti Già Sostituiti.<br />
            <span className="text-primary">Ecco i Numeri.</span>
          </h2>
        </div>

        <div ref={ref} className="grid lg:grid-cols-2 gap-8">
          {/* Metrics */}
          <div className="space-y-4">
            {metrics.map((m) => (
              <div key={m.label} className="bg-neutral-50 rounded-2xl p-5 border-l-[3px] border-l-primary flex items-center gap-4">
                <CounterStat
                  value={m.value}
                  prefix={m.prefix}
                  suffix={m.suffix}
                  label={m.label}
                  className="text-left"
                />
              </div>
            ))}
          </div>

          {/* Testimonial */}
          <motion.div
            className="bg-neutral-900 rounded-3xl p-8 md:p-10 relative"
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <span className="absolute top-4 left-6 font-display text-[120px] font-extrabold text-primary/15 leading-none select-none">"</span>
            <blockquote className="relative z-10 text-white text-lg italic leading-relaxed mb-6 pt-12">
              "Ho sostituito la segretaria e il primo commerciale inbound.
              In 30 giorni l'Agente AI ha fissato più appuntamenti di
              entrambi messi insieme. Con il risparmio sugli stipendi ho
              coperto il costo del servizio per tutto l'anno e reinvestito
              il resto in cantiere."
            </blockquote>
            <div className="space-y-1">
              <p className="text-white font-display font-bold text-sm">— Marco T.</p>
              <p className="font-mono text-[11px] text-neutral-500">
                Titolare azienda serramenti · Lombardia · 22 dipendenti
              </p>
            </div>
            <div className="flex gap-1 mt-4 text-accent-gold">
              {Array.from({ length: 5 }).map((_, i) => <span key={i}>⭐</span>)}
            </div>
            <p className="font-mono text-[10px] text-neutral-600 mt-4">
              *Risultati indicativi. Variano in base a volume lead e organico aziendale.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Results;
