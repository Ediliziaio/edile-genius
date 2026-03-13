import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyId } from "@/hooks/useCompanyId";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import BeforeAfterSlider from "@/components/render/BeforeAfterSlider";
import {
  Bath, Upload, ArrowRight, ArrowLeft, Loader2,
  CheckCircle2, RefreshCw, Download, Save, Sparkles,
} from "lucide-react";

import type {
  AnalysiBagno, ConfigurazioneBagno, SostituzioneElementi,
  ConfigPiastrella, ConfigDoccia, ConfigVasca, ConfigVanity,
  ConfigSanitari, ConfigRubinetteria, ConfigParete, ConfigLayout,
  TipoIntervento,
} from "@/modules/render-bagno/lib/bathroomPromptBuilder";
import { buildBathroomPrompt } from "@/modules/render-bagno/lib/bathroomPromptBuilder";
import { BathroomLayoutPlanner } from "@/components/render-bagno/BathroomLayoutPlanner";
import { StiliProntiPicker } from "@/components/render-bagno/StiliProntiPicker";

// ── Preset type from DB ──────────────────────────────────────────
interface BagnoPreset {
  id: string;
  category: string;
  name: string;
  value: string;
  prompt_fragment: string;
  icon: string | null;
  sort_order: number;
}

const STEPS = ["Foto", "Tipo", "Configura", "Genera", "Risultato"];

// ── Intervention type options ────────────────────────────────────
const INTERVENTO_OPTIONS: { val: TipoIntervento; icon: string; title: string; sub: string }[] = [
  { val: "restyling_piastrelle", icon: "🔲", title: "Solo Piastrelle", sub: "Cambia piastrelle e pavimento" },
  { val: "restyling_completo", icon: "✨", title: "Restyling Completo", sub: "Piastrelle + doccia + mobile + rubinetteria" },
  { val: "demolizione_parziale", icon: "🔨", title: "Demolizione Parziale", sub: "Rimuovi e sposta alcuni elementi" },
  { val: "demolizione_completa", icon: "🏗️", title: "Rifacimento Totale", sub: "Nuovo layout e tutti gli elementi" },
];

const ELEMENTI = [
  { key: "piastrelle_parete" as const, label: "Piastrelle parete", icon: "🔲" },
  { key: "pavimento" as const, label: "Pavimento", icon: "🏠" },
  { key: "doccia" as const, label: "Doccia", icon: "🚿" },
  { key: "vasca" as const, label: "Vasca", icon: "🛁" },
  { key: "mobile_bagno" as const, label: "Mobile bagno", icon: "🪑" },
  { key: "sanitari" as const, label: "WC & Bidet", icon: "🚽" },
  { key: "rubinetteria" as const, label: "Rubinetteria", icon: "🔧" },
  { key: "parete_colore" as const, label: "Colore pareti", icon: "🎨" },
  { key: "illuminazione" as const, label: "Illuminazione", icon: "💡" },
];

