import { usePageSEO } from "@/hooks/usePageSEO";
import Navbar from "@/components/sections/Navbar";
import Footer from "@/components/sections/Footer";
import { LEGAL_DOCS } from "@/data/legal";

interface LegalPageProps {
  doc: keyof typeof LEGAL_DOCS;
}

export default function LegalPage({ doc }: LegalPageProps) {
  const data = LEGAL_DOCS[doc];

  const seoTags = usePageSEO({
    title: data.metaTitle,
    description: data.description,
    canonical: `/${data.slug}`,
  });

  return (
    <div className="min-h-screen bg-background">
      {seoTags}
      <Navbar />
      <main className="mx-auto max-w-3xl px-5 pt-28 pb-24 md:pt-32">
        <header className="mb-10 border-b border-border pb-8">
          <h1 className="font-display text-3xl md:text-4xl font-extrabold text-foreground leading-tight">
            {data.title}
          </h1>
          <p className="mt-3 font-mono text-xs uppercase tracking-wider text-muted-foreground">
            Ultimo aggiornamento: {data.updated}
          </p>
        </header>

        {data.intro.map((p, i) => (
          <p key={`intro-${i}`} className="mb-5 text-[15px] leading-relaxed text-muted-foreground">
            {p}
          </p>
        ))}

        <div className="mt-8 space-y-8">
          {data.sections.map((section) => (
            <section key={section.h}>
              <h2 className="mb-3 text-lg font-bold text-foreground">{section.h}</h2>
              {section.body.map((p, i) => (
                <p key={i} className="mb-3 text-[15px] leading-relaxed text-muted-foreground">
                  {p}
                </p>
              ))}
            </section>
          ))}
        </div>

        <p className="mt-12 rounded-lg border border-border bg-muted/40 p-4 text-xs leading-relaxed text-muted-foreground">
          Il presente documento è una versione standard e va integrato con i dati anagrafici
          completi del Titolare e revisionato da un professionista prima della pubblicazione definitiva.
        </p>
      </main>
      <Footer />
    </div>
  );
}
