import { useEffect } from "react";
import { useRouteError } from "react-router-dom";

/**
 * Pagina d'errore del router.
 *
 * Caso tipico dopo una pubblicazione: chi aveva il sito già aperto naviga su un'altra
 * pagina e il browser chiede file della versione vecchia (manifest dei dati SSG o un
 * pezzo di codice) che non esistono più: il server risponde con HTML e compare
 * "is not valid JSON" / "Failed to fetch dynamically imported module".
 * In quel caso ricarichiamo la pagina una volta sola, così arriva la versione nuova.
 */
const STALE_PATTERNS = [
  /is not valid JSON/i,
  /Unexpected token '<'/i,
  /dynamically imported module/i,
  /Importing a module script failed/i,
  /ChunkLoadError/i,
  /Loading chunk [\w-]+ failed/i,
];

const isStaleBuildError = (error: unknown) => {
  const msg = error instanceof Error ? `${error.name} ${error.message}` : String(error ?? "");
  return STALE_PATTERNS.some((re) => re.test(msg));
};

const RELOAD_KEY = "edilizia-io:stale-reload";

const RouteError = () => {
  const error = useRouteError();
  const stale = isStaleBuildError(error);

  useEffect(() => {
    if (!stale) return;
    try {
      const last = Number(sessionStorage.getItem(RELOAD_KEY) || 0);
      // Una sola ricarica ogni 30 secondi: evita cicli se il problema non è la versione vecchia.
      if (Date.now() - last < 30_000) return;
      sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
    } catch {
      /* sessionStorage non disponibile: ricarichiamo comunque una volta */
    }
    window.location.reload();
  }, [stale]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-6">
      <div className="max-w-md text-center space-y-5">
        <p className="font-mono text-xs uppercase tracking-wider text-primary font-semibold">
          {stale ? "Aggiornamento in corso" : "Qualcosa è andato storto"}
        </p>
        <h1 className="font-display text-3xl font-extrabold text-neutral-900">
          {stale ? "Il sito è stato appena aggiornato" : "Non siamo riusciti ad aprire la pagina"}
        </h1>
        <p className="text-neutral-500">
          {stale ? "Stiamo caricando la versione più recente…" : "Ricarica la pagina o torna alla home."}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-xl bg-primary px-6 py-3 font-bold text-primary-foreground hover:bg-primary-dark transition-colors"
          >
            Ricarica la pagina
          </button>
          <a href="/" className="rounded-xl border border-neutral-200 px-6 py-3 font-medium text-neutral-700 hover:border-primary hover:text-primary transition-colors">
            Torna alla home
          </a>
        </div>
      </div>
    </div>
  );
};

export default RouteError;
