import { useEffect, useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useCompanyId } from "@/hooks/useCompanyId";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Eye, EyeOff, Save, Loader2, CheckCircle2, Plus, Trash2, Send, Globe, History,
  RefreshCw, Link2, Unlink, Download, XCircle, CheckCircle, CreditCard,
  Building2, Users, Shield, Bell, Key, ChevronRight,
} from "lucide-react";
import { useSearchParams, useNavigate } from "react-router-dom";
import type { Json } from "@/integrations/supabase/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { TabProfilo } from "@/components/impostazioni/TabProfilo";
import { TabPiano } from "@/components/impostazioni/TabPiano";
import { TabUtenti } from "@/components/impostazioni/TabUtenti";
import type { LucideIcon } from "lucide-react";

// ─── Types ───
interface NotifSettings { new_conversation: boolean; daily_report: boolean; weekly_report: boolean; }
interface Webhook { id: string; url: string; secret: string | null; events: string[]; is_active: boolean; created_at: string; }
interface WebhookLog { id: string; event_type: string; status_code: number | null; success: boolean; created_at: string; }
interface CrmIntegration { id: string; provider: string; is_active: boolean; status: string; last_sync_at: string | null; last_sync_status: string | null; last_sync_count: number; instance_url: string | null; }

const CRM_PROVIDERS = [
  { id: "hubspot", name: "HubSpot", icon: "🟠", color: "bg-orange-500/10 border-orange-500/20", desc: "Importa contatti dal tuo CRM HubSpot", fields: [{ key: "api_key", label: "API Key (Private App Token)", placeholder: "pat-xx-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" }] },
  { id: "salesforce", name: "Salesforce", icon: "☁️", color: "bg-blue-500/10 border-blue-500/20", desc: "Importa contatti dalla tua org Salesforce", fields: [{ key: "api_key", label: "Access Token", placeholder: "00Dxx0000001gPL!AR..." }, { key: "instance_url", label: "Instance URL", placeholder: "https://yourorg.my.salesforce.com" }] },
  { id: "pipedrive", name: "Pipedrive", icon: "🟢", color: "bg-green-500/10 border-green-500/20", desc: "Importa persone dal tuo account Pipedrive", fields: [{ key: "api_key", label: "API Token", placeholder: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" }] },
];

const EVENT_TYPES = [
  { value: "conversation.created", label: "Nuova conversazione" },
  { value: "appointment.set", label: "Appuntamento fissato" },
  { value: "campaign.completed", label: "Campagna completata" },
  { value: "contact.created", label: "Nuovo contatto" },
  { value: "agent.status_changed", label: "Stato agente cambiato" },
];

type TabId = 'profilo' | 'piano' | 'utenti' | 'api' | 'webhooks' | 'notifiche' | 'fatturazione';

const TABS: Array<{ id: TabId; label: string; icon: LucideIcon; desc: string; badge?: string }> = [
  { id: 'profilo', label: 'Profilo azienda', icon: Building2, desc: 'Logo, nome, branding' },
  { id: 'piano', label: 'Piano & Funzioni', icon: Shield, desc: 'Funzionalità AI sbloccate', badge: 'Pro' },
  { id: 'utenti', label: 'Utenti & Accessi', icon: Users, desc: 'Gestisci team e permessi' },
  { id: 'api', label: 'API & Integrazioni', icon: Key, desc: 'Chiavi API e connessioni' },
  { id: 'webhooks', label: 'Webhooks', icon: Globe, desc: 'Notifiche eventi' },
  { id: 'notifiche', label: 'Notifiche', icon: Bell, desc: 'Email e alert' },
  { id: 'fatturazione', label: 'Fatturazione', icon: CreditCard, desc: 'Piano, pagamenti, fatture' },
];

// ─── Billing sub-component ───
function BillingTabContent({ companyId, navigate }: { companyId: string | null | undefined; navigate: (path: string) => void }) {
  const { data: billingCredits } = useQuery({
    queryKey: ["billing-credits", companyId],
    queryFn: async () => {
      const { data, error } = await supabase.from("ai_credits").select("balance_eur, auto_recharge_enabled, auto_recharge_threshold").eq("company_id", companyId!).single();
      if (error) throw error;
      return data as { balance_eur: number; auto_recharge_enabled: boolean; auto_recharge_threshold: number };
    },
    enabled: !!companyId, staleTime: 2 * 60 * 1000,
  });
  const { data: recentTopups = [] } = useQuery({
    queryKey: ["billing-topups", companyId],
    queryFn: async () => {
      const { data, error } = await supabase.from("ai_credit_topups").select("amount_eur, created_at, type, status").eq("company_id", companyId!).order("created_at", { ascending: false }).limit(5);
      if (error) throw error;
      return (data ?? []) as { amount_eur: number; created_at: string; type: string; status: string }[];
    },
    enabled: !!companyId, staleTime: 2 * 60 * 1000,
  });
  const balanceStatus = !billingCredits ? null : billingCredits.balance_eur < 10 ? "destructive" : billingCredits.balance_eur < 50 ? "secondary" : "default";

  return (
    <div className="space-y-4 max-w-lg">
      <Card><CardHeader className="pb-3"><CardTitle className="text-base">Crediti conversazionali</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-3xl font-extrabold text-foreground">€{billingCredits?.balance_eur?.toFixed(2) ?? "—"}</span>
            {balanceStatus && <Badge variant={balanceStatus as any}>{billingCredits!.balance_eur < 10 ? "Quasi esauriti" : billingCredits!.balance_eur < 50 ? "Scorta bassa" : "OK"}</Badge>}
          </div>
          {billingCredits?.auto_recharge_enabled && <p className="text-xs text-muted-foreground">✓ Auto-ricarica attiva — si ricarica sotto €{billingCredits.auto_recharge_threshold}</p>}
          <Button size="sm" variant="outline" onClick={() => navigate("/app/credits")} className="gap-2"><CreditCard className="h-4 w-4" /> Gestisci crediti</Button>
        </CardContent>
      </Card>
      {recentTopups.length > 0 && (
        <Card><CardHeader className="pb-3"><CardTitle className="text-base">Ultime ricariche</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {recentTopups.map((t, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2"><span className="text-muted-foreground">{new Date(t.created_at).toLocaleDateString("it-IT")}</span>{t.type === "auto" && <Badge variant="secondary" className="text-xs">auto</Badge>}</div>
                <span className="font-semibold text-foreground">+€{Number(t.amount_eur).toFixed(2)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Main Settings ───
export default function Settings() {
  const { profile, user } = useAuth();
  const companyId = useCompanyId();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const activeTab = (searchParams.get("tab") as TabId) || "profilo";

  const setTab = (tab: TabId) => setSearchParams({ tab });
  const currentTab = TABS.find(t => t.id === activeTab)!;

  const [loading, setLoading] = useState(true);
  const [savingNotif, setSavingNotif] = useState(false);
  const [testing, setTesting] = useState(false);
  const [deleteWhId, setDeleteWhId] = useState<string | null>(null);
  const [notif, setNotif] = useState<NotifSettings>({ new_conversation: true, daily_report: false, weekly_report: true });

  // Webhooks
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [loadingWebhooks, setLoadingWebhooks] = useState(false);
  const [showCreateWh, setShowCreateWh] = useState(false);
  const [whForm, setWhForm] = useState({ url: "", secret: "", events: [] as string[] });
  const [savingWh, setSavingWh] = useState(false);
  const [testingWh, setTestingWh] = useState<string | null>(null);
  const [showLogs, setShowLogs] = useState<string | null>(null);
  const [whLogs, setWhLogs] = useState<WebhookLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // CRM
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
    const { data } = await supabase.from("company_integrations").select("id, provider, is_active, status, last_sync_at, last_sync_status, last_sync_count, instance_url").eq("company_id", companyId);
    setCrmIntegrations((data as CrmIntegration[]) || []);
  }, [companyId]);

  useEffect(() => {
    if (!profile) return;
    if (companyId) {
      Promise.all([
        supabase.from("companies").select("settings").eq("id", companyId).single(),
        loadWebhooks(companyId),
        loadCrmIntegrations(),
      ]).then(([compRes]) => {
        if (compRes.data) {
          const s = (compRes.data.settings as Record<string, unknown>) || {};
          setNotif({ new_conversation: s.new_conversation !== false, daily_report: !!s.daily_report, weekly_report: s.weekly_report !== false });
        }
        setLoading(false);
      });
    } else { setLoading(false); }
  }, [profile, companyId, loadCrmIntegrations]);

  const loadWebhooks = async (companyId: string) => {
    setLoadingWebhooks(true);
    const { data } = await supabase.from("webhooks").select("id, url, secret, events, is_active, created_at").eq("company_id", companyId).order("created_at", { ascending: false });
    setWebhooks((data as Webhook[]) || []);
    setLoadingWebhooks(false);
  };

  // (Profile saving moved to TabProfilo)

  const testConnection = async () => {
    if (!companyId) return;
    setTesting(true);
    try {
      const { data, error } = await supabase.functions.invoke("get-elevenlabs-voices", { body: { company_id: companyId } });
      if (error) throw error;
      toast({ title: "Connessione riuscita", description: `${data?.voices?.length || 0} voci trovate.` });
    } catch (err: any) { toast({ title: "Connessione fallita", description: err.message || "Errore sconosciuto", variant: "destructive" }); }
    setTesting(false);
  };

  const saveNotif = async () => {
    if (!companyId) return;
    setSavingNotif(true);
    const { error } = await supabase.from("companies").update({ settings: JSON.parse(JSON.stringify(notif)) as Json }).eq("id", companyId);
    setSavingNotif(false);
    toast(error ? { title: "Errore", description: error.message, variant: "destructive" } : { title: "Preferenze salvate" });
  };

  // Webhook handlers
  const createWebhook = async () => {
    if (!companyId || !whForm.url || whForm.events.length === 0) return;
    try { new URL(whForm.url); } catch { toast({ title: "URL non valido", variant: "destructive" }); return; }
    setSavingWh(true);
    const { error } = await supabase.from("webhooks").insert({ company_id: companyId, url: whForm.url, secret: whForm.secret || null, events: whForm.events, is_active: true });
    setSavingWh(false);
    if (error) { toast({ title: "Errore", description: error.message, variant: "destructive" }); }
    else { toast({ title: "Webhook creato" }); setShowCreateWh(false); setWhForm({ url: "", secret: "", events: [] }); loadWebhooks(companyId); }
  };
  const toggleWebhook = async (id: string, active: boolean) => { await supabase.from("webhooks").update({ is_active: active }).eq("id", id); if (companyId) loadWebhooks(companyId); };
  const deleteWebhook = async (id: string) => { await supabase.from("webhooks").delete().eq("id", id); if (companyId) loadWebhooks(companyId); toast({ title: "Webhook eliminato" }); };
  const testWebhook = async (wh: Webhook) => {
    if (!companyId) return;
    setTestingWh(wh.id);
    try {
      const { error } = await supabase.functions.invoke("dispatch-webhook", { body: { company_id: companyId, event_type: "test.ping", payload: { message: "Test", timestamp: new Date().toISOString() } } });
      if (error) throw error;
      toast({ title: "Test inviato" });
    } catch (err: any) { toast({ title: "Errore test", description: err.message, variant: "destructive" }); }
    setTestingWh(null);
  };
  const openLogs = async (webhookId: string) => {
    setShowLogs(webhookId); setLoadingLogs(true);
    const { data } = await supabase.from("webhook_logs").select("id, event_type, status_code, success, created_at").eq("webhook_id", webhookId).order("created_at", { ascending: false }).limit(50);
    setWhLogs((data as WebhookLog[]) || []); setLoadingLogs(false);
  };
  const toggleEvent = (event: string) => { setWhForm(prev => ({ ...prev, events: prev.events.includes(event) ? prev.events.filter(e => e !== event) : [...prev.events, event] })); };

  // CRM handlers
  const testCrmConnection = async (provider: string) => {
    if (!companyId) return; setCrmTesting(provider);
    try {
      const { data, error } = await supabase.functions.invoke("crm-sync", { body: { action: "test_connection", provider, api_key: crmApiKey, instance_url: crmInstanceUrl || undefined, company_id: companyId } });
      if (error || data?.error) { toast({ variant: "destructive", title: "Test fallito", description: data?.error || error?.message }); }
      else { toast({ title: "Connessione riuscita", description: `${data.contacts_count} contatti trovati` }); }
    } catch (err: any) { toast({ variant: "destructive", title: "Errore", description: err.message }); }
    finally { setCrmTesting(null); }
  };
  const saveCrmIntegration = async (provider: string) => {
    if (!companyId || !crmApiKey) return; setCrmSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke("crm-sync", { body: { action: "save_integration", provider, api_key: crmApiKey, instance_url: crmInstanceUrl || undefined, company_id: companyId } });
      if (error || data?.error) { toast({ variant: "destructive", title: "Errore", description: data?.error || error?.message }); }
      else { toast({ title: "Integrazione salvata" }); setCrmConfigOpen(null); setCrmApiKey(""); setCrmInstanceUrl(""); await loadCrmIntegrations(); }
    } finally { setCrmSaving(false); }
  };
  const disconnectCrm = async (provider: string) => {
    if (!companyId) return;
    const { error } = await supabase.functions.invoke("crm-sync", { body: { action: "disconnect", provider, company_id: companyId } });
    if (error) { toast({ variant: "destructive", title: "Errore", description: error.message }); }
    else { toast({ title: "Integrazione disconnessa" }); await loadCrmIntegrations(); }
  };
  const syncCrmContacts = async (provider: string) => {
    if (!companyId) return; setCrmSyncing(provider);
    try {
      const { data, error } = await supabase.functions.invoke("crm-sync", { body: { action: "sync_contacts", provider, company_id: companyId } });
      if (error || data?.error) { toast({ variant: "destructive", title: "Sync fallito", description: data?.error || error?.message }); }
      else { toast({ title: "Sync completato", description: `${data.imported} importati, ${data.skipped} saltati` }); await loadCrmIntegrations(); }
    } catch (err: any) { toast({ variant: "destructive", title: "Errore sync", description: err.message }); }
    finally { setCrmSyncing(null); }
  };

  // Password change
  function PasswordChangeForm() {
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [saving, setSaving] = useState(false);
    const [pwError, setPwError] = useState("");
    const handleChangePassword = async () => {
      setPwError("");
      if (newPassword.length < 8) { setPwError("Minimo 8 caratteri"); return; }
      if (newPassword !== confirmPassword) { setPwError("Le password non corrispondono"); return; }
      setSaving(true);
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      setSaving(false);
      if (error) { toast({ title: "Errore", description: error.message, variant: "destructive" }); }
      else { toast({ title: "Password aggiornata" }); setNewPassword(""); setConfirmPassword(""); }
    };
    return (
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-foreground">Cambia password</h4>
        <div className="space-y-2"><Label className="text-muted-foreground">Nuova password</Label><Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Minimo 8 caratteri" autoComplete="new-password" /></div>
        <div className="space-y-2"><Label className="text-muted-foreground">Conferma password</Label><Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Ripeti la password" autoComplete="new-password" /></div>
        {pwError && <p className="text-sm text-destructive">{pwError}</p>}
        <Button onClick={handleChangePassword} disabled={saving || !newPassword} variant="outline">
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}Aggiorna password
        </Button>
      </div>
    );
  }

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="flex flex-col md:flex-row gap-0 min-h-[calc(100vh-4rem)]">
      {/* Sidebar desktop */}
      <aside className="hidden md:flex flex-col w-64 border-r border-border bg-muted/30 p-4 shrink-0">
        <h1 className="text-lg font-bold text-foreground mb-6">Impostazioni</h1>
        <nav className="space-y-1">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all text-sm ${
                  isActive ? 'bg-primary text-primary-foreground font-medium' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}>
                <Icon className="w-4 h-4 shrink-0" />
                <span className="flex-1">{tab.label}</span>
                {tab.badge && <Badge variant={isActive ? "secondary" : "outline"} className="text-xs">{tab.badge}</Badge>}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Mobile horizontal tabs */}
      <div className="md:hidden overflow-x-auto border-b border-border px-4 py-2 flex gap-2 bg-background">
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button key={tab.id} onClick={() => setTab(tab.id)}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-muted-foreground'
              }`}>
              <Icon className="w-3.5 h-3.5" />{tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <main className="flex-1 p-6 md:p-8 overflow-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-6 md:hidden">
          <span>Impostazioni</span><ChevronRight className="w-3 h-3" /><span className="text-foreground font-medium">{currentTab.label}</span>
        </div>

        {activeTab === 'profilo' && <TabProfilo />}
        {activeTab === 'piano' && <TabPiano />}
        {activeTab === 'utenti' && <TabUtenti />}

        {activeTab === 'api' && (
          <div className="space-y-6 max-w-2xl">
            <div><h2 className="text-lg font-semibold text-foreground">API & Integrazioni</h2></div>
            {/* ElevenLabs */}
            <Card><CardContent className="p-6 space-y-4">
              <h3 className="text-base font-semibold text-foreground">Configurazione API</h3>
              <div className="flex items-start gap-3 p-4 rounded-lg bg-primary/5 border border-primary/10">
                <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div><p className="text-sm font-medium text-foreground">ElevenLabs API — Gestita centralmente</p><p className="text-sm text-muted-foreground mt-1">La chiave è configurata a livello di piattaforma.</p></div>
              </div>
              <Button variant="outline" onClick={testConnection} disabled={testing}>
                {testing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}Testa connessione
              </Button>
            </CardContent></Card>

            {/* CRM */}
            <div><h3 className="text-base font-semibold text-foreground">Integrazioni CRM</h3><p className="text-sm text-muted-foreground">Connetti il tuo CRM per importare contatti</p></div>
            <div className="space-y-3">
              {CRM_PROVIDERS.map(crm => {
                const integration = crmIntegrations.find(i => i.provider === crm.id);
                const isConnected = integration?.is_active && integration?.status === "connected";
                return (
                  <Card key={crm.id} className={isConnected ? crm.color : ''}>
                    <CardContent className="p-5 flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{crm.icon}</span>
                        <div>
                          <div className="flex items-center gap-2"><h4 className="font-semibold text-foreground">{crm.name}</h4>
                            <Badge variant={isConnected ? "default" : "secondary"} className="text-xs">{isConnected ? "Connesso" : "Non connesso"}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-0.5">{crm.desc}</p>
                          {isConnected && integration?.last_sync_at && <p className="text-xs text-muted-foreground mt-1">Ultimo sync: {format(new Date(integration.last_sync_at), "dd/MM/yyyy HH:mm", { locale: it })}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {isConnected ? (
                          <>
                            <Button size="sm" variant="outline" onClick={() => syncCrmContacts(crm.id)} disabled={crmSyncing === crm.id}>
                              {crmSyncing === crm.id ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Download className="h-4 w-4 mr-1" />}Sync
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => disconnectCrm(crm.id)} className="text-destructive"><Unlink className="h-4 w-4 mr-1" /> Disconnetti</Button>
                          </>
                        ) : (
                          <Button size="sm" onClick={() => { setCrmConfigOpen(crm.id); setCrmApiKey(""); setCrmInstanceUrl(""); setCrmShowKey(false); }}>
                            <Link2 className="h-4 w-4 mr-1" /> Connetti
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* CRM Config Dialog */}
            <Dialog open={!!crmConfigOpen} onOpenChange={open => { if (!open) setCrmConfigOpen(null); }}>
              <DialogContent><DialogHeader><DialogTitle className="flex items-center gap-2"><span className="text-xl">{CRM_PROVIDERS.find(p => p.id === crmConfigOpen)?.icon}</span>Configura {CRM_PROVIDERS.find(p => p.id === crmConfigOpen)?.name}</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  {CRM_PROVIDERS.find(p => p.id === crmConfigOpen)?.fields.map(field => (
                    <div key={field.key} className="space-y-2"><Label>{field.label}</Label>
                      {field.key === "api_key" ? (
                        <div className="relative"><Input type={crmShowKey ? "text" : "password"} value={crmApiKey} onChange={e => setCrmApiKey(e.target.value)} placeholder={field.placeholder} className="pr-10" />
                          <button type="button" onClick={() => setCrmShowKey(!crmShowKey)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">{crmShowKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
                        </div>
                      ) : <Input value={crmInstanceUrl} onChange={e => setCrmInstanceUrl(e.target.value)} placeholder={field.placeholder} />}
                    </div>
                  ))}
                  <Separator />
                  <div className="flex gap-3">
                    <Button onClick={() => crmConfigOpen && testCrmConnection(crmConfigOpen)} disabled={!crmApiKey || crmTesting === crmConfigOpen} variant="outline">
                      {crmTesting === crmConfigOpen ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}Testa
                    </Button>
                    <Button onClick={() => crmConfigOpen && saveCrmIntegration(crmConfigOpen)} disabled={!crmApiKey || crmSaving} className="flex-1">
                      {crmSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}Salva e Connetti
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}

        {activeTab === 'webhooks' && (
          <div className="space-y-4 max-w-2xl">
            <div className="flex items-center justify-between">
              <div><h2 className="text-lg font-semibold text-foreground">Webhooks</h2><p className="text-sm text-muted-foreground">Ricevi notifiche in tempo reale su endpoint esterni</p></div>
              <Button onClick={() => setShowCreateWh(true)}><Plus className="h-4 w-4 mr-2" /> Nuovo webhook</Button>
            </div>
            {loadingWebhooks ? <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
            : webhooks.length === 0 ? (
              <Card><CardContent className="p-8 text-center"><Globe className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" /><p className="text-muted-foreground">Nessun webhook configurato</p></CardContent></Card>
            ) : (
              <div className="space-y-3">
                {webhooks.map(wh => (
                  <Card key={wh.id}><CardContent className="p-4 flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1"><code className="text-sm font-mono text-foreground truncate block">{wh.url}</code><Badge variant={wh.is_active ? "default" : "secondary"} className="text-xs shrink-0">{wh.is_active ? "Attivo" : "Disattivo"}</Badge></div>
                      <div className="flex flex-wrap gap-1 mt-2">{wh.events.map(ev => <Badge key={ev} variant="outline" className="text-xs">{EVENT_TYPES.find(e => e.value === ev)?.label || ev}</Badge>)}</div>
                      {wh.secret && <p className="text-xs text-muted-foreground mt-1">🔐 Firma HMAC attiva</p>}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Switch checked={wh.is_active} onCheckedChange={v => toggleWebhook(wh.id, v)} />
                      <Button variant="ghost" size="icon" onClick={() => testWebhook(wh)} disabled={testingWh === wh.id}>{testingWh === wh.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}</Button>
                      <Button variant="ghost" size="icon" onClick={() => openLogs(wh.id)}><History className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteWebhook(wh.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </CardContent></Card>
                ))}
              </div>
            )}
            {/* Create Webhook Dialog */}
            <Dialog open={showCreateWh} onOpenChange={setShowCreateWh}><DialogContent><DialogHeader><DialogTitle>Nuovo Webhook</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2"><Label>URL Endpoint</Label><Input value={whForm.url} onChange={e => setWhForm(p => ({ ...p, url: e.target.value }))} placeholder="https://example.com/webhook" /></div>
                <div className="space-y-2"><Label>Secret (opzionale)</Label><Input value={whForm.secret} onChange={e => setWhForm(p => ({ ...p, secret: e.target.value }))} placeholder="Chiave segreta per firma HMAC" /><p className="text-xs text-muted-foreground">Se fornito, ogni richiesta includerà X-Webhook-Signature.</p></div>
                <div className="space-y-2"><Label>Eventi</Label><div className="space-y-2">{EVENT_TYPES.map(ev => <label key={ev.value} className="flex items-center gap-2 cursor-pointer"><Checkbox checked={whForm.events.includes(ev.value)} onCheckedChange={() => toggleEvent(ev.value)} /><span className="text-sm">{ev.label}</span><span className="text-xs text-muted-foreground font-mono">{ev.value}</span></label>)}</div></div>
                <Button onClick={createWebhook} disabled={savingWh || !whForm.url || whForm.events.length === 0} className="w-full">{savingWh ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}Crea Webhook</Button>
              </div>
            </DialogContent></Dialog>
            {/* Logs Dialog */}
            <Dialog open={!!showLogs} onOpenChange={() => setShowLogs(null)}><DialogContent className="max-w-lg"><DialogHeader><DialogTitle>Log Consegne</DialogTitle></DialogHeader>
              {loadingLogs ? <div className="flex justify-center py-6"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
              : whLogs.length === 0 ? <p className="text-center text-muted-foreground py-6">Nessun log</p>
              : <div className="max-h-80 overflow-y-auto space-y-2">{whLogs.map(log => <div key={log.id} className="flex items-center justify-between text-sm border-b border-border pb-2"><div className="flex items-center gap-2"><span className={`w-2 h-2 rounded-full ${log.success ? "bg-green-500" : "bg-red-500"}`} /><span className="font-mono text-xs text-muted-foreground">{log.event_type}</span></div><div className="flex items-center gap-3 text-muted-foreground text-xs">{log.status_code && <span>HTTP {log.status_code}</span>}<span>{format(new Date(log.created_at), "dd/MM HH:mm", { locale: it })}</span></div></div>)}</div>}
            </DialogContent></Dialog>
          </div>
        )}

        {activeTab === 'notifiche' && (
          <div className="space-y-5 max-w-lg">
            <div><h2 className="text-lg font-semibold text-foreground">Preferenze notifiche</h2></div>
            <Card><CardContent className="p-6 space-y-5">
              {([
                { key: "new_conversation" as const, label: "Nuova conversazione", desc: "Ricevi una notifica per ogni nuova conversazione" },
                { key: "daily_report" as const, label: "Report giornaliero", desc: "Riepilogo quotidiano via email" },
                { key: "weekly_report" as const, label: "Report settimanale", desc: "Riepilogo settimanale via email" },
              ]).map(item => (
                <div key={item.key} className="flex items-center justify-between">
                  <div><p className="text-sm font-medium text-foreground">{item.label}</p><p className="text-xs text-muted-foreground">{item.desc}</p></div>
                  <Switch checked={notif[item.key]} onCheckedChange={v => setNotif(prev => ({ ...prev, [item.key]: v }))} />
                </div>
              ))}
              <Button onClick={saveNotif} disabled={savingNotif}>{savingNotif ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}Salva preferenze</Button>
            </CardContent></Card>
          </div>
        )}

        {activeTab === 'fatturazione' && <BillingTabContent companyId={companyId} navigate={navigate} />}
      </main>
    </div>
  );
}
