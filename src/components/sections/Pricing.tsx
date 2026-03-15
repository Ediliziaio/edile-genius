import { forwardRef } from "react";
import AnimatedBadge from "@/components/custom/AnimatedBadge";
import { Calendar, TrendingDown, TrendingUp, Clock, Users, PiggyBank } from "lucide-react";

const stats = [
  { icon: Calendar, value: "+40", label: "appuntamenti / mese", color: "text-primary" },
  { icon: TrendingDown, value: "−€6.600", label: "costi / mese", color: "text-primary" },
  { icon: TrendingUp, value: "+€180K", label: "fatturato / anno", color: "text-primary" },
  { icon: Users, value: "+30%", label: "lead qualificati", color: "text-primary" },
  { icon: Clock, value: "−70%", label: "tempi di gestione", color: "text-primary" },
  { icon: PiggyBank, value: "€79.200", label: "risparmio / anno", color: "text-primary" },
];

const Pricing = forwardRef<HTMLElement>(function Pricing(_, _ref) {
  return (
    <section id="pricing" className="bg-background py-16 md:py-24">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-12 space-y-4">
          <AnimatedBadge variant="verde">QUANTO PUOI GUADAGNARE</AnimatedBadge>
          <h2 className="font-display text-[32px] md:text-5xl font-extrabold text-foreground leading-tight">
            Scopri Quanto Puoi<br />
            <span className="text-primary">Risparmiare e Guadagnare.</span>
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
          {stats.map((s) => (
            <div
              key={s.label}
              className="bg-card border border-border rounded-2xl p-6 text-center space-y-2 shadow-sm hover:shadow-md transition-shadow"
            >
              <s.icon size={24} className="text-primary mx-auto" />
              <p className="font-display text-3xl md:text-4xl font-extrabold text-foreground">{s.value}</p>
              <p className="text-sm text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="text-center mt-12 space-y-5">
          <p className="text-muted-foreground text-base max-w-lg mx-auto">
            Ti mostriamo i numeri reali per la tua azienda in soli 15 minuti.
          </p>
          <a
            href="#cta-finale"
            className="inline-block bg-primary text-primary-foreground font-bold text-base px-8 py-4 rounded-xl shadow-button-green hover:bg-primary/90 transition-all"
          >
            Prenota Demo Gratuita 15 Min
          </a>
          <p className="font-mono text-[11px] text-muted-foreground">
            Setup incluso · Aggiornamenti continui · Garanzia rimborso 30 giorni · GDPR compliant
          </p>
        </div>
      </div>
    </section>
  );
});

Pricing.displayName = "Pricing";

export default Pricing;
