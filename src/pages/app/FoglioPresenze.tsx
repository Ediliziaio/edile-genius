import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyId } from "@/hooks/useCompanyId";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Download, Calendar, Users, Clock } from "lucide-react";

const MESI = ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno", "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"];

export default function FoglioPresenze() {
  const companyId = useCompanyId();
  const now = new Date();
  const [mese, setMese] = useState(now.getMonth() + 1);
  const [anno, setAnno] = useState(now.getFullYear());
  const [cantiereId, setCantiereId] = useState("tutti");
  const [downloading, setDownloading] = useState(false);

  const { data: cantieri } = useQuery({
    queryKey: ["cantieri-presenze", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data } = await (supabase.from("cantieri") as any)
        .select("id, nome").eq("company_id", companyId);
      return data || [];
    },
  });

  const { data: presenze, isLoading } = useQuery({
    queryKey: ["presenze", companyId, mese, anno, cantiereId],
    enabled: !!companyId,
    queryFn: async () => {
      let query = (supabase.from("presenze_mensili") as any)
        .select("*, cantiere_operai(nome, cognome, ruolo), cantieri(nome)")
        .eq("company_id", companyId)
        .eq("mese", mese)
        .eq("anno", anno);
      if (cantiereId !== "tutti") query = query.eq("cantiere_id", cantiereId);
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  const daysInMonth = new Date(anno, mese, 0).getDate();
  const totalOre = (presenze || []).reduce((s: number, p: any) => s + (p.ore_totali || 0), 0);

  const downloadCSV = async () => {
    setDownloading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Non autenticato");

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-foglio-presenze`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            company_id: companyId,
            mese,
            anno,
            cantiere_id: cantiereId !== "tutti" ? cantiereId : undefined,
          }),
        }
      );

      if (!res.ok) throw new Error("Errore download");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `presenze_${MESI[mese - 1]}_${anno}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("CSV scaricato!");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Foglio Presenze</h1>
          <p className="text-sm text-muted-foreground">Ore lavorate estratte dai report giornalieri</p>
        </div>
        <Button onClick={downloadCSV} disabled={downloading} className="gap-2">
          <Download className="h-4 w-4" /> {downloading ? "Download..." : "Scarica CSV"}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <Select value={String(mese)} onValueChange={v => setMese(Number(v))}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            {MESI.map((m, i) => <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={String(anno)} onValueChange={v => setAnno(Number(v))}>
          <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
          <SelectContent>
            {[2024, 2025, 2026].map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={cantiereId} onValueChange={setCantiereId}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Tutti i cantieri" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="tutti">Tutti i cantieri</SelectItem>
            {(cantieri || []).map((c: any) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="p-4 flex items-center gap-3">
          <Users className="h-8 w-8 text-primary" />
          <div><p className="text-2xl font-bold">{(presenze || []).length}</p><p className="text-xs text-muted-foreground">Operai</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <Clock className="h-8 w-8 text-primary" />
          <div><p className="text-2xl font-bold">{totalOre.toFixed(1)}</p><p className="text-xs text-muted-foreground">Ore Totali</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <Calendar className="h-8 w-8 text-primary" />
          <div><p className="text-2xl font-bold">{MESI[mese - 1]} {anno}</p><p className="text-xs text-muted-foreground">{daysInMonth} giorni</p></div>
        </CardContent></Card>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Caricamento...</div>
          ) : (presenze || []).length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">Nessuna presenza registrata per questo periodo</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="p-2 text-left font-medium sticky left-0 bg-muted/50 min-w-[150px]">Operaio</th>
                  <th className="p-2 text-left font-medium min-w-[100px]">Cantiere</th>
                  {Array.from({ length: daysInMonth }, (_, i) => (
                    <th key={i} className="p-1 text-center font-medium w-8 text-xs">{i + 1}</th>
                  ))}
                  <th className="p-2 text-right font-medium min-w-[60px]">Tot</th>
                </tr>
              </thead>
              <tbody>
                {(presenze || []).map((p: any) => {
                  const ore = p.ore_giornaliere || {};
                  return (
                    <tr key={p.id} className="border-b hover:bg-muted/30">
                      <td className="p-2 font-medium sticky left-0 bg-background">{p.cantiere_operai?.nome} {p.cantiere_operai?.cognome || ""}</td>
                      <td className="p-2 text-muted-foreground">{p.cantieri?.nome || "—"}</td>
                      {Array.from({ length: daysInMonth }, (_, i) => {
                        const val = ore[String(i + 1)];
                        return (
                          <td key={i} className={`p-1 text-center text-xs ${val ? "font-medium" : "text-muted-foreground/30"}`}>
                            {val || "·"}
                          </td>
                        );
                      })}
                      <td className="p-2 text-right font-bold">{p.ore_totali || 0}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
