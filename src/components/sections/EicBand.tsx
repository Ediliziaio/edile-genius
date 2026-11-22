import { useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import { ArrowRight, ArrowUpRight, Building2, Calculator, FileText, HardHat, Users, Wallet } from "lucide-react";

const EIC_URL = "https://www.ediliziaincloud.com";

const MODULI = [
  { icon: HardHat, label: "Cantieri e commesse" },
  { icon: FileText, label: "Fatturazione elettronica" },
  { icon: Calculator, label: "Preventivi" },
  { icon: Wallet, label: "Margini e costi" },
  { icon: Users, label: "Personale" },
  { icon: Building2, label: "CRM clienti" },
];

/**
 * Chiarisce il rapporto tra i due marchi del gruppo AEDIX: Edilizia.io progetta e integra
 * sistemi AI (non è una piattaforma in abbonamento), EdiliziaInCloud è il gestionale.
 * Nessun prezzo: EdiliziaInCloud non pubblica il listino.
 */
const EicBand = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} id="edilizia-in-cloud" className="bg-background py-16 md:py-20">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: [0.25, 1, 0.35, 1] }}
          className="relative overflow-hidden rounded-3xl border border-neutral-200 bg-neutral-50 p-7 md:p-12"
        >
          <div aria-hidden className="pointer-events-none absolute -left-24 -bottom-24 size-72 rounded-full bg-primary/15 blur-3xl" />
          <div className="relative grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:items-center">
            <div className="space-y-4">
              <span className="font-mono text-xs uppercase tracking-wider text-primary font-semibold">Il gestionale del gruppo AEDIX</span>
              <h2 className="font-display text-[26px] md:text-[38px] font-extrabold leading-[1.12] text-neutral-900">
                Noi portiamo l'AI. <span className="text-primary">La piattaforma è EdiliziaInCloud.</span>
              </h2>
              <p className="text-neutral-500 leading-relaxed">
                Edilizia.io non è un software in abbonamento: progettiamo e integriamo sistemi di intelligenza artificiale su misura.
                Per gestire l'azienda c'è EdiliziaInCloud, il gestionale cloud con AI dello stesso gruppo, pensato per imprese edili e
                studi tecnici. I nostri sistemi lavorano sopra EdiliziaInCloud o sopra il gestionale che usi già.
              </p>
              <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                <Link
                  to="/edilizia-in-cloud"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-neutral-900 px-6 py-3.5 text-sm font-bold text-white transition-all hover:-translate-y-0.5"
                >
                  Scopri EdiliziaInCloud <ArrowRight size={16} />
                </Link>
                <a
                  href={`${EIC_URL}/`}
                  target="_blank"
                  rel="noopener"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-background px-6 py-3.5 text-sm font-medium text-neutral-700 transition-colors hover:border-primary hover:text-primary"
                >
                  Vai su ediliziaincloud.com <ArrowUpRight size={16} />
                </a>
              </div>
            </div>

            <motion.ul
              className="grid grid-cols-2 gap-3 sm:grid-cols-3"
              initial="hidden"
              animate={inView ? "visible" : "hidden"}
              variants={{ visible: { transition: { staggerChildren: 0.07, delayChildren: 0.2 } } }}
            >
              {MODULI.map((m) => (
                <motion.li
                  key={m.label}
                  variants={{ hidden: { opacity: 0, scale: 0.92 }, visible: { opacity: 1, scale: 1, transition: { duration: 0.4 } } }}
                  className="flex flex-col items-start gap-3 rounded-2xl border border-neutral-200 bg-background p-4"
                >
                  <span className="grid size-9 place-items-center rounded-lg bg-primary-light text-primary-dark">
                    <m.icon size={18} strokeWidth={1.8} />
                  </span>
                  <span className="text-sm font-semibold leading-snug text-neutral-800">{m.label}</span>
                </motion.li>
              ))}
            </motion.ul>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default EicBand;
