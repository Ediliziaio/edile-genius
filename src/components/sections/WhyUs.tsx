import { motion, useInView } from "framer-motion";
import { useRef, forwardRef } from "react";
import AnimatedBadge from "@/components/custom/AnimatedBadge";

const cards = [
  {
    icon: "🏗️",
    title: "Specializzati Solo nell'Edilizia",
    text: "Non siamo un'azienda AI generalista. Lavoriamo esclusivamente con imprese edili, serramentisti, installatori, progettisti e studi tecnici. Conosciamo i tuoi processi, i tuoi documenti e il tuo linguaggio: per questo i nostri sistemi funzionano dal primo giorno.",
  },
  {
    icon: "🎙️",
    title: "Sistemi Costruiti sui Tuoi Dati",
    text: "Lavoriamo sui tuoi listini, documenti, capitolati e sul tuo gestionale, anche EdiliziaInCloud. Gli agenti vocali parlano un italiano naturale, i documenti seguono i tuoi modelli: niente risposte generiche.",
  },
  {
    icon: "⚡",
    title: "Operativi in 7 Giorni",
    text: "Nessun mese di integrazione. Nessun consulente a tempo indeterminato. Dall'approvazione del progetto al primo sistema in funzione passano di solito circa 7 giorni, senza fermare il lavoro.",
  },
  {
    icon: "📈",
    title: "Miglioramento Settimanale",
    text: "Non consegniamo un prodotto e ci dimentichiamo di te. Ogni settimana analizziamo risultati, conversazioni e documenti prodotti, e miglioriamo il sistema. Il sistema AI migliora settimana dopo settimana, insieme al tuo team.",
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
            Perché Scegliere{" "}
            <span className="text-primary">Edilizia.io.</span>
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
