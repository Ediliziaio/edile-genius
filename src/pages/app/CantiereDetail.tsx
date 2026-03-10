import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { HardHat, MapPin, Calendar, UserPlus, Send, FileText, AlertTriangle, Image } from "lucide-react";
import { toast } from "sonner";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import ReportDetailModal from "@/components/cantieri/ReportDetailModal";

export default function CantiereDetail() {
  const { id } = useParams<{ id: string }>();
  const [cantiere, setCantiere] = useState<any>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [operai, setOperai] = useState<any[]>([]);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [addOperaioOpen, setAddOperaioOpen] = useState(false);
  const [operaioForm, setOperaioForm] = useState({ nome: "", cognome: "", ruolo: "", telefono: "", telegram_username: "", telegram_user_id: "" });
  const [dateFilter, setDateFilter] = useState("all");

  useEffect(() => {
    if (!id) return;
    fetchCantiere();
    fetchReports();
    fetchOperai();
  }, [id]);

  const fetchCantiere = async () => {
    const { data } = await (supabase.from("cantieri") as any).select("*").eq("id", id!).single();
    setCantiere(data);
  };

  const fetchReports = async () => {
    let query = supabase.from("agent_reports").select("*").eq("cantiere_id" as any, id!).order("date", { ascending: false });
    if (dateFilter === "today") {
      query = query.eq("date", new Date().toISOString().split("T")[0]);
    } else if (dateFilter === "week") {
      const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
      query = query.gte("date", weekAgo.toISOString().split("T")[0]);
    } else if (dateFilter === "month") {
      const monthAgo = new Date(); monthAgo.setMonth(monthAgo.getMonth() - 1);
      query = query.gte("date", monthAgo.toISOString().split("T")[0]);
    }
    const { data } = await query;
    setReports(data || []);
  };

  useEffect(() => { if (id) fetchReports(); }, [dateFilter]);

  const fetchOperai = async () => {
    const { data } = await supabase.from("cantiere_operai").select("*").eq("cantiere_id", id!).order("created_at", { ascending: false });
    setOperai(data || []);
  };

  const handleAddOperaio = async () => {
    if (!cantiere || !operaioForm.nome.trim()) return;
    const { error } = await supabase.from("cantiere_operai").insert({
      company_id: cantiere.company_id,
      cantiere_id: id,
      nome: operaioForm.nome,
      cognome: operaioForm.cognome || null,
      ruolo: operaioForm.ruolo || null,
      telefono: operaioForm.telefono || null,
      telegram_username: operaioForm.telegram_username || null,
      telegram_user_id: operaioForm.telegram_user_id || null,
    } as any);
    if (error) { toast.error("Errore"); return; }
    toast.success("Operaio aggiunto!");
    setAddOperaioOpen(false);
    setOperaioForm({ nome: "", cognome: "", ruolo: "", telefono: "", telegram_username: "", telegram_user_id: "" });
    fetchOperai();
  };

  if (!cantiere) return <div className="text-center py-12 text-muted-foreground">Caricamento...</div>;

  // Stats data
  const reportsByDay = reports.reduce((acc: any, r: any) => {
    acc[r.date] = (acc[r.date] || 0) + 1;
    return acc;
  }, {});
  const chartData = Object.entries(reportsByDay).map(([date, count]) => ({ date, count })).reverse();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <HardHat className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">{cantiere.nome}</h1>
            <Badge variant={cantiere.stato === "attivo" ? "default" : "secondary"}>{cantiere.stato}</Badge>
          </div>
          {cantiere.indirizzo && <p className="text-sm text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" /> {cantiere.indirizzo}</p>}
          <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
            {cantiere.data_inizio && <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Inizio: {cantiere.data_inizio}</span>}
            {cantiere.data_fine_prevista && <span>Fine: {cantiere.data_fine_prevista}</span>}
            {cantiere.committente && <span>Committente: {cantiere.committente}</span>}
          </div>
        </div>
      </div>

      <Tabs defaultValue="report">
        <TabsList>
          <TabsTrigger value="report">📋 Report ({reports.length})</TabsTrigger>
          <TabsTrigger value="operai">👷 Operai ({operai.length})</TabsTrigger>
          <TabsTrigger value="statistiche">📊 Statistiche</TabsTrigger>
        </TabsList>

        {/* REPORT TAB */}
        <TabsContent value="report" className="space-y-4">
          <div className="flex gap-2">
            {["all", "today", "week", "month"].map(f => (
              <Button key={f} size="sm" variant={dateFilter === f ? "default" : "outline"} onClick={() => setDateFilter(f)}>
                {f === "all" ? "Tutti" : f === "today" ? "Oggi" : f === "week" ? "Settimana" : "Mese"}
              </Button>
            ))}
          </div>

          {reports.length === 0 ? (
            <Card className="p-8 text-center"><FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground" /><p className="text-muted-foreground">Nessun report</p></Card>
          ) : (
            <div className="space-y-3">
              {reports.map((r: any) => (
                <Card key={r.id} className="p-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedReport(r)}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-foreground">{r.date}</span>
                        <Badge variant="outline" className="text-xs">{(r as any).fonte || "telegram"}</Badge>
                        {(r as any).problemi?.length > 0 && <Badge variant="destructive" className="text-xs"><AlertTriangle className="h-3 w-3 mr-1" /> {(r as any).problemi.length} problemi</Badge>}
                        {(r as any).foto_urls?.length > 0 && <Badge variant="secondary" className="text-xs"><Image className="h-3 w-3 mr-1" /> {(r as any).foto_urls.length} foto</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">{r.report_summary || "Report senza sommario"}</p>
                    </div>
                    {(r as any).avanzamento_percentuale && (
                      <span className="text-lg font-bold text-primary">{(r as any).avanzamento_percentuale}%</span>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* OPERAI TAB */}
        <TabsContent value="operai" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={addOperaioOpen} onOpenChange={setAddOperaioOpen}>
              <DialogTrigger asChild><Button size="sm"><UserPlus className="h-4 w-4 mr-2" /> Aggiungi Operaio</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Aggiungi Operaio</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Nome *</Label><Input value={operaioForm.nome} onChange={e => setOperaioForm(f => ({ ...f, nome: e.target.value }))} /></div>
                    <div><Label>Cognome</Label><Input value={operaioForm.cognome} onChange={e => setOperaioForm(f => ({ ...f, cognome: e.target.value }))} /></div>
                  </div>
                  <div><Label>Ruolo</Label>
                    <Select value={operaioForm.ruolo} onValueChange={v => setOperaioForm(f => ({ ...f, ruolo: v }))}>
                      <SelectTrigger><SelectValue placeholder="Seleziona ruolo" /></SelectTrigger>
                      <SelectContent>
                        {["Capo cantiere", "Muratore", "Elettricista", "Idraulico", "Carpentiere", "Piastrellista", "Imbianchino", "Manovale", "Altro"].map(r => (
                          <SelectItem key={r} value={r.toLowerCase()}>{r}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Telefono</Label><Input value={operaioForm.telefono} onChange={e => setOperaioForm(f => ({ ...f, telefono: e.target.value }))} /></div>
                  <div><Label>Username Telegram</Label><Input value={operaioForm.telegram_username} onChange={e => setOperaioForm(f => ({ ...f, telegram_username: e.target.value }))} placeholder="@username" /></div>
                  <div><Label>Telegram User ID</Label><Input value={operaioForm.telegram_user_id} onChange={e => setOperaioForm(f => ({ ...f, telegram_user_id: e.target.value }))} placeholder="Numero ID Telegram" /></div>
                  <Button onClick={handleAddOperaio} disabled={!operaioForm.nome.trim()} className="w-full">Aggiungi</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {operai.length === 0 ? (
            <Card className="p-8 text-center"><p className="text-muted-foreground">Nessun operaio assegnato</p></Card>
          ) : (
            <div className="space-y-2">
              {operai.map((o: any) => (
                <Card key={o.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                      {o.nome?.[0]}{o.cognome?.[0] || ""}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{o.nome} {o.cognome || ""}</p>
                      <p className="text-xs text-muted-foreground">{o.ruolo || "—"} {o.telefono ? `· ${o.telefono}` : ""}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {o.telegram_user_id ? (
                      <Badge variant="default" className="text-xs">
                        <Send className="h-3 w-3 mr-1" /> Collegato
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs">Non collegato</Badge>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* STATISTICHE TAB */}
        <TabsContent value="statistiche" className="space-y-6">
          <Card className="p-5">
            <h3 className="font-semibold mb-4">Report per giorno</h3>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={chartData}>
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="count" stroke="hsl(var(--primary))" fill="hsl(var(--primary)/0.2)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : <p className="text-sm text-muted-foreground">Nessun dato</p>}
          </Card>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4 text-center">
              <p className="text-2xl font-bold text-foreground">{reports.length}</p>
              <p className="text-xs text-muted-foreground">Report totali</p>
            </Card>
            <Card className="p-4 text-center">
              <p className="text-2xl font-bold text-foreground">{operai.length}</p>
              <p className="text-xs text-muted-foreground">Operai</p>
            </Card>
            <Card className="p-4 text-center">
              <p className="text-2xl font-bold text-foreground">{reports.filter((r: any) => (r as any).problemi?.length > 0).length}</p>
              <p className="text-xs text-muted-foreground">Con problemi</p>
            </Card>
            <Card className="p-4 text-center">
              <p className="text-2xl font-bold text-foreground">{reports.filter((r: any) => (r as any).foto_urls?.length > 0).length}</p>
              <p className="text-xs text-muted-foreground">Con foto</p>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {selectedReport && (
        <ReportDetailModal report={selectedReport} open={!!selectedReport} onOpenChange={() => setSelectedReport(null)} />
      )}
    </div>
  );
}
