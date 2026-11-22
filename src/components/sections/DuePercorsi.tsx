import { useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import { ArrowRight, Check, Compass, HardHat } from "lucide-react";

const PERCORSI = [
  {
    icon: HardHat,
    tag: "Per le imprese",
    titolo: "Imprese edili, serramentisti e installatori",
    testo: "Più contatti gestiti, preventivi più veloci, cantieri sotto controllo. L'AI si occupa del lavoro ripetitivo dell'ufficio.",
    punti: [
      "Agente vocale che risponde e fissa i sopralluoghi 24/7",
      "Preventivi da nota vocale o foto, sul tuo listino",
      "Render AI per chiudere le trattative",
      "Gare d'appalto: bandi, requisiti e bozze di offerta",
      "Sicurezza, scadenze, acquisti e margini per commessa",
    ],
    cta: { label: "Soluzioni per le imprese", href: "/per-chi-e" },
    dark: false,
  },
  {
    icon: Compass,
    tag: "Per i progettisti",
    titolo: "Architetti, ingegneri e geometri",
    testo: "Non progettiamo al posto tuo: ti diamo l'AI che toglie ore di telefonate, carte e documenti. Il progetto e la firma restano tuoi.",
    punti: [
      "Filtro delle richieste: ti passa solo gli incarichi veri",
      "Sintesi di capitolati, bandi e PDF tecnici",
      "Bozze di computi, relazioni e documentazione",
      "Render, supporto BIM e aggiornamenti in direzione lavori",
    ],
    cta: { label: "Soluzioni per i progettisti", href: "/per-chi-e/progettisti-studi-tecnici" },
    dark: true,
  },
];

/** Home: due percorsi affiancati, imprese e progettisti. */
const DuePercorsi = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} id="per-chi" className="bg-neutral-50 py-16 md:py-24">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          className="text-center max-w-2xl mx-auto mb-12 space-y-3"
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.55 }}
        >
          <span className="font-mono text-xs uppercase tracking-wider text-primary font-semibold">Per chi lavoriamo</span>
          <h2 className="font-display text-[28px] md:text-[44px] font-extrabold leading-[1.1] text-neutral-900">
            Chi costruisce e chi progetta. <span className="text-primary">Due modi di lavorare, una sola AI.</span>
          </h2>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-2">
          {PERCORSI.map((p, i) => (
            <motion.div
              key={p.tag}
              initial={{ opacity: 0, x: i === 0 ? -40 : 40 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.1 + i * 0.1, ease: [0.25, 1, 0.35, 1] }}
              className={`group relative flex flex-col overflow-hidden rounded-3xl border p-7 md:p-10 transition-shadow hover:shadow-card-hover ${
                p.dark ? "border-neutral-800 bg-neutral-900" : "border-neutral-200 bg-background"
              }`}
            >
              <div
                aria-hidden
                className="pointer-events-none absolute -right-16 -top-16 size-56 rounded-full bg-primary/20 blur-3xl transition-transform duration-700 group-hover:scale-125"
              />
              <div className="relative flex items-center gap-3">
                <span className={`grid size-12 place-items-center rounded-xl ${p.dark ? "bg-primary text-primary-foreground" : "bg-primary-light text-primary-dark"}`}>
                  <p.icon size={24} strokeWidth={1.8} />
                </span>
                <span className={`font-mono text-[11px] uppercase tracking-wider ${p.dark ? "text-primary" : "text-primary-dark"}`}>{p.tag}</span>
              </div>
              <h3 className={`relative mt-6 font-display text-2xl md:text-3xl font-extrabold leading-tight ${p.dark ? "text-white" : "text-neutral-900"}`}>
                {p.titolo}
              </h3>
              <p className={`relative mt-3 leading-relaxed ${p.dark ? "text-neutral-400" : "text-neutral-500"}`}>{p.testo}</p>
              <ul className="relative mt-6 flex-1 space-y-3">
                {p.punti.map((pt) => (
                  <li key={pt} className={`flex gap-3 text-sm ${p.dark ? "text-neutral-300" : "text-neutral-700"}`}>
                    <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-primary/15 text-primary">
                      <Check size={12} strokeWidth={3} />
                    </span>
                    {pt}
                  </li>
                ))}
              </ul>
              <Link
                to={p.cta.href}
                className={`relative mt-8 inline-flex items-center gap-2 self-start rounded-xl px-5 py-3 text-sm font-bold transition-all hover:-translate-y-0.5 ${
                  p.dark ? "bg-primary text-primary-foreground" : "border border-neutral-200 text-neutral-800 hover:border-primary hover:text-primary"
                }`}
              >
                {p.cta.label} <ArrowRight size={16} />
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default DuePercorsi;
