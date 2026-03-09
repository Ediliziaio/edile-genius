import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";

const container = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.15, delayChildren: 0.05 } },
};
const item = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.25, 1, 0.35, 1] as const } },
};

const stats = [
  { value: "20", label: "SOLUZIONI AI DISPONIBILI" },
  { value: "4", label: "SETTORI COPERTI" },
  { value: "-60%", label: "RIDUZIONE COSTI OPERATIVI MEDIA" },
  { value: "7 gg", label: "SETUP MEDIO PER SOLUZIONE" },
];

const SolutionsHero = () => (
  <section className="relative bg-neutral-900 py-20 md:py-32 overflow-hidden">
    {/* Grid pattern */}
    <div className="absolute inset-0 opacity-[0.06]" style={{
      backgroundImage: "linear-gradient(hsl(213 26% 15%) 1px, transparent 1px), linear-gradient(90deg, hsl(213 26% 15%) 1px, transparent 1px)",
      backgroundSize: "64px 64px",
    }} />
    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/8 rounded-full blur-[120px]" />

    <motion.div className="relative max-w-4xl mx-auto px-6 text-center" variants={container} initial="hidden" animate="visible">
      <motion.div variants={item} className="inline-flex items-center gap-2 bg-[rgba(62,207,110,0.12)] border border-[rgba(62,207,110,0.25)] rounded-full px-4 py-1.5 mb-8">
        <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
        <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-primary font-medium">
          ⚡ 20 Soluzioni AI Certificate per l'Edilizia Italiana
        </span>
      </motion.div>

      <motion.h1 variants={item} className="font-display text-[32px] sm:text-[44px] md:text-[72px] font-extrabold text-white leading-[1.05] mb-6">
        Ogni Problema<br />della Tua Azienda<br />Edile — Risolto.<br />
        <span className="text-primary">Con l'AI.</span>
      </motion.h1>

      <motion.div variants={item} className="max-w-[640px] mx-auto mb-10">
        <p className="text-neutral-400 text-lg leading-[1.7]">
          Abbiamo analizzato ogni processo critico del settore edile italiano —
          infissi, fotovoltaico, ristrutturazioni, cantieri — e costruito
          20 soluzioni AI specifiche per eliminare sprechi, ridurre costi
          e far crescere le vendite.
        </p>
        <p className="text-white font-semibold mt-4">Non template generici. Soluzioni verticali costruite per voi.</p>
      </motion.div>

      <motion.div variants={item} className="flex flex-wrap justify-center gap-3 mb-12">
        {stats.map((s, i) => (
          <div key={i} className="bg-neutral-800 border border-neutral-700 rounded-xl px-5 py-3 flex items-center gap-3">
            <span className="font-display text-[32px] font-extrabold text-primary">{s.value}</span>
            <span className="font-mono text-[10px] text-neutral-400 uppercase tracking-wider text-left max-w-[120px] leading-tight">{s.label}</span>
          </div>
        ))}
      </motion.div>

      <motion.button
        variants={item}
        onClick={() => document.getElementById("solutions-grid")?.scrollIntoView({ behavior: "smooth" })}
        className="mx-auto block text-white/40 hover:text-white/70 transition-colors"
        aria-label="Scorri alle soluzioni"
      >
        <ChevronDown size={32} className="animate-bounce" />
      </motion.button>
    </motion.div>
  </section>
);

export default SolutionsHero;
