import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { usePageSEO } from "@/hooks/usePageSEO";

const NotFound = () => {
  const location = useLocation();
  const seoTags = usePageSEO({
    title: "Pagina non trovata | Edilizia.io",
    description: "La pagina che cerchi non esiste o è stata spostata.",
    canonical: location.pathname,
    noindex: true,
  });

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-6">
      {seoTags}
      <div className="max-w-md text-center space-y-5">
        <p className="font-mono text-xs uppercase tracking-wider text-primary font-semibold">Errore 404</p>
        <h1 className="font-display text-4xl font-extrabold text-neutral-900">Pagina non trovata</h1>
        <p className="text-neutral-500">La pagina che cerchi non esiste o è stata spostata. Da qui puoi ripartire:</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/" className="rounded-xl bg-primary px-6 py-3 font-bold text-primary-foreground hover:bg-primary-dark transition-colors">
            Torna alla home
          </Link>
          <Link to="/servizi" className="rounded-xl border border-neutral-200 px-6 py-3 font-medium text-neutral-700 hover:border-primary hover:text-primary transition-colors">
            Scopri i servizi
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
