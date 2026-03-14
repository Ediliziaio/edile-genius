import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyId } from "@/hooks/useCompanyId";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Download, Trash2, Image as ImageIcon, ChevronLeft, Share2 } from "lucide-react";
import { ShareModal, type ShareableItem } from "@/components/share/ShareModal";
import { VirtualGalleryGrid } from "@/components/ui/VirtualGalleryGrid";

export default function RenderGallery() {
  const companyId = useCompanyId();
  const isAdmin = useIsAdmin();
  const { user } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showShareModal, setShowShareModal] = useState(false);

  const fetchGallery = async () => {
    if (!companyId) return;
    setLoading(true);
    let q = supabase.from("render_gallery").select("*").eq("company_id", companyId);
    if (!isAdmin && user?.id) q = q.eq("created_by", user.id);
    const { data } = await q.order("created_at", { ascending: false });
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

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const shareableItems: ShareableItem[] = items
    .filter(i => selectedIds.has(i.id))
    .map(i => ({
      table: "render_gallery",
      id: i.id,
      title: i.title,
      thumbnailUrl: i.render_url,
      modulo: "infissi",
    }));

  const handleOpenShare = () => {
    if (selecting && selectedIds.size > 0) {
      setShowShareModal(true);
    } else {
      // Select all and open
      setSelectedIds(new Set(filtered.map(i => i.id)));
      setShowShareModal(true);
    }
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
        <div className="flex items-center gap-2">
          {selecting && selectedIds.size > 0 && (
            <Button variant="outline" size="sm" onClick={handleOpenShare} className="gap-1.5">
              <Share2 className="h-4 w-4" /> Condividi ({selectedIds.size})
            </Button>
          )}
          <Button
            variant={selecting ? "secondary" : "outline"}
            size="sm"
            onClick={() => { setSelecting(!selecting); setSelectedIds(new Set()); }}
          >
            {selecting ? "Annulla selezione" : "Seleziona"}
          </Button>
          {!selecting && items.length > 0 && (
            <Button variant="outline" size="sm" onClick={handleOpenShare} className="gap-1.5">
              <Share2 className="h-4 w-4" /> Condividi
            </Button>
          )}
          <Button asChild>
            <Link to="/app/render/new"><Plus className="h-4 w-4 mr-2" /> Nuovo</Link>
          </Button>
        </div>
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

      <VirtualGalleryGrid
        items={filtered}
        gridClassName="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        rowHeight={320}
        threshold={18}
        renderItem={(item) => (
          <Card key={item.id} className={`overflow-hidden group ${selecting && selectedIds.has(item.id) ? 'ring-2 ring-primary' : ''}`}>
            <div className="relative">
              {selecting && (
                <div className="absolute top-2 left-2 z-10">
                  <Checkbox
                    checked={selectedIds.has(item.id)}
                    onCheckedChange={() => toggleSelect(item.id)}
                  />
                </div>
              )}
              <Link to={selecting ? '#' : `/app/render/gallery/${item.id}`} onClick={e => { if (selecting) { e.preventDefault(); toggleSelect(item.id); } }}>
                <div className="aspect-video relative overflow-hidden">
                  <img src={item.render_url} alt={item.title || "Render"} loading="lazy" decoding="async" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                </div>
              </Link>
            </div>
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
        )}
      />

      {showShareModal && companyId && (
        <ShareModal
          companyId={companyId}
          items={shareableItems.length > 0 ? shareableItems : items.map(i => ({
            table: "render_gallery",
            id: i.id,
            title: i.title,
            thumbnailUrl: i.render_url,
            modulo: "infissi",
          }))}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </div>
  );
}
