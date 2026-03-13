import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyId } from "@/hooks/useCompanyId";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Home, Sparkles, Plus, Coins, Camera, Settings, Image, Download, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface GalleryItem {
  id: string;
  title: string | null;
  render_url: string;
  original_url: string | null;
  created_at: string;
}

export default function RenderFacciataHub() {
  const companyId = useCompanyId();
  const { toast } = useToast();
  const [credits, setCredits] = useState<{ balance: number; total_used: number } | null>(null);
  const [recentCount, setRecentCount] = useState(0);
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);

  useEffect(() => {
    if (!companyId) return;
    supabase.from("render_credits").select("balance, total_used").eq("company_id", companyId).single()
      .then(({ data }) => { if (data) setCredits(data as any); });
    (supabase.from("render_facciata_sessions" as any) as any)
      .select("id", { count: "exact", head: true })
      .eq("company_id", companyId).eq("status", "completed")
      .then(({ count }: any) => { setRecentCount(count ?? 0); });
    (supabase.from("render_facciata_gallery" as any) as any)
      .select("id, title, render_url, original_url, created_at")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false })
      .limit(20)
      .then(({ data }: any) => { if (data) setGalleryItems(data); });
  }, [companyId]);

  const deleteGalleryItem = async (id: string) => {
    const { error } = await (supabase.from("render_facciata_gallery" as any) as any).delete().eq("id", id);
    if (!error) {
      setGalleryItems(prev => prev.filter(i => i.id !== id));
      toast({ title: "Eliminato", description: "Render rimosso dalla gallery" });
    }
  };

  const steps = [
    { step: "1", icon: Camera, title: "Carica foto", desc: "Foto frontale della facciata attuale" },
    { step: "2", icon: Sparkles, title: "AI analizza", desc: "Rileva intonaco, rivestimenti, cornici" },
    { step: "3", icon: Settings, title: "Configura intervento", desc: "Colore, cappotto, pietra, laterizio" },
    { step: "4", icon: Image, title: "Genera il render", desc: "Visualizzazione fotorealistica in 30s" },
  ];

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border p-8 md:p-12">
        <div className="max-w-2xl">
          <Badge variant="secondary" className="mb-4">
            <Home className="h-3 w-3 mr-1" /> Render Facciata
          </Badge>
          <h1 className="text-3xl font-bold text-foreground mb-3">
            Render Facciata AI
          </h1>
          <p className="text-muted-foreground text-lg mb-6">
            Visualizza come sarà la facciata con tinteggiatura, cappotto termico
            o rivestimenti in pietra e laterizio.
          </p>
          <div className="flex gap-3">
            <Button asChild size="lg">
              <Link to="/app/render-facciata/new">
                <Plus className="h-4 w-4 mr-2" /> Nuovo Render Facciata
              </Link>
            </Button>
          </div>
        </div>

        {credits && (
          <div className="absolute top-6 right-6 bg-background/80 backdrop-blur rounded-xl border px-4 py-3 text-right">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Coins className="h-4 w-4" /> Crediti Render
            </div>
            <p className="text-2xl font-bold text-foreground">{credits.balance}</p>
            <p className="text-xs text-muted-foreground">{credits.total_used} utilizzati • {recentCount} render facciata</p>
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

      {/* Gallery */}
      {galleryItems.length > 0 ? (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-foreground">I tuoi render</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {galleryItems.map(item => (
              <div key={item.id} className="group relative rounded-xl overflow-hidden border bg-card">
                <img
                  src={item.render_url}
                  alt={item.title || "Render facciata"}
                  className="w-full aspect-square object-cover"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-end">
                  <div className="w-full p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-white text-sm font-medium truncate">
                      {item.title || new Date(item.created_at).toLocaleDateString("it-IT")}
                    </p>
                    <div className="flex gap-2 mt-2">
                      <a
                        href={item.render_url}
                        download
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg bg-white/20 hover:bg-white/40 transition-colors"
                      >
                        <Download className="h-4 w-4 text-white" />
                      </a>
                      <button
                        onClick={() => deleteGalleryItem(item.id)}
                        className="p-1.5 rounded-lg bg-white/20 hover:bg-destructive/80 transition-colors"
                      >
                        <Trash2 className="h-4 w-4 text-white" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Home className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">Nessun render facciata ancora</p>
            <p className="text-sm">Crea il tuo primo render per vederlo qui</p>
            <Button asChild className="mt-4">
              <Link to="/app/render-facciata/new">
                <Plus className="h-4 w-4 mr-2" /> Crea il primo render
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
