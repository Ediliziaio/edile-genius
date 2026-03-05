import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import AnimatedBadge from "@/components/custom/AnimatedBadge";

const pains = [
  {
    title: "Il telefono squilla — ma nessuno risponde in tempo",
    text: "Il tuo commerciale è in cantiere. Il preventivista è in riunione. Il lead aspetta 3 minuti, poi chiama il concorrente. Succede ogni giorno, più volte al giorno. Ogni chiamata persa è un preventivo mancato e un cliente regalato.",
    stat: "78% dei clienti edili sceglie chi risponde per primo",
  },
  {
    title: "Hai centinaia di lead nel CRM che nessuno ha mai richiamato",
    text: "Soldi spesi in campagne Google e Meta che dormono in un database. Ogni contatto non richiamato è fatturato fantasma. Un archivio di opportunità perse che si accumula ogni mese.",
    stat: "68% dei lead edili non viene ricontattato entro 24h",
  },
  {
    title: "I tuoi venditori perdono ore su attività che non producono vendite",
    text: "Cold calling, qualifica lead freddi, aggiornamenti clienti, compilazione report. Ore e ore sottratte all'unica cosa che conta: stare davanti ai clienti pronti a firmare.",
    stat: "-65% di produttività commerciale per attività non-vendita",
  },
  {
    title: "La gestione operativa e la reportistica ti occupa metà giornata",
    text: "Fogli Excel, reportistica operai, analisi preventivi, gestione assistenze. Attività ripetitive, manuali, ad alto rischio di errore. Ogni ora che ci passi è un'ora sottratta alla strategia.",
    stat: "Media: 3,5 ore/giorno perse in attività amministrative ripetitive",
  },
  {
    title: "I tuoi concorrenti si stanno già automatizzando — tu no",
    text: "Non tra 2 anni. Adesso. Ogni settimana senza automazione AI è un vantaggio competitivo regalato a chi ha avuto il coraggio di muoversi prima. Il mercato edile cambia. Chi non cambia con lui, sparisce.",
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
            Ogni Giorno Perdi Clienti<br />
            per Problemi che <span className="text-primary">l'AI</span><br />
            Risolve in Automatico
          </h2>
          <p className="text-lg text-neutral-500 max-w-xl mx-auto leading-relaxed">
            Hai un ottimo prodotto. Hai una squadra. Investi in pubblicità.
            Eppure i numeri non ti convincono. Il problema non è il tuo settore —
            è che stai gestendo un'azienda del 2025 con processi del 2015.
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
