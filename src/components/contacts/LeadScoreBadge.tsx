import { calculateLeadScore, type LeadScoreInput, type LeadScoreResult } from "@/lib/lead-score";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface LeadScoreBadgeProps {
  input: LeadScoreInput;
  compact?: boolean;
}

export default function LeadScoreBadge({ input, compact = false }: LeadScoreBadgeProps) {
  const result = calculateLeadScore(input);

  if (compact) {
    return (
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${result.bgColor} ${result.color} cursor-default`}>
              {result.emoji} {result.score}
            </span>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-[220px]">
            <p className="font-semibold text-xs mb-1">{result.label} — {result.score}/100</p>
            {result.factors.length > 0 && (
              <ul className="text-[10px] text-muted-foreground space-y-0.5">
                {result.factors.map((f, i) => (
                  <li key={i}>• {f}</li>
                ))}
              </ul>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${result.bgColor}`}>
      <span className="text-lg">{result.emoji}</span>
      <div>
        <p className={`text-sm font-bold ${result.color}`}>{result.label} — {result.score}/100</p>
        {result.factors.length > 0 && (
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {result.factors.slice(0, 3).join(" · ")}
          </p>
        )}
      </div>
    </div>
  );
}
