import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { MessageSquare, Save, Eye, EyeOff, Loader2, Ban, CheckCircle2, Settings } from "lucide-react";

interface WAConfig {
  id: string;
  meta_app_id: string;
  meta_app_secret_encrypted: string;
  webhook_verify_token: string;
  webhook_url: string;
  subscription_price_monthly: number;
  is_active: boolean;
}

interface CompanyWA {
  company_id: string;
  company_name: string;
  status: string;
  plan: string;
  numbers_count: number;
  templates_count: number;
  activated_at: string | null;
}

export default function WhatsAppAdmin() {
  const [config, setConfig] = useState<WAConfig | null>(null);
  const [companies, setCompanies] = useState<CompanyWA[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSecret, setShowSecret] = useState(false);

  // Form state
  const [appId, setAppId] = useState("");
  const [appSecret, setAppSecret] = useState("");
  const [verifyToken, setVerifyToken] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [price, setPrice] = useState("29.99");

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);

    // Fetch config
    const { data: cfgData } = await supabase.from("superadmin_whatsapp_config").select("*").limit(1).maybeSingle();
    if (cfgData) {
      const c = cfgData as any;
      setConfig(c);
      setAppId(c.meta_app_id || "");
      setAppSecret(c.meta_app_secret_encrypted || "");
      setVerifyToken(c.webhook_verify_token || "");
      setWebhookUrl(c.webhook_url || "");
      setPrice(String(c.subscription_price_monthly || 29.99));
    }

    // Fetch companies with WA subscriptions
    const { data: subs } = await supabase
      .from("whatsapp_subscriptions")
      .select("company_id, status, plan, activated_at");

    if (subs && subs.length > 0) {
      const companyIds = subs.map((s: any) => s.company_id);
      const [compRes, numRes, tplRes] = await Promise.all([
        supabase.from("companies").select("id, name").in("id", companyIds),
        supabase.from("whatsapp_phone_numbers").select("company_id").in("company_id", companyIds),
        supabase.from("whatsapp_templates").select("company_id").in("company_id", companyIds),
      ]);

      const compMap = new Map((compRes.data || []).map((c: any) => [c.id, c.name]));
      const numCounts = new Map<string, number>();
      const tplCounts = new Map<string, number>();
      (numRes.data || []).forEach((n: any) => numCounts.set(n.company_id, (numCounts.get(n.company_id) || 0) + 1));
      (tplRes.data || []).forEach((t: any) => tplCounts.set(t.company_id, (tplCounts.get(t.company_id) || 0) + 1));

      setCompanies(subs.map((s: any) => ({
        company_id: s.company_id,
        company_name: compMap.get(s.company_id) || "—",
        status: s.status,
        plan: s.plan,
        numbers_count: numCounts.get(s.company_id) || 0,
        templates_count: tplCounts.get(s.company_id) || 0,
        activated_at: s.activated_at,
      })));
    }

    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const payload = {
      meta_app_id: appId,
      meta_app_secret_encrypted: appSecret,
      webhook_verify_token: verifyToken,
      webhook_url: webhookUrl,
      subscription_price_monthly: parseFloat(price) || 29.99,
    };

    if (config) {
      await supabase.from("superadmin_whatsapp_config").update(payload).eq("id", config.id);
    } else {
      await supabase.from("superadmin_whatsapp_config").insert(payload);
    }
    setSaving(false);
    toast.success("Configurazione WhatsApp salvata");
    fetchAll();
  };

  const handleToggleCompany = async (companyId: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "suspended" : "active";
    await supabase.from("whatsapp_subscriptions").update({ status: newStatus }).eq("company_id", companyId);
    toast.success(newStatus === "active" ? "Account riattivato" : "Account sospeso");
    fetchAll();
  };

  if (loading) {
    return <div className="p-8 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center shadow-md">
          <MessageSquare className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">WhatsApp — Configurazione Globale</h1>
          <p className="text-sm text-muted-foreground">API Meta, pricing e gestione account</p>
        </div>
      </div>

      {/* API Config */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Settings className="h-4 w-4" />Credenziali Meta API</CardTitle>
          <CardDescription>Configurazione globale per WhatsApp Cloud API</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Meta App ID</Label>
              <Input value={appId} onChange={e => setAppId(e.target.value)} placeholder="1234567890" />
            </div>
            <div className="space-y-2">
              <Label>App Secret</Label>
              <div className="relative">
                <Input
                  type={showSecret ? "text" : "password"}
                  value={appSecret}
                  onChange={e => setAppSecret(e.target.value)}
                  placeholder="••••••••••••"
                />
                <Button variant="ghost" size="sm" className="absolute right-1 top-0.5 h-8 w-8 p-0" onClick={() => setShowSecret(!showSecret)}>
                  {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Webhook URL</Label>
              <Input value={webhookUrl} onChange={e => setWebhookUrl(e.target.value)} placeholder="https://..." />
            </div>
            <div className="space-y-2">
              <Label>Verify Token</Label>
              <Input value={verifyToken} onChange={e => setVerifyToken(e.target.value)} placeholder="my_verify_token" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Prezzo Abbonamento Mensile (€)</Label>
              <Input type="number" step="0.01" value={price} onChange={e => setPrice(e.target.value)} />
            </div>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Salva Configurazione
          </Button>
        </CardContent>
      </Card>

      {/* Accounts Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Account WhatsApp Attivi</CardTitle>
          <CardDescription>{companies.length} aziende con modulo WhatsApp</CardDescription>
        </CardHeader>
        <CardContent>
          {companies.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Nessuna azienda con WhatsApp attivo</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Azienda</TableHead>
                  <TableHead>Stato</TableHead>
                  <TableHead>Piano</TableHead>
                  <TableHead>Numeri</TableHead>
                  <TableHead>Template</TableHead>
                  <TableHead>Attivato</TableHead>
                  <TableHead className="text-right">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {companies.map(c => (
                  <TableRow key={c.company_id}>
                    <TableCell className="font-medium">{c.company_name}</TableCell>
                    <TableCell>
                      <Badge variant={c.status === "active" ? "default" : c.status === "suspended" ? "destructive" : "secondary"}>
                        {c.status === "active" ? "Attivo" : c.status === "suspended" ? "Sospeso" : "Inattivo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="capitalize">{c.plan}</TableCell>
                    <TableCell>{c.numbers_count}</TableCell>
                    <TableCell>{c.templates_count}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {c.activated_at ? new Date(c.activated_at).toLocaleDateString("it-IT") : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleToggleCompany(c.company_id, c.status)}>
                        {c.status === "active" ? <Ban className="h-4 w-4 text-destructive" /> : <CheckCircle2 className="h-4 w-4 text-green-600" />}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
