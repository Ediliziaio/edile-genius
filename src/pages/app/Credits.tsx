import { useCompanyId } from "@/hooks/useCompanyId";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, CreditCard, Package, TrendingUp, Zap, Clock } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function CreditsPage() {
  const companyId = useCompanyId();
  const { toast } = useToast();

  const { data: credits } = useQuery({
    queryKey: ["ai-credits", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_credits")
        .select("*")
        .eq("company_id", companyId!)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: packages } = useQuery({
    queryKey: ["ai-credit-packages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_credit_packages")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const { data: purchases } = useQuery({
    queryKey: ["ai-credit-purchases", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_credit_purchases")
        .select("*")
        .eq("company_id", companyId!)
        .order("purchased_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
  });

  const { data: agentUsage } = useQuery({
    queryKey: ["agent-usage", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("conversations")
        .select("agent_id, minutes_billed, agents!inner(name)")
        .eq("company_id", companyId!);
      if (error) throw error;
      // Aggregate by agent
      const map: Record<string, { name: string; minutes: number }> = {};
      (data || []).forEach((c: any) => {
        const id = c.agent_id;
        if (!map[id]) map[id] = { name: c.agents?.name || "Sconosciuto", minutes: 0 };
        map[id].minutes += Number(c.minutes_billed || 0);
      });
      return Object.values(map).sort((a, b) => b.minutes - a.minutes);
    },
  });

  const minutesPurchased = Number(credits?.minutes_purchased || 0);
  const minutesUsed = Number(credits?.minutes_used || 0);
  const minutesReserved = Number(credits?.minutes_reserved || 0);
  const minutesAvailable = Math.max(0, minutesPurchased - minutesUsed - minutesReserved);
  const usagePct = minutesPurchased > 0 ? Math.round((minutesUsed / minutesPurchased) * 100) : 0;

  const handlePurchase = (pkgId: string) => {
    toast({
      title: "Acquisto in arrivo",
      description: "L'integrazione pagamenti sarà disponibile a breve. Contatta il supporto per acquistare crediti.",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Crediti & Utilizzo</h1>
        <p className="text-muted-foreground text-sm">Monitora il consumo minuti e acquista pacchetti crediti</p>
      </div>

      {/* Usage Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10"><Package className="h-5 w-5 text-primary" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Acquistati</p>
                <p className="text-2xl font-bold">{minutesPurchased.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">min</span></p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/10"><TrendingUp className="h-5 w-5 text-orange-500" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Utilizzati</p>
                <p className="text-2xl font-bold">{minutesUsed.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">min</span></p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-500/10"><Clock className="h-5 w-5 text-yellow-500" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Riservati</p>
                <p className="text-2xl font-bold">{minutesReserved.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">min</span></p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10"><Zap className="h-5 w-5 text-green-500" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Disponibili</p>
                <p className="text-2xl font-bold">{minutesAvailable.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">min</span></p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium">Consumo totale</span>
            <span className="text-sm text-muted-foreground">{usagePct}%</span>
          </div>
          <Progress value={usagePct} className="h-3" />
          <p className="text-xs text-muted-foreground mt-2">
            {minutesUsed.toLocaleString()} / {minutesPurchased.toLocaleString()} minuti utilizzati
          </p>
        </CardContent>
      </Card>

      <Tabs defaultValue="packages">
        <TabsList>
          <TabsTrigger value="packages"><CreditCard className="h-4 w-4 mr-1.5" />Pacchetti</TabsTrigger>
          <TabsTrigger value="history"><Clock className="h-4 w-4 mr-1.5" />Storico Acquisti</TabsTrigger>
          <TabsTrigger value="usage"><BarChart3 className="h-4 w-4 mr-1.5" />Utilizzo per Agente</TabsTrigger>
        </TabsList>

        <TabsContent value="packages">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {(packages || []).map((pkg) => (
              <Card key={pkg.id} className="relative overflow-hidden">
                {pkg.badge && (
                  <Badge className="absolute top-3 right-3" variant="default">{pkg.badge}</Badge>
                )}
                <CardHeader>
                  <CardTitle className="text-lg">{pkg.name}</CardTitle>
                  <CardDescription>{pkg.minutes.toLocaleString()} minuti</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <span className="text-3xl font-bold">€{Number(pkg.price_eur).toFixed(0)}</span>
                    <span className="text-muted-foreground text-sm ml-1">
                      (€{Number(pkg.price_per_min || (pkg.price_eur / pkg.minutes)).toFixed(3)}/min)
                    </span>
                  </div>
                  <Button className="w-full" onClick={() => handlePurchase(pkg.id)}>
                    Acquista
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardContent className="pt-6">
              {(purchases || []).length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Nessun acquisto effettuato</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Minuti</TableHead>
                      <TableHead>Importo</TableHead>
                      <TableHead>€/min</TableHead>
                      <TableHead>Riferimento</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(purchases || []).map((p) => (
                      <TableRow key={p.id}>
                        <TableCell>{p.purchased_at ? format(new Date(p.purchased_at), "dd MMM yyyy HH:mm", { locale: it }) : "-"}</TableCell>
                        <TableCell className="font-medium">+{Number(p.minutes_added).toLocaleString()}</TableCell>
                        <TableCell>€{Number(p.amount_eur).toFixed(2)}</TableCell>
                        <TableCell>€{Number(p.cost_per_min).toFixed(3)}</TableCell>
                        <TableCell className="text-muted-foreground">{p.payment_ref || "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="usage">
          <Card>
            <CardContent className="pt-6">
              {(agentUsage || []).length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Nessun dato di utilizzo disponibile</p>
              ) : (
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={agentUsage}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="name" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip
                        formatter={(value: number) => [`${value.toFixed(1)} min`, "Minuti"]}
                        contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
                      />
                      <Bar dataKey="minutes" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
