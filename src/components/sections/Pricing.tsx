import { forwardRef } from "react";
import AnimatedBadge from "@/components/custom/AnimatedBadge";
import { Check } from "lucide-react";

const plans = [
  {
    badge: "PER INIZIARE",
    badgeVariant: "neutral" as const,
    name: "Starter",
    price: "Su Richiesta",
    sub: "Aziende fino a 15 dipendenti",
    features: [
      "1 Agente Vocale AI configurato",
      "Fino a 500 chiamate/mese gestite",
      "Qualifica inbound + calendario",
      "Dashboard reportistica base",
      "Setup dedicato (7 giorni)",
      "Supporto email",
    ],
    cta: "Richiedi Preventivo",
    ctaStyle: "border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground",
    featured: false,
  },
  {
    badge: "PIÙ SCELTO",
    badgeVariant: "verde" as const,
    name: "Professional",
    price: "Su Richiesta",
    sub: "Aziende con team commerciale strutturato",
    features: [
      "2 Agenti AI (Vocale + Operativo)",
      "Chiamate illimitate",
      "Riattivazione database lead",
      "Agente AI per reportistica/analisi",
      "Integrazione CRM",
      "Analytics avanzata",
      "Setup prioritario (5 giorni)",
      "Supporto WhatsApp dedicato",
      "Review mensile performance",
    ],
    cta: "Prenota Demo Gratuita",
    ctaStyle: "bg-primary text-primary-foreground shadow-button-green hover:bg-primary-dark",
    featured: true,
  },
  {
    badge: "GRANDI AZIENDE",
    badgeVariant: "neutral" as const,
    name: "Enterprise",
    price: "Custom",
    sub: "Multi-sede, contact center, 50+ dipendenti",
    features: [
      "Agenti AI illimitati",
      "Architettura multi-sede",
      "Agenti AI custom per processi specifici",
      "Voce brandizzata proprietaria",
      "Training su dati aziendali interni",
      "SLA garantito",
      "Account manager dedicato",
      "API e integrazioni custom",
    ],
    cta: "Contattaci",
    ctaStyle: "bg-neutral-900 text-white hover:bg-neutral-800",
    featured: false,
  },
];

const Pricing = forwardRef<HTMLElement>(function Pricing(_, _ref) {
  return (
    <section id="pricing" className="bg-background py-16 md:py-24">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-4 space-y-4">
          <AnimatedBadge variant="verde">PIANI E PREZZI</AnimatedBadge>
          <h2 className="font-display text-[32px] md:text-5xl font-extrabold text-neutral-900 leading-tight">
            Scegli il Piano.<br />
            <span className="text-primary">Scala Quando Vuoi.</span>
          </h2>
          <p className="text-neutral-500 text-base">
            Tutti i piani includono setup, training, ottimizzazione continua e garanzia 30 giorni.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-5 mt-12 items-start">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative bg-background rounded-3xl p-8 border transition-all ${
                plan.featured
                  ? "border-2 border-primary shadow-card-green scale-[1.03] z-10"
                  : "border-neutral-200 shadow-card"
              }`}
            >
              {plan.featured && (
                <div className="absolute -top-3 right-6 rotate-[15deg]">
                  <span className="bg-primary text-primary-foreground font-mono text-[10px] uppercase tracking-wider px-3 py-1 rounded-full font-bold">
                    {plan.badge}
                  </span>
                </div>
              )}
              {!plan.featured && (
                <div className="mb-4">
                  <AnimatedBadge variant={plan.badgeVariant}>{plan.badge}</AnimatedBadge>
                </div>
              )}
              {plan.featured && <div className="mb-4" />}

              <h3 className="font-display text-2xl font-extrabold text-neutral-900 mb-1">{plan.name}</h3>
              <p className="font-display text-3xl font-extrabold text-neutral-900 mb-1">{plan.price}</p>
              <p className="text-sm text-neutral-500 mb-6">{plan.sub}</p>

              <ul className="space-y-3 mb-8">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-neutral-700">
                    <Check size={16} className="text-primary flex-shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>

              <a
                href="#cta-finale"
                className={`block text-center w-full py-3 rounded-xl font-bold text-sm transition-all ${plan.ctaStyle}`}
              >
                {plan.cta}
              </a>
            </div>
          ))}
        </div>

        <p className="text-center font-mono text-[11px] text-neutral-500 mt-8">
          Tutti i piani: setup incluso · aggiornamenti continui · garanzia rimborso 30 giorni · GDPR compliant
        </p>
      </div>
    </section>
  );
};

export default Pricing;
