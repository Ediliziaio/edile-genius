import { ArrowRight, Clock3, ClipboardCheck, MessagesSquare } from "lucide-react";
import { Link } from "react-router-dom";

const measures = [
  { icon: Clock3, title: "Tempo per attività", text: "Quanto impieghi per preparare un preventivo, ordinare i documenti o completare un rapportino? Misuriamo la stessa attività prima e dopo." },
  { icon: MessagesSquare, title: "Richieste seguite", text: "Controlliamo quante richieste arrivano, quali vengono gestite e quando serve il passaggio a una persona." },
  { icon: ClipboardCheck, title: "Qualità del risultato", text: "Verifichiamo errori, dati mancanti e correzioni necessarie. Un'attività più veloce deve restare controllabile dal tuo team." },
];

export default function Results() {
  return <section id="risultati" className="bg-background py-16 md:py-24">
    <div className="mx-auto max-w-6xl px-6">
      <p className="mb-3 font-mono text-xs font-semibold uppercase tracking-wider text-primary-dark">Come misuriamo il lavoro</p>
      <h2 className="max-w-3xl font-display text-3xl font-extrabold leading-tight text-neutral-900 md:text-4xl">Prima e dopo, con i dati della tua impresa.</h2>
      <p className="mt-4 max-w-2xl text-lg leading-relaxed text-neutral-500">Prima dell'avvio scegliamo un'attività e definiamo cosa deve migliorare. Poi confrontiamo tempi e risultati su casi dello stesso tipo.</p>
      <div className="mt-9 grid gap-6 md:grid-cols-3">
        {measures.map((measure) => <article key={measure.title} className="rounded-2xl border border-neutral-200 p-6">
          <measure.icon size={25} className="mb-4 text-primary-dark" />
          <h3 className="font-display text-lg font-bold text-neutral-900">{measure.title}</h3>
          <p className="mt-3 text-sm leading-relaxed text-neutral-500">{measure.text}</p>
        </article>)}
      </div>
      <Link to="/come-funziona" className="mt-7 inline-flex items-center gap-2 font-semibold text-primary-dark">Scopri il metodo di lavoro <ArrowRight size={17} /></Link>
    </div>
  </section>;
}
