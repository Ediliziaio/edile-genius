import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { SERVIZI } from "@/data/servizi";
import { cn } from "@/lib/utils";

/** Servizi collegati per pagina (collegamenti interni utili a Google e al visitatore). */
export const RELATED: Record<string, string[]> = {
  // Per chi è
  "artigiani-micro-imprese": ["automazione-ai", "preventivazione-ai", "marketing-e-vendite-ai"],
  "piccole-imprese": ["automazione-ai", "preventivazione-ai", "controllo-e-analisi"],
  "medie-imprese": ["gare-e-appalti-ai", "controllo-e-analisi", "sicurezza-e-conformita-ai"],
  "grandi-aziende-general-contractor": ["gare-e-appalti-ai", "cantiere-e-acquisti-ai", "sicurezza-e-conformita-ai"],
  "serramentisti-infissi": ["render-ai", "preventivazione-ai", "automazione-ai"],
  "installatori-fotovoltaico": ["automazione-ai", "render-ai", "preventivazione-ai"],
  "imprese-ristrutturazione": ["render-ai", "preventivazione-ai", "cantiere-e-acquisti-ai"],
  "imprese-edili-generali": ["gare-e-appalti-ai", "cantiere-e-acquisti-ai", "sicurezza-e-conformita-ai"],
  "posatori-pavimentisti": ["render-ai", "automazione-ai", "marketing-e-vendite-ai"],
  "lattonieri-coperture": ["render-ai", "sicurezza-e-conformita-ai", "automazione-ai"],
  "impianti-idraulici-termici": ["automazione-ai", "sicurezza-e-conformita-ai", "preventivazione-ai"],
  "impianti-elettrici": ["automazione-ai", "sicurezza-e-conformita-ai", "preventivazione-ai"],
  "cartongessisti-finiture": ["render-ai", "marketing-e-vendite-ai", "preventivazione-ai"],
  "progettisti-studi-tecnici": ["ai-per-progettisti", "gare-e-appalti-ai", "render-ai"],
  // Blog
  "computo-metrico-ai-prezzari-controlli": ["preventivazione-ai", "ai-per-progettisti", "controllo-e-analisi"],
  "render-ai-ristrutturazione-foto-progetto": ["render-ai", "ai-per-progettisti", "preventivazione-ai"],
  "confrontare-offerte-fornitori-ai-edilizia": ["cantiere-e-acquisti-ai", "preventivazione-ai", "controllo-e-analisi"],
  "rapportini-cantiere-voce-ai": ["automazione-ai", "cantiere-e-acquisti-ai", "controllo-e-analisi"],
  "gestionale-edilizia-cloud-ediliziaincloud": ["controllo-e-analisi", "cantiere-e-acquisti-ai", "progettazione-sistemi-ai"],
  "agenti-vocali-ai-edilizia": ["automazione-ai", "marketing-e-vendite-ai", "consulenza-ai"],
  "intelligenza-artificiale-serramenti": ["render-ai", "preventivazione-ai", "automazione-ai"],
  "automazione-preventivi-edilizia": ["preventivazione-ai", "controllo-e-analisi", "automazione-ai"],
  "ai-fotovoltaico-vendite": ["automazione-ai", "marketing-e-vendite-ai", "preventivazione-ai"],
  "ridurre-costi-operativi-impresa-edile": ["automazione-ai", "controllo-e-analisi", "consulenza-ai"],
  "call-center-ai-ristrutturazioni": ["automazione-ai", "marketing-e-vendite-ai", "render-ai"],
  "bonus-edilizi-ai-gestione": ["sicurezza-e-conformita-ai", "automazione-ai", "controllo-e-analisi"],
  "gestione-cantiere-digitale": ["cantiere-e-acquisti-ai", "sicurezza-e-conformita-ai", "controllo-e-analisi"],
  "preventivi-online-edilizia": ["preventivazione-ai", "render-ai", "automazione-ai"],
  "crm-edilizia-intelligenza-artificiale": ["marketing-e-vendite-ai", "automazione-ai", "controllo-e-analisi"],
  "marketing-digitale-imprese-edili": ["marketing-e-vendite-ai", "automazione-ai", "render-ai"],
  "sopralluoghi-virtuali-ai": ["render-ai", "automazione-ai", "preventivazione-ai"],
};

interface RelatedServicesProps {
  pageKey: string;
  title?: string;
  className?: string;
}

const RelatedServices = ({ pageKey, title = "Servizi consigliati", className }: RelatedServicesProps) => {
  const slugs = RELATED[pageKey];
  if (!slugs) return null;
  const items = slugs.map((s) => SERVIZI.find((x) => x.slug === s)).filter((x): x is (typeof SERVIZI)[number] => !!x);
  return (
    <section className={cn("py-14", className)} aria-labelledby={`rel-${pageKey}`}>
      <div className="max-w-6xl mx-auto px-6">
        <h2 id={`rel-${pageKey}`} className="font-display text-2xl md:text-3xl font-extrabold text-neutral-900 mb-6">
          {title}
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          {items.map((s) => (
            <Link
              key={s.slug}
              to={`/servizi/${s.slug}`}
              className="group flex flex-col rounded-2xl border border-neutral-200 bg-background p-5 transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-card-hover"
            >
              <span className="mb-3 grid size-10 place-items-center rounded-xl bg-primary-light text-primary-dark">
                <s.icon size={20} strokeWidth={1.8} />
              </span>
              <span className="font-display font-bold text-neutral-900">{s.titolo}</span>
              <span className="mt-1.5 flex-1 text-sm leading-relaxed text-neutral-500">{s.sintesi}</span>
              <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primary-dark">
                Scopri il servizio <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default RelatedServices;
