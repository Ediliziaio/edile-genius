import { Phone, MessageCircle, RefreshCw, Webhook, ArrowRight, Bot, CheckCircle2, Image, Workflow } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyId } from "@/hooks/useCompanyId";
import N8nIntegrationTab from "@/components/integrations/N8nIntegrationTab";

interface IntegrationDef {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  href: string;
  comingSoon?: boolean;
}

const integrationDefs: IntegrationDef[] = [
  { id: "telephony", title: "Telefonia", description: "Numeri di telefono per agenti vocali inbound e outbound", icon: Phone, href: "/app/phone-numbers" },
  { id: "whatsapp", title: "WhatsApp Business", description: "Collega il tuo account WhatsApp Business per automazioni e broadcast", icon: MessageCircle, href: "/app/whatsapp" },
  { id: "n8n", title: "n8n Automation", description: "Collega la tua istanza n8n per workflow di automazione avanzati", icon: Workflow, href: "/app/integrations?tab=n8n" },
  { id: "crm", title: "CRM", description: "Sincronizza contatti e lead con HubSpot, Salesforce o Pipedrive", icon: RefreshCw, href: "/app/settings?tab=integrations" },
  { id: "webhooks", title: "Webhooks", description: "Ricevi notifiche in tempo reale su eventi degli agenti", icon: Webhook, href: "/app/settings?tab=webhooks" },
  { id: "telegram", title: "Telegram Bot", description: "Collega un bot Telegram per report cantiere e notifiche operai", icon: Bot, href: "/app/cantieri" },
  { id: "render", title: "Render AI", description: "Genera render fotorealistici con AI per infissi, facciate e coperture", icon: Image, href: "/app/render" },
];

export default function Integrations() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "overview";
  const companyId = useCompanyId();

  const { data: phoneCount } = useQuery({
    queryKey: ["int-phones", companyId], enabled: !!companyId,
    queryFn: async () => {
      const { count } = await supabase.from("ai_phone_numbers").select("*", { count: "exact", head: true }).eq("company_id", companyId!).eq("status", "active");
      return count ?? 0;
    },
  });

  const { data: crmActive } = useQuery({
    queryKey: ["int-crm", companyId], enabled: !!companyId,
    queryFn: async () => {
      const { data } = await supabase.from("company_integrations").select("id").eq("company_id", companyId!).eq("is_active", true).limit(1);
      return (data?.length ?? 0) > 0;
    },
  });

  const { data: telegramActive } = useQuery({
    queryKey: ["int-telegram", companyId], enabled: !!companyId,
    queryFn: async () => {
      const { data } = await supabase.from("company_channels").select("id").eq("company_id", companyId!).eq("channel_type", "telegram").eq("is_verified", true).limit(1);
      return (data?.length ?? 0) > 0;
    },
  });

  const { data: webhookCount } = useQuery({
    queryKey: ["int-webhooks", companyId], enabled: !!companyId,
    queryFn: async () => {
      const { data } = await supabase.from("agents").select("id").eq("company_id", companyId!).not("webhook_url", "is", null).limit(1);
      return (data?.length ?? 0) > 0;
    },
  });

  const { data: waActive } = useQuery({
    queryKey: ["int-whatsapp", companyId], enabled: !!companyId,
    queryFn: async () => {
      const { data } = await supabase.from("company_channels").select("id").eq("company_id", companyId!).eq("channel_type", "whatsapp").eq("is_verified", true).limit(1);
      return (data?.length ?? 0) > 0;
    },
  });

  const { data: n8nStatus } = useQuery({
    queryKey: ["int-n8n-status"],
    queryFn: async () => {
      try {
        const { data } = await supabase.functions.invoke("manage-n8n-config", { body: { action: "get_status" } });
        return data?.config?.n8n_configured && data?.config?.n8n_api_key_set;
      } catch { return false; }
    },
  });

  const statusMap: Record<string, boolean> = {
    telephony: (phoneCount ?? 0) > 0,
    whatsapp: waActive ?? false,
    n8n: n8nStatus ?? false,
    crm: crmActive ?? false,
    webhooks: webhookCount ?? false,
    telegram: telegramActive ?? false,
    render: false,
  };

  const connectedCount = Object.values(statusMap).filter(Boolean).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Integrazioni</h1>
        <p className="text-muted-foreground mt-1">
          Collega i tuoi sistemi esterni in un unico posto —{" "}
          <span className="font-medium text-foreground">{connectedCount}/{integrationDefs.length} attive</span>
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={(val) => setSearchParams({ tab: val })}>
        <TabsList>
          <TabsTrigger value="overview">Panoramica</TabsTrigger>
          <TabsTrigger value="n8n" className="gap-1">
            <Workflow size={14} /> n8n
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            {integrationDefs.map((integration) => {
              const Icon = integration.icon;
              const connected = statusMap[integration.id];
              const isComingSoon = integration.comingSoon;
              return (
                <Card key={integration.id} className={`hover:shadow-md transition-shadow ${connected ? "border-primary/40" : ""} ${isComingSoon ? "opacity-70" : ""}`}>
                  <CardHeader className="flex flex-row items-start gap-4 space-y-0">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${connected ? "bg-primary/10" : "bg-muted"}`}>
                      <Icon size={20} className={connected ? "text-primary" : "text-muted-foreground"} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base">{integration.title}</CardTitle>
                        {isComingSoon ? (
                          <Badge variant="outline" className="text-[10px] text-muted-foreground border-muted-foreground/30">Prossimamente</Badge>
                        ) : connected ? (
                          <Badge variant="default" className="text-[10px] gap-1"><CheckCircle2 size={10} /> Connesso</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[10px]">Da configurare</Badge>
                        )}
                      </div>
                      <CardDescription className="mt-1">{integration.description}</CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {isComingSoon ? (
                      <Button variant="outline" size="sm" className="gap-2" disabled>Prossimamente</Button>
                    ) : integration.id === "n8n" ? (
                      <Button
                        variant={connected ? "outline" : "default"}
                        size="sm"
                        className="gap-2"
                        onClick={() => setSearchParams({ tab: "n8n" })}
                      >
                        {connected ? "Gestisci" : "Configura"} <ArrowRight size={14} />
                      </Button>
                    ) : (
                      <Button
                        variant={connected ? "outline" : "default"}
                        size="sm"
                        className="gap-2"
                        onClick={() => navigate(integration.href)}
                      >
                        {connected ? "Gestisci" : "Configura"} <ArrowRight size={14} />
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="n8n" className="mt-4">
          <N8nIntegrationTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
