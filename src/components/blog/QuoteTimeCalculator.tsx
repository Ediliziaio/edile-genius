import { useState } from "react";

const example = { count: "20", before: "90", trial: "45" };
const numberFormat = new Intl.NumberFormat("it-IT", { maximumFractionDigits: 1 });

export default function QuoteTimeCalculator() {
  const [values, setValues] = useState(example);
  const count = Number(values.count);
  const before = Number(values.before);
  const trial = Number(values.trial);
  const valid = Object.values(values).every((value) => value.trim() !== "")
    && [count, before, trial].every((value) => Number.isFinite(value) && value >= 0)
    && Number.isInteger(count) && Number.isFinite(count * before) && Number.isFinite(count * trial);
  const currentHours = count * before / 60;
  const trialHours = count * trial / 60;
  const difference = currentHours - trialHours;

  return <section className="my-12 rounded-2xl border border-primary-dark/20 bg-primary-light/40 p-5 sm:p-8" aria-labelledby="quote-time-heading">
    <p className="mb-2 font-mono text-xs font-semibold uppercase tracking-wider text-primary-dark">Strumento pratico</p>
    <h2 id="quote-time-heading" className="text-2xl font-bold leading-tight text-foreground">Confronta i tempi dei tuoi preventivi.</h2>
    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">I valori iniziali sono un esempio. Sostituiscili con tempi misurati, includendo raccolta dei dati, controllo e correzioni.</p>
    <div className="mt-6 grid gap-4 sm:grid-cols-3">
      {([
        { key: "count", label: "Preventivi al mese", step: "1" },
        { key: "before", label: "Minuti per preventivo oggi", step: "0.1" },
        { key: "trial", label: "Minuti per preventivo nella prova", step: "0.1" },
      ] as const).map(({ key, label, step }) => <div key={key}>
        <label htmlFor={`quote-time-${key}`} className="mb-2 block text-sm font-semibold text-foreground">{label}</label>
        <input id={`quote-time-${key}`} type="number" min="0" step={step} inputMode={key === "count" ? "numeric" : "decimal"}
          value={values[key]} onChange={(event) => setValues((previous) => ({ ...previous, [key]: event.target.value }))}
          className="w-full rounded-xl border border-neutral-300 bg-background px-3 py-3 text-base text-foreground focus:outline-none focus:ring-2 focus:ring-primary-dark" />
      </div>)}
    </div>
    <div className="mt-6" role="status" aria-live="polite" aria-atomic="true">
      {valid ? <dl className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-neutral-200 bg-background p-4"><dt className="text-sm text-muted-foreground">Tempo attuale</dt><dd className="mt-2 text-xl font-bold text-foreground">{numberFormat.format(currentHours)} ore/mese</dd></div>
        <div className="rounded-xl border border-neutral-200 bg-background p-4"><dt className="text-sm text-muted-foreground">Tempo nella prova</dt><dd className="mt-2 text-xl font-bold text-foreground">{numberFormat.format(trialHours)} ore/mese</dd></div>
        <div className="rounded-xl border border-primary-dark/30 bg-background p-4"><dt className="text-sm text-muted-foreground">Differenza</dt><dd className="mt-2 text-xl font-bold text-primary-dark">{numberFormat.format(Math.abs(difference))} ore/mese {difference > 0 ? "in meno" : difference < 0 ? "in più" : "di differenza"}</dd></div>
      </dl> : <p className="rounded-xl border border-neutral-300 bg-background p-4 text-sm text-foreground">Completa i campi con numeri validi maggiori o uguali a zero. Il numero di preventivi deve essere intero.</p>}
    </div>
    <p className="mt-4 text-xs leading-relaxed text-muted-foreground">È un confronto aritmetico dei valori inseriti, non una previsione di risparmio o di vendite.</p>
    <button type="button" onClick={() => setValues(example)} className="mt-4 text-sm font-semibold text-primary-dark underline underline-offset-4">Ripristina l'esempio</button>
  </section>;
}
