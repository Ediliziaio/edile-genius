import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import BeforeAfterSlider from "@/components/render/BeforeAfterSlider";
import { ChevronLeft, Download, Trash2, Bath } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const LABEL_MAP: Record<string, string> = {
  tipo_intervento: "Tipo intervento",
  tipo_intervento_label: "Intervento",
  piastrelle_parete: "Piastrelle parete",
  pavimento: "Pavimento",
  doccia: "Doccia",
  vasca: "Vasca",
  mobile_bagno: "Mobile bagno",
  sanitari: "Sanitari",
  rubinetteria: "Rubinetteria",
  parete_colore: "Colore pareti",
  illuminazione: "Illuminazione",
};

function formatValue(val: unknown): string {
  if (val === null || val === undefined) return "—";
  if (typeof val === "boolean") return val ? "Sì" : "No";
  if (typeof val === "object") return JSON.stringify(val);
  return String(val);
}

export default function RenderBagnoGalleryDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data, error } = await (supabase.from("render_bagno_gallery") as any)
        .select("*")
        .eq("id", id)
        .single();
      if (error || !data) {
        toast({ title: "Render non trovato", variant: "destructive" });
        navigate("/app/render-bagno");
        return;
      }
      setItem(data);
      setLoading(false);
    })();
  }, [id, navigate, toast]);

  const handleDelete = async () => {
    if (!item) return;
    const { error } = await (supabase.from("render_bagno_gallery") as any).delete().eq("id", item.id);
    if (error) {
      toast({ title: "Errore eliminazione", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Render eliminato" });
      navigate("/app/render-bagno");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!item) return null;

  // Build config display from sostituzione + tipo_intervento
  const configEntries: [string, unknown][] = [];
  if (item.tipo_intervento) configEntries.push(["tipo_intervento", item.tipo_intervento]);
  if (item.sostituzione && typeof item.sostituzione === "object") {
    Object.entries(item.sostituzione as Record<string, boolean>)
      .filter(([, v]) => v === true)
      .forEach(([k]) => configEntries.push([k, true]));
  }

  return (
    <div className="space-y-5 max-w-xl mx-auto pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => navigate("/app/render-bagno")}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2">
          <Bath className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-bold text-foreground">
            {item.titolo || "Render Bagno"}
          </h1>
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" asChild>
            <a href={item.render_url} download target="_blank" rel="noopener noreferrer">
              <Download className="h-4 w-4" />
            </a>
          </Button>
          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={handleDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Before/After slider */}
      {item.originale_url ? (
        <BeforeAfterSlider
          beforeSrc={item.originale_url}
          afterSrc={item.render_url}
          className="aspect-[4/3] rounded-xl"
        />
      ) : (
        <div className="aspect-[4/3] rounded-xl overflow-hidden">
          <img src={item.render_url} alt={item.titolo || "Render Bagno"} className="w-full h-full object-cover" />
        </div>
      )}

      {/* Config summary */}
      {configEntries.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Configurazione</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {configEntries.map(([key, val]) => (
                <div key={key}>
                  <p className="text-xs text-muted-foreground">{LABEL_MAP[key] || key}</p>
                  <p className="text-sm font-medium text-foreground">{formatValue(val)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Date */}
      <p className="text-xs text-muted-foreground text-center">
        Creato il {new Date(item.created_at).toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" })}
      </p>

      {/* Actions */}
      <div className="flex gap-3">
        <Button variant="outline" className="flex-1" onClick={() => navigate("/app/render-bagno/new")}>
          Nuovo Render
        </Button>
        <Button className="flex-1" asChild>
          <a href={item.render_url} download target="_blank" rel="noopener noreferrer">
            <Download className="h-4 w-4 mr-2" /> Scarica
          </a>
        </Button>
      </div>
    </div>
  );
}
