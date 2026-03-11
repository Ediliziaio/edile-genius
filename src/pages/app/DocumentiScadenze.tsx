import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyId } from "@/hooks/useCompanyId";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Plus, FileWarning, Shield, Upload, Trash2, AlertTriangle, CheckCircle } from "lucide-react";
import { differenceInDays, startOfDay } from "date-fns";

const TIPI_DOC = ["DURC", "Patentino", "Certificato Sicurezza", "Visura Camerale", "Polizza RC", "Patente", "Attestato Formazione", "Altro"];

const statoBadge: Record<string, { class: string; icon: any }> = {
  valido: { class: "bg-green-100 text-green-800", icon: CheckCircle },
  in_scadenza: { class: "bg-yellow-100 text-yellow-800", icon: AlertTriangle },
  scaduto: { class: "bg-red-100 text-red-800", icon: FileWarning },
};

export default function DocumentiScadenze() {
  const companyId = useCompanyId();
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [tab, setTab] = useState("tutti");
  const [formData, setFormData] = useState({
    tipo: "", nome: "", numero_documento: "", data_emissione: "", data_scadenza: "", operaio_id: "", note: "",
  });

  const { data: documenti, isLoading } = useQuery({
    queryKey: ["documenti", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data, error } = await (supabase.from("documenti_azienda") as any)
        .select("*, cantiere_operai(nome, cognome)")
        .eq("company_id", companyId)
        .order("data_scadenza", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: operai } = useQuery({
    queryKey: ["operai-doc", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data } = await (supabase.from("cantiere_operai") as any)
        .select("id, nome, cognome")
        .eq("company_id", companyId)
        .eq("attivo", true);
      return data || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (formData.data_emissione && formData.data_scadenza && formData.data_scadenza <= formData.data_emissione) {
        throw new Error("La scadenza deve essere successiva alla data di emissione");
      }
      const { error } = await (supabase.from("documenti_azienda") as any).insert({
        company_id: companyId,
        ...formData,
        operaio_id: formData.operaio_id || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Documento aggiunto");
      qc.invalidateQueries({ queryKey: ["documenti"] });
      setDialogOpen(false);
      setFormData({ tipo: "", nome: "", numero_documento: "", data_emissione: "", data_scadenza: "", operaio_id: "", note: "" });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (docId: string) => {
      const { error } = await (supabase.from("documenti_azienda") as any).delete().eq("id", docId);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Eliminato"); qc.invalidateQueries({ queryKey: ["documenti"] }); },
  });

  const filtered = (documenti || []).filter((d: any) => {
    if (tab === "tutti") return true;
    return d.stato === tab;
  });

  const counts = useMemo(() => ({
    tutti: (documenti || []).length,
    valido: (documenti || []).filter((d: any) => d.stato === "valido").length,
    in_scadenza: (documenti || []).filter((d: any) => d.stato === "in_scadenza").length,
    scaduto: (documenti || []).filter((d: any) => d.stato === "scaduto").length,
  }), [documenti]);

  const getDaysLeft = (date: string) => {
    try {
      return differenceInDays(new Date(date), startOfDay(new Date()));
    } catch {
      return 0;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Documenti & Scadenze</h1>
          <p className="text-sm text-muted-foreground">Traccia DURC, patenti, certificati con alert automatici</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> Aggiungi Documento</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nuovo Documento</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select value={formData.tipo} onValueChange={v => setFormData(f => ({ ...f, tipo: v }))}>
                    <SelectTrigger><SelectValue placeholder="Seleziona tipo" /></SelectTrigger>
                    <SelectContent>{TIPI_DOC.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Nome documento</Label>
                  <Input value={formData.nome} onChange={e => setFormData(f => ({ ...f, nome: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Data emissione</Label>
                  <Input type="date" value={formData.data_emissione} onChange={e => setFormData(f => ({ ...f, data_emissione: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Data scadenza</Label>
                  <Input type="date" value={formData.data_scadenza} onChange={e => setFormData(f => ({ ...f, data_scadenza: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Operaio (opzionale)</Label>
                <Select value={formData.operaio_id} onValueChange={v => setFormData(f => ({ ...f, operaio_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Azienda" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Azienda</SelectItem>
                    {(operai || []).map((o: any) => <SelectItem key={o.id} value={o.id}>{o.nome} {o.cognome || ""}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={() => createMutation.mutate()} disabled={!formData.tipo || !formData.nome || !formData.data_scadenza} className="w-full">
                Salva Documento
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Totali", value: counts.tutti, icon: Shield, color: "text-primary" },
          { label: "Validi", value: counts.valido, icon: CheckCircle, color: "text-green-600" },
          { label: "In Scadenza", value: counts.in_scadenza, icon: AlertTriangle, color: "text-yellow-600" },
          { label: "Scaduti", value: counts.scaduto, icon: FileWarning, color: "text-destructive" },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <s.icon className={`h-8 w-8 ${s.color}`} />
              <div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="tutti">Tutti ({counts.tutti})</TabsTrigger>
          <TabsTrigger value="valido">Validi</TabsTrigger>
          <TabsTrigger value="in_scadenza">In Scadenza</TabsTrigger>
          <TabsTrigger value="scaduto">Scaduti</TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-4 space-y-3">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Caricamento...</div>
          ) : filtered.length === 0 ? (
            <Card><CardContent className="text-center py-8"><p className="text-muted-foreground">Nessun documento</p></CardContent></Card>
          ) : filtered.map((doc: any) => {
            const days = getDaysLeft(doc.data_scadenza);
            const sb = statoBadge[doc.stato] || statoBadge.valido;
            const Icon = sb.icon;
            return (
              <Card key={doc.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${doc.stato === "scaduto" ? "bg-destructive/10" : doc.stato === "in_scadenza" ? "bg-yellow-50" : "bg-green-50"}`}>
                      <Icon className={`h-5 w-5 ${doc.stato === "scaduto" ? "text-destructive" : doc.stato === "in_scadenza" ? "text-yellow-600" : "text-green-600"}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{doc.nome}</span>
                        <Badge variant="outline" className="text-xs">{doc.tipo}</Badge>
                        <Badge className={sb.class}>{doc.stato}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {doc.cantiere_operai ? `${doc.cantiere_operai?.nome || ""} ${doc.cantiere_operai?.cognome || ""}`.trim() : "Azienda"} · 
                        Scade: {new Date(doc.data_scadenza).toLocaleDateString("it-IT")}
                        {days > 0 ? ` (${days}gg)` : days === 0 ? " (OGGI)" : ` (${Math.abs(days)}gg fa)`}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => { if (confirm("Eliminare?")) deleteMutation.mutate(doc.id); }}>
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>
      </Tabs>
    </div>
  );
}
