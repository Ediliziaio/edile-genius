import { useState, useEffect, useCallback, useRef } from "react";
import { useCompanyId } from "@/hooks/useCompanyId";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  MessageSquare, Phone, Plus, ExternalLink, Trash2, Star,
  CheckCircle2, AlertTriangle, Clock, Zap, Bot, Megaphone, Loader2,
  BarChart3, Send, Settings, Shield, Wifi, WifiOff,
  Users, MessageCircle, Radio, ArrowRight, RefreshCw, Hash, Globe
} from "lucide-react";

// ── Types ──
interface WaSubscription {
  id: string;
  status: string;
  plan: string;
  price_monthly: number;
  expires_at: string | null;
  activated_at: string | null;
}

interface WaNumber {
  id: string;
  phone_number_id: string;
  display_phone_number: string;
  display_name: string;
  status: string;
  quality_rating: string;
  name_status: string;
  is_default: boolean;
  messaging_limit_tier: string | null;
  waba_id: string;
  webhook_verified: boolean;
}

interface WaTemplate {
  id: string;
  name: string;
  category: string;
  language: string;
  status: string;
  components: any[];
}

interface WaConversation {
  id: string;
  contact_phone: string;
  contact_id: string | null;
  status: string;
  unread_count: number;
  last_message_at: string | null;
  ai_enabled: boolean;
  window_expires_at: string | null;
  phone_number_id: string;
}

interface WaMessage {
  id: string;
  direction: string;
  type: string;
  content: any;
  status: string;
  created_at: string;
  sent_at: string | null;
}

interface WabaConfig {
  id: string;
  waba_id: string;
  business_name: string | null;
  meta_verification_status: string;
  access_token_encrypted: string | null;
  meta_verified: boolean;
  token_refreshed_at: string | null;
  token_refresh_error: string | null;
}

const qualityColors: Record<string, string> = {
  GREEN: "text-green-600 bg-green-50 border-green-200",
  YELLOW: "text-yellow-600 bg-yellow-50 border-yellow-200",
  RED: "text-destructive bg-destructive/10 border-destructive/20",
  UNKNOWN: "text-muted-foreground bg-muted border-border",
};

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  CONNECTED: { label: "Collegato", variant: "default" },
  PENDING: { label: "In attesa", variant: "secondary" },
  FLAGGED: { label: "Segnalato", variant: "destructive" },
  BANNED: { label: "Bannato", variant: "destructive" },
  APPROVED: { label: "Approvato", variant: "default" },
  REJECTED: { label: "Rifiutato", variant: "destructive" },
  PAUSED: { label: "In pausa", variant: "secondary" },
  active: { label: "Attivo", variant: "default" },
  inactive: { label: "Inattivo", variant: "secondary" },
  open: { label: "Aperta", variant: "default" },
  resolved: { label: "Risolta", variant: "secondary" },
  pending: { label: "In attesa", variant: "outline" },
};

// ── Subscription Gate ──
function SubscriptionGate({ price, onActivate, loading }: { price: number; onActivate: () => void; loading: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center gap-6">
      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center shadow-lg">
        <MessageSquare className="h-10 w-10 text-white" />
      </div>
      <div>
        <h2 className="text-xl font-bold text-foreground mb-2">WhatsApp Business non attivo</h2>
        <p className="text-sm text-muted-foreground max-w-md">
          Attiva il modulo WhatsApp per collegare il tuo numero, gestire conversazioni,
          inviare template e automatizzare la comunicazione con i tuoi clienti.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3 max-w-md w-full">
        {[
          { icon: "📱", label: "Più numeri collegati" },
          { icon: "🤖", label: "AI risposte automatiche" },
          { icon: "📢", label: "Broadcast & template" },
          { icon: "⚡", label: "Automazioni integrate" },
        ].map((f) => (
          <div key={f.label} className="bg-muted/50 border border-border rounded-lg p-3 flex items-center gap-2 text-sm text-foreground font-medium">
            <span className="text-lg">{f.icon}</span>{f.label}
          </div>
        ))}
      </div>
      <div className="flex flex-col items-center gap-2">
        <Button onClick={onActivate} disabled={loading} className="bg-green-600 hover:bg-green-700 text-white">
          {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          Attiva WhatsApp — €{price.toFixed(2)}/mese
        </Button>
        <span className="text-xs text-muted-foreground">Puoi disattivare in qualsiasi momento</span>
      </div>
    </div>
  );
}

// ── Facebook SDK loader ──
function loadFacebookSDK(appId: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if ((window as any).FB) { resolve(); return; }
    (window as any).fbAsyncInit = function () {
      (window as any).FB.init({ appId, cookie: true, xfbml: false, version: "v21.0" });
      resolve();
    };
    if (document.getElementById("facebook-jssdk")) { resolve(); return; }
    const script = document.createElement("script");
    script.id = "facebook-jssdk";
    script.src = "https://connect.facebook.net/en_US/sdk.js";
    script.async = true;
    script.defer = true;
    script.onerror = () => reject(new Error("Failed to load Facebook SDK"));
    document.head.appendChild(script);
  });
}

