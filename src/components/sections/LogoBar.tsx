import logoMarchetti from "@/assets/logos/costruzioni-marchetti.png";
import logoSolartech from "@/assets/logos/solartech-italia.png";
import logoFinestre from "@/assets/logos/finestre-italia.png";
import logoTermoidraulica from "@/assets/logos/termoidraulica-verdi.png";
import logoEdilgroup from "@/assets/logos/edilgroup-roma.png";
import logoEnersun from "@/assets/logos/enersun-impianti.png";
import logoSerramenti from "@/assets/logos/serramenti-bianchi.png";
import logoCmb from "@/assets/logos/cmb-edilizia.png";
import logoRossi from "@/assets/logos/rossi-costruzioni.png";
import logoImpiantipro from "@/assets/logos/impiantipro.png";

const logos = [
  { name: "Costruzioni Marchetti", src: logoMarchetti },
  { name: "SolarTech Italia", src: logoSolartech },
  { name: "Finestre Italia", src: logoFinestre },
  { name: "Termoidraulica Verdi", src: logoTermoidraulica },
  { name: "Edilgroup Roma", src: logoEdilgroup },
  { name: "EnerSun Impianti", src: logoEnersun },
  { name: "Serramenti Bianchi", src: logoSerramenti },
  { name: "CMB Edilizia", src: logoCmb },
  { name: "Rossi Costruzioni", src: logoRossi },
  { name: "ImpiantiPro", src: logoImpiantipro },
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
        <div className="flex animate-marquee gap-10 whitespace-nowrap">
          {[...logos, ...logos].map((logo, i) => (
            <div
              key={i}
              className="flex-shrink-0 flex items-center justify-center bg-background border border-neutral-200/80 rounded-2xl px-6 py-4 shadow-sm hover:shadow-md transition-shadow duration-300"
              style={{ minWidth: 180, height: 90 }}
            >
              <img
                src={logo.src}
                alt={logo.name}
                className="h-16 w-auto object-contain"
                loading="lazy"
              />
            </div>
          ))}
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
