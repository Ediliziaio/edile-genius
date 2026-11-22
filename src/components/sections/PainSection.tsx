import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import AnimatedBadge from "@/components/custom/AnimatedBadge";

const pains = [
  {
    title: "Il 40% delle chiamate in entrata resta senza risposta",
    text: "L'ufficio è in pausa, al telefono o impegnato con un cliente. Nel frattempo il lead chiama il concorrente. Ogni chiamata persa è un preventivo regalato, e non è colpa di nessuno: il telefono non si ferma mai.",
    stat: "78% dei clienti edili sceglie chi risponde per primo",
  },
  {
    title: "I lead vengono richiamati dopo giorni (quando va bene)",
    text: "Soldi spesi in campagne Google e Meta che dormono nel CRM. Il commerciale è in cantiere o in trattativa e riesce a richiamare solo una parte dei contatti. Il resto è fatturato che si perde ogni mese.",
    stat: "68% dei lead edili non viene ricontattato entro 24h",
  },
  {
    title: "Ore ogni giorno a ricopiare dati e fare report",
    text: "Fogli Excel, rapportini, computi, confronto preventivi. Attività ripetitive che l'AI prepara in pochi minuti, lasciando al tuo ufficio il lavoro che conta davvero: clienti, fornitori e cantieri.",
    stat: "Media: 3,5 ore/giorno perse in attività amministrative ripetitive",
  },
  {
    title: "Progettisti e tecnici sommersi da carte e capitolati",
    text: "Leggere capitolati, impostare computi, scrivere relazioni e rispondere alle varianti porta via giornate intere. Tempo tolto alla progettazione e al controllo del cantiere.",
    stat: "Il lavoro documentale pesa più del progetto stesso",
  },
  {
    title: "I tuoi concorrenti stanno già introducendo l'AI",
    text: "Non tra 2 anni. Adesso. Ogni mese senza un sistema AI è un vantaggio regalato a chi si è mosso prima. Il mercato edile cambia: chi organizza meglio dati e processi lavora con margini più alti.",
    stat: "+180% crescita adozione AI nel settore costruzioni 2023-2025",
  },
];

const PainSection = () => {
  const [expanded, setExpanded] = useState<number | null>(null);

  return (
    <section className="bg-background py-16 md:py-24">
      <div className="max-w-3xl mx-auto px-6">
        <div className="text-center mb-12 space-y-4">
          <AnimatedBadge variant="arancio">IL PROBLEMA</AnimatedBadge>
          <h2 className="font-display text-[32px] md:text-5xl font-extrabold text-neutral-900 leading-tight">
            Il Lavoro Ripetitivo<br />
            Ti Costa <span className="text-primary">Più di Quanto Pensi.</span><br />
            E Tu Lo Sai.
          </h2>
          <p className="text-lg text-neutral-500 max-w-xl mx-auto leading-relaxed">
            Hai un ottimo prodotto. Hai una squadra. Investi in pubblicità.
            Ma il tuo team passa ore su telefonate, documenti e report che un
            sistema AI gestirebbe più velocemente, a una frazione del costo.
          </p>
        </div>

        <div className="space-y-3">
          {pains.map((pain, i) => {
            const isOpen = expanded === i;
            return (
              <motion.div
                key={i}
                className={`rounded-2xl border p-5 cursor-pointer transition-colors ${
                  isOpen
                    ? "border-primary bg-primary-light/40"
                    : "border-neutral-200 bg-neutral-50 hover:border-neutral-300"
                }`}
                onClick={() => setExpanded(isOpen ? null : i)}
                layout
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-base font-bold text-neutral-900 pr-4">{pain.title}</h3>
                  <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <ChevronDown size={20} className="text-neutral-500 flex-shrink-0" />
                  </motion.div>
                </div>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <p className="text-neutral-500 text-sm mt-3 leading-relaxed">{pain.text}</p>
                      <div className="mt-3 bg-primary/10 rounded-xl px-4 py-2.5 font-mono text-xs font-medium text-primary-dark">
                        📊 {pain.stat}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default PainSection;
