import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import EicForm from "@/components/EicForm";

const SolutionsCTA = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="cta-soluzioni" className="relative bg-neutral-900 py-16 md:py-24 overflow-hidden">
      <div className="absolute inset-0 opacity-[0.05]" style={{
        backgroundImage: "linear-gradient(hsl(213 26% 15%) 1px, transparent 1px), linear-gradient(90deg, hsl(213 26% 15%) 1px, transparent 1px)",
        backgroundSize: "60px 60px",
      }} />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/10 rounded-full blur-[120px]" />

      <motion.div
        ref={ref}
        className="relative max-w-3xl mx-auto px-6"
        initial={{ clipPath: "inset(100% 0 0 0)" }}
        animate={inView ? { clipPath: "inset(0% 0 0 0)" } : {}}
        transition={{ duration: 0.9, ease: "easeOut" }}
      >
        <div className="text-center mb-10 space-y-4">
          <div className="inline-flex items-center gap-2 bg-[rgba(239,68,68,0.15)] rounded-full px-4 py-1.5 font-mono text-xs uppercase tracking-wider text-[#EF4444] font-semibold">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            Solo 12 Aziende Accettate Ogni Mese
          </div>
          <h2 className="font-display text-[36px] md:text-[64px] font-extrabold text-white leading-[1.05]">
            Quale Soluzione<br />Fa al Caso Tuo?<br /><span className="text-primary">Scoprilo in 30 Minuti.</span>
          </h2>
          <p className="text-neutral-400 text-lg max-w-xl mx-auto leading-relaxed">
            Prenota la consulenza gratuita con uno specialista AI per l'edilizia.
            Analizziamo insieme la tua azienda e ti mostriamo — con numeri concreti — cosa cambierebbe nei prossimi 90 giorni.
          </p>
        </div>

        <div className="bg-neutral-800 rounded-3xl p-4 md:p-6 border border-neutral-700">
          <p className="font-mono text-xs text-primary uppercase tracking-wider font-medium mb-4 text-center">Prenota Ora — Gratuito</p>
          <EicForm source="Soluzioni — Sessione Gratuita" />
          <p className="font-mono text-[11px] text-neutral-500 text-center mt-4">🔒 GDPR compliant · 📅 Risposta entro 4 ore · ✓ Nessun impegno</p>
        </div>

        <div className="mt-10 text-[15px] italic text-neutral-500">
          <p><span className="font-bold text-primary not-italic">P.S.</span> — Non devi sapere quale soluzione ti serve. A questo ci pensiamo noi. Tu devi solo decidere di smettere di perdere clienti e soldi ogni giorno.</p>
        </div>
      </motion.div>
    </section>
  );
};

export default SolutionsCTA;
