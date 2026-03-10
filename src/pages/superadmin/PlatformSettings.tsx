import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  CheckCircle, XCircle, RefreshCw, Cpu, DollarSign, Package,
  Loader2, Plus, Pencil, Trash2, Zap, Clock, Brain, Save,
  MessageSquare, Eye, EyeOff, Workflow
} from "lucide-react";

interface PlatformConfig {
  id: string;
  el_api_key_configured: boolean;
  el_api_key_tested_at: string | null;
  el_voices_count: number;
  el_default_llm: string;
  el_default_voice_id: string | null;
  credit_markup: number;
  cost_per_min_real: number;
  cost_per_min_billed: number;
  updated_at: string;
}

interface PricingRow {
  id: string;
  llm_model: string;
  tts_model: string;
  cost_real_per_min: number;
  cost_billed_per_min: number;
  markup_multiplier: number;
  is_active: boolean;
  label: string | null;
}

interface CreditPackage {
  id: string;
  name: string;
  minutes: number;
  price_eur: number;
  price_per_min: number;
  badge: string | null;
  is_active: boolean;
  sort_order: number;
}

const LLM_MODELS = [
  { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash", latency: "Bassa", cost: "€", desc: "Veloce e conveniente" },
  { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash", latency: "Bassa", cost: "€", desc: "Ultima generazione Google" },
  { id: "gpt-4o-mini", name: "GPT-4o Mini", latency: "Bassa", cost: "€€", desc: "Bilanciato qualità/costo" },
  { id: "gpt-4o", name: "GPT-4o", latency: "Media", cost: "€€€", desc: "Alta qualità OpenAI" },
  { id: "claude-sonnet-4-5", name: "Claude Sonnet 4.5", latency: "Media", cost: "€€€", desc: "Eccelle nel ragionamento" },
  { id: "claude-haiku-4-5", name: "Claude Haiku 4.5", latency: "Bassa", cost: "€€", desc: "Veloce Anthropic" },
];

export default function PlatformSettings() {
  const { toast } = useToast();
  const [config, setConfig] = useState<PlatformConfig | null>(null);
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [pricing, setPricing] = useState<PricingRow[]>([]);
  const [editedPricing, setEditedPricing] = useState<Record<string, Partial<PricingRow>>>({});
  const [ecoStats, setEcoStats] = useState({ billed: 0, real: 0, margin: 0, marginPct: 0 });
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedLlm, setSelectedLlm] = useState("");
  const [globalMarkup, setGlobalMarkup] = useState("2.0");
  const [pkgModal, setPkgModal] = useState(false);
  const [editingPkg, setEditingPkg] = useState<CreditPackage | null>(null);
  const [pkgForm, setPkgForm] = useState({ name: "", minutes: "", price_eur: "", badge: "", sort_order: "" });

  // WhatsApp API state
  const [waConfig, setWaConfig] = useState<any>(null);
  const [waAppId, setWaAppId] = useState("");
  const [waAppSecret, setWaAppSecret] = useState("");
  const [waWebhookUrl, setWaWebhookUrl] = useState("");
  const [waVerifyToken, setWaVerifyToken] = useState("");
  const [waPrice, setWaPrice] = useState("29.99");
  const [waConfigId, setWaConfigId] = useState("");
  const [waShowSecret, setWaShowSecret] = useState(false);
  const [waSaving, setWaSaving] = useState(false);
  const [waTesting, setWaTesting] = useState(false);
  const [waTestResult, setWaTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // N8N state
  const [n8nBaseUrl, setN8nBaseUrl] = useState("");
  const [n8nApiKey, setN8nApiKey] = useState("");
  const [n8nShowKey, setN8nShowKey] = useState(false);
  const [n8nSaving, setN8nSaving] = useState(false);
  const [n8nTesting, setN8nTesting] = useState(false);
  const [n8nStatus, setN8nStatus] = useState<{ configured: boolean; apiKeySet: boolean; testedAt: string | null; workflowsCount: number } | null>(null);

  const fetchConfig = useCallback(async () => {
    const { data } = await supabase.functions.invoke("platform-config", { method: "GET" });
    if (data?.config) {
      setConfig(data.config);
      setSelectedLlm(data.config.el_default_llm);
    }
  }, []);

  const fetchPricing = useCallback(async () => {
    const { data } = await supabase.from("platform_pricing").select("*").order("cost_real_per_min");
    if (data) {
      setPricing(data as unknown as PricingRow[]);
      if (data.length > 0) setGlobalMarkup(String((data as any)[0].markup_multiplier || 2));
    }
  }, []);

  const fetchPackages = useCallback(async () => {
    const { data } = await supabase.from("ai_credit_packages").select("*").order("sort_order");
    if (data) setPackages(data as CreditPackage[]);
  }, []);

  const fetchEconomics = useCallback(async () => {
    const { data } = await supabase.from("monthly_billing_summary").select("total_cost_billed_eur, total_cost_real_eur, total_margin_eur");
    if (data) {
      const rows = data as any[];
      const billed = rows.reduce((s, r) => s + (r.total_cost_billed_eur || 0), 0);
      const real = rows.reduce((s, r) => s + (r.total_cost_real_eur || 0), 0);
      const margin = billed - real;
      setEcoStats({ billed, real, margin, marginPct: billed > 0 ? (margin / billed) * 100 : 0 });
    }
  }, []);

  const fetchWaConfig = useCallback(async () => {
    const { data } = await supabase.from("superadmin_whatsapp_config").select("*").limit(1).maybeSingle();
    if (data) {
      const c = data as any;
      setWaConfig(c);
      setWaAppId(c.meta_app_id || "");
      setWaAppSecret(c.meta_app_secret_encrypted || "");
      setWaWebhookUrl(c.webhook_url || "");
      setWaVerifyToken(c.webhook_verify_token || "");
      setWaPrice(String(c.subscription_price_monthly || 29.99));
      setWaConfigId(c.meta_config_id || "");
    }
  }, []);

  const fetchN8nStatus = useCallback(async () => {
    try {
      const { data } = await supabase.functions.invoke("manage-n8n-config", {
        body: { action: "get_status" },
      });
      if (data?.config) {
        setN8nStatus({
          configured: data.config.n8n_configured,
          apiKeySet: data.config.n8n_api_key_set,
          testedAt: data.config.n8n_tested_at,
          workflowsCount: data.config.n8n_workflows_count,
        });
        if (data.config.n8n_base_url) setN8nBaseUrl(data.config.n8n_base_url);
      }
    } catch {}
  }, []);

  useEffect(() => {
    Promise.all([fetchConfig(), fetchPricing(), fetchPackages(), fetchEconomics(), fetchWaConfig(), fetchN8nStatus()]).finally(() => setLoading(false));
  }, [fetchConfig, fetchPricing, fetchPackages, fetchEconomics, fetchWaConfig, fetchN8nStatus]);

  const testApiKey = async () => {
    setTesting(true);
    try {
      const { data, error } = await supabase.functions.invoke("platform-config", { body: { action: "test_api_key" } });
      if (error || data?.error) {
        toast({ variant: "destructive", title: "Test fallito", description: data?.error || error?.message });
      } else {
        toast({ title: "Connessione OK", description: `${data.voices_count} voci disponibili` });
        await fetchConfig();
      }
    } finally { setTesting(false); }
  };

  const saveConfig = async (updates: Record<string, unknown>) => {
    setSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke("platform-config", { body: { action: "update_config", ...updates } });
      if (error || data?.error) {
        toast({ variant: "destructive", title: "Errore", description: data?.error || error?.message });
      } else {
        toast({ title: "Salvato" });
        setConfig(data.config);
      }
    } finally { setSaving(false); }
  };

  // Pricing management
  const updatePricingField = (id: string, field: string, value: any) => {
    setEditedPricing(prev => ({
      ...prev,
      [id]: { ...prev[id], [field]: value },
    }));
  };

  const getPricingValue = (row: PricingRow, field: keyof PricingRow) => {
    return editedPricing[row.id]?.[field] ?? row[field];
  };

  const savePricingRow = async (row: PricingRow) => {
    const edits = editedPricing[row.id];
    if (!edits) return;
    const costReal = Number(edits.cost_real_per_min ?? row.cost_real_per_min);
    const mkup = Number(edits.markup_multiplier ?? row.markup_multiplier);
    const costBilled = Number((costReal * mkup).toFixed(6));

    await supabase.from("platform_pricing").update({
      cost_real_per_min: costReal,
      markup_multiplier: mkup,
      cost_billed_per_min: costBilled,
      is_active: edits.is_active ?? row.is_active,
      updated_at: new Date().toISOString(),
    } as any).eq("id", row.id);

    setEditedPricing(prev => { const n = { ...prev }; delete n[row.id]; return n; });
    fetchPricing();
    toast({ title: "Tariffa aggiornata" });
  };

  const applyGlobalMarkup = async () => {
    const mk = parseFloat(globalMarkup);
    if (mk < 1) return;
    for (const row of pricing) {
      const costBilled = Number((row.cost_real_per_min * mk).toFixed(6));
      await supabase.from("platform_pricing").update({
        markup_multiplier: mk,
        cost_billed_per_min: costBilled,
        updated_at: new Date().toISOString(),
      } as any).eq("id", row.id);
    }
    setEditedPricing({});
    fetchPricing();
    toast({ title: "Markup applicato a tutte le tariffe" });
  };

  const togglePackage = async (pkg: CreditPackage) => {
    await supabase.from("ai_credit_packages").update({ is_active: !pkg.is_active }).eq("id", pkg.id);
    fetchPackages();
  };

  const deletePkg = async (id: string) => {
    await supabase.from("ai_credit_packages").delete().eq("id", id);
    fetchPackages();
  };

  const openPkgModal = (pkg?: CreditPackage) => {
    if (pkg) {
      setEditingPkg(pkg);
      setPkgForm({ name: pkg.name, minutes: String(pkg.minutes), price_eur: String(pkg.price_eur), badge: pkg.badge || "", sort_order: String(pkg.sort_order) });
    } else {
      setEditingPkg(null);
      setPkgForm({ name: "", minutes: "", price_eur: "", badge: "", sort_order: String(packages.length + 1) });
    }
    setPkgModal(true);
  };

  const savePkg = async () => {
    const row = { name: pkgForm.name, minutes: parseInt(pkgForm.minutes), price_eur: parseFloat(pkgForm.price_eur), badge: pkgForm.badge || null, sort_order: parseInt(pkgForm.sort_order) || 0 };
    if (editingPkg) {
      await supabase.from("ai_credit_packages").update(row).eq("id", editingPkg.id);
    } else {
      await supabase.from("ai_credit_packages").insert(row);
    }
    setPkgModal(false);
    fetchPackages();
  };

  const saveWaConfig = async () => {
    setWaSaving(true);
    const payload = {
      meta_app_id: waAppId,
      meta_app_secret_encrypted: waAppSecret,
      webhook_verify_token: waVerifyToken,
      webhook_url: waWebhookUrl,
      subscription_price_monthly: parseFloat(waPrice) || 29.99,
      meta_config_id: waConfigId.trim() || null,
    };
    try {
      if (waConfig) {
        await supabase.from("superadmin_whatsapp_config").update(payload).eq("id", waConfig.id);
      } else {
        await supabase.from("superadmin_whatsapp_config").insert(payload);
      }
      toast({ title: "Configurazione WhatsApp salvata" });
      fetchWaConfig();
    } catch {
      toast({ variant: "destructive", title: "Errore salvataggio WhatsApp" });
    } finally { setWaSaving(false); }
  };

  const testWaConnection = async () => {
    setWaTesting(true);
    setWaTestResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("whatsapp-test-connection", {
        body: { meta_app_id: waAppId, meta_app_secret: waAppSecret },
      });
      if (error) {
        setWaTestResult({ success: false, message: error.message });
      } else if (data?.success) {
        setWaTestResult({ success: true, message: `App: ${data.app_name}` });
      } else {
        setWaTestResult({ success: false, message: data?.error || "Test fallito" });
      }
    } catch (err: any) {
      setWaTestResult({ success: false, message: err.message || "Errore di rete" });
    } finally { setWaTesting(false); }
  };

  const waFieldsValid = waAppId.trim().length > 0 && waAppSecret.trim().length > 0;
  const n8nFieldsValid = n8nBaseUrl.trim().length > 0;

  const saveN8nConfig = async () => {
    setN8nSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke("manage-n8n-config", {
        body: { action: "save_config", base_url: n8nBaseUrl, api_key: n8nApiKey || undefined },
      });
      if (error || data?.error) {
        toast({ variant: "destructive", title: "Errore", description: data?.error || error?.message });
      } else {
        toast({ title: "Configurazione N8N salvata" });
        await fetchN8nStatus();
      }
    } finally { setN8nSaving(false); }
  };

  const testN8nConnection = async () => {
    setN8nTesting(true);
    try {
      const { data, error } = await supabase.functions.invoke("manage-n8n-config", {
        body: { action: "test_connection", base_url: n8nBaseUrl, api_key: n8nApiKey || undefined },
      });
      if (error || data?.error) {
        toast({ variant: "destructive", title: "Test N8N fallito", description: data?.error || data?.details || error?.message });
      } else {
        toast({ title: "Connessione N8N OK", description: `${data.workflows_count} workflow trovati` });
        await fetchN8nStatus();
      }
    } finally { setN8nTesting(false); }
  };


  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

  // Preview for global markup
  const previewReal = pricing.length > 0 ? pricing[0].cost_real_per_min : 0.02;
  const previewMarkup = parseFloat(globalMarkup) || 2;
  const previewBilled = previewReal * previewMarkup;
  const previewMargin = previewMarkup > 0 ? ((previewMarkup - 1) / previewMarkup) * 100 : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Impostazioni Piattaforma</h1>
        <p className="text-muted-foreground">Configurazione centralizzata ElevenLabs, modelli AI e sistema crediti</p>
      </div>

      <Tabs defaultValue="api" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="api" className="gap-2"><Zap className="h-4 w-4" /> ElevenLabs</TabsTrigger>
          <TabsTrigger value="llm" className="gap-2"><Brain className="h-4 w-4" /> LLM</TabsTrigger>
          <TabsTrigger value="pricing" className="gap-2"><DollarSign className="h-4 w-4" /> Prezzi</TabsTrigger>
          <TabsTrigger value="packages" className="gap-2"><Package className="h-4 w-4" /> Pacchetti</TabsTrigger>
          <TabsTrigger value="whatsapp" className="gap-2"><MessageSquare className="h-4 w-4" /> WhatsApp</TabsTrigger>
          <TabsTrigger value="n8n" className="gap-2"><Workflow className="h-4 w-4" /> N8N</TabsTrigger>
        </TabsList>

        {/* TAB: ElevenLabs API */}
        <TabsContent value="api" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {config?.el_api_key_configured ? <CheckCircle className="h-5 w-5 text-primary" /> : <XCircle className="h-5 w-5 text-destructive" />}
                Stato Connessione ElevenLabs
              </CardTitle>
              <CardDescription>La API key è cifrata nel Supabase Vault e non è mai visibile nel codice</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {config?.el_api_key_configured ? (
                <div className="flex items-center gap-4 p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <CheckCircle className="h-8 w-8 text-primary shrink-0" />
                  <div>
                    <p className="font-medium text-foreground">API Key Configurata</p>
                    <p className="text-sm text-muted-foreground">Ultimo test: {config.el_api_key_tested_at ? new Date(config.el_api_key_tested_at).toLocaleString("it-IT") : "Mai testata"}</p>
                    <p className="text-sm text-muted-foreground">Voci disponibili: <strong>{config.el_voices_count}</strong></p>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-lg bg-destructive/5 border border-destructive/20">
                  <p className="font-medium text-destructive">API Key Non Configurata</p>
                  <p className="text-sm text-muted-foreground mt-1">Configura il secret <code className="bg-muted px-1 rounded">ELEVENLABS_API_KEY</code> nelle impostazioni Supabase Edge Functions.</p>
                </div>
              )}
              <Button onClick={testApiKey} disabled={testing} variant="outline">
                {testing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                {testing ? "Test in corso..." : "Ri-testa Connessione"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: LLM */}
        <TabsContent value="llm" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Modello LLM Predefinito</CardTitle>
              <CardDescription>Il modello selezionato sarà usato di default per i nuovi agenti.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3">
                {LLM_MODELS.map((model) => (
                  <div key={model.id} onClick={() => setSelectedLlm(model.id)} className={`flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition-colors ${selectedLlm === model.id ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/30"}`}>
                    <div className="flex items-center gap-3">
                      <Cpu className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-foreground">{model.name}</p>
                        <p className="text-sm text-muted-foreground">{model.desc}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="flex items-center gap-1 text-muted-foreground"><Clock className="h-3 w-3" /> {model.latency}</span>
                      <Badge variant="secondary">{model.cost}</Badge>
                    </div>
                  </div>
                ))}
              </div>
              <Separator />
              <Button onClick={() => saveConfig({ el_default_llm: selectedLlm })} disabled={saving || selectedLlm === config?.el_default_llm}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} Salva Modello
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: Pricing — NEW with platform_pricing table */}
        <TabsContent value="pricing" className="space-y-6">
          {/* Global Markup */}
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle>Moltiplicatore Markup Globale</CardTitle>
              <CardDescription>Applica questo moltiplicatore a tutte le tariffe</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Input type="number" step="0.1" min="1" value={globalMarkup} onChange={(e) => setGlobalMarkup(e.target.value)} className="w-24 text-center text-lg font-mono" />
                <Button onClick={applyGlobalMarkup} size="sm">Applica a Tutte le Tariffe</Button>
              </div>

              <div className="bg-background border rounded-lg px-5 py-3 grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-xs text-muted-foreground">Costo reale EL</p>
                  <p className="text-sm font-mono text-muted-foreground">€{previewReal.toFixed(4)}/min</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">× Markup</p>
                  <p className="text-lg font-bold text-primary">× {previewMarkup.toFixed(1)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Pagato dall'azienda</p>
                  <p className="text-xl font-extrabold text-foreground">€{previewBilled.toFixed(4)}/min</p>
                </div>
              </div>
              <p className="text-xs font-mono text-primary">Margine piattaforma: {previewMargin.toFixed(0)}%</p>
            </CardContent>
          </Card>

          {/* Pricing Table */}
          <Card>
            <CardHeader>
              <CardTitle>Tariffe per Combinazione LLM + TTS</CardTitle>
              <CardDescription>Ogni agente usa una combinazione specifica con un costo diverso.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Combinazione</TableHead>
                    <TableHead>Costo Reale EL (€/min)</TableHead>
                    <TableHead>Markup</TableHead>
                    <TableHead>Costo Azienda (€/min)</TableHead>
                    <TableHead>Margine</TableHead>
                    <TableHead>Stato</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pricing.map((row) => {
                    const costReal = Number(getPricingValue(row, "cost_real_per_min"));
                    const mkup = Number(getPricingValue(row, "markup_multiplier"));
                    const costBilled = costReal * mkup;
                    const margin = mkup > 0 ? ((mkup - 1) / mkup) * 100 : 0;
                    const hasEdits = !!editedPricing[row.id];
                    const isActive = getPricingValue(row, "is_active") as boolean;

                    return (
                      <TableRow key={row.id} className={!isActive ? "opacity-50" : ""}>
                        <TableCell>
                          <p className="font-medium text-sm">{row.label}</p>
                          <p className="text-xs font-mono text-muted-foreground">{row.llm_model} · {row.tts_model}</p>
                        </TableCell>
                        <TableCell>
                          <Input type="number" step="0.0001" className="w-28 font-mono text-sm" value={String(getPricingValue(row, "cost_real_per_min"))} onChange={(e) => updatePricingField(row.id, "cost_real_per_min", parseFloat(e.target.value))} />
                        </TableCell>
                        <TableCell>
                          <Input type="number" step="0.1" className="w-20 font-mono text-sm" value={String(getPricingValue(row, "markup_multiplier"))} onChange={(e) => updatePricingField(row.id, "markup_multiplier", parseFloat(e.target.value))} />
                        </TableCell>
                        <TableCell className="font-mono text-sm font-semibold text-primary">€{costBilled.toFixed(4)}</TableCell>
                        <TableCell><Badge variant="secondary" className="text-xs">{margin.toFixed(0)}%</Badge></TableCell>
                        <TableCell>
                          <Switch checked={isActive} onCheckedChange={(v) => updatePricingField(row.id, "is_active", v)} />
                        </TableCell>
                        <TableCell>
                          {hasEdits && (
                            <Button size="sm" variant="ghost" onClick={() => savePricingRow(row)}>
                              <Save className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Economic Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Riepilogo Economico Piattaforma</CardTitle>
              <CardDescription>Dati aggregati da tutte le conversazioni fatturate</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <p className="text-xs text-muted-foreground">Incassato</p>
                  <p className="text-2xl font-extrabold text-primary mt-1">€{ecoStats.billed.toFixed(2)}</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted border">
                  <p className="text-xs text-muted-foreground">Costo EL</p>
                  <p className="text-2xl font-extrabold text-foreground mt-1">€{ecoStats.real.toFixed(2)}</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <p className="text-xs text-muted-foreground">Margine</p>
                  <p className="text-2xl font-extrabold text-primary mt-1">€{ecoStats.margin.toFixed(2)}</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <p className="text-xs text-muted-foreground">Margine %</p>
                  <p className="text-2xl font-extrabold text-primary mt-1">{ecoStats.marginPct.toFixed(0)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: Packages (legacy) */}
        <TabsContent value="packages" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Pacchetti Crediti (Legacy)</CardTitle>
                <CardDescription>Pacchetti minuti — il nuovo sistema usa saldi in Euro</CardDescription>
              </div>
              <Button onClick={() => openPkgModal()} size="sm"><Plus className="h-4 w-4 mr-1" /> Aggiungi</Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {packages.map((pkg) => (
                  <div key={pkg.id} className="flex items-center justify-between p-4 rounded-lg border">
                    <div className="flex items-center gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-foreground">{pkg.name}</p>
                          {pkg.badge && <Badge variant="secondary">{pkg.badge}</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground">{pkg.minutes} min · €{pkg.price_eur} · €{pkg.price_per_min?.toFixed(4)}/min</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked={pkg.is_active} onCheckedChange={() => togglePackage(pkg)} />
                      <Button variant="ghost" size="icon" onClick={() => openPkgModal(pkg)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => deletePkg(pkg.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  </div>
                ))}
                {packages.length === 0 && <p className="text-center text-muted-foreground py-8">Nessun pacchetto configurato</p>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: WhatsApp API */}
        <TabsContent value="whatsapp" className="space-y-4">
          {/* Connection Status Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {waTestResult?.success ? <CheckCircle className="h-5 w-5 text-primary" /> : waTestResult === null && waConfig?.meta_app_id ? <MessageSquare className="h-5 w-5 text-muted-foreground" /> : waTestResult ? <XCircle className="h-5 w-5 text-destructive" /> : <MessageSquare className="h-5 w-5 text-muted-foreground" />}
                Stato Connessione Meta WhatsApp
              </CardTitle>
              <CardDescription>Verifica che le credenziali Meta siano valide chiamando le Graph API</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {waTestResult ? (
                waTestResult.success ? (
                  <div className="flex items-center gap-4 p-4 rounded-lg bg-primary/5 border border-primary/20">
                    <CheckCircle className="h-8 w-8 text-primary shrink-0" />
                    <div>
                      <p className="font-medium text-foreground">Connessione Riuscita</p>
                      <p className="text-sm text-muted-foreground">{waTestResult.message}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-4 p-4 rounded-lg bg-destructive/5 border border-destructive/20">
                    <XCircle className="h-8 w-8 text-destructive shrink-0" />
                    <div>
                      <p className="font-medium text-destructive">Connessione Fallita</p>
                      <p className="text-sm text-muted-foreground">{waTestResult.message}</p>
                    </div>
                  </div>
                )
              ) : (
                <div className="p-4 rounded-lg bg-muted/50 border border-border">
                  <p className="text-sm text-muted-foreground">Inserisci App ID e App Secret, poi premi "Testa Connessione" per verificare le credenziali.</p>
                </div>
              )}
              <Button onClick={testWaConnection} disabled={waTesting || !waFieldsValid} variant="outline">
                {waTesting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                {waTesting ? "Test in corso..." : "Testa Connessione"}
              </Button>
            </CardContent>
          </Card>

          {/* Config Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-muted-foreground" />
                Credenziali Meta API
                {waConfig?.meta_app_id ? (
                  <Badge className="ml-2" variant="default">Configurato</Badge>
                ) : (
                  <Badge variant="secondary" className="ml-2">Non configurato</Badge>
                )}
              </CardTitle>
              <CardDescription>Credenziali globali Meta per WhatsApp Business Cloud API — usate da tutti gli account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Meta App ID <span className="text-destructive">*</span></Label>
                  <Input value={waAppId} onChange={e => setWaAppId(e.target.value)} placeholder="1234567890" />
                </div>
                <div className="space-y-2">
                  <Label>App Secret <span className="text-destructive">*</span></Label>
                  <div className="relative">
                    <Input
                      type={waShowSecret ? "text" : "password"}
                      value={waAppSecret}
                      onChange={e => setWaAppSecret(e.target.value)}
                      placeholder="••••••••••••"
                    />
                    <Button variant="ghost" size="sm" className="absolute right-1 top-0.5 h-8 w-8 p-0" onClick={() => setWaShowSecret(!waShowSecret)}>
                      {waShowSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Webhook URL</Label>
                  <Input value={waWebhookUrl} onChange={e => setWaWebhookUrl(e.target.value)} placeholder="https://..." />
                </div>
                <div className="space-y-2">
                  <Label>Verify Token</Label>
                  <Input value={waVerifyToken} onChange={e => setWaVerifyToken(e.target.value)} placeholder="my_verify_token" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Prezzo Abbonamento Mensile (€)</Label>
                  <Input type="number" step="0.01" value={waPrice} onChange={e => setWaPrice(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Meta Config ID <span className="text-xs text-muted-foreground">(opzionale)</span></Label>
                  <Input value={waConfigId} onChange={e => setWaConfigId(e.target.value)} placeholder="Es. 123456789012345" />
                  <p className="text-xs text-muted-foreground">
                    Creato nella Meta Business Dashboard → WhatsApp → Configurazioni Embedded Signup. Pre-seleziona soluzioni e permessi nel flusso OAuth.
                  </p>
                </div>
              </div>
              <Separator />
              <Button onClick={saveWaConfig} disabled={waSaving || !waFieldsValid}>
                {waSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Salva Configurazione WhatsApp
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: N8N Automation */}
        <TabsContent value="n8n" className="space-y-4">
          {/* Connection Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {n8nStatus?.configured ? <CheckCircle className="h-5 w-5 text-primary" /> : <XCircle className="h-5 w-5 text-destructive" />}
                Stato Connessione N8N
              </CardTitle>
              <CardDescription>Automazione workflow per template agenti e scheduling</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {n8nStatus?.configured ? (
                <div className="flex items-center gap-4 p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <CheckCircle className="h-8 w-8 text-primary shrink-0" />
                  <div>
                    <p className="font-medium text-foreground">N8N Connesso</p>
                    <p className="text-sm text-muted-foreground">
                      Ultimo test: {n8nStatus.testedAt ? new Date(n8nStatus.testedAt).toLocaleString("it-IT") : "Mai testato"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Workflow trovati: <strong>{n8nStatus.workflowsCount}</strong>
                    </p>
                    {n8nStatus.apiKeySet && <Badge variant="secondary" className="mt-1">API Key configurata</Badge>}
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-lg bg-destructive/5 border border-destructive/20">
                  <p className="font-medium text-destructive">N8N Non Configurato</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Inserisci l'URL base del tuo server N8N e la API key per abilitare l'automazione dei workflow.
                  </p>
                </div>
              )}
              <Button onClick={testN8nConnection} disabled={n8nTesting || !n8nFieldsValid} variant="outline">
                {n8nTesting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                {n8nTesting ? "Test in corso..." : "Testa Connessione"}
              </Button>
            </CardContent>
          </Card>

          {/* Config Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Workflow className="h-5 w-5 text-muted-foreground" />
                Configurazione N8N
                {n8nStatus?.configured ? (
                  <Badge className="ml-2" variant="default">Configurato</Badge>
                ) : (
                  <Badge variant="secondary" className="ml-2">Non configurato</Badge>
                )}
              </CardTitle>
              <CardDescription>
                URL base e API key del tuo server N8N — la API key viene passata alla edge function per il test, 
                per l'uso in produzione configura il secret <code className="bg-muted px-1 rounded">N8N_API_KEY</code> nelle impostazioni Supabase.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>N8N Base URL <span className="text-destructive">*</span></Label>
                  <Input
                    value={n8nBaseUrl}
                    onChange={e => setN8nBaseUrl(e.target.value)}
                    placeholder="https://n8n.tuodominio.com"
                  />
                  <p className="text-xs text-muted-foreground">L'URL del tuo server N8N (senza slash finale)</p>
                </div>
                <div className="space-y-2">
                  <Label>N8N API Key</Label>
                  <div className="relative">
                    <Input
                      type={n8nShowKey ? "text" : "password"}
                      value={n8nApiKey}
                      onChange={e => setN8nApiKey(e.target.value)}
                      placeholder={n8nStatus?.apiKeySet ? "••••••••• (già configurata)" : "Inserisci API key"}
                    />
                    <Button variant="ghost" size="sm" className="absolute right-1 top-0.5 h-8 w-8 p-0" onClick={() => setN8nShowKey(!n8nShowKey)}>
                      {n8nShowKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">Generata da N8N → Settings → API → Create API Key</p>
                </div>
              </div>
              <Separator />
              <div className="flex gap-3">
                <Button onClick={saveN8nConfig} disabled={n8nSaving || !n8nFieldsValid}>
                  {n8nSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                  Salva Configurazione
                </Button>
                <Button onClick={testN8nConnection} disabled={n8nTesting || !n8nFieldsValid} variant="outline">
                  {n8nTesting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                  Testa e Salva
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Package Modal */}
      <Dialog open={pkgModal} onOpenChange={setPkgModal}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingPkg ? "Modifica Pacchetto" : "Nuovo Pacchetto"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Nome</Label><Input value={pkgForm.name} onChange={(e) => setPkgForm({ ...pkgForm, name: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Minuti</Label><Input type="number" value={pkgForm.minutes} onChange={(e) => setPkgForm({ ...pkgForm, minutes: e.target.value })} /></div>
              <div className="space-y-2"><Label>Prezzo (€)</Label><Input type="number" step="0.01" value={pkgForm.price_eur} onChange={(e) => setPkgForm({ ...pkgForm, price_eur: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Badge</Label><Input value={pkgForm.badge} onChange={(e) => setPkgForm({ ...pkgForm, badge: e.target.value })} placeholder="Es. Popolare" /></div>
              <div className="space-y-2"><Label>Ordine</Label><Input type="number" value={pkgForm.sort_order} onChange={(e) => setPkgForm({ ...pkgForm, sort_order: e.target.value })} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPkgModal(false)}>Annulla</Button>
            <Button onClick={savePkg} disabled={!pkgForm.name || !pkgForm.minutes || !pkgForm.price_eur}>Salva</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
