import { useState, useMemo } from "react";
import { useCompanyId } from "@/hooks/useCompanyId";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AgentCard from "@/components/agents/AgentCard";

export default function AgentsPage() {
  const companyId = useCompanyId();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: agents, isLoading } = useQuery({
    queryKey: ["company-agents", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data } = await supabase.from("agents").select("*").eq("company_id", companyId!).order("created_at", { ascending: false });
      return data || [];
    },
  });

  const filtered = useMemo(() => {
    return (agents || []).filter((a) => {
      if (search && !a.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (typeFilter !== "all" && (a.type || "vocal") !== typeFilter) return false;
      if (statusFilter !== "all" && a.status !== statusFilter) return false;
      return true;
    });
  }, [agents, search, typeFilter, statusFilter]);

  const activeCount = (agents || []).filter((a) => a.status === "active").length;
  const draftCount = (agents || []).filter((a) => a.status === "draft" || a.status === "inactive").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[26px] font-extrabold text-foreground">Agenti AI</h1>
          {(agents?.length || 0) > 0 && (
            <p className="text-sm text-muted-foreground mt-0.5">
              {activeCount} agenti attivi · {draftCount} in bozza
            </p>
          )}
        </div>
        <button
          onClick={() => navigate("/app/agents/new")}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-btn text-sm font-medium bg-brand text-white hover:bg-brand-hover transition-colors"
        >
          <Plus className="w-4 h-4" /> Nuovo Agente
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Cerca agente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-sm"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[160px] text-sm">
            <SelectValue placeholder="Tutti i tipi" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tutti i tipi</SelectItem>
            <SelectItem value="vocal">🎙️ Vocale</SelectItem>
            <SelectItem value="whatsapp">💬 WhatsApp</SelectItem>
            <SelectItem value="render">🎨 Render</SelectItem>
            <SelectItem value="operative">🔧 Operativo</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px] text-sm">
            <SelectValue placeholder="Tutti gli stati" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tutti gli stati</SelectItem>
            <SelectItem value="active">Attivi</SelectItem>
            <SelectItem value="draft">Bozza</SelectItem>
            <SelectItem value="inactive">Inattivi</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Caricamento...</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-card p-12 text-center border border-border bg-card shadow-card">
          {(agents?.length || 0) === 0 ? (
            <>
              {/* Empty state with 3 type icons */}
              <div className="flex gap-4 justify-center mb-8">
                <div className="w-16 h-16 rounded-full bg-brand-light flex items-center justify-center text-2xl">🎙️</div>
                <div className="w-16 h-16 rounded-full bg-[hsl(142,60%,94%)] flex items-center justify-center text-2xl">💬</div>
                <div className="w-16 h-16 rounded-full bg-settore-ristr-bg flex items-center justify-center text-2xl">🎨</div>
              </div>
              <p className="text-[22px] font-bold text-foreground">Crea il tuo primo Agente AI</p>
              <p className="text-[15px] text-muted-foreground mt-2 max-w-sm mx-auto">
                Scegli tra agenti vocali, WhatsApp, render e molto altro.
                Ogni agente è pre-configurato e pronto in pochi minuti.
              </p>
              <button
                onClick={() => navigate("/app/agents/new")}
                className="mt-6 px-8 py-3 bg-brand text-white rounded-btn text-base font-medium hover:bg-brand-hover transition-colors inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Scegli un Template
              </button>
              <p className="text-sm text-muted-foreground mt-3">
                <button
                  onClick={() => navigate("/app/agents/new?category=vocali")}
                  className="text-brand hover:underline"
                >
                  Più usato: Qualifica Lead Inbound →
                </button>
              </p>
            </>
          ) : (
            <>
              <p className="text-base font-medium text-foreground mb-2">Nessun risultato</p>
              <p className="text-sm text-muted-foreground">Prova a cambiare i filtri.</p>
            </>
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
