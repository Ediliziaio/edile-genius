import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyId } from "@/hooks/useCompanyId";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Download, Trash2, Image as ImageIcon, ChevronLeft } from "lucide-react";

export default function RenderGallery() {
  const companyId = useCompanyId();
  const { toast } = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchGallery = async () => {
    if (!companyId) return;
    setLoading(true);
    const { data } = await supabase
      .from("render_gallery")
      .select("*")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false });
    if (data) setItems(data);
    setLoading(false);
  };

  useEffect(() => { fetchGallery(); }, [companyId]);

  const filtered = items.filter(i =>
    !search || (i.title || "").toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    await supabase.from("render_gallery").delete().eq("id", id);
    toast({ title: "Eliminato" });
    fetchGallery();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/app/render"><ChevronLeft className="h-5 w-5" /></Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Galleria Render</h1>
            <p className="text-sm text-muted-foreground">{items.length} render salvati</p>
          </div>
        </div>
        <Button asChild>
          <Link to="/app/render/new"><Plus className="h-4 w-4 mr-2" /> Nuovo</Link>
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Cerca render..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {filtered.length === 0 && !loading && (
        <Card className="border-dashed">
          <CardContent className="p-12 text-center">
            <ImageIcon className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="font-semibold text-foreground mb-1">Nessun render</h3>
            <p className="text-sm text-muted-foreground mb-4">Crea il tuo primo render AI</p>
            <Button asChild>
              <Link to="/app/render/new"><Plus className="h-4 w-4 mr-2" /> Crea Render</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((item) => (
          <Card key={item.id} className="overflow-hidden group">
            <Link to={`/app/render/gallery/${item.id}`}>
              <div className="aspect-video relative overflow-hidden">
                <img src={item.render_url} alt={item.title || "Render"} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
              </div>
            </Link>
            <CardContent className="p-3 flex items-center justify-between">
              <div className="min-w-0">
                <p className="font-medium text-sm text-foreground truncate">{item.title || "Render senza titolo"}</p>
                <p className="text-xs text-muted-foreground">{new Date(item.created_at).toLocaleDateString("it-IT")}</p>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                  <a href={item.render_url} download target="_blank" rel="noopener">
                    <Download className="h-3.5 w-3.5" />
                  </a>
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(item.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
