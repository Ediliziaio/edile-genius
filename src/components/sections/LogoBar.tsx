import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import EditorialVisual from "@/components/custom/EditorialVisual";
import { SITE_VISUALS } from "@/data/siteVisuals";

const paths = [
  { title: "Gestire chiamate e richieste", description: "Raccogli le informazioni e passa al team le richieste da seguire.", href: "/servizi/automazione-ai", visual: SITE_VISUALS.voice },
  { title: "Preparare preventivi e computi", description: "Parti dai tuoi listini e controlla la bozza prima di inviarla.", href: "/servizi/preventivazione-ai", visual: SITE_VISUALS.estimates },
  { title: "Mostrare una proposta visiva", description: "Usa foto e materiali per spiegare al cliente l'idea di ristrutturazione.", href: "/servizi/render-ai", visual: SITE_VISUALS.render },
];

export default function LogoBar() {
  return (
    <section className="border-y border-neutral-200 bg-neutral-50 py-12 md:py-16" aria-labelledby="primi-passi-ai">
      <div className="mx-auto max-w-6xl px-6">
        <p className="mb-3 font-mono text-xs font-semibold uppercase tracking-wider text-primary-dark">Da dove iniziare</p>
        <h2 id="primi-passi-ai" className="max-w-2xl font-display text-2xl font-extrabold text-neutral-900 md:text-3xl">Scegli il lavoro che vuoi semplificare.</h2>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {paths.map((path) => <Link key={path.href} to={path.href} className="group min-w-0 rounded-2xl border border-neutral-200 bg-background p-3 transition-colors hover:border-primary-dark">
            <EditorialVisual visual={path.visual} compact sizes="(min-width: 768px) 350px, calc(100vw - 76px)" />
            <div className="p-3">
              <h3 className="flex items-start justify-between gap-3 font-display text-lg font-bold leading-snug text-neutral-900">{path.title}<ArrowUpRight size={20} className="shrink-0 text-primary-dark" /></h3>
              <p className="mt-2 text-sm leading-relaxed text-neutral-500">{path.description}</p>
            </div>
          </Link>)}
        </div>
        <p className="mt-3 text-xs text-neutral-500">Immagini illustrative generate con AI.</p>
      </div>
    </section>
  );
}
