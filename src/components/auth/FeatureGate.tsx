import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Lock, CreditCard, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCheckPermesso } from "@/hooks/useCheckPermesso";

const MOTIVO_LABEL: Record<string, { title: string; desc: string; cta?: string }> = {
  feature_non_sbloccata: {
    title: "Funzionalità non inclusa nel tuo piano",
    desc: "Acquista il pacchetto corretto per sbloccare questa funzionalità.",
    cta: "Vedi pacchetti",
  },
  disabilitato_admin: {
    title: "Funzionalità disabilitata",
    desc: "Il tuo amministratore ha disabilitato l'accesso a questa funzionalità.",
  },
  limite_mensile: {
    title: "Limite mensile raggiunto",
    desc: "Hai raggiunto il limite mensile di utilizzo per questa funzionalità.",
    cta: "Contatta il supporto",
  },
  no_auth: {
    title: "Accesso non autorizzato",
    desc: "Devi effettuare il login per accedere a questa funzionalità.",
  },
};

interface FeatureGateProps {
  featureId: string;
  children: ReactNode;
}

export default function FeatureGate({ featureId, children }: FeatureGateProps) {
  const { consentito, motivo, usatoMese, limiteMese } = useCheckPermesso(featureId);

  if (!consentito) {
    const info = MOTIVO_LABEL[motivo || "feature_non_sbloccata"] || MOTIVO_LABEL.feature_non_sbloccata;
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-ink-100 flex items-center justify-center mb-4">
          <Lock className="h-8 w-8 text-ink-400" />
        </div>
        <h2 className="text-xl font-semibold text-ink-900 mb-2">{info.title}</h2>
        <p className="text-ink-500 max-w-sm mb-6">{info.desc}</p>
        {motivo === "limite_mensile" && limiteMese && (
          <p className="text-sm text-ink-400 mb-4">Utilizzi questo mese: {usatoMese} / {limiteMese}</p>
        )}
        {info.cta && (
          <Button asChild className="bg-brand hover:bg-brand-hover text-white">
            <Link to="/app/credits">
              <CreditCard className="h-4 w-4 mr-2" />
              {info.cta}
            </Link>
          </Button>
        )}
      </div>
    );
  }

  return <>{children}</>;
}

// Inline banner variant — use inside pages that partially need a feature
export function FeatureBanner({ featureId }: { featureId: string }) {
  const { consentito, motivo } = useCheckPermesso(featureId);
  if (consentito) return null;
  const info = MOTIVO_LABEL[motivo || "feature_non_sbloccata"] || MOTIVO_LABEL.feature_non_sbloccata;
  return (
    <div className="flex items-center gap-3 rounded-lg border border-status-warning bg-status-warning-light px-4 py-3 text-sm text-status-warning">
      <AlertTriangle className="h-4 w-4 shrink-0" />
      <span>{info.title} — {info.desc}</span>
      <Button asChild size="sm" variant="outline" className="ml-auto border-status-warning text-status-warning hover:bg-status-warning-light">
        <Link to="/app/credits">Sblocca</Link>
      </Button>
    </div>
  );
}
