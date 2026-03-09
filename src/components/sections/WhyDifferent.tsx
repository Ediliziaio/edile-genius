import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const leftItems = [
  { emoji: "🏗️", title: "Costruito dall'interno del settore", text: "Nato da chi ha gestito cantieri, posatori e fornitori. Ogni funzione risolve un problema reale vissuto in prima persona." },
  { emoji: "🤖", title: "AI verticale per le costruzioni", text: "Agenti vocali addestrati sul linguaggio del settore: SAL, preventivi a misura, pratiche ENEA. Non AI generica." },
  { emoji: "📞", title: "Risponde ai tuoi lead mentre dormi", text: "L'agente vocale qualifica i nuovi contatti 24/7, fissa appuntamenti e aggiorna il CRM in automatico." },
  { emoji: "📊", title: "Controllo margini in tempo reale", text: "Sai quanto guadagni su ogni commessa ogni settimana. Non a fine anno quando è troppo tardi." },
  { emoji: "⚡", title: "Operativo in 48 ore, non in mesi", text: "Onboarding guidato, dati importati, team formato. Sei operativo in due giorni." },
];

const rightItems = [
  { emoji: "💼", title: "Software generici non adattati", text: "Gestionali pensati per il commercio. Li usi per forza, non perché funzionano per te." },
  { emoji: "🤖", title: "AI copiata da altri settori", text: "Chatbot dal retail che non capiscono un SAL né una pratica ENEA." },
  { emoji: "📵", title: "Il telefono suona ancora di notte", text: "Nessuna automazione. I lead si raffreddano. Il concorrente richiama prima." },
  { emoji: "📉", title: "Scopri i margini a fine anno", text: "Il commercialista ti dice a dicembre che tre commesse erano in perdita." },
  { emoji: "⏳", title: "Mesi di implementazione", text: "Consulenti che non conoscono il settore, configurazioni infinite, usi il 20% delle funzioni." },
];

const container = { hidden: {}, visible: { transition: { staggerChildren: 0.1 } } };
const item = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

const WhyDifferent = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="py-24 bg-[hsl(var(--neutral-900))]" ref={ref}>
      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
        >
          <span className="font-mono text-xs uppercase tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full">
            Il nostro differenziale
          </span>
          <h2 className="font-display text-3xl md:text-5xl font-extrabold text-white mt-6 mb-4">
            Perché Edilizia.io è <span className="text-primary">radicalmente diverso</span>?
          </h2>
          <p className="text-[hsl(var(--neutral-500))] max-w-2xl mx-auto text-lg">
            Non siamo una software house che ha deciso di fare un prodotto per l'edilizia.{" "}
            <span className="text-[hsl(var(--neutral-300))] font-semibold">
              Siamo un'azienda edile che ha costruito gli strumenti che non trovava sul mercato.
            </span>
          </p>
        </motion.div>

        {/* Two columns */}
        <div className="grid md:grid-cols-2 gap-0">
          {/* Left — Edilizia.io */}
          <motion.div
            className="md:border-r border-[hsl(var(--neutral-700))] md:pr-10 space-y-8"
            variants={container}
            initial="hidden"
            animate={inView ? "visible" : "hidden"}
          >
            <h3 className="font-display text-xl font-bold text-primary mb-2">Edilizia.io</h3>
            {leftItems.map((it, i) => (
              <motion.div key={i} variants={item} className="flex gap-4">
                <span className="text-2xl mt-0.5 shrink-0">{it.emoji}</span>
                <div>
                  <p className="font-bold text-white text-sm mb-1">{it.title}</p>
                  <p className="text-[hsl(var(--neutral-500))] text-sm leading-relaxed">{it.text}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Right — Le alternative */}
          <motion.div
            className="md:pl-10 space-y-8 mt-12 md:mt-0"
            variants={container}
            initial="hidden"
            animate={inView ? "visible" : "hidden"}
          >
            <h3 className="font-display text-xl font-bold text-[hsl(var(--neutral-500))] mb-2">Le alternative</h3>
            {rightItems.map((it, i) => (
              <motion.div key={i} variants={item} className="flex gap-4 opacity-60">
                <span className="text-2xl mt-0.5 shrink-0 grayscale">{it.emoji}</span>
                <div>
                  <p className="font-bold text-[hsl(var(--neutral-500))] text-sm mb-1 line-through">{it.title}</p>
                  <p className="text-[hsl(var(--neutral-700))] text-sm leading-relaxed">{it.text}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default WhyDifferent;
