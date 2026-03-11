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

  const missingRequired = result.blockers.length;

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1.5 cursor-default">
            <svg width={dim} height={dim} className="shrink-0 -rotate-90">
              <circle cx={dim / 2} cy={dim / 2} r={r} fill="none" strokeWidth={stroke} className="stroke-muted" />
              <circle
                cx={dim / 2} cy={dim / 2} r={r} fill="none" strokeWidth={stroke}
                strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
                className={result.colorClass.replace("text-", "stroke-")}
              />
            </svg>
            <span className={`text-[11px] font-semibold ${result.colorClass}`}>{result.label}</span>

            {result.hasBlockers && (
              <AlertTriangle className="w-3 h-3 text-status-warning shrink-0" />
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-[220px]">
          <p className="font-semibold text-xs">{result.label} — {result.score}/100</p>
          {missingRequired > 0 && (
            <p className="text-[10px] text-status-warning mt-1">
              {missingRequired} passagg{missingRequired > 1 ? "i obbligatori mancanti" : "io obbligatorio mancante"}
            </p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
