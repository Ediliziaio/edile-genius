import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Download, Heart, HeartOff, Info, Image as ImageIcon, Grid3X3 } from "lucide-react";
import { VirtualGalleryGrid } from "@/components/ui/VirtualGalleryGrid";
import { useToast } from "@/hooks/use-toast";

interface GalleryItem {
  id: string;
  created_at: string;
  result_image_url: string;
  tipo_operazione: string;
  tipo_pavimento: string;
  sottotipo: string | null;
  finitura: string;
  pattern_posa: string;
  colore_mode: string;
  colore_name: string | null;
  colore_hex: string | null;
  wood_name: string | null;
  is_favorite: boolean;
}

const TIPO_PAVIMENTO_EMOJI: Record<string, string> = {
  parquet: "🪵", laminato: "📋", ceramica: "⬜",
  gres_porcellanato: "🔲", marmo: "🤍", pietra_naturale: "🪨",
  vinile_lvt: "💧", cotto: "🏺", cemento_resina: "⬛", moquette: "🟫",
};

const COME_FUNZIONA = [
  { n: 1, emoji: "📸", title: "Fotografa la stanza", desc: "Carica una foto dell'ambiente con il pavimento attuale." },
  { n: 2, emoji: "🤖", title: "Analisi AI istantanea", desc: "Gemini rileva tipo di pavimento, pattern e dimensioni." },
  { n: 3, emoji: "⚙️", title: "Configura il nuovo pavimento", desc: "10 materiali, 11 pattern, 8 finiture, centinaia di colori." },
  { n: 4, emoji: "✨", title: "Render in 20 secondi", desc: "AI sostituisce solo il pavimento. Mobili e pareti intatti." },
];

const MATERIALI_DISPLAY = [
  { emoji: "🪵", label: "Parquet", desc: "Massello, prefinito" },
  { emoji: "📋", label: "Laminato", desc: "AC3–AC5" },
  { emoji: "🔲", label: "Gres", desc: "Rettificato, lastra" },
  { emoji: "⬜", label: "Ceramica", desc: "Smaltata, versatile" },
  { emoji: "🤍", label: "Marmo", desc: "Venature uniche" },
  { emoji: "🪨", label: "Pietra", desc: "Ardesia, travertino" },
  { emoji: "💧", label: "Vinile LVT", desc: "Impermeabile" },
  { emoji: "🏺", label: "Cotto", desc: "Artigianale" },
  { emoji: "⬛", label: "Microcemento", desc: "Seamless" },
  { emoji: "🟫", label: "Moquette", desc: "Tessile" },
];

