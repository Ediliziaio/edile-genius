import { useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useCompanyId } from "@/hooks/useCompanyId";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Upload, ArrowLeft, ArrowRight, Download, Save, RotateCcw, ChevronDown } from "lucide-react";
import { TipoPavimentoPicker } from "@/modules/render-pavimento/components/TipoPavimentoPicker";
import { PatternPosaPicker } from "@/modules/render-pavimento/components/PatternPosaPicker";
import { FinituraSelector } from "@/modules/render-pavimento/components/FinituraSelector";
import { PavimentoColorSelector } from "@/modules/render-pavimento/components/PavimentoColorSelector";
import { DimensioniPavimento } from "@/modules/render-pavimento/components/DimensioniPavimento";
import { FugaConfigurator } from "@/modules/render-pavimento/components/FugaConfigurator";
import { StiliProntiPavimento } from "@/modules/render-pavimento/components/StiliProntiPavimento";
import { buildPavimentoPrompt, type TipoPavimento, type PatternPosa, type Finitura, type TipoOperazione, type PavimentoColore, type AnalysisData } from "@/modules/render-pavimento/lib/pavimentoPromptBuilder";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const MAX_FILE_SIZE = 15 * 1024 * 1024;
const STEPS = ["Upload", "Analisi", "Configura", "Render", "Risultato"];

