import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { SERVICE_VISUALS, SITE_VISUALS, type SiteVisual } from "@/data/siteVisuals";
import EditorialVisual from "./EditorialVisual";

const guides: Record<string, { slug: string; title: string; description: string; visual: SiteVisual }> = {
  estimates: { slug: "computo-metrico-ai-prezzari-controlli", title: "Computo metrico con AI: dati, prezzari e controlli", description: "Come preparare una bozza e verificare quantità, voci e prezzi prima di inviarla.", visual: SITE_VISUALS.estimates },
  quotes: { slug: "confrontare-offerte-fornitori-ai-edilizia", title: "Confrontare le offerte dei fornitori con l'AI", description: "Come portare le offerte sulla stessa base e leggere differenze, esclusioni e condizioni.", visual: SITE_VISUALS.documents },
  render: { slug: "render-ai-ristrutturazione-foto-progetto", title: "Render AI: dalla foto alla proposta di ristrutturazione", description: "Quali foto e indicazioni servono e cosa controllare nella proposta visiva.", visual: SITE_VISUALS.render },
  site: { slug: "rapportini-cantiere-voce-ai", title: "Rapportini di cantiere da note vocali", description: "Un metodo per raccogliere ore, materiali e problemi, con una verifica prima della conferma.", visual: SITE_VISUALS.site },
};

function keysFor(pageKey: string) {
  const visual = SERVICE_VISUALS[pageKey];
  if (pageKey.includes("render") || /serramenti|ristrutturazione|paviment|finiture/.test(pageKey)) return ["render", "estimates"];
  if (/preventiv|controllo|acquisti|fotovoltaico/.test(pageKey)) return ["estimates", "quotes"];
  if (/gare|progettist|general-contractor/.test(pageKey)) return ["quotes", "estimates"];
  if (visual === SITE_VISUALS.site || /artigiani|impianti|coperture|imprese-edili/.test(pageKey)) return ["site", "quotes"];
  return ["site", "estimates"];
}

export default function RelatedGuides({ pageKey }: { pageKey: string }) {
  return (
    <section className="border-y border-neutral-200 bg-neutral-50 py-14 md:py-20" aria-labelledby={`guides-${pageKey}`}>
      <div className="mx-auto max-w-6xl px-6">
        <p className="mb-3 font-mono text-xs font-semibold uppercase tracking-wider text-primary-dark">Guide pratiche</p>
        <h2 id={`guides-${pageKey}`} className="mb-8 font-display text-2xl font-extrabold text-neutral-900 md:text-3xl">Vedi come applicare l'AI al lavoro di ogni giorno.</h2>
        <div className="grid gap-6 md:grid-cols-2">
          {keysFor(pageKey).map((key) => {
            const guide = guides[key];
            return <Link key={key} to={`/blog/${guide.slug}`} className="group grid items-center gap-5 rounded-2xl border border-neutral-200 bg-background p-4 transition-colors hover:border-primary-dark sm:grid-cols-[160px_1fr]">
              <EditorialVisual visual={guide.visual} compact sizes="(min-width: 640px) 160px, calc(100vw - 80px)" />
              <div>
                <h3 className="font-display font-bold leading-snug text-neutral-900">{guide.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-neutral-500">{guide.description}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary-dark">Leggi la guida <ArrowUpRight size={16} /></span>
              </div>
            </Link>;
          })}
        </div>
      </div>
    </section>
  );
}
