import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Key, CheckCircle, XCircle, RefreshCw, Eye, EyeOff,
  Save, Loader2, Trash2, AlertTriangle, Info,
} from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";

/* ─── Tipi ──────────────────────────────────────────── */
interface ApiKeyRow {
  key_name: string;
  masked_value: string | null;
  is_configured: boolean;
  last_tested_at: string | null;
  last_test_status: "ok" | "error" | null;
  last_test_message: string | null;
  description: string | null;
}

/* ─── Config UI per ogni chiave ──────────────────────── */
const KEY_CONFIGS: Record<string, {
  label: string; icon: string; color: string;
  placeholder: string; docsUrl: string; category: string;
}> = {
  OPENAI_API_KEY: {
    label: "OpenAI API Key",
    icon: "🤖",
    color: "border-green-200 bg-green-50/40",
    placeholder: "sk-proj-...",
    docsUrl: "https://platform.openai.com/api-keys",
    category: "LLM",
  },
  GEMINI_API_KEY: {
    label: "Google Gemini API Key",
    icon: "✨",
    color: "border-blue-200 bg-blue-50/40",
    placeholder: "AIzaSy...",
    docsUrl: "https://aistudio.google.com/app/apikey",
    category: "LLM",
  },
  ELEVENLABS_API_KEY: {
    label: "ElevenLabs API Key",
    icon: "🎙️",
    color: "border-purple-200 bg-purple-50/40",
    placeholder: "sk_...",
    docsUrl: "https://elevenlabs.io/app/speech-synthesis/api-keys",
    category: "Voice",
  },
  STRIPE_SECRET_KEY: {
    label: "Stripe Secret Key",
    icon: "💳",
    color: "border-indigo-200 bg-indigo-50/40",
    placeholder: "sk_live_... oppure sk_test_...",
    docsUrl: "https://dashboard.stripe.com/apikeys",
    category: "Pagamenti",
  },
  RESEND_API_KEY: {
    label: "Resend API Key",
    icon: "📧",
    color: "border-orange-200 bg-orange-50/40",
    placeholder: "re_...",
    docsUrl: "https://resend.com/api-keys",
    category: "Email",
  },
  FIRECRAWL_API_KEY: {
    label: "Firecrawl API Key",
    icon: "🕷️",
    color: "border-red-200 bg-red-50/40",
    placeholder: "fc-...",
    docsUrl: "https://www.firecrawl.dev/app/api-keys",
    category: "Scraping",
  },
};

const CATEGORY_ORDER = ["LLM", "Voice", "Pagamenti", "Email", "Scraping"];

