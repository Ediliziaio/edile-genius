import { useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { SERVIZI } from "@/data/servizi";

const fadeUp = {
  hidden: { opacity: 0, y: 26 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.25, 1, 0.35, 1] as const } },
};

/** Sezione "Servizi" della Home: progettazione, consulenza e soluzioni pronte. */
const ServiziSection = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="servizi" ref={ref} className="bg-background py-16 md:py-24">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          className="max-w-3xl mb-12 space-y-4"
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          variants={fadeUp}
        >
          <span className="font-mono text-xs uppercase tracking-wider text-primary font-semibold">I nostri servizi</span>
          <h2 className="font-display text-[28px] md:text-[44px] font-extrabold leading-[1.1] text-neutral-900">
            Automazione, preventivi, render e consulenza AI <span className="text-primary">per chi costruisce e per chi progetta.</span>
          </h2>
          <p className="text-neutral-500 text-lg leading-relaxed">
            Soluzioni AI pronte per imprese edili, architetti, ingegneri e geometri, sistemi su misura quando serve qualcosa di
            specifico, e la consulenza per introdurli nel modo giusto. Il lavoro tecnico resta vostro: l'AI vi toglie quello ripetitivo.
          </p>
        </motion.div>

        <motion.div
          className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          variants={{ visible: { transition: { staggerChildren: 0.08, delayChildren: 0.15 } } }}
        >
          {SERVIZI.map((s) => (
            <motion.div key={s.slug} variants={fadeUp}>
              <Link
                to={`/servizi/${s.slug}`}
                className="group relative flex h-full flex-col rounded-2xl border border-neutral-200 bg-background p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-card-hover"
              >
                <div className="mb-5 flex items-center justify-between">
                  <span className="grid size-11 place-items-center rounded-xl bg-primary-light text-primary-dark transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <s.icon size={22} strokeWidth={1.8} />
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-neutral-400">{s.categoria}</span>
                </div>
                <h3 className="font-display text-lg font-bold leading-snug text-neutral-900">{s.titolo}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-neutral-500">{s.sintesi}</p>
                <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary-dark">
                  Scopri di più
                  <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default ServiziSection;
