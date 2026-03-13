import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyId } from "@/hooks/useCompanyId";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Upload, Loader2, ChevronRight, ChevronLeft,
  Home, Zap, Sliders, Sparkles, Check,
  Download, RotateCcw, Heart, Eye, EyeOff,
} from "lucide-react";

import {
  buildFacciataPrompt,
  FACCIATA_PROMPT_VERSION,
  FINITURA_PROMPTS,
  type AnalysiFacciata,
  type ConfigurazioneFacciata,
  type TipoInterventoFacciata,
  type ConfigColoreIntonaco,
  type ConfigRivestimento,
  type ConfigCappotto,
  type ConfigElementiArchitettonici,
} from "@/modules/render-facciata/lib/facciataPromptBuilder";

import { ColoreIntonacoSelector } from "@/modules/render-facciata/components/ColoreIntonacoSelector";
import { RivestimentoPicker } from "@/modules/render-facciata/components/RivestimentoPicker";
import { CappottoConfigurator } from "@/modules/render-facciata/components/CappottoConfigurator";
import { ElementiArchitettoniciPanel } from "@/modules/render-facciata/components/ElementiArchitettoniciPanel";
import { StiliProntiFacciata } from "@/modules/render-facciata/components/StiliProntiFacciata";

// ── COSTANTI ────────────────────────────────────────────────────

const STEP_LABELS = [
  { n: 1, label: "Foto", icon: Upload },
  { n: 2, label: "Analisi", icon: Zap },
  { n: 3, label: "Configura", icon: Sliders },
  { n: 4, label: "Genera", icon: Sparkles },
  { n: 5, label: "Risultato", icon: Check },
];

const TIPO_INTERVENTO_OPTIONS: {
  value: TipoInterventoFacciata;
  label: string;
  sub: string;
  emoji: string;
  desc: string;
}[] = [
  { value: "tinteggiatura", label: "Tinteggiatura", sub: "Solo cambio colore", emoji: "🎨", desc: "Cambia il colore dell'intonaco esistente. Scegli il nuovo colore e la finitura." },
  { value: "cappotto", label: "Cappotto Termico", sub: "Isolamento + tinteggiatura", emoji: "🏠", desc: "Aggiungi un cappotto termico con nuova tinteggiatura. Le finestre appariranno più incassate." },
  { value: "rivestimento", label: "Rivestimento", sub: "Pietra o laterizio", emoji: "🪨", desc: "Applica un rivestimento in pietra naturale o laterizio su tutta la facciata o su zone specifiche." },
  { value: "misto", label: "Misto", sub: "Rivestimento + tinteggiatura", emoji: "🔲", desc: "Combina rivestimento in pietra/laterizio (es. piano terra) con tinteggiatura (piani superiori)." },
  { value: "rifacimento_totale", label: "Rifacimento Totale", sub: "Nuovo intonaco da zero", emoji: "✨", desc: "Rifacimento completo dell'intonaco: facciata perfetta, regolare, senza difetti." },
];

// ── DEFAULT ─────────────────────────────────────────────────────

const DEFAULT_COLORE: ConfigColoreIntonaco = {
  colore_id: "bianco_antico",
  colore_name: "Bianco Antico",
  colore_hex: "#EDE8DC",
  prompt_fragment: "antique warm white plaster with slight cream undertone — classic Italian residential",
  finitura: "graffiato_fine",
  finitura_prompt: FINITURA_PROMPTS["graffiato_fine"],
};

const DEFAULT_CAPPOTTO: ConfigCappotto = {
  spessore_cm: 10,
  sistema: "eps",
  colore: DEFAULT_COLORE,
};

// ── COMPONENTE ──────────────────────────────────────────────────

