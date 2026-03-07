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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  CheckCircle, XCircle, RefreshCw, Cpu, DollarSign, Package,
  Loader2, Plus, Pencil, Trash2, Zap, Clock, Brain
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
  { id: "claude-3.5-sonnet", name: "Claude Sonnet 4.5", latency: "Media", cost: "€€€", desc: "Eccelle nel ragionamento" },
  { id: "claude-3.5-haiku", name: "Claude Haiku 4.5", latency: "Bassa", cost: "€€", desc: "Veloce Anthropic" },
];

export default function PlatformSettings() {
  const { toast } = useToast();
  const [config, setConfig] = useState<PlatformConfig | null>(null);
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedLlm, setSelectedLlm] = useState("");
  const [markup, setMarkup] = useState("2.0");
  const [costReal, setCostReal] = useState("0.07");
  const [pkgModal, setPkgModal] = useState(false);
  const [editingPkg, setEditingPkg] = useState<CreditPackage | null>(null);
  const [pkgForm, setPkgForm] = useState({ name: "", minutes: "", price_eur: "", badge: "", sort_order: "" });

  const fetchConfig = useCallback(async () => {
    const { data } = await supabase.functions.invoke("platform-config", { method: "GET" });
    if (data?.config) {
      setConfig(data.config);
      setSelectedLlm(data.config.el_default_llm);
      setMarkup(String(data.config.credit_markup));
      setCostReal(String(data.config.cost_per_min_real));
    }
  }, []);

  const fetchPackages = useCallback(async () => {
    const { data } = await supabase.from("ai_credit_packages").select("*").order("sort_order");
    if (data) setPackages(data as CreditPackage[]);
  }, []);

  useEffect(() => {
    Promise.all([fetchConfig(), fetchPackages()]).finally(() => setLoading(false));
  }, [fetchConfig, fetchPackages]);

  const testApiKey = async () => {
    setTesting(true);
    try {
      const { data, error } = await supabase.functions.invoke("platform-config", {
        body: { action: "test_api_key" },
      });
      if (error || data?.error) {
        toast({ variant: "destructive", title: "Test fallito", description: data?.error || error?.message });
      } else {
        toast({ title: "Connessione OK", description: `${data.voices_count} voci disponibili` });
        await fetchConfig();
      }
    } finally {
      setTesting(false);
    }
  };

  const saveConfig = async (updates: Record<string, unknown>) => {
    setSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke("platform-config", {
        body: { action: "update_config", ...updates },
      });
      if (error || data?.error) {
        toast({ variant: "destructive", title: "Errore", description: data?.error || error?.message });
      } else {
        toast({ title: "Salvato" });
        setConfig(data.config);
      }
    } finally {
      setSaving(false);
    }
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
    const row = {
      name: pkgForm.name,
      minutes: parseInt(pkgForm.minutes),
      price_eur: parseFloat(pkgForm.price_eur),
      badge: pkgForm.badge || null,
      sort_order: parseInt(pkgForm.sort_order) || 0,
    };
    if (editingPkg) {
      await supabase.from("ai_credit_packages").update(row).eq("id", editingPkg.id);
    } else {
      await supabase.from("ai_credit_packages").insert(row);
    }
    setPkgModal(false);
    fetchPackages();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const billedPreview = (parseFloat(costReal) || 0) * (parseFloat(markup) || 1);
  const marginPct = parseFloat(markup) > 0 ? ((parseFloat(markup) - 1) / parseFloat(markup)) * 100 : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Impostazioni Piattaforma</h1>
        <p className="text-muted-foreground">Configurazione centralizzata ElevenLabs, modelli AI e sistema crediti</p>
      </div>

      <Tabs defaultValue="api" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="api" className="gap-2"><Zap className="h-4 w-4" /> ElevenLabs API</TabsTrigger>
          <TabsTrigger value="llm" className="gap-2"><Brain className="h-4 w-4" /> LLM & Modelli</TabsTrigger>
          <TabsTrigger value="pricing" className="gap-2"><DollarSign className="h-4 w-4" /> Markup & Prezzi</TabsTrigger>
          <TabsTrigger value="packages" className="gap-2"><Package className="h-4 w-4" /> Pacchetti</TabsTrigger>
        </TabsList>

        {/* TAB: ElevenLabs API */}
        <TabsContent value="api" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {config?.el_api_key_configured ? (
                  <CheckCircle className="h-5 w-5 text-primary" />
                ) : (
                  <XCircle className="h-5 w-5 text-destructive" />
                )}
                Stato Connessione ElevenLabs
              </CardTitle>
              <CardDescription>
                La API key è cifrata nel Supabase Vault e non è mai visibile nel codice
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {config?.el_api_key_configured ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-4 p-4 rounded-lg bg-primary/5 border border-primary/20">
                    <CheckCircle className="h-8 w-8 text-primary shrink-0" />
                    <div>
                      <p className="font-medium text-foreground">API Key Configurata</p>
                      <p className="text-sm text-muted-foreground">
                        Ultimo test: {config.el_api_key_tested_at
                          ? new Date(config.el_api_key_tested_at).toLocaleString("it-IT")
                          : "Mai testata"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Voci disponibili: <strong>{config.el_voices_count}</strong>
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-lg bg-destructive/5 border border-destructive/20">
                  <p className="font-medium text-destructive">API Key Non Configurata</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Configura il secret <code className="bg-muted px-1 rounded">ELEVENLABS_API_KEY</code> nelle impostazioni Supabase Edge Functions.
                  </p>
                  <a
                    href="https://elevenlabs.io/app/settings/api-keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary underline mt-2 inline-block"
                  >
                    Ottieni una API key su elevenlabs.io →
                  </a>
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
              <CardDescription>
                Il modello selezionato sarà usato di default per i nuovi agenti. Ogni agente può sovrascriverlo.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3">
                {LLM_MODELS.map((model) => (
                  <div
                    key={model.id}
                    onClick={() => setSelectedLlm(model.id)}
                    className={`flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                      selectedLlm === model.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-muted-foreground/30"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Cpu className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-foreground">{model.name}</p>
                        <p className="text-sm text-muted-foreground">{model.desc}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-3 w-3" /> {model.latency}
                      </span>
                      <Badge variant="secondary">{model.cost}</Badge>
                    </div>
                  </div>
                ))}
              </div>
              <Separator />
              <Button
                onClick={() => saveConfig({ el_default_llm: selectedLlm })}
                disabled={saving || selectedLlm === config?.el_default_llm}
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Salva Modello
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: Markup */}
        <TabsContent value="pricing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurazione Prezzi</CardTitle>
              <CardDescription>
                Imposta il costo reale ElevenLabs e il moltiplicatore per calcolare il prezzo al cliente
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Costo Reale ElevenLabs (€/min)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={costReal}
                    onChange={(e) => setCostReal(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Moltiplicatore Markup</Label>
                  <Input
                    type="number"
                    step="0.1"
                    min="1"
                    value={markup}
                    onChange={(e) => setMarkup(e.target.value)}
                  />
                </div>
              </div>

              <div className="p-4 rounded-lg bg-muted/50 border space-y-2">
                <p className="text-sm font-medium text-foreground">Preview Prezzo</p>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Costo Reale</p>
                    <p className="text-lg font-bold text-foreground">€{(parseFloat(costReal) || 0).toFixed(4)}/min</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Prezzo Cliente</p>
                    <p className="text-lg font-bold text-primary">€{billedPreview.toFixed(4)}/min</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Margine</p>
                    <p className="text-lg font-bold text-foreground">{marginPct.toFixed(1)}%</p>
                  </div>
                </div>
              </div>

              <Button
                onClick={() => saveConfig({ credit_markup: parseFloat(markup), cost_per_min_real: parseFloat(costReal) })}
                disabled={saving}
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Salva Configurazione
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: Packages */}
        <TabsContent value="packages" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Pacchetti Crediti</CardTitle>
                <CardDescription>Pacchetti minuti acquistabili dai clienti</CardDescription>
              </div>
              <Button onClick={() => openPkgModal()} size="sm">
                <Plus className="h-4 w-4 mr-1" /> Aggiungi
              </Button>
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
                        <p className="text-sm text-muted-foreground">
                          {pkg.minutes} min · €{pkg.price_eur} · €{pkg.price_per_min?.toFixed(4)}/min
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked={pkg.is_active} onCheckedChange={() => togglePackage(pkg)} />
                      <Button variant="ghost" size="icon" onClick={() => openPkgModal(pkg)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => deletePkg(pkg.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
                {packages.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">Nessun pacchetto configurato</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Package Modal */}
      <Dialog open={pkgModal} onOpenChange={setPkgModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingPkg ? "Modifica Pacchetto" : "Nuovo Pacchetto"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input value={pkgForm.name} onChange={(e) => setPkgForm({ ...pkgForm, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Minuti</Label>
                <Input type="number" value={pkgForm.minutes} onChange={(e) => setPkgForm({ ...pkgForm, minutes: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Prezzo (€)</Label>
                <Input type="number" step="0.01" value={pkgForm.price_eur} onChange={(e) => setPkgForm({ ...pkgForm, price_eur: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Badge (opzionale)</Label>
                <Input value={pkgForm.badge} onChange={(e) => setPkgForm({ ...pkgForm, badge: e.target.value })} placeholder="Es. Popolare" />
              </div>
              <div className="space-y-2">
                <Label>Ordine</Label>
                <Input type="number" value={pkgForm.sort_order} onChange={(e) => setPkgForm({ ...pkgForm, sort_order: e.target.value })} />
              </div>
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
