import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyId } from "@/hooks/useCompanyId";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Save, Upload, Palette, Type, ToggleLeft, Building2 } from "lucide-react";

export default function TemplatePreventivo() {
  const companyId = useCompanyId();
  const qc = useQueryClient();

  const [form, setForm] = useState({
    nome: "Template Standard",
    logo_url: "",
    colore_primario: "#f4a100",
    colore_secondario: "#1e293b",
    // Dati azienda
    azienda_nome: "",
    azienda_indirizzo: "",
    azienda_telefono: "",
    azienda_email: "",
    azienda_piva: "",
    azienda_cf: "",
    azienda_rea: "",
    azienda_sito: "",
    // Legacy
    intestazione_azienda: "",
    piede_pagina: "",
    // Testi
    intro_default: "In riferimento al sopralluogo effettuato, siamo lieti di sottoporvi il seguente preventivo per i lavori da eseguire.",
    condizioni_default: "Pagamento: 30% alla conferma, 40% in corso d'opera, 30% a fine lavori.",
    clausole_default: "I prezzi si intendono IVA esclusa. La presente offerta ha validità 30 giorni dalla data di emissione.",
    note_finali: "",
    firma_testo: "Per accettazione del preventivo, restituire copia firmata.",
    // Layout
    show_foto_copertina: true,
    show_foto_voci: true,
    show_subtotali_categoria: true,
    show_firma: true,
    show_condizioni: true,
    validita_giorni_default: 30,
    iva_default: 22,
  });

  const { data: existing, isLoading } = useQuery({
    queryKey: ["preventivo-template-settings", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data } = await (supabase.from("preventivo_templates") as any)
        .select("*")
        .eq("company_id", companyId)
        .maybeSingle();
      return data;
    },
  });

  useEffect(() => {
    if (existing) {
      setForm({
        nome: existing.nome || "Template Standard",
        logo_url: existing.logo_url || "",
        colore_primario: existing.colore_primario || "#f4a100",
        colore_secondario: existing.colore_secondario || "#1e293b",
        azienda_nome: existing.azienda_nome || "",
        azienda_indirizzo: existing.azienda_indirizzo || "",
        azienda_telefono: existing.azienda_telefono || "",
        azienda_email: existing.azienda_email || "",
        azienda_piva: existing.azienda_piva || "",
        azienda_cf: existing.azienda_cf || "",
        azienda_rea: existing.azienda_rea || "",
        azienda_sito: existing.azienda_sito || "",
        intestazione_azienda: existing.intestazione_azienda || "",
        piede_pagina: existing.piede_pagina || "",
        intro_default: existing.intro_default || "",
        condizioni_default: existing.condizioni_default || "",
        clausole_default: existing.clausole_default || "",
        note_finali: existing.note_finali || "",
        firma_testo: existing.firma_testo || "Il Responsabile",
        show_foto_copertina: existing.show_foto_copertina ?? true,
        show_foto_voci: existing.show_foto_voci ?? true,
        show_subtotali_categoria: existing.show_subtotali_categoria ?? true,
        show_firma: existing.show_firma ?? true,
        show_condizioni: existing.show_condizioni ?? true,
        validita_giorni_default: existing.validita_giorni_default || 30,
        iva_default: existing.iva_default || 22,
      });
    }
  }, [existing]);

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const saveMutation = useMutation({
    mutationFn: async () => {
      // Validate required fields
      const errors: Record<string, string> = {};
      if (!form.azienda_nome.trim()) errors.azienda_nome = "Il nome azienda è obbligatorio";
      if (!form.azienda_piva.trim()) errors.azienda_piva = "La P.IVA è obbligatoria";
      if (Object.keys(errors).length > 0) {
        setValidationErrors(errors);
        throw new Error("Compila i campi obbligatori");
      }
      setValidationErrors({});
      if (existing) {
        const { error } = await (supabase.from("preventivo_templates") as any)
          .update({ ...form, updated_at: new Date().toISOString() })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase.from("preventivo_templates") as any)
          .insert({ ...form, company_id: companyId });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Template salvato!");
      qc.invalidateQueries({ queryKey: ["preventivo-template-settings", companyId] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !companyId) return;
    const allowedTypes = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Tipo file non supportato. Usa PNG, JPEG, WebP o SVG.");
      return;
    }
    const path = `${companyId}/logo-${crypto.randomUUID()}.${file.name.split(".").pop()}`;
    const { error } = await supabase.storage.from("template-assets").upload(path, file, { upsert: true });
    if (error) { toast.error(error.message); return; }
    const { data: urlData } = supabase.storage.from("template-assets").getPublicUrl(path);
    setForm(f => ({ ...f, logo_url: urlData.publicUrl }));
    toast.success("Logo caricato!");
  };

  const update = (field: string, value: any) => setForm(f => ({ ...f, [field]: value }));

  if (isLoading) return <div className="text-center py-12 text-muted-foreground">Caricamento...</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Template Preventivo</h1>
          <p className="text-sm text-muted-foreground">Configura il branding e i testi standard dei tuoi preventivi PDF</p>
        </div>
        <Button onClick={() => saveMutation.mutate()} className="gap-2" disabled={saveMutation.isPending}>
          <Save className="h-4 w-4" /> Salva
        </Button>
      </div>

      <Tabs defaultValue="azienda">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="azienda" className="gap-1"><Building2 className="h-3.5 w-3.5" /> Azienda</TabsTrigger>
          <TabsTrigger value="branding" className="gap-1"><Palette className="h-3.5 w-3.5" /> Branding</TabsTrigger>
          <TabsTrigger value="testi" className="gap-1"><Type className="h-3.5 w-3.5" /> Testi Standard</TabsTrigger>
          <TabsTrigger value="layout" className="gap-1"><ToggleLeft className="h-3.5 w-3.5" /> Layout</TabsTrigger>
        </TabsList>

        {/* DATI AZIENDA */}
        <TabsContent value="azienda" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Dati Azienda</CardTitle>
              <CardDescription>Questi dati appariranno nell'intestazione del PDF preventivo</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome Azienda</Label>
                  <Input value={form.azienda_nome} onChange={e => update("azienda_nome", e.target.value)} placeholder="Impresa Edile Rossi S.r.l." />
                </div>
                <div className="space-y-2">
                  <Label>Telefono</Label>
                  <Input value={form.azienda_telefono} onChange={e => update("azienda_telefono", e.target.value)} placeholder="+39 02 1234567" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Indirizzo</Label>
                  <Input value={form.azienda_indirizzo} onChange={e => update("azienda_indirizzo", e.target.value)} placeholder="Via Roma 15, 20100 Milano (MI)" />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={form.azienda_email} onChange={e => update("azienda_email", e.target.value)} placeholder="info@impresarossi.it" />
                </div>
                <div className="space-y-2">
                  <Label>Sito Web</Label>
                  <Input value={form.azienda_sito} onChange={e => update("azienda_sito", e.target.value)} placeholder="www.impresarossi.it" />
                </div>
                <div className="space-y-2">
                  <Label>P.IVA</Label>
                  <Input value={form.azienda_piva} onChange={e => update("azienda_piva", e.target.value)} placeholder="IT12345678901" />
                </div>
                <div className="space-y-2">
                  <Label>Codice Fiscale</Label>
                  <Input value={form.azienda_cf} onChange={e => update("azienda_cf", e.target.value)} placeholder="12345678901" />
                </div>
                <div className="space-y-2">
                  <Label>REA</Label>
                  <Input value={form.azienda_rea} onChange={e => update("azienda_rea", e.target.value)} placeholder="MI-1234567" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* BRANDING */}
        <TabsContent value="branding" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Logo Aziendale</CardTitle>
              <CardDescription>Verrà mostrato in alto a sinistra nel PDF</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {form.logo_url && (
                <div className="bg-muted p-4 rounded-lg flex items-center gap-4">
                  <img src={form.logo_url} alt="Logo" className="h-12 object-contain" />
                  <Button variant="outline" size="sm" onClick={() => update("logo_url", "")}>Rimuovi</Button>
                </div>
              )}
              <div className="relative">
                <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={handleLogoUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                <Button variant="outline" className="gap-2 w-full">
                  <Upload className="h-4 w-4" /> {form.logo_url ? "Cambia Logo" : "Carica Logo"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Colori</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Colore Primario</Label>
                  <div className="flex gap-2">
                    <input type="color" value={form.colore_primario} onChange={e => update("colore_primario", e.target.value)} className="h-9 w-12 rounded border cursor-pointer" />
                    <Input value={form.colore_primario} onChange={e => update("colore_primario", e.target.value)} className="flex-1" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Colore Secondario</Label>
                  <div className="flex gap-2">
                    <input type="color" value={form.colore_secondario} onChange={e => update("colore_secondario", e.target.value)} className="h-9 w-12 rounded border cursor-pointer" />
                    <Input value={form.colore_secondario} onChange={e => update("colore_secondario", e.target.value)} className="flex-1" />
                  </div>
                </div>
              </div>
              <div className="h-2 rounded-full" style={{ background: `linear-gradient(90deg, ${form.colore_primario}, ${form.colore_secondario})` }} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Piè di pagina</CardTitle>
            </CardHeader>
            <CardContent>
              <Input value={form.piede_pagina} onChange={e => update("piede_pagina", e.target.value)} placeholder="Impresa Edile Rossi — Preventivo generato automaticamente" />
            </CardContent>
          </Card>
        </TabsContent>

        {/* TESTI STANDARD */}
        <TabsContent value="testi" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Testi Predefiniti</CardTitle>
              <CardDescription>Questi testi verranno inseriti automaticamente in ogni nuovo preventivo</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Introduzione</Label>
                <Textarea value={form.intro_default} onChange={e => update("intro_default", e.target.value)} rows={3} />
              </div>
              <div className="space-y-2">
                <Label>Condizioni di pagamento</Label>
                <Textarea value={form.condizioni_default} onChange={e => update("condizioni_default", e.target.value)} rows={3} />
              </div>
              <div className="space-y-2">
                <Label>Clausole</Label>
                <Textarea value={form.clausole_default} onChange={e => update("clausole_default", e.target.value)} rows={3} />
              </div>
              <div className="space-y-2">
                <Label>Note finali</Label>
                <Textarea value={form.note_finali} onChange={e => update("note_finali", e.target.value)} rows={2} />
              </div>
              <div className="space-y-2">
                <Label>Testo firma</Label>
                <Input value={form.firma_testo} onChange={e => update("firma_testo", e.target.value)} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Valori Predefiniti</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Validità preventivo (giorni)</Label>
                  <Input type="number" value={form.validita_giorni_default} onChange={e => update("validita_giorni_default", parseInt(e.target.value) || 30)} />
                </div>
                <div className="space-y-2">
                  <Label>IVA default (%)</Label>
                  <Input type="number" value={form.iva_default} onChange={e => update("iva_default", parseInt(e.target.value) || 22)} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* LAYOUT */}
        <TabsContent value="layout" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Opzioni Layout PDF</CardTitle>
              <CardDescription>Scegli cosa mostrare nel preventivo PDF generato</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { key: "show_foto_copertina", label: "Foto copertina", desc: "Mostra le foto del sopralluogo come copertina" },
                { key: "show_foto_voci", label: "Foto per voce", desc: "Mostra le foto associate a ciascuna voce del preventivo" },
                { key: "show_subtotali_categoria", label: "Subtotali per categoria", desc: "Mostra il subtotale alla fine di ogni categoria" },
                { key: "show_firma", label: "Sezione firma", desc: "Mostra lo spazio per la firma del responsabile e del cliente" },
                { key: "show_condizioni", label: "Condizioni e clausole", desc: "Mostra le condizioni di pagamento e le clausole" },
              ].map(item => (
                <div key={item.key} className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                  <Switch
                    checked={(form as any)[item.key]}
                    onCheckedChange={v => update(item.key, v)}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
