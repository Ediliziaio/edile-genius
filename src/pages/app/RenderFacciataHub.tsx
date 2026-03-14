import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyId } from "@/hooks/useCompanyId";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Home, Sparkles, Plus, Coins, Camera, Settings, Image,
  Download, Trash2, Layers, Palette, Zap,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { VirtualGalleryGrid } from "@/components/ui/VirtualGalleryGrid";

interface GalleryItem {
  id: string;
  title: string | null;
  render_url: string;
  original_url: string | null;
  created_at: string;
  tipo_intervento?: string | null;
  colore_name?: string | null;
}

export default function RenderFacciataHub() {
  const companyId = useCompanyId();
  const isAdmin = useIsAdmin();
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"come_funziona" | "galleria">("come_funziona");

  // ── Credits ──
  const { data: credits } = useQuery({
    queryKey: ["render-credits", companyId],
    queryFn: async () => {
      if (!companyId) return null;
      const { data } = await supabase
        .from("render_credits")
        .select("balance, total_used")
        .eq("company_id", companyId)
        .single();
      return data;
    },
    enabled: !!companyId,
    staleTime: 60_000,
  });

  // ── Gallery ──
  const { data: galleryItems = [], isLoading: galleryLoading } = useQuery({
    queryKey: ["render-facciata-gallery", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data } = await (supabase.from("render_facciata_gallery" as any) as any)
        .select("id, title, render_url, original_url, created_at")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false })
        .limit(200);
      return (data || []) as GalleryItem[];
    },
    enabled: !!companyId && activeTab === "galleria",
    staleTime: 30_000,
  });

  const deleteGalleryItem = async (id: string) => {
    const { error } = await (supabase.from("render_facciata_gallery" as any) as any).delete().eq("id", id);
    if (!error) {
      toast({ title: "Eliminato", description: "Render rimosso dalla gallery" });
    }
  };

  const steps = [
    { icon: Camera, title: "Carica la foto", desc: "Foto frontale della facciata attuale — JPG, PNG, WEBP fino a 15 MB" },
    { icon: Sparkles, title: "AI analizza", desc: "Rileva intonaco, rivestimenti, cornici, piani, finestre in 10 secondi" },
    { icon: Settings, title: "Configura intervento", desc: "Scegli tinteggiatura, cappotto, rivestimento pietra o laterizio" },
    { icon: Image, title: "Genera il render", desc: "Visualizzazione fotorealistica della facciata rinnovata in 30-60 secondi" },
  ];

  const interventions = [
    { emoji: "🎨", label: "Tinteggiatura", desc: "22 colori + 9 finiture" },
    { emoji: "🏠", label: "Cappotto termico", desc: "4-16 cm + 3 sistemi" },
    { emoji: "🪨", label: "Pietra naturale", desc: "8 tipi di pietra" },
    { emoji: "🧱", label: "Laterizio / Clinker", desc: "6 tipi di mattone" },
    { emoji: "🔲", label: "Misto", desc: "Combinazioni libere" },
    { emoji: "✨", label: "Rifacimento totale", desc: "Da zero, perfetto" },
  ];

  return (
    <div className="space-y-8">
      {/* ── Hero ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border p-8 md:p-12">
        <div className="max-w-2xl">
          <Badge variant="secondary" className="mb-4">
            <Home className="h-3 w-3 mr-1" /> Render Facciata
          </Badge>
          <h1 className="text-3xl font-bold text-foreground mb-3">Render Facciata AI</h1>
          <p className="text-muted-foreground text-lg mb-6">
            Tinteggiatura · Cappotto · Pietra · Laterizio
          </p>
          <Button asChild size="lg">
            <Link to="/app/render-facciata/new">
              <Plus className="h-4 w-4 mr-2" /> Nuovo Render Facciata
            </Link>
          </Button>
        </div>

        {credits && (
          <div className="absolute top-6 right-6 bg-background/80 backdrop-blur rounded-xl border px-4 py-3 text-right">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Coins className="h-4 w-4" /> Crediti Render
            </div>
            <p className="text-2xl font-bold text-foreground">{credits.balance}</p>
            <p className="text-xs text-muted-foreground">{credits.total_used} utilizzati</p>
          </div>
        )}
      </div>

      {/* ── Tab switcher ── */}
      <div className="flex rounded-xl overflow-hidden border">
        {(["come_funziona", "galleria"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
              activeTab === tab
                ? "bg-primary text-primary-foreground"
                : "bg-background text-muted-foreground hover:bg-muted/50"
            }`}
          >
            {tab === "come_funziona" ? "Come funziona" : `Galleria (${galleryItems.length})`}
          </button>
        ))}
      </div>

      {/* ── Come funziona ── */}
      {activeTab === "come_funziona" && (
        <div className="space-y-6">
          {steps.map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">{i + 1}. {s.title}</p>
                  <p className="text-sm text-muted-foreground">{s.desc}</p>
                </div>
              </div>
            );
          })}

          {/* Interventi supportati */}
          <Card>
            <CardContent className="pt-6 space-y-3">
              <p className="text-sm font-semibold text-foreground">Interventi supportati</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {interventions.map((t) => (
                  <div key={t.label} className="flex items-center gap-2 text-sm p-2 rounded-lg bg-muted/50">
                    <span>{t.emoji}</span>
                    <span className="font-medium text-foreground">{t.label}</span>
                    <span className="text-muted-foreground text-xs">— {t.desc}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Galleria ── */}
      {activeTab === "galleria" && (
        <div className="space-y-4">
          {galleryLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="aspect-square rounded-xl" />
              ))}
            </div>
          ) : galleryItems.length === 0 ? (
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
          ) : (
            <VirtualGalleryGrid
              items={galleryItems}
              gridClassName="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4"
              rowHeight={300}
              renderItem={(item) => (
                <div key={item.id} className="group relative rounded-xl overflow-hidden border bg-card">
                  <img src={item.render_url} alt={item.title || "Render facciata"} loading="lazy" decoding="async" className="w-full aspect-square object-cover" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-end">
                    <div className="w-full p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-white text-sm font-medium truncate">
                        {item.title || new Date(item.created_at).toLocaleDateString("it-IT")}
                      </p>
                      <div className="flex gap-2 mt-2">
                        <a href={item.render_url} download target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg bg-white/20 hover:bg-white/40 transition-colors">
                          <Download className="h-4 w-4 text-white" />
                        </a>
                        <button onClick={() => deleteGalleryItem(item.id)} className="p-1.5 rounded-lg bg-white/20 hover:bg-destructive/80 transition-colors">
                          <Trash2 className="h-4 w-4 text-white" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            />
          )}
        </div>
      )}
    </div>
  );
}
