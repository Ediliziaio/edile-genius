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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { ArrowLeft, FileDown, Trash2, Save, Plus, Euro, Send, RotateCcw, CheckCircle, XCircle, Clock, Eye, Mail } from "lucide-react";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { PreventivoPDF, type PreventivoVoce, type PreventivoData, type TemplateConfig } from "@/lib/preventivo-pdf";

const UNITS = ["mq", "ml", "mc", "nr", "ore", "forfait", "kg", "cad"];

const statoBadge: Record<string, { class: string; icon: React.ReactNode }> = {
  bozza: { class: "bg-yellow-100 text-yellow-800", icon: <Clock className="h-3 w-3" /> },
  inviato: { class: "bg-blue-100 text-blue-800", icon: <Send className="h-3 w-3" /> },
  accettato: { class: "bg-green-100 text-green-800", icon: <CheckCircle className="h-3 w-3" /> },
  rifiutato: { class: "bg-red-100 text-red-800", icon: <XCircle className="h-3 w-3" /> },
};

export default function PreventivoDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [voci, setVoci] = useState<PreventivoVoce[]>([]);
  const [note, setNote] = useState("");
  const [stato, setStato] = useState("bozza");

  const { data: prev, isLoading } = useQuery({
    queryKey: ["preventivo", id],
    queryFn: async () => {
      const { data, error } = await (supabase.from("preventivi") as any)
        .select("*, cantieri(nome)")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      if (!data) {
        toast.error("Preventivo non trovato");
        navigate("/app/preventivi");
        return null;
      }
      // Normalize voci format (support old and new)
      const normalizedVoci = (data.voci || []).map((v: any, i: number) => ({
        id: v.id || crypto.randomUUID(),
        ordine: v.ordine || i + 1,
        categoria: v.categoria || "Generale",
        titolo_voce: v.titolo_voce || v.descrizione?.substring(0, 60) || "",
        descrizione: v.descrizione || "",
        unita_misura: v.unita_misura || v.unita || "nr",
        quantita: v.quantita || 0,
        prezzo_unitario: v.prezzo_unitario || 0,
        sconto_percentuale: v.sconto_percentuale || 0,
        totale: v.totale || 0,
        foto_urls: v.foto_urls || [],
        note_voce: v.note_voce || "",
        evidenziata: v.evidenziata || false,
      }));
      setVoci(normalizedVoci);
      setNote(data.note || "");
      setStato(data.stato || "bozza");
      return { ...data, voci: normalizedVoci };
    },
  });

  const { data: company } = useQuery({
    queryKey: ["company-for-pdf", prev?.company_id],
    enabled: !!prev?.company_id,
    queryFn: async () => {
      const { data } = await supabase.from("companies").select("name, address, phone, vat_number").eq("id", prev.company_id).single();
      return data;
    },
  });

  const { data: templateConfig } = useQuery({
    queryKey: ["preventivo-template-detail", prev?.company_id],
    enabled: !!prev?.company_id,
    queryFn: async () => {
      const { data } = await (supabase.from("preventivo_templates") as any)
        .select("*")
        .eq("company_id", prev.company_id)
        .maybeSingle();
      return data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      const sub = Number(voci.reduce((s, v) => s + v.totale, 0).toFixed(2));
      const scontoPerc = prev?.sconto_globale_percentuale || 0;
      const scontoImporto = Number((sub * (scontoPerc / 100)).toFixed(2));
      const imponibile = Number((sub - scontoImporto).toFixed(2));
      const ivaPerc = prev?.iva_percentuale || 22;
      const ivaImporto = Number((imponibile * (ivaPerc / 100)).toFixed(2));
      const totaleFinale = Number((imponibile + ivaImporto).toFixed(2));
      const { error } = await (supabase.from("preventivi") as any)
        .update({ voci, note, stato, subtotale: sub, sconto_globale_importo: scontoImporto, imponibile, iva_importo: ivaImporto, totale: totaleFinale, totale_finale: totaleFinale })
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

  const updateVoce = (i: number, field: keyof PreventivoVoce, value: any) => {
    const newVoci = [...voci];
    (newVoci[i] as any)[field] = value;
    if (field === "quantita" || field === "prezzo_unitario" || field === "sconto_percentuale") {
      const v = newVoci[i];
      newVoci[i].totale = (v.quantita || 0) * (v.prezzo_unitario || 0) * (1 - (v.sconto_percentuale || 0) / 100);
    }
    setVoci(newVoci);
  };

  const addVoce = () => setVoci([...voci, {
    id: crypto.randomUUID(), ordine: voci.length + 1,
    categoria: voci.length > 0 ? voci[voci.length - 1].categoria : "Generale",
    titolo_voce: "", descrizione: "", unita_misura: "nr",
    quantita: 1, prezzo_unitario: 0, sconto_percentuale: 0, totale: 0,
    foto_urls: [], note_voce: "", evidenziata: false,
  }]);
  const removeVoce = (i: number) => setVoci(voci.filter((_, idx) => idx !== i));

  if (isLoading) return <div className="text-center py-12 text-muted-foreground">Caricamento...</div>;
  if (!prev) return <div className="text-center py-12 text-muted-foreground">Preventivo non trovato</div>;

  const subtotaleBruto = voci.reduce((s, v) => s + v.totale, 0);
  const scontoPerc = prev.sconto_globale_percentuale || 0;
  const scontoImporto = subtotaleBruto * (scontoPerc / 100);
  const subtotale = subtotaleBruto - scontoImporto;
  const iva = subtotale * ((prev.iva_percentuale || 22) / 100);
  const totale = subtotale + iva;
  const categories = [...new Set(voci.map(v => v.categoria || "Generale"))];

  const badgeInfo = statoBadge[prev.stato] || statoBadge.bozza;

  // PDF config
  const pdfTemplate: TemplateConfig = {
    colore_primario: templateConfig?.colore_primario || "#1a1a2e",
    colore_secondario: templateConfig?.colore_secondario || "#e94560",
    logo_url: templateConfig?.logo_url,
    show_foto_copertina: templateConfig?.show_foto_copertina ?? true,
    show_foto_voci: templateConfig?.show_foto_voci ?? true,
    show_subtotali_categoria: templateConfig?.show_subtotali_categoria ?? true,
    show_firma: templateConfig?.show_firma ?? true,
    show_condizioni: templateConfig?.show_condizioni ?? true,
    company_name: company?.name,
    company_address: company?.address || undefined,
    company_phone: company?.phone || undefined,
    company_vat: company?.vat_number || undefined,
    piede_pagina: templateConfig?.piede_pagina,
    azienda_nome: templateConfig?.azienda_nome,
    azienda_indirizzo: templateConfig?.azienda_indirizzo,
    azienda_telefono: templateConfig?.azienda_telefono,
    azienda_email: templateConfig?.azienda_email,
    azienda_piva: templateConfig?.azienda_piva,
  };

  const pdfData: PreventivoData = {
    numero_preventivo: prev.numero_preventivo,
    titolo: prev.titolo || prev.oggetto,
    oggetto: prev.oggetto,
    created_at: prev.created_at,
    data_scadenza: prev.data_scadenza,
    cliente_nome: prev.cliente_nome,
    cliente_indirizzo: prev.cliente_indirizzo,
    cliente_telefono: prev.cliente_telefono,
    cliente_email: prev.cliente_email,
    cliente_piva: prev.cliente_piva,
    voci,
    subtotale,
    sconto_globale_percentuale: prev.sconto_globale_percentuale || prev.sconto_globale || 0,
    sconto_globale_importo: prev.sconto_globale_importo || 0,
    imponibile: subtotale,
    iva_percentuale: prev.iva_percentuale || 22,
    iva_importo: iva,
    totale_finale: totale,
    intro: prev.intro || templateConfig?.intro_default,
    condizioni: prev.condizioni || templateConfig?.condizioni_default,
    clausole: prev.clausole || templateConfig?.clausole_default,
    firma_testo: prev.firma_testo || templateConfig?.firma_testo,
    tempi_esecuzione: prev.tempi_esecuzione,
    note: prev.note,
    foto_copertina_url: prev.foto_copertina_url,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/app/preventivi")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{prev.numero_preventivo}</h1>
              <Badge className={`${badgeInfo.class} gap-1`}>{badgeInfo.icon} {prev.stato}</Badge>
              {prev.versione > 1 && <Badge variant="outline">v{prev.versione}</Badge>}
            </div>
            <p className="text-sm text-muted-foreground">
              {prev.cliente_nome || "Cliente"} · {prev.titolo || prev.oggetto || ""}
              {prev.data_scadenza && ` · Valido fino al ${new Date(prev.data_scadenza).toLocaleDateString("it-IT")}`}
            </p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <PDFDownloadLink
            document={<PreventivoPDF data={pdfData} template={pdfTemplate} />}
            fileName={`${prev.numero_preventivo}.pdf`}
          >
            {({ loading }) => (
              <Button variant="outline" className="gap-2" disabled={loading}>
                <FileDown className="h-4 w-4" /> {loading ? "..." : "Scarica PDF"}
              </Button>
            )}
          </PDFDownloadLink>
          {prev.stato === "bozza" && prev.cliente_email && (
            <Button
              variant="outline"
              className="gap-2"
              onClick={async () => {
                await (supabase.from("preventivi") as any)
                  .update({ stato: "inviato", data_invio: new Date().toISOString(), invio_email: prev.cliente_email })
                  .eq("id", id);
                toast.success(`Preventivo segnato come inviato a ${prev.cliente_email}`);
                qc.invalidateQueries({ queryKey: ["preventivo", id] });
              }}
            >
              <Send className="h-4 w-4" /> Invia al cliente
            </Button>
          )}
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

      {/* Tabs */}
      <Tabs defaultValue="dettaglio">
        <TabsList>
          <TabsTrigger value="dettaglio">Dettaglio</TabsTrigger>
          <TabsTrigger value="cronologia">Cronologia</TabsTrigger>
          <TabsTrigger value="tracking">Tracking</TabsTrigger>
        </TabsList>

        {/* TAB: Dettaglio */}
        <TabsContent value="dettaglio" className="space-y-6">
          {/* Trascrizione */}
          {prev.trascrizione && (
            <details className="group">
              <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground">
                📝 Trascrizione audio originale
              </summary>
              <Card className="mt-2">
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{prev.trascrizione}</p>
                </CardContent>
              </Card>
            </details>
          )}

          {/* Voci by Category */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Voci Preventivo ({voci.length})</CardTitle>
                {editing && <Button variant="outline" size="sm" onClick={addVoce} className="gap-1"><Plus className="h-3 w-3" /> Aggiungi</Button>}
              </div>
            </CardHeader>
            <CardContent>
              {categories.map(cat => {
                const catVoci = voci.filter(v => (v.categoria || "Generale") === cat);
                const catTotal = catVoci.reduce((s, v) => s + v.totale, 0);
                return (
                  <div key={cat} className="mb-4">
                    <div className="flex items-center justify-between bg-muted rounded-lg px-3 py-1.5 mb-2">
                      <span className="text-xs font-semibold uppercase tracking-wide text-foreground">{cat}</span>
                      <span className="text-xs font-mono text-muted-foreground">€{catTotal.toFixed(2)}</span>
                    </div>
                    <div className="space-y-1">
                      {catVoci.map(v => {
                        const gi = voci.indexOf(v);
                        return (
                          <div key={v.id} className={`grid grid-cols-12 gap-2 items-start py-2 border-b border-border/50 ${v.evidenziata ? "bg-yellow-50/50" : ""}`}>
                            <div className="col-span-5">
                              {editing ? (
                                <div className="space-y-1">
                                  <Input value={v.titolo_voce} onChange={e => updateVoce(gi, "titolo_voce", e.target.value)} className="font-medium text-sm h-8" />
                                  <Textarea value={v.descrizione} onChange={e => updateVoce(gi, "descrizione", e.target.value)} rows={1} className="text-xs" />
                                </div>
                              ) : (
                                <div>
                                  <p className="text-sm font-medium">{v.titolo_voce}</p>
                                  {v.descrizione && v.descrizione !== v.titolo_voce && (
                                    <p className="text-xs text-muted-foreground">{v.descrizione}</p>
                                  )}
                                  {v.note_voce && <p className="text-xs text-amber-600 italic mt-0.5">💡 {v.note_voce}</p>}
                                </div>
                              )}
                            </div>
                            <div className="col-span-1">
                              {editing ? (
                                <Select value={v.unita_misura} onValueChange={val => updateVoce(gi, "unita_misura", val)}>
                                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                  <SelectContent>{UNITS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                                </Select>
                              ) : <span className="text-xs text-muted-foreground">{v.unita_misura}</span>}
                            </div>
                            <div className="col-span-1 text-right">
                              {editing ? <Input type="number" className="text-right h-8 text-xs" value={v.quantita} onChange={e => updateVoce(gi, "quantita", parseFloat(e.target.value) || 0)} /> : <span className="text-sm">{v.quantita}</span>}
                            </div>
                            <div className="col-span-2 text-right">
                              {editing ? <Input type="number" className="text-right h-8 text-xs" value={v.prezzo_unitario} onChange={e => updateVoce(gi, "prezzo_unitario", parseFloat(e.target.value) || 0)} /> : <span className="text-sm">€{v.prezzo_unitario?.toFixed(2)}</span>}
                            </div>
                            <div className="col-span-1 text-right">
                              {v.sconto_percentuale > 0 ? (
                                <span className="text-xs text-green-600">-{v.sconto_percentuale}%</span>
                              ) : <span className="text-xs text-muted-foreground">—</span>}
                            </div>
                            <div className="col-span-2 text-right flex items-center justify-end gap-1">
                              <span className="text-sm font-medium">€{v.totale?.toFixed(2)}</span>
                              {editing && <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeVoce(gi)}><Trash2 className="h-3 w-3" /></Button>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {/* Totals */}
              <div className="mt-6 border-t pt-4 space-y-2 text-right">
                <div className="flex justify-end gap-8 text-sm"><span className="text-muted-foreground">Subtotale lordo</span><span>€{subtotaleBruto.toFixed(2)}</span></div>
                {scontoPerc > 0 && (
                  <div className="flex justify-end gap-8 text-sm text-green-600"><span>Sconto {scontoPerc}%</span><span>-€{scontoImporto.toFixed(2)}</span></div>
                )}
                <div className="flex justify-end gap-8 text-sm"><span className="text-muted-foreground">Imponibile</span><span>€{subtotale.toFixed(2)}</span></div>
                <div className="flex justify-end gap-8 text-sm"><span className="text-muted-foreground">IVA ({prev.iva_percentuale || 22}%)</span><span>€{iva.toFixed(2)}</span></div>
                <div className="flex justify-end gap-8 text-lg font-bold"><span>Totale</span><span className="flex items-center gap-1"><Euro className="h-4 w-4" />{totale.toFixed(2)}</span></div>
              </div>
            </CardContent>
          </Card>

          {/* Note & Stato */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  ) : <Badge className={`${badgeInfo.class} gap-1`}>{badgeInfo.icon} {stato}</Badge>}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Note</label>
                  {editing ? <Textarea value={note} onChange={e => setNote(e.target.value)} /> : <p className="text-sm text-muted-foreground">{note || "—"}</p>}
                </div>
              </div>
              {prev.tempi_esecuzione && (
                <div className="space-y-1">
                  <label className="text-sm font-medium">Tempi di esecuzione</label>
                  <p className="text-sm text-muted-foreground">⏱ {prev.tempi_esecuzione}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: Cronologia */}
        <TabsContent value="cronologia">
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <TimelineItem
                  icon={<Plus className="h-3 w-3" />}
                  title="Preventivo creato"
                  date={prev.created_at}
                  description={`Versione ${prev.versione || 1} — ${prev.trascrizione ? "Generato da audio AI" : "Creato manualmente"}`}
                />
                {prev.inviato_at && (
                  <TimelineItem
                    icon={<Send className="h-3 w-3" />}
                    title="Inviato al cliente"
                    date={prev.inviato_at}
                    description={`Via ${prev.inviato_via || "email"} a ${prev.cliente_email || prev.cliente_nome}`}
                  />
                )}
                {prev.accettato_at && (
                  <TimelineItem
                    icon={<CheckCircle className="h-3 w-3 text-green-600" />}
                    title="Accettato dal cliente"
                    date={prev.accettato_at}
                  />
                )}
                {prev.rifiutato_at && (
                  <TimelineItem
                    icon={<XCircle className="h-3 w-3 text-red-600" />}
                    title="Rifiutato dal cliente"
                    date={prev.rifiutato_at}
                    description={prev.rifiuto_motivo}
                  />
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: Tracking */}
        <TabsContent value="tracking">
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <Eye className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-2xl font-bold">{prev.link_aperto_count || 0}</p>
                  <p className="text-xs text-muted-foreground">Aperture</p>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <Clock className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm font-medium">
                    {prev.email_aperta_at
                      ? new Date(prev.email_aperta_at).toLocaleString("it-IT")
                      : "Mai aperta"}
                  </p>
                  <p className="text-xs text-muted-foreground">Email aperta</p>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <Mail className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm font-medium">
                    {prev.data_invio
                      ? new Date(prev.data_invio).toLocaleString("it-IT")
                      : "Non inviato"}
                  </p>
                  <p className="text-xs text-muted-foreground">Ultimo invio</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function TimelineItem({ icon, title, date, description }: { icon: React.ReactNode; title: string; date: string; description?: string }) {
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center">{icon}</div>
        <div className="w-px flex-1 bg-border" />
      </div>
      <div className="pb-4">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{new Date(date).toLocaleString("it-IT")}</p>
        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
      </div>
    </div>
  );
}
