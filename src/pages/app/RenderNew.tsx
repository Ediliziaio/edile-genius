import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyId } from "@/hooks/useCompanyId";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { validatePhoto, checkImageDimensions } from "@/modules/render/lib/promptBuilder";
import type {
  FotoAnalisi, ProfiloTelaioSize, ProfiloForma, ManigliaType, ColoreFerratura,
  CassonettoMateriale, TapparellaMateriale, CernieraColore, SostituzioneSelezione,
} from "@/modules/render/lib/promptBuilder";
import BeforeAfterSlider from "@/components/render/BeforeAfterSlider";
import PhotoAnalysisCard from "@/components/render/PhotoAnalysisCard";
import ProfileHardwareConfig from "@/components/render/ProfileHardwareConfig";
import StructuralChangeBox from "@/components/render/StructuralChangeBox";
import {
  Upload, ArrowRight, Check, Loader2,
  Sparkles, ChevronLeft
} from "lucide-react";

interface Preset {
  id: string;
  category: string;
  name: string;
  value: string;
  prompt_fragment: string;
  icon: string | null;
  colore_ral?: string;
  colore_ncs?: string;
  finitura?: string;
}

const STEPS = ["Foto", "Configura", "Elaborazione", "Risultati"];

export default function RenderNew() {
  const navigate = useNavigate();
  const companyId = useCompanyId();
  const { user } = useAuth();
  const { toast } = useToast();

  const [step, setStep] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [presets, setPresets] = useState<Preset[]>([]);
  const [config, setConfig] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState("");
  const [sessionId, setSessionId] = useState<string>("");
  const [status, setStatus] = useState<string>("pending");
  const [resultUrls, setResultUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  // V2 state
  const [analysisData, setAnalysisData] = useState<FotoAnalisi | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState<string>("");
  const [profiloDimensione, setProfiloDimensione] = useState<ProfiloTelaioSize>("70mm");
  const [profiloForma, setProfiloForma] = useState<ProfiloForma>("arrotondato");
  const [maniglia, setManiglia] = useState<ManigliaType>("leva_alluminio");
  const [coloreFerratura, setColoreFerratura] = useState<ColoreFerratura>("argento");

  // V3 state — Sostituzione selettiva
  const [sostituzione, setSostituzione] = useState<SostituzioneSelezione>({
    infissi: true, cassonetto: false, tapparella: false,
  });

  // Cassonetto
  const [cassonettoAzione, setCassonettoAzione] = useState<"mantieni" | "sostituisci" | "rimuovi">("mantieni");
  const [cassonettoMateriale, setCassonettoMateriale] = useState("pvc_tradizionale");
  const [cassonettoColoreValue, setCassonettoColoreValue] = useState("bianco_9016");
  const [cassonettoColoreSameAsInfisso, setCassonettoColoreSameAsInfisso] = useState(true);

  // Tapparella
  const [tapparellaAzione, setTapparellaAzione] = useState<"mantieni" | "sostituisci" | "rimuovi">("mantieni");
  const [tapparellaMateriale, setTapparellaMateriale] = useState("pvc_avvolgibile");
  const [tapparellaColoreValue, setTapparellaColoreValue] = useState("bianco_9016");
  const [tapparellaGuideValue, setTapparellaGuideValue] = useState("uguale_infisso");
  const [tapparellaStato, setTapparellaStato] = useState<"aperta" | "chiusa" | "mezza">("chiusa");

  // Cerniere
  const [cerniereColore, setCerniereColore] = useState<CernieraColore>("uguale_maniglia");
  const [cerniereTipo, setCerniereTipo] = useState<"europea" | "a_libro" | "invisibile">("europea");
  const [cernierePerAnta, setCernierePerAnta] = useState<2 | 3>(2);

  // Preset groups
  const [cassonettoPresets, setCassonettoPresets] = useState<Preset[]>([]);
  const [tapparellaPresets, setTapparellaPresets] = useState<Preset[]>([]);
  const [cassonettoColoriPresets, setCassonettoColoriPresets] = useState<Preset[]>([]);
  const [tapparellaColoriPresets, setTapparellaColoriPresets] = useState<Preset[]>([]);

  // Load presets
  useEffect(() => {
    supabase.from("render_infissi_presets").select("*").eq("is_active", true).order("sort_order")
      .then(({ data }) => {
        if (!data) return;
        const all = data as any as Preset[];
        setPresets(all.filter(p => !['cassonetto_materiale', 'tapparella_materiale', 'cassonetto_colore', 'tapparella_colore'].includes(p.category)));
        setCassonettoPresets(all.filter(p => p.category === 'cassonetto_materiale'));
        setTapparellaPresets(all.filter(p => p.category === 'tapparella_materiale'));
        setCassonettoColoriPresets(all.filter(p => p.category === 'cassonetto_colore'));
        setTapparellaColoriPresets(all.filter(p => p.category === 'tapparella_colore'));
      });
  }, []);

  const categories = ["materiale", "colore", "stile", "vetro"];
  const categoryLabels: Record<string, string> = {
    materiale: "Materiale Telaio",
    colore: "Colore Telaio",
    stile: "Stile Profilo",
    vetro: "Tipo Vetro",
  };

  // File handling
  const handleFile = useCallback(async (f: File) => {
    const validation = validatePhoto(f);
    if (!validation.valid) {
      toast({ title: "Errore", description: validation.error, variant: "destructive" });
      return;
    }
    const dims = await checkImageDimensions(f);
    if (!dims.valid) {
      toast({ title: "Errore", description: dims.error, variant: "destructive" });
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }, [toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [handleFile]);

  // Run photo analysis after upload to storage
  const runPhotoAnalysis = async (publicUrl: string) => {
    setAnalysisLoading(true);
    setAnalysisError("");
    try {
      const bucketPrefix = "/storage/v1/object/public/render-originals/";
      const pathIndex = publicUrl.indexOf(bucketPrefix);
      if (pathIndex === -1) throw new Error("Invalid URL");
      const filePath = publicUrl.substring(pathIndex + bucketPrefix.length);
      const { data: signedData } = await supabase.storage.from("render-originals").createSignedUrl(filePath, 3600);
      
      const { data, error } = await supabase.functions.invoke("analyze-window-photo", {
        body: { image_url: signedData?.signedUrl || publicUrl },
      });
      if (error) throw error;
      if (data?.analysis) {
        setAnalysisData(data.analysis as FotoAnalisi);
      }
    } catch (err: any) {
      setAnalysisError("Analisi non riuscita. Puoi comunque procedere manualmente.");
      console.error("Analysis error:", err);
    } finally {
      setAnalysisLoading(false);
    }
  };

  // Step 0 → 1: Upload photo to storage + run analysis
  const goToStep1 = async () => {
    if (!file || !companyId) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${companyId}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("render-originals").upload(path, file);
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("render-originals").getPublicUrl(path);

      const { data: session, error: sessErr } = await supabase.from("render_sessions").insert({
        company_id: companyId,
        created_by: user?.id,
        original_photo_url: urlData.publicUrl,
        status: "configuring",
      }).select("id").single();
      if (sessErr) throw sessErr;
      setSessionId(session.id);
      setStep(1);

      runPhotoAnalysis(urlData.publicUrl);
    } catch (err: any) {
      toast({ title: "Errore upload", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  // Step 1 → 2: Start render
  const startRender = async () => {
    if (!sessionId || !companyId) return;

    // Build fragments from legacy presets
    const fragments: Record<string, string> = {};
    for (const cat of categories) {
      const preset = presets.find(p => p.category === cat && p.value === config[cat]);
      if (preset) fragments[cat] = preset.prompt_fragment;
    }

    const colorePreset = presets.find(p => p.category === "colore" && p.value === config.colore);

    // Resolve cassonetto color
    const cassonettoColorePreset = cassonettoColoriPresets.find(p => p.value === cassonettoColoreValue);
    const cassonettoColoreConfig = cassonettoColoreSameAsInfisso
      ? { nome: "Uguale Infisso", ral: colorePreset?.colore_ral || undefined, finitura: "liscio_opaco" as const }
      : { nome: cassonettoColorePreset?.name || cassonettoColoreValue, ral: cassonettoColorePreset?.colore_ral || undefined, finitura: "liscio_opaco" as const };

    // Resolve tapparella colors
    const tapparellaColorePreset = tapparellaColoriPresets.find(p => p.value === tapparellaColoreValue);
    const tapparellaGuidePreset = tapparellaColoriPresets.find(p => p.value === tapparellaGuideValue);
    const tapparellaColoreConfig = {
      nome: tapparellaColorePreset?.name || tapparellaColoreValue,
      ral: tapparellaColorePreset?.colore_ral || undefined,
      finitura: "liscio_opaco" as const,
    };
    const tapparellaGuideConfig = tapparellaGuideValue === 'uguale_infisso'
      ? { ...tapparellaColoreConfig, nome: "Uguale tapparella" }
      : { nome: tapparellaGuidePreset?.name || tapparellaGuideValue, ral: tapparellaGuidePreset?.colore_ral || undefined, finitura: "liscio_opaco" as const };

    // Build V3 config
    const nuovoInfisso = {
      materiale: config.materiale || "pvc",
      colore: {
        nome: colorePreset?.name || config.colore || "bianco",
        ral: colorePreset?.colore_ral || undefined,
        ncs: colorePreset?.colore_ncs || undefined,
        finitura: (colorePreset?.finitura as any) || "liscio_opaco",
      },
      profilo: {
        dimensione: profiloDimensione,
        camere: profiloDimensione === "70mm" ? 3 : profiloDimensione === "82mm" ? 5 : 7,
        forma: profiloForma,
      },
      cerniere: {
        num_per_anta: cernierePerAnta,
        colore: cerniereColore,
        tipo: cerniereTipo,
      },
      vetro: {
        tipo: config.vetro || "doppio vetro basso emissivo",
        prompt_fragment: fragments.vetro || "",
      },
      cassonetto: {
        azione: sostituzione.cassonetto ? cassonettoAzione : "mantieni" as const,
        materiale: sostituzione.cassonetto && cassonettoAzione === "sostituisci" ? cassonettoMateriale as CassonettoMateriale : undefined,
        colore: sostituzione.cassonetto && cassonettoAzione === "sostituisci" ? cassonettoColoreConfig : undefined,
        prompt_fragment: cassonettoPresets.find(p => p.value === cassonettoMateriale)?.prompt_fragment,
      },
      tapparella: {
        azione: sostituzione.tapparella ? tapparellaAzione : "mantieni" as const,
        materiale: sostituzione.tapparella && tapparellaAzione === "sostituisci" ? tapparellaMateriale as TapparellaMateriale : undefined,
        colore: sostituzione.tapparella && tapparellaAzione === "sostituisci" ? tapparellaColoreConfig : undefined,
        colore_guide: sostituzione.tapparella && tapparellaAzione === "sostituisci" ? tapparellaGuideConfig : undefined,
        stato_render: tapparellaStato,
        prompt_fragment: tapparellaPresets.find(p => p.value === tapparellaMateriale)?.prompt_fragment,
      },
      ferramenta: {
        maniglia,
        colore: coloreFerratura,
      },
      num_ante: analysisData?.num_ante_attuale || undefined,
      sostituzione,
    };

    // Update session with V3 config + analysis
    await supabase.from("render_sessions").update({
      config: { ...config, notes, fragments, nuovo_infisso: nuovoInfisso, options: { notes } },
      foto_analisi: analysisData || {},
      status: "queued",
    }).eq("id", sessionId);

    setStep(2);

    try {
      const { error } = await supabase.functions.invoke("generate-render", {
        body: { session_id: sessionId },
      });
      if (error) throw error;
    } catch (err: any) {
      toast({ title: "Errore", description: err.message, variant: "destructive" });
    }
  };

  // Poll status during step 2
  useEffect(() => {
    if (step !== 2 || !sessionId) return;
    const interval = setInterval(async () => {
      const { data } = await supabase.from("render_sessions")
        .select("status, result_urls, error_message")
        .eq("id", sessionId).single();
      if (!data) return;
      const d = data as any;
      setStatus(d.status);
      if (d.status === "completed" && d.result_urls) {
        setResultUrls(Array.isArray(d.result_urls) ? d.result_urls : []);
        setStep(3);
        clearInterval(interval);
      } else if (d.status === "failed") {
        toast({ title: "Render fallito", description: d.error_message || "Errore sconosciuto", variant: "destructive" });
        clearInterval(interval);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [step, sessionId, toast]);

  // Save to gallery
  const saveToGallery = async (resultIndex: number) => {
    if (!companyId || !resultUrls[resultIndex]) return;
    const { error } = await supabase.from("render_gallery").insert({
      company_id: companyId,
      session_id: sessionId,
      original_url: preview,
      render_url: resultUrls[resultIndex],
      config_summary: config,
      created_by: user?.id,
      share_token: crypto.randomUUID().slice(0, 12),
    });
    if (error) {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Salvato!", description: "Render aggiunto alla galleria" });
      navigate("/app/render/gallery");
    }
  };

  const processingMessages = [
    "Analisi della foto in corso...",
    "Identificazione finestre esistenti...",
    "Costruzione prompt strutturale v3...",
    "Generazione sostituzione selettiva...",
    "Applicazione materiali e texture...",
    "Regolazione luci e ombre...",
    "Rifinitura dettagli fotorealistici...",
  ];

  const [msgIndex, setMsgIndex] = useState(0);
  useEffect(() => {
    if (step !== 2) return;
    const t = setInterval(() => setMsgIndex(i => (i + 1) % processingMessages.length), 4000);
    return () => clearInterval(t);
  }, [step]);

  const handleProfileChange = (field: string, value: string) => {
    switch (field) {
      case "profiloDimensione": setProfiloDimensione(value as ProfiloTelaioSize); break;
      case "profiloForma": setProfiloForma(value as ProfiloForma); break;
      case "maniglia": setManiglia(value as ManigliaType); break;
      case "coloreFerratura": setColoreFerratura(value as ColoreFerratura); break;
    }
  };

  const toggleSostituzione = (key: keyof SostituzioneSelezione) => {
    setSostituzione(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const nessunElementoSelezionato = !sostituzione.infissi && !sostituzione.cassonetto && !sostituzione.tapparella;

  return (
    <div className="max-w-[520px] mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => step > 0 ? setStep(step - 1) : navigate("/app/render")}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold text-foreground">Nuovo Render</h1>
          <p className="text-sm text-muted-foreground">Step {step + 1} di {STEPS.length} — {STEPS[step]}</p>
        </div>
      </div>

      {/* Progress dots */}
      <div className="flex gap-2 mb-8">
        {STEPS.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              i < step ? "bg-primary" : i === step ? "bg-primary/60" : "bg-muted"
            }`}
          />
        ))}
      </div>

      {/* Step 0: Upload photo */}
      {step === 0 && (
        <div className="space-y-4">
          {!preview ? (
            <div
              className="border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => document.getElementById("photo-input")?.click()}
            >
              <Upload className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
              <p className="font-medium text-foreground mb-1">Trascina la foto qui</p>
              <p className="text-sm text-muted-foreground mb-4">oppure clicca per selezionare</p>
              <div className="flex gap-2 justify-center">
                <Badge variant="outline">JPG</Badge>
                <Badge variant="outline">PNG</Badge>
                <Badge variant="outline">WebP</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Min 600×600px, max 20MB</p>
              <input
                id="photo-input"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-xl overflow-hidden border">
                <img src={preview} alt="Preview" className="w-full object-cover max-h-[400px]" />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => { setFile(null); setPreview(""); }}>
                  Cambia Foto
                </Button>
                <Button className="flex-1" onClick={goToStep1} disabled={uploading}>
                  {uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ArrowRight className="h-4 w-4 mr-2" />}
                  Continua
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 1: Configure */}
      {step === 1 && (
        <div className="space-y-6">
          {/* Photo Analysis */}
          <PhotoAnalysisCard
            analysisData={analysisData}
            loading={analysisLoading}
            error={analysisError}
          />

          {/* ── SEZIONE 1: Cosa vuoi sostituire? ── */}
          <div>
            <Label className="text-sm font-semibold mb-3 block">🎯 Cosa vuoi sostituire?</Label>
            <p className="text-xs text-muted-foreground mb-3">Seleziona solo gli elementi che vuoi cambiare. Il resto rimane invariato.</p>
            <div className="space-y-2">
              {[
                { key: "infissi" as const, emoji: "🪟", label: "Infissi", sub: "Telai, vetri, maniglie" },
                { key: "cassonetto" as const, emoji: "📦", label: "Cassonetto", sub: "Cassonetto avvolgibile sopra" },
                { key: "tapparella" as const, emoji: "🔽", label: "Tapparella", sub: "Tapparella, persiana o veneziana" },
              ].map(opt => (
                <button
                  key={opt.key}
                  onClick={() => toggleSostituzione(opt.key)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                    sostituzione[opt.key]
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "border-border hover:border-primary/30"
                  }`}
                >
                  <span className="text-2xl">{opt.emoji}</span>
                  <div className="flex-1">
                    <span className="text-sm font-medium text-foreground block">{opt.label}</span>
                    <span className="text-xs text-muted-foreground">{opt.sub}</span>
                  </div>
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                    sostituzione[opt.key] ? "bg-primary border-primary" : "border-muted-foreground/30"
                  }`}>
                    {sostituzione[opt.key] && <Check className="h-3 w-3 text-primary-foreground" />}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* ── SEZIONE 2: Configura Infissi (condizionale) ── */}
          {sostituzione.infissi && (
            <>
              <div className="border-t pt-4">
                <Label className="text-sm font-semibold mb-3 block">🪟 Configura Infissi</Label>

                {/* Structural Change Box */}
                <StructuralChangeBox
                  analisi={analysisData}
                  nuovoMateriale={config.materiale}
                  nuovoColore={presets.find(p => p.category === "colore" && p.value === config.colore)?.name}
                />
              </div>

              {/* Legacy preset categories (materiale, colore, stile, vetro) */}
              {categories.map((cat) => {
                const catPresets = presets.filter(p => p.category === cat);
                if (catPresets.length === 0) return null;
                return (
                  <div key={cat}>
                    <Label className="text-sm font-semibold mb-2 block">{categoryLabels[cat]}</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {catPresets.map((p) => (
                        <button
                          key={p.value}
                          onClick={() => setConfig(prev => ({ ...prev, [cat]: p.value }))}
                          className={`flex items-center gap-2 p-3 rounded-xl border text-left text-sm transition-all ${
                            config[cat] === p.value
                              ? "border-primary bg-primary/5 ring-1 ring-primary"
                              : "border-border hover:border-primary/30"
                          }`}
                        >
                          {p.icon && <span className="text-lg">{p.icon}</span>}
                          <span className="font-medium text-foreground">{p.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}

              {/* Cerniere v3 */}
              <div>
                <Label className="text-sm font-semibold mb-2 block">🔩 Cerniere</Label>
                <p className="text-xs text-muted-foreground mb-2">Standard: {cernierePerAnta * (analysisData?.num_ante_attuale || 2)} totali ({cernierePerAnta} per anta)</p>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {[
                    { value: "europea", label: "Europea", sub: "Standard visibile" },
                    { value: "a_libro", label: "A libro", sub: "Semi-nascosta" },
                    { value: "invisibile", label: "Invisibile", sub: "Nascosta" },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setCerniereTipo(opt.value as any)}
                      className={`p-2.5 rounded-xl border text-center transition-all ${
                        cerniereTipo === opt.value ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border"
                      }`}
                    >
                      <span className="text-xs font-medium text-foreground block">{opt.label}</span>
                      <span className="text-[10px] text-muted-foreground">{opt.sub}</span>
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs mb-1 block">Colore cerniere</Label>
                    <Select value={cerniereColore} onValueChange={(v) => setCerniereColore(v as CernieraColore)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="uguale_maniglia">Uguale maniglia</SelectItem>
                        <SelectItem value="argento">Argento</SelectItem>
                        <SelectItem value="nero_opaco">Nero opaco</SelectItem>
                        <SelectItem value="inox">Inox spazzolato</SelectItem>
                        <SelectItem value="bronzo">Bronzo</SelectItem>
                        <SelectItem value="oro">Oro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs mb-1 block">N° cerniere / anta</Label>
                    <Select value={String(cernierePerAnta)} onValueChange={(v) => setCernierePerAnta(Number(v) as 2 | 3)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2">2 (standard)</SelectItem>
                        <SelectItem value="3">3 (porta pesante)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Profile & Hardware Config */}
              <ProfileHardwareConfig
                profiloDimensione={profiloDimensione}
                profiloForma={profiloForma}
                maniglia={maniglia}
                coloreFerratura={coloreFerratura}
                onChange={handleProfileChange}
              />
            </>
          )}

          {/* ── SEZIONE 3: Configura Cassonetto (condizionale) ── */}
          {sostituzione.cassonetto && (
            <div className="border-t pt-4">
              <Label className="text-sm font-semibold mb-3 block">📦 Configura Cassonetto</Label>
              <div className="grid grid-cols-3 gap-2 mb-3">
                {[
                  { value: "sostituisci" as const, emoji: "🔄", label: "Sostituisci" },
                  { value: "rimuovi" as const, emoji: "🚫", label: "Rimuovi" },
                  { value: "mantieni" as const, emoji: "↩", label: "Mantieni" },
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setCassonettoAzione(opt.value)}
                    className={`p-3 rounded-xl border text-center text-sm transition-all ${
                      cassonettoAzione === opt.value ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border"
                    }`}
                  >
                    <span className="text-lg block">{opt.emoji}</span>
                    <span className="text-foreground font-medium">{opt.label}</span>
                  </button>
                ))}
              </div>

              {cassonettoAzione === "sostituisci" && (
                <>
                  <Label className="text-xs font-semibold mb-2 block">Tipo cassonetto</Label>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    {cassonettoPresets.map(p => (
                      <button
                        key={p.value}
                        onClick={() => setCassonettoMateriale(p.value)}
                        className={`flex items-center gap-2 p-3 rounded-xl border text-left transition-all ${
                          cassonettoMateriale === p.value ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border"
                        }`}
                      >
                        {p.icon && <span className="text-lg">{p.icon}</span>}
                        <span className="text-sm font-medium text-foreground">{p.name}</span>
                      </button>
                    ))}
                  </div>

                  <Label className="text-xs font-semibold mb-2 block">Colore cassonetto</Label>
                  <button
                    onClick={() => setCassonettoColoreSameAsInfisso(!cassonettoColoreSameAsInfisso)}
                    className={`w-full flex items-center gap-2 p-3 rounded-xl border text-sm transition-all mb-2 ${
                      cassonettoColoreSameAsInfisso ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border"
                    }`}
                  >
                    <span>🔁</span>
                    <span className="font-medium text-foreground">Uguale all'infisso</span>
                  </button>
                  {!cassonettoColoreSameAsInfisso && (
                    <div className="grid grid-cols-3 gap-2">
                      {cassonettoColoriPresets.filter(p => p.value !== 'uguale_infisso').map(p => (
                        <button
                          key={p.value}
                          onClick={() => setCassonettoColoreValue(p.value)}
                          className={`p-2.5 rounded-xl border text-center transition-all ${
                            cassonettoColoreValue === p.value ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border"
                          }`}
                        >
                          {p.icon && <span className="text-sm">{p.icon}</span>}
                          <span className="text-xs text-foreground block">{p.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ── SEZIONE 4: Configura Tapparella (condizionale) ── */}
          {sostituzione.tapparella && (
            <div className="border-t pt-4">
              <Label className="text-sm font-semibold mb-3 block">🔽 Configura Tapparella / Persiana</Label>
              <div className="grid grid-cols-3 gap-2 mb-3">
                {[
                  { value: "sostituisci" as const, emoji: "🔄", label: "Sostituisci" },
                  { value: "rimuovi" as const, emoji: "🚫", label: "Rimuovi" },
                  { value: "mantieni" as const, emoji: "↩", label: "Mantieni" },
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setTapparellaAzione(opt.value)}
                    className={`p-3 rounded-xl border text-center text-sm transition-all ${
                      tapparellaAzione === opt.value ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border"
                    }`}
                  >
                    <span className="text-lg block">{opt.emoji}</span>
                    <span className="text-foreground font-medium">{opt.label}</span>
                  </button>
                ))}
              </div>

              {tapparellaAzione === "sostituisci" && (
                <>
                  <Label className="text-xs font-semibold mb-2 block">Tipo tapparella</Label>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    {tapparellaPresets.map(p => (
                      <button
                        key={p.value}
                        onClick={() => setTapparellaMateriale(p.value)}
                        className={`flex items-center gap-2 p-3 rounded-xl border text-left transition-all ${
                          tapparellaMateriale === p.value ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border"
                        }`}
                      >
                        {p.icon && <span className="text-lg">{p.icon}</span>}
                        <span className="text-sm font-medium text-foreground">{p.name}</span>
                      </button>
                    ))}
                  </div>

                  <Label className="text-xs font-semibold mb-2 block">Colore lamelle</Label>
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {tapparellaColoriPresets.filter(p => p.value !== 'uguale_infisso').map(p => (
                      <button
                        key={p.value}
                        onClick={() => setTapparellaColoreValue(p.value)}
                        className={`p-2.5 rounded-xl border text-center transition-all ${
                          tapparellaColoreValue === p.value ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border"
                        }`}
                      >
                        {p.icon && <span className="text-sm">{p.icon}</span>}
                        <span className="text-xs text-foreground block">{p.name}</span>
                      </button>
                    ))}
                  </div>

                  <Label className="text-xs font-semibold mb-2 block">Colore guide laterali</Label>
                  <div className="grid grid-cols-4 gap-2 mb-3">
                    <button
                      onClick={() => setTapparellaGuideValue("uguale_infisso")}
                      className={`p-2 rounded-xl border text-center transition-all ${
                        tapparellaGuideValue === "uguale_infisso" ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border"
                      }`}
                    >
                      <span className="text-sm">🔁</span>
                      <span className="text-[10px] text-foreground block">= Infisso</span>
                    </button>
                    {tapparellaColoriPresets.slice(0, 5).filter(p => p.value !== 'uguale_infisso').map(p => (
                      <button
                        key={p.value}
                        onClick={() => setTapparellaGuideValue(p.value)}
                        className={`p-2 rounded-xl border text-center transition-all ${
                          tapparellaGuideValue === p.value ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border"
                        }`}
                      >
                        {p.icon && <span className="text-sm">{p.icon}</span>}
                        <span className="text-[10px] text-foreground block">{p.name}</span>
                      </button>
                    ))}
                  </div>

                  <Label className="text-xs font-semibold mb-2 block">Come mostrarla nel render?</Label>
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {[
                      { value: "chiusa" as const, emoji: "⬛", label: "Chiusa", sub: "Copre vetro" },
                      { value: "mezza" as const, emoji: "◧", label: "Mezza", sub: "Metà abbassata" },
                      { value: "aperta" as const, emoji: "⬜", label: "Aperta", sub: "Avvolta su" },
                    ].map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => setTapparellaStato(opt.value)}
                        className={`p-3 rounded-xl border text-center transition-all ${
                          tapparellaStato === opt.value ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border"
                        }`}
                      >
                        <span className="text-xl block">{opt.emoji}</span>
                        <span className="text-xs font-medium text-foreground block">{opt.label}</span>
                        <span className="text-[10px] text-muted-foreground">{opt.sub}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Note */}
          <div>
            <Label className="text-sm font-semibold mb-2 block">Note Aggiuntive</Label>
            <Textarea
              placeholder="Es. Finestra con 3 ante, balcone al secondo piano..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Genera button */}
          {nessunElementoSelezionato && (
            <p className="text-sm text-destructive text-center">⚠ Seleziona almeno un elemento da sostituire</p>
          )}
          <Button
            className="w-full"
            size="lg"
            onClick={startRender}
            disabled={nessunElementoSelezionato || analysisLoading}
          >
            {analysisLoading ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Analisi in corso...</>
            ) : (
              <><Sparkles className="h-4 w-4 mr-2" /> Genera Render AI</>
            )}
          </Button>
        </div>
      )}

      {/* Step 2: Processing */}
      {step === 2 && (
        <div className="text-center py-16 space-y-6">
          <div className="relative w-24 h-24 mx-auto">
            <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
            <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
            <Sparkles className="absolute inset-0 m-auto h-8 w-8 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground mb-2">Generazione in corso</h2>
            <p className="text-muted-foreground animate-pulse">{processingMessages[msgIndex]}</p>
          </div>
          <p className="text-xs text-muted-foreground">Tempo stimato: 15-30 secondi</p>
        </div>
      )}

      {/* Step 3: Results */}
      {step === 3 && resultUrls.length > 0 && (
        <div className="space-y-6">
          <BeforeAfterSlider
            beforeSrc={preview}
            afterSrc={resultUrls[0]}
            className="aspect-[4/3]"
          />

          {resultUrls.length > 1 && (
            <div>
              <Label className="text-sm font-semibold mb-2 block">Varianti</Label>
              <div className="grid grid-cols-3 gap-2">
                {resultUrls.map((url, i) => (
                  <button key={i} className="rounded-lg overflow-hidden border-2 border-transparent hover:border-primary transition-colors">
                    <img src={url} alt={`Variante ${i + 1}`} className="w-full aspect-square object-cover" />
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => navigate("/app/render/new")}>
              Nuovo Render
            </Button>
            <Button className="flex-1" onClick={() => saveToGallery(0)}>
              <Check className="h-4 w-4 mr-2" /> Salva in Galleria
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
