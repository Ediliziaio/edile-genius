import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { SERVIZI } from "@/data/servizi";

const BlogCTA = ({ serviceSlug }: { serviceSlug?: string }) => {
  const service = SERVIZI.find((item) => item.slug === serviceSlug);
  return (
  <div className="mt-16 rounded-2xl bg-primary/5 border border-primary/20 p-8 md:p-10 text-center space-y-4">
    <h3 className="text-2xl font-bold text-foreground">Vuoi applicare questo metodo al tuo lavoro?</h3>
    <p className="text-muted-foreground max-w-lg mx-auto">
      {service ? `${service.titolo}. ` : ""}Partiamo da una tua attività, dalle fonti disponibili e dai controlli necessari prima dell'avvio.
    </p>
    <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
      <Link
        to="/#cta-finale"
        className="inline-flex items-center justify-center gap-2 bg-primary-dark text-white px-6 py-3 rounded-xl font-bold hover:opacity-90 transition-colors"
      >
        Prenota la consulenza gratuita <ArrowRight size={16} />
      </Link>
      <Link
        to={service ? `/servizi/${service.slug}` : "/servizi"}
        className="inline-flex items-center justify-center gap-2 border border-border text-foreground px-6 py-3 rounded-xl font-bold hover:bg-muted transition-colors"
      >
        {service ? `Scopri ${service.breve}` : "Scopri i servizi"}
      </Link>
    </div>
  </div>
);
};

export default BlogCTA;
