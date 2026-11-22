import { useEffect, useRef } from "react";
import { MetaPixel } from "@/lib/metaPixel";

/**
 * Form di contatto embeddato di EdiliziaInCloud.
 * Replica l'embed ufficiale (iframe + auto-height via postMessage) in modo
 * SSR-safe: l'iframe è renderizzato staticamente, il listener dei messaggi vive
 * solo lato client (useEffect). I lead inviati arrivano direttamente a EiC.
 */

const EIC_ORIGIN = "https://app.ediliziaincloud.com";
const SLUG = "edilizia-io";
const COMPANY_ID = "00000000-0000-0000-0000-000000000001";

interface EicFormProps {
  className?: string;
  /** Etichetta per l'evento Meta Lead (per distinguere la pagina di origine). */
  source?: string;
}

export default function EicForm({ className = "", source = "edilizia.io" }: EicFormProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (e.origin !== EIC_ORIGIN) return;
      const data = e.data;
      if (!data || data.slug !== SLUG) return;

      if (data.type === "eic-form-height" && iframeRef.current) {
        iframeRef.current.style.height = `${data.height}px`;
      }
      // Se il form EiC notifica l'invio, tracciamo la conversione su Meta.
      if (data.type === "eic-form-submitted" || data.type === "eic-form-success") {
        MetaPixel.lead({ content_name: `Form EiC — ${source}`, content_category: "demo" });
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [source]);

  return (
    <div id="eic-form-edilizia-io" className={className}>
      <iframe
        ref={iframeRef}
        src={`${EIC_ORIGIN}/f?slug=${SLUG}&company_id=${COMPANY_ID}`}
        title="Richiedi informazioni"
        loading="lazy"
        referrerPolicy="strict-origin-when-cross-origin"
        style={{
          width: "100%",
          minHeight: 620,
          border: 0,
          maxWidth: 640,
          margin: "0 auto",
          display: "block",
          borderRadius: 12,
          overflow: "hidden",
        }}
      />
    </div>
  );
}
