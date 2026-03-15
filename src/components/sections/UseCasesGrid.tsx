import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import AnimatedBadge from "@/components/custom/AnimatedBadge";

const useCases = [
  { icon: "📞", title: "Risposta Inbound Automatica", text: "Risponde immediatamente a ogni chiamata. Gestisce la conversazione, qualifica il lead, raccoglie tutti i dati necessari e prenota l'appuntamento nel tuo calendario. Nessun lead perso, mai più.", tag: "Agente Vocale" },
  { icon: "🔄", title: "Riattivazione Database Lead", text: "Richiama automaticamente i contatti dormienti nel tuo CRM. Trasforma preventivi non chiusi e lead freddi in appuntamenti attivi. Il tuo archivio torna a produrre fatturato.", tag: "Agente Vocale" },
  { icon: "📊", title: "Analisi e Comparazione Offerte", text: "L'Agente AI analizza le offerte dei fornitori, le compara per prezzo, condizioni e qualità, e ti presenta un report decisionale in secondi. Fine dei fogli Excel manuali.", tag: "Agente AI" },
  { icon: "👷", title: "Reportistica Operai & Cantieri", text: "Raccoglie automaticamente dati di avanzamento lavori, ore operai, materiali utilizzati e stato cantieri. Report giornalieri e settimanali generati in autonomia.", tag: "Agente AI" },
  { icon: "🔧", title: "Gestione Assistenze Post-Vendita", text: "Riceve le richieste di assistenza, le classifica per urgenza e tipologia, smista agli operatori tecnici giusti e tiene aggiornato il cliente in tempo reale.", tag: "Agente AI + Vocale" },
  { icon: "🎧", title: "Call Center & Customer Care AI", text: "Gestisce l'intero volume di chiamate e messaggi in entrata: domande tecniche, aggiornamenti preventivi, stato cantieri. Escalation intelligente solo quando necessario.", tag: "Agente Vocale + AI" },
  { icon: "🖼️", title: "Render AI Fotorealistici", text: "7 moduli specializzati per infissi, facciate, bagni, pavimenti, persiane, stanze e tetti. Carica una foto, configura materiali e colori, ottieni render professionali prima/dopo per convincere il cliente prima ancora di iniziare i lavori.", tag: "Render AI" },
  { icon: "📄", title: "Preventivazione Automatica AI", text: "Dall'analisi delle foto al computo metrico estimativo: l'AI stima superfici, genera descrizioni tecniche, crea offerte complete con prezzi e condizioni. Preventivi professionali in 10 minuti invece che ore di lavoro manuale.", tag: "Preventivi AI" },
];

const item = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.25, 1, 0.35, 1] as const } },
};

const UseCasesGrid = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <section id="use-cases" className="bg-background py-16 md:py-24">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-12 space-y-4">
          <AnimatedBadge variant="verde">CASI D'USO</AnimatedBadge>
          <h2 className="font-display text-[32px] md:text-5xl font-extrabold text-neutral-900 leading-tight">
            Cosa Fanno<br />
            <span className="text-primary">Concretamente</span><br />
            i Tuoi Agenti AI
          </h2>
        </div>

        <motion.div
          ref={ref}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-5"
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
        >
          {useCases.map((uc) => (
            <motion.div
              key={uc.title}
              variants={item}
              className="bg-neutral-50 border border-neutral-200 rounded-[20px] p-7 hover:bg-background hover:border-primary/50 hover:shadow-card-hover hover:-translate-y-1 transition-all duration-250 group"
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-2xl mb-4">
                {uc.icon}
              </div>
              <h3 className="font-display text-lg font-bold text-neutral-900 mb-2">{uc.title}</h3>
              <p className="text-sm text-neutral-500 leading-relaxed mb-4">{uc.text}</p>
              <span className="inline-block font-mono text-[10px] uppercase tracking-wider bg-primary-light text-primary-dark px-3 py-1 rounded-full font-medium">
                {uc.tag}
              </span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default UseCasesGrid;