// ── Connect Number Dialog (Meta Embedded Signup) ──
function ConnectNumberDialog({ open, onOpenChange, companyId, onConnected }: {
  open: boolean; onOpenChange: (o: boolean) => void; companyId: string; onConnected: () => void;
}) {
  const [step, setStep] = useState<"idle" | "loading-sdk" | "waiting-popup" | "connecting" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [connectedInfo, setConnectedInfo] = useState<{ phone: string; waba_id: string } | null>(null);

  const startEmbeddedSignup = async () => {
    setStep("loading-sdk");
    setErrorMsg("");

    try {
      // 1. Get meta_app_id + optional config_id from edge function
      const { data: appData, error: appErr } = await supabase.functions.invoke("whatsapp-get-app-id");
      if (appErr || !appData?.meta_app_id) {
        throw new Error(appData?.error || "Impossibile ottenere la configurazione Meta. Contatta l'amministratore.");
      }

      // 2. Load Facebook SDK
      await loadFacebookSDK(appData.meta_app_id);
      setStep("waiting-popup");

      // 3. Build login options — use config_id if set by SuperAdmin
      const loginOptions: any = {
        response_type: "code",
        override_default_response_type: true,
        extras: {
          feature: "whatsapp_embedded_signup",
          sessionInfoVersion: 2,
          setup: {},
        },
      };
      if (appData.meta_config_id) {
        loginOptions.config_id = appData.meta_config_id;
      }

      // 4. Launch FB.login with Embedded Signup
      const FB = (window as any).FB;
      FB.login(
        (response: any) => {
          if (response.status === "connected" && response.authResponse?.accessToken) {
            handleFBCallback(response.authResponse.accessToken);
          } else {
            setStep("idle");
            toast.error("Autenticazione Facebook annullata");
          }
        },
        loginOptions
      );
    } catch (err: any) {
      setErrorMsg(err.message || "Errore sconosciuto");
      setStep("error");
    }
  };

  // Listen for the embedded signup event to get WABA ID and phone number ID
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== "https://www.facebook.com" && event.origin !== "https://web.facebook.com") return;
      try {
        const data = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
        if (data.type === "WA_EMBEDDED_SIGNUP") {
          // Store for use in handleFBCallback
          (window as any).__wa_embedded_data = data.data;
        }
      } catch { /* ignore non-JSON messages */ }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const handleFBCallback = async (accessToken: string) => {
    setStep("connecting");

    // Try to get WABA ID and phone number from embedded signup event data
    const embeddedData = (window as any).__wa_embedded_data;
    let wabaId = embeddedData?.waba_id || "";
    let phoneNumberId = embeddedData?.phone_number_id || "";

    // If embedded data isn't available, try to get from the shared businesses endpoint
    if (!wabaId) {
      try {
        const res = await fetch(
          `https://graph.facebook.com/v21.0/debug_token?input_token=${accessToken}&access_token=${accessToken}`
        );
        const tokenInfo = await res.json();
        // The granular scopes contain WABA info
        const scopes = tokenInfo?.data?.granular_scopes || [];
        const waScope = scopes.find((s: any) => s.scope === "whatsapp_business_management");
        if (waScope?.target_ids?.length > 0) {
          wabaId = waScope.target_ids[0];
        }
      } catch { /* continue without */ }
    }

    if (!wabaId) {
      setErrorMsg("Non è stato possibile ottenere il WABA ID dal flusso Facebook. Riprova.");
      setStep("error");
      return;
    }

    // If we don't have phone_number_id, fetch it from WABA
    if (!phoneNumberId) {
      try {
        const res = await fetch(
          `https://graph.facebook.com/v21.0/${wabaId}/phone_numbers?access_token=${accessToken}`
        );
        const phoneData = await res.json();
        if (phoneData?.data?.length > 0) {
          phoneNumberId = phoneData.data[0].id;
        }
      } catch { /* continue without */ }
    }

    if (!phoneNumberId) {
      setErrorMsg("Non è stato possibile ottenere il Phone Number ID. Verifica di aver selezionato un numero nel popup.");
      setStep("error");
      return;
    }

    // 4. Send to whatsapp-connect-number
    try {
      const { data, error } = await supabase.functions.invoke("whatsapp-connect-number", {
        body: {
          company_id: companyId,
          user_access_token: accessToken,
          waba_id: wabaId,
          phone_number_id: phoneNumberId,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setConnectedInfo({
        phone: data?.display_phone_number || phoneNumberId,
        waba_id: wabaId,
      });
      setStep("done");
      onConnected();
      toast.success("Numero WhatsApp collegato con successo!");
    } catch (err: any) {
      setErrorMsg(err.message || "Errore durante il collegamento");
      setStep("error");
    }

    // Cleanup
    delete (window as any).__wa_embedded_data;
  };

  const handleClose = () => {
    setStep("idle");
    setErrorMsg("");
    setConnectedInfo(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center">
              <Phone className="h-4 w-4 text-white" />
            </div>
            Collega WhatsApp Business
          </DialogTitle>
          <DialogDescription>
            Collega il tuo account WhatsApp Business con un click tramite Facebook
          </DialogDescription>
        </DialogHeader>

        {step === "idle" && (
          <div className="space-y-4 py-4">
            <div className="bg-muted/50 border border-border rounded-lg p-4 space-y-3">
              <p className="text-sm text-foreground font-medium">Come funziona:</p>
              <div className="space-y-2">
                {[
                  "Si apre il popup di Facebook",
                  "Seleziona il tuo Business Manager",
                  "Scegli l'account WhatsApp e il numero",
                  "Tutto viene configurato automaticamente",
                ].map((text, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="w-5 h-5 rounded-full bg-green-100 text-green-700 text-xs font-bold flex items-center justify-center shrink-0">
                      {i + 1}
                    </div>
                    {text}
                  </div>
                ))}
              </div>
            </div>
            <Button
              onClick={startEmbeddedSignup}
              className="w-full h-12 bg-[#1877F2] hover:bg-[#166FE5] text-white font-semibold text-base"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              Collega con Facebook
            </Button>
          </div>
        )}

        {(step === "loading-sdk" || step === "waiting-popup") && (
          <div className="flex flex-col items-center py-10 gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-[#1877F2]" />
            <p className="text-sm text-muted-foreground">
              {step === "loading-sdk" ? "Caricamento Facebook SDK..." : "In attesa del popup Facebook..."}
            </p>
            <p className="text-xs text-muted-foreground">Se il popup non si apre, controlla il blocco popup del browser</p>
          </div>
        )}

        {step === "connecting" && (
          <div className="flex flex-col items-center py-10 gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-green-600" />
            <p className="text-sm text-muted-foreground">Registrazione numero e scambio token in corso...</p>
            <p className="text-xs text-muted-foreground">Il token viene cifrato con AES-256 prima del salvataggio</p>
          </div>
        )}

        {step === "done" && (
          <div className="flex flex-col items-center py-8 gap-4">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <div className="text-center">
              <p className="text-base font-semibold text-foreground">Collegamento completato!</p>
              {connectedInfo && (
                <div className="mt-2 space-y-1">
                  <p className="text-sm text-muted-foreground">
                    Numero: <span className="font-mono font-medium text-foreground">{connectedInfo.phone}</span>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    WABA: <span className="font-mono text-xs text-foreground">{connectedInfo.waba_id}</span>
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {step === "error" && (
          <div className="flex flex-col items-center py-8 gap-4">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-destructive">Errore di collegamento</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm">{errorMsg}</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setStep("idle")}>Riprova</Button>
          </div>
        )}

        <DialogFooter>
          {step === "done" && <Button onClick={handleClose}>Chiudi</Button>}
          {step === "idle" && <Button variant="ghost" onClick={handleClose}>Annulla</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Template Editor Dialog ──
function TemplateEditorDialog({ open, onOpenChange, companyId, onSaved }: {
  open: boolean; onOpenChange: (o: boolean) => void; companyId: string; onSaved: () => void;
}) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("MARKETING");
  const [language, setLanguage] = useState("it");
  const [header, setHeader] = useState("");
  const [body, setBody] = useState("");
  const [footer, setFooter] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name || !body) { toast.error("Nome e corpo obbligatori"); return; }
    setSaving(true);
    const { error } = await supabase.from("whatsapp_templates").insert({
      company_id: companyId,
      name: name.toLowerCase().replace(/[^a-z0-9_]/g, "_"),
      category, language, status: "PENDING",
      components: [
        ...(header ? [{ type: "HEADER", format: "TEXT", text: header }] : []),
        { type: "BODY", text: body },
        ...(footer ? [{ type: "FOOTER", text: footer }] : []),
      ],
    });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Template inviato a Meta per approvazione");
    onSaved(); onOpenChange(false);
    setName(""); setBody(""); setHeader(""); setFooter("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader><DialogTitle>Crea Modello Messaggio</DialogTitle></DialogHeader>
        <div className="flex gap-6">
          <div className="flex-1 space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Nome Modello *</Label>
                <Input value={name} onChange={e => setName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "_"))} placeholder="nome_modello" className="text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Categoria *</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MARKETING">Marketing</SelectItem>
                    <SelectItem value="UTILITY">Utility</SelectItem>
                    <SelectItem value="AUTHENTICATION">Autenticazione</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Lingua *</Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="it">Italiano</SelectItem>
                    <SelectItem value="en">Inglese</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Intestazione (Opzionale)</Label>
              <Input value={header} onChange={e => setHeader(e.target.value)} placeholder="Testo intestazione..." className="text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Corpo *</Label>
              <Textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Ciao {{1}}, sono Flo di Marketing Edile..." maxLength={1024} className="text-sm min-h-[140px]" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Usa {"{{1}}"}, {"{{2}}"} per variabili</span>
                <span className={body.length > 900 ? "text-yellow-600" : ""}>{body.length}/1024</span>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Piè di pagina (Opzionale)</Label>
              <Input value={footer} onChange={e => setFooter(e.target.value)} placeholder="Reply STOP to unsubscribe" maxLength={60} className="text-sm" />
            </div>
          </div>
          <div className="w-64 shrink-0 bg-muted/30 rounded-lg p-4 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Anteprima</p>
            <div className="rounded-lg overflow-hidden shadow-sm">
              <div className="bg-[#e5ddd5] p-3 min-h-[160px]">
                <div className="bg-white rounded-r-lg rounded-bl-lg p-3 max-w-[90%] shadow-sm">
                  {header && <p className="text-xs font-bold text-foreground mb-1">{header}</p>}
                  {body ? (
                    <p className="text-xs text-foreground whitespace-pre-wrap leading-relaxed">
                      {body.replace(/\{\{(\d+)\}\}/g, (_, n) => `[var${n}]`)}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">Il testo apparirà qui...</p>
                  )}
                  {footer && <p className="text-[10px] text-muted-foreground mt-1">{footer}</p>}
                  <div className="flex justify-end mt-1"><span className="text-[10px] text-muted-foreground">11:48 ✓✓</span></div>
                </div>
              </div>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-2">
              <p className="text-[11px] text-yellow-800 leading-relaxed">Il modello sarà inviato a Meta per approvazione. I tempi medi sono 2-24 ore.</p>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annulla</Button>
          <Button onClick={handleSave} disabled={!name || !body || saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Crea e invia a Meta
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Tab Panoramica ──
function TabOverview({ numbers, templates, conversations, subscription, wabaConfig }: {
  numbers: WaNumber[]; templates: WaTemplate[]; conversations: WaConversation[]; subscription: WaSubscription | null; wabaConfig: WabaConfig | null;
}) {
  const connectedNumbers = numbers.filter(n => n.status === "CONNECTED").length;
  const approvedTemplates = templates.filter(t => t.status === "APPROVED").length;
  const openConversations = conversations.filter(c => c.status === "open").length;
  const totalUnread = conversations.reduce((s, c) => s + (c.unread_count || 0), 0);

  const stats = [
    { label: "Numeri collegati", value: connectedNumbers, icon: Phone, color: "text-green-600" },
    { label: "Template approvati", value: `${approvedTemplates}/${templates.length}`, icon: Megaphone, color: "text-blue-600" },
    { label: "Conversazioni aperte", value: openConversations, icon: MessageCircle, color: "text-purple-600" },
    { label: "Messaggi non letti", value: totalUnread, icon: MessageSquare, color: "text-orange-600" },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map(s => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg bg-muted flex items-center justify-center ${s.color}`}>
                  <s.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Abbonamento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Piano</span>
              <Badge variant="default" className="bg-green-600 text-white capitalize">{subscription?.plan || "standard"}</Badge>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Prezzo</span>
              <span className="font-semibold">€{subscription?.price_monthly?.toFixed(2) || "29.99"}/mese</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Attivato il</span>
              <span>{subscription?.activated_at ? new Date(subscription.activated_at).toLocaleDateString("it") : "—"}</span>
            </div>
            {subscription?.expires_at && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Scadenza</span>
                <span>{new Date(subscription.expires_at).toLocaleDateString("it")}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Numeri WhatsApp</CardTitle>
          </CardHeader>
          <CardContent>
            {numbers.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nessun numero collegato</p>
            ) : (
              <div className="space-y-2">
                {numbers.slice(0, 3).map(n => (
                  <div key={n.id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 text-green-600" />
                      <span className="font-mono text-xs">{n.display_phone_number}</span>
                      {n.is_default && <Badge variant="secondary" className="text-[9px] px-1.5 py-0">Default</Badge>}
                    </div>
                    <Badge variant={statusConfig[n.status]?.variant || "outline"} className="text-[10px]">
                      {statusConfig[n.status]?.label || n.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Token expiry indicator */}
        {wabaConfig?.access_token_encrypted && (
          <Card className="md:col-span-2">
            <CardContent className="p-4">
              {(() => {
                const TOKEN_LIFETIME_DAYS = 60;
                const REFRESH_INTERVAL_DAYS = 30;
                const refreshedAt = wabaConfig.token_refreshed_at ? new Date(wabaConfig.token_refreshed_at) : null;
                const now = new Date();
                
                let daysRemaining: number | null = null;
                let nextRefreshIn: number | null = null;
                
                if (refreshedAt) {
                  const expiresAt = new Date(refreshedAt.getTime() + TOKEN_LIFETIME_DAYS * 24 * 60 * 60 * 1000);
                  daysRemaining = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                  const nextRefresh = new Date(refreshedAt.getTime() + REFRESH_INTERVAL_DAYS * 24 * 60 * 60 * 1000);
                  nextRefreshIn = Math.ceil((nextRefresh.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                }

                const hasError = !!wabaConfig.token_refresh_error;
                const isExpiring = daysRemaining !== null && daysRemaining <= 14;
                const isExpired = daysRemaining !== null && daysRemaining <= 0;

                const barColor = isExpired || hasError
                  ? "bg-destructive"
                  : isExpiring
                    ? "bg-yellow-500"
                    : "bg-green-500";
                const barWidth = daysRemaining !== null
                  ? Math.max(0, Math.min(100, (daysRemaining / TOKEN_LIFETIME_DAYS) * 100))
                  : 0;

                return (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Shield className={`h-4 w-4 ${isExpired || hasError ? "text-destructive" : isExpiring ? "text-yellow-600" : "text-green-600"}`} />
                        <span className="text-sm font-semibold text-foreground">Token Meta API</span>
                      </div>
                      {daysRemaining !== null ? (
                        <Badge variant={isExpired ? "destructive" : isExpiring ? "secondary" : "default"} className={isExpired ? "" : isExpiring ? "bg-yellow-100 text-yellow-800 border-yellow-200" : "bg-green-100 text-green-800 border-green-200"}>
                          {isExpired ? "Scaduto" : `${daysRemaining}g rimanenti`}
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Nessun refresh registrato</Badge>
                      )}
                    </div>

                    {daysRemaining !== null && (
                      <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${barWidth}%` }} />
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>
                        {refreshedAt
                          ? `Ultimo refresh: ${refreshedAt.toLocaleDateString("it")}`
                          : "Mai aggiornato"}
                      </span>
                      {nextRefreshIn !== null && nextRefreshIn > 0 && (
                        <span className="flex items-center gap-1">
                          <RefreshCw className="h-3 w-3" />
                          Prossimo refresh auto tra {nextRefreshIn}g
                        </span>
                      )}
                    </div>

                    {hasError && (
                      <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-2">
                        <p className="text-[11px] font-semibold text-destructive flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" /> Errore ultimo refresh
                        </p>
                        <p className="text-[10px] text-destructive/80 truncate">{wabaConfig.token_refresh_error}</p>
                      </div>
                    )}
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

// ── Tab Conversazioni ──
function TabConversations({ companyId, conversations, templates, onRefresh }: {
  companyId: string; conversations: WaConversation[]; templates: WaTemplate[]; onRefresh: () => void;
}) {
  const [selectedConv, setSelectedConv] = useState<WaConversation | null>(null);
  const [messages, setMessages] = useState<WaMessage[]>([]);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const approvedTemplates = templates.filter(t => t.status === "APPROVED");

  const loadMessages = useCallback(async (conv: WaConversation) => {
    setLoadingMsgs(true);
    const { data } = await supabase
      .from("whatsapp_messages")
      .select("*")
      .eq("conversation_id", conv.id)
      .order("created_at", { ascending: true })
      .limit(100);
    setMessages((data as any[]) || []);
    setLoadingMsgs(false);
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  }, []);

  useEffect(() => {
    if (selectedConv) loadMessages(selectedConv);
  }, [selectedConv, loadMessages]);

  // Realtime: new/updated messages for selected conversation
  useEffect(() => {
    if (!selectedConv?.id) return;
    const channel = supabase
      .channel(`wa-msgs-${selectedConv.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "whatsapp_messages", filter: `conversation_id=eq.${selectedConv.id}` },
        (payload) => {
          setMessages(prev => {
            if (prev.some(m => m.id === (payload.new as any).id)) return prev;
            return [...prev, payload.new as WaMessage];
          });
          setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "whatsapp_messages", filter: `conversation_id=eq.${selectedConv.id}` },
        (payload) => {
          setMessages(prev => prev.map(m => m.id === (payload.new as any).id ? { ...m, ...(payload.new as any) } : m));
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [selectedConv?.id]);

  // Realtime: conversation list updates
  useEffect(() => {
    if (!companyId) return;
    const channel = supabase
      .channel("wa-convs-list")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "whatsapp_conversations", filter: `company_id=eq.${companyId}` },
        () => { onRefresh(); }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [companyId, onRefresh]);

  const isWindowOpen = (conv: WaConversation) => {
    if (!conv.window_expires_at) return false;
    return new Date(conv.window_expires_at) > new Date();
  };

  const getWindowRemaining = (conv: WaConversation) => {
    if (!conv.window_expires_at) return null;
    const remaining = new Date(conv.window_expires_at).getTime() - Date.now();
    if (remaining <= 0) return null;
    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const mins = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${mins}m`;
  };

  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedConv) return;
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("whatsapp-send", {
        body: {
          phone_number_id: selectedConv.phone_number_id,
          to: selectedConv.contact_phone,
          type: "text",
          message: replyText,
        },
      });
      if (error) throw error;
      if (data?.error_code === "window_closed") {
        toast.error(data?.error || "Finestra 24h scaduta. Usa un template.");
        setSending(false);
        return;
      }
      toast.success("Messaggio inviato");
      setReplyText("");
      loadMessages(selectedConv);
    } catch (err: any) {
      const msg = err.message || "Errore sconosciuto";
      if (msg.includes("window_closed") || msg.includes("422")) {
        toast.error("Finestra 24h scaduta. Usa un template per riaprire.");
      } else {
        toast.error("Errore invio: " + msg);
      }
    }
    setSending(false);
  };

  const handleSendTemplate = async () => {
    if (!selectedTemplate || !selectedConv) return;
    const tpl = approvedTemplates.find(t => t.id === selectedTemplate);
    if (!tpl) return;
    setSending(true);
    try {
      const { error } = await supabase.functions.invoke("whatsapp-send", {
        body: {
          phone_number_id: selectedConv.phone_number_id,
          to: selectedConv.contact_phone,
          type: "template",
          template_name: tpl.name,
          template_language: tpl.language,
        },
      });
      if (error) throw error;
      toast.success("Template inviato");
      setSelectedTemplate("");
      loadMessages(selectedConv);
    } catch (err: any) {
      toast.error("Errore invio template: " + (err.message || "Errore"));
    }
    setSending(false);
  };

  const toggleAI = async (conv: WaConversation) => {
    await supabase.from("whatsapp_conversations").update({ ai_enabled: !conv.ai_enabled }).eq("id", conv.id);
    onRefresh();
  };

  const windowOpen = selectedConv ? isWindowOpen(selectedConv) : false;

  return (
    <div className="flex border border-border rounded-lg overflow-hidden h-[600px] bg-background">
      {/* Conversation List */}
      <div className="w-80 border-r border-border flex flex-col">
        <div className="p-3 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">Conversazioni</h3>
          <p className="text-xs text-muted-foreground">{conversations.length} totali</p>
        </div>
        <ScrollArea className="flex-1">
          {conversations.length === 0 ? (
            <div className="p-6 text-center">
              <MessageCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">Nessuna conversazione</p>
            </div>
          ) : (
            conversations.map(conv => {
              const wOpen = isWindowOpen(conv);
              const remaining = getWindowRemaining(conv);
              return (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConv(conv)}
                  className={`w-full text-left p-3 border-b border-border hover:bg-muted/50 transition-colors ${
                    selectedConv?.id === conv.id ? "bg-muted" : ""
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-xs font-semibold text-foreground truncate max-w-[160px]">
                      {conv.contact_phone}
                    </span>
                    <div className="flex items-center gap-1">
                      {conv.ai_enabled && (
                        <Badge variant="secondary" className="text-[9px] px-1 py-0 gap-0.5">
                          <Bot className="h-2.5 w-2.5" />AI
                        </Badge>
                      )}
                      {conv.unread_count > 0 && (
                        <span className="w-5 h-5 rounded-full bg-green-600 text-white text-[10px] font-bold flex items-center justify-center">
                          {conv.unread_count}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <Badge variant={statusConfig[conv.status]?.variant || "outline"} className="text-[9px]">
                      {statusConfig[conv.status]?.label || conv.status}
                    </Badge>
                    {conv.last_message_at && (
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(conv.last_message_at).toLocaleString("it", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "short" })}
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex items-center gap-1 text-[10px]">
                    <div className={`w-1.5 h-1.5 rounded-full ${wOpen ? "bg-green-500" : "bg-orange-400"}`} />
                    <span className={wOpen ? "text-green-600" : "text-orange-500"}>
                      {wOpen ? `Finestra aperta — ${remaining}` : "Finestra chiusa — solo template"}
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </ScrollArea>
      </div>

      {/* Chat View */}
      <div className="flex-1 flex flex-col">
        {!selectedConv ? (
          <div className="flex-1 flex items-center justify-center text-center p-8">
            <div>
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Seleziona una conversazione</p>
            </div>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="p-3 border-b border-border flex items-center justify-between bg-muted/30">
              <div>
                <p className="text-sm font-semibold text-foreground font-mono">{selectedConv.contact_phone}</p>
                <div className="flex items-center gap-2">
                  <Badge variant={statusConfig[selectedConv.status]?.variant || "outline"} className="text-[9px]">
                    {statusConfig[selectedConv.status]?.label || selectedConv.status}
                  </Badge>
                  {windowOpen ? (
                    <span className="text-[10px] text-green-600 flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                      24h aperta — {getWindowRemaining(selectedConv)}
                    </span>
                  ) : (
                    <span className="text-[10px] text-orange-500 flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                      Finestra chiusa
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-xs text-muted-foreground">AI</Label>
                <Switch checked={selectedConv.ai_enabled} onCheckedChange={() => toggleAI(selectedConv)} />
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              {loadingMsgs ? (
                <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
              ) : messages.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-xs text-muted-foreground">Nessun messaggio in questa conversazione</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {messages.map(msg => {
                    const isOutbound = msg.direction === "outbound";
                    const msgContent = typeof msg.content === "object"
                      ? (msg.content as any)?.body || (msg.content as any)?.template || (msg.content as any)?.caption || JSON.stringify(msg.content)
                      : String(msg.content);
                    return (
                      <div key={msg.id} className={`flex ${isOutbound ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[75%] rounded-lg px-3 py-2 ${
                          isOutbound
                            ? "bg-green-600 text-white rounded-br-sm"
                            : "bg-muted text-foreground rounded-bl-sm"
                        }`}>
                          {msg.type !== "text" && msg.type !== "template" && (
                            <span className={`text-[9px] uppercase font-semibold ${isOutbound ? "text-green-200" : "text-muted-foreground"}`}>
                              📎 {msg.type}
                            </span>
                          )}
                          <p className="text-xs whitespace-pre-wrap">{msgContent}</p>
                          <div className={`flex items-center gap-1 mt-1 ${isOutbound ? "justify-end" : "justify-start"}`}>
                            <span className={`text-[10px] ${isOutbound ? "text-green-200" : "text-muted-foreground"}`}>
                              {msg.created_at ? new Date(msg.created_at).toLocaleTimeString("it", { hour: "2-digit", minute: "2-digit" }) : ""}
                            </span>
                            {isOutbound && (
                              <span className="text-[10px] text-green-200">
                                {msg.status === "read" ? "✓✓" : msg.status === "delivered" ? "✓✓" : "✓"}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </ScrollArea>

            {/* Reply Input — adapts to window status */}
            <div className="p-3 border-t border-border">
              {windowOpen ? (
                <div className="flex gap-2">
                  <Input
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    placeholder="Scrivi un messaggio..."
                    className="text-sm"
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendReply(); } }}
                  />
                  <Button size="sm" onClick={handleSendReply} disabled={!replyText.trim() || sending} className="bg-green-600 hover:bg-green-700 text-white">
                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-orange-600 bg-orange-50 border border-orange-200 rounded-md px-3 py-2">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                    <span>Finestra 24h chiusa. Puoi inviare solo template approvati.</span>
                  </div>
                  <div className="flex gap-2">
                    <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                      <SelectTrigger className="text-sm flex-1"><SelectValue placeholder="Seleziona template..." /></SelectTrigger>
                      <SelectContent>
                        {approvedTemplates.length === 0 ? (
                          <SelectItem value="_none" disabled>Nessun template approvato</SelectItem>
                        ) : (
                          approvedTemplates.map(t => (
                            <SelectItem key={t.id} value={t.id}>{t.name} ({t.language})</SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <Button size="sm" onClick={handleSendTemplate} disabled={!selectedTemplate || sending} className="bg-green-600 hover:bg-green-700 text-white">
                      {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Tab Broadcast ──
function TabBroadcast({ companyId, templates, numbers }: {
  companyId: string; templates: WaTemplate[]; numbers: WaNumber[];
}) {
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [recipients, setRecipients] = useState("");
  const [sending, setSending] = useState(false);
  const [selectedNumber, setSelectedNumber] = useState("");

  const approvedTemplates = templates.filter(t => t.status === "APPROVED");

  const handleSend = async () => {
    if (!selectedTemplate || !recipients.trim() || !selectedNumber) {
      toast.error("Seleziona template, numero mittente e inserisci destinatari");
      return;
    }
    const tpl = approvedTemplates.find(t => t.id === selectedTemplate);
    if (!tpl) return;

    const phoneList = recipients.split("\n").map(p => p.trim()).filter(Boolean);
    if (phoneList.length === 0) { toast.error("Inserisci almeno un numero"); return; }

    setSending(true);
    let sent = 0;
    let failed = 0;

    for (const phone of phoneList) {
      try {
        const { error } = await supabase.functions.invoke("whatsapp-send", {
          body: {
            phone_number_id: selectedNumber,
            to: phone,
            type: "template",
            template_name: tpl.name,
            template_language: tpl.language,
          },
        });
        if (error) { failed++; } else { sent++; }
      } catch { failed++; }
    }

    setSending(false);
    toast.success(`Broadcast completato: ${sent} inviati, ${failed} falliti`);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Radio className="h-4 w-4 text-green-600" />
            Invio Broadcast
          </CardTitle>
          <CardDescription>Invia messaggi template a più destinatari</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Numero Mittente *</Label>
              <Select value={selectedNumber} onValueChange={setSelectedNumber}>
                <SelectTrigger><SelectValue placeholder="Seleziona numero" /></SelectTrigger>
                <SelectContent>
                  {numbers.filter(n => n.status === "CONNECTED").map(n => (
                    <SelectItem key={n.phone_number_id} value={n.phone_number_id}>
                      {n.display_name} ({n.display_phone_number})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Template Approvato *</Label>
              <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                <SelectTrigger><SelectValue placeholder="Seleziona template" /></SelectTrigger>
                <SelectContent>
                  {approvedTemplates.length === 0 ? (
                    <SelectItem value="_none" disabled>Nessun template approvato</SelectItem>
                  ) : (
                    approvedTemplates.map(t => (
                      <SelectItem key={t.id} value={t.id}>{t.name} ({t.language})</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Destinatari (uno per riga) *</Label>
            <Textarea
              value={recipients}
              onChange={e => setRecipients(e.target.value)}
              placeholder={"+39 350 000 0001\n+39 350 000 0002\n+39 350 000 0003"}
              className="min-h-[120px] font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              {recipients.split("\n").filter(l => l.trim()).length} destinatari inseriti
            </p>
          </div>

          {selectedTemplate && (() => {
            const tpl = approvedTemplates.find(t => t.id === selectedTemplate);
            if (!tpl) return null;
            const bodyComp = tpl.components?.find((c: any) => c.type === "BODY");
            return (
              <div className="bg-muted/30 rounded-lg p-4">
                <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase">Anteprima messaggio</p>
                <div className="bg-[#e5ddd5] rounded-lg p-3">
                  <div className="bg-white rounded-r-lg rounded-bl-lg p-3 max-w-[80%] shadow-sm">
                    <p className="text-xs text-foreground whitespace-pre-wrap">{bodyComp?.text || tpl.name}</p>
                    <div className="flex justify-end mt-1"><span className="text-[10px] text-muted-foreground">adesso ✓</span></div>
                  </div>
                </div>
              </div>
            );
          })()}

          <Button
            onClick={handleSend}
            disabled={!selectedTemplate || !recipients.trim() || !selectedNumber || sending}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
            Invia Broadcast
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Tab Impostazioni ──
function TabSettings({ companyId, subscription, wabaConfig, numbers, onRefresh, onDeactivate, onReconnect }: {
  companyId: string;
  subscription: WaSubscription | null;
  wabaConfig: WabaConfig | null;
  numbers: WaNumber[];
  onRefresh: () => void;
  onDeactivate: () => void;
  onReconnect: () => void;
}) {
  return (
    <div className="space-y-4">
      {/* WABA Config — Read Only */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4 text-blue-600" />
            Account WhatsApp Business
          </CardTitle>
          <CardDescription>Collegato tramite Meta Embedded Signup</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {wabaConfig ? (
            <>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">WABA ID</p>
                  <p className="text-sm font-mono font-medium text-foreground">{wabaConfig.waba_id}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Nome Business</p>
                  <p className="text-sm font-medium text-foreground">{wabaConfig.business_name || "—"}</p>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Verifica Meta</p>
                  <Badge variant={wabaConfig.meta_verified ? "default" : "secondary"}>
                    {wabaConfig.meta_verification_status === "verified" ? "✓ Verificato" :
                     wabaConfig.meta_verification_status === "in_progress" ? "In corso" :
                     wabaConfig.meta_verification_status === "rejected" ? "Rifiutato" : "Non avviata"}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Token</p>
                  <div className="flex items-center gap-2">
                    {wabaConfig.access_token_encrypted ? (
                      <Badge variant="default" className="bg-green-600 text-white">
                        <CheckCircle2 className="h-3 w-3 mr-1" />Configurato (cifrato AES-256)
                      </Badge>
                    ) : (
                      <Badge variant="destructive">Non configurato</Badge>
                    )}
                  </div>
                </div>
              </div>
              <Separator />
              <Button variant="outline" size="sm" onClick={onReconnect}>
                <RefreshCw className="h-3.5 w-3.5 mr-1" />
                Ricollega Account
              </Button>
            </>
          ) : (
            <div className="text-center py-6">
              <Shield className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground mb-3">Nessun account WhatsApp Business collegato</p>
              <Button size="sm" onClick={onReconnect}>
                <Plus className="h-4 w-4 mr-1" />Collega Account
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Webhook Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Globe className="h-4 w-4 text-purple-600" />
            Stato Webhook
          </CardTitle>
          <CardDescription>Ricezione eventi Meta (messaggi, stati consegna)</CardDescription>
        </CardHeader>
        <CardContent>
          {numbers.length === 0 ? (
            <p className="text-sm text-muted-foreground">Collega un numero per vedere lo stato webhook</p>
          ) : (
            <div className="space-y-2">
              {numbers.map(n => (
                <div key={n.id} className="flex items-center justify-between text-sm p-2 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="font-mono text-xs">{n.display_phone_number}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {n.webhook_verified ? (
                      <><Wifi className="h-3.5 w-3.5 text-green-600" /><span className="text-xs text-green-600 font-medium">Verificato</span></>
                    ) : (
                      <><WifiOff className="h-3.5 w-3.5 text-muted-foreground" /><span className="text-xs text-muted-foreground">Non verificato</span></>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Subscription Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-green-600" />
            Abbonamento WhatsApp
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div>
              <p className="text-muted-foreground text-xs">Stato</p>
              <Badge variant="default" className="bg-green-600 text-white mt-1">Attivo</Badge>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Piano</p>
              <p className="font-semibold capitalize mt-1">{subscription?.plan || "standard"}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Prezzo</p>
              <p className="font-semibold mt-1">€{subscription?.price_monthly?.toFixed(2) || "29.99"}/mese</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Attivato il</p>
              <p className="font-semibold mt-1">{subscription?.activated_at ? new Date(subscription.activated_at).toLocaleDateString("it") : "—"}</p>
            </div>
          </div>
          <Separator />
          <Button variant="destructive" size="sm" onClick={onDeactivate}>
            Disattiva WhatsApp
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Sync Templates Button ──
function SyncTemplatesButton({ companyId, numbers, onSynced }: {
  companyId: string; numbers: WaNumber[]; onSynced: () => void;
}) {
  const [syncing, setSyncing] = useState(false);

  const handleSync = async () => {
    const connectedNumbers = numbers.filter(n => n.status === "CONNECTED");
    if (connectedNumbers.length === 0) {
      toast.error("Collega almeno un numero per sincronizzare i template");
      return;
    }
    setSyncing(true);
    let totalSynced = 0;
    const uniqueWabaIds = [...new Set(connectedNumbers.map(n => n.waba_id))];

    for (const wabaId of uniqueWabaIds) {
      try {
        const { data, error } = await supabase.functions.invoke("whatsapp-templates-sync", {
          body: { company_id: companyId, waba_id: wabaId },
        });
        if (error) throw error;
        if (data?.synced) totalSynced += data.synced;
      } catch (err: any) {
        toast.error(`Sync WABA ${wabaId}: ${err.message || "Errore"}`);
      }
    }

    setSyncing(false);
    toast.success(`Sincronizzati ${totalSynced} template da Meta`);
    onSynced();
  };

  return (
    <Button variant="outline" size="sm" onClick={handleSync} disabled={syncing}>
      {syncing ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <RefreshCw className="h-3.5 w-3.5 mr-1" />}
      Sincronizza da Meta
    </Button>
  );
}

// ════════════════════════════════════════════════════
// MAIN PAGE
// ════════════════════════════════════════════════════
export default function WhatsAppPage() {
  const companyId = useCompanyId();
  const [subscription, setSubscription] = useState<WaSubscription | null>(null);
  const [numbers, setNumbers] = useState<WaNumber[]>([]);
  const [templates, setTemplates] = useState<WaTemplate[]>([]);
  const [conversations, setConversations] = useState<WaConversation[]>([]);
  const [wabaConfig, setWabaConfig] = useState<WabaConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [subPrice, setSubPrice] = useState(29.99);

  const fetchData = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);

    const [subRes, numRes, tplRes, convRes, wabaRes, priceRes] = await Promise.all([
      supabase.from("whatsapp_subscriptions").select("*").eq("company_id", companyId).maybeSingle(),
      supabase.from("whatsapp_phone_numbers").select("*").eq("company_id", companyId),
      supabase.from("whatsapp_templates").select("*").eq("company_id", companyId),
      supabase.from("whatsapp_conversations").select("*").eq("company_id", companyId).order("last_message_at", { ascending: false }),
      supabase.from("whatsapp_waba_config").select("*").eq("company_id", companyId).maybeSingle(),
      supabase.from("superadmin_whatsapp_config").select("subscription_price_monthly").limit(1).maybeSingle(),
    ]);

    if (subRes.data) setSubscription(subRes.data as any);
    if (numRes.data) setNumbers(numRes.data as any[]);
    if (tplRes.data) setTemplates(tplRes.data as any[]);
    if (convRes.data) setConversations(convRes.data as any[]);
    if (wabaRes.data) setWabaConfig(wabaRes.data as any);
    if (priceRes.data?.subscription_price_monthly) setSubPrice(Number(priceRes.data.subscription_price_monthly));
    setLoading(false);
  }, [companyId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleActivate = async () => {
    if (!companyId) return;
    setActivating(true);
    const { data, error } = await supabase.from("whatsapp_subscriptions").insert({
      company_id: companyId,
      status: "active",
      price_monthly: subPrice,
      activated_at: new Date().toISOString(),
    }).select().single();
    setActivating(false);
    if (error) { toast.error(error.message); return; }
    setSubscription(data as any);
    toast.success("WhatsApp attivato!");
    fetchData();
  };

  const handleDeactivate = async () => {
    if (!subscription) return;
    await supabase.from("whatsapp_subscriptions").update({ status: "inactive" }).eq("id", subscription.id);
    setSubscription({ ...subscription, status: "inactive" });
    toast.info("WhatsApp disattivato");
  };

  const handleSetDefault = async (id: string) => {
    if (!companyId) return;
    await supabase.from("whatsapp_phone_numbers").update({ is_default: false }).eq("company_id", companyId);
    await supabase.from("whatsapp_phone_numbers").update({ is_default: true }).eq("id", id);
    fetchData();
  };

  const handleDisconnect = async (id: string) => {
    await supabase.from("whatsapp_phone_numbers").delete().eq("id", id);
    fetchData();
    toast.info("Numero disconnesso");
  };

  if (loading) {
    return <div className="p-8 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  const isActive = subscription?.status === "active";

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center shadow-md">
            <MessageSquare className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">WhatsApp Business</h1>
            <p className="text-sm text-muted-foreground">Gestisci numeri, template, conversazioni e impostazioni</p>
          </div>
        </div>
        {isActive && (
          <div className="flex items-center gap-2">
            <Badge variant="default" className="bg-green-600 text-white">Attivo</Badge>
            <Button variant="outline" size="sm" onClick={fetchData}>
              <RefreshCw className="h-3.5 w-3.5 mr-1" />Aggiorna
            </Button>
          </div>
        )}
      </div>

      {/* Gate or Content */}
      {!isActive ? (
        <Card>
          <CardContent className="p-0">
            <SubscriptionGate price={subPrice} onActivate={handleActivate} loading={activating} />
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="flex-wrap">
            <TabsTrigger value="overview"><BarChart3 className="h-4 w-4 mr-1.5" />Panoramica</TabsTrigger>
            <TabsTrigger value="numbers"><Phone className="h-4 w-4 mr-1.5" />Numeri</TabsTrigger>
            <TabsTrigger value="templates"><Megaphone className="h-4 w-4 mr-1.5" />Modelli</TabsTrigger>
            <TabsTrigger value="conversations">
              <MessageCircle className="h-4 w-4 mr-1.5" />Conversazioni
              {conversations.reduce((s, c) => s + (c.unread_count || 0), 0) > 0 && (
                <span className="ml-1 w-5 h-5 rounded-full bg-green-600 text-white text-[10px] font-bold flex items-center justify-center">
                  {conversations.reduce((s, c) => s + (c.unread_count || 0), 0)}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="broadcast"><Radio className="h-4 w-4 mr-1.5" />Broadcast</TabsTrigger>
            <TabsTrigger value="settings"><Settings className="h-4 w-4 mr-1.5" />Impostazioni</TabsTrigger>
          </TabsList>

          {/* Overview */}
          <TabsContent value="overview">
            <TabOverview numbers={numbers} templates={templates} conversations={conversations} subscription={subscription} wabaConfig={wabaConfig} />
          </TabsContent>

          {/* Numbers Tab */}
          <TabsContent value="numbers" className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">{numbers.length} numero/i collegato/i</p>
              <Button size="sm" onClick={() => setShowConnectModal(true)}>
                <Plus className="h-4 w-4 mr-1" />Collega Numero
              </Button>
            </div>
            {numbers.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Phone className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">Nessun numero collegato</p>
                  <Button size="sm" className="mt-4" onClick={() => setShowConnectModal(true)}>
                    <Plus className="h-4 w-4 mr-1" />Collega il primo numero
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3">
                {numbers.map(num => (
                  <Card key={num.id}>
                    <CardContent className="py-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                          <Phone className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-sm text-foreground">{num.display_name}</p>
                            {num.is_default && <Badge variant="secondary" className="text-[10px]">Predefinito</Badge>}
                          </div>
                          <p className="text-xs text-muted-foreground font-mono">{num.display_phone_number}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={statusConfig[num.status]?.variant || "outline"}>
                          {statusConfig[num.status]?.label || num.status}
                        </Badge>
                        <div className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${qualityColors[num.quality_rating] || qualityColors.UNKNOWN}`}>
                          {num.quality_rating}
                        </div>
                        {!num.is_default && (
                          <Button variant="ghost" size="sm" onClick={() => handleSetDefault(num.id)}>
                            <Star className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => handleDisconnect(num.id)} className="text-destructive hover:text-destructive">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value="templates" className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">{templates.length} modello/i</p>
              <div className="flex items-center gap-2">
                <SyncTemplatesButton companyId={companyId!} numbers={numbers} onSynced={fetchData} />
                <Button size="sm" onClick={() => setShowTemplateModal(true)}>
                  <Plus className="h-4 w-4 mr-1" />Crea Modello
                </Button>
              </div>
            </div>
            {templates.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Megaphone className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">Nessun modello creato</p>
                  <Button size="sm" className="mt-4" onClick={() => setShowTemplateModal(true)}>
                    <Plus className="h-4 w-4 mr-1" />Crea il primo modello
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Corpo</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Lingua</TableHead>
                      <TableHead>Stato</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {templates.map(tpl => {
                      const bodyComp = tpl.components?.find((c: any) => c.type === "BODY");
                      const bodyText = bodyComp?.text || "";
                      return (
                        <TableRow key={tpl.id}>
                          <TableCell className="font-mono text-sm">{tpl.name}</TableCell>
                          <TableCell className="text-xs text-muted-foreground max-w-[260px] truncate">
                            {bodyText || <span className="italic">—</span>}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{tpl.category === "MARKETING" ? "Marketing" : tpl.category === "UTILITY" ? "Utility" : "Auth"}</Badge>
                          </TableCell>
                          <TableCell className="text-sm">{tpl.language === "it" ? "🇮🇹 Italiano" : "🇬🇧 English"}</TableCell>
                          <TableCell>
                            <Badge variant={statusConfig[tpl.status]?.variant || "outline"}>
                              {statusConfig[tpl.status]?.label || tpl.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </Card>
            )}
          </TabsContent>

          {/* Conversations Tab */}
          <TabsContent value="conversations">
            <TabConversations companyId={companyId!} conversations={conversations} templates={templates} onRefresh={fetchData} />
          </TabsContent>

          {/* Broadcast Tab */}
          <TabsContent value="broadcast">
            <TabBroadcast companyId={companyId!} templates={templates} numbers={numbers} />
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <TabSettings
              companyId={companyId!}
              subscription={subscription}
              wabaConfig={wabaConfig}
              numbers={numbers}
              onRefresh={fetchData}
              onDeactivate={handleDeactivate}
              onReconnect={() => setShowConnectModal(true)}
            />
          </TabsContent>
        </Tabs>
      )}

      {/* Modals */}
      {companyId && (
        <>
          <ConnectNumberDialog open={showConnectModal} onOpenChange={setShowConnectModal} companyId={companyId} onConnected={fetchData} />
          <TemplateEditorDialog open={showTemplateModal} onOpenChange={setShowTemplateModal} companyId={companyId} onSaved={fetchData} />
        </>
      )}
    </div>
  );
}
