import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { MetaPixel } from "@/lib/metaPixel";

/**
 * Traccia un PageView Meta a ogni cambio di rotta nella SPA.
 * Il PRIMO caricamento è già tracciato dallo snippet in index.html
 * (`fbq('track','PageView')`), quindi qui saltiamo il primo render per
 * evitare il doppio conteggio.
 */
export default function MetaPixelPageView() {
  const { pathname } = useLocation();
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    MetaPixel.pageView();
    MetaPixel.sitePageView();
  }, [pathname]);

  return null;
}
