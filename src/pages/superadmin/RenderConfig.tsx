import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Save, Sparkles, Shield } from "lucide-react";

interface ProviderConfig {
  id: string;
  provider_key: string;
  label: string;
  model: string;
  is_active: boolean;
  is_default: boolean;
  quality: string;
  max_resolution: number;
  timeout_sec: number;
  cost_real_per_render: number;
  markup_multiplier: number;
  cost_billed_per_render: number;
  renders_generated: number;
  notes: string | null;
}

export default function RenderConfig() {
  const { toast } = useToast();
  const [providers, setProviders] = useState<ProviderConfig[]>([]);
  const [saving, setSaving] = useState<string | null>(null);

  const fetchProviders = async () => {
    const { data } = await supabase.from("render_provider_config").select("*").order("is_default", { ascending: false });
    if (data) setProviders(data as any);
  };

  useEffect(() => { fetchProviders(); }, []);

  const updateProvider = (id: string, field: string, value: any) => {
    setProviders(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const saveProvider = async (provider: ProviderConfig) => {
    setSaving(provider.id);
    const { error } = await supabase.from("render_provider_config").update({
      is_active: provider.is_active,
      is_default: provider.is_default,
      quality: provider.quality,
      max_resolution: provider.max_resolution,
      timeout_sec: provider.timeout_sec,
      cost_real_per_render: provider.cost_real_per_render,
      markup_multiplier: provider.markup_multiplier,
      cost_billed_per_render: provider.cost_billed_per_render,
      notes: provider.notes,
    }).eq("id", provider.id);

    if (error) {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    } else {
      // If setting as default, unset others
      if (provider.is_default) {
        await supabase.from("render_provider_config").update({ is_default: false }).neq("id", provider.id);
        fetchProviders();
      }
      toast({ title: "Salvato" });
    }
    setSaving(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" /> Configurazione Render AI
        </h1>
        <p className="text-muted-foreground">Gestisci i provider AI per la generazione render infissi</p>
      </div>

      <div className="grid gap-6">
        {providers.map((p) => (
          <Card key={p.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CardTitle className="text-base">{p.label}</CardTitle>
                  {p.is_default && <Badge>Default</Badge>}
                  {p.is_active ? (
                    <Badge variant="outline" className="text-primary border-primary">Attivo</Badge>
                  ) : (
                    <Badge variant="secondary">Disattivo</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{p.renders_generated} render generati</p>
              </div>
              <CardDescription>Modello: {p.model}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Switch checked={p.is_active} onCheckedChange={(v) => updateProvider(p.id, "is_active", v)} />
                  <Label>Attivo</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={p.is_default} onCheckedChange={(v) => updateProvider(p.id, "is_default", v)} />
                  <Label>Default</Label>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label className="text-xs">Costo Reale (€)</Label>
                  <Input type="number" step="0.01" value={p.cost_real_per_render} onChange={(e) => updateProvider(p.id, "cost_real_per_render", parseFloat(e.target.value))} />
                </div>
                <div>
                  <Label className="text-xs">Markup (×)</Label>
                  <Input type="number" step="0.1" value={p.markup_multiplier} onChange={(e) => updateProvider(p.id, "markup_multiplier", parseFloat(e.target.value))} />
                </div>
                <div>
                  <Label className="text-xs">Costo Fatturato (€)</Label>
                  <Input type="number" step="0.01" value={p.cost_billed_per_render} onChange={(e) => updateProvider(p.id, "cost_billed_per_render", parseFloat(e.target.value))} />
                </div>
                <div>
                  <Label className="text-xs">Timeout (sec)</Label>
                  <Input type="number" value={p.timeout_sec} onChange={(e) => updateProvider(p.id, "timeout_sec", parseInt(e.target.value))} />
                </div>
              </div>

              <Button onClick={() => saveProvider(p)} disabled={saving === p.id} size="sm">
                <Save className="h-3.5 w-3.5 mr-1" /> Salva
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-muted/50">
        <CardContent className="p-4 flex items-start gap-3">
          <Shield className="h-5 w-5 text-muted-foreground mt-0.5" />
          <div>
            <p className="text-sm font-medium text-foreground">API Keys</p>
            <p className="text-xs text-muted-foreground">
              Le API keys dei provider (OPENAI_API_KEY, GEMINI_API_KEY, etc.) vanno configurate come Supabase Secrets nella sezione Edge Functions.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
