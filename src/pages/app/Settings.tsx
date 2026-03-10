import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useCompanyId } from "@/hooks/useCompanyId";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Eye, EyeOff, Save, Loader2, CheckCircle2, Plus, Trash2, Send, Globe, History,
  RefreshCw, Link2, Unlink, Download, XCircle, CheckCircle
} from "lucide-react";
import type { Json } from "@/integrations/supabase/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import { it } from "date-fns/locale";

interface NotifSettings {
  new_conversation: boolean;
  daily_report: boolean;
  weekly_report: boolean;
}

interface Webhook {
  id: string;
  url: string;
  secret: string | null;
  events: string[];
  is_active: boolean;
  created_at: string;
}

interface WebhookLog {
  id: string;
  event_type: string;
  status_code: number | null;
  success: boolean;
  created_at: string;
}

interface CrmIntegration {
  id: string;
  provider: string;
  is_active: boolean;
  status: string;
  last_sync_at: string | null;
  last_sync_status: string | null;
  last_sync_count: number;
  instance_url: string | null;
}

const CRM_PROVIDERS = [
  {
    id: "hubspot",
    name: "HubSpot",
    icon: "🟠",
    color: "bg-orange-500/10 border-orange-500/20",
    desc: "Importa contatti dal tuo CRM HubSpot",
    fields: [{ key: "api_key", label: "API Key (Private App Token)", placeholder: "pat-xx-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" }],
  },
  {
    id: "salesforce",
    name: "Salesforce",
    icon: "☁️",
    color: "bg-blue-500/10 border-blue-500/20",
    desc: "Importa contatti dalla tua org Salesforce",
    fields: [
      { key: "api_key", label: "Access Token", placeholder: "00Dxx0000001gPL!AR..." },
      { key: "instance_url", label: "Instance URL", placeholder: "https://yourorg.my.salesforce.com" },
    ],
  },
  {
    id: "pipedrive",
    name: "Pipedrive",
    icon: "🟢",
    color: "bg-green-500/10 border-green-500/20",
    desc: "Importa persone dal tuo account Pipedrive",
    fields: [{ key: "api_key", label: "API Token", placeholder: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" }],
  },
];

const EVENT_TYPES = [
  { value: "conversation.created", label: "Nuova conversazione" },
  { value: "appointment.set", label: "Appuntamento fissato" },
  { value: "campaign.completed", label: "Campagna completata" },
  { value: "contact.created", label: "Nuovo contatto" },
  { value: "agent.status_changed", label: "Stato agente cambiato" },
];

export default function Settings() {
  const { profile, user } = useAuth();
  const companyId = useCompanyId();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingApi, setSavingApi] = useState(false);
  const [savingNotif, setSavingNotif] = useState(false);
  const [testing, setTesting] = useState(false);

  const [fullName, setFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [notif, setNotif] = useState<NotifSettings>({ new_conversation: true, daily_report: false, weekly_report: true });

  // Webhooks state
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [loadingWebhooks, setLoadingWebhooks] = useState(false);
  const [showCreateWh, setShowCreateWh] = useState(false);
  const [whForm, setWhForm] = useState({ url: "", secret: "", events: [] as string[] });
  const [savingWh, setSavingWh] = useState(false);
  const [testingWh, setTestingWh] = useState<string | null>(null);
  const [showLogs, setShowLogs] = useState<string | null>(null);
  const [whLogs, setWhLogs] = useState<WebhookLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // CRM Integrations state
  const [crmIntegrations, setCrmIntegrations] = useState<CrmIntegration[]>([]);
  const [crmConfigOpen, setCrmConfigOpen] = useState<string | null>(null);
  const [crmApiKey, setCrmApiKey] = useState("");
  const [crmInstanceUrl, setCrmInstanceUrl] = useState("");
  const [crmShowKey, setCrmShowKey] = useState(false);
  const [crmSaving, setCrmSaving] = useState(false);
  const [crmTesting, setCrmTesting] = useState<string | null>(null);
  const [crmSyncing, setCrmSyncing] = useState<string | null>(null);

  const loadCrmIntegrations = useCallback(async () => {
    if (!companyId) return;
    const { data } = await supabase
      .from("company_integrations")
      .select("id, provider, is_active, status, last_sync_at, last_sync_status, last_sync_count, instance_url")
      .eq("company_id", companyId);
    setCrmIntegrations((data as CrmIntegration[]) || []);
  }, [companyId]);

  useEffect(() => {
    if (!profile) return;
    setFullName(profile.full_name || "");
    setAvatarUrl(profile.avatar_url || "");
    if (companyId) {
      Promise.all([
        supabase.from("companies").select("el_api_key, settings").eq("id", companyId).single(),
        loadWebhooks(companyId),
        loadCrmIntegrations(),
      ]).then(([compRes]) => {
        if (compRes.data) {
          setApiKey(compRes.data.el_api_key || "");
          const s = (compRes.data.settings as Record<string, unknown>) || {};
          setNotif({ new_conversation: s.new_conversation !== false, daily_report: !!s.daily_report, weekly_report: s.weekly_report !== false });
        }
        setLoading(false);
      });
    } else { setLoading(false); }
  }, [profile, companyId, loadCrmIntegrations]);

  const loadWebhooks = async (companyId: string) => {
    setLoadingWebhooks(true);
    const { data } = await supabase
      .from("webhooks")
      .select("id, url, secret, events, is_active, created_at")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false });
    setWebhooks((data as Webhook[]) || []);
    setLoadingWebhooks(false);
  };

  const saveProfile = async () => {
    if (!user) return;
    setSavingProfile(true);
    const { error } = await supabase.from("profiles").update({ full_name: fullName, avatar_url: avatarUrl || null }).eq("id", user.id);
    setSavingProfile(false);
    toast(error ? { title: "Errore", description: error.message, variant: "destructive" } : { title: "Profilo aggiornato" });
  };

  const saveApiKey = async () => {
    if (!companyId) return;
    setSavingApi(true);
    const { error } = await supabase.from("companies").update({ el_api_key: apiKey || null }).eq("id", companyId);
    setSavingApi(false);
    toast(error ? { title: "Errore", description: error.message, variant: "destructive" } : { title: "API Key aggiornata" });
  };

  const testConnection = async () => {
    if (!companyId) return;
    setTesting(true);
    try {
      const { data, error } = await supabase.functions.invoke("get-elevenlabs-voices", { body: { company_id: companyId } });
      if (error) throw error;
      toast({ title: "Connessione riuscita", description: `${data?.voices?.length || 0} voci trovate.` });
    } catch (err: any) {
      toast({ title: "Connessione fallita", description: err.message || "Errore sconosciuto", variant: "destructive" });
    }
    setTesting(false);
  };

  const saveNotif = async () => {
    if (!companyId) return;
    setSavingNotif(true);
    const { error } = await supabase.from("companies").update({ settings: notif as unknown as Json }).eq("id", companyId);
    setSavingNotif(false);
    toast(error ? { title: "Errore", description: error.message, variant: "destructive" } : { title: "Preferenze salvate" });
  };

  // Webhook CRUD
  const createWebhook = async () => {
    if (!companyId || !whForm.url || whForm.events.length === 0) return;
    setSavingWh(true);
    const { error } = await supabase.from("webhooks").insert({
      company_id: companyId,
      url: whForm.url,
      secret: whForm.secret || null,
      events: whForm.events,
      is_active: true,
    });
    setSavingWh(false);
    if (error) {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Webhook creato" });
      setShowCreateWh(false);
      setWhForm({ url: "", secret: "", events: [] });
      if (companyId) loadWebhooks(companyId);
    }
  };

  const toggleWebhook = async (id: string, active: boolean) => {
    await supabase.from("webhooks").update({ is_active: active }).eq("id", id);
    if (companyId) loadWebhooks(companyId);
  };

  const deleteWebhook = async (id: string) => {
    await supabase.from("webhooks").delete().eq("id", id);
    if (companyId) loadWebhooks(companyId);
    toast({ title: "Webhook eliminato" });
  };

  const testWebhook = async (wh: Webhook) => {
    if (!companyId) return;
    setTestingWh(wh.id);
    try {
      const { error } = await supabase.functions.invoke("dispatch-webhook", {
        body: {
          company_id: companyId,
          event_type: "test.ping",
          payload: { message: "Test webhook from settings", timestamp: new Date().toISOString() },
        },
      });
      if (error) throw error;
      toast({ title: "Test inviato", description: "Controlla il log per il risultato." });
    } catch (err: any) {
      toast({ title: "Errore test", description: err.message, variant: "destructive" });
    }
    setTestingWh(null);
  };

  const openLogs = async (webhookId: string) => {
    setShowLogs(webhookId);
    setLoadingLogs(true);
    const { data } = await supabase
      .from("webhook_logs")
      .select("id, event_type, status_code, success, created_at")
      .eq("webhook_id", webhookId)
      .order("created_at", { ascending: false })
      .limit(50);
    setWhLogs((data as WebhookLog[]) || []);
    setLoadingLogs(false);
  };

  const toggleEvent = (event: string) => {
    setWhForm((prev) => ({
      ...prev,
      events: prev.events.includes(event) ? prev.events.filter((e) => e !== event) : [...prev.events, event],
    }));
  };

  // CRM Handlers
  const testCrmConnection = async (provider: string) => {
    if (!companyId) return;
    setCrmTesting(provider);
    try {
      const { data, error } = await supabase.functions.invoke("crm-sync", {
        body: { action: "test_connection", provider, api_key: crmApiKey, instance_url: crmInstanceUrl || undefined, company_id: companyId },
      });
      if (error || data?.error) {
        toast({ variant: "destructive", title: "Test fallito", description: data?.error || error?.message });
      } else {
        toast({ title: "Connessione riuscita", description: `${data.contacts_count} contatti trovati nel CRM` });
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "Errore", description: err.message });
    } finally { setCrmTesting(null); }
  };

  const saveCrmIntegration = async (provider: string) => {
    if (!companyId || !crmApiKey) return;
    setCrmSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke("crm-sync", {
        body: { action: "save_integration", provider, api_key: crmApiKey, instance_url: crmInstanceUrl || undefined, company_id: companyId },
      });
      if (error || data?.error) {
        toast({ variant: "destructive", title: "Errore", description: data?.error || error?.message });
      } else {
        toast({ title: "Integrazione salvata" });
        setCrmConfigOpen(null);
        setCrmApiKey("");
        setCrmInstanceUrl("");
        await loadCrmIntegrations();
      }
    } finally { setCrmSaving(false); }
  };

  const disconnectCrm = async (provider: string) => {
    if (!companyId) return;
    const { error } = await supabase.functions.invoke("crm-sync", {
      body: { action: "disconnect", provider, company_id: companyId },
    });
    if (error) {
      toast({ variant: "destructive", title: "Errore", description: error.message });
    } else {
      toast({ title: "Integrazione disconnessa" });
      await loadCrmIntegrations();
    }
  };

  const syncCrmContacts = async (provider: string) => {
    if (!companyId) return;
    setCrmSyncing(provider);
    try {
      const { data, error } = await supabase.functions.invoke("crm-sync", {
        body: { action: "sync_contacts", provider, company_id: companyId },
      });
      if (error || data?.error) {
        toast({ variant: "destructive", title: "Sync fallito", description: data?.error || error?.message });
      } else {
        toast({ title: "Sync completato", description: `${data.imported} importati, ${data.skipped} saltati su ${data.total} totali` });
        await loadCrmIntegrations();
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "Errore sync", description: err.message });
    } finally { setCrmSyncing(null); }
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-brand" /></div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-ink-900">Impostazioni</h1>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="bg-ink-100 border-none">
          <TabsTrigger value="profile">Profilo</TabsTrigger>
          <TabsTrigger value="api">API</TabsTrigger>
          <TabsTrigger value="integrations">CRM</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          <TabsTrigger value="notif">Notifiche</TabsTrigger>
          <TabsTrigger value="billing">Fatturazione</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <div className="rounded-card border border-ink-200 bg-white p-6 space-y-4 max-w-lg shadow-card">
            <h3 className="text-lg font-semibold text-ink-900">Profilo utente</h3>
            <div className="space-y-2">
              <Label className="text-ink-600">Email</Label>
              <Input value={profile?.email || ""} disabled className="bg-ink-50 border-ink-200 text-ink-400 opacity-60" />
            </div>
            <div className="space-y-2">
              <Label className="text-ink-600">Nome completo</Label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} className="bg-ink-50 border-ink-200 text-ink-900" />
            </div>
            <div className="space-y-2">
              <Label className="text-ink-600">Avatar URL</Label>
              <Input value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="https://..." className="bg-ink-50 border-ink-200 text-ink-900" />
            </div>
            <Button onClick={saveProfile} disabled={savingProfile} className="bg-brand hover:bg-brand-hover text-white">
              {savingProfile ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Salva profilo
            </Button>
          </div>
        </TabsContent>

        {/* API Tab */}
        <TabsContent value="api">
          <div className="rounded-card border border-ink-200 bg-white p-6 space-y-4 max-w-lg shadow-card">
            <h3 className="text-lg font-semibold text-ink-900">ElevenLabs API Key</h3>
            <p className="text-sm text-ink-500">Inserisci la tua API key di ElevenLabs per abilitare le funzionalità vocali.</p>
            <div className="space-y-2">
              <Label className="text-ink-600">API Key</Label>
              <div className="relative">
                <Input type={showApiKey ? "text" : "password"} value={apiKey} onChange={(e) => setApiKey(e.target.value)} className="bg-ink-50 border-ink-200 text-ink-900 pr-10" />
                <button type="button" onClick={() => setShowApiKey(!showApiKey)} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-700">
                  {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="flex gap-3">
              <Button onClick={saveApiKey} disabled={savingApi} className="bg-brand hover:bg-brand-hover text-white">
                {savingApi ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Salva
              </Button>
              <Button variant="outline" onClick={testConnection} disabled={testing} className="border-ink-200 text-ink-700 hover:bg-ink-50">
                {testing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                Testa connessione
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* Webhooks Tab */}
        <TabsContent value="webhooks">
          <div className="space-y-4 max-w-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-ink-900">Webhooks</h3>
                <p className="text-sm text-ink-500">Ricevi notifiche in tempo reale su endpoint esterni quando si verificano eventi.</p>
              </div>
              <Button onClick={() => setShowCreateWh(true)} className="bg-brand hover:bg-brand-hover text-white">
                <Plus className="h-4 w-4 mr-2" /> Nuovo webhook
              </Button>
            </div>

            {loadingWebhooks ? (
              <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-brand" /></div>
            ) : webhooks.length === 0 ? (
              <div className="rounded-card border border-ink-200 bg-white p-8 text-center shadow-card">
                <Globe className="h-10 w-10 mx-auto text-ink-300 mb-3" />
                <p className="text-ink-500">Nessun webhook configurato</p>
                <p className="text-xs text-ink-400 mt-1">Crea un webhook per ricevere notifiche push sugli eventi.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {webhooks.map((wh) => (
                  <div key={wh.id} className="rounded-card border border-ink-200 bg-white p-4 shadow-card">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <code className="text-sm font-mono text-ink-800 truncate block">{wh.url}</code>
                          <Badge variant={wh.is_active ? "default" : "secondary"} className="text-xs shrink-0">
                            {wh.is_active ? "Attivo" : "Disattivo"}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {wh.events.map((ev) => (
                            <Badge key={ev} variant="outline" className="text-xs border-ink-200 text-ink-600">
                              {EVENT_TYPES.find((e) => e.value === ev)?.label || ev}
                            </Badge>
                          ))}
                        </div>
                        {wh.secret && <p className="text-xs text-ink-400 mt-1">🔐 Firma HMAC attiva</p>}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Switch checked={wh.is_active} onCheckedChange={(v) => toggleWebhook(wh.id, v)} />
                        <Button variant="ghost" size="icon" onClick={() => testWebhook(wh)} disabled={testingWh === wh.id} className="text-ink-500 hover:text-ink-700">
                          {testingWh === wh.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => openLogs(wh.id)} className="text-ink-500 hover:text-ink-700">
                          <History className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteWebhook(wh.id)} className="text-red-500 hover:text-red-700">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Create Webhook Dialog */}
          <Dialog open={showCreateWh} onOpenChange={setShowCreateWh}>
            <DialogContent className="bg-white">
              <DialogHeader><DialogTitle className="text-ink-900">Nuovo Webhook</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-ink-600">URL Endpoint</Label>
                  <Input value={whForm.url} onChange={(e) => setWhForm((p) => ({ ...p, url: e.target.value }))} placeholder="https://example.com/webhook" className="bg-ink-50 border-ink-200 text-ink-900" />
                </div>
                <div className="space-y-2">
                  <Label className="text-ink-600">Secret (opzionale)</Label>
                  <Input value={whForm.secret} onChange={(e) => setWhForm((p) => ({ ...p, secret: e.target.value }))} placeholder="Chiave segreta per firma HMAC" className="bg-ink-50 border-ink-200 text-ink-900" />
                  <p className="text-xs text-ink-400">Se fornito, ogni richiesta includerà un header X-Webhook-Signature con firma HMAC-SHA256.</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-ink-600">Eventi</Label>
                  <div className="space-y-2">
                    {EVENT_TYPES.map((ev) => (
                      <label key={ev.value} className="flex items-center gap-2 cursor-pointer">
                        <Checkbox checked={whForm.events.includes(ev.value)} onCheckedChange={() => toggleEvent(ev.value)} />
                        <span className="text-sm text-ink-700">{ev.label}</span>
                        <span className="text-xs text-ink-400 font-mono">{ev.value}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <Button onClick={createWebhook} disabled={savingWh || !whForm.url || whForm.events.length === 0} className="w-full bg-brand hover:bg-brand-hover text-white">
                  {savingWh ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                  Crea Webhook
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Logs Dialog */}
          <Dialog open={!!showLogs} onOpenChange={() => setShowLogs(null)}>
            <DialogContent className="bg-white max-w-lg">
              <DialogHeader><DialogTitle className="text-ink-900">Log Consegne</DialogTitle></DialogHeader>
              {loadingLogs ? (
                <div className="flex justify-center py-6"><Loader2 className="h-6 w-6 animate-spin text-brand" /></div>
              ) : whLogs.length === 0 ? (
                <p className="text-center text-ink-400 py-6">Nessun log disponibile</p>
              ) : (
                <div className="max-h-80 overflow-y-auto space-y-2">
                  {whLogs.map((log) => (
                    <div key={log.id} className="flex items-center justify-between text-sm border-b border-ink-100 pb-2">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${log.success ? "bg-green-500" : "bg-red-500"}`} />
                        <span className="font-mono text-xs text-ink-600">{log.event_type}</span>
                      </div>
                      <div className="flex items-center gap-3 text-ink-400 text-xs">
                        {log.status_code && <span>HTTP {log.status_code}</span>}
                        <span>{format(new Date(log.created_at), "dd/MM HH:mm", { locale: it })}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notif">
          <div className="rounded-card border border-ink-200 bg-white p-6 space-y-5 max-w-lg shadow-card">
            <h3 className="text-lg font-semibold text-ink-900">Preferenze notifiche</h3>
            {([
              { key: "new_conversation" as const, label: "Nuova conversazione", desc: "Ricevi una notifica per ogni nuova conversazione" },
              { key: "daily_report" as const, label: "Report giornaliero", desc: "Riepilogo quotidiano via email" },
              { key: "weekly_report" as const, label: "Report settimanale", desc: "Riepilogo settimanale via email" },
            ]).map((item) => (
              <div key={item.key} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-ink-900">{item.label}</p>
                  <p className="text-xs text-ink-500">{item.desc}</p>
                </div>
                <Switch checked={notif[item.key]} onCheckedChange={(v) => setNotif((prev) => ({ ...prev, [item.key]: v }))} />
              </div>
            ))}
            <Button onClick={saveNotif} disabled={savingNotif} className="bg-brand hover:bg-brand-hover text-white">
              {savingNotif ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Salva preferenze
            </Button>
          </div>
        </TabsContent>

        {/* Billing Tab */}
        <TabsContent value="billing">
          <div className="rounded-card border border-ink-200 bg-white p-6 space-y-4 max-w-lg shadow-card">
            <h3 className="text-lg font-semibold text-ink-900">Piano & Fatturazione</h3>
            <p className="text-sm text-ink-500">La gestione del piano e della fatturazione sarà disponibile a breve.</p>
            <div className="rounded-lg bg-ink-50 p-4 text-center">
              <p className="text-ink-400 text-sm">🚧 In costruzione</p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
