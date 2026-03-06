import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Eye, EyeOff, Save, Loader2, CheckCircle2, XCircle } from "lucide-react";
import type { Json } from "@/integrations/supabase/types";

interface NotifSettings {
  new_conversation: boolean;
  daily_report: boolean;
  weekly_report: boolean;
}

export default function Settings() {
  const { profile, user } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingApi, setSavingApi] = useState(false);
  const [savingNotif, setSavingNotif] = useState(false);
  const [testing, setTesting] = useState(false);

  // Profile
  const [fullName, setFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  // API
  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);

  // Notifications
  const [notif, setNotif] = useState<NotifSettings>({ new_conversation: true, daily_report: false, weekly_report: true });

  useEffect(() => {
    if (!profile) return;
    setFullName(profile.full_name || "");
    setAvatarUrl(profile.avatar_url || "");

    if (profile.company_id) {
      supabase.from("companies").select("elevenlabs_api_key, settings").eq("id", profile.company_id).single().then(({ data }) => {
        if (data) {
          setApiKey(data.elevenlabs_api_key || "");
          const s = (data.settings as Record<string, unknown>) || {};
          setNotif({
            new_conversation: s.new_conversation !== false,
            daily_report: !!s.daily_report,
            weekly_report: s.weekly_report !== false,
          });
        }
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [profile]);

  const saveProfile = async () => {
    if (!user) return;
    setSavingProfile(true);
    const { error } = await supabase.from("profiles").update({ full_name: fullName, avatar_url: avatarUrl || null }).eq("id", user.id);
    setSavingProfile(false);
    toast(error ? { title: "Errore", description: error.message, variant: "destructive" } : { title: "Profilo aggiornato" });
  };

  const saveApiKey = async () => {
    if (!profile?.company_id) return;
    setSavingApi(true);
    const { error } = await supabase.from("companies").update({ elevenlabs_api_key: apiKey || null }).eq("id", profile.company_id);
    setSavingApi(false);
    toast(error ? { title: "Errore", description: error.message, variant: "destructive" } : { title: "API Key aggiornata" });
  };

  const testConnection = async () => {
    if (!profile?.company_id) return;
    setTesting(true);
    try {
      const { data, error } = await supabase.functions.invoke("get-elevenlabs-voices", {
        body: { company_id: profile.company_id },
      });
      if (error) throw error;
      toast({ title: "Connessione riuscita", description: `${data?.voices?.length || 0} voci trovate.` });
    } catch (err: any) {
      toast({ title: "Connessione fallita", description: err.message || "Errore sconosciuto", variant: "destructive" });
    }
    setTesting(false);
  };

  const saveNotif = async () => {
    if (!profile?.company_id) return;
    setSavingNotif(true);
    const { error } = await supabase.from("companies").update({ settings: notif as unknown as Json }).eq("id", profile.company_id);
    setSavingNotif(false);
    toast(error ? { title: "Errore", description: error.message, variant: "destructive" } : { title: "Preferenze salvate" });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--app-accent))]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[hsl(var(--app-text-primary))]">Impostazioni</h1>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="bg-[hsl(var(--app-elevated))] border border-[hsl(var(--app-border))]">
          <TabsTrigger value="profile" className="data-[state=active]:bg-[hsl(var(--app-secondary))] data-[state=active]:text-[hsl(var(--app-text-primary))] text-[hsl(var(--app-text-secondary))]">Profilo</TabsTrigger>
          <TabsTrigger value="api" className="data-[state=active]:bg-[hsl(var(--app-secondary))] data-[state=active]:text-[hsl(var(--app-text-primary))] text-[hsl(var(--app-text-secondary))]">API & Integrazioni</TabsTrigger>
          <TabsTrigger value="notif" className="data-[state=active]:bg-[hsl(var(--app-secondary))] data-[state=active]:text-[hsl(var(--app-text-primary))] text-[hsl(var(--app-text-secondary))]">Notifiche</TabsTrigger>
        </TabsList>

        {/* Profile */}
        <TabsContent value="profile">
          <div className="rounded-xl border border-[hsl(var(--app-border))] bg-[hsl(var(--app-secondary))] p-6 space-y-4 max-w-lg">
            <h3 className="text-lg font-semibold text-[hsl(var(--app-text-primary))]">Profilo utente</h3>
            <div className="space-y-2">
              <Label className="text-[hsl(var(--app-text-secondary))]">Email</Label>
              <Input value={profile?.email || ""} disabled className="bg-[hsl(var(--app-elevated))] border-[hsl(var(--app-border))] text-[hsl(var(--app-text-secondary))] opacity-60" />
            </div>
            <div className="space-y-2">
              <Label className="text-[hsl(var(--app-text-secondary))]">Nome completo</Label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} className="bg-[hsl(var(--app-elevated))] border-[hsl(var(--app-border))] text-[hsl(var(--app-text-primary))]" />
            </div>
            <div className="space-y-2">
              <Label className="text-[hsl(var(--app-text-secondary))]">Avatar URL</Label>
              <Input value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="https://..." className="bg-[hsl(var(--app-elevated))] border-[hsl(var(--app-border))] text-[hsl(var(--app-text-primary))]" />
            </div>
            <Button onClick={saveProfile} disabled={savingProfile} className="bg-[hsl(var(--app-brand))] hover:bg-[hsl(var(--app-brand))]/90 text-white">
              {savingProfile ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Salva profilo
            </Button>
          </div>
        </TabsContent>

        {/* API */}
        <TabsContent value="api">
          <div className="rounded-xl border border-[hsl(var(--app-border))] bg-[hsl(var(--app-secondary))] p-6 space-y-4 max-w-lg">
            <h3 className="text-lg font-semibold text-[hsl(var(--app-text-primary))]">ElevenLabs API Key</h3>
            <p className="text-sm text-[hsl(var(--app-text-secondary))]">Inserisci la tua API key di ElevenLabs per abilitare le funzionalità vocali.</p>
            <div className="space-y-2">
              <Label className="text-[hsl(var(--app-text-secondary))]">API Key</Label>
              <div className="relative">
                <Input type={showApiKey ? "text" : "password"} value={apiKey} onChange={(e) => setApiKey(e.target.value)} className="bg-[hsl(var(--app-elevated))] border-[hsl(var(--app-border))] text-[hsl(var(--app-text-primary))] pr-10" />
                <button type="button" onClick={() => setShowApiKey(!showApiKey)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(var(--app-text-secondary))] hover:text-[hsl(var(--app-text-primary))]">
                  {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="flex gap-3">
              <Button onClick={saveApiKey} disabled={savingApi} className="bg-[hsl(var(--app-brand))] hover:bg-[hsl(var(--app-brand))]/90 text-white">
                {savingApi ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Salva
              </Button>
              <Button variant="outline" onClick={testConnection} disabled={testing} className="border-[hsl(var(--app-border))] text-[hsl(var(--app-text-primary))] hover:bg-[hsl(var(--app-elevated))]">
                {testing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                Testa connessione
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notif">
          <div className="rounded-xl border border-[hsl(var(--app-border))] bg-[hsl(var(--app-secondary))] p-6 space-y-5 max-w-lg">
            <h3 className="text-lg font-semibold text-[hsl(var(--app-text-primary))]">Preferenze notifiche</h3>
            {([
              { key: "new_conversation" as const, label: "Nuova conversazione", desc: "Ricevi una notifica per ogni nuova conversazione" },
              { key: "daily_report" as const, label: "Report giornaliero", desc: "Riepilogo quotidiano via email" },
              { key: "weekly_report" as const, label: "Report settimanale", desc: "Riepilogo settimanale via email" },
            ]).map((item) => (
              <div key={item.key} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[hsl(var(--app-text-primary))]">{item.label}</p>
                  <p className="text-xs text-[hsl(var(--app-text-secondary))]">{item.desc}</p>
                </div>
                <Switch checked={notif[item.key]} onCheckedChange={(v) => setNotif((prev) => ({ ...prev, [item.key]: v }))} />
              </div>
            ))}
            <Button onClick={saveNotif} disabled={savingNotif} className="bg-[hsl(var(--app-brand))] hover:bg-[hsl(var(--app-brand))]/90 text-white">
              {savingNotif ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Salva preferenze
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
