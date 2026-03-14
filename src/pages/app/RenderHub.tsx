import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyId } from "@/hooks/useCompanyId";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Camera, Sparkles, Image, Share2, Plus, Coins } from "lucide-react";
import BeforeAfterSlider from "@/components/render/BeforeAfterSlider";

export default function RenderHub() {
  const companyId = useCompanyId();
  const [credits, setCredits] = useState<{ balance: number; total_used: number } | null>(null);
  const [recentRenders, setRecentRenders] = useState<any[]>([]);

  useEffect(() => {
    if (!companyId) return;
    supabase.from("render_credits").select("balance, total_used").eq("company_id", companyId).single()
      .then(({ data }) => { if (data) setCredits(data as any); });
    supabase.from("render_gallery").select("*").eq("company_id", companyId).order("created_at", { ascending: false }).limit(6)
      .then(({ data }) => { if (data) setRecentRenders(data); });
  }, [companyId]);

  const steps = [
    { icon: Camera, title: "Scatta o Carica", desc: "Fotografa la finestra esistente dal cantiere o carica un'immagine" },
    { icon: Sparkles, title: "Configura Infisso", desc: "Scegli materiale, colore, stile telaio e tipo di vetro" },
    { icon: Image, title: "AI Render", desc: "L'intelligenza artificiale genera il render fotorealistico" },
    { icon: Share2, title: "Condividi", desc: "Invia al cliente via WhatsApp o salva nella galleria" },
  ];

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border p-5 md:p-12">
        {/* Credits widget — inline on mobile, absolute on desktop */}
        {credits && (
          <div className="md:absolute md:top-6 md:right-6 bg-card border rounded-xl p-3 md:p-4 shadow-sm mb-4 md:mb-0 flex md:block items-center gap-3">
            <div className="flex items-center gap-2 md:mb-1">
              <Coins className="h-4 w-4 text-primary" />
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Crediti Render</span>
            </div>
            <p className="text-xl md:text-2xl font-bold text-foreground">{credits.balance}</p>
            <p className="text-xs text-muted-foreground">{credits.total_used} utilizzati</p>
          </div>
        )}

        <div className="max-w-2xl">
          <Badge variant="secondary" className="mb-3 md:mb-4">
            <Sparkles className="h-3 w-3 mr-1" /> AI Render
          </Badge>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2 md:mb-3">
            Visualizzatore Infissi AI
          </h1>
          <p className="text-muted-foreground text-sm md:text-lg mb-4 md:mb-6">
            Mostra ai tuoi clienti come appariranno i nuovi infissi sulla loro casa. 
            Carica una foto, configura il serramento e ottieni un render fotorealistico in pochi secondi.
          </p>
          <div className="flex gap-2 md:gap-3">
            <Button asChild size="lg" className="flex-1 md:flex-none">
              <Link to="/app/render/new">
                <Plus className="h-4 w-4 mr-2" /> Nuovo Render
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="flex-1 md:flex-none">
              <Link to="/app/render/gallery">
                <Image className="h-4 w-4 mr-2" /> Galleria
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* How it works */}
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-4">Come Funziona</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {steps.map((step, i) => (
            <Card key={i} className="relative">
              <CardContent className="p-5">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                  <step.icon className="h-5 w-5 text-primary" />
                </div>
                <span className="absolute top-4 right-4 text-xs font-bold text-muted-foreground/40">{i + 1}</span>
                <h3 className="font-semibold text-foreground mb-1">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Recent renders */}
      {recentRenders.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-foreground">Ultimi Render</h2>
            <Button asChild variant="ghost" size="sm">
              <Link to="/app/render/gallery">Vedi tutti →</Link>
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recentRenders.map((r) => (
              <Link key={r.id} to={`/app/render/gallery/${r.id}`}>
                <Card className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
                  <div className="aspect-video relative">
                    <img src={r.render_url} alt={r.title || "Render"} loading="lazy" decoding="async" className="w-full h-full object-cover" />
                  </div>
                  <CardContent className="p-3">
                    <p className="font-medium text-sm text-foreground truncate">{r.title || "Render senza titolo"}</p>
                    <p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString("it-IT")}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {recentRenders.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="p-12 text-center">
            <Image className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="font-semibold text-foreground mb-1">Nessun render ancora</h3>
            <p className="text-sm text-muted-foreground mb-4">Crea il tuo primo render AI per visualizzare gli infissi</p>
            <Button asChild>
              <Link to="/app/render/new"><Plus className="h-4 w-4 mr-2" /> Crea Primo Render</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
