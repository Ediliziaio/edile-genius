import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { icons } from "lucide-react";
import type { ServiceItem } from "@/data/perChiE";

interface Props {
  sectorName: string;
  services: ServiceItem[];
}

const SectorServicesGrid = ({ sectorName, services }: Props) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  return (
    <section ref={ref} className="py-16 md:py-24">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-12">
          <span className="font-mono text-xs uppercase tracking-wider text-primary font-bold">
            I Nostri Servizi AI
          </span>
          <h2 className="font-display text-3xl md:text-4xl font-extrabold text-foreground mt-2">
            6 Strumenti AI Per {sectorName}
          </h2>
          <p className="text-muted-foreground mt-3 max-w-2xl mx-auto">
            Ogni servizio è calibrato sulle esigenze specifiche del tuo settore. Non software generico — AI costruita per il tuo lavoro.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((s, i) => {
            const Icon = icons[s.icon as keyof typeof icons];
            return (
              <motion.div
                key={i}
                className="bg-background border border-border rounded-2xl p-6 hover:border-primary/40 hover:shadow-card transition-all"
                initial={{ opacity: 0, y: 24 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: i * 0.08, duration: 0.4 }}
              >
                <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  {Icon && <Icon size={22} className="text-primary" />}
                </div>
                <h3 className="font-display text-base font-bold text-foreground mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default SectorServicesGrid;
