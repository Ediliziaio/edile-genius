import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import type { WorkflowApp, WorkflowGraph } from "@/components/ui/interactive-workflow-blueprint";

// L'editor (React Flow) vive solo nel browser: non entra nel prerender né nel caricamento iniziale.
const WorkflowBlueprint = lazy(() => import("@/components/ui/interactive-workflow-blueprint"));

const GRAPH: WorkflowGraph = {
  nodes: [
    {
      id: "richiesta",
      type: "blueprint",
      position: { x: 0, y: 40 },
      data: { label: "Richiesta del cliente", detail: "Arriva una chiamata, un WhatsApp o un modulo dal sito.", kind: "trigger", tool: "Telefono · WhatsApp" },
    },
    {
      id: "qualifica",
      type: "blueprint",
      position: { x: 240, y: 180 },
      data: { label: "Qualifica del lead", detail: "L'agente vocale raccoglie lavoro, misure, budget e tempi.", kind: "agent", tool: "Agente vocale" },
    },
    {
      id: "listino",
      type: "blueprint",
      position: { x: 480, y: 40 },
      data: { label: "Lettura del listino", detail: "Recupera prezzi, linee e condizioni dal tuo listino.", kind: "integration", tool: "Excel · EdiliziaInCloud" },
    },
    {
      id: "preventivo",
      type: "blueprint",
      position: { x: 720, y: 180 },
      data: { label: "Preventivo AI", detail: "Prepara il preventivo con le tue voci e il tuo formato.", kind: "agent", tool: "Preventivatore AI" },
    },
    {
      id: "controllo",
      type: "blueprint",
      position: { x: 960, y: 40 },
      data: { label: "Controllo dell'ufficio", detail: "Il commerciale verifica margine e condizioni e approva.", kind: "review", tool: "Ufficio" },
    },
    {
      id: "invio",
      type: "blueprint",
      position: { x: 1200, y: 180 },
      data: { label: "Invio al cliente", detail: "Il PDF parte al cliente e l'appuntamento finisce in agenda.", kind: "delivery", tool: "Email · Agenda" },
    },
  ],
  edges: [
    { id: "e1", source: "richiesta", target: "qualifica" },
    { id: "e2", source: "qualifica", target: "listino" },
    { id: "e3", source: "listino", target: "preventivo" },
    { id: "e4", source: "preventivo", target: "controllo" },
    { id: "e5", source: "controllo", target: "invio" },
  ],
};

