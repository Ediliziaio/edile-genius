import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyId } from "@/hooks/useCompanyId";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bath, Sparkles, Plus, Coins, Camera, Settings, Image } from "lucide-react";

export default function RenderBagnoHub() {
  const companyId = useCompanyId();
  const [credits, setCredits] = useState<{ balance: number; total_used: number } | null>(null);
  const [recentCount, setRecentCount] = useState(0);

  useEffect(() => {
    if (!companyId) return;
    supabase.from("render_credits").select("balance, total_used").eq("company_id", companyId).single()
      .then(({ data }) => { if (data) setCredits(data as any); });
    supabase.from("render_bagno_sessions" as any).select("id", { count: "exact", head: true }).eq("company_id", companyId).eq("stato", "completato")
      .then(({ count }) => { setRecentCount(count ?? 0); });
  }, [companyId]);

  const steps = [
    { step: "1", icon: Camera, title: "Carica foto", desc: "Foto del bagno attuale" },
    { step: "2", icon: Sparkles, title: "Analisi AI", desc: "Rileva elementi presenti" },
    { step: "3", icon: Settings, title: "Configura", desc: "Piastrelle, doccia, vasca, mobili" },
    { step: "4", icon: Image, title: "Genera", desc: "Render fotorealistico" },
  ];

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border p-8 md:p-12">
        <div className="max-w-2xl">
          <Badge variant="secondary" className="mb-4">
            <Bath className="h-3 w-3 mr-1" /> Render Bagno
          </Badge>
          <h1 className="text-3xl font-bold text-foreground mb-3">
            Render Bagno AI
          </h1>
          <p className="text-muted-foreground text-lg mb-6">
            Visualizza la ristrutturazione del bagno prima di iniziare i lavori.
            Carica una foto, configura piastrelle, doccia, vasca e mobili, e ottieni un render fotorealistico.
          </p>
          <div className="flex gap-3">
            <Button asChild size="lg">
              <Link to="/app/render-bagno/new">
                <Plus className="h-4 w-4 mr-2" /> Nuovo Render
              </Link>
            </Button>
          </div>
        </div>

        {/* Credits widget */}
        {credits && (
          <div className="absolute top-6 right-6 bg-background/80 backdrop-blur rounded-xl border px-4 py-3 text-right">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Coins className="h-4 w-4" /> Crediti Render
            </div>
            <p className="text-2xl font-bold text-foreground">{credits.balance}</p>
            <p className="text-xs text-muted-foreground">{credits.total_used} utilizzati • {recentCount} render bagno</p>
          </div>
        )}
      </div>

      {/* Come funziona */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {steps.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.step} className="text-center">
              <CardContent className="pt-6 pb-4 space-y-2">
                <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <p className="text-xs font-semibold text-muted-foreground">Passo {s.step}</p>
                <p className="font-semibold text-foreground">{s.title}</p>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Placeholder gallery */}
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          <Bath className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">Nessun render bagno ancora</p>
          <p className="text-sm">Crea il tuo primo render per vederlo qui</p>
        </CardContent>
      </Card>
    </div>
  );
}
