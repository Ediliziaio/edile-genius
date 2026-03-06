import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Plus, Search, Bot } from "lucide-react";
import { Input } from "@/components/ui/input";
import AgentCard from "@/components/agents/AgentCard";

export default function AgentsPage() {
  const { profile } = useAuth();
  const companyId = profile?.company_id;
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: agents, isLoading } = useQuery({
    queryKey: ["company-agents", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data } = await supabase.from("agents").select("*").eq("company_id", companyId!).order("created_at", { ascending: false });
      return data || [];
    },
  });

  const filtered = (agents || []).filter((a) => {
    if (search && !a.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter !== "all" && a.status !== statusFilter) return false;
    return true;
  });

  const statuses = [
    { value: "all", label: "Tutti" },
    { value: "active", label: "Attivi" },
    { value: "draft", label: "Bozza" },
    { value: "inactive", label: "Inattivi" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold" style={{ color: "hsl(var(--app-text-primary))" }}>Agenti</h1>
        <Link
          to="/app/agents/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium"
          style={{ backgroundColor: "hsl(var(--app-brand))", color: "#fff" }}
        >
          <Plus className="w-4 h-4" /> Nuovo Agente
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "hsl(var(--app-text-tertiary))" }} />
          <Input
            placeholder="Cerca agente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 border-0 text-sm"
            style={{ backgroundColor: "hsl(var(--app-bg-input))", color: "hsl(var(--app-text-primary))" }}
          />
        </div>
        <div className="flex gap-2">
          {statuses.map((s) => (
            <button
              key={s.value}
              onClick={() => setStatusFilter(s.value)}
              className="px-3 py-2 rounded-lg text-xs font-medium transition-colors"
              style={{
                backgroundColor: statusFilter === s.value ? "hsl(var(--app-brand-dim))" : "hsl(var(--app-bg-tertiary))",
                color: statusFilter === s.value ? "hsl(var(--app-brand))" : "hsl(var(--app-text-secondary))",
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="text-center py-12" style={{ color: "hsl(var(--app-text-tertiary))" }}>Caricamento...</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl p-12 text-center border" style={{ backgroundColor: "hsl(var(--app-bg-secondary))", borderColor: "hsl(var(--app-border-subtle))" }}>
          <Bot className="w-12 h-12 mx-auto mb-4" style={{ color: "hsl(var(--app-text-tertiary))" }} />
          <p className="text-base font-medium mb-2" style={{ color: "hsl(var(--app-text-primary))" }}>
            {agents?.length === 0 ? "Nessun agente creato" : "Nessun risultato"}
          </p>
          <p className="text-sm mb-4" style={{ color: "hsl(var(--app-text-secondary))" }}>
            {agents?.length === 0 ? "Crea il tuo primo agente vocale AI per iniziare." : "Prova a cambiare i filtri."}
          </p>
          {agents?.length === 0 && (
            <Link
              to="/app/agents/new"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium"
              style={{ backgroundColor: "hsl(var(--app-brand))", color: "#fff" }}
            >
              <Plus className="w-4 h-4" /> Crea Agente
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((agent) => (
            <AgentCard key={agent.id} agent={agent} />
          ))}
        </div>
      )}
    </div>
  );
}
