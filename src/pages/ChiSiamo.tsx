import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import Navbar from "@/components/sections/Navbar";
import Footer from "@/components/sections/Footer";
import CounterStat from "@/components/custom/CounterStat";

const milestones = [
  { phase: "Origine", title: "I-Profili S.r.l.", desc: "Azienda serramenti in Lombardia. Il laboratorio dove abbiamo testato ogni strumento." },
  { phase: "Fase 2", title: "Prima automazione interna", desc: "Ordini digitali, controllo margini, previsionale di cassa. Applicato prima su noi stessi." },
  { phase: "Fase 3", title: "Domus Group / Marketing Edile", desc: "Agenzia marketing per il settore edile. Centinaia di imprenditori come clienti." },
  { phase: "Fase 4", title: "Agenti AI vocali", desc: "Prima integrazione di agenti vocali AI nel settore serramenti in Italia." },
  { phase: "Oggi", title: "Edilizia.io", desc: "Il sistema completo disponibile per ogni imprenditore del settore costruzioni." },
];

const ChiSiamo = () => {
  const heroRef = useRef(null);
  const heroInView = useInView(heroRef, { once: true, margin: "-60px" });
  const storyRef = useRef(null);
  const storyInView = useInView(storyRef, { once: true, margin: "-60px" });
  const timelineRef = useRef(null);
  const timelineInView = useInView(timelineRef, { once: true, margin: "-60px" });
  const statsRef = useRef(null);
  const statsInView = useInView(statsRef, { once: true, margin: "-60px" });

  return (
    <div className="min-h-screen bg-[hsl(var(--neutral-900))]">
      <Navbar />

      {/* Hero */}
      <section className="pt-32 pb-20 px-6" ref={heroRef}>
        <motion.div
          className="max-w-4xl mx-auto text-center"
          initial={{ opacity: 0, y: 30 }}
          animate={heroInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <span className="font-mono text-xs uppercase tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full">
            La nostra storia
          </span>
          <h1 className="font-display text-4xl md:text-6xl font-extrabold text-white mt-8 leading-tight">
            Non lo abbiamo inventato in un ufficio.
            <br />
            Lo abbiamo <span className="text-primary">vissuto</span>.
          </h1>
        </motion.div>
      </section>

      {/* Story + Timeline */}
      <section className="pb-24 px-6">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-[1fr_320px] gap-16">
          {/* Narrative */}
          <motion.div
            ref={storyRef}
            className="space-y-6 text-[hsl(var(--neutral-300))] text-base leading-relaxed"
            initial={{ opacity: 0, y: 30 }}
            animate={storyInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            <p className="text-xl font-semibold text-white">Tutto è iniziato con i serramenti.</p>
            <p>
              Ho fondato un'azienda di installazione di infissi e finestre in Lombardia. Cantieri, fornitori, posatori, clienti esigenti. Preventivi sbagliati, margini che sparivano, settimane di lavoro intenso per scoprire a fine mese di essere andati in pareggio.
            </p>
            <p>
              Lavoravo 60 ore a settimana senza capire se stavo guadagnando o solo sopravvivendo.
            </p>

            {/* Quote */}
            <blockquote className="border-l-4 border-primary bg-primary/5 rounded-r-lg px-6 py-5 my-8">
              <p className="text-white italic text-lg leading-relaxed">
                "Ho cercato un software che parlasse la mia lingua — quella del cantiere, del SAL, del preventivo a misura. Non l'ho trovato. Così l'ho costruito."
              </p>
            </blockquote>

            <p className="text-lg font-semibold text-white">Il primo passo: automatizzare la nostra stessa azienda.</p>
            <p>
              Abbiamo digitalizzato ordini, commesse, margini. In pochi mesi sapevamo in tempo reale quanto guadagnavamo su ogni cantiere.
            </p>

            <p className="text-lg font-semibold text-white">Il secondo passo: l'intelligenza artificiale.</p>
            <p>
              Agenti vocali che rispondono ai lead di notte, qualificano i contatti, fissano appuntamenti. Il nostro commerciale ha smesso di rispondere a telefonate inutili.
            </p>

            <p>
              Poi abbiamo aperto Marketing Edile — un'agenzia per aziende del settore costruzioni. Centinaia di imprenditori come clienti. Gli stessi problemi ripetuti ogni volta.
            </p>

            <p className="text-xl font-bold text-white mt-4">
              Così abbiamo aperto Edilizia.io a tutti.
            </p>
            <p className="text-primary font-semibold text-lg">
              Non ti vendiamo software. Ti vendiamo il sistema che usiamo noi stessi.
            </p>
          </motion.div>

          {/* Timeline */}
          <motion.div
            ref={timelineRef}
            className="relative"
            initial={{ opacity: 0 }}
            animate={timelineInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {/* Vertical line */}
            <div className="absolute left-3 top-2 bottom-2 w-px bg-[hsl(var(--neutral-700))]" />

            <div className="space-y-10">
              {milestones.map((m, i) => {
                const isLast = i === milestones.length - 1;
                return (
                  <motion.div
                    key={i}
                    className="relative pl-10"
                    initial={{ opacity: 0, x: 20 }}
                    animate={timelineInView ? { opacity: 1, x: 0 } : {}}
                    transition={{ duration: 0.4, delay: 0.15 * i }}
                  >
                    {/* Dot */}
                    <div
                      className={`absolute left-0 top-1 rounded-full border-2 border-primary ${
                        isLast
                          ? "w-7 h-7 bg-primary shadow-[0_0_20px_hsl(var(--primary)/0.5)] -left-0.5"
                          : "w-5 h-5 bg-[hsl(var(--neutral-900))]"
                      }`}
                    />
                    <span className="font-mono text-[11px] uppercase tracking-wider text-primary">
                      {m.phase}
                    </span>
                    <p className={`font-bold mt-1 ${isLast ? "text-primary text-lg" : "text-white text-sm"}`}>
                      {m.title}
                    </p>
                    <p className="text-[hsl(var(--neutral-500))] text-sm mt-1">{m.desc}</p>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-t border-[hsl(var(--neutral-700))] py-16 px-6" ref={statsRef}>
        <motion.div
          className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 md:divide-x divide-[hsl(var(--neutral-700))]"
          initial={{ opacity: 0, y: 20 }}
          animate={statsInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
        >
          <CounterStat value={10} suffix="+" label="Anni nel settore costruzioni" />
          <CounterStat value={500} suffix="+" label="Aziende edili seguite" />
          <div className="text-center">
            <div className="text-5xl md:text-6xl font-extrabold text-primary font-display">24/7</div>
            <div className="font-mono text-xs text-[hsl(var(--neutral-500))] uppercase tracking-wider mt-2">
              Copertura lead con AI
            </div>
          </div>
          <div className="text-center">
            <div className="text-5xl md:text-6xl font-extrabold text-primary font-display">48h</div>
            <div className="font-mono text-xs text-[hsl(var(--neutral-500))] uppercase tracking-wider mt-2">
              Per essere operativi
            </div>
          </div>
        </motion.div>
      </section>

      <Footer />
    </div>
  );
};

export default ChiSiamo;
