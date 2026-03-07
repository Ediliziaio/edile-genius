import { useState, useEffect, useCallback } from "react";
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
import { toast } from "sonner";
import {
  MessageSquare, Phone, Plus, ExternalLink, Trash2, Star,
  CheckCircle2, AlertTriangle, Clock, Zap, Bot, Megaphone, Loader2
} from "lucide-react";

// Types
interface WaSubscription {
  id: string;
  status: string;
  plan: string;
  price_monthly: number;
  expires_at: string | null;
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
}

interface WaTemplate {
  id: string;
  name: string;
  category: string;
  language: string;
  status: string;
  components: any[];
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
        <Button onClick={onActivate} disabled={loading} className="bg-green-600 hover:bg-green-700">
          {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          Attiva WhatsApp — €{price.toFixed(2)}/mese
        </Button>
        <span className="text-xs text-muted-foreground">Puoi disattivare in qualsiasi momento</span>
      </div>
    </div>
  );
}

// ── Connect Number Dialog ──
function ConnectNumberDialog({ open, onOpenChange, companyId, onConnected }: {
  open: boolean; onOpenChange: (o: boolean) => void; companyId: string; onConnected: () => void;
}) {
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [step, setStep] = useState<"form" | "connecting" | "done">("form");

  const handleConnect = async () => {
    if (!displayName.trim() || !phone.trim()) {
      toast.error("Compila tutti i campi");
      return;
    }
    setStep("connecting");
    // Simulate Meta Embedded Signup flow
    await new Promise(r => setTimeout(r, 2000));

    const { error } = await supabase.from("whatsapp_phone_numbers").insert({
      company_id: companyId,
      waba_id: "demo_waba_" + Date.now(),
      phone_number_id: "pn_" + Date.now(),
      display_phone_number: phone,
      display_name: displayName,
      status: "CONNECTED",
      quality_rating: "UNKNOWN",
    });

    if (error) {
      toast.error("Errore: " + error.message);
      setStep("form");
      return;
    }
    setStep("done");
    onConnected();
    toast.success("Numero collegato con successo!");
  };

  const handleClose = () => {
    setStep("form");
    setDisplayName("");
    setPhone("");
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
            Collega Numero WhatsApp
          </DialogTitle>
          <DialogDescription>Via Meta Business Manager</DialogDescription>
        </DialogHeader>

        {step === "form" && (
          <div className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex gap-2 text-xs text-yellow-800">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              Una volta collegato, il numero funzionerà sia su WhatsApp mobile che su questo CRM tramite Cloud API.
            </div>
            <div className="space-y-2">
              <Label>Nome visualizzato *</Label>
              <Input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="es. Flo | Marketing Edile" />
              <p className="text-xs text-muted-foreground">Deve corrispondere al nome dell'azienda (linee guida Meta)</p>
            </div>
            <div className="space-y-2">
              <Label>Numero di telefono *</Label>
              <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+39 350 000 0000" />
            </div>
          </div>
        )}

        {step === "connecting" && (
          <div className="flex flex-col items-center py-8 gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-green-600" />
            <p className="text-sm text-muted-foreground">Connessione a Meta Business in corso...</p>
          </div>
        )}

        {step === "done" && (
          <div className="flex flex-col items-center py-8 gap-4">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <p className="text-sm font-medium">Numero collegato con successo!</p>
          </div>
        )}

        <DialogFooter>
          {step === "form" && (
            <>
              <Button variant="outline" onClick={handleClose}>Annulla</Button>
              <Button onClick={handleConnect} className="bg-green-600 hover:bg-green-700">
                <ExternalLink className="h-4 w-4 mr-2" />Procedi con Meta
              </Button>
            </>
          )}
          {step === "done" && <Button onClick={handleClose}>Chiudi</Button>}
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
      category,
      language,
      status: "PENDING",
      components: [
        ...(header ? [{ type: "HEADER", format: "TEXT", text: header }] : []),
        { type: "BODY", text: body },
        ...(footer ? [{ type: "FOOTER", text: footer }] : []),
      ],
    });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Template inviato a Meta per approvazione");
    onSaved();
    onOpenChange(false);
    setName(""); setBody(""); setHeader(""); setFooter("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Crea Modello Messaggio</DialogTitle>
        </DialogHeader>
        <div className="flex gap-6">
          {/* Form */}
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

          {/* Preview */}
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
                  <div className="flex justify-end mt-1">
                    <span className="text-[10px] text-muted-foreground">11:48 ✓✓</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-2">
              <p className="text-[11px] text-yellow-800 leading-relaxed">
                Il modello sarà inviato a Meta per approvazione. I tempi medi sono 2-24 ore.
              </p>
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

// ── Main Page ──
export default function WhatsAppPage() {
  const companyId = useCompanyId();
  const [subscription, setSubscription] = useState<WaSubscription | null>(null);
  const [numbers, setNumbers] = useState<WaNumber[]>([]);
  const [templates, setTemplates] = useState<WaTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);

  const fetchData = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);

    const [subRes, numRes, tplRes] = await Promise.all([
      supabase.from("whatsapp_subscriptions").select("*").eq("company_id", companyId).maybeSingle(),
      supabase.from("whatsapp_phone_numbers").select("*").eq("company_id", companyId),
      supabase.from("whatsapp_templates").select("*").eq("company_id", companyId),
    ]);

    if (subRes.data) setSubscription(subRes.data as any);
    if (numRes.data) setNumbers(numRes.data as any[]);
    if (tplRes.data) setTemplates(tplRes.data as any[]);
    setLoading(false);
  }, [companyId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleActivate = async () => {
    if (!companyId) return;
    setActivating(true);
    const { data, error } = await supabase.from("whatsapp_subscriptions").insert({
      company_id: companyId,
      status: "active",
      activated_at: new Date().toISOString(),
    }).select().single();
    setActivating(false);
    if (error) { toast.error(error.message); return; }
    setSubscription(data as any);
    toast.success("WhatsApp attivato!");
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
    return (
      <div className="p-8 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
    );
  }

  const isActive = subscription?.status === "active";

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center shadow-md">
            <MessageSquare className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">WhatsApp Business</h1>
            <p className="text-sm text-muted-foreground">Gestisci numeri, template e conversazioni</p>
          </div>
        </div>
        {isActive && (
          <div className="flex items-center gap-2">
            <Badge variant="default" className="bg-green-600">Attivo</Badge>
            <Button variant="outline" size="sm" onClick={handleDeactivate}>Disattiva</Button>
          </div>
        )}
      </div>

      {/* Gate or Content */}
      {!isActive ? (
        <Card>
          <CardContent className="p-0">
            <SubscriptionGate price={subscription?.price_monthly || 29.99} onActivate={handleActivate} loading={activating} />
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="numbers" className="space-y-4">
          <TabsList>
            <TabsTrigger value="numbers"><Phone className="h-4 w-4 mr-1.5" />Numeri</TabsTrigger>
            <TabsTrigger value="templates"><Megaphone className="h-4 w-4 mr-1.5" />Modelli</TabsTrigger>
            <TabsTrigger value="flows"><Zap className="h-4 w-4 mr-1.5" />Flussi</TabsTrigger>
          </TabsList>

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
              <Button size="sm" onClick={() => setShowTemplateModal(true)}>
                <Plus className="h-4 w-4 mr-1" />Crea Modello
              </Button>
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
                      <TableHead>Categoria</TableHead>
                      <TableHead>Lingua</TableHead>
                      <TableHead>Stato</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {templates.map(tpl => (
                      <TableRow key={tpl.id}>
                        <TableCell className="font-mono text-sm">{tpl.name}</TableCell>
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
                    ))}
                  </TableBody>
                </Table>
              </Card>
            )}
          </TabsContent>

          {/* Flows Tab (placeholder) */}
          <TabsContent value="flows">
            <Card>
              <CardContent className="py-16 text-center">
                <Zap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Automazioni WhatsApp</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Presto potrai creare flussi automatici: risposte AI, broadcast programmati,
                  trigger su eventi CRM e molto altro.
                </p>
                <Badge variant="secondary" className="mt-4">Prossimamente</Badge>
              </CardContent>
            </Card>
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