export default function RenderPavimentoHub() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"info" | "galleria">("info");

  const { data: gallery, refetch } = useQuery({
    queryKey: ["pavimento-gallery"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data, error } = await (supabase.from("render_pavimento_gallery") as any)
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as GalleryItem[];
    },
  });

  const { data: renderCount } = useQuery({
    queryKey: ["pavimento-credits"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 0;
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      const { count } = await (supabase.from("render_pavimento_sessions") as any)
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "completed")
        .gte("created_at", startOfMonth.toISOString());
      return count ?? 0;
    },
  });

  const toggleFavorite = async (item: GalleryItem) => {
    try {
      await (supabase.from("render_pavimento_gallery") as any)
        .update({ is_favorite: !item.is_favorite })
        .eq("id", item.id);
      refetch();
    } catch (err) {
      toast({ title: "Errore", description: String(err), variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-12">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center">
              <span className="text-2xl">🏠</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Render Pavimento</h1>
              <p className="text-sm text-muted-foreground">Simula qualsiasi pavimento in ogni ambiente</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {renderCount !== undefined && renderCount !== null && (
              <Badge variant="secondary" className="text-xs">
                <Grid3X3 className="w-3 h-3 mr-1" /> {renderCount} questo mese
              </Badge>
            )}
          </div>
        </div>

        <Button onClick={() => navigate("/app/render-pavimento/new")} className="w-full h-12 text-base font-semibold bg-amber-600 hover:bg-amber-700">
          <Plus className="w-5 h-5 mr-2" /> Nuovo render
        </Button>

        {/* Tabs */}
        <div className="flex rounded-xl overflow-hidden border border-border">
          <button onClick={() => setActiveTab("info")}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors flex items-center justify-center gap-1.5 ${activeTab === "info" ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:bg-muted/50"}`}>
            <Info className="w-4 h-4" /> Come funziona
          </button>
          <button onClick={() => setActiveTab("galleria")}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors flex items-center justify-center gap-1.5 ${activeTab === "galleria" ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:bg-muted/50"}`}>
            <ImageIcon className="w-4 h-4" /> Galleria
            {gallery && gallery.length > 0 && <Badge variant="secondary" className="text-[10px] ml-1">{gallery.length}</Badge>}
          </button>
        </div>
      </div>

      {/* ── TAB INFO ── */}
      {activeTab === "info" && (
        <div className="space-y-6">
          <div className="space-y-3">
            {COME_FUNZIONA.map((s) => (
              <Card key={s.n}><CardContent className="flex gap-4 items-start p-4">
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
                  <span className="text-xl">{s.emoji}</span>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-[10px]">{s.n}</Badge>
                    <p className="text-sm font-semibold text-foreground">{s.title}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">{s.desc}</p>
                </div>
              </CardContent></Card>
            ))}
          </div>

          <div className="space-y-3">
            <p className="text-sm font-semibold text-foreground">10 materiali disponibili</p>
            <div className="grid grid-cols-2 gap-2">
              {MATERIALI_DISPLAY.map((m) => (
                <Card key={m.label}><CardContent className="p-3 text-center">
                  <p className="text-xl mb-1">{m.emoji}</p>
                  <p className="text-xs font-semibold text-foreground">{m.label}</p>
                  <p className="text-[10px] text-muted-foreground">{m.desc}</p>
                </CardContent></Card>
              ))}
            </div>
          </div>

          <Card className="bg-amber-50 border-amber-200">
            <CardContent className="p-6 text-center space-y-3">
              <p className="text-lg font-bold text-amber-900">Visualizza il tuo nuovo pavimento oggi</p>
              <p className="text-sm text-amber-700">Da parquet in spina di pesce a gres 120×120 — qualsiasi stanza</p>
              <Button onClick={() => navigate("/app/render-pavimento/new")} className="bg-amber-600 hover:bg-amber-700">
                Inizia ora
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── TAB GALLERIA ── */}
      {activeTab === "galleria" && (
        <div>
          {!gallery || gallery.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto">
                <ImageIcon className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground">Nessun render ancora</p>
              <p className="text-xs text-muted-foreground">I tuoi render salvati appariranno qui</p>
              <Button onClick={() => navigate("/app/render-pavimento/new")} className="bg-amber-600 hover:bg-amber-700">
                Crea il primo render
              </Button>
            </div>
          ) : (
            <VirtualGalleryGrid
              items={gallery}
              gridClassName="grid grid-cols-2 md:grid-cols-3 gap-3"
              rowHeight={340}
              renderItem={(item) => (
                <div key={item.id} className="relative group rounded-xl overflow-hidden border border-border bg-card">
                  <img src={item.result_image_url} alt="render" loading="lazy" decoding="async" className="w-full aspect-[4/3] object-cover" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <a href={item.result_image_url} download className="w-9 h-9 bg-white/90 rounded-full flex items-center justify-center hover:bg-white">
                      <Download className="w-4 h-4 text-foreground" />
                    </a>
                    <button onClick={() => toggleFavorite(item)} className="w-9 h-9 bg-white/90 rounded-full flex items-center justify-center hover:bg-white">
                      {item.is_favorite ? <Heart className="w-4 h-4 text-red-500 fill-red-500" /> : <HeartOff className="w-4 h-4 text-muted-foreground" />}
                    </button>
                  </div>
                  <div className="p-2.5 space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <span>{TIPO_PAVIMENTO_EMOJI[item.tipo_pavimento] ?? "🏠"}</span>
                      <span className="text-xs font-semibold text-foreground capitalize">{item.tipo_pavimento?.replace(/_/g, " ")}</span>
                      {item.is_favorite && <Heart className="w-3 h-3 text-red-500 fill-red-500 ml-auto" />}
                    </div>
                    {item.colore_name && (
                      <div className="flex items-center gap-1.5">
                        {item.colore_hex && <div className="w-3 h-3 rounded-full border border-border" style={{ backgroundColor: item.colore_hex }} />}
                        <span className="text-[10px] text-muted-foreground truncate">{item.colore_mode === "legno" ? `🪵 ${item.wood_name}` : item.colore_name}</span>
                      </div>
                    )}
                    {item.pattern_posa && <Badge variant="secondary" className="text-[9px]">{item.pattern_posa.replace(/_/g, " ")}</Badge>}
                    <p className="text-[10px] text-muted-foreground">{new Date(item.created_at).toLocaleDateString("it-IT", { day: "2-digit", month: "short" })}</p>
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
