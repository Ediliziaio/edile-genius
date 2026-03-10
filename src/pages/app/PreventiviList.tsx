import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyId } from "@/hooks/useCompanyId";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Search, FileText, Mic, Euro } from "lucide-react";

const statoBadge: Record<string, string> = {
  bozza: "bg-yellow-100 text-yellow-800",
  inviato: "bg-blue-100 text-blue-800",
  accettato: "bg-green-100 text-green-800",
  rifiutato: "bg-red-100 text-red-800",
};

export default function PreventiviList() {
  const companyId = useCompanyId();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const { data: preventivi, isLoading } = useQuery({
    queryKey: ["preventivi", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data, error } = await (supabase.from("preventivi") as any)
        .select("*, cantieri(nome)")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const filtered = (preventivi || []).filter((p: any) =>
    !search || 
    p.numero_preventivo?.toLowerCase().includes(search.toLowerCase()) ||
    p.cliente_nome?.toLowerCase().includes(search.toLowerCase()) ||
    p.oggetto?.toLowerCase().includes(search.toLowerCase())
  );

  const totale = filtered.reduce((s: number, p: any) => s + (p.totale || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Preventivi</h1>
          <p className="text-sm text-muted-foreground">{filtered.length} preventivi · €{totale.toFixed(2)} totale</p>
        </div>
        <Button onClick={() => navigate("/app/preventivi/nuovo")} className="gap-2">
          <Plus className="h-4 w-4" /> Nuovo Preventivo
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Cerca per numero, cliente, oggetto..." className="pl-10" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Caricamento...</div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
            <p className="text-muted-foreground">Nessun preventivo trovato</p>
            <Button variant="outline" className="mt-4 gap-2" onClick={() => navigate("/app/preventivi/nuovo")}>
              <Mic className="h-4 w-4" /> Crea da Audio
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((p: any) => (
            <Link key={p.id} to={`/app/preventivi/${p.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{p.numero_preventivo}</span>
                        <Badge className={statoBadge[p.stato] || ""}>{p.stato}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{p.cliente_nome || "Cliente"} · {p.oggetto || "—"}</p>
                      {p.cantieri?.nome && <p className="text-xs text-muted-foreground">📍 {p.cantieri.nome}</p>}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-foreground flex items-center gap-1"><Euro className="h-3.5 w-3.5" />{(p.totale || 0).toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString("it-IT")}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
