import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyId } from "@/hooks/useCompanyId";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import {
  Upload, Loader2, ChevronRight, ChevronLeft, ChevronDown, ChevronUp,
  Zap, Sliders, Sparkles, Check, Download, RotateCcw, Eye, EyeOff,
  Layers, Plus, Repeat, Palette, Trash2, Copy, Heart,
} from "lucide-react";

import {
  buildPersianaPrompt,
  PERSIANE_PROMPT_VERSION,
  type ConfigurazionePersiana,
  type TipoOperazione,
  type TipoPersoniana,
  type MaterialePersiana,
  type StatoApertura,
  type AperturaLamelle,
  type AnalisiPersiana,
  type RalColor,
  type WoodColor,
  type ColorConfig,
} from "@/modules/render-persiane/lib/persianePromptBuilder";

import { PersianaStylePicker } from "@/modules/render-persiane/components/PersianaStylePicker";
import { MaterialePicker } from "@/modules/render-persiane/components/MaterialePicker";
import { LamellaPicker } from "@/modules/render-persiane/components/LamellaPicker";
import { PersianaColorSelector } from "@/modules/render-persiane/components/PersianaColorSelector";
import { StiliProntiPersiane } from "@/modules/render-persiane/components/StiliProntiPersiane";

// ── Constants ──

const STEPS = [
  { id: 1, label: "Foto", icon: Upload },
  { id: 2, label: "Analisi", icon: Zap },
  { id: 3, label: "Configura", icon: Sliders },
  { id: 4, label: "Genera", icon: Sparkles },
  { id: 5, label: "Risultato", icon: Check },
];

const TIPO_OPERAZIONE_OPTIONS: { value: TipoOperazione; label: string; desc: string; icon: React.ReactNode; color: string }[] = [
  { value: "sostituisci", label: "Sostituisci tipo", desc: "Cambia il tipo di persiana mantenendo la posizione", icon: <Repeat className="w-5 h-5" />, color: "blue" },
  { value: "cambia_colore", label: "Cambia colore", desc: "Stesso tipo, colore/finitura diversi", icon: <Palette className="w-5 h-5" />, color: "purple" },
  { value: "aggiungi", label: "Aggiungi persiane", desc: "Installa nuove persiane dove non ce ne sono", icon: <Plus className="w-5 h-5" />, color: "green" },
  { value: "rimuovi", label: "Rimuovi persiane", desc: "Elimina le persiane esistenti dalla facciata", icon: <Trash2 className="w-5 h-5" />, color: "red" },
];

const STATO_APERTURA_OPTIONS: { value: StatoApertura; label: string; emoji: string }[] = [
  { value: "chiuso", label: "Chiuse", emoji: "🚪" },
  { value: "socchiuso", label: "Socchiuse", emoji: "🔓" },
  { value: "aperto_45", label: "Aperte 45°", emoji: "↗" },
  { value: "aperto_90", label: "Aperte 90°", emoji: "↔" },
  { value: "anta_singola_aperta", label: "Anta singola", emoji: "🚪" },
];

// ── Component ──