const APPS: WorkflowApp[] = [
  {
    id: "clienti",
    name: "Clienti e lead",
    actions: [
      { label: "Rispondi al telefono", detail: "L'agente vocale risponde 24/7 e qualifica la richiesta.", kind: "agent", tool: "Agente vocale" },
      { label: "Richiama i lead freddi", detail: "Ricontatta preventivi non chiusi e contatti dormienti.", kind: "agent", tool: "Agente vocale" },
      { label: "Fissa il sopralluogo", detail: "Prenota l'appuntamento nell'agenda del tecnico.", kind: "delivery", tool: "Agenda" },
    ],
  },
  {
    id: "documenti",
    name: "Documenti e listini",
    actions: [
      { label: "Leggi capitolato o PDF", detail: "Estrae voci, quantità e requisiti dal documento.", kind: "agent", tool: "AI documenti" },
      { label: "Confronta offerte fornitori", detail: "Mette a confronto prezzi, tempi e condizioni.", kind: "agent", tool: "AI offerte" },
      { label: "Aggiorna il listino", detail: "Scrive i nuovi prezzi nel foglio o nel gestionale.", kind: "integration", tool: "Excel · Gestionale" },
    ],
  },
  {
    id: "cantiere",
    name: "Cantiere",
    actions: [
      { label: "Raccogli il rapportino", detail: "Ore, materiali e foto dal capocantiere via WhatsApp.", kind: "trigger", tool: "WhatsApp" },
      { label: "Aggiorna l'avanzamento", detail: "Collega il rapportino alla commessa e al SAL.", kind: "integration", tool: "Gestionale" },
      { label: "Avvisa il cliente", detail: "Manda al committente foto e stato dei lavori.", kind: "delivery", tool: "WhatsApp" },
    ],
  },
  {
    id: "tecnico",
    name: "Progettisti e ufficio tecnico",
    actions: [
      { label: "Imposta il computo", detail: "Bozza di computo metrico da tavole e rilievi.", kind: "agent", tool: "AI computi" },
      { label: "Bozza di relazione", detail: "Prepara la relazione tecnica da rivedere e firmare.", kind: "agent", tool: "AI documenti" },
      { label: "Revisione del progettista", detail: "Il professionista controlla e approva il documento.", kind: "review", tool: "Studio tecnico" },
    ],
  },
  {
    id: "gare",
    name: "Gare e appalti",
    actions: [
      { label: "Trova bandi adatti", detail: "Cerca ogni giorno le gare per categorie, importi e zone.", kind: "trigger", tool: "Monitoraggio bandi" },
      { label: "Checklist di gara", detail: "Sintesi di disciplinare e capitolato con documenti e scadenze.", kind: "agent", tool: "AI gare" },
      { label: "Bozza offerta tecnica", detail: "Imposta le relazioni sui criteri di valutazione.", kind: "agent", tool: "AI gare" },
      { label: "Revisione ufficio gare", detail: "Verifica, completamento e firma dell'offerta.", kind: "review", tool: "Ufficio gare" },
    ],
  },
  {
    id: "sicurezza",
    name: "Sicurezza e conformità",
    actions: [
      { label: "Controlla le scadenze", detail: "DURC, formazione, visite mediche e attestati.", kind: "agent", tool: "Scadenzario AI" },
      { label: "Sollecita i subappaltatori", detail: "Richiede i documenti mancanti via email o WhatsApp.", kind: "delivery", tool: "WhatsApp · Email" },
      { label: "Bozza di POS", detail: "Imposta il POS con i dati del cantiere, da verificare.", kind: "agent", tool: "AI documenti" },
    ],
  },
  {
    id: "direzione",
    name: "Direzione",
    actions: [
      { label: "Controllo margini", detail: "Verifica costi e margine della commessa.", kind: "review", tool: "Report AI" },
      { label: "Report settimanale", detail: "Riepilogo di lead, preventivi e cantieri per il titolare.", kind: "delivery", tool: "Email" },
    ],
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 26 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.25, 1, 0.35, 1] as const } },
};

/** Segnaposto con la stessa altezza dell'editor, così la pagina non "salta" quando si carica. */
const Placeholder = () => (
  <div className="flex h-[640px] items-center justify-center rounded-[20px] border border-neutral-200 bg-neutral-50 text-sm text-neutral-400">
    Caricamento dell'editor…
  </div>
);

const WorkflowSection = ({ ctaHref = "#cta-finale" }: { ctaHref?: string }) => {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "300px" });
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <section ref={ref} id="disegna-il-flusso" className="bg-background py-16 md:py-24">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div className="max-w-3xl mb-10 space-y-4" initial="hidden" animate={inView ? "visible" : "hidden"} variants={fadeUp}>
          <span className="font-mono text-xs uppercase tracking-wider text-primary font-semibold">Prova a progettarlo tu</span>
          <h2 className="font-display text-[28px] md:text-[44px] font-extrabold leading-[1.1] text-neutral-900">
            Disegna il tuo flusso AI, <span className="text-primary">passaggio per passaggio.</span>
          </h2>
          <p className="text-neutral-500 text-lg leading-relaxed">
            Questo è un flusso tipico: dalla richiesta del cliente al preventivo inviato. Aggiungi passaggi, spostali, collegali o
            cambiali con il tuo modo di lavorare. Poi portalo in consulenza: lo trasformiamo in un sistema vero.
          </p>
        </motion.div>

        {mounted && inView ? (
          <Suspense fallback={<Placeholder />}>
            <WorkflowBlueprint
              title="Dalla richiesta al preventivo"
              initialGraph={GRAPH}
              apps={APPS}
              ctaHref={ctaHref}
              agentTemplate={{ label: "Nuovo agente AI", detail: "Descrivi cosa deve fare questo agente.", kind: "agent" }}
            />
          </Suspense>
        ) : (
          <Placeholder />
        )}
      </div>
    </section>
  );
};

export default WorkflowSection;