// ── Inline option sets (used when presets not loaded) ─────────────
const TILE_EFFECTS = [
  { value: "marmo_carrara", label: "Marmo Carrara", prompt: "Carrara white marble with fine grey veining" },
  { value: "marmo_calacatta", label: "Marmo Calacatta", prompt: "Calacatta marble with bold gold veining" },
  { value: "marmo_sahara_noir", label: "Sahara Noir", prompt: "Black marble with gold veining" },
  { value: "cemento_grigio", label: "Cemento Grigio", prompt: "Grey concrete effect matte" },
  { value: "cemento_bianco", label: "Cemento Bianco", prompt: "White concrete matte" },
  { value: "legno_rovere_chiaro", label: "Rovere Chiaro", prompt: "Light oak wood-effect porcelain" },
  { value: "legno_rovere_scuro", label: "Rovere Scuro", prompt: "Dark oak wood-effect porcelain" },
  { value: "pietra_ardesia", label: "Ardesia", prompt: "Dark slate stone cleft texture" },
  { value: "travertino", label: "Travertino", prompt: "Warm ivory travertine with linear voids" },
  { value: "mono_bianco", label: "Bianco Lucido", prompt: "Glossy white ceramic uniform" },
  { value: "mono_nero", label: "Nero Lucido", prompt: "Glossy black porcelain uniform" },
  { value: "mosaico_esagoni", label: "Mosaico Esagoni", prompt: "Hexagonal mosaic tiles" },
];
const TILE_FORMATS = ["30x60", "60x60", "60x120", "80x80", "120x120", "120x240"];
const TILE_POSA = [
  { value: "orizzontale", label: "Orizzontale" },
  { value: "verticale", label: "Verticale" },
  { value: "sfalsata_50", label: "Sfalsata 50%" },
  { value: "spina_pesce", label: "Spina di Pesce" },
  { value: "quadri_dritti", label: "Quadri Dritti" },
];
const FUGA_OPTIONS = [
  { value: "fuga_bianca", label: "Bianca" },
  { value: "fuga_grigio_chiaro", label: "Grigio Chiaro" },
  { value: "fuga_grigio", label: "Grigio" },
  { value: "fuga_nera", label: "Nera" },
];
const SHOWER_TYPES = [
  { value: "walk_in", label: "Walk-in", prompt: "Open walk-in shower, modern minimalist" },
  { value: "nicchia_box", label: "Nicchia Box", prompt: "Alcove shower with glass door" },
  { value: "angolare", label: "Angolare", prompt: "Corner shower, two glass panels at 90°" },
  { value: "semicircolare", label: "Semicircolare", prompt: "Quadrant shower curved glass" },
];
const BOX_OPTIONS = [
  { value: "box_trasparente", label: "Trasparente", prompt: "clear transparent glass shower screen" },
  { value: "box_satinato", label: "Satinato", prompt: "frosted/satin glass shower screen" },
  { value: "box_fume", label: "Fumé", prompt: "smoked grey tinted glass shower screen" },
];
const PIATTO_OPTIONS = [
  { value: "piatto_gres_filo", label: "Filo Pavimento", prompt: "flush floor-level shower tray in matching floor tile" },
  { value: "piatto_ceramica", label: "Ceramica", prompt: "white ceramic shower tray 3cm raised" },
  { value: "piatto_ardesia", label: "Ardesia", prompt: "dark slate textured shower tray" },
  { value: "piatto_resina_grigio", label: "Resina Grigio", prompt: "grey resin mineral shower tray" },
];
const PROFILO_OPTIONS = [
  { value: "profilo_cromo", label: "Cromo", prompt: "polished chrome metal profiles" },
  { value: "profilo_nero", label: "Nero", prompt: "matte black metal profiles" },
  { value: "profilo_oro", label: "Oro", prompt: "brushed gold/brass metal profiles" },
  { value: "profilo_nessuno", label: "Senza Profilo", prompt: "frameless glass, no visible profiles" },
];
const SOFFIONE_OPTIONS = [
  { value: "a_parete", label: "A Parete" },
  { value: "pioggia_soffitto", label: "Pioggia Soffitto" },
  { value: "colonna", label: "Colonna" },
  { value: "combinato", label: "Combinato" },
];
const VASCA_TYPES = [
  { value: "vasca_freestanding", label: "Freestanding", prompt: "freestanding bathtub on floor" },
  { value: "vasca_freestanding_muro", label: "Freestanding a Muro", prompt: "freestanding bathtub against wall" },
  { value: "vasca_incassata", label: "Incassata", prompt: "built-in recessed bathtub" },
  { value: "vasca_angolare", label: "Angolare", prompt: "corner bathtub" },
];
const VASCA_FORME = [
  { value: "forma_rett", label: "Rettangolare", prompt: "rectangular straight-edge bathtub" },
  { value: "forma_ovale", label: "Ovale", prompt: "oval rounded bathtub" },
  { value: "forma_retro", label: "Retrò", prompt: "vintage clawfoot roll-top bathtub" },
];
const VASCA_MATERIALI = [
  { value: "vasca_bianca_lucida", label: "Bianca Lucida", prompt: "glossy white acrylic/ceramic" },
  { value: "vasca_bianca_opaca", label: "Bianca Opaca", prompt: "matte white solid surface" },
  { value: "vasca_nera_opaca", label: "Nera Opaca", prompt: "matte black solid surface" },
];
const VANITY_STILI = [
  { value: "vanity_sospeso_moderno", label: "Sospeso Moderno", prompt: "wall-mounted floating modern vanity" },
  { value: "vanity_terra_classico", label: "A Terra Classico", prompt: "floor-standing classic vanity with legs" },
  { value: "vanity_terra_moderno", label: "A Terra Moderno", prompt: "floor-standing contemporary vanity" },
];
const VANITY_PIANI = [
  { value: "piano_ceramica", label: "Ceramica", prompt: "white ceramic countertop" },
  { value: "piano_marmo", label: "Marmo", prompt: "marble countertop with veining" },
  { value: "piano_legno", label: "Legno", prompt: "natural wood countertop" },
  { value: "piano_resina", label: "Resina", prompt: "solid surface resin countertop" },
];
const LAVABO_OPTIONS = [
  { value: "integrato", label: "Integrato" },
  { value: "appoggio_ovale", label: "Appoggio Ovale" },
  { value: "appoggio_rettangolare", label: "Appoggio Rettangolare" },
  { value: "semincasso", label: "Semincasso" },
];
const RUBINETTERIA_FINITURE = [
  { value: "cromo", label: "Cromo", prompt: "polished chrome — mirror-like reflective" },
  { value: "nero_opaco", label: "Nero Opaco", prompt: "matte black powder-coated" },
  { value: "oro_spazzolato", label: "Oro Spazzolato", prompt: "brushed gold/brass satin" },
  { value: "inox_spazzolato", label: "Inox Spazzolato", prompt: "brushed stainless steel" },
  { value: "bronzo", label: "Bronzo", prompt: "antique bronze patina" },
];
const RUBINETTERIA_STILI = [
  { value: "stile_quadro", label: "Quadro" },
  { value: "stile_tondo", label: "Tondo" },
  { value: "stile_industrial", label: "Industrial" },
  { value: "stile_vintage", label: "Vintage" },
];
const PARETE_TIPI = [
  { value: "parete_tinta", label: "Tinta Unita" },
  { value: "parete_mista", label: "Mista (Piastrelle + Tinta)" },
  { value: "parete_lastra_cemento", label: "Lastra Cemento" },
];
const ILLUMINAZIONE_OPTIONS = [
  { value: "faretti", label: "Faretti a Incasso", icon: "💡" },
  { value: "plafoniera", label: "Plafoniera", icon: "🔆" },
  { value: "specchio_led", label: "Specchio LED", icon: "🪞" },
  { value: "led_profilo", label: "LED Profilo", icon: "✨" },
];

