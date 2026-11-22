import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Al cambio pagina torna in cima; se l'indirizzo ha un'ancora (es. /#cta-finale)
 * scorre invece fino a quell'elemento, riprovando per qualche istante perché molte
 * sezioni (form di contatto compreso) vengono caricate in modo differito.
 */
const ScrollToTop = () => {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (!hash) {
      window.scrollTo(0, 0);
      return;
    }
    const id = decodeURIComponent(hash.slice(1));
    let tries = 0;
    let timer = 0;
    const attempt = () => {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
      if (tries++ < 30) timer = window.setTimeout(attempt, 100);
    };
    attempt();
    return () => window.clearTimeout(timer);
  }, [pathname, hash]);
  return null;
};

export default ScrollToTop;
