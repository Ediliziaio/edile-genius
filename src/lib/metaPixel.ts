/**
 * Helper Meta Pixel (fbq). Il pixel base è inizializzato in index.html
 * (`fbq('init', ...)` + PageView al primo caricamento). Qui esponiamo gli
 * eventi standard, tutti protetti: se fbq non è ancora caricato o siamo in
 * prerender (Node), la chiamata è un no-op sicuro.
 *
 * IMPORTANTE: lo stesso pixel è usato su più siti del gruppo. Per riconoscere
 * la provenienza in Events Manager, OGNI evento porta `source_site` = "edilizia.io"
 * (oltre all'URL sorgente già catturato automaticamente da Meta).
 */

/** Dominio che identifica questo sito negli eventi del pixel condiviso. */
export const SOURCE_SITE = "edilizia.io";

/** Evento custom di pageview specifico di questo sito (per filtro per nome in Meta). */
export const SITE_PAGEVIEW_EVENT = "PV_ediliziaio";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

/** Unisce sempre il tag di provenienza ai parametri dell'evento. */
function withSource(params?: Record<string, unknown>): Record<string, unknown> {
  return { source_site: SOURCE_SITE, ...(params || {}) };
}

function fbq(...args: unknown[]) {
  if (typeof window !== "undefined" && typeof window.fbq === "function") {
    window.fbq(...args);
  }
}

export const MetaPixel = {
  /** PageView — usato dal tracker di navigazione SPA. */
  pageView(params?: Record<string, unknown>) {
    fbq("track", "PageView", withSource(params));
  },

  /** PV_ediliziaio — evento custom di pageview specifico di questo sito. */
  sitePageView(params?: Record<string, unknown>) {
    fbq("trackCustom", SITE_PAGEVIEW_EVENT, withSource(params));
  },

  /** Evento standard generico. */
  track(event: string, params?: Record<string, unknown>) {
    fbq("track", event, withSource(params));
  },

  /** Evento custom (trackCustom). */
  trackCustom(event: string, params?: Record<string, unknown>) {
    fbq("trackCustom", event, withSource(params));
  },

  /** Lead — richiesta demo, invio form, contatto commerciale. */
  lead(params?: Record<string, unknown>) {
    fbq("track", "Lead", withSource(params));
  },

  /** Contact — click su WhatsApp / telefono. */
  contact(params?: Record<string, unknown>) {
    fbq("track", "Contact", withSource(params));
  },

  /** ViewContent — visualizzazione di una pagina offerta / money page. */
  viewContent(params?: Record<string, unknown>) {
    fbq("track", "ViewContent", withSource(params));
  },

  /** CompleteRegistration — registrazione account completata. */
  completeRegistration(params?: Record<string, unknown>) {
    fbq("track", "CompleteRegistration", withSource(params));
  },
};
