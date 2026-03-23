import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import BeforeAfterSlider from "@/components/render/BeforeAfterSlider";
import { ChevronLeft, Download, Share2, Trash2, Heart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function RenderGalleryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    supabase.from("render_gallery").select("*").eq("id", id).single()
      .then(({ data }) => { if (!cancelled && data) setItem(data); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  const toggleFavorite = async () => {
    if (!item) return;
    const { error } = await supabase.from("render_gallery").update({ is_favorite: !item.is_favorite }).eq("id", item.id);
    if (!error) setItem({ ...item, is_favorite: !item.is_favorite });
  };

  const handleDelete = async () => {
    if (!item) return;
    const { error } = await supabase.from("render_gallery").delete().eq("id", item.id);
    if (error) {
      toast({ variant: "destructive", title: "Errore eliminazione", description: error.message });
      return;
    }
    toast({ title: "Eliminato" });
    navigate("/app/render/gallery");
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-muted-foreground">Caricamento...</div>;
  if (!item) return <div className="p-8 text-center text-muted-foreground">Render non trovato.</div>;

  const configSummary = item.config_summary || {};

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/app/render/gallery"><ChevronLeft className="h-5 w-5" /></Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-foreground">{item.title || "Render"}</h1>
          <p className="text-sm text-muted-foreground">{new Date(item.created_at).toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" })}</p>
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" onClick={toggleFavorite}>
            <Heart className={`h-4 w-4 ${item.is_favorite ? "fill-destructive text-destructive" : ""}`} />
          </Button>
          <Button variant="ghost" size="icon" asChild>
            <a href={item.render_url} download target="_blank" rel="noopener">
              <Download className="h-4 w-4" />
            </a>
          </Button>
          <Button variant="ghost" size="icon" className="text-destructive" onClick={handleDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {item.original_url ? (
        <BeforeAfterSlider
          beforeSrc={item.original_url}
          afterSrc={item.render_url}
          className="aspect-[4/3] rounded-xl"
        />
      ) : (
        <div className="aspect-[4/3] rounded-xl overflow-hidden">
          <img src={item.render_url} alt={item.title || "Render"} className="w-full h-full object-cover" />
        </div>
      )}

      {Object.keys(configSummary).length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Configurazione</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(configSummary).filter(([k]) => k !== "fragments" && k !== "notes").map(([key, val]) => (
                <div key={key}>
                  <p className="text-xs text-muted-foreground capitalize">{key}</p>
                  <p className="text-sm font-medium text-foreground">{String(val)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {item.notes && (
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Note</p>
            <p className="text-sm text-foreground">{item.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