export default function RenderFacciataNew() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const companyId = useCompanyId();
  const { toast } = useToast();

  // Step
  const [step, setStep] = useState(1);

  // Step 1: Upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [originalStoragePath, setOriginalStoragePath] = useState<string | null>(null);
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [imageNaturalWidth, setImageNaturalWidth] = useState(1024);
  const [imageNaturalHeight, setImageNaturalHeight] = useState(1024);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Step 2: Analysis
  const [analisi, setAnalisi] = useState<AnalysiFacciata | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);

  // Step 3: Config
  const [tipoIntervento, setTipoIntervento] = useState<TipoInterventoFacciata>("tinteggiatura");
  const [coloreIntonaco, setColoreIntonaco] = useState<ConfigColoreIntonaco>(DEFAULT_COLORE);
  const [rivestimento, setRivestimento] = useState<ConfigRivestimento | null>(null);
  const [cappotto, setCappotto] = useState<ConfigCappotto>(DEFAULT_CAPPOTTO);
  const [elementi, setElementi] = useState<ConfigElementiArchitettonici>({
    cornici_finestre: { cambia: false },
    marcapiani: { cambia: false },
    davanzali: { cambia: false },
    zoccolatura: { cambia: false },
  });
  const [noteAggiuntive, setNoteAggiuntive] = useState("");

  // Step 4: Generation
  const [rendering, setRendering] = useState(false);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [renderStatusMsg, setRenderStatusMsg] = useState("");

  // Step 5: Result
  const [renderUrl, setRenderUrl] = useState<string | null>(null);
  const [showOriginal, setShowOriginal] = useState(false);

  // Debug
  const [showDebugPrompt, setShowDebugPrompt] = useState(false);
  const [debugPromptText, setDebugPromptText] = useState("");

  // ════════════════════════════════════════════
  // STEP 1 — Upload foto
  // ════════════════════════════════════════════

  const handleFotoSelect = useCallback(async (file: File) => {
    if (!user || !companyId) return;

    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      toast({ title: "Formato non supportato", description: "Usa JPG, PNG o WEBP.", variant: "destructive" });
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      toast({ title: "File troppo grande", description: "Massimo 15MB.", variant: "destructive" });
      return;
    }

    setUploading(true);
    setAnalyzeError(null);
    setFotoFile(file);

    if (fotoPreview) URL.revokeObjectURL(fotoPreview);
    const previewUrl = URL.createObjectURL(file);
    setFotoPreview(previewUrl);

    // Detect dimensions — reuse existing previewUrl instead of creating a second blob URL
    const { w, h } = await new Promise<{ w: number; h: number }>((resolve) => {
      const img = new Image();
      img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
      img.onerror = () => resolve({ w: 1024, h: 1024 });
      img.src = previewUrl;
    });
    setImageNaturalWidth(w);
    setImageNaturalHeight(h);

    try {
      // Create session
      const { data: session, error: sessErr } = await supabase
        .from("render_facciata_sessions")
        .insert({
          user_id: user.id,
          company_id: companyId,
          status: "pending",
          original_width: w,
          original_height: h,
        } as any)
        .select("id")
        .single();

      if (sessErr || !session) throw new Error("Impossibile creare la sessione");
      setSessionId(session.id);

      // Upload to storage
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${companyId}/${session.id}/original.${ext}`;

      const { error: uploadErr } = await supabase.storage
        .from("facciata-originals")
        .upload(path, file, { contentType: file.type });
      if (uploadErr) throw new Error(`Upload fallito: ${uploadErr.message}`);
      setOriginalStoragePath(path);

      // Update session with path
      await supabase.from("render_facciata_sessions")
        .update({ original_path: path } as any)
        .eq("id", session.id);

      setUploading(false);

      // Start analysis
      await handleAnalyze(path, session.id);
    } catch (err: any) {
      setUploading(false);
      setAnalyzeError(err.message || String(err));
    }
  }, [user, companyId, toast]);

  // ════════════════════════════════════════════
  // STEP 2 — Analisi AI
  // ════════════════════════════════════════════

  const handleAnalyze = async (storagePath: string, sessId: string) => {
    setAnalyzing(true);
    setStep(2);

    try {
      // Get signed URL for the photo
      const { data: signedData, error: signedErr } = await supabase.storage
        .from("facciata-originals")
        .createSignedUrl(storagePath, 3600);
      if (signedErr || !signedData?.signedUrl) throw new Error("Impossibile creare URL firmato");

      const { data, error } = await supabase.functions.invoke("analyze-facade-photo", {
        body: { image_url: signedData.signedUrl },
      });

      if (error) throw new Error(error.message);
      const payload = (data?.data ?? data) as Record<string, unknown>;
      const analysisResult = payload?.analysis ?? payload?.analisi;
      if (!analysisResult) throw new Error("Analisi non ricevuta");

      setAnalisi(analysisResult as AnalysiFacciata);
      setAnalyzing(false);
      setStep(3);
    } catch (err: any) {
      setAnalyzing(false);
      setAnalyzeError(`Analisi fallita: ${err.message || String(err)}`);
    }
  };

  // ════════════════════════════════════════════
  // STEP 4 — Generazione render
  // ════════════════════════════════════════════

  const startRender = async () => {
    if (!analisi || !sessionId) return;

    setRendering(true);
    setRenderError(null);
    setStep(4);

    const msgs = [
      "Analizzando la struttura della facciata...",
      "Preparando la configurazione materiali...",
      "Generando il render fotorealistico...",
      "Applicando il trattamento superficiale...",
      "Rifinitura finale in corso...",
    ];
    let idx = 0;
    setRenderStatusMsg(msgs[0]);
    const interval = setInterval(() => {
      idx = (idx + 1) % msgs.length;
      setRenderStatusMsg(msgs[idx]);
    }, 4000);

    try {
      const config: ConfigurazioneFacciata = {
        tipo_intervento: tipoIntervento,
        colore_intonaco: ["tinteggiatura", "misto", "rifacimento_totale"].includes(tipoIntervento) ? coloreIntonaco : undefined,
        rivestimento: ["rivestimento", "misto"].includes(tipoIntervento) ? rivestimento ?? undefined : undefined,
        cappotto: tipoIntervento === "cappotto" ? cappotto : undefined,
        elementi,
        original_image_width: imageNaturalWidth,
        original_image_height: imageNaturalHeight,
        note_aggiuntive: noteAggiuntive || undefined,
      };

      const { userPrompt, systemPrompt, negativePrompt } = buildFacciataPrompt(analisi, config);

      setDebugPromptText(
        `=== SYSTEM PROMPT ===\n${systemPrompt}\n\n=== USER PROMPT ===\n${userPrompt}\n\n=== NEGATIVE ===\n${negativePrompt}\n\n=== DIMENSIONS ===\n${imageNaturalWidth}×${imageNaturalHeight}px`
      );

      const { data, error } = await supabase.functions.invoke("generate-facade-render", {
        body: {
          session_id: sessionId,
          user_prompt: userPrompt,
          system_prompt: systemPrompt,
          negative_prompt: negativePrompt,
          prompt_version: FACCIATA_PROMPT_VERSION,
        },
      });

      clearInterval(interval);

      if (error) throw new Error(error.message);
      const renderPayload = (data?.data ?? data) as Record<string, unknown>;
      const resultUrl = renderPayload?.result_url || renderPayload?.render_url;
      if (!resultUrl) throw new Error("Render URL non ricevuto");

      setRenderUrl(resultUrl as string);
      setRendering(false);
      setStep(5);
    } catch (err: any) {
      clearInterval(interval);
      setRendering(false);
      setRenderError(err.message || String(err));
    }
  };

  // ════════════════════════════════════════════
  // Salva in galleria
  // ════════════════════════════════════════════

  const saveToGallery = async () => {
    if (!user || !sessionId || !renderUrl || !companyId) return;

    const coloreLabel =
      tipoIntervento === "cappotto" ? cappotto.colore.colore_name :
      tipoIntervento === "rivestimento" ? rivestimento?.tipo_name ?? "" :
      coloreIntonaco.colore_name;

    // Get a long-lived signed URL for the original (facciata-originals is PRIVATE)
    let originalUrlForGallery = '';
    if (originalStoragePath) {
      const { data: signedOrig } = await supabase.storage.from("facciata-originals").createSignedUrl(originalStoragePath, 31536000);
      originalUrlForGallery = signedOrig?.signedUrl || '';
    }

    const { error } = await supabase.from("render_facciata_gallery").insert({
      user_id: user.id,
      company_id: companyId,
      session_id: sessionId,
      original_url: originalUrlForGallery,
      render_url: renderUrl,
      title: `${tipoIntervento.replace(/_/g, " ")} — ${coloreLabel}`,
      tipo_intervento: tipoIntervento,
      colore_name: coloreLabel,
    } as any);

    if (error) {
      toast({ title: "Errore salvataggio", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Salvato in galleria! ❤️" });
    }
  };

  // ════════════════════════════════════════════
  // JSX
  // ════════════════════════════════════════════

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-12">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <button onClick={() => navigate("/app/render-facciata")} className="hover:text-foreground">
          Render Facciata
        </button>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-foreground font-medium">Nuovo Render</span>
      </div>

      {/* Step indicator */}
      <div className="flex items-center justify-between">
        {STEP_LABELS.map((s, i) => {
          const Icon = s.icon;
          const isActive = step === s.n;
          const isDone = step > s.n;
          return (
            <div key={s.n} className="flex items-center gap-1">
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                isActive ? "bg-primary text-primary-foreground" :
                isDone ? "bg-primary/20 text-primary" :
                "bg-muted text-muted-foreground"
              }`}>
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{s.label}</span>
              </div>
              {i < STEP_LABELS.length - 1 && (
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
            <h2 className="text-lg font-bold text-foreground">Carica la foto della facciata</h2>
            <p className="text-sm text-muted-foreground">Usa una foto frontale ad alta risoluzione. JPG, PNG o WEBP fino a 15MB.</p>
          </div>

          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-border rounded-2xl p-6 md:p-12 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/20 transition-all"
          >
            {fotoPreview ? (
              <img src={fotoPreview} alt="anteprima" className="w-full max-h-[50vh] object-contain rounded-xl" />
            ) : (
              <div className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
                  <Upload className="w-7 h-7 text-muted-foreground" />
                </div>
                <p className="font-medium text-foreground">Clicca per caricare</p>
                <p className="text-xs text-muted-foreground">o trascina qui la foto</p>
              </div>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            capture="environment"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFotoSelect(e.target.files[0])}
          />

          <div className="p-3 rounded-xl bg-muted/50 text-xs text-muted-foreground space-y-1">
            <p className="font-medium text-foreground">📸 Consigli per una foto ottimale:</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li>Foto frontale (non in angolo)</li>
              <li>Facciata centrata nell'inquadratura</li>
              <li>Buona illuminazione, senza ombre eccessive</li>
              <li>Alta risoluzione (almeno 1920×1080px)</li>
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
            <p className="text-sm text-muted-foreground">L'AI sta analizzando la tua facciata...</p>
          </div>

          {fotoPreview && (
            <img src={fotoPreview} alt="foto" className="w-full rounded-2xl max-h-64 object-cover" />
          )}

          {analyzing && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/50">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <div>
                <p className="text-sm font-medium text-foreground">Analisi facciata</p>
                <p className="text-xs text-muted-foreground">Rilevamento intonaco, rivestimenti, cornici...</p>
              </div>
            </div>
          )}

          {analisi && !analyzing && (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-foreground">✅ Analisi completata</p>

              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Tipo edificio", value: analisi.tipo_edificio.replace(/_/g, " ") },
                  { label: "Piani rilevati", value: String(analisi.numero_piani_visibili) },
                  { label: "Intonaco attuale", value: analisi.intonaco_tipo_attuale },
                  { label: "Colore attuale", value: analisi.intonaco_colore_attuale },
                  { label: "Conservazione", value: analisi.stato_conservazione },
                  { label: "Prof. rivelaz.", value: `~${analisi.profondita_rivelazione_stimata_cm}cm` },
                ].map((item) => (
                  <div key={item.label} className="p-2 rounded-lg bg-muted/50">
                    <p className="text-[10px] text-muted-foreground uppercase">{item.label}</p>
                    <p className="text-sm font-medium text-foreground">{item.value}</p>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: "Pietra", val: analisi.presenza_rivestimento_pietra },
                  { label: "Laterizio", val: analisi.presenza_laterizio },
                  { label: "Cornici", val: analisi.presenza_cornici_finestre },
                  { label: "Marcapiani", val: analisi.presenza_marcapiani },
                  { label: "Balconi", val: analisi.presenza_balconi },
                  { label: "Cappotto", val: analisi.presenza_cappotto_esistente },
                ].map((b) => (
                  <Badge key={b.label} variant={b.val ? "default" : "outline"} className="text-xs">
                    {b.val ? "✓" : "✗"} {b.label}
                  </Badge>
                ))}
              </div>

              <Button onClick={() => setStep(3)} className="w-full">
                Configura intervento <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}

          {analyzeError && (
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
            <h2 className="text-lg font-bold text-foreground">Configura l'intervento</h2>
            <p className="text-sm text-muted-foreground">Scegli il tipo di lavoro e personalizza i dettagli.</p>
          </div>

          {/* Anteprima foto + info */}
          {fotoPreview && (
            <div className="flex gap-3 items-center">
              <img src={fotoPreview} alt="foto" className="w-20 h-14 rounded-lg object-cover border border-border" />
              <div className="text-xs text-muted-foreground">
                <p className="font-medium text-foreground">{analisi.tipo_edificio.replace(/_/g, " ")}</p>
                <p>{analisi.numero_piani_visibili} piani · {analisi.numero_finestre_visibili} finestre</p>
                <p>Intonaco: {analisi.intonaco_tipo_attuale} · {analisi.intonaco_colore_attuale}</p>
              </div>
            </div>
          )}

          {/* Stili pronti */}
          <StiliProntiFacciata
            onApply={(config) => {
              if (config.tipo_intervento) setTipoIntervento(config.tipo_intervento);
              if (config.colore_intonaco) setColoreIntonaco(config.colore_intonaco);
              if (config.cappotto) setCappotto(config.cappotto);
              if (config.rivestimento) setRivestimento(config.rivestimento as any);
            }}
          />

          <hr className="border-border" />

          {/* Tipo intervento */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Tipo di intervento</Label>
            <div className="space-y-2">
              {TIPO_INTERVENTO_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setTipoIntervento(opt.value)}
                  className={`w-full flex items-start gap-3 p-3.5 rounded-xl border-2 text-left transition-all ${
                    tipoIntervento === opt.value
                      ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                      : "border-border hover:border-primary/30"
                  }`}
                >
                  <span className="text-lg">{opt.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground">{opt.label}</p>
                      <span className="text-xs text-muted-foreground">— {opt.sub}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{opt.desc}</p>
                  </div>
                  {tipoIntervento === opt.value && <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />}
                </button>
              ))}
            </div>
          </div>

          <hr className="border-border" />

          {/* Configurazione specifica */}
          {(tipoIntervento === "tinteggiatura" || tipoIntervento === "rifacimento_totale") && (
            <ColoreIntonacoSelector value={coloreIntonaco} onChange={setColoreIntonaco} />
          )}

          {tipoIntervento === "cappotto" && (
            <CappottoConfigurator
              value={cappotto}
              onChange={setCappotto}
              currentRevealDepth={analisi.profondita_rivelazione_stimata_cm}
            />
          )}

          {tipoIntervento === "rivestimento" && (
            <RivestimentoPicker value={rivestimento} onChange={setRivestimento} />
          )}

          {tipoIntervento === "misto" && (
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-semibold mb-2 block">Piano terra — Rivestimento</Label>
                <RivestimentoPicker value={rivestimento} onChange={setRivestimento} />
              </div>
              <hr className="border-border" />
              <div>
                <Label className="text-sm font-semibold mb-2 block">Piani superiori — Tinteggiatura</Label>
                <ColoreIntonacoSelector value={coloreIntonaco} onChange={setColoreIntonaco} />
              </div>
            </div>
          )}

          <hr className="border-border" />

          {/* Elementi architettonici */}
          <ElementiArchitettoniciPanel value={elementi} onChange={setElementi} analisi={analisi} />

          {/* Note */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Note aggiuntive (opzionale)</Label>
            <Textarea
              value={noteAggiuntive}
              onChange={(e) => setNoteAggiuntive(e.target.value)}
              placeholder="Es: Mantieni il colore dei davanzali uguale al cornicione..."
              className="text-sm resize-none"
              rows={3}
            />
          </div>

          {/* Debug */}
          {import.meta.env.DEV && (
            <div className="border border-amber-200 rounded-xl overflow-hidden">
              <button
                onClick={() => setShowDebugPrompt(!showDebugPrompt)}
                className="w-full flex items-center justify-between px-4 py-2 bg-amber-50 dark:bg-amber-950/30"
              >
                <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">🔍 Debug Prompt</span>
                <span className="text-xs text-amber-600 dark:text-amber-500">{imageNaturalWidth}×{imageNaturalHeight}px</span>
              </button>
              {showDebugPrompt && (
                <pre className="text-xs text-amber-900 dark:text-amber-200 p-3 bg-amber-50/50 dark:bg-amber-950/20 max-h-48 overflow-y-auto font-mono whitespace-pre-wrap">
                  {debugPromptText || "Genera per vedere il prompt"}
                </pre>
              )}
            </div>
          )}

          {/* Genera */}
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={() => setStep(2)} className="flex-shrink-0">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              className="flex-1 h-12 text-base font-semibold"
              onClick={startRender}
              disabled={(tipoIntervento === "rivestimento" && !rivestimento) || rendering}
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Genera Render Facciata
            </Button>
          </div>
        </div>
      )}

      {/* ═══ STEP 4 — GENERAZIONE ═══ */}
      {step === 4 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-bold text-foreground">Generazione in corso</h2>
            <p className="text-sm text-muted-foreground">Il render richiede circa 30-60 secondi</p>
          </div>

          {fotoPreview && (
            <div className="relative">
              <img src={fotoPreview} alt="foto originale" className="w-full rounded-2xl opacity-50" />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
                <div className="bg-background/90 backdrop-blur-sm rounded-xl px-4 py-2 text-center">
                  <p className="text-sm font-semibold text-foreground">{renderStatusMsg}</p>
                </div>
              </div>
            </div>
          )}

          {renderError && (
            <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 space-y-2">
              <p className="text-sm text-destructive font-semibold">Errore durante la generazione</p>
              <p className="text-xs text-destructive/80">{renderError}</p>
              <div className="flex gap-2 pt-1">
                <Button variant="outline" size="sm" onClick={() => setStep(3)}>
                  <ChevronLeft className="w-4 h-4 mr-1" /> Configurazione
                </Button>
                <Button size="sm" onClick={startRender}>
                  <RotateCcw className="w-4 h-4 mr-1" /> Riprova
                </Button>
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
              {tipoIntervento.replace(/_/g, " ")} ·{" "}
              {tipoIntervento === "cappotto" ? cappotto.colore.colore_name :
               tipoIntervento === "rivestimento" ? rivestimento?.tipo_name :
               coloreIntonaco.colore_name}
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
                {showOriginal ? "📷 Foto originale" : "✨ Render AI"}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <a
              href={renderUrl}
              download={`render-facciata-${Date.now()}.png`}
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
              <RotateCcw className="w-4 h-4 mr-2" />
              Rigenera con modifiche
            </Button>
            <Button className="flex-1" onClick={() => navigate("/app/render-facciata")}>
              Nuova foto
            </Button>
          </div>

          <p className="text-center text-xs text-muted-foreground">
            Render generato a {imageNaturalWidth}×{imageNaturalHeight}px
          </p>
        </div>
      )}
    </div>
  );
}
