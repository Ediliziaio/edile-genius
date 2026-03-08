import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import AnimatedBadge from "@/components/custom/AnimatedBadge";

const cards = [
  {
    icon: "🏗️",
    title: "Solo Settore Edile",
    text: "Non siamo un'agenzia AI generalista. Esistiamo esclusivamente per serramenti, infissi, fotovoltaico, ristrutturazioni e impianti. Conosciamo il linguaggio tecnico, le obiezioni tipiche, la stagionalità del settore. Questa specializzazione vale +30% di conversione rispetto a soluzioni generiche.",
  },
  {
    icon: "🎙️",
    title: "Voci Italiane Naturali",
    text: "Nessun accento straniero, nessun robot. Le nostre voci sono costruite su modelli linguistici italiani, con gestione del dialetto, delle interruzioni, delle esitazioni naturali. I tuoi clienti non si accorgono di parlare con un AI.",
  },
  {
    icon: "⚡",
    title: "Operativo in 7-14 Giorni",
    text: "Nessun mese di integrazione. Nessun consulente a tempo indeterminato. Il nostro processo di onboarding è ottimizzato per il settore edile: dalla firma del contratto alla prima chiamata gestita dall'agente, in meno di due settimane.",
  },
  {
    icon: "📈",
    title: "Ottimizzazione Settimanale",
    text: "Non consegniamo un prodotto e ci dimentichiamo di te. Ogni settimana analizziamo le conversazioni, identifichiamo i punti di miglioramento e ottimizziamo script e risposte. L'agente diventa più bravo ogni giorno che passa.",
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
            Specializzazione<br />Verticale.{" "}
            <span className="text-primary">Non<br />Siamo per Tutti.</span>
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
};

export default WhyUs;
