import type { AgentScoreResult } from "@/lib/agent-score";
import { AlertTriangle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface AgentScoreBadgeProps {
  result: AgentScoreResult;
  size?: "sm" | "md";
}

export default function AgentScoreBadge({ result, size = "sm" }: AgentScoreBadgeProps) {
  const dim = size === "sm" ? 28 : 36;
  const stroke = size === "sm" ? 3 : 3.5;
  const r = (dim - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (result.score / 100) * circ;
  const fontSize = size === "sm" ? "text-[9px]" : "text-[11px]";

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1.5 cursor-default">
            {/* Circular progress */}
            <svg width={dim} height={dim} className="shrink-0 -rotate-90">
              <circle cx={dim / 2} cy={dim / 2} r={r} fill="none" strokeWidth={stroke} className="stroke-muted" />
              <circle
                cx={dim / 2} cy={dim / 2} r={r} fill="none" strokeWidth={stroke}
                strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
                className={result.colorClass.replace("text-", "stroke-")}
              />
            </svg>
            <span className={`${fontSize} font-bold ${result.colorClass}`}>{result.score}</span>

            {result.hasBlockers && (
              <AlertTriangle className="w-3 h-3 text-destructive shrink-0" />
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-[200px]">
          <p className="font-semibold text-xs">{result.label}</p>
          {result.hasBlockers && (
            <p className="text-[10px] text-destructive mt-1">
              {result.blockers.length} blocco{result.blockers.length > 1 ? "hi" : ""}: {result.blockers.join(", ")}
            </p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
