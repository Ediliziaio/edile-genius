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
    positive: "text-status-success bg-status-success-light",
    negative: "text-status-error bg-status-error-light",
    neutral: "text-ink-500 bg-ink-100",
  };

  return (
    <div className="rounded-card border border-ink-200 bg-white p-6 shadow-card">
      <div className="flex items-center justify-between mb-4">
        <div className="h-10 w-10 rounded-btn bg-brand-light flex items-center justify-center">
          <Icon className="h-5 w-5 text-brand" />
        </div>
        {delta && (
          <span className={`text-xs font-medium px-2 py-1 rounded-pill ${deltaColors[deltaType]}`}>
            {delta}
          </span>
        )}
      </div>
      <div className="text-3xl font-bold text-ink-900 mb-1">{value}</div>
      <div className="text-sm text-ink-500">{label}</div>
    </div>
  );
}
