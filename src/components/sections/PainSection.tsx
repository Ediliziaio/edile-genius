import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import AnimatedBadge from "@/components/custom/AnimatedBadge";

const pains = [
  {
    title: "La segretaria che perde il 40% delle chiamate inbound",
    text: "È in pausa, è al telefono, è impegnata con un cliente. Nel frattempo il lead chiama il concorrente. Ogni chiamata persa è un preventivo regalato. La stai pagando €2.200/mese per perdere clienti.",
    stat: "78% dei clienti edili sceglie chi risponde per primo",
  },
  {
    title: "Il commerciale che richiama i lead dopo 3 giorni (se li richiama)",
    text: "Soldi spesi in campagne Google e Meta che dormono nel CRM. Il tuo commerciale costa €3.000/mese e richiama — forse — il 30% dei lead. Il resto? Fatturato fantasma che si accumula ogni mese.",
    stat: "68% dei lead edili non viene ricontattato entro 24h",
  },
  {
    title: "L'impiegata che passa 3,5 ore/giorno a fare report",
    text: "Fogli Excel, reportistica operai, analisi preventivi. €2.400/mese per attività ripetitive che un Agente AI fa in 5 minuti. Ogni ora che lei ci passa è un'ora che tu paghi senza ritorno.",
    stat: "Media: 3,5 ore/giorno perse in attività amministrative ripetitive",
  },
  {
    title: "Il call center che costa €3.500/mese e lavora solo 8 ore",
    text: "Copre solo il 33% della giornata. Il 30% dei lead arriva fuori orario — la sera, il weekend, ad agosto. Li stai perdendo tutti. Un Agente AI costa una frazione e lavora H24, 365 giorni.",
    stat: "30% dei lead edili arriva fuori orario lavorativo",
  },
  {
    title: "I tuoi concorrenti stanno già licenziando — e assumendo AI",
    text: "Non tra 2 anni. Adesso. Ogni settimana senza sostituzione AI è un vantaggio competitivo regalato a chi ha avuto il coraggio di muoversi prima. Il mercato edile cambia. Chi non cambia con lui, sparisce.",
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
            Ogni Dipendente Improduttivo<br />
            Ti Costa <span className="text-primary">€45.000/anno.</span><br />
            E Tu Lo Sai.
          </h2>
          <p className="text-lg text-neutral-500 max-w-xl mx-auto leading-relaxed">
            Hai un ottimo prodotto. Hai una squadra. Investi in pubblicità.
            Ma stai pagando persone che fanno il lavoro che un Agente AI
            farebbe meglio, più veloce, e a una frazione del costo.
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
