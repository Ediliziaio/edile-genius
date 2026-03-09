import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Hammer, FlaskConical, HardHat, Eye, Target, ShieldCheck, Building2, Rocket, TrendingUp } from "lucide-react";
import Navbar from "@/components/sections/Navbar";
import Footer from "@/components/sections/Footer";
import Guarantee from "@/components/sections/Guarantee";
import CounterStat from "@/components/custom/CounterStat";
import AnimatedBadge from "@/components/custom/AnimatedBadge";

/* ── animation variants ── */
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.25, 1, 0.35, 1] as const } },
};
const stagger = { visible: { transition: { staggerChildren: 0.15 } } };

/* ── data ── */
const differentiators = [
  {
    icon: Hammer,
    title: "Nati In Cantiere",
    text: "Non siamo una software house. Abbiamo fondato un'azienda di serramenti, gestito cantieri, posatori, fornitori. Conosciamo i tuoi problemi perché li abbiamo vissuti.",
  },
  {
    icon: FlaskConical,
    title: "Testato Su Noi Stessi",
    text: "Ogni strumento che ti proponiamo lo abbiamo usato prima sulla nostra azienda. Zero teoria, solo sistemi che hanno funzionato nella pratica.",
  },
  {
    icon: HardHat,
    title: "Solo Edilizia",
    text: "Non facciamo AI per ristoranti, e-commerce o startup tech. Parliamo la lingua del SAL, del preventivo a misura, del cantiere. Solo quella.",
  },
];

const milestones = [
  { icon: Building2, phase: "Origine", title: "I-Profili S.r.l.", desc: "Azienda serramenti in Lombardia. Il laboratorio dove abbiamo testato ogni strumento su noi stessi.", highlight: false },
  { icon: TrendingUp, phase: "Fase 2", title: "Prima automazione interna", desc: "Ordini digitali, controllo margini, previsionale di cassa. Applicato prima su di noi, poi offerto ad altri.", highlight: false },
  { icon: Target, phase: "Fase 3", title: "Marketing Edile", desc: "Agenzia marketing per il settore edile. Centinaia di imprenditori come clienti. Stessi problemi, ogni volta.", highlight: false },
  { icon: FlaskConical, phase: "Fase 4", title: "Agenti AI vocali", desc: "Prima integrazione di agenti vocali AI nel settore serramenti in Italia. Il nostro commerciale ha smesso di rispondere a chiamate inutili.", highlight: false },
  { icon: Rocket, phase: "Oggi", title: "Edilizia.io", desc: "Il sistema completo — testato, perfezionato, disponibile per ogni imprenditore del settore costruzioni.", highlight: true },
];

const values = [
  { icon: Eye, title: "Trasparenza Radicale", text: "Niente costi nascosti, niente vincoli contrattuali. Vedi esattamente quanto spendi e quanto risparmi." },
  { icon: Target, title: "Risultati Misurabili", text: "Se il tuo agente AI non batte il dipendente che ha sostituito entro 30 giorni, ti rimborsiamo." },
  { icon: HardHat, title: "Ossessione Per L'Edilizia", text: "Non inseguiamo trend. Risolviamo i problemi reali di chi gestisce cantieri, preventivi e commerciali." },
];