export default function RenderPersianeNew() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const companyId = useCompanyId();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Step
  const [step, setStep] = useState(1);

  // Step 1
  const [foto, setFoto] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [imageNaturalWidth, setImageNaturalWidth] = useState(0);
  const [imageNaturalHeight, setImageNaturalHeight] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Step 2
  const [analisi, setAnalisi] = useState<AnalisiPersiana | null>(null);
  const [analyzingPhoto, setAnalyzingPhoto] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);

  // Step 3
  const [tipoOperazione, setTipoOperazione] = useState<TipoOperazione>("sostituisci");
  const [tipoPersiana, setTipoPersiana] = useState<TipoPersoniana>("veneziana_classica");
  const [materialePersiana, setMaterialePersiana] = useState<MaterialePersiana>("pvc");
  const [coloreMode, setColoreMode] = useState<"ral" | "legno">("ral");
  const [ralSelezionato, setRalSelezionato] = useState<RalColor | null>(null);
  const [woodSelezionato, setWoodSelezionato] = useState<WoodColor | null>(null);
  const [statoApertura, setStatoApertura] = useState<StatoApertura>("chiuso");
  const [larghezzaLamellaMm, setLarghezzaLamellaMm] = useState(80);
  const [aperturaLamelle, setAperturaLamelle] = useState<AperturaLamelle>("chiuse");
  const [aggiungiATutteFinestre, setAggiungiATutteFinestre] = useState(true);
  const [noteAggiuntive, setNoteAggiuntive] = useState("");

  // Colore profilo
  const [showColoreProfiloSection, setShowColoreProfiloSection] = useState(false);
  const [coloreProfiloMode, setColoreProfiloMode] = useState<"ral" | "legno">("ral");
  const [ralProfilo, setRalProfilo] = useState<RalColor | null>(null);
  const [woodProfilo, setWoodProfilo] = useState<WoodColor | null>(null);

  // Step 4/5
  const [rendering, setRendering] = useState(false);
  const [renderUrl, setRenderUrl] = useState<string | null>(null);
  const [showOriginal, setShowOriginal] = useState(false);
  const [renderStatusMsg, setRenderStatusMsg] = useState("");

  // Debug
  const [showDebugPrompt, setShowDebugPrompt] = useState(false);
  const [debugPromptText, setDebugPromptText] = useState("");

  // ══════════ STEP 1 — Upload ══════════

  const handleFotoSelect = useCallback(async (file: File) => {
    if (!user || !companyId) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Formato non supportato", description: "Carica un'immagine (JPG, PNG, WebP)", variant: "destructive" });
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      toast({ title: "File troppo grande", description: "Massimo 15MB", variant: "destructive" });
      return;
    }

    setUploading(true);
    setAnalyzeError(null);
    setFoto(file);
    const previewUrl = URL.createObjectURL(file);
    setFotoPreview(previewUrl);

    // Detect dimensions
    const { w, h } = await new Promise<{ w: number; h: number }>((resolve) => {
      const img = new Image();
      img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
      img.onerror = () => resolve({ w: 1024, h: 1024 });
      img.src = URL.createObjectURL(file);
    });
    setImageNaturalWidth(w);
    setImageNaturalHeight(h);

    try {
      const { data: session, error: sessErr } = await (supabase.from("render_persiane_sessions") as any)
        .insert({
          user_id: user.id,
          company_id: companyId,
          status: "uploading",
          prompt_version: PERSIANE_PROMPT_VERSION,
          original_width: w,
          original_height: h,
        })
        .select("id")
        .single();

      if (sessErr || !session) throw new Error("Impossibile creare la sessione");
      setSessionId(session.id);

      const ext = file.name.split(".").pop() || "jpg";
      const path = `${companyId}/${session.id}/original.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from("persiane-originals")
        .upload(path, file, { contentType: file.type, upsert: true });
      if (uploadErr) throw new Error(`Upload fallito: ${uploadErr.message}`);

      await (supabase.from("render_persiane_sessions") as any)
        .update({ original_image_path: path, status: "analyzing" })
        .eq("id", session.id);

      setUploading(false);
      await handleAnalyzeShutter(file, session.id);
    } catch (err: any) {
      setUploading(false);
      setAnalyzeError(err.message || String(err));
    }
  }, [user, companyId, toast]);

  // ══════════ STEP 2 — Analisi ══════════

  const handleAnalyzeShutter = async (file: File, sid: string) => {
    setAnalyzingPhoto(true);
    setStep(2);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      let binary = "";
      bytes.forEach((b) => (binary += String.fromCharCode(b)));
      const base64 = btoa(binary);

      const { data, error } = await supabase.functions.invoke("analyze-shutter-photo", {
        body: { image_base64: base64, mime_type: file.type, session_id: sid },
      });

      if (error) throw error;
      if (!data?.analisi) throw new Error("Analisi non ricevuta");

      const analisiData = data.analisi as AnalisiPersiana;
      setAnalisi(analisiData);

      // Pre-populate from analysis
      if (analisiData.tipo_persiana_attuale) {
        const tipoMap: Record<string, TipoPersoniana> = {
          veneziana: "veneziana_classica",
          veneziana_classica: "veneziana_classica",
          scuro: "scuro_pieno",
          scuro_pieno: "scuro_pieno",
          gelosia: "gelosia",
          avvolgibile: "avvolgibile_esterno",
        };
        const mapped = tipoMap[analisiData.tipo_persiana_attuale];
        if (mapped) setTipoPersiana(mapped);
      }

      if (!analisiData.presenza_persiane) {
        setTipoOperazione("aggiungi");
      }

      setAnalyzingPhoto(false);
    } catch (err: any) {
      setAnalyzingPhoto(false);
      setAnalyzeError(`Analisi fallita: ${err.message || String(err)}`);
    }
  };

  // ══════════ STEP 4 — Render ══════════

  const startRender = async () => {
    if (!analisi || !sessionId || !foto) return;
    setRendering(true);
    setStep(4);

    const msgs = [
      "Analisi struttura finestre...",
      "Calcolo proporzioni persiane...",
      "Applicazione materiale e colore...",
      "Rendering finale ad alta risoluzione...",
    ];
    let idx = 0;
    setRenderStatusMsg(msgs[0]);
    const interval = setInterval(() => {
      idx = (idx + 1) % msgs.length;
      setRenderStatusMsg(msgs[idx]);
    }, 4000);

    try {
      const config: ConfigurazionePersiana = {
        tipo_operazione: tipoOperazione,
        tipo_persiana: tipoPersiana,
        materiale: materialePersiana,
        colore: {
          mode: coloreMode,
          ral: coloreMode === "ral" && ralSelezionato ? ralSelezionato : undefined,
          wood: coloreMode === "legno" && woodSelezionato ? woodSelezionato : undefined,
        },
        stato_apertura: statoApertura,
        larghezza_lamella_mm: larghezzaLamellaMm,
        apertura_lamelle: aperturaLamelle,
        colore_profilo: showColoreProfiloSection ? {
          mode: coloreProfiloMode,
          ral: coloreProfiloMode === "ral" && ralProfilo ? ralProfilo : undefined,
          wood: coloreProfiloMode === "legno" && woodProfilo ? woodProfilo : undefined,
        } : undefined,
        aggiungi_a_tutte_finestre: aggiungiATutteFinestre,
        note_aggiuntive: noteAggiuntive.trim() || undefined,
        original_image_width: imageNaturalWidth || undefined,
        original_image_height: imageNaturalHeight || undefined,
      };

      const { userPrompt, systemPrompt } = buildPersianaPrompt(analisi, config);
      setDebugPromptText(`=== SYSTEM PROMPT ===\n${systemPrompt}\n\n=== USER PROMPT ===\n${userPrompt}`);

      // Update session
      await (supabase.from("render_persiane_sessions") as any)
        .update({
          tipo_operazione: tipoOperazione,
          tipo_persiana: tipoPersiana,
          materiale_persiana: materialePersiana,
          colore_mode: coloreMode,
          colore_ral_code: coloreMode === "ral" ? ralSelezionato?.ral : null,
          colore_ral_name: coloreMode === "ral" ? ralSelezionato?.name : null,
          colore_ral_hex: coloreMode === "ral" ? ralSelezionato?.hex : null,
          colore_wood_id: coloreMode === "legno" ? woodSelezionato?.id : null,
          colore_wood_name: coloreMode === "legno" ? woodSelezionato?.name : null,
          stato_apertura: statoApertura,
          larghezza_lamella_mm: larghezzaLamellaMm,
          apertura_lamelle: aperturaLamelle,
          note_aggiuntive: noteAggiuntive.trim() || null,
          prompt_user: userPrompt,
          prompt_system: systemPrompt,
          status: "rendering",
        })
        .eq("id", sessionId);

      // Convert photo to base64
      const arrayBuffer = await foto.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      let binary = "";
      bytes.forEach((b) => (binary += String.fromCharCode(b)));
      const base64 = btoa(binary);

      const { data, error } = await supabase.functions.invoke("generate-shutter-render", {
        body: {
          image_base64: base64,
          mime_type: foto.type,
          prompt: userPrompt,
          system_prompt: systemPrompt,
          session_id: sessionId,
          target_width: imageNaturalWidth || undefined,
          target_height: imageNaturalHeight || undefined,
        },
      });

      clearInterval(interval);
      if (error) throw error;
      if (!data?.result_url) throw new Error("URL risultato non ricevuto");

      setRenderUrl(data.result_url);

      await (supabase.from("render_persiane_sessions") as any)
        .update({ result_image_url: data.result_url, status: "completed" })
        .eq("id", sessionId);

      toast({ title: "🎉 Render completato!", description: "La tua persiana virtuale è pronta" });
      setRendering(false);
      setStep(5);
    } catch (err: any) {
      clearInterval(interval);
      setRendering(false);
      toast({ title: "Errore generazione", description: String(err), variant: "destructive" });
      setStep(3);
    }
  };

  // ══════════ Salva gallery ══════════

  const saveToGallery = async () => {
    if (!renderUrl || !sessionId || !user || !companyId) return;
    try {
      await (supabase.from("render_persiane_gallery") as any).insert({
        user_id: user.id,
        company_id: companyId,
        session_id: sessionId,
        result_image_url: renderUrl,
        tipo_operazione: tipoOperazione,
        tipo_persiana: tipoPersiana,
        materiale: materialePersiana,
        colore_mode: coloreMode,
        colore_ral_code: coloreMode === "ral" ? ralSelezionato?.ral : null,
        colore_wood_name: coloreMode === "legno" ? woodSelezionato?.name : null,
        is_favorite: false,
      });
      toast({ title: "✅ Salvato in galleria!" });
    } catch (err) {
      toast({ title: "Errore salvataggio", description: String(err), variant: "destructive" });
    }
  };

  // ══════════ Drag & drop ══════════

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFotoSelect(file);
  }, [handleFotoSelect]);

  // ══════════ JSX ══════════

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-12">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <button onClick={() => navigate("/app/render-persiane")} className="hover:text-foreground">Render Persiane</button>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-foreground font-medium">Nuovo Render</span>
      </div>

      {/* Step indicator */}
      <div className="flex items-center justify-between">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const isActive = step === s.id;
          const isDone = step > s.id;
          return (
            <div key={s.id} className="flex items-center gap-1">
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                isActive ? "bg-primary text-primary-foreground" :
                isDone ? "bg-primary/20 text-primary" :
                "bg-muted text-muted-foreground"
              }`}>
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{s.label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`w-4 sm:w-8 h-px mx-0.5 ${isDone ? "bg-primary" : "bg-border"}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* ═══ STEP 1 — UPLOAD ═══ */}
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-bold text-foreground">Carica la foto</h2>
            <p className="text-sm text-muted-foreground">Fotografia della facciata o delle finestre con (o senza) persiane esistenti</p>
          </div>

          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className="border-2 border-dashed border-border rounded-2xl p-12 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/20 transition-all"
          >
            {fotoPreview ? (
              <div className="space-y-2">
                <img src={fotoPreview} alt="anteprima" className="w-full max-h-96 object-contain rounded-xl" />
                <p className="text-xs text-muted-foreground">
                  {foto?.name} · {imageNaturalWidth > 0 && `${imageNaturalWidth}×${imageNaturalHeight}px · `}
                  {foto && `${(foto.size / 1024 / 1024).toFixed(1)}MB`}
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
                  <Upload className="w-7 h-7 text-muted-foreground" />
                </div>
                <p className="font-medium text-foreground">Trascina la foto qui</p>
                <p className="text-xs text-muted-foreground">oppure clicca per selezionare · JPG, PNG, WebP · Max 15MB</p>
              </div>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFotoSelect(e.target.files[0])}
          />

          {/* Stili pronti in step 1 */}
          <StiliProntiPersiane
            onApply={(config) => {
              if (config.tipo_operazione) setTipoOperazione(config.tipo_operazione as TipoOperazione);
              if (config.tipo_persiana) setTipoPersiana(config.tipo_persiana as TipoPersoniana);
              if (config.materiale) setMaterialePersiana(config.materiale as MaterialePersiana);
              if (config.colore_mode) setColoreMode(config.colore_mode);
              if (config.stato_apertura) setStatoApertura(config.stato_apertura as StatoApertura);
              if (config.larghezza_lamella_mm) setLarghezzaLamellaMm(config.larghezza_lamella_mm);
              toast({ title: "✅ Stile applicato!" });
            }}
          />

          <div className="p-3 rounded-xl bg-muted/50 text-xs text-muted-foreground space-y-1">
            <p className="font-medium text-foreground">📸 Consigli per ottenere il miglior risultato</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li>Foto frontale alla facciata, possibilmente di giorno</li>
              <li>Le finestre devono essere ben visibili e non tagliate</li>
              <li>Evita angolazioni estreme o distorsioni prospettiche</li>
              <li>Risoluzione minima consigliata: 1200×800px</li>
            </ul>
          </div>

          {uploading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Caricamento in corso...
            </div>
          )}

          {analyzeError && (
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20">
              <p className="text-sm text-destructive">{analyzeError}</p>
            </div>
          )}
        </div>
      )}

      {/* ═══ STEP 2 — ANALISI ═══ */}
      {step === 2 && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-bold text-foreground">Analisi AI in corso</h2>
            <p className="text-sm text-muted-foreground">Stiamo analizzando la tua foto…</p>
          </div>

          {fotoPreview && (
            <img src={fotoPreview} alt="foto" className="w-full rounded-2xl max-h-64 object-cover" />
          )}

          {analyzingPhoto && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/50">
              <div className="relative w-10 h-10">
                <div className="w-10 h-10 rounded-full border-2 border-primary/30 animate-pulse" />
                <Layers className="absolute inset-0 m-auto w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Rilevamento persiane...</p>
                <p className="text-xs text-muted-foreground">Tipo, materiale, colore e stato apertura</p>
              </div>
            </div>
          )}

          {analisi && !analyzingPhoto && (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                <Check className="w-4 h-4 text-primary" /> Analisi completata
              </p>

              <div className="flex flex-wrap gap-1.5">
                <Badge variant={analisi.presenza_persiane ? "default" : "secondary"}>
                  {analisi.presenza_persiane ? "✅ Persiane" : "❌ No persiane"}
                </Badge>
                {analisi.tipo_persiana_attuale && <Badge variant="outline">Tipo: {analisi.tipo_persiana_attuale}</Badge>}
                {analisi.materiale_attuale && <Badge variant="outline">Materiale: {analisi.materiale_attuale}</Badge>}
                {analisi.colore_persiana && <Badge variant="outline">Colore: {analisi.colore_persiana}</Badge>}
                {analisi.stato_apertura && <Badge variant="outline">Stato: {analisi.stato_apertura}</Badge>}
                <Badge variant="outline">Cassonetto: {analisi.presenza_cassonetto ? "Sì" : "No"}</Badge>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Finestre totali", value: analisi.numero_finestre_totali },
                  { label: "Con persiane", value: analisi.numero_finestre_con_persiane },
                  { label: "Lamella stimata", value: analisi.larghezza_lamella_stimata_mm ? `${analisi.larghezza_lamella_stimata_mm}mm` : "—" },
                  { label: "Rivelazione", value: analisi.profondita_rivelazione_cm ? `${analisi.profondita_rivelazione_cm}cm` : "—" },
                ].map((item) => (
                  <div key={item.label} className="p-2 rounded-lg bg-muted/50">
                    <p className="text-[10px] text-muted-foreground uppercase">{item.label}</p>
                    <p className="text-sm font-medium text-foreground">{item.value ?? "—"}</p>
                  </div>
                ))}
              </div>

              {analisi.note_speciali && (
                <p className="text-xs text-muted-foreground">⚠ {analisi.note_speciali}</p>
              )}

              <Button onClick={() => setStep(3)} className="w-full">
                Configura le persiane <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}

          {analyzeError && !analyzingPhoto && (
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 space-y-1">
              <p className="text-sm text-destructive">{analyzeError}</p>
              <button onClick={() => { setStep(1); setAnalyzeError(null); }} className="text-xs text-destructive underline">
                Riprova con un'altra foto
              </button>
            </div>
          )}
        </div>
      )}

      {/* ═══ STEP 3 — CONFIGURAZIONE ═══ */}
      {step === 3 && analisi && (
        <div className="space-y-5">
          <div>
            <h2 className="text-lg font-bold text-foreground">Configura le persiane</h2>
            <p className="text-sm text-muted-foreground">Scegli cosa vuoi fare e come deve apparire il risultato</p>
          </div>

          {fotoPreview && (
            <Card>
              <CardContent className="p-2">
                <img src={fotoPreview} alt="foto" className="w-full rounded-lg max-h-32 object-cover" />
              </CardContent>
            </Card>
          )}

          {/* Tipo operazione */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Cosa vuoi fare?</Label>
            <div className="space-y-2">
              {TIPO_OPERAZIONE_OPTIONS.map((op) => {
                const isSelected = tipoOperazione === op.value;
                return (
                  <button
                    key={op.value}
                    onClick={() => setTipoOperazione(op.value)}
                    className={`w-full flex items-start gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                      isSelected
                        ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                        : "border-border hover:border-primary/30"
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                      {op.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{op.label}</p>
                      <p className="text-xs text-muted-foreground">{op.desc}</p>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />}
                  </button>
                );
              })}
            </div>
          </div>

          {tipoOperazione !== "rimuovi" && (
            <>
              {/* Tipo persiana */}
              {(tipoOperazione === "sostituisci" || tipoOperazione === "aggiungi") && (
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Tipo persiana</Label>
                  <PersianaStylePicker value={tipoPersiana} onChange={setTipoPersiana} />
                </div>
              )}

              {/* Materiale */}
              {(tipoOperazione === "sostituisci" || tipoOperazione === "aggiungi") && (
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Materiale</Label>
                  <MaterialePicker value={materialePersiana} onChange={setMaterialePersiana} tipoPersiana={tipoPersiana} />
                </div>
              )}

              {/* Colore */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">
                  {tipoOperazione === "cambia_colore" ? "Nuovo colore" : "Colore persiana"}
                </Label>
                <PersianaColorSelector
                  mode={coloreMode}
                  onModeChange={setColoreMode}
                  ralValue={ralSelezionato}
                  onRalChange={setRalSelezionato}
                  woodValue={woodSelezionato}
                  onWoodChange={setWoodSelezionato}
                  materialePersiana={materialePersiana}
                />
              </div>

              {/* Lamelle (solo veneziane) */}
              {(tipoPersiana === "veneziana_classica" || tipoPersiana === "veneziana_esterna") && (
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Configurazione lamelle</Label>
                  <LamellaPicker
                    larghezza={larghezzaLamellaMm}
                    onLarghezzaChange={setLarghezzaLamellaMm}
                    apertura={aperturaLamelle}
                    onAperturaChange={setAperturaLamelle}
                  />
                </div>
              )}

              {/* Stato apertura */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Stato apertura nel render</Label>
                <div className="grid grid-cols-5 gap-2">
                  {STATO_APERTURA_OPTIONS.map((s) => (
                    <button
                      key={s.value}
                      onClick={() => setStatoApertura(s.value)}
                      className={`p-2 rounded-lg border-2 text-center transition-colors ${
                        statoApertura === s.value
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/30"
                      }`}
                    >
                      <span className="text-lg">{s.emoji}</span>
                      <p className="text-[10px] font-medium text-foreground mt-0.5">{s.label}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Aggiungi a tutte */}
              {tipoOperazione === "aggiungi" && (
                <div className="flex items-center justify-between p-3 rounded-xl border border-border">
                  <div>
                    <p className="text-sm font-medium text-foreground">Applica a tutte le finestre</p>
                    <p className="text-xs text-muted-foreground">Aggiunge le persiane a ogni finestra visibile</p>
                  </div>
                  <Switch checked={aggiungiATutteFinestre} onCheckedChange={setAggiungiATutteFinestre} />
                </div>
              )}

              {/* Colore profilo toggle */}
              <button
                onClick={() => setShowColoreProfiloSection(!showColoreProfiloSection)}
                className="flex items-center gap-2 text-sm text-primary hover:text-primary/80"
              >
                {showColoreProfiloSection ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                {showColoreProfiloSection ? "Nascondi" : "Aggiungi"} colore profilo/cornice (opzionale)
              </button>

              {showColoreProfiloSection && (
                <div className="space-y-2 pl-2 border-l-2 border-primary/20">
                  <p className="text-xs text-muted-foreground">Colore del profilo/cornice della persiana (diverso dal colore delle lamelle)</p>
                  <PersianaColorSelector
                    mode={coloreProfiloMode}
                    onModeChange={setColoreProfiloMode}
                    ralValue={ralProfilo}
                    onRalChange={setRalProfilo}
                    woodValue={woodProfilo}
                    onWoodChange={setWoodProfilo}
                    materialePersiana={materialePersiana}
                    label="Colore profilo/cornice"
                  />
                </div>
              )}
            </>
          )}

          {/* Rimuovi info */}
          {tipoOperazione === "rimuovi" && (
            <Card className="bg-destructive/5 border-destructive/20">
              <CardContent className="p-4 space-y-2">
                <p className="text-sm font-semibold text-destructive">🗑 Rimozione persiane</p>
                <p className="text-xs text-muted-foreground">
                  L'AI rimuoverà tutte le persiane visibili mostrando la facciata pulita. 
                  Il muro/intonaco dietro le persiane verrà ricostruito in modo credibile.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Note aggiuntive */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Note aggiuntive (opzionale)</Label>
            <Textarea
              value={noteAggiuntive}
              onChange={(e) => setNoteAggiuntive(e.target.value)}
              placeholder="Es: Applica solo alle finestre del primo piano..."
              className="text-sm resize-none"
              rows={3}
            />
          </div>

          {/* Debug panel */}
          {import.meta.env.DEV && (
            <div className="border border-amber-200 rounded-xl overflow-hidden">
              <button
                onClick={() => {
                  setShowDebugPrompt(!showDebugPrompt);
                  if (!showDebugPrompt && analisi) {
                    const previewConfig: ConfigurazionePersiana = {
                      tipo_operazione: tipoOperazione,
                      tipo_persiana: tipoPersiana,
                      materiale: materialePersiana,
                      colore: {
                        mode: coloreMode,
                        ral: coloreMode === "ral" && ralSelezionato ? ralSelezionato : undefined,
                        wood: coloreMode === "legno" && woodSelezionato ? woodSelezionato : undefined,
                      },
                      stato_apertura: statoApertura,
                      larghezza_lamella_mm: larghezzaLamellaMm,
                      apertura_lamelle: aperturaLamelle,
                      aggiungi_a_tutte_finestre: aggiungiATutteFinestre,
                      original_image_width: imageNaturalWidth,
                      original_image_height: imageNaturalHeight,
                    };
                    const { userPrompt, systemPrompt } = buildPersianaPrompt(analisi, previewConfig);
                    setDebugPromptText(`=== SYSTEM PROMPT ===\n${systemPrompt}\n\n=== USER PROMPT ===\n${userPrompt}`);
                  }
                }}
                className="w-full flex items-center justify-between px-4 py-2 bg-amber-50 dark:bg-amber-950/30"
              >
                <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">🔍 Debug Prompt</span>
                <span className="text-xs text-amber-600 dark:text-amber-500">{imageNaturalWidth}×{imageNaturalHeight}px</span>
              </button>
              {showDebugPrompt && debugPromptText && (
                <div className="relative">
                  <pre className="text-xs text-amber-900 dark:text-amber-200 p-3 bg-amber-50/50 dark:bg-amber-950/20 max-h-48 overflow-y-auto font-mono whitespace-pre-wrap">
                    {debugPromptText}
                  </pre>
                  <button
                    onClick={() => navigator.clipboard.writeText(debugPromptText)}
                    className="absolute top-2 right-2 p-1 bg-amber-100 rounded hover:bg-amber-200"
                  >
                    <Copy className="w-3 h-3 text-amber-700" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={() => setStep(2)} className="flex-shrink-0">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              className="flex-1 h-12 text-base font-semibold"
              onClick={startRender}
              disabled={rendering || (!ralSelezionato && !woodSelezionato && tipoOperazione !== "rimuovi")}
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Genera Render Persiane
            </Button>
          </div>
        </div>
      )}

      {/* ═══ STEP 4 — GENERAZIONE ═══ */}
      {step === 4 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-bold text-foreground">Generazione in corso</h2>
            <p className="text-sm text-muted-foreground">L'AI sta modificando la tua facciata…</p>
          </div>

          {fotoPreview && (
            <div className="relative">
              <img src={fotoPreview} alt="foto originale" className="w-full rounded-2xl opacity-50" />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                <div className="relative w-16 h-16">
                  <div className="w-16 h-16 rounded-full border-4 border-primary/30 animate-spin border-t-primary" />
                  <Layers className="absolute inset-0 m-auto w-6 h-6 text-primary" />
                </div>
                <div className="bg-background/90 backdrop-blur-sm rounded-xl px-4 py-2 text-center">
                  <p className="text-sm font-semibold text-foreground">{renderStatusMsg}</p>
                  <p className="text-xs text-muted-foreground mt-1">Il processo richiede circa 15-30 secondi</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══ STEP 5 — RISULTATO ═══ */}
      {step === 5 && renderUrl && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-bold text-foreground">Render completato! 🎉</h2>
            <p className="text-sm text-muted-foreground">
              {TIPO_OPERAZIONE_OPTIONS.find((o) => o.value === tipoOperazione)?.label}
              {tipoOperazione !== "rimuovi" && ` · ${tipoPersiana.replace(/_/g, " ")}`}
            </p>
          </div>

          <div className="relative rounded-2xl overflow-hidden border border-border shadow-lg">
            <img
              src={showOriginal ? fotoPreview! : renderUrl}
              alt={showOriginal ? "Originale" : "Render"}
              className="w-full object-contain"
            />
            <div className="absolute top-3 right-3">
              <button
                onClick={() => setShowOriginal(!showOriginal)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-black/60 text-white rounded-lg text-xs font-medium backdrop-blur-sm"
              >
                {showOriginal ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                {showOriginal ? "Render" : "Originale"}
              </button>
            </div>
            <div className="absolute bottom-3 left-3">
              <span className="px-2.5 py-1 bg-black/60 text-white rounded-lg text-xs backdrop-blur-sm">
                {showOriginal ? "📷 Prima" : "✨ Dopo — Render AI"}
              </span>
            </div>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-1.5">
            <Badge variant="outline" className="text-xs">{tipoOperazione.replace(/_/g, " ")}</Badge>
            {tipoOperazione !== "rimuovi" && (
              <>
                <Badge variant="outline" className="text-xs">{tipoPersiana.replace(/_/g, " ")}</Badge>
                <Badge variant="outline" className="text-xs">{materialePersiana}</Badge>
                {coloreMode === "ral" && ralSelezionato && (
                  <Badge variant="outline" className="text-xs flex items-center gap-1">
                    <div className="w-2.5 h-2.5 rounded-full border" style={{ backgroundColor: ralSelezionato.hex }} />
                    RAL {ralSelezionato.ral}
                  </Badge>
                )}
                {coloreMode === "legno" && woodSelezionato && (
                  <Badge variant="outline" className="text-xs">🪵 {woodSelezionato.name}</Badge>
                )}
                <Badge variant="outline" className="text-xs">{statoApertura.replace(/_/g, " ")}</Badge>
              </>
            )}
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-3">
            <a
              href={renderUrl}
              download={`persiana-render-${Date.now()}.jpg`}
              className="flex items-center justify-center gap-2 h-11 rounded-xl border border-border bg-background hover:bg-muted/50 text-sm font-medium transition-colors"
            >
              <Download className="w-4 h-4" />
              Scarica
            </a>
            <button
              onClick={saveToGallery}
              className="flex items-center justify-center gap-2 h-11 rounded-xl border border-border bg-background hover:bg-muted/50 text-sm font-medium transition-colors"
            >
              <Heart className="w-4 h-4" />
              Salva in galleria
            </button>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => { setStep(3); setRenderUrl(null); }}>
              <RotateCcw className="w-4 h-4 mr-2" /> Nuovo render
            </Button>
            <Button className="flex-1" onClick={() => navigate("/app/render-persiane")}>
              Vai alla galleria
            </Button>
          </div>

          {/* Debug in step 5 */}
          {import.meta.env.DEV && debugPromptText && (
            <div className="border border-amber-200 rounded-xl overflow-hidden">
              <button
                onClick={() => setShowDebugPrompt(!showDebugPrompt)}
                className="w-full flex items-center justify-between px-4 py-2 bg-amber-50 dark:bg-amber-950/30"
              >
                <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">🔍 Prompt usato (DEV)</span>
              </button>
              {showDebugPrompt && (
                <div className="relative">
                  <pre className="text-xs text-amber-900 dark:text-amber-200 p-3 bg-amber-50/50 dark:bg-amber-950/20 max-h-48 overflow-y-auto font-mono whitespace-pre-wrap">
                    {debugPromptText}
                  </pre>
                  <button
                    onClick={() => navigator.clipboard.writeText(debugPromptText)}
                    className="absolute top-2 right-2 p-1 bg-amber-100 rounded hover:bg-amber-200"
                  >
                    <Copy className="w-3 h-3 text-amber-700" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
