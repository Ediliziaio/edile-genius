import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, FileDown, Trash2, Save, Plus, Euro } from "lucide-react";

interface Voce {
  descrizione: string;
  unita: string;
  quantita: number;
  prezzo_unitario: number;
  totale: number;
}

export default function PreventivoDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [voci, setVoci] = useState<Voce[]>([]);
  const [note, setNote] = useState("");
  const [stato, setStato] = useState("bozza");
  const [generatingPdf, setGeneratingPdf] = useState(false);

  const { data: prev, isLoading } = useQuery({
    queryKey: ["preventivo", id],
    queryFn: async () => {
      const { data, error } = await (supabase.from("preventivi") as any)
        .select("*, cantieri(nome)")
        .eq("id", id)
        .single();
      if (error) throw error;
      setVoci(data.voci || []);
      setNote(data.note || "");
      setStato(data.stato || "bozza");
      return data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      const subtotale = voci.reduce((s, v) => s + v.totale, 0);
      const totale = subtotale * (1 + (prev?.iva_percentuale || 22) / 100);
      const { error } = await (supabase.from("preventivi") as any)
        .update({ voci, note, stato, subtotale, totale })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Preventivo aggiornato");
      qc.invalidateQueries({ queryKey: ["preventivo", id] });
      setEditing(false);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await (supabase.from("preventivi") as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Eliminato"); navigate("/app/preventivi"); },
  });

  const generatePdf = async () => {
    setGeneratingPdf(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Non autenticato");
      const res = await supabase.functions.invoke("generate-preventivo-pdf", {
        body: { preventivo_id: id },
      });
      if (res.error) throw res.error;
      const { pdf_url } = res.data;
      if (pdf_url) window.open(pdf_url, "_blank");
      toast.success("PDF generato!");
      qc.invalidateQueries({ queryKey: ["preventivo", id] });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setGeneratingPdf(false);
    }
  };

  const updateVoce = (i: number, field: keyof Voce, value: any) => {
    const newVoci = [...voci];
    (newVoci[i] as any)[field] = value;
    if (field === "quantita" || field === "prezzo_unitario") {
      newVoci[i].totale = (newVoci[i].quantita || 0) * (newVoci[i].prezzo_unitario || 0);
    }
    setVoci(newVoci);
  };

  const addVoce = () => setVoci([...voci, { descrizione: "", unita: "nr", quantita: 1, prezzo_unitario: 0, totale: 0 }]);
  const removeVoce = (i: number) => setVoci(voci.filter((_, idx) => idx !== i));

  if (isLoading) return <div className="text-center py-12 text-muted-foreground">Caricamento...</div>;
  if (!prev) return <div className="text-center py-12 text-muted-foreground">Preventivo non trovato</div>;

  const subtotale = voci.reduce((s, v) => s + v.totale, 0);
  const iva = subtotale * ((prev.iva_percentuale || 22) / 100);
  const totale = subtotale + iva;

  const statoBadge: Record<string, string> = {
    bozza: "bg-yellow-100 text-yellow-800",
    inviato: "bg-blue-100 text-blue-800",
    accettato: "bg-green-100 text-green-800",
    rifiutato: "bg-red-100 text-red-800",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/app/preventivi")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{prev.numero_preventivo}</h1>
              <Badge className={statoBadge[prev.stato] || ""}>{prev.stato}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">{prev.cliente_nome || "Cliente"} · {prev.oggetto || ""}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={generatePdf} disabled={generatingPdf} className="gap-2">
            <FileDown className="h-4 w-4" /> {generatingPdf ? "Generando..." : "Genera PDF"}
          </Button>
          {editing ? (
            <Button onClick={() => updateMutation.mutate()} className="gap-2">
              <Save className="h-4 w-4" /> Salva
            </Button>
          ) : (
            <Button variant="outline" onClick={() => setEditing(true)}>Modifica</Button>
          )}
          <Button variant="destructive" size="icon" onClick={() => { if (confirm("Eliminare?")) deleteMutation.mutate(); }}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Trascrizione */}
      {prev.trascrizione && (
        <Card>
          <CardHeader><CardTitle className="text-sm">📝 Trascrizione Audio</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{prev.trascrizione}</p>
          </CardContent>
        </Card>
      )}

      {/* Voci */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Voci Preventivo</CardTitle>
            {editing && <Button variant="outline" size="sm" onClick={addVoce} className="gap-1"><Plus className="h-3 w-3" /> Aggiungi</Button>}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-muted-foreground uppercase">
              <div className="col-span-5">Descrizione</div>
              <div className="col-span-1">U.M.</div>
              <div className="col-span-2 text-right">Q.tà</div>
              <div className="col-span-2 text-right">Prezzo</div>
              <div className="col-span-2 text-right">Totale</div>
            </div>
            {voci.map((v, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-center">
                <div className="col-span-5">
                  {editing ? <Input value={v.descrizione} onChange={e => updateVoce(i, "descrizione", e.target.value)} /> : <span className="text-sm">{v.descrizione}</span>}
                </div>
                <div className="col-span-1">
                  {editing ? (
                    <Select value={v.unita} onValueChange={val => updateVoce(i, "unita", val)}>
                      <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["mq", "ml", "nr", "ore", "forfait", "kg", "mc"].map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  ) : <span className="text-sm text-muted-foreground">{v.unita}</span>}
                </div>
                <div className="col-span-2 text-right">
                  {editing ? <Input type="number" className="text-right" value={v.quantita} onChange={e => updateVoce(i, "quantita", parseFloat(e.target.value) || 0)} /> : <span className="text-sm">{v.quantita}</span>}
                </div>
                <div className="col-span-2 text-right">
                  {editing ? <Input type="number" className="text-right" value={v.prezzo_unitario} onChange={e => updateVoce(i, "prezzo_unitario", parseFloat(e.target.value) || 0)} /> : <span className="text-sm">€{v.prezzo_unitario?.toFixed(2)}</span>}
                </div>
                <div className="col-span-2 text-right flex items-center justify-end gap-1">
                  <span className="text-sm font-medium">€{v.totale?.toFixed(2)}</span>
                  {editing && <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeVoce(i)}><Trash2 className="h-3 w-3" /></Button>}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 border-t pt-4 space-y-2 text-right">
            <div className="flex justify-end gap-8 text-sm"><span className="text-muted-foreground">Subtotale</span><span>€{subtotale.toFixed(2)}</span></div>
            <div className="flex justify-end gap-8 text-sm"><span className="text-muted-foreground">IVA ({prev.iva_percentuale || 22}%)</span><span>€{iva.toFixed(2)}</span></div>
            <div className="flex justify-end gap-8 text-lg font-bold"><span>Totale</span><span className="flex items-center gap-1"><Euro className="h-4 w-4" />{totale.toFixed(2)}</span></div>
          </div>
        </CardContent>
      </Card>

      {/* Note & Stato */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Stato</label>
              {editing ? (
                <Select value={stato} onValueChange={setStato}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bozza">Bozza</SelectItem>
                    <SelectItem value="inviato">Inviato</SelectItem>
                    <SelectItem value="accettato">Accettato</SelectItem>
                    <SelectItem value="rifiutato">Rifiutato</SelectItem>
                  </SelectContent>
                </Select>
              ) : <Badge className={statoBadge[stato] || ""}>{stato}</Badge>}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Note</label>
              {editing ? <Textarea value={note} onChange={e => setNote(e.target.value)} /> : <p className="text-sm text-muted-foreground">{note || "—"}</p>}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
