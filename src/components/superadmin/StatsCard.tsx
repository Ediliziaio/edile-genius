import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  icon: LucideIcon;
  value: string | number;
  label: string;
  delta?: string;
  deltaType?: "positive" | "negative" | "neutral";
}

export default function StatsCard({ icon: Icon, value, label, delta, deltaType = "neutral" }: StatsCardProps) {
  const deltaColors = {
    positive: "text-emerald-400 bg-emerald-400/10",
    negative: "text-red-400 bg-red-400/10",
    neutral: "text-[hsl(var(--app-text-secondary))] bg-[hsl(var(--app-elevated))]/50",
  };

  return (
    <div className="rounded-xl border border-[hsl(var(--app-border))] bg-[hsl(var(--app-secondary))] p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="h-10 w-10 rounded-lg bg-[hsl(var(--app-elevated))] flex items-center justify-center">
          <Icon className="h-5 w-5 text-[hsl(var(--app-accent))]" />
        </div>
        {delta && (
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${deltaColors[deltaType]}`}>
            {delta}
          </span>
        )}
      </div>
      <div className="text-3xl font-bold text-[hsl(var(--app-text-primary))] mb-1">{value}</div>
      <div className="text-sm text-[hsl(var(--app-text-secondary))]">{label}</div>
    </div>
  );
}
