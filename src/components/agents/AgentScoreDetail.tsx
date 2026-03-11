import { computeAgentScore, type AgentScoreResult } from "@/lib/agent-score";
import { CheckCircle2, XCircle, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import type { Tables } from "@/integrations/supabase/types";

interface AgentScoreDetailProps {
  agent: Tables<"agents">;
  defaultOpen?: boolean;
}

export default function AgentScoreDetail({ agent, defaultOpen = false }: AgentScoreDetailProps) {
  const result = computeAgentScore(agent);
  const [open, setOpen] = useState(defaultOpen);

  const dim = 56;
  const stroke = 4;
  const r = (dim - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (result.score / 100) * circ;

  const completedCount = result.factors.filter(f => f.achieved).length;
  const missingRequired = result.factors.filter(f => f.isBlocker && !f.achieved).length;

  return (
    <div className="rounded-card border border-border bg-card overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <svg width={dim} height={dim} className="shrink-0 -rotate-90">
              <circle cx={dim / 2} cy={dim / 2} r={r} fill="none" strokeWidth={stroke} className="stroke-muted" />
              <circle
                cx={dim / 2} cy={dim / 2} r={r} fill="none" strokeWidth={stroke}
                strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
                className={result.colorClass.replace("text-", "stroke-")}
              />
            </svg>
            <span className={`absolute inset-0 flex items-center justify-center text-sm font-bold ${result.colorClass}`}>
              {result.score}
            </span>
          </div>

          <div className="text-left">
            <p className={`text-sm font-semibold ${result.colorClass}`}>{result.label}</p>
            <p className="text-[11px] text-muted-foreground">
              {completedCount}/{result.factors.length} passaggi completati
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {missingRequired > 0 && (
            <span className="flex items-center gap-1 text-[10px] font-medium text-status-warning bg-status-warning-light px-2 py-0.5 rounded-full">
              <AlertTriangle className="w-3 h-3" />
              {missingRequired} obbligator{missingRequired === 1 ? "io" : "i"}
            </span>
          )}
          {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </button>

      {open && (
        <div className="border-t border-border divide-y divide-border">
          {result.factors.map(f => (
            <div key={f.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
              {f.achieved ? (
                <CheckCircle2 className="w-4 h-4 text-status-success shrink-0" />
              ) : f.isBlocker ? (
                <XCircle className="w-4 h-4 text-status-warning shrink-0" />
              ) : (
                <XCircle className="w-4 h-4 text-muted-foreground/50 shrink-0" />
              )}

              <div className="flex-1 min-w-0">
                <span className={`${f.achieved ? "text-foreground" : "text-muted-foreground"}`}>
                  {f.label}
                </span>
                {!f.achieved && f.action && (
                  <p className="text-[10px] text-muted-foreground mt-0.5">{f.action}</p>
                )}
              </div>

              {f.isBlocker && !f.achieved && (
                <span className="text-[9px] font-semibold text-status-warning bg-status-warning-light px-1.5 py-0.5 rounded shrink-0">
                  OBBLIGATORIO
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
