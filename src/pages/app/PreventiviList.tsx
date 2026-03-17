import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyId } from "@/hooks/useCompanyId";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, FileText, Mic, Euro, CheckCircle, XCircle, Send, Clock, TrendingUp } from "lucide-react";

const statoBadge: Record<string, { class: string; icon: React.ReactNode }> = {
  bozza: { class: "bg-yellow-100 text-yellow-800", icon: <Clock className="h-3 w-3" /> },
  inviato: { class: "bg-blue-100 text-blue-800", icon: <Send className="h-3 w-3" /> },
  accettato: { class: "bg-green-100 text-green-800", icon: <CheckCircle className="h-3 w-3" /> },
  rifiutato: { class: "bg-red-100 text-red-800", icon: <XCircle className="h-3 w-3" /> },
};

export default function PreventiviList() {
  const companyId = useCompanyId();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statoFilter, setStatoFilter] = useState("tutti");

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

  const filtered = (preventivi || []).filter((p: any) => {
    const matchSearch = !search ||
      p.numero_preventivo?.toLowerCase().includes(search.toLowerCase()) ||
      p.cliente_nome?.toLowerCase().includes(search.toLowerCase()) ||
      p.oggetto?.toLowerCase().includes(search.toLowerCase()) ||
      p.titolo?.toLowerCase().includes(search.toLowerCase());
    const matchStato = statoFilter === "tutti" || p.stato === statoFilter;
    return matchSearch && matchStato;
  });

  // KPI calculations
  const all = preventivi || [];
  const totaleBozze = all.filter((p: any) => p.stato === "bozza").length;
  const totaleInAttesa = all.filter((p: any) => p.stato === "inviato").length;
  const valoreAccettati = all.filter((p: any) => p.stato === "accettato").reduce((s: number, p: any) => s + (p.totale_finale || p.totale || 0), 0);
  const totaleValore = all.reduce((s: number, p: any) => s + (p.totale_finale || p.totale || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Preventivi</h1>
          <p className="text-sm text-muted-foreground">{all.length} preventivi totali</p>
        </div>
        <Button onClick={() => navigate("/app/preventivi/nuovo")} className="gap-2">
          <Plus className="h-4 w-4" /> Nuovo Preventivo
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{all.length}</p>
            <p className="text-xs text-muted-foreground">Totale</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-yellow-600">{totaleBozze}</p>
            <p className="text-xs text-muted-foreground">Bozze</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{totaleInAttesa}</p>
            <p className="text-xs text-muted-foreground">In attesa</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">€{valoreAccettati.toFixed(0)}</p>
            <p className="text-xs text-muted-foreground">Valore accettati</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Cerca per numero, cliente, oggetto..." className="pl-10" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Tabs value={statoFilter} onValueChange={setStatoFilter} className="w-auto">
          <TabsList>
            <TabsTrigger value="tutti">Tutti</TabsTrigger>
            <TabsTrigger value="bozza">Bozze</TabsTrigger>
            <TabsTrigger value="inviato">Inviati</TabsTrigger>
            <TabsTrigger value="accettato">Accettati</TabsTrigger>
            <TabsTrigger value="rifiutato">Rifiutati</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* List */}
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
          {filtered.map((p: any) => {
            const badge = statoBadge[p.stato] || statoBadge.bozza;
            return (
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
                          <Badge className={`${badge.class} gap-1`}>{badge.icon} {p.stato}</Badge>
                          {p.versione > 1 && <Badge variant="outline" className="text-[10px]">v{p.versione}</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {p.cliente_nome || "Cliente"} · {p.titolo || p.oggetto || "—"}
                        </p>
                        <div className="flex gap-2 text-xs text-muted-foreground mt-0.5">
                          {p.cantieri?.nome && <span>📍 {p.cantieri.nome}</span>}
                          {p.data_scadenza && <span>📅 Scade {new Date(p.data_scadenza).toLocaleDateString("it-IT")}</span>}
                          {(p.voci as any[])?.length > 0 && <span>{(p.voci as any[]).length} voci</span>}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-foreground flex items-center gap-1">
                        <Euro className="h-3.5 w-3.5" />{(p.totale_finale || p.totale || 0).toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString("it-IT")}</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
