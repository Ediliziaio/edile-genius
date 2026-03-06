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
      className="block rounded-card p-5 border border-ink-200 bg-white cursor-pointer transition-all hover:shadow-card-hover hover:scale-[1.01] shadow-card"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${isActive ? "bg-status-success shadow-[0_0_8px_rgba(34,197,94,0.5)]" : "bg-ink-300"}`} />
          <h3 className="font-semibold text-sm text-ink-900">{agent.name}</h3>
        </div>
        <MoreVertical className="w-4 h-4 text-ink-300" />
      </div>

      {agent.description && (
        <p className="text-xs mb-3 line-clamp-2 text-ink-500">{agent.description}</p>
      )}

      <div className="flex items-center gap-2 mb-4">
        <Badge className="text-[10px] px-2 py-0.5 bg-brand-light text-brand-text border-none">
          {agent.type === "vocal" ? "🎙️ Vocale" : agent.type}
        </Badge>
        {agent.use_case && (
          <Badge className="text-[10px] px-2 py-0.5 bg-ink-100 text-ink-500 border-none">{agent.use_case}</Badge>
        )}
      </div>

      <div className="flex items-center gap-4 text-xs text-ink-400">
        <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {agent.calls_total ?? 0}</span>
        <span className="flex items-center gap-1"><Activity className="w-3 h-3" /> {agent.calls_this_month ?? 0}/mese</span>
      </div>
    </Link>
  );
}
