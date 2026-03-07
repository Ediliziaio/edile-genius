import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyId } from "@/hooks/useCompanyId";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Phone, Plus, Clock, Bot, Globe, Loader2 } from "lucide-react";

interface PhoneNumber {
  id: string;
  phone_number: string;
  label: string | null;
  status: string | null;
  country_code: string | null;
  provider: string | null;
  agent_id: string | null;
  active_hours_start: string | null;
  active_hours_end: string | null;
  active_days: string[] | null;
  monthly_cost: number | null;
  created_at: string | null;
}

interface AgentName { id: string; name: string; }

export default function PhoneNumbers() {
  const companyId = useCompanyId();
  const [numbers, setNumbers] = useState<PhoneNumber[]>([]);
  const [agents, setAgents] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!companyId) return;
    Promise.all([
      supabase.from("ai_phone_numbers").select("*").eq("company_id", companyId).order("created_at", { ascending: false }),
      supabase.from("agents").select("id, name").eq("company_id", companyId),
    ]).then(([numRes, agRes]) => {
      if (numRes.data) setNumbers(numRes.data as unknown as PhoneNumber[]);
      if (agRes.data) {
        const map: Record<string, string> = {};
        (agRes.data as AgentName[]).forEach(a => { map[a.id] = a.name; });
        setAgents(map);
      }
      setLoading(false);
    });
  }, [companyId]);

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">Numeri di Telefono</h1>
          <p className="text-sm text-ink-500 mt-1">Gestisci i numeri assegnati ai tuoi agenti AI</p>
        </div>
        <Button asChild className="bg-brand hover:bg-brand-hover text-white">
          <Link to="/app/phone-numbers/buy"><Plus className="h-4 w-4 mr-2" /> Acquista Numero</Link>
        </Button>
      </div>

      {numbers.length === 0 ? (
        <Card className="border-dashed border-2 border-ink-200">
          <CardContent className="p-12 text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-brand-light flex items-center justify-center">
              <Phone className="h-8 w-8 text-brand" />
            </div>
            <h3 className="text-lg font-semibold text-ink-900">Nessun numero configurato</h3>
            <p className="text-sm text-ink-500 max-w-md mx-auto">
              Acquista un numero di telefono per permettere ai tuoi agenti AI di ricevere ed effettuare chiamate.
            </p>
            <Button asChild className="bg-brand hover:bg-brand-hover text-white">
              <Link to="/app/phone-numbers/buy"><Plus className="h-4 w-4 mr-2" /> Acquista il tuo primo numero</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {numbers.map((num) => (
            <Card key={num.id} className="border border-ink-200 shadow-card hover:shadow-hover transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-btn bg-brand-light flex items-center justify-center">
                      <Phone className="h-5 w-5 text-brand" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-base font-semibold text-ink-900">{num.phone_number}</p>
                        {num.label && <span className="text-sm text-ink-500">— {num.label}</span>}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-ink-400">
                        <span className="flex items-center gap-1"><Globe className="h-3 w-3" /> {num.country_code || "IT"}</span>
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {num.active_hours_start || "09:00"}-{num.active_hours_end || "19:00"}</span>
                        {num.agent_id && <span className="flex items-center gap-1"><Bot className="h-3 w-3" /> {agents[num.agent_id] || "Agente"}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {num.monthly_cost != null && num.monthly_cost > 0 && (
                      <span className="text-xs font-mono text-ink-500">€{num.monthly_cost}/mese</span>
                    )}
                    <Badge variant={num.status === "active" ? "default" : "secondary"} className={num.status === "active" ? "bg-brand-light text-brand-text border-brand-border" : ""}>
                      {num.status === "active" ? "Attivo" : num.status || "—"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
