import { Phone, MoreVertical, Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import type { Tables } from "@/integrations/supabase/types";

interface AgentCardProps {
  agent: Tables<"agents">;
  onClick?: () => void;
}

export default function AgentCard({ agent, onClick }: AgentCardProps) {
  const isActive = agent.status === "active";

  return (
    <Link
      to={`/app/agents/${agent.id}`}
      onClick={onClick}
      className="block rounded-xl p-5 border cursor-pointer transition-all hover:scale-[1.01]"
      style={{
        backgroundColor: "hsl(var(--app-bg-secondary))",
        borderColor: "hsl(var(--app-border-subtle))",
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{
              backgroundColor: isActive ? "hsl(var(--app-success))" : "hsl(var(--app-text-tertiary))",
              boxShadow: isActive ? "0 0 8px hsl(var(--app-success) / 0.5)" : "none",
            }}
          />
          <h3 className="font-semibold text-sm" style={{ color: "hsl(var(--app-text-primary))" }}>
            {agent.name}
          </h3>
        </div>
        <MoreVertical className="w-4 h-4" style={{ color: "hsl(var(--app-text-tertiary))" }} />
      </div>

      {agent.description && (
        <p className="text-xs mb-3 line-clamp-2" style={{ color: "hsl(var(--app-text-secondary))" }}>
          {agent.description}
        </p>
      )}

      <div className="flex items-center gap-2 mb-4">
        <Badge className="text-[10px] px-2 py-0.5" style={{ backgroundColor: "hsl(var(--app-brand-dim))", color: "hsl(var(--app-brand))", border: "none" }}>
          {agent.type === "vocal" ? "🎙️ Vocale" : agent.type}
        </Badge>
        {agent.use_case && (
          <Badge className="text-[10px] px-2 py-0.5" style={{ backgroundColor: "hsl(var(--app-bg-tertiary))", color: "hsl(var(--app-text-secondary))", border: "none" }}>
            {agent.use_case}
          </Badge>
        )}
      </div>

      <div className="flex items-center gap-4 text-xs" style={{ color: "hsl(var(--app-text-tertiary))" }}>
        <span className="flex items-center gap-1">
          <Phone className="w-3 h-3" /> {agent.calls_total ?? 0}
        </span>
        <span className="flex items-center gap-1">
          <Activity className="w-3 h-3" /> {agent.calls_this_month ?? 0}/mese
        </span>
      </div>
    </Link>
  );
}
