import { Link2, Phone, MessageCircle, RefreshCw, Webhook, ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface IntegrationCard {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  status: "connected" | "available" | "coming_soon";
  href?: string;
}

const integrations: IntegrationCard[] = [
  {
    id: "telephony",
    title: "Telefonia",
    description: "Numeri di telefono per agenti vocali inbound e outbound",
    icon: Phone,
    status: "available",
    href: "/app/phone-numbers",
  },
  {
    id: "whatsapp",
    title: "WhatsApp Business",
    description: "Collega il tuo account WhatsApp Business per automazioni e broadcast",
    icon: MessageCircle,
    status: "available",
    href: "/app/whatsapp",
  },
  {
    id: "crm",
    title: "CRM",
    description: "Sincronizza contatti e lead con il tuo CRM aziendale",
    icon: RefreshCw,
    status: "available",
    href: "/app/settings",
  },
  {
    id: "webhooks",
    title: "Webhooks",
    description: "Ricevi notifiche in tempo reale su eventi degli agenti",
    icon: Webhook,
    status: "available",
    href: "/app/settings",
  },
];

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  connected: { label: "Connesso", variant: "default" },
  available: { label: "Disponibile", variant: "secondary" },
  coming_soon: { label: "In arrivo", variant: "outline" },
};

export default function Integrations() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Integrazioni</h1>
        <p className="text-muted-foreground mt-1">
          Collega i tuoi sistemi esterni in un unico posto
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {integrations.map((integration) => {
          const Icon = integration.icon;
          const status = statusLabels[integration.status];
          return (
            <Card key={integration.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-start gap-4 space-y-0">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Icon size={20} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base">{integration.title}</CardTitle>
                    <Badge variant={status.variant} className="text-[10px]">
                      {status.label}
                    </Badge>
                  </div>
                  <CardDescription className="mt-1">{integration.description}</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                {integration.href && integration.status !== "coming_soon" && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => navigate(integration.href!)}
                  >
                    Configura <ArrowRight size={14} />
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
