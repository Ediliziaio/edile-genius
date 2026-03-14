import { useState, useMemo } from "react";
import { useCompanyId } from "@/hooks/useCompanyId";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Plus, Search, RotateCcw, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AgentCard from "@/components/agents/AgentCard";
import { computeAgentScore } from "@/lib/agent-score";

type StatusFilter = "all" | "active" | "incomplete" | "draft";

const RENDER_SHORTCUTS = [
  { name: "Infissi", icon: "🪟", route: "/app/render/new", desc: "Serramenti e finestre" },
  { name: "Bagno", icon: "🛁", route: "/app/render-bagno/new", desc: "Ristrutturazione bagno" },
  { name: "Facciata", icon: "🏢", route: "/app/render-facciata/new", desc: "Cappotto e intonaco" },
  { name: "Persiane", icon: "🪞", route: "/app/render-persiane/new", desc: "Stili e materiali" },
  { name: "Pavimento", icon: "🧱", route: "/app/render-pavimento/new", desc: "Posa e finiture" },
  { name: "Stanza", icon: "🛋️", route: "/app/render-stanza/new", desc: "Interior design" },
  { name: "Tetto", icon: "🏠", route: "/app/render-tetto/new", desc: "Coperture e manti" },
];

const STATUS_PILLS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "Tutti" },
  { value: "active", label: "Attivi" },
  { value: "incomplete", label: "Da completare" },
  { value: "draft", label: "Bozza" },
];

export default function AgentsPage() {
  const companyId = useCompanyId();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

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
      if (statusFilter === "active" && a.status !== "active") return false;
      if (statusFilter === "draft" && a.status !== "draft" && a.status !== "inactive") return false;
      if (statusFilter === "incomplete") {
        const score = computeAgentScore(a);
        if (!score.hasBlockers) return false;
      }
      return true;
    });
  }, [agents, search, typeFilter, statusFilter]);

  const activeCount = (agents || []).filter((a) => a.status === "active").length;
  const draftCount = (agents || []).filter((a) => a.status === "draft" || a.status === "inactive").length;
  const incompleteCount = (agents || []).filter((a) => computeAgentScore(a).hasBlockers).length;

  const hasFilters = search || typeFilter !== "all" || statusFilter !== "all";
  const resetFilters = () => { setSearch(""); setTypeFilter("all"); setStatusFilter("all"); };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[26px] font-extrabold text-foreground">Agenti AI</h1>
          {(agents?.length || 0) > 0 && (
            <p className="text-sm text-muted-foreground mt-0.5">
              {activeCount} attiv{activeCount === 1 ? "o" : "i"} · {draftCount} in bozza
              {incompleteCount > 0 && <> · <span className="text-status-warning">{incompleteCount} da completare</span></>}
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

      {/* Status pills + Type filter + Search */}
      <div className="space-y-3">
        {/* Status pills */}
        <div className="flex items-center gap-2 flex-wrap">
          {STATUS_PILLS.map((pill) => (
            <button
              key={pill.value}
              onClick={() => setStatusFilter(pill.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                statusFilter === pill.value
                  ? "bg-brand text-white"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {pill.label}
              {pill.value === "incomplete" && incompleteCount > 0 && (
                <span className="ml-1 text-[10px] opacity-80">({incompleteCount})</span>
              )}
            </button>
          ))}
        </div>

        {/* Search + Type */}
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
              <SelectItem value="vocal">Vocale</SelectItem>
              <SelectItem value="whatsapp">WhatsApp</SelectItem>
              <SelectItem value="render">Render</SelectItem>
              <SelectItem value="operative">Operativo</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Caricamento...</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-card p-12 text-center border border-border bg-card shadow-card">
          {(agents?.length || 0) === 0 ? (
            <>
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
            </>
          ) : (
            <>
              <p className="text-base font-medium text-foreground mb-2">Nessun risultato</p>
              <p className="text-sm text-muted-foreground mb-4">Prova a cambiare i filtri di ricerca.</p>
              <button
                onClick={resetFilters}
                className="inline-flex items-center gap-1.5 text-sm text-brand hover:underline font-medium"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reimposta filtri
              </button>
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

      {/* Render AI Shortcuts */}
      <div className="pt-2">
        <div className="mb-3">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            🎨 Strumenti Render AI
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">Genera render fotorealistici per i tuoi clienti</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {RENDER_SHORTCUTS.map((r) => (
            <button
              key={r.name}
              onClick={() => navigate(r.route)}
              className="group flex items-center gap-3 p-3 rounded-card border border-border bg-card hover:border-brand/40 hover:shadow-md transition-all text-left"
            >
              <span className="text-2xl shrink-0">{r.icon}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground truncate">{r.name}</p>
                <p className="text-xs text-muted-foreground truncate">{r.desc}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-brand transition-colors shrink-0" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