/* ─── Componente singola API key card ────────────────── */
function ApiKeyCard({
  row,
  onSave,
  onTest,
  onDelete,
}: {
  row: ApiKeyRow;
  onSave: (keyName: string, value: string) => Promise<void>;
  onTest: (keyName: string) => Promise<void>;
  onDelete: (keyName: string) => Promise<void>;
}) {
  const cfg = KEY_CONFIGS[row.key_name];
  if (!cfg) return null;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [showValue, setShowValue] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleSave = async () => {
    if (!inputValue.trim()) return;
    setSaving(true);
    await onSave(row.key_name, inputValue.trim());
    setSaving(false);
    setInputValue("");
    setDialogOpen(false);
  };

  const handleTest = async () => {
    setTesting(true);
    await onTest(row.key_name);
    setTesting(false);
  };

  const handleDelete = async () => {
    if (!confirm(`Rimuovere la chiave ${cfg.label}?`)) return;
    setDeleting(true);
    await onDelete(row.key_name);
    setDeleting(false);
  };

  return (
    <>
      <Card className={`${cfg.color} transition-all`}>
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-4">
            {/* Icona + info */}
            <div className="flex items-start gap-3 min-w-0">
              <span className="text-2xl mt-0.5 shrink-0">{cfg.icon}</span>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-foreground text-sm">{cfg.label}</h3>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">{cfg.category}</Badge>
                  {row.is_configured ? (
                    <Badge className="bg-green-100 text-green-700 border-green-200 text-[10px] px-1.5 py-0 gap-1" variant="outline">
                      <CheckCircle className="h-2.5 w-2.5" /> Configurata
                    </Badge>
                  ) : (
                    <Badge className="bg-red-50 text-red-600 border-red-200 text-[10px] px-1.5 py-0 gap-1" variant="outline">
                      <XCircle className="h-2.5 w-2.5" /> Non configurata
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">{row.description}</p>
                {row.is_configured && row.masked_value && (
                  <p className="text-xs font-mono text-muted-foreground mt-1">{row.masked_value}</p>
                )}
                {/* Stato ultimo test */}
                {row.last_tested_at && (
                  <div className={`flex items-center gap-1.5 mt-1.5 text-xs ${
                    row.last_test_status === "ok" ? "text-green-700" : "text-red-600"
                  }`}>
                    {row.last_test_status === "ok"
                      ? <CheckCircle className="h-3 w-3 shrink-0" />
                      : <XCircle className="h-3 w-3 shrink-0" />}
                    <span>{row.last_test_message}</span>
                    <span className="text-muted-foreground ml-1">
                      — {format(new Date(row.last_tested_at), "dd/MM HH:mm", { locale: it })}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Azioni */}
            <div className="flex items-center gap-1.5 shrink-0">
              {row.is_configured && (
                <Button
                  size="sm" variant="outline"
                  onClick={handleTest} disabled={testing}
                  className="text-xs h-7 px-2"
                >
                  {testing
                    ? <Loader2 className="h-3 w-3 animate-spin" />
                    : <RefreshCw className="h-3 w-3" />}
                  <span className="hidden sm:inline ml-1">Test</span>
                </Button>
              )}
              <Button
                size="sm"
                onClick={() => { setInputValue(""); setDialogOpen(true); }}
                className="text-xs h-7 px-2"
                variant={row.is_configured ? "outline" : "default"}
              >
                <Key className="h-3 w-3" />
                <span className="hidden sm:inline ml-1">{row.is_configured ? "Aggiorna" : "Configura"}</span>
              </Button>
              {row.is_configured && (
                <Button
                  size="sm" variant="ghost"
                  onClick={handleDelete} disabled={deleting}
                  className="text-xs h-7 px-2 text-destructive hover:text-destructive"
                >
                  {deleting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dialog inserimento chiave */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span>{cfg.icon}</span>
              {row.is_configured ? "Aggiorna" : "Configura"} {cfg.label}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-800">
              <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <span>
                La chiave viene cifrata con AES-256-GCM prima di essere salvata. Non viene mai trasmessa in chiaro.{" "}
                <a href={cfg.docsUrl} target="_blank" rel="noopener noreferrer" className="underline font-medium">
                  Ottieni la chiave →
                </a>
              </span>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Chiave API</Label>
              <div className="relative">
                <Input
                  type={showValue ? "text" : "password"}
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  placeholder={cfg.placeholder}
                  className="pr-10 font-mono text-sm"
                  onKeyDown={e => e.key === "Enter" && handleSave()}
                />
                <button
                  type="button"
                  onClick={() => setShowValue(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showValue ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annulla</Button>
            <Button onClick={handleSave} disabled={!inputValue.trim() || saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Salva
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/* ─── Pagina principale ──────────────────────────────── */
export default function ApiKeysPage() {
  const { toast } = useToast();
  const [keys, setKeys] = useState<ApiKeyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [testingAll, setTestingAll] = useState(false);

  const loadKeys = useCallback(async () => {
    const { data, error } = await supabase.functions.invoke("manage-api-keys", {
      body: { action: "list" },
    });
    if (error || data?.error) {
      toast({ variant: "destructive", title: "Errore caricamento chiavi", description: data?.error || error?.message });
    } else {
      setKeys(data.keys || []);
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => { loadKeys(); }, [loadKeys]);

  const handleSave = async (keyName: string, value: string) => {
    const { data, error } = await supabase.functions.invoke("manage-api-keys", {
      body: { action: "save", key_name: keyName, key_value: value },
    });
    if (error || data?.error) {
      toast({ variant: "destructive", title: "Errore salvataggio", description: data?.error || error?.message });
    } else {
      toast({ title: "✅ Chiave salvata", description: `${KEY_CONFIGS[keyName]?.label} aggiornata` });
      await loadKeys();
    }
  };

  const handleTest = async (keyName: string) => {
    const { data, error } = await supabase.functions.invoke("manage-api-keys", {
      body: { action: "test", key_name: keyName },
    });
    if (error || data?.error) {
      toast({ variant: "destructive", title: "Test fallito", description: data?.error || error?.message });
    } else if (data.status === "ok") {
      toast({ title: "✅ Connessione OK", description: data.message });
    } else {
      toast({ variant: "destructive", title: "Test fallito", description: data.message });
    }
    await loadKeys();
  };

  const handleDelete = async (keyName: string) => {
    const { data, error } = await supabase.functions.invoke("manage-api-keys", {
      body: { action: "delete", key_name: keyName },
    });
    if (error || data?.error) {
      toast({ variant: "destructive", title: "Errore", description: data?.error || error?.message });
    } else {
      toast({ title: "Chiave rimossa" });
      await loadKeys();
    }
  };

  const handleTestAll = async () => {
    setTestingAll(true);
    const configured = keys.filter(k => k.is_configured);
    for (const k of configured) {
      await handleTest(k.key_name);
    }
    setTestingAll(false);
    toast({ title: "Test completati", description: `${configured.length} chiavi testate` });
  };

  /* Statistiche */
  const totalKeys = keys.length;
  const configuredKeys = keys.filter(k => k.is_configured).length;
  const okKeys = keys.filter(k => k.last_test_status === "ok").length;
  const errorKeys = keys.filter(k => k.last_test_status === "error").length;

  /* Raggruppa per categoria */
  const byCategory: Record<string, ApiKeyRow[]> = {};
  for (const row of keys) {
    const cat = KEY_CONFIGS[row.key_name]?.category || "Altro";
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(row);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Key className="h-6 w-6 text-primary" />
            API Keys
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Chiavi API cifrate per tutti i servizi della piattaforma
          </p>
        </div>
        {configuredKeys > 0 && (
          <Button onClick={handleTestAll} disabled={testingAll} variant="outline">
            {testingAll
              ? <Loader2 className="h-4 w-4 animate-spin mr-2" />
              : <RefreshCw className="h-4 w-4 mr-2" />}
            Testa tutte
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Totale chiavi", value: totalKeys, icon: Key, color: "text-muted-foreground" },
          { label: "Configurate", value: configuredKeys, icon: CheckCircle, color: "text-primary" },
          { label: "Test OK", value: okKeys, icon: CheckCircle, color: "text-green-600" },
          { label: "Errori", value: errorKeys, icon: AlertTriangle, color: "text-destructive" },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="p-4 flex items-center gap-3">
              <Icon className={`h-5 w-5 shrink-0 ${color}`} />
              <div>
                <p className="text-2xl font-bold text-foreground">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Warning se ci sono chiavi mancanti */}
      {configuredKeys < totalKeys && (
        <Card className="border-yellow-300 bg-yellow-50/50">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-yellow-800">
                {totalKeys - configuredKeys} chiave{totalKeys - configuredKeys !== 1 ? "" : ""} non configurata
              </p>
              <p className="text-xs text-yellow-700 mt-0.5">
                Le funzionalità che dipendono da queste chiavi non funzioneranno correttamente.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sezioni per categoria */}
      {CATEGORY_ORDER.filter(cat => byCategory[cat]?.length > 0).map(category => (
        <div key={category} className="space-y-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">{category}</h2>
            <div className="flex-1 h-px bg-border" />
          </div>
          <div className="space-y-2">
            {byCategory[category].map(row => (
              <ApiKeyCard
                key={row.key_name}
                row={row}
                onSave={handleSave}
                onTest={handleTest}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </div>
      ))}

      {/* Note di sicurezza */}
      <Card className="border-dashed">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Info className="h-4 w-4 text-muted-foreground" />
            Note di sicurezza
          </CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground space-y-1">
          <p>• Le chiavi vengono cifrate con AES-256-GCM prima di essere salvate nel database</p>
          <p>• Solo i superadmin hanno accesso a questa sezione (RLS attivo)</p>
          <p>• I valori cifrati non vengono mai esposti nel frontend — solo le versioni mascherate</p>
          <p>• Per chiavi ElevenLabs e sistemi già configurati come env vars, questi valori sono sovrascritture DB</p>
        </CardContent>
      </Card>
    </div>
  );
}
