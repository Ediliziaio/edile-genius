import { Link, useLocation } from "react-router-dom";
import { AlertTriangle, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyId } from "@/hooks/useCompanyId";

// Pages that are always accessible regardless of credit balance
const EXEMPT_PATHS = ["/app/credits", "/app/settings", "/app/onboarding"];

export default function CreditsBlockedBanner() {
  const companyId = useCompanyId();
  const location = useLocation();

  const { data: credits } = useQuery({
    queryKey: ["credits-status", companyId],
    queryFn: async () => {
      if (!companyId) return null;
      const { data } = await supabase
        .from("ai_credits")
        .select("balance_eur, calls_blocked, blocked_reason")
        .eq("company_id", companyId)
        .single();
      return data;
    },
    enabled: !!companyId,
    refetchInterval: 60_000, // re-check every minute
    staleTime: 30_000,
  });

  const isBlocked = credits?.calls_blocked || (credits && Number(credits.balance_eur) <= 0);
  const isExempt = EXEMPT_PATHS.some(p => location.pathname.startsWith(p));

  if (!isBlocked) return null;

  // Full-page overlay for all feature pages
  if (!isExempt) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/95 backdrop-blur-sm px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-status-error-light flex items-center justify-center mb-4">
          <AlertTriangle className="h-8 w-8 text-status-error" />
        </div>
        <h2 className="text-xl font-bold text-ink-900 mb-2">Crediti esauriti</h2>
        <p className="text-ink-500 max-w-sm mb-2">
          Il saldo del tuo account è a zero. Ricarica per continuare a usare tutte le funzionalità.
        </p>
        {credits?.blocked_reason && (
          <p className="text-xs text-ink-400 mb-4">Motivo blocco: {credits.blocked_reason}</p>
        )}
        <div className="flex gap-3">
          <Button asChild className="bg-brand hover:bg-brand-hover text-white">
            <Link to="/app/credits">
              <CreditCard className="h-4 w-4 mr-2" />
              Ricarica crediti
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  // On the credits page: show a top banner instead of full overlay
  return (
    <div className="flex items-center gap-3 bg-status-error text-white px-4 py-2 text-sm">
      <AlertTriangle className="h-4 w-4 shrink-0" />
      <span>Crediti esauriti — Ricarica per riabilitare tutte le funzionalità.</span>
    </div>
  );
}