// ── Inline option picker ─────────────────────────────────────────
function OptionGrid({ options, value, onChange, columns = 3 }: {
  options: { value: string; label: string; icon?: string; prompt?: string }[];
  value: string;
  onChange: (val: string, prompt?: string) => void;
  columns?: number;
}) {
  return (
    <div className={`grid gap-2 ${columns === 2 ? "grid-cols-2" : columns === 4 ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-2 sm:grid-cols-3"}`}>
      {options.map(opt => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value, opt.prompt)}
          className={`p-3 rounded-xl border text-sm text-left transition-all ${
            value === opt.value
              ? "border-primary bg-primary/5 ring-1 ring-primary"
              : "border-border hover:border-primary/30"
          }`}
        >
          {opt.icon && <span className="mr-1.5">{opt.icon}</span>}
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════
export default function RenderBagnoNew() {
  const navigate = useNavigate();
  const companyId = useCompanyId();
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Step ───────────────────────────────────────────────────────
  const [step, setStep] = useState(0); // 0-4

  // ── Step 0: Foto ──────────────────────────────────────────────
  const [file, setFile] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [analisi, setAnalisi] = useState<AnalysiBagno | null>(null);
  const [sessionId, setSessionId] = useState("");
  const [originalPath, setOriginalPath] = useState("");

  // ── Step 1: Tipo ──────────────────────────────────────────────
  const [tipoIntervento, setTipoIntervento] = useState<TipoIntervento>("restyling_completo");
  const [sostituzione, setSostituzione] = useState<SostituzioneElementi>({
    piastrelle_parete: true, pavimento: true, doccia: true,
    vasca: false, mobile_bagno: true, sanitari: false,
    rubinetteria: true, parete_colore: false, illuminazione: false,
  });

  // ── Step 2: Config ────────────────────────────────────────────
  const [piastrelleParete, setPiastrelleParete] = useState<ConfigPiastrella>({
    effetto: "marmo_carrara", formato: "60x120", posa: "orizzontale",
    fuga_colore: "fuga_bianca", prompt_effetto: "Carrara white marble with fine grey veining",
  });
  const [pavimento, setPavimento] = useState<ConfigPiastrella>({
    effetto: "cemento_grigio", formato: "60x60", posa: "quadri_dritti",
    fuga_colore: "fuga_grigio", prompt_effetto: "Grey concrete effect matte",
  });
  const [configDoccia, setConfigDoccia] = useState<ConfigDoccia>({
    azione: "sostituisci", tipo: "walk_in", box: "box_trasparente",
    piatto: "piatto_gres_filo", profilo: "profilo_nero", soffione: "pioggia_soffitto",
    prompt_box: "clear transparent glass shower screen",
    prompt_piatto: "flush floor-level shower tray in matching floor tile",
    prompt_profilo: "matte black metal profiles",
  });
  const [configVasca, setConfigVasca] = useState<ConfigVasca>({
    azione: "mantieni", tipo: "vasca_freestanding", forma: "forma_ovale",
    materiale: "vasca_bianca_opaca", posizione: "parete_lunga",
    prompt_tipo: "freestanding bathtub on floor",
    prompt_forma: "oval rounded bathtub",
    prompt_materiale: "matte white solid surface",
  });
  const [configVanity, setConfigVanity] = useState<ConfigVanity>({
    azione: "sostituisci", stile: "vanity_sospeso_moderno", colore: "#1A1A1A",
    piano: "piano_marmo", lavabo: "appoggio_rettangolare", larghezza_cm: 100,
    prompt_stile: "wall-mounted floating modern vanity",
    prompt_piano: "marble countertop with veining",
  });
  const [configSanitari, setConfigSanitari] = useState<ConfigSanitari>({
    azione_wc: "mantieni", wc_tipo: "sospeso", azione_bidet: "mantieni", colore: "bianco",
  });
  const [configRubinetteria, setConfigRubinetteria] = useState<ConfigRubinetteria>({
    azione: "sostituisci", finitura: "nero_opaco", stile: "stile_quadro",
    prompt_finitura: "matte black powder-coated",
  });
  const [configParete, setConfigParete] = useState<ConfigParete>({
    azione: "mantieni", tipo: "parete_tinta",
  });
  const [configLayout, setConfigLayout] = useState<ConfigLayout>({
    attivo: false, larghezza_cm: 250, lunghezza_cm: 300,
    posizione_doccia: "fondo_sinistra", posizione_vasca: "parete_lunga",
    posizione_mobile: "parete_lunga", posizione_wc: "accanto_mobile",
  });
  const [illuminazioneTipo, setIlluminazioneTipo] = useState("faretti");

  // ── Step 3-4: Generation ──────────────────────────────────────
  const [rendering, setRendering] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);
  const [renderUrl, setRenderUrl] = useState("");
  const [renderError, setRenderError] = useState("");
  const [showComparison, setShowComparison] = useState(false);
  const [savedToGallery, setSavedToGallery] = useState(false);

  // ══════════════════════════════════════════════════════════════
  // HANDLERS
  // ══════════════════════════════════════════════════════════════

  const handleFotoSelect = useCallback(async (f: File) => {
    if (!companyId || !user) {
      toast({ title: "Errore", description: "Sessione non valida", variant: "destructive" });
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      toast({ title: "File troppo grande", description: "Max 10MB", variant: "destructive" });
      return;
    }
    setFile(f);
    if (fotoPreview) URL.revokeObjectURL(fotoPreview);
    setFotoPreview(URL.createObjectURL(f));
    setAnalisi(null);
    setAnalyzing(true);

    try {
      // 1. Create session
      const { data: session, error: sessErr } = await (supabase.from("render_bagno_sessions") as any)
        .insert({ company_id: companyId, created_by: user.id, stato: "analisi" })
        .select("id")
        .single();
      if (sessErr || !session) throw new Error("Impossibile creare sessione");
      setSessionId(session.id);

      // 2. Upload photo
      const ext = f.name.split(".").pop() || "jpg";
      const path = `${companyId}/${session.id}/originale.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from("bagno-originals")
        .upload(path, f, { contentType: f.type, upsert: false });
      if (uploadErr) throw new Error("Upload foto fallito");
      setOriginalPath(path);

      // 3. Get signed URL for analysis
      const { data: signedData } = await supabase.storage
        .from("bagno-originals")
        .createSignedUrl(path, 3600);

      // 4. Call analyze-bathroom-photo
      const { data: analysisData, error: analyzeErr } = await supabase.functions
        .invoke("analyze-bathroom-photo", {
          body: { image_url: signedData?.signedUrl },
        });
      if (analyzeErr) throw new Error("Analisi fallita");

      // Normalize envelope: new format { ok, data: { analysis } } vs legacy { analysis }
      const analysisPayload = analysisData?.data ?? analysisData;
      const result = analysisPayload?.analysis ?? analysisPayload;
      setAnalisi(result as AnalysiBagno);

      // 5. Update session
      await (supabase.from("render_bagno_sessions") as any)
        .update({ foto_originale_path: path, analisi_bagno: result, stato: "configurazione" })
        .eq("id", session.id);

    } catch (err: any) {
      console.error(err);
      toast({ title: "Errore", description: err.message || "Analisi fallita", variant: "destructive" });
    } finally {
      setAnalyzing(false);
    }
  }, [companyId, user, toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) handleFotoSelect(f);
  }, [handleFotoSelect]);

  const selectTipoIntervento = (val: TipoIntervento) => {
    setTipoIntervento(val);
    setConfigLayout(prev => ({ ...prev, attivo: false }));
    if (val === "restyling_piastrelle") {
      setSostituzione({ piastrelle_parete: true, pavimento: true, doccia: false, vasca: false, mobile_bagno: false, sanitari: false, rubinetteria: false, parete_colore: false, illuminazione: false });
    } else if (val === "restyling_completo") {
      setSostituzione({ piastrelle_parete: true, pavimento: true, doccia: true, vasca: false, mobile_bagno: true, sanitari: false, rubinetteria: true, parete_colore: false, illuminazione: false });
    } else if (val === "demolizione_parziale") {
      setSostituzione({ piastrelle_parete: true, pavimento: true, doccia: true, vasca: false, mobile_bagno: true, sanitari: false, rubinetteria: true, parete_colore: true, illuminazione: false });
    } else if (val === "demolizione_completa") {
      setSostituzione({ piastrelle_parete: true, pavimento: true, doccia: true, vasca: true, mobile_bagno: true, sanitari: true, rubinetteria: true, parete_colore: true, illuminazione: false });
      setConfigLayout(prev => ({ ...prev, attivo: true }));
    }
  };

  const startRender = async () => {
    if (!sessionId || !originalPath || !analisi) return;
    setRendering(true);
    setRenderError("");
    setStep(3);
    setRenderProgress(0);

    const cfg: ConfigurazioneBagno = {
      tipo_intervento: tipoIntervento,
      sostituzione,
      piastrelle_parete: piastrelleParete,
      pavimento,
      doccia: configDoccia,
      vasca: configVasca,
      vanity: configVanity,
      sanitari: configSanitari,
      rubinetteria: configRubinetteria,
      parete: configParete,
      layout: configLayout,
      illuminazione_tipo: illuminazioneTipo,
    };

    const { userPrompt, systemPrompt } = buildBathroomPrompt(analisi, cfg);

    // Save configuration to session BEFORE invoking edge function
    await (supabase.from("render_bagno_sessions") as any)
      .update({ configurazione: cfg, analisi_bagno: analisi, stato: "pending" })
      .eq("id", sessionId);

    // Fake progress animation
    const interval = setInterval(() => {
      setRenderProgress(p => Math.min(p + 2, 90));
    }, 600);

    try {
      const { data: result, error } = await supabase.functions
        .invoke("generate-bathroom-render", {
          body: {
            session_id: sessionId,
          },
        });

      clearInterval(interval);

      // Normalize envelope: new format { ok, data: { result_url } } vs legacy { result_url }
      const payload = result?.data ?? result;
      if (error || !payload?.result_url) {
        setRenderError(error?.message || payload?.error || "Render non riuscito");
        setRendering(false);
        return;
      }

      setRenderProgress(100);
      setRenderUrl(payload.result_url);
      setStep(4);
    } catch {
      clearInterval(interval);
      setRenderError("Errore durante la generazione del render");
    } finally {
      setRendering(false);
    }
  };

  const saveToGallery = async () => {
    if (!renderUrl || !sessionId || !companyId || !user) return;

    // bagno-originals is a PRIVATE bucket — use a long-lived signed URL for gallery original
    const { data: signedOriginal } = await supabase.storage.from("bagno-originals").createSignedUrl(originalPath, 31536000); // 1 year
    const permanentOriginalUrl = signedOriginal?.signedUrl || "";

    const { error } = await (supabase.from("render_bagno_gallery") as any)
      .insert({
        company_id: companyId,
        created_by: user.id,
        session_id: sessionId,
        titolo: `Bagno ${new Date().toLocaleDateString("it-IT")}`,
        originale_url: permanentOriginalUrl,
        render_url: renderUrl,
        configurazione: { tipoIntervento, sostituzione },
      });
    if (!error) {
      setSavedToGallery(true);
      toast({ title: "Salvato!", description: "Render aggiunto alla gallery" });
    }
  };

  // ══════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-20">
      {/* Header */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <button onClick={() => navigate("/app/render-bagno")} className="hover:text-foreground transition-colors">
          ← Render Bagno
        </button>
        <span>/</span>
        <span className="text-foreground font-medium">{STEPS[step]}</span>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-1">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
              step === i ? "bg-primary text-primary-foreground" :
              step > i ? "bg-green-500 text-white" :
              "bg-muted text-muted-foreground"
            }`}>
              {step > i ? "✓" : i + 1}
            </div>
            {i < STEPS.length - 1 && (
              <div className={`w-8 h-0.5 ${step > i ? "bg-green-500" : "bg-muted"}`} />
            )}
          </div>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════
          STEP 0 — UPLOAD FOTO + ANALISI
          ══════════════════════════════════════════════════════════ */}
      {step === 0 && (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Carica foto del bagno attuale</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Scatta o carica una foto chiara del bagno. L'AI analizzerà automaticamente tutti gli elementi.
            </p>
          </div>

          {!file ? (
            <div
              onDragOver={e => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-border rounded-2xl p-6 md:p-12 text-center cursor-pointer hover:border-primary/50 hover:bg-accent/30 transition-all"
            >
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-40" />
              <p className="text-lg font-medium text-foreground">Carica foto bagno</p>
              <p className="text-sm text-muted-foreground mt-1">JPG, PNG, WEBP — max 10MB</p>
              <p className="text-xs text-muted-foreground mt-3">💡 Consiglio: foto dall'entrata del bagno per inquadrare tutto</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative rounded-2xl overflow-hidden">
                <img src={fotoPreview} alt="Foto bagno" className="w-full max-h-[50vh] object-contain bg-muted" />
                <button
                  onClick={() => { setFile(null); setFotoPreview(""); setAnalisi(null); }}
                  className="absolute top-3 right-3 bg-black/60 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-black/80 text-sm"
                >
                  ✕
                </button>
              </div>

              {analyzing && (
                <Card>
                  <CardContent className="py-6 flex items-center gap-4">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <div>
                      <p className="font-medium text-foreground">Analisi AI in corso...</p>
                      <p className="text-sm text-muted-foreground">Rilevo piastrelle, doccia, vasca, mobili e stile</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {analisi && !analyzing && (
                <Card className="border-green-500/30 bg-green-500/5">
                  <CardContent className="py-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                      <span className="font-medium text-foreground">Analisi completata</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {[
                        analisi.dimensione_stimata && `📐 ${analisi.dimensione_stimata}`,
                        analisi.presenza_vasca && `🛁 Vasca ${analisi.tipo_vasca_attuale || ""}`,
                        analisi.presenza_doccia && `🚿 Doccia ${analisi.tipo_doccia_attuale || ""}`,
                        analisi.presenza_mobile_bagno && `🪑 Mobile ${analisi.colore_mobile_dominante || ""}`,
                        analisi.piastrelle_parete_effetto && `🔲 ${analisi.piastrelle_parete_effetto}`,
                        analisi.pavimento_effetto && `🏠 ${analisi.pavimento_effetto}`,
                        analisi.rubinetteria_finitura && `🔧 ${analisi.rubinetteria_finitura}`,
                        analisi.stile_generale && `✨ ${analisi.stile_generale}`,
                      ].filter(Boolean).map((tag, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">{tag}</Badge>
                      ))}
                    </div>
                    {analisi.note_critiche && (
                      <p className="text-xs text-muted-foreground bg-muted rounded-lg p-2">⚠️ {analisi.note_critiche}</p>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic"
            className="hidden"
            onChange={e => e.target.files?.[0] && handleFotoSelect(e.target.files[0])}
          />

          <Button
            disabled={!analisi}
            onClick={() => setStep(1)}
            className="w-full py-3 rounded-xl"
            size="lg"
          >
            Avanti: Tipo Intervento <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          STEP 1 — TIPO INTERVENTO + SELEZIONE ELEMENTI
          ══════════════════════════════════════════════════════════ */}
      {step === 1 && (
        <div className="space-y-6">
          {/* Stili Pronti */}
          <StiliProntiPicker onApply={(cfg) => {
            if (cfg.piastrelle_parete) setPiastrelleParete(prev => ({ ...prev, ...cfg.piastrelle_parete }));
            if (cfg.pavimento) setPavimento(prev => ({ ...prev, ...cfg.pavimento }));
            if (cfg.doccia) setConfigDoccia(prev => ({ ...prev, ...cfg.doccia }));
            if (cfg.vasca) setConfigVasca(prev => ({ ...prev, ...cfg.vasca }));
            if (cfg.vanity) setConfigVanity(prev => ({ ...prev, ...cfg.vanity }));
            if (cfg.rubinetteria) setConfigRubinetteria(prev => ({ ...prev, ...cfg.rubinetteria }));
            if (cfg.parete) setConfigParete(prev => ({ ...prev, ...cfg.parete }));
            if (cfg.sanitari) setConfigSanitari(prev => ({ ...prev, ...cfg.sanitari }));
            setSostituzione(prev => ({
              ...prev,
              piastrelle_parete: !!cfg.piastrelle_parete,
              pavimento: !!cfg.pavimento,
              doccia: !!cfg.doccia,
              vasca: !!cfg.vasca,
              mobile_bagno: !!cfg.vanity,
              rubinetteria: !!cfg.rubinetteria,
              parete_colore: !!cfg.parete,
              sanitari: !!cfg.sanitari,
            }));
            toast({ title: "Stile applicato", description: "Puoi personalizzare ogni elemento nel passo successivo" });
          }} />

          <h1 className="text-2xl font-bold text-foreground">Tipo di intervento</h1>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {INTERVENTO_OPTIONS.map(opt => (
              <button
                key={opt.val}
                onClick={() => selectTipoIntervento(opt.val)}
                className={`p-4 rounded-2xl border-2 text-left transition-all ${
                  tipoIntervento === opt.val
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "border-border hover:border-primary/30"
                }`}
              >
                <span className="text-2xl">{opt.icon}</span>
                <p className="font-semibold text-foreground mt-1">{opt.title}</p>
                <p className="text-xs text-muted-foreground">{opt.sub}</p>
              </button>
            ))}
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-semibold">Elementi da modificare:</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {ELEMENTI.map(el => (
                <button
                  key={el.key}
                  onClick={() => setSostituzione(prev => ({ ...prev, [el.key]: !prev[el.key] }))}
                  className={`flex items-center gap-2 p-3 rounded-xl border text-sm text-left transition-all ${
                    sostituzione[el.key]
                      ? "border-primary bg-primary/5"
                      : "border-border opacity-60"
                  }`}
                >
                  <div className={`w-5 h-5 rounded border flex items-center justify-center text-xs ${
                    sostituzione[el.key] ? "bg-primary text-primary-foreground border-primary" : "border-muted-foreground"
                  }`}>
                    {sostituzione[el.key] && "✓"}
                  </div>
                  <span>{el.icon} {el.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep(0)} className="flex-1 rounded-xl">
              <ArrowLeft className="h-4 w-4 mr-2" /> Indietro
            </Button>
            <Button onClick={() => setStep(2)} className="flex-1 rounded-xl">
              Avanti: Configura <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          STEP 2 — CONFIGURAZIONE DETTAGLIATA
          ══════════════════════════════════════════════════════════ */}
      {step === 2 && (
        <div className="space-y-6">
          <h1 className="text-2xl font-bold text-foreground">Configura il nuovo bagno</h1>

          {/* Layout planner per demolizione completa */}
          {tipoIntervento === "demolizione_completa" && (
            <Card>
              <CardContent className="py-4 space-y-4">
                <h3 className="font-semibold text-foreground">🏗️ Layout Nuovo Bagno</h3>
                <BathroomLayoutPlanner value={configLayout} onChange={setConfigLayout} />
              </CardContent>
            </Card>
          )}

          {/* Piastrelle Parete */}
          {sostituzione.piastrelle_parete && (
            <Card>
              <CardContent className="py-4 space-y-4">
                <h3 className="font-semibold text-foreground">🔲 Piastrelle Parete</h3>
                <div className="space-y-3">
                  <Label className="text-xs text-muted-foreground">Effetto</Label>
                  <OptionGrid
                    options={TILE_EFFECTS}
                    value={piastrelleParete.effetto}
                    onChange={(v, p) => setPiastrelleParete(prev => ({ ...prev, effetto: v, prompt_effetto: p || "" }))}
                    columns={4}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Formato</Label>
                      <OptionGrid
                        options={TILE_FORMATS.map(f => ({ value: f, label: f }))}
                        value={piastrelleParete.formato}
                        onChange={v => setPiastrelleParete(prev => ({ ...prev, formato: v }))}
                        columns={3}
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Posa</Label>
                      <OptionGrid
                        options={TILE_POSA}
                        value={piastrelleParete.posa}
                        onChange={v => setPiastrelleParete(prev => ({ ...prev, posa: v }))}
                        columns={2}
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Fuga</Label>
                    <OptionGrid
                      options={FUGA_OPTIONS}
                      value={piastrelleParete.fuga_colore}
                      onChange={v => setPiastrelleParete(prev => ({ ...prev, fuga_colore: v }))}
                      columns={4}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Pavimento */}
          {sostituzione.pavimento && (
            <Card>
              <CardContent className="py-4 space-y-4">
                <h3 className="font-semibold text-foreground">🏠 Pavimento</h3>
                <Label className="text-xs text-muted-foreground">Effetto</Label>
                <OptionGrid
                  options={TILE_EFFECTS}
                  value={pavimento.effetto}
                  onChange={(v, p) => setPavimento(prev => ({ ...prev, effetto: v, prompt_effetto: p || "" }))}
                  columns={4}
                />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Formato</Label>
                    <OptionGrid
                      options={TILE_FORMATS.map(f => ({ value: f, label: f }))}
                      value={pavimento.formato}
                      onChange={v => setPavimento(prev => ({ ...prev, formato: v }))}
                      columns={3}
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Posa</Label>
                    <OptionGrid
                      options={TILE_POSA}
                      value={pavimento.posa}
                      onChange={v => setPavimento(prev => ({ ...prev, posa: v }))}
                      columns={2}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Doccia */}
            <Card>
              <CardContent className="py-4 space-y-4">
                <h3 className="font-semibold text-foreground">🚿 Doccia{!sostituzione.doccia ? " (personalizza stile)" : ""}</h3>
                <Label className="text-xs text-muted-foreground">Tipo</Label>
                <OptionGrid
                  options={SHOWER_TYPES}
                  value={configDoccia.tipo}
                  onChange={(v, p) => setConfigDoccia(prev => ({ ...prev, tipo: v }))}
                  columns={4}
                />
                <Label className="text-xs text-muted-foreground">Box</Label>
                <OptionGrid
                  options={BOX_OPTIONS}
                  value={configDoccia.box}
                  onChange={(v, p) => setConfigDoccia(prev => ({ ...prev, box: v, prompt_box: p || "" }))}
                  columns={3}
                />
                <Label className="text-xs text-muted-foreground">Piatto Doccia</Label>
                <OptionGrid
                  options={PIATTO_OPTIONS}
                  value={configDoccia.piatto}
                  onChange={(v, p) => setConfigDoccia(prev => ({ ...prev, piatto: v, prompt_piatto: p || "" }))}
                  columns={2}
                />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Profili</Label>
                    <OptionGrid
                      options={PROFILO_OPTIONS}
                      value={configDoccia.profilo}
                      onChange={(v, p) => setConfigDoccia(prev => ({ ...prev, profilo: v, prompt_profilo: p || "" }))}
                      columns={2}
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Soffione</Label>
                    <OptionGrid
                      options={SOFFIONE_OPTIONS}
                      value={configDoccia.soffione}
                      onChange={v => setConfigDoccia(prev => ({ ...prev, soffione: v as ConfigDoccia["soffione"] }))}
                      columns={2}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

          {/* Vasca */}
            <Card>
              <CardContent className="py-4 space-y-4">
                <h3 className="font-semibold text-foreground">🛁 Vasca{!sostituzione.vasca ? " (personalizza stile)" : ""}</h3>
                <OptionGrid
                  options={[
                    { value: "mantieni", label: "Mantieni" },
                    { value: "sostituisci", label: "Sostituisci" },
                    { value: "rimuovi", label: "Rimuovi" },
                  ]}
                  value={configVasca.azione}
                  onChange={v => setConfigVasca(prev => ({ ...prev, azione: v as ConfigVasca["azione"] }))}
                  columns={3}
                />
                {configVasca.azione === "sostituisci" && (
                  <>
                    <Label className="text-xs text-muted-foreground">Tipo</Label>
                    <OptionGrid
                      options={VASCA_TYPES}
                      value={configVasca.tipo}
                      onChange={(v, p) => setConfigVasca(prev => ({ ...prev, tipo: v, prompt_tipo: p || "" }))}
                      columns={2}
                    />
                    <Label className="text-xs text-muted-foreground">Forma</Label>
                    <OptionGrid
                      options={VASCA_FORME}
                      value={configVasca.forma}
                      onChange={(v, p) => setConfigVasca(prev => ({ ...prev, forma: v, prompt_forma: p || "" }))}
                      columns={3}
                    />
                    <Label className="text-xs text-muted-foreground">Materiale</Label>
                    <OptionGrid
                      options={VASCA_MATERIALI}
                      value={configVasca.materiale}
                      onChange={(v, p) => setConfigVasca(prev => ({ ...prev, materiale: v, prompt_materiale: p || "" }))}
                      columns={3}
                    />
                  </>
                )}
              </CardContent>
            </Card>

          {/* Mobile Bagno */}
          {sostituzione.mobile_bagno && (
            <Card>
              <CardContent className="py-4 space-y-4">
                <h3 className="font-semibold text-foreground">🪑 Mobile Bagno</h3>
                <Label className="text-xs text-muted-foreground">Stile</Label>
                <OptionGrid
                  options={VANITY_STILI}
                  value={configVanity.stile}
                  onChange={(v, p) => setConfigVanity(prev => ({ ...prev, stile: v, prompt_stile: p || "" }))}
                  columns={3}
                />
                <Label className="text-xs text-muted-foreground">Piano</Label>
                <OptionGrid
                  options={VANITY_PIANI}
                  value={configVanity.piano}
                  onChange={(v, p) => setConfigVanity(prev => ({ ...prev, piano: v, prompt_piano: p || "" }))}
                  columns={4}
                />
                <Label className="text-xs text-muted-foreground">Lavabo</Label>
                <OptionGrid
                  options={LAVABO_OPTIONS}
                  value={configVanity.lavabo}
                  onChange={v => setConfigVanity(prev => ({ ...prev, lavabo: v as ConfigVanity["lavabo"] }))}
                  columns={4}
                />
              </CardContent>
            </Card>
          )}

          {/* WC & Bidet — sempre visibile */}
          <Card>
            <CardContent className="py-4 space-y-4">
              <h3 className="font-semibold text-foreground">
                🚽 WC & Bidet {!sostituzione.sanitari && <span className="text-xs font-normal text-muted-foreground">(personalizza stile)</span>}
              </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Tipo WC</Label>
                    <OptionGrid
                      options={[
                        { value: "sospeso", label: "Sospeso" },
                        { value: "rimless_sospeso", label: "Rimless Sospeso" },
                        { value: "a_terra", label: "A Terra" },
                      ]}
                      value={configSanitari.wc_tipo}
                      onChange={v => setConfigSanitari(prev => ({ ...prev, wc_tipo: v as ConfigSanitari["wc_tipo"] }))}
                      columns={2}
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Bidet</Label>
                    <OptionGrid
                      options={[
                        { value: "mantieni", label: "Mantieni" },
                        { value: "sostituisci", label: "Sostituisci" },
                        { value: "rimuovi", label: "Rimuovi" },
                      ]}
                      value={configSanitari.azione_bidet}
                      onChange={v => setConfigSanitari(prev => ({ ...prev, azione_bidet: v as ConfigSanitari["azione_bidet"] }))}
                      columns={2}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

          {/* Rubinetteria */}
          {sostituzione.rubinetteria && (
            <Card>
              <CardContent className="py-4 space-y-4">
                <h3 className="font-semibold text-foreground">🔧 Rubinetteria</h3>
                <Label className="text-xs text-muted-foreground">Finitura</Label>
                <OptionGrid
                  options={RUBINETTERIA_FINITURE}
                  value={configRubinetteria.finitura}
                  onChange={(v, p) => setConfigRubinetteria(prev => ({ ...prev, finitura: v, prompt_finitura: p || "" }))}
                  columns={3}
                />
                <Label className="text-xs text-muted-foreground">Stile</Label>
                <OptionGrid
                  options={RUBINETTERIA_STILI}
                  value={configRubinetteria.stile}
                  onChange={v => setConfigRubinetteria(prev => ({ ...prev, stile: v }))}
                  columns={4}
                />
              </CardContent>
            </Card>
          )}

          {/* Colore Pareti */}
          {sostituzione.parete_colore && (
            <Card>
              <CardContent className="py-4 space-y-4">
                <h3 className="font-semibold text-foreground">🎨 Colore Pareti</h3>
                <OptionGrid
                  options={PARETE_TIPI}
                  value={configParete.tipo}
                  onChange={v => setConfigParete(prev => ({ ...prev, tipo: v, azione: "tinta" }))}
                  columns={3}
                />
              </CardContent>
            </Card>
          )}

          {/* Illuminazione */}
          {sostituzione.illuminazione && (
            <Card>
              <CardContent className="py-4 space-y-4">
                <h3 className="font-semibold text-foreground">💡 Illuminazione</h3>
                <OptionGrid
                  options={ILLUMINAZIONE_OPTIONS}
                  value={illuminazioneTipo}
                  onChange={v => setIlluminazioneTipo(v)}
                  columns={4}
                />
              </CardContent>
            </Card>
          )}

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep(1)} className="flex-1 rounded-xl">
              <ArrowLeft className="h-4 w-4 mr-2" /> Indietro
            </Button>
            <Button onClick={startRender} className="flex-1 rounded-xl">
              <Sparkles className="h-4 w-4 mr-2" /> Genera Render
            </Button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          STEP 3 — PROCESSING
          ══════════════════════════════════════════════════════════ */}
      {step === 3 && (
        <div className="flex flex-col items-center justify-center py-16 text-center space-y-6">
          {rendering ? (
            <>
              <div className="relative">
                <Bath className="h-16 w-16 text-primary animate-pulse" />
              </div>
              <div className="space-y-2 max-w-sm">
                <h2 className="text-xl font-bold text-foreground">Generazione render in corso...</h2>
                <p className="text-sm text-muted-foreground">
                  L'AI sta disegnando il tuo nuovo bagno. Circa 30-60 secondi.
                </p>
              </div>
              <div className="w-full max-w-xs">
                <Progress value={renderProgress} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">{renderProgress}%</p>
              </div>
              <div className="space-y-2 text-left text-sm text-muted-foreground max-w-sm">
                {["🔍 Analisi composizione spaziale...", "🔲 Applicazione nuove piastrelle...",
                  "🚿 Rendering doccia e sanitari...", "🎨 Rifinitura luci e materiali...",
                  "✨ Ottimizzazione fotorealismo..."].map((msg, i) => (
                  <p key={i} className={`transition-opacity ${renderProgress > i * 18 ? "opacity-100" : "opacity-30"}`}>
                    {msg}
                  </p>
                ))}
              </div>
            </>
          ) : renderError ? (
            <div className="space-y-4">
              <p className="text-4xl">⚠️</p>
              <h2 className="text-xl font-bold text-foreground">Errore nella generazione</h2>
              <p className="text-sm text-muted-foreground">{renderError}</p>
              <Button onClick={() => { setStep(2); setRenderError(""); }} className="rounded-xl">
                Riprova
              </Button>
            </div>
          ) : null}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          STEP 4 — RISULTATO
          ══════════════════════════════════════════════════════════ */}
      {step === 4 && renderUrl && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-foreground">Il tuo nuovo bagno 🎉</h1>
            <button
              onClick={() => setShowComparison(!showComparison)}
              className="text-sm text-primary font-medium underline"
            >
              {showComparison ? "Solo risultato" : "Confronta prima/dopo"}
            </button>
          </div>

          {showComparison && fotoPreview ? (
            <BeforeAfterSlider
              beforeSrc={fotoPreview}
              afterSrc={renderUrl}
              beforeLabel="Prima"
              afterLabel="Dopo"
              className="aspect-video"
            />
          ) : (
            <img src={renderUrl} alt="Render bagno" className="w-full rounded-2xl" />
          )}

          <div className="grid grid-cols-3 gap-3">
            <a
              href={renderUrl}
              download
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-border hover:border-primary/40 transition-all text-sm"
            >
              <Download className="h-5 w-5 text-muted-foreground" />
              Scarica
            </a>
            <button
              onClick={saveToGallery}
              disabled={savedToGallery}
              className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-border hover:border-primary/40 transition-all text-sm disabled:opacity-60"
            >
              {savedToGallery ? <CheckCircle2 className="h-5 w-5 text-green-500" /> : <Save className="h-5 w-5 text-muted-foreground" />}
              {savedToGallery ? "Salvato!" : "Gallery"}
            </button>
            <button
              onClick={() => {
                setStep(0);
                setFile(null); setFotoPreview(""); setAnalisi(null);
                setRenderUrl(""); setSavedToGallery(false);
              }}
              className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-border hover:border-primary/40 transition-all text-sm"
            >
              <Bath className="h-5 w-5 text-muted-foreground" />
              Nuovo render
            </button>
          </div>

          <Button
            variant="outline"
            onClick={startRender}
            className="w-full rounded-xl"
          >
            <RefreshCw className="h-4 w-4 mr-2" /> Rigenera (variante diversa)
          </Button>
        </div>
      )}
    </div>
  );
}
