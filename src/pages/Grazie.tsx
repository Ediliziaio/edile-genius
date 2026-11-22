import { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, Clock, Phone, ArrowRight } from "lucide-react";
import { usePageSEO } from "@/hooks/usePageSEO";
import Navbar from "@/components/sections/Navbar";
import Footer from "@/components/sections/Footer";
import { MetaPixel } from "@/lib/metaPixel";

/** Mappa l'origine del form al nome evento per Meta. */
const SOURCES: Record<string, string> = {
  "home-demo": "Grazie — Consulenza gratuita (Home)",
  soluzioni: "Grazie — Sessione Gratuita (Soluzioni)",
};

const nextSteps = [
  { icon: Clock, title: "Entro 4 ore lavorative", text: "Un nostro specialista ti ricontatta per fissare la consulenza gratuita nel momento più comodo per te." },
  { icon: Phone, title: "Analisi del tuo caso", text: "In 30 minuti analizziamo i tuoi processi e dove l'AI ti fa risparmiare tempo e denaro." },
  { icon: CheckCircle2, title: "Nessun impegno", text: "La consulenza è gratuita e senza vincoli. Decidi tu se e quando partire." },
];

const usefulLinks = [
  { label: "I servizi AI", href: "/servizi" },
  { label: "Tutte le soluzioni AI", href: "/soluzioni" },
  { label: "Come funziona", href: "/come-funziona" },
  { label: "Il gestionale EdiliziaInCloud", href: "/edilizia-in-cloud" },
  { label: "Blog e guide", href: "/blog" },
];

export default function Grazie() {
  const [params] = useSearchParams();
  const from = params.get("from") || "";

  const seoTags = usePageSEO({
    title: "Grazie — Richiesta ricevuta | Edilizia.io",
    description: "Grazie! Abbiamo ricevuto la tua richiesta. Ti ricontattiamo entro 4 ore lavorative per la tua consulenza gratuita.",
    canonical: "/grazie",
    noindex: true,
  });

  // Evento Lead affidabile sul pageview della pagina di conferma.
  useEffect(() => {
    MetaPixel.lead({
      content_name: SOURCES[from] || "Grazie — Richiesta ricevuta",
      content_category: "demo",
    });
  }, [from]);

  return (
    <div className="min-h-screen bg-background">
      {seoTags}
      <Navbar />

      <main className="mx-auto max-w-2xl px-6 pt-28 pb-24 md:pt-32 text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
          <CheckCircle2 className="h-11 w-11 text-primary" />
        </div>

        <h1 className="font-display text-3xl md:text-4xl font-extrabold text-foreground leading-tight">
          Grazie! Abbiamo ricevuto la tua richiesta.
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Ti ricontattiamo <strong className="text-foreground">entro 4 ore lavorative</strong> per
          fissare la tua consulenza gratuita.
        </p>

        {/* Prossimi passi */}
        <div className="mt-10 grid gap-4 text-left sm:grid-cols-3">
          {nextSteps.map((s) => (
            <div key={s.title} className="rounded-2xl border border-border bg-muted/30 p-5">
              <s.icon className="h-6 w-6 text-primary" />
              <h2 className="mt-3 font-display text-sm font-bold text-foreground">{s.title}</h2>
              <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{s.text}</p>
            </div>
          ))}
        </div>

        {/* Link utili */}
        <div className="mt-12">
          <p className="mb-4 font-mono text-xs uppercase tracking-wider text-muted-foreground">
            Nel frattempo, dai un'occhiata
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {usefulLinks.map((l) => (
              <Link
                key={l.href}
                to={l.href}
                className="flex items-center justify-between rounded-xl border border-border px-5 py-3.5 text-sm font-semibold text-foreground transition-colors hover:border-primary hover:text-primary"
              >
                {l.label}
                <ArrowRight size={15} className="opacity-50" />
              </Link>
            ))}
          </div>
        </div>

        <Link
          to="/"
          className="mt-10 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-primary"
        >
          ← Torna alla home
        </Link>
      </main>

      <Footer />
    </div>
  );
}
