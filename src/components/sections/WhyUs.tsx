import { motion, useInView } from "framer-motion";
import { useRef, forwardRef } from "react";
import AnimatedBadge from "@/components/custom/AnimatedBadge";

const cards = [
  {
    icon: "🏗️",
    title: "Specializzati nel Sostituire Figure Edili",
    text: "Non siamo un'azienda AI generalista. Esistiamo esclusivamente per serramenti, infissi, fotovoltaico, ristrutturazioni e impianti. Sappiamo esattamente quali figure puoi sostituire, come farlo e quanto risparmierai. Questa specializzazione vale +30% di efficacia rispetto a soluzioni generiche.",
  },
  {
    icon: "🎙️",
    title: "Voci Italiane Indistinguibili da un Umano",
    text: "Nessun accento straniero, nessun robot. Le nostre voci sono costruite su modelli linguistici italiani, con gestione del dialetto, delle interruzioni, delle esitazioni naturali. I tuoi clienti non si accorgono di parlare con un AI. Il dipendente sostituito non mancherà a nessuno.",
  },
  {
    icon: "⚡",
    title: "Operativi in 7 Giorni — Il Dipendente Se Ne Va, l'AI Arriva",
    text: "Nessun mese di integrazione. Nessun consulente a tempo indeterminato. Dal momento in cui decidi chi sostituire alla prima chiamata gestita dall'Agente AI: meno di due settimane. Zero downtime operativo.",
  },
  {
    icon: "📈",
    title: "Ottimizzazione Settimanale — Meglio di Qualsiasi Formazione",
    text: "Non consegniamo un prodotto e ci dimentichiamo di te. Ogni settimana analizziamo le conversazioni, identifichiamo i punti di miglioramento e ottimizziamo script e risposte. L'Agente AI diventa più bravo ogni giorno — nessun dipendente umano migliora così velocemente.",
  },
];

const item = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.25, 1, 0.35, 1] as const } },
};

const WhyUs = forwardRef<HTMLElement>(function WhyUs(_, _ref) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <section className="bg-neutral-50 py-16 md:py-24">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-12 space-y-4">
          <AnimatedBadge variant="verde">IL NOSTRO VANTAGGIO</AnimatedBadge>
          <h2 className="font-display text-[32px] md:text-5xl font-extrabold text-neutral-900 leading-tight">
            L'Azienda che{" "}
            <span className="text-primary">Licenzia<br />i Tuoi Costi.</span>{" "}
            Non per Tutti.
          </h2>
        </div>

        <motion.div
          ref={ref}
          className="grid md:grid-cols-2 gap-5"
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
        >
          {cards.map((c) => (
            <motion.div
              key={c.title}
              variants={item}
              className="bg-background rounded-[20px] shadow-card p-8 border border-transparent hover:border-primary/50 hover:shadow-card-green transition-all duration-250"
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-2xl mb-4">
                {c.icon}
              </div>
              <h3 className="font-display text-xl font-bold text-neutral-900 mb-3">{c.title}</h3>
              <p className="text-sm text-neutral-500 leading-relaxed">{c.text}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
});

WhyUs.displayName = "WhyUs";

export default WhyUs;
