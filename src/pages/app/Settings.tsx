import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useCompanyId } from "@/hooks/useCompanyId";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Save, Loader2, CreditCard, Building2, Users, Shield, Bell, Key, Globe, ChevronRight,
} from "lucide-react";
import { useSearchParams, useNavigate } from "react-router-dom";
import type { Json } from "@/integrations/supabase/types";
import type { LucideIcon } from "lucide-react";
import { TabProfilo } from "@/components/impostazioni/TabProfilo";
import { TabPiano } from "@/components/impostazioni/TabPiano";
import { TabUtenti } from "@/components/impostazioni/TabUtenti";
import { TabApi } from "@/components/impostazioni/TabApi";
import { TabWebhooks } from "@/components/impostazioni/TabWebhooks";

// ─── Types ───
interface NotifSettings { new_conversation: boolean; daily_report: boolean; weekly_report: boolean; }

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
  const { data: company } = useQuery({
    queryKey: ["billing-company", companyId],
    queryFn: async () => {
      const { data } = await supabase.from("companies").select("name, plan, created_at").eq("id", companyId!).single();
      return data as { name: string; plan: string | null; created_at: string } | null;
    },
    enabled: !!companyId, staleTime: 5 * 60 * 1000,
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
  const planLabel = company?.plan || "Free";
  const planBadgeVariant = planLabel.toLowerCase().includes("pro") ? "default" : planLabel.toLowerCase().includes("enterprise") ? "default" : "secondary";

  return (
    <div className="space-y-6 max-w-lg">
      <div><h2 className="text-lg font-semibold text-foreground">Fatturazione</h2><p className="text-sm text-muted-foreground">Gestisci il tuo piano, crediti e pagamenti</p></div>
      <Card><CardContent className="p-6 space-y-3">
        <div className="flex items-center justify-between">
          <div><p className="text-sm text-muted-foreground">Piano corrente</p><p className="text-xl font-bold text-foreground">{planLabel}</p></div>
          <Badge variant={planBadgeVariant as any} className="text-sm px-3 py-1">{planLabel.toLowerCase().includes("pro") ? "Attivo" : planLabel.toLowerCase().includes("enterprise") ? "Attivo" : "Base"}</Badge>
        </div>
        {company?.created_at && <p className="text-xs text-muted-foreground">Membro dal {new Date(company.created_at).toLocaleDateString("it-IT")}</p>}
      </CardContent></Card>
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
  const { profile } = useAuth();
  const companyId = useCompanyId();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const activeTab = (searchParams.get("tab") as TabId) || "profilo";
  const setTab = (tab: TabId) => setSearchParams({ tab });
  const currentTab = TABS.find(t => t.id === activeTab)!;

  const [loading, setLoading] = useState(true);
  const [savingNotif, setSavingNotif] = useState(false);
  const [notif, setNotif] = useState<NotifSettings>({ new_conversation: true, daily_report: false, weekly_report: true });

  useEffect(() => {
    if (!profile) return;
    if (companyId) {
      supabase.from("companies").select("settings").eq("id", companyId).single().then(compRes => {
        if (compRes.data) {
          const s = (compRes.data.settings as Record<string, unknown>) || {};
          setNotif({ new_conversation: s.new_conversation !== false, daily_report: !!s.daily_report, weekly_report: s.weekly_report !== false });
        }
        setLoading(false);
      });
    } else { setLoading(false); }
  }, [profile, companyId]);

  const saveNotif = async () => {
    if (!companyId) return;
    setSavingNotif(true);
    const { error } = await supabase.from("companies").update({ settings: JSON.parse(JSON.stringify(notif)) as Json }).eq("id", companyId);
    setSavingNotif(false);
    toast(error ? { title: "Errore", description: error.message, variant: "destructive" } : { title: "Preferenze salvate" });
  };

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
                <div className="flex-1 min-w-0">
                  <span className="block">{tab.label}</span>
                  {isActive && <span className="block text-xs opacity-80 mt-0.5 font-normal">{tab.desc}</span>}
                </div>
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
        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-6 md:hidden">
          <span>Impostazioni</span><ChevronRight className="w-3 h-3" /><span className="text-foreground font-medium">{currentTab.label}</span>
        </div>

        {activeTab === 'profilo' && <TabProfilo />}
        {activeTab === 'piano' && <TabPiano />}
        {activeTab === 'utenti' && <TabUtenti />}
        {activeTab === 'api' && <TabApi />}
        {activeTab === 'webhooks' && <TabWebhooks />}

        {activeTab === 'notifiche' && (
          <div className="space-y-5 max-w-lg">
            <div><h2 className="text-lg font-semibold text-foreground">Preferenze notifiche</h2><p className="text-sm text-muted-foreground">Configura quando e come ricevere aggiornamenti</p></div>
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
