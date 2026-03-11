import { Building2, Sun, PanelTop, Wrench, HardHat, Factory, Home, Zap } from "lucide-react";

const logos = [
  { name: "Costruzioni Marchetti", icon: Building2, sector: "edilizia" },
  { name: "SolarTech Italia", icon: Sun, sector: "fotovoltaico" },
  { name: "Finestre Italia", icon: PanelTop, sector: "infissi" },
  { name: "Termoidraulica Verdi", icon: Wrench, sector: "impianti" },
  { name: "Edilgroup Roma", icon: HardHat, sector: "edilizia" },
  { name: "EnerSun Impianti", icon: Zap, sector: "fotovoltaico" },
  { name: "Serramenti Bianchi", icon: Home, sector: "infissi" },
  { name: "CMB Edilizia", icon: Factory, sector: "edilizia" },
  { name: "Rossi Costruzioni", icon: Building2, sector: "edilizia" },
  { name: "ImpiantiPro", icon: Wrench, sector: "impianti" },
];

const stats = [
  { icon: "🏗️", text: "50+ dipendenti sostituiti" },
  { icon: "💰", text: "€2.3M risparmiati dai clienti" },
  { icon: "⚡", text: "Setup medio: 7 giorni" },
];

const LogoBar = () => {
  return (
    <section className="bg-neutral-50 py-14">
      <p className="text-center font-display text-[13px] font-medium text-neutral-500 uppercase tracking-[0.08em] mb-10">
        Aziende edili che hanno già sostituito dipendenti con Agenti AI
      </p>

      {/* Marquee logos */}
      <div className="relative overflow-hidden mb-10">
        <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-neutral-50 to-transparent z-10" />
        <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-neutral-50 to-transparent z-10" />
        <div className="flex animate-marquee gap-8 whitespace-nowrap">
          {[...logos, ...logos].map((logo, i) => {
            const Icon = logo.icon;
            return (
              <div
                key={i}
                className="flex-shrink-0 flex items-center gap-3 bg-background border border-neutral-200/80 rounded-2xl px-8 py-5 shadow-sm hover:shadow-md transition-shadow duration-300"
              >
                <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-primary/10">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <span className="font-display text-base font-bold text-neutral-800 tracking-tight">
                  {logo.name}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Stats */}
      <div className="flex flex-wrap justify-center gap-4">
        {stats.map((s) => (
          <div
            key={s.text}
            className="bg-background border border-neutral-200 rounded-full px-5 py-2.5 text-sm font-semibold text-neutral-700 font-display"
          >
            {s.icon} {s.text}
          </div>
        ))}
      </div>
    </section>
  );
};

export default LogoBar;
