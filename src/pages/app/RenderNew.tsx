import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyId } from "@/hooks/useCompanyId";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { validatePhoto, checkImageDimensions } from "@/modules/render/lib/promptBuilder";
import BeforeAfterSlider from "@/components/render/BeforeAfterSlider";
import {
  Camera, Upload, ArrowLeft, ArrowRight, Check, Loader2,
  Sparkles, Image as ImageIcon, ChevronLeft
} from "lucide-react";

interface Preset {
  id: string;
  category: string;
  name: string;
  value: string;
  prompt_fragment: string;
  icon: string | null;
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

  // Load presets
  useEffect(() => {
    supabase.from("render_infissi_presets").select("*").eq("is_active", true).order("sort_order")
      .then(({ data }) => { if (data) setPresets(data as any); });
  }, []);

  const categories = ["materiale", "colore", "stile", "vetro", "oscurante"];
  const categoryLabels: Record<string, string> = {
    materiale: "Materiale",
    colore: "Colore",
    stile: "Stile Telaio",
    vetro: "Tipo Vetro",
    oscurante: "Oscurante",
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

  // Step 1 → 2: Upload photo to storage
  const goToStep2 = async () => {
    if (!file || !companyId) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${companyId}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("render-originals").upload(path, file);
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("render-originals").getPublicUrl(path);

      // Create session
      const { data: session, error: sessErr } = await supabase.from("render_sessions").insert({
        company_id: companyId,
        created_by: user?.id,
        original_photo_url: urlData.publicUrl,
        status: "configuring",
      }).select("id").single();
      if (sessErr) throw sessErr;
      setSessionId(session.id);
      setStep(1);
    } catch (err: any) {
      toast({ title: "Errore upload", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  // Step 2 → 3: Start render
  const startRender = async () => {
    if (!sessionId || !companyId) return;

    // Build fragments
    const fragments: Record<string, string> = {};
    for (const cat of categories) {
      const preset = presets.find(p => p.category === cat && p.value === config[cat]);
      if (preset) fragments[cat] = preset.prompt_fragment;
    }

    // Update session config
    await supabase.from("render_sessions").update({
      config: { ...config, notes, fragments },
      status: "queued",
    }).eq("id", sessionId);

    setStep(2);

    // Call edge function
    try {
      const { data, error } = await supabase.functions.invoke("generate-render", {
        body: { session_id: sessionId },
      });
      if (error) throw error;
    } catch (err: any) {
      toast({ title: "Errore", description: err.message, variant: "destructive" });
    }
  };

  // Poll status during step 3
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
    "Generazione del nuovo infisso...",
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
                <Button className="flex-1" onClick={goToStep2} disabled={uploading}>
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

          <div>
            <Label className="text-sm font-semibold mb-2 block">Note Aggiuntive</Label>
            <Textarea
              placeholder="Es. Finestra con 3 ante, balcone al secondo piano..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          <Button className="w-full" size="lg" onClick={startRender}>
            <Sparkles className="h-4 w-4 mr-2" /> Genera Render AI
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