const ChiSiamo = () => {
  const heroRef = useRef(null);
  const heroInView = useInView(heroRef, { once: true, margin: "-60px" });
  const diffRef = useRef(null);
  const diffInView = useInView(diffRef, { once: true, margin: "-60px" });
  const storyRef = useRef(null);
  const storyInView = useInView(storyRef, { once: true, margin: "-60px" });
  const timelineRef = useRef(null);
  const timelineInView = useInView(timelineRef, { once: true, margin: "-60px" });
  const statsRef = useRef(null);
  const statsInView = useInView(statsRef, { once: true, margin: "-60px" });
  const valuesRef = useRef(null);
  const valuesInView = useInView(valuesRef, { once: true, margin: "-60px" });

  return (
    <div className="min-h-screen bg-[hsl(var(--neutral-900))]">
      <Navbar variant="dark" />

      {/* ─── Hero ─── */}
      <section className="pt-32 pb-20 px-6" ref={heroRef}>
        <motion.div
          className="max-w-4xl mx-auto text-center"
          initial="hidden"
          animate={heroInView ? "visible" : "hidden"}
          variants={stagger}
        >
          <motion.div variants={fadeUp}>
            <AnimatedBadge>LA NOSTRA STORIA</AnimatedBadge>
          </motion.div>
          <motion.h1
            variants={fadeUp}
            className="font-display text-4xl md:text-6xl font-extrabold text-white mt-8 leading-tight"
          >
            Non Abbiamo Inventato L'AI In Un Ufficio.
            <br />
            L'Abbiamo <span className="text-primary">Testata In Cantiere</span>.
          </motion.h1>
          <motion.p
            variants={fadeUp}
            className="text-lg md:text-xl text-[hsl(var(--neutral-300))] mt-6 max-w-2xl mx-auto leading-relaxed"
          >
            Veniamo dal settore edile. Abbiamo gestito cantieri, posatori e commerciali prima di scrivere una sola riga di codice.
            Ogni strumento che ti proponiamo ha funzionato <span className="text-white font-semibold">prima sulla nostra azienda</span>.
          </motion.p>
        </motion.div>
      </section>

      {/* ─── Perché Siamo Diversi ─── */}
      <section className="py-16 md:py-24 px-6 border-t border-[hsl(var(--neutral-800))]" ref={diffRef}>
        <div className="max-w-5xl mx-auto">
          <motion.div
            className="text-center mb-14"
            initial="hidden"
            animate={diffInView ? "visible" : "hidden"}
            variants={fadeUp}
          >
            <h2 className="font-display text-3xl md:text-5xl font-extrabold text-white">
              Perché Siamo <span className="text-primary">Diversi</span>
            </h2>
            <p className="text-[hsl(var(--neutral-400))] mt-4 max-w-xl mx-auto">
              Non siamo consulenti generici. Non siamo una software house. Siamo imprenditori edili che hanno costruito gli strumenti che mancavano.
            </p>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-3 gap-6"
            initial="hidden"
            animate={diffInView ? "visible" : "hidden"}
            variants={stagger}
          >
            {differentiators.map((d, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                className="bg-[hsl(var(--neutral-800))] border border-[hsl(var(--neutral-700))] rounded-2xl p-8 text-center hover:border-primary/40 transition-colors"
              >
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
                  <d.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="font-display text-xl font-bold text-white mb-3">{d.title}</h3>
                <p className="text-[hsl(var(--neutral-400))] text-sm leading-relaxed">{d.text}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── La Nostra Storia + Timeline ─── */}
      <section className="py-16 md:py-24 px-6 border-t border-[hsl(var(--neutral-800))]">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-[1fr_360px] gap-16">
          {/* Narrative */}
          <motion.div
            ref={storyRef}
            className="space-y-6 text-[hsl(var(--neutral-300))] text-base leading-relaxed"
            initial="hidden"
            animate={storyInView ? "visible" : "hidden"}
            variants={stagger}
          >
            <motion.p variants={fadeUp} className="text-2xl font-bold text-white">
              Tutto è iniziato con i serramenti.
            </motion.p>
            <motion.p variants={fadeUp}>
              Ho fondato un'azienda di installazione di infissi e finestre in Lombardia. Cantieri, fornitori, posatori, clienti esigenti. Preventivi sbagliati, margini che sparivano, settimane di lavoro intenso per scoprire a fine mese di essere andati in pareggio.
            </motion.p>
            <motion.p variants={fadeUp} className="text-white font-semibold text-lg">
              Lavoravo 60 ore a settimana senza capire se stavo guadagnando o solo sopravvivendo.
            </motion.p>

            <motion.blockquote
              variants={fadeUp}
              className="border-l-4 border-primary bg-primary/5 rounded-r-xl px-6 py-5 my-8"
            >
              <p className="text-white italic text-lg leading-relaxed">
                "Ho cercato un software che parlasse la mia lingua — quella del cantiere, del SAL, del preventivo a misura. Non l'ho trovato. Così l'ho costruito."
              </p>
            </motion.blockquote>

            <motion.p variants={fadeUp} className="text-xl font-bold text-white">
              Il primo passo: automatizzare la nostra stessa azienda.
            </motion.p>
            <motion.p variants={fadeUp}>
              Abbiamo digitalizzato ordini, commesse, margini. In pochi mesi sapevamo in tempo reale quanto guadagnavamo su ogni cantiere. Zero fogli Excel, zero "vediamo a fine anno".
            </motion.p>

            <motion.p variants={fadeUp} className="text-xl font-bold text-white">
              Il secondo passo: l'intelligenza artificiale.
            </motion.p>
            <motion.p variants={fadeUp}>
              Agenti vocali che rispondono ai lead di notte, qualificano i contatti, fissano appuntamenti. Il nostro commerciale ha smesso di rispondere a telefonate inutili e ha iniziato a chiudere contratti.
            </motion.p>

            <motion.p variants={fadeUp}>
              Poi abbiamo aperto Marketing Edile — un'agenzia per aziende del settore costruzioni. Centinaia di imprenditori come clienti. <span className="text-white font-semibold">Gli stessi problemi ripetuti ogni singola volta.</span>
            </motion.p>

            <motion.div variants={fadeUp} className="pt-4 border-t border-[hsl(var(--neutral-700))]">
              <p className="text-2xl font-extrabold text-white">
                Così abbiamo aperto Edilizia.io a tutti.
              </p>
              <p className="text-primary font-bold text-lg mt-2">
                Non ti vendiamo software. Ti vendiamo il sistema che usiamo noi stessi — ogni giorno.
              </p>
            </motion.div>
          </motion.div>

          {/* Timeline */}
          <motion.div
            ref={timelineRef}
            className="relative"
            initial="hidden"
            animate={timelineInView ? "visible" : "hidden"}
            variants={stagger}
          >
            <div className="absolute left-5 top-4 bottom-4 w-px bg-gradient-to-b from-[hsl(var(--neutral-700))] via-primary/40 to-primary" />

            <div className="space-y-8">
              {milestones.map((m, i) => (
                <motion.div
                  key={i}
                  className="relative pl-14"
                  variants={fadeUp}
                >
                  {/* Icon dot */}
                  <div
                    className={`absolute left-0 top-1 w-10 h-10 rounded-xl flex items-center justify-center border-2 ${
                      m.highlight
                        ? "bg-primary border-primary shadow-[0_0_24px_hsl(var(--primary)/0.5)]"
                        : "bg-[hsl(var(--neutral-800))] border-[hsl(var(--neutral-700))]"
                    }`}
                  >
                    <m.icon className={`w-5 h-5 ${m.highlight ? "text-primary-foreground" : "text-primary"}`} />
                  </div>

                  <div className={`rounded-xl p-4 ${m.highlight ? "bg-primary/10 border border-primary/30" : "bg-[hsl(var(--neutral-800))] border border-[hsl(var(--neutral-700))]"}`}>
                    <span className="font-mono text-[11px] uppercase tracking-wider text-primary">
                      {m.phase}
                    </span>
                    <p className={`font-bold mt-1 ${m.highlight ? "text-primary text-lg" : "text-white text-sm"}`}>
                      {m.title}
                    </p>
                    <p className="text-[hsl(var(--neutral-500))] text-sm mt-1">{m.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── Stats bar ─── */}
      <section className="border-t border-[hsl(var(--neutral-700))] py-16 px-6" ref={statsRef}>
        <motion.div
          className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 md:divide-x divide-[hsl(var(--neutral-700))]"
          initial="hidden"
          animate={statsInView ? "visible" : "hidden"}
          variants={stagger}
        >
          <motion.div variants={fadeUp}>
            <CounterStat value={10} suffix="+" label="Anni nel settore costruzioni" />
          </motion.div>
          <motion.div variants={fadeUp}>
            <CounterStat value={500} suffix="+" label="Aziende edili seguite" />
          </motion.div>
          <motion.div variants={fadeUp} className="text-center">
            <div className="text-5xl md:text-6xl font-extrabold text-primary font-display">24/7</div>
            <div className="font-mono text-xs text-[hsl(var(--neutral-500))] uppercase tracking-wider mt-2">
              Copertura lead con AI
            </div>
          </motion.div>
          <motion.div variants={fadeUp} className="text-center">
            <div className="text-5xl md:text-6xl font-extrabold text-primary font-display">48h</div>
            <div className="font-mono text-xs text-[hsl(var(--neutral-500))] uppercase tracking-wider mt-2">
              Per essere operativi
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* ─── I Nostri Valori ─── */}
      <section className="py-16 md:py-24 px-6 border-t border-[hsl(var(--neutral-800))]" ref={valuesRef}>
        <div className="max-w-5xl mx-auto">
          <motion.div
            className="text-center mb-14"
            initial="hidden"
            animate={valuesInView ? "visible" : "hidden"}
            variants={fadeUp}
          >
            <h2 className="font-display text-3xl md:text-5xl font-extrabold text-white">
              I Nostri <span className="text-primary">Valori</span>
            </h2>
            <p className="text-[hsl(var(--neutral-400))] mt-4 max-w-xl mx-auto">
              Non sono slogan. Sono le regole con cui gestiamo ogni progetto.
            </p>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-3 gap-6"
            initial="hidden"
            animate={valuesInView ? "visible" : "hidden"}
            variants={stagger}
          >
            {values.map((v, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                className="bg-[hsl(var(--neutral-800))] border border-[hsl(var(--neutral-700))] rounded-2xl p-8 hover:border-primary/40 transition-colors"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5">
                  <v.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-display text-lg font-bold text-white mb-3">{v.title}</h3>
                <p className="text-[hsl(var(--neutral-400))] text-sm leading-relaxed">{v.text}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <Guarantee />
      <Footer />
    </div>
  );
};

export default ChiSiamo;
