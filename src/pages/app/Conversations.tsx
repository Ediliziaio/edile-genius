import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { MessageSquare, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import TranscriptViewer from "@/components/conversations/TranscriptViewer";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import type { Tables } from "@/integrations/supabase/types";

export default function ConversationsPage() {
  const { profile } = useAuth();
  const companyId = profile?.company_id;
  const [search, setSearch] = useState("");
  const [agentFilter, setAgentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewConv, setViewConv] = useState<Tables<"conversations"> | null>(null);

  const { data: agents = [] } = useQuery({
    queryKey: ["company-agents-list", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data } = await supabase.from("agents").select("id, name").eq("company_id", companyId!);
      return data || [];
    },
  });

  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ["company-conversations", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("conversations")
        .select("*")
        .eq("company_id", companyId!)
        .order("started_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data;
    },
  });

  const agentMap = Object.fromEntries(agents.map(a => [a.id, a.name]));

  const filtered = conversations.filter(c => {
    if (agentFilter !== "all" && c.agent_id !== agentFilter) return false;
    if (statusFilter !== "all" && c.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const name = agentMap[c.agent_id]?.toLowerCase() || "";
      if (!name.includes(q) && !(c.caller_number || "").includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="p-6 md:p-8">
      <div className="flex items-center gap-3 mb-6">
        <MessageSquare className="w-6 h-6" style={{ color: "hsl(var(--app-brand))" }} />
        <h1 className="text-2xl font-bold" style={{ color: "hsl(var(--app-text-primary))" }}>Conversazioni</h1>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "hsl(var(--app-text-tertiary))" }} />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cerca agente o numero..."
            className="pl-9 border-none"
            style={{ backgroundColor: "hsl(var(--app-bg-input))", color: "hsl(var(--app-text-primary))" }}
          />
        </div>
        <Select value={agentFilter} onValueChange={setAgentFilter}>
          <SelectTrigger className="w-[180px] border-none" style={{ backgroundColor: "hsl(var(--app-bg-input))", color: "hsl(var(--app-text-primary))" }}>
            <SelectValue placeholder="Tutti gli agenti" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tutti gli agenti</SelectItem>
            {agents.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px] border-none" style={{ backgroundColor: "hsl(var(--app-bg-input))", color: "hsl(var(--app-text-primary))" }}>
            <SelectValue placeholder="Tutti gli stati" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tutti</SelectItem>
            <SelectItem value="completed">Completata</SelectItem>
            <SelectItem value="in_progress">In corso</SelectItem>
            <SelectItem value="failed">Fallita</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {isLoading ? (
        <p className="text-sm py-8 text-center" style={{ color: "hsl(var(--app-text-tertiary))" }}>Caricamento...</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <MessageSquare className="w-10 h-10 mx-auto mb-3" style={{ color: "hsl(var(--app-text-tertiary))" }} />
          <p className="text-sm" style={{ color: "hsl(var(--app-text-tertiary))" }}>Nessuna conversazione trovata.</p>
        </div>
      ) : (
        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid hsl(var(--app-border-subtle))" }}>
          <Table>
            <TableHeader>
              <TableRow style={{ backgroundColor: "hsl(var(--app-bg-tertiary))" }}>
                <TableHead style={{ color: "hsl(var(--app-text-secondary))" }}>Agente</TableHead>
                <TableHead style={{ color: "hsl(var(--app-text-secondary))" }}>Numero</TableHead>
                <TableHead style={{ color: "hsl(var(--app-text-secondary))" }}>Durata</TableHead>
                <TableHead style={{ color: "hsl(var(--app-text-secondary))" }}>Esito</TableHead>
                <TableHead style={{ color: "hsl(var(--app-text-secondary))" }}>Stato</TableHead>
                <TableHead style={{ color: "hsl(var(--app-text-secondary))" }}>Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(conv => (
                <TableRow
                  key={conv.id}
                  className="cursor-pointer"
                  onClick={() => setViewConv(conv)}
                  style={{ backgroundColor: "hsl(var(--app-bg-secondary))" }}
                >
                  <TableCell style={{ color: "hsl(var(--app-text-primary))" }}>{agentMap[conv.agent_id] || "—"}</TableCell>
                  <TableCell style={{ color: "hsl(var(--app-text-secondary))" }}>{conv.caller_number || "—"}</TableCell>
                  <TableCell style={{ color: "hsl(var(--app-text-secondary))" }}>{conv.duration_sec ? `${conv.duration_sec}s` : "—"}</TableCell>
                  <TableCell style={{ color: "hsl(var(--app-text-secondary))" }}>{conv.outcome || "—"}</TableCell>
                  <TableCell>
                    <Badge style={{ backgroundColor: "hsl(var(--app-bg-tertiary))", color: "hsl(var(--app-text-secondary))", border: "none" }}>
                      {conv.status || "—"}
                    </Badge>
                  </TableCell>
                  <TableCell style={{ color: "hsl(var(--app-text-secondary))" }}>
                    {conv.started_at ? format(new Date(conv.started_at), "dd MMM yyyy HH:mm", { locale: it }) : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <TranscriptViewer
        open={!!viewConv}
        onOpenChange={() => setViewConv(null)}
        transcript={viewConv?.transcript ?? null}
        agentName={viewConv ? agentMap[viewConv.agent_id] : undefined}
      />
    </div>
  );
}
