import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Bot } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface UsageRow {
  id: string;
  agent_id: string | null;
  duration_sec: number;
  duration_min: number;
  llm_model: string;
  tts_model: string;
  cost_billed_total: number;
  balance_after: number;
  created_at: string;
}

interface Topup {
  id: string;
  amount_eur: number;
  type: string;
  status: string;
  payment_method: string | null;
  invoice_number: string | null;
  created_at: string;
}

interface CreditsUsageTabsProps {
  usage: UsageRow[];
  topups: Topup[];
  agentNames: Record<string, string>;
}

export default function CreditsUsageTabs({ usage, topups, agentNames }: CreditsUsageTabsProps) {
  // Agent usage aggregation
  const agentUsageMap: Record<string, { name: string; cost: number; calls: number; mins: number }> = {};
  usage.forEach((u) => {
    const aid = u.agent_id || "unknown";
    if (!agentUsageMap[aid]) agentUsageMap[aid] = { name: agentNames[aid] || "Sconosciuto", cost: 0, calls: 0, mins: 0 };
    agentUsageMap[aid].cost += u.cost_billed_total;
    agentUsageMap[aid].calls += 1;
    agentUsageMap[aid].mins += u.duration_min;
  });
  const agentChartData = Object.values(agentUsageMap).sort((a, b) => b.cost - a.cost);

  return (
    <Tabs defaultValue="usage" className="space-y-4">
      <TabsList>
        <TabsTrigger value="usage">Utilizzo per Agente</TabsTrigger>
        <TabsTrigger value="conversations">Ultime Conversazioni</TabsTrigger>
        <TabsTrigger value="topups">Storico Ricariche</TabsTrigger>
      </TabsList>

      <TabsContent value="usage">
        {agentChartData.length > 0 ? (
          <>
            <Card><CardContent className="p-0">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Agente</TableHead><TableHead className="text-right">Chiamate</TableHead><TableHead className="text-right">Minuti</TableHead><TableHead className="text-right">Costo (€)</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {agentChartData.map((a, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium flex items-center gap-2"><Bot className="h-4 w-4 text-muted-foreground" /> {a.name}</TableCell>
                      <TableCell className="text-right">{a.calls}</TableCell>
                      <TableCell className="text-right font-mono">{a.mins.toFixed(1)}</TableCell>
                      <TableCell className="text-right font-mono font-semibold text-primary">€{a.cost.toFixed(4)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent></Card>
            <div className="h-[200px] mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={agentChartData} layout="vertical" margin={{ left: 80 }}>
                  <XAxis type="number" tickFormatter={(v) => `€${v.toFixed(2)}`} />
                  <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v: number) => `€${v.toFixed(4)}`} />
                  <Bar dataKey="cost" radius={[0, 4, 4, 0]}>{agentChartData.map((_, i) => <Cell key={i} className="fill-primary" />)}</Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        ) : <p className="text-muted-foreground text-center py-8">Nessun consumo registrato.</p>}
      </TabsContent>

      <TabsContent value="conversations">
        <Card><CardContent className="p-0">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Data/Ora</TableHead><TableHead>Agente</TableHead><TableHead>Durata</TableHead><TableHead>LLM</TableHead><TableHead className="text-right">Costo €</TableHead><TableHead className="text-right">Saldo dopo</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {usage.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nessun consumo</TableCell></TableRow>
              ) : usage.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-mono text-xs">{format(new Date(u.created_at), "dd/MM HH:mm", { locale: it })}</TableCell>
                  <TableCell>{agentNames[u.agent_id || ""] || "—"}</TableCell>
                  <TableCell className="font-mono text-sm">{Math.floor(u.duration_sec / 60)}m {u.duration_sec % 60}s</TableCell>
                  <TableCell><Badge variant="secondary" className="text-xs">{u.llm_model}</Badge></TableCell>
                  <TableCell className="text-right font-mono font-semibold text-primary">€{u.cost_billed_total.toFixed(4)}</TableCell>
                  <TableCell className="text-right font-mono text-muted-foreground">€{u.balance_after.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent></Card>
      </TabsContent>

      <TabsContent value="topups">
        <Card><CardContent className="p-0">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Data</TableHead><TableHead>Tipo</TableHead><TableHead className="text-right">Importo</TableHead><TableHead>Metodo</TableHead><TableHead>N. Fattura</TableHead><TableHead>Stato</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {topups.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nessuna ricarica</TableCell></TableRow>
              ) : topups.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-mono text-xs">{format(new Date(t.created_at), "dd/MM/yy HH:mm", { locale: it })}</TableCell>
                  <TableCell><Badge variant={t.type === "manual" ? "default" : t.type === "auto" ? "secondary" : "outline"} className="text-xs">{t.type === "manual" ? "Manuale" : t.type === "auto" ? "Automatica" : t.type === "promotional" ? "Promo" : "Rettifica"}</Badge></TableCell>
                  <TableCell className="text-right font-mono font-semibold">€{t.amount_eur.toFixed(2)}</TableCell>
                  <TableCell className="text-sm">{t.payment_method || "—"}</TableCell>
                  <TableCell className="font-mono text-xs">{t.invoice_number || "—"}</TableCell>
                  <TableCell><Badge variant={t.status === "completed" ? "default" : "destructive"} className="text-xs">{t.status === "completed" ? "Completato" : t.status}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent></Card>
      </TabsContent>
    </Tabs>
  );
}