export default function RenderPavimentoNew() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const companyId = useCompanyId();
  const { toast } = useToast();

  const [step, setStep] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [originalDimensions, setOriginalDimensions] = useState<{ w: number; h: number } | null>(null);

  // Config state
  const [tipoOperazione, setTipoOperazione] = useState<TipoOperazione>("sostituisci");
  const [tipoPavimento, setTipoPavimento] = useState<TipoPavimento>("ceramica");
  const [sottotipo, setSottotipo] = useState<string>("");
  const [finitura, setFinitura] = useState<Finitura>("opaco");
  const [patternPosa, setPatternPosa] = useState<PatternPosa>("rettilineo_dritto");
  const [colore, setColore] = useState<PavimentoColore>({ mode: "palette" });
  const [dimensionePiastrella, setDimensionePiastrella] = useState("60x60");
  const [larghezzaListello, setLarghezzaListello] = useState(140);
  const [lunghezzaListello, setLunghezzaListello] = useState(900);
  const [larghezzaFuga, setLarghezzaFuga] = useState(3);
  const [coloreFuga, setColoreFuga] = useState("grigio_ch");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(async (selectedFile: File) => {
    if (selectedFile.size > MAX_FILE_SIZE) {
      toast({ title: "File troppo grande", description: "Massimo 15MB", variant: "destructive" });
      return;
    }
    setFile(selectedFile);
    const url = URL.createObjectURL(selectedFile);
    setPreview(url);

    // Get dimensions
    const img = new Image();
    img.onload = () => setOriginalDimensions({ w: img.naturalWidth, h: img.naturalHeight });
    img.src = url;
  }, [toast]);

  // Upload + create session + analyze
  const analyzeMutation = useMutation({
    mutationFn: async () => {
      if (!file || !user || !companyId) throw new Error("Dati mancanti");

      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("pavimento-originals").upload(path, file, { upsert: false });
      if (upErr) throw upErr;

      const { data: session, error: sErr } = await (supabase.from("render_pavimento_sessions") as any)
        .insert({ user_id: user.id, company_id: companyId, status: "analyzing", original_image_path: path })
        .select("id")
        .single();
      if (sErr) throw sErr;
      setSessionId(session.id);

      // Convert to base64
      const reader = new FileReader();
      const base64 = await new Promise<string>((res) => {
        reader.onload = () => res((reader.result as string).split(",")[1]);
        reader.readAsDataURL(file);
      });

      const { data, error } = await supabase.functions.invoke("analyze-floor-photo", {
        body: { image_base64: base64, mime_type: file.type, session_id: session.id },
      });

      if (error) throw error;
      const payload = data?.data ?? data;
      return payload;
    },
    onSuccess: (data) => {
      setAnalysis(data);
      if (data?.tipo_pavimento_rilevato) setTipoPavimento(data.tipo_pavimento_rilevato as TipoPavimento);
      if (data?.pattern_rilevato) setPatternPosa(data.pattern_rilevato as PatternPosa);
      if (data?.finitura_rilevata) setFinitura(data.finitura_rilevata as Finitura);
      setStep(1);
    },
    onError: (err) => {
      toast({ title: "Errore analisi", description: String(err), variant: "destructive" });
    },
  });

  // Generate render
  const renderMutation = useMutation({
    mutationFn: async () => {
      if (!file || !sessionId) throw new Error("Sessione mancante");

      const config = {
        tipo_operazione: tipoOperazione,
        tipo_pavimento: tipoPavimento,
        sottotipo: sottotipo || undefined,
        finitura,
        pattern_posa: patternPosa,
        colore,
        dimensione_piastrella: dimensionePiastrella,
        larghezza_listello_mm: larghezzaListello,
        lunghezza_listello_mm: lunghezzaListello,
        larghezza_fuga_mm: larghezzaFuga,
        colore_fuga: coloreFuga,
      };

      const { systemPrompt, userPrompt } = buildPavimentoPrompt(config, analysis ?? undefined);

      const reader = new FileReader();
      const base64 = await new Promise<string>((res) => {
        reader.onload = () => res((reader.result as string).split(",")[1]);
        reader.readAsDataURL(file);
      });

      // Compute target dimensions
      let tw = originalDimensions?.w ?? 1024;
      let th = originalDimensions?.h ?? 1024;
      const maxDim = 2048;
      if (tw > maxDim || th > maxDim) {
        const scale = maxDim / Math.max(tw, th);
        tw = Math.round(tw * scale / 8) * 8;
        th = Math.round(th * scale / 8) * 8;
      }

      const { data, error } = await supabase.functions.invoke("generate-floor-render", {
        body: {
          image_base64: base64,
          mime_type: file.type,
          prompt: userPrompt,
          system_prompt: systemPrompt,
          session_id: sessionId,
          target_width: tw,
          target_height: th,
        },
      });

      if (error) throw error;
      const payload = data?.data ?? data;
      const resultImageUrl = payload?.result_image_url || payload?.result_url;
      if (!resultImageUrl) throw new Error(payload?.error ?? "Render non riuscito");
      return resultImageUrl as string;
    },
    onSuccess: (url) => {
      setResultUrl(url);
      setStep(4);
    },
    onError: (err) => {
      toast({ title: "Errore render", description: String(err), variant: "destructive" });
      setStep(2); // back to config
    },
  });

  const handleApplyStile = (config: any) => {
    if (config.tipo_pavimento) setTipoPavimento(config.tipo_pavimento);
    if (config.finitura) setFinitura(config.finitura);
    if (config.pattern_posa) setPatternPosa(config.pattern_posa);
    if (config.colore) setColore(config.colore);
    if (config.dimensione_piastrella) setDimensionePiastrella(config.dimensione_piastrella);
    if (config.larghezza_listello_mm) setLarghezzaListello(config.larghezza_listello_mm);
    if (config.lunghezza_listello_mm) setLunghezzaListello(config.lunghezza_listello_mm);
    if (config.larghezza_fuga_mm) setLarghezzaFuga(config.larghezza_fuga_mm);
    if (config.colore_fuga) setColoreFuga(config.colore_fuga);
    toast({ title: "Stile applicato ✓" });
  };

  const saveToGallery = async () => {
    if (!resultUrl || !user || !companyId) return;
    try {
      await (supabase.from("render_pavimento_gallery") as any).insert({
        user_id: user.id,
        company_id: companyId,
        session_id: sessionId,
        result_image_url: resultUrl,
        tipo_operazione: tipoOperazione,
        tipo_pavimento: tipoPavimento,
        sottotipo,
        finitura,
        pattern_posa: patternPosa,
        colore_mode: colore.mode,
        colore_name: colore.name ?? colore.wood_name ?? null,
        colore_hex: colore.hex ?? null,
        wood_name: colore.wood_name ?? null,
      });
      toast({ title: "Salvato in galleria ✓" });
    } catch (err) {
      toast({ title: "Errore", description: String(err), variant: "destructive" });
    }
  };

  const resetAll = () => {
    setStep(0);
    setFile(null);
    setPreview(null);
    setSessionId(null);
    setAnalysis(null);
    setResultUrl(null);
    setOriginalDimensions(null);
  };

  const [showBefore, setShowBefore] = useState(false);

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-16">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/app/render-pavimento")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-lg font-bold text-foreground">Nuovo Render Pavimento</h1>
          <p className="text-xs text-muted-foreground">{STEPS[step]} — Step {step + 1}/{STEPS.length}</p>
        </div>
      </div>

      {/* Progress */}
      <div className="flex gap-1">
        {STEPS.map((_, i) => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= step ? "bg-primary" : "bg-muted"}`} />
        ))}
      </div>

      {/* ═══ STEP 0: Upload ═══ */}
      {step === 0 && (
        <div className="space-y-4">
          {!preview ? (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-48 rounded-2xl border-2 border-dashed border-border hover:border-primary/40 bg-muted/30 flex flex-col items-center justify-center gap-3 transition-colors"
            >
              <Upload className="w-8 h-8 text-muted-foreground" />
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">Carica foto della stanza</p>
                <p className="text-xs text-muted-foreground">JPG, PNG, WEBP — max 15MB</p>
              </div>
            </button>
          ) : (
            <div className="space-y-3">
              <div className="relative rounded-2xl overflow-hidden border border-border">
                <img src={preview} alt="preview" className="w-full max-h-64 object-contain bg-muted/20" />
                {originalDimensions && (
                  <Badge variant="secondary" className="absolute bottom-2 right-2 text-[10px]">
                    {originalDimensions.w} × {originalDimensions.h}px
                  </Badge>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => { setFile(null); setPreview(null); }}>
                  Cambia foto
                </Button>
                <Button className="flex-1 bg-amber-600 hover:bg-amber-700" onClick={() => analyzeMutation.mutate()} disabled={analyzeMutation.isPending}>
                  {analyzeMutation.isPending ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Analisi...</> : "Analizza con AI"}
                </Button>
              </div>
            </div>
          )}
          <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => { if (e.target.files?.[0]) handleFileSelect(e.target.files[0]); }} />

          <StiliProntiPavimento onApply={handleApplyStile} />
        </div>
      )}

      {/* ═══ STEP 1: Analysis ═══ */}
      {step === 1 && analysis && (
        <div className="space-y-4">
          <Card><CardContent className="p-4 space-y-3">
            <p className="text-sm font-semibold text-foreground">Risultati analisi AI</p>
            <div className="flex flex-wrap gap-2">
              {analysis.tipo_pavimento_rilevato && <Badge variant="secondary">🏠 {analysis.tipo_pavimento_rilevato}</Badge>}
              {analysis.pattern_rilevato && <Badge variant="secondary">📐 {analysis.pattern_rilevato.replace(/_/g, " ")}</Badge>}
              {analysis.finitura_rilevata && <Badge variant="secondary">✨ {analysis.finitura_rilevata}</Badge>}
              {analysis.tipo_stanza && <Badge variant="secondary">🚪 {analysis.tipo_stanza}</Badge>}
              {analysis.luminosita && <Badge variant="secondary">💡 {analysis.luminosita}</Badge>}
            </div>
            {analysis.colore_approssimativo && (
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full border border-border" style={{ backgroundColor: analysis.colore_approssimativo.hex }} />
                <span className="text-xs text-muted-foreground">Colore attuale: {analysis.colore_approssimativo.name}</span>
              </div>
            )}
            {analysis.note_ai && <p className="text-xs text-muted-foreground italic">{analysis.note_ai}</p>}
          </CardContent></Card>
          <Button className="w-full" onClick={() => setStep(2)}>Continua alla configurazione <ArrowRight className="w-4 h-4 ml-2" /></Button>
        </div>
      )}

      {/* ═══ STEP 2: Config ═══ */}
      {step === 2 && (
        <div className="space-y-6">
          {/* Tipo operazione */}
          <div className="space-y-2">
            <p className="text-sm font-semibold text-foreground">Tipo operazione</p>
            <div className="grid grid-cols-3 gap-2">
              {([
                { v: "sostituisci" as TipoOperazione, label: "Sostituisci", emoji: "🔄" },
                { v: "aggiungi" as TipoOperazione, label: "Aggiungi", emoji: "➕" },
                { v: "cambia_colore" as TipoOperazione, label: "Cambia colore", emoji: "🎨" },
              ]).map((op) => (
                <button key={op.v} type="button" onClick={() => setTipoOperazione(op.v)}
                  className={`p-3 rounded-xl border-2 text-center transition-all ${tipoOperazione === op.v ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"}`}>
                  <p className="text-lg">{op.emoji}</p>
                  <p className="text-xs font-semibold mt-1">{op.label}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Tipo pavimento */}
          <div className="space-y-2">
            <p className="text-sm font-semibold text-foreground">Materiale pavimento</p>
            <TipoPavimentoPicker value={tipoPavimento} onChange={setTipoPavimento} />
          </div>

          {/* Pattern posa */}
          <div className="space-y-2">
            <p className="text-sm font-semibold text-foreground">Pattern di posa</p>
            <PatternPosaPicker value={patternPosa} onChange={setPatternPosa} tipoPavimento={tipoPavimento} />
          </div>

          {/* Finitura */}
          <div className="space-y-2">
            <p className="text-sm font-semibold text-foreground">Finitura</p>
            <FinituraSelector value={finitura} onChange={setFinitura} tipoPavimento={tipoPavimento} />
          </div>

          {/* Colore */}
          <div className="space-y-2">
            <p className="text-sm font-semibold text-foreground">Colore</p>
            <PavimentoColorSelector value={colore} onChange={setColore} tipoPavimento={tipoPavimento} />
          </div>

          {/* Dimensioni */}
          <div className="space-y-2">
            <p className="text-sm font-semibold text-foreground">Dimensioni</p>
            <DimensioniPavimento
              tipoPavimento={tipoPavimento}
              dimensionePiastrella={dimensionePiastrella}
              onDimensionePiastrellaChange={setDimensionePiastrella}
              larghezzaListello={larghezzaListello}
              onLarghezzaListelloChange={setLarghezzaListello}
              lunghezzaListello={lunghezzaListello}
              onLunghezzaListelloChange={setLunghezzaListello}
            />
          </div>

          {/* Fuga */}
          <FugaConfigurator
            tipoPavimento={tipoPavimento}
            larghezzaFuga={larghezzaFuga}
            onLarghezzaFugaChange={setLarghezzaFuga}
            coloreFuga={coloreFuga}
            onColoreFugaChange={setColoreFuga}
          />

          {/* Debug (DEV) */}
          {import.meta.env.DEV && (
            <Collapsible>
              <CollapsibleTrigger className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                <ChevronDown className="w-3 h-3" /> Debug prompt
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2">
                <pre className="text-[10px] bg-muted p-3 rounded-lg overflow-auto max-h-48 whitespace-pre-wrap">
                  {JSON.stringify(buildPavimentoPrompt({
                    tipo_operazione: tipoOperazione, tipo_pavimento: tipoPavimento, sottotipo, finitura, pattern_posa: patternPosa, colore,
                    dimensione_piastrella: dimensionePiastrella, larghezza_listello_mm: larghezzaListello, lunghezza_listello_mm: lunghezzaListello,
                    larghezza_fuga_mm: larghezzaFuga, colore_fuga: coloreFuga,
                  }, analysis ?? undefined), null, 2)}
                </pre>
              </CollapsibleContent>
            </Collapsible>
          )}

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep(1)}><ArrowLeft className="w-4 h-4 mr-1" /> Indietro</Button>
            <Button className="flex-1 bg-amber-600 hover:bg-amber-700" onClick={() => { setStep(3); renderMutation.mutate(); }}>
              Genera Render ✨
            </Button>
          </div>
        </div>
      )}

      {/* ═══ STEP 3: Rendering ═══ */}
      {step === 3 && (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-amber-200 border-t-amber-600 animate-spin" />
            <div className="absolute inset-2 w-12 h-12 rounded-full border-4 border-amber-100 border-b-amber-500 animate-spin" style={{ animationDirection: "reverse" }} />
          </div>
          <p className="text-sm font-semibold text-foreground">Generazione in corso...</p>
          <p className="text-xs text-muted-foreground">Il pavimento viene sostituito con AI — ~20 secondi</p>
        </div>
      )}

      {/* ═══ STEP 4: Result ═══ */}
      {step === 4 && resultUrl && (
        <div className="space-y-4">
          <div className="rounded-2xl overflow-hidden border border-border">
            <img src={showBefore ? preview! : resultUrl} alt="render result" className="w-full object-contain" />
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowBefore(!showBefore)}>
              {showBefore ? "Dopo ✨" : "Prima 📷"}
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">{tipoPavimento.replace(/_/g, " ")}</Badge>
            <Badge variant="secondary">{patternPosa.replace(/_/g, " ")}</Badge>
            <Badge variant="secondary">{finitura}</Badge>
            {colore.name && <Badge variant="secondary">{colore.name}</Badge>}
          </div>

          <div className="flex gap-2">
            <a href={resultUrl} download className="flex-1">
              <Button variant="outline" className="w-full"><Download className="w-4 h-4 mr-2" /> Download</Button>
            </a>
            <Button className="flex-1 bg-amber-600 hover:bg-amber-700" onClick={saveToGallery}>
              <Save className="w-4 h-4 mr-2" /> Salva in galleria
            </Button>
          </div>

          <Button variant="ghost" className="w-full" onClick={resetAll}>
            <RotateCcw className="w-4 h-4 mr-2" /> Nuovo render
          </Button>
        </div>
      )}
    </div>
  );
}
