import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyId } from "@/hooks/useCompanyId";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Mic, Square, Loader2, Upload, ArrowLeft, ArrowRight, Camera, X, GripVertical, Plus, Trash2, Euro, FileDown, Eye } from "lucide-react";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { PreventivoPDF, type PreventivoVoce, type PreventivoData, type TemplateConfig } from "@/lib/preventivo-pdf";

const UNITS = ["mq", "ml", "mc", "nr", "ore", "forfait", "kg", "cad"];

export default function NuovoPreventivo() {
  const companyId = useCompanyId();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [processing, setProcessing] = useState(false);

  // Step 1 — Client data
  const [clienteNome, setClienteNome] = useState("");
  const [clienteIndirizzo, setClienteIndirizzo] = useState("");
  const [clienteTelefono, setClienteTelefono] = useState("");
  const [clienteEmail, setClienteEmail] = useState("");
  const [clientePiva, setClientePiva] = useState("");
  const [clienteCF, setClienteCF] = useState("");
  const [cantiereId, setCantiereId] = useState("");
  const [oggetto, setOggetto] = useState("");
  const [titolo, setTitolo] = useState("");
  const [luogoLavori, setLuogoLavori] = useState("");
  const [scontoGlobalePerc, setScontoGlobalePerc] = useState(0);

  // Step 2 — Audio + Photos
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [photos, setPhotos] = useState<File[]>([]);
  const [photosPreviews, setPhotosPreviews] = useState<string[]>([]);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);

  // Step 3 — Voci editor
  const [voci, setVoci] = useState<PreventivoVoce[]>([]);
  const [trascrizione, setTrascrizione] = useState("");
  const [noteGenerali, setNoteGenerali] = useState("");
  const [tempiEsecuzione, setTempiEsecuzione] = useState("");
  const [preventivoId, setPreventivoId] = useState<string | null>(null);

  const { data: cantieri } = useQuery({
    queryKey: ["cantieri-select", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data } = await (supabase.from("cantieri") as any)
        .select("id, nome")
        .eq("company_id", companyId)
        .eq("stato", "attivo");
      return data || [];
    },
  });

  const { data: templateConfig } = useQuery({
    queryKey: ["preventivo-template", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data } = await (supabase.from("preventivo_templates") as any)
        .select("*")
        .eq("company_id", companyId)
        .maybeSingle();
      return data;
    },
  });

  const { data: company } = useQuery({
    queryKey: ["company-info", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data } = await supabase.from("companies").select("name, address, phone, vat_number").eq("id", companyId!).single();
      return data;
    },
  });

  // Audio recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream, { mimeType: "audio/webm" });
      chunks.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunks.current.push(e.data); };
      mr.onstop = () => {
        const blob = new Blob(chunks.current, { type: "audio/webm" });
        setAudioBlob(blob);
        stream.getTracks().forEach(t => t.stop());
      };
      mr.start();
      mediaRecorder.current = mr;
      setRecording(true);
    } catch {
      toast.error("Impossibile accedere al microfono");
    }
  };

  const stopRecording = () => {
    mediaRecorder.current?.stop();
    setRecording(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setAudioBlob(file);
  };

  // Photo handling
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newPhotos = [...photos, ...files];
    setPhotos(newPhotos);
    const newPreviews = [...photosPreviews, ...files.map(f => URL.createObjectURL(f))];
    setPhotosPreviews(newPreviews);
  };

  const removePhoto = (i: number) => {
    setPhotos(photos.filter((_, idx) => idx !== i));
    URL.revokeObjectURL(photosPreviews[i]);
    setPhotosPreviews(photosPreviews.filter((_, idx) => idx !== i));
  };

  // Process audio → AI
  const processAudio = async () => {
    if (!audioBlob || !companyId) {
      toast.error("Registra o carica un audio prima");
      return;
    }
    setProcessing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Non autenticato");

      const formData = new FormData();
      formData.append("audio", audioBlob, "audio.webm");
      formData.append("company_id", companyId);
      if (cantiereId) formData.append("cantiere_id", cantiereId);
      if (clienteNome) formData.append("cliente_nome", clienteNome);
      if (clienteIndirizzo) formData.append("cliente_indirizzo", clienteIndirizzo);
      if (clienteTelefono) formData.append("cliente_telefono", clienteTelefono);
      if (clienteEmail) formData.append("cliente_email", clienteEmail);
      if (clientePiva) formData.append("cliente_piva", clientePiva);
      if (clienteCF) formData.append("cliente_codice_fiscale", clienteCF);
      if (oggetto) formData.append("oggetto", oggetto);
      if (titolo) formData.append("titolo", titolo);

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-preventivo-audio`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${session.access_token}` },
          body: formData,
        }
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Errore elaborazione");
      }

      const preventivo = await res.json();
      setPreventivoId(preventivo.id);
      setVoci(preventivo.voci || []);
      setTrascrizione(preventivo.trascrizione || "");
      setNoteGenerali(preventivo.note || "");
      setTempiEsecuzione(preventivo.tempi_esecuzione || "");
      if (!oggetto && preventivo.oggetto) setOggetto(preventivo.oggetto);
      if (!titolo && preventivo.titolo) setTitolo(preventivo.titolo);
      
      toast.success("Audio elaborato! Verifica le voci estratte.");
      setStep(3);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setProcessing(false);
    }
  };

  // Voci editor
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
    id: crypto.randomUUID(),
    ordine: voci.length + 1,
    categoria: voci.length > 0 ? voci[voci.length - 1].categoria : "Generale",
    titolo_voce: "",
    descrizione: "",
    unita_misura: "nr",
    quantita: 1,
    prezzo_unitario: 0,
    sconto_percentuale: 0,
    totale: 0,
    foto_urls: [],
    note_voce: "",
    evidenziata: false,
  }]);

  const removeVoce = (i: number) => setVoci(voci.filter((_, idx) => idx !== i));

  // Save updated voci
  const saveVoci = async () => {
    if (!preventivoId) return;
    const subtotale = voci.reduce((s, v) => s + v.totale, 0);
    const ivaPerc = 22;
    const imponibile = subtotale;
    const ivaImporto = imponibile * (ivaPerc / 100);
    const totaleFinale = imponibile + ivaImporto;

    const { error } = await (supabase.from("preventivi") as any)
      .update({
        voci,
        subtotale,
        imponibile,
        iva_importo: ivaImporto,
        totale: totaleFinale,
        totale_finale: totaleFinale,
        note: noteGenerali,
        oggetto,
        titolo,
        tempi_esecuzione: tempiEsecuzione,
      })
      .eq("id", preventivoId);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Preventivo salvato!");
      navigate(`/app/preventivi/${preventivoId}`);
    }
  };

  // Computed totals
  const subtotale = voci.reduce((s, v) => s + v.totale, 0);
  const ivaImporto = subtotale * 0.22;
  const totaleFinale = subtotale + ivaImporto;

  // Group voci for display
  const categories = [...new Set(voci.map(v => v.categoria || "Generale"))];

  // Template for PDF preview
  const pdfTemplate: TemplateConfig = {
    colore_primario: templateConfig?.colore_primario || "#1a1a2e",
    colore_secondario: templateConfig?.colore_secondario || "#e94560",
    logo_url: templateConfig?.logo_url,
    intestazione_azienda: templateConfig?.intestazione_azienda,
    piede_pagina: templateConfig?.piede_pagina,
    show_foto_copertina: templateConfig?.show_foto_copertina ?? true,
    show_foto_voci: templateConfig?.show_foto_voci ?? true,
    show_subtotali_categoria: templateConfig?.show_subtotali_categoria ?? true,
    show_firma: templateConfig?.show_firma ?? true,
    show_condizioni: templateConfig?.show_condizioni ?? true,
    company_name: company?.name,
    company_address: company?.address || undefined,
    company_phone: company?.phone || undefined,
    company_vat: company?.vat_number || undefined,
    azienda_nome: templateConfig?.azienda_nome,
    azienda_indirizzo: templateConfig?.azienda_indirizzo,
    azienda_telefono: templateConfig?.azienda_telefono,
    azienda_email: templateConfig?.azienda_email,
    azienda_piva: templateConfig?.azienda_piva,
  };

  const pdfData: PreventivoData = {
    numero_preventivo: "PV-ANTEPRIMA",
    titolo: titolo || oggetto || "Preventivo Lavori",
    oggetto,
    created_at: new Date().toISOString(),
    cliente_nome: clienteNome,
    cliente_indirizzo: clienteIndirizzo,
    cliente_telefono: clienteTelefono,
    cliente_email: clienteEmail,
    cliente_piva: clientePiva,
    voci,
    subtotale,
    imponibile: subtotale,
    iva_percentuale: 22,
    iva_importo: ivaImporto,
    totale_finale: totaleFinale,
    intro: templateConfig?.intro_default,
    condizioni: templateConfig?.condizioni_default,
    clausole: templateConfig?.clausole_default,
    firma_testo: templateConfig?.firma_testo,
    tempi_esecuzione: tempiEsecuzione,
    note: noteGenerali,
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => step > 1 ? setStep(step - 1) : navigate("/app/preventivi")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">Nuovo Preventivo</h1>
          <p className="text-sm text-muted-foreground">Step {step} di 3</p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex gap-2">
        {[1, 2, 3].map(s => (
          <div key={s} className={`flex-1 h-1.5 rounded-full transition-colors ${s <= step ? "bg-primary" : "bg-muted"}`} />
        ))}
      </div>

      {/* STEP 1 — Client Data */}
      {step === 1 && (
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-lg">👤 Dati Cliente</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome / Ragione Sociale</Label>
                  <Input placeholder="Mario Rossi" value={clienteNome} onChange={e => setClienteNome(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Telefono</Label>
                  <Input placeholder="+39 333 1234567" value={clienteTelefono} onChange={e => setClienteTelefono(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input placeholder="mario@email.it" value={clienteEmail} onChange={e => setClienteEmail(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Indirizzo</Label>
                  <Input placeholder="Via Roma 15, Milano" value={clienteIndirizzo} onChange={e => setClienteIndirizzo(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>P.IVA (opzionale)</Label>
                  <Input placeholder="IT12345678901" value={clientePiva} onChange={e => setClientePiva(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Codice Fiscale (opzionale)</Label>
                  <Input placeholder="RSSMRA80A01H501Z" value={clienteCF} onChange={e => setClienteCF(e.target.value)} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-lg">📋 Dettagli Lavori</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Titolo Preventivo</Label>
                <Input placeholder="es. Ristrutturazione completa bagno" value={titolo} onChange={e => setTitolo(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Oggetto lavori</Label>
                <Textarea placeholder="Descrizione sintetica dei lavori..." value={oggetto} onChange={e => setOggetto(e.target.value)} rows={2} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Luogo lavori</Label>
                  <Input placeholder="Via Roma 15, Milano" value={luogoLavori} onChange={e => setLuogoLavori(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Cantiere (opzionale)</Label>
                  <Select value={cantiereId} onValueChange={setCantiereId}>
                    <SelectTrigger><SelectValue placeholder="Seleziona cantiere" /></SelectTrigger>
                    <SelectContent>
                      {(cantieri || []).map((c: any) => (
                        <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button onClick={() => setStep(2)} className="w-full gap-2" size="lg">
            Avanti <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* STEP 2 — Audio + Photos */}
      {step === 2 && (
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-lg">🎙️ Registra il Sopralluogo</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Descrivi a voce i lavori da fare, materiali, quantità e misure. L'AI estrarrà automaticamente le voci del preventivo.
              </p>
              <div className="flex gap-3">
                {!recording ? (
                  <Button onClick={startRecording} variant="outline" className="gap-2 flex-1" disabled={processing}>
                    <Mic className="h-4 w-4" /> Avvia Registrazione
                  </Button>
                ) : (
                  <Button onClick={stopRecording} variant="destructive" className="gap-2 flex-1">
                    <Square className="h-4 w-4" /> Ferma
                  </Button>
                )}
                <div className="relative flex-1">
                  <input type="file" accept="audio/*" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer" disabled={processing} />
                  <Button variant="outline" className="gap-2 w-full" disabled={processing}>
                    <Upload className="h-4 w-4" /> Carica File Audio
                  </Button>
                </div>
              </div>
              {audioBlob && (
                <div className="bg-muted rounded-lg p-3">
                  <audio controls src={URL.createObjectURL(audioBlob)} className="w-full" />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-lg">📸 Foto Sopralluogo (opzionale)</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                La prima foto verrà usata come copertina del preventivo PDF.
              </p>
              <div className="relative">
                <input type="file" accept="image/*" multiple onChange={handlePhotoUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                <Button variant="outline" className="gap-2 w-full">
                  <Camera className="h-4 w-4" /> Aggiungi Foto
                </Button>
              </div>
              {photosPreviews.length > 0 && (
                <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                  {photosPreviews.map((url, i) => (
                    <div key={i} className="relative group aspect-square rounded-lg overflow-hidden bg-muted">
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      {i === 0 && (
                        <Badge className="absolute top-1 left-1 text-[10px] bg-primary">Copertina</Badge>
                      )}
                      <button
                        onClick={() => removePhoto(i)}
                        className="absolute top-1 right-1 h-6 w-6 rounded-full bg-destructive/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Button onClick={processAudio} disabled={!audioBlob || processing} className="w-full gap-2" size="lg">
            {processing ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Elaborazione AI in corso...</>
            ) : (
              <>🤖 Elabora con AI <ArrowRight className="h-4 w-4" /></>
            )}
          </Button>
        </div>
      )}

      {/* STEP 3 — Visual Editor */}
      {step === 3 && (
        <div className="space-y-6">
          {/* Trascrizione collapsible */}
          {trascrizione && (
            <details className="group">
              <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                📝 Vedi trascrizione originale
              </summary>
              <Card className="mt-2">
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{trascrizione}</p>
                </CardContent>
              </Card>
            </details>
          )}

          {/* Voci Editor by Category */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">📝 Voci Preventivo</CardTitle>
                <Button variant="outline" size="sm" onClick={addVoce} className="gap-1">
                  <Plus className="h-3 w-3" /> Aggiungi Voce
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {categories.map(cat => {
                const catVoci = voci.filter(v => (v.categoria || "Generale") === cat);
                const catTotal = catVoci.reduce((s, v) => s + v.totale, 0);
                return (
                  <div key={cat}>
                    <div className="flex items-center justify-between bg-muted rounded-lg px-3 py-2 mb-2">
                      <span className="text-sm font-semibold text-foreground">{cat}</span>
                      <span className="text-xs font-mono text-muted-foreground">€{catTotal.toFixed(2)}</span>
                    </div>
                    <div className="space-y-3 pl-2">
                      {catVoci.map((v, _ci) => {
                        const globalIdx = voci.indexOf(v);
                        return (
                          <Card key={v.id} className={`border ${v.evidenziata ? "border-yellow-300 bg-yellow-50/50" : ""}`}>
                            <CardContent className="p-3 space-y-3">
                              <div className="flex items-start gap-2">
                                <GripVertical className="h-4 w-4 text-muted-foreground mt-2 flex-shrink-0" />
                                <div className="flex-1 space-y-2">
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                    <div className="md:col-span-2">
                                      <Input
                                        placeholder="Titolo voce"
                                        value={v.titolo_voce}
                                        onChange={e => updateVoce(globalIdx, "titolo_voce", e.target.value)}
                                        className="font-medium"
                                      />
                                    </div>
                                    <Input
                                      placeholder="Categoria"
                                      value={v.categoria}
                                      onChange={e => updateVoce(globalIdx, "categoria", e.target.value)}
                                    />
                                  </div>
                                  <Textarea
                                    placeholder="Descrizione dettagliata..."
                                    value={v.descrizione}
                                    onChange={e => updateVoce(globalIdx, "descrizione", e.target.value)}
                                    rows={2}
                                    className="text-sm"
                                  />
                                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                                    <Select value={v.unita_misura} onValueChange={val => updateVoce(globalIdx, "unita_misura", val)}>
                                      <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                                      <SelectContent>
                                        {UNITS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                                      </SelectContent>
                                    </Select>
                                    <Input
                                      type="number"
                                      placeholder="Q.tà"
                                      value={v.quantita || ""}
                                      onChange={e => updateVoce(globalIdx, "quantita", parseFloat(e.target.value) || 0)}
                                      className="text-right h-9"
                                    />
                                    <Input
                                      type="number"
                                      placeholder="Prezzo €"
                                      value={v.prezzo_unitario || ""}
                                      onChange={e => updateVoce(globalIdx, "prezzo_unitario", parseFloat(e.target.value) || 0)}
                                      className="text-right h-9"
                                    />
                                    <Input
                                      type="number"
                                      placeholder="Sconto %"
                                      value={v.sconto_percentuale || ""}
                                      onChange={e => updateVoce(globalIdx, "sconto_percentuale", parseFloat(e.target.value) || 0)}
                                      className="text-right h-9"
                                    />
                                    <div className="flex items-center justify-end h-9 px-3 bg-muted rounded-md">
                                      <span className="text-sm font-bold">€{v.totale.toFixed(2)}</span>
                                    </div>
                                  </div>
                                  {v.note_voce && (
                                    <p className="text-xs text-amber-600 italic">💡 {v.note_voce}</p>
                                  )}
                                </div>
                                <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" onClick={() => removeVoce(globalIdx)}>
                                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {voci.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Nessuna voce estratta. Aggiungi manualmente.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Totals */}
          <Card>
            <CardContent className="p-4">
              <div className="space-y-2 text-right">
                <div className="flex justify-end gap-8 text-sm">
                  <span className="text-muted-foreground">Subtotale</span>
                  <span className="w-24">€{subtotale.toFixed(2)}</span>
                </div>
                <div className="flex justify-end gap-8 text-sm">
                  <span className="text-muted-foreground">IVA (22%)</span>
                  <span className="w-24">€{ivaImporto.toFixed(2)}</span>
                </div>
                <div className="flex justify-end gap-8 text-lg font-bold border-t pt-2">
                  <span>Totale</span>
                  <span className="w-24 flex items-center justify-end gap-1">
                    <Euro className="h-4 w-4" />{totaleFinale.toFixed(2)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes & Tempi */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="space-y-2">
                <Label>Note generali</Label>
                <Textarea value={noteGenerali} onChange={e => setNoteGenerali(e.target.value)} rows={2} />
              </div>
              <div className="space-y-2">
                <Label>Tempi di esecuzione</Label>
                <Input value={tempiEsecuzione} onChange={e => setTempiEsecuzione(e.target.value)} placeholder="es. 15-20 giorni lavorativi" />
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-3">
            {voci.length > 0 && (
              <PDFDownloadLink
                document={<PreventivoPDF data={pdfData} template={pdfTemplate} />}
                fileName={`preventivo-${titolo || "anteprima"}.pdf`}
              >
                {({ loading }) => (
                  <Button variant="outline" className="gap-2" disabled={loading}>
                    <FileDown className="h-4 w-4" /> {loading ? "Generando..." : "Scarica PDF"}
                  </Button>
                )}
              </PDFDownloadLink>
            )}
            <Button onClick={saveVoci} className="flex-1 gap-2" size="lg">
              💾 Salva Preventivo
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
