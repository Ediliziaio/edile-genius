import { Phone, Activity, Paintbrush, MessageSquare, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import type { Tables } from "@/integrations/supabase/types";
import { computeAgentScore } from "@/lib/agent-score";

interface AgentCardProps {
  agent: Tables<"agents">;
  onClick?: () => void;
}

/* ── Status config ────────────────────────────── */

function getStatusConfig(status: string | null, hasBlockers: boolean) {
  if (hasBlockers && status !== "active") {
    return { label: "Da completare", cls: "bg-status-warning-light text-status-warning" };
  }
  switch (status) {
    case "active":
      return { label: "Attivo", cls: "bg-status-success-light text-status-success" };
    case "inactive":
      return { label: "Inattivo", cls: "bg-destructive/10 text-destructive" };
    default:
      return { label: "Bozza", cls: "bg-muted text-muted-foreground" };
  }
}

/* ── Type visual config ────────────────────────────── */

function getTypeConfig(type: string | null) {
  switch (type) {
    case "render":
      return { stripe: "bg-settore-ristr", label: "Render", icon: "🎨" };
    case "whatsapp":
      return { stripe: "bg-[hsl(142,70%,49%)]", label: "WhatsApp", icon: "💬" };
    case "operative":
      return { stripe: "bg-accent-blue", label: "Operativo", icon: "⚙️" };
    default:
      return { stripe: "bg-brand", label: "Vocale", icon: "🎙️" };
  }
}

export default function AgentCard({ agent, onClick }: AgentCardProps) {
  const typeConfig = getTypeConfig(agent.type);
  const scoreResult = computeAgentScore(agent);
  const statusConfig = getStatusConfig(agent.status, scoreResult.hasBlockers);
  const hasActivity = (agent.calls_total ?? 0) > 0;

  return (
    <Link
      to={`/app/agents/${agent.id}`}
      onClick={onClick}
      className="block rounded-card border border-border bg-card cursor-pointer transition-all hover:shadow-card-hover hover:scale-[1.01] shadow-card overflow-hidden"
    >
      <div className="flex">
        {/* Left color stripe */}
        <div className={`w-1 self-stretch shrink-0 ${typeConfig.stripe}`} />

        {/* Content */}
        <div className="flex-1 px-5 py-4">
          {/* Row 1: Type + Name + Status pill */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-base shrink-0">{typeConfig.icon}</span>
              <h3 className="text-[15px] font-bold text-foreground truncate">{agent.name}</h3>
            </div>
            <Badge className={`text-[10px] font-semibold px-2.5 py-0.5 border-none shrink-0 ml-2 ${statusConfig.cls}`}>
              {statusConfig.label}
            </Badge>
          </div>

          {/* Row 2: Description or type label */}
          {agent.description ? (
            <p className="text-xs mb-3 line-clamp-2 text-muted-foreground">{agent.description}</p>
          ) : (
            <p className="text-xs mb-3 text-muted-foreground">Agente {typeConfig.label}</p>
          )}

          {/* Row 3: Metrics + Score text */}
          <div className="flex items-center justify-between">
            <div className="text-xs text-muted-foreground">
              {hasActivity ? (
                <div className="flex items-center gap-4">
                  {(agent.type === "render") ? (
                    <span className="flex items-center gap-1"><Paintbrush className="w-3 h-3" /> {agent.calls_total} render</span>
                  ) : (agent.type === "whatsapp") ? (
                    <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" /> {agent.calls_total} conversazioni</span>
                  ) : (
                    <>
                      <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {agent.calls_total} chiamate</span>
                      {((agent as any).calls_month ?? 0) > 0 && (
                        <span className="flex items-center gap-1"><Activity className="w-3 h-3" /> {(agent as any).calls_month}/mese</span>
                      )}
                    </>
                  )}
                </div>
              ) : (
                <span className="text-muted-foreground/60">Nessuna attività</span>
              )}
            </div>

            {/* Score as readable text */}
            <span className={`text-[11px] font-semibold ${scoreResult.colorClass}`}>
              {scoreResult.label}
            </span>
          </div>

          {/* Blocker banner */}
          {scoreResult.hasBlockers && agent.status !== "active" && (
            <div className="mt-3 -mx-5 -mb-4 px-5 py-2 bg-status-warning-light/50 border-t border-status-warning/20 flex items-center gap-1.5">
              <AlertTriangle className="w-3 h-3 text-status-warning shrink-0" />
              <span className="text-[11px] text-status-warning font-medium">
                Configurazione incompleta — {scoreResult.blockers.length} passagg{scoreResult.blockers.length === 1 ? "io obbligatorio" : "i obbligatori"}
              </span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
