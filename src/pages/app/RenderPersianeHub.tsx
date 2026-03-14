import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyId } from "@/hooks/useCompanyId";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Plus, Image, Zap, Layers, Palette, Download, Trash2,
} from "lucide-react";

export default function RenderPersianeHub() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const companyId = useCompanyId();
  const [activeTab, setActiveTab] = useState<"come_funziona" | "galleria">("come_funziona");

  const { data: gallery = [], isLoading: galleryLoading } = useQuery({
    queryKey: ["render-persiane-gallery", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await (supabase.from("render_persiane_gallery") as any)
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(24);
      return data || [];
    },
    enabled: !!user && activeTab === "galleria",
    staleTime: 30_000,
  });

  const steps = [
    { icon: <Image className="w-5 h-5" />, title: "Carica la foto", desc: "Foto della facciata o finestra — JPG, PNG, WEBP fino a 15MB" },
    { icon: <Zap className="w-5 h-5" />, title: "AI analizza", desc: "Rileva tipo persiane, materiale, colore e stato apertura" },
    { icon: <Layers className="w-5 h-5" />, title: "Configura", desc: "Scegli tipo operazione, nuovo stile, colore e apertura" },
    { icon: <Palette className="w-5 h-5" />, title: "Genera render", desc: "Visualizzazione fotorealistica in 15-30 secondi" },
  ];

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
            <span className="text-2xl">🪟</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Render Persiane</h1>
            <p className="text-sm text-muted-foreground">Veneziane · Scuri · Avvolgibili · Frangisole</p>
          </div>
        </div>
        <Badge variant="secondary" className="text-xs">Nuovo</Badge>
      </div>

      <Button onClick={() => navigate("/app/render-persiane/new")} className="w-full h-12 text-base font-semibold">
        <Plus className="w-5 h-5 mr-2" />
        Nuovo Render Persiane
      </Button>

      {/* Tabs */}
      <div className="flex rounded-xl overflow-hidden border border-border">
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
            {tab === "come_funziona" ? "Come funziona" : `Galleria (${gallery.length})`}
          </button>
        ))}
      </div>

      {/* Come funziona */}
      {activeTab === "come_funziona" && (
        <div className="space-y-4">
          {steps.map((s, i) => (
            <div key={i} className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                {s.icon}
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{i + 1}. {s.title}</p>
                <p className="text-xs text-muted-foreground">{s.desc}</p>
              </div>
            </div>
          ))}

          <div className="rounded-xl border border-border p-4 space-y-2">
            <p className="text-sm font-semibold text-foreground">Operazioni supportate</p>
            <div className="space-y-1.5">
              {[
                { emoji: "🔄", label: "Sostituisci tipo", desc: "Cambia tipo di persiana" },
                { emoji: "🎨", label: "Cambia colore", desc: "Stesso tipo, colore diverso" },
                { emoji: "➕", label: "Aggiungi persiane", desc: "Dove non ce ne sono" },
                { emoji: "🗑️", label: "Rimuovi persiane", desc: "Mostra facciata pulita" },
              ].map((t) => (
                <div key={t.label} className="flex items-center gap-2 text-xs">
                  <span>{t.emoji}</span>
                  <span className="font-medium text-foreground">{t.label}</span>
                  <span className="text-muted-foreground">— {t.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Galleria */}
      {activeTab === "galleria" && (
        <div>
          {galleryLoading ? (
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="aspect-[4/3] rounded-xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : gallery.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <Image className="w-12 h-12 text-muted-foreground mx-auto" />
              <p className="text-sm text-muted-foreground">Nessun render ancora. Crea il tuo primo!</p>
              <Button onClick={() => navigate("/app/render-persiane/new")}>Inizia ora</Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {gallery.map((item: any) => (
                <div key={item.id} className="relative group rounded-xl overflow-hidden border border-border">
                  <img src={item.result_image_url} alt="render" loading="lazy" decoding="async" className="w-full aspect-[4/3] object-cover" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <a href={item.result_image_url} download className="w-9 h-9 rounded-full bg-white/90 flex items-center justify-center hover:bg-white">
                      <Download className="w-4 h-4 text-foreground" />
                    </a>
                  </div>
                  <div className="p-2">
                    <Badge variant="secondary" className="text-[10px]">{item.tipo_operazione?.replace(/_/g, " ")}</Badge>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {new Date(item.created_at).toLocaleDateString("it-IT")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
