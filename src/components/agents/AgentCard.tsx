import { Phone, MoreVertical, Activity, Paintbrush, MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import type { Tables } from "@/integrations/supabase/types";

interface AgentCardProps {
  agent: Tables<"agents">;
  onClick?: () => void;
}

/* ── Type visual config ────────────────────────────── */

function getTypeConfig(type: string | null) {
  switch (type) {
    case "render":
      return {
        stripe: "bg-settore-ristr",
        badge: "🎨 RENDER",
        badgeCls: "bg-settore-ristr-bg text-settore-ristr",
      };
    case "whatsapp":
      return {
        stripe: "bg-[hsl(142,70%,49%)]",
        badge: "💬 WHATSAPP",
        badgeCls: "bg-[hsl(142,60%,94%)] text-[hsl(142,70%,30%)]",
      };
    case "operative":
      return {
        stripe: "bg-accent-blue",
        badge: "⚙️ OPERATIVO",
        badgeCls: "bg-status-info-light text-accent-blue",
      };
    default: // vocal
      return {
        stripe: "bg-brand",
        badge: "🎙️ VOCALE",
        badgeCls: "bg-brand-light text-brand-text",
      };
  }
}

export default function AgentCard({ agent, onClick }: AgentCardProps) {
  const isActive = agent.status === "active";
  const typeConfig = getTypeConfig(agent.type);

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
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                {/* Status dot */}
                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                  isActive ? "bg-status-success animate-pulse" : agent.status === "draft" ? "bg-ink-300" : "bg-destructive"
                }`} />
                {/* Type badge */}
                <Badge className={`text-[9px] font-mono uppercase px-2 py-0.5 border-none ${typeConfig.badgeCls}`}>
                  {typeConfig.badge}
                </Badge>
                {/* Name */}
                <h3 className="text-[15px] font-bold text-foreground">{agent.name}</h3>
              </div>

              {/* Template origin */}
              {agent.use_case && (
                <p className="text-[11px] text-muted-foreground font-mono ml-5">
                  Da: {agent.use_case}
                </p>
              )}
            </div>
            <MoreVertical className="w-4 h-4 text-ink-300 shrink-0" />
          </div>

          {agent.description && (
            <p className="text-xs mb-3 line-clamp-2 text-muted-foreground">{agent.description}</p>
          )}

          {/* Contextual metrics per type */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            {(agent.type === "render") ? (
              <>
                <span className="flex items-center gap-1"><Paintbrush className="w-3 h-3" /> {agent.calls_total ?? 0} render</span>
              </>
            ) : (agent.type === "whatsapp") ? (
              <>
                <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" /> {agent.calls_total ?? 0} conversazioni</span>
              </>
            ) : (
              <>
                <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {agent.calls_total ?? 0} chiamate</span>
                <span className="flex items-center gap-1"><Activity className="w-3 h-3" /> {(agent as any).calls_month ?? 0}/mese</span>
              </>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
