import { memo } from "react";
import { Solution, settoreConfig, tipoAIConfig } from "@/data/solutions";

interface SolutionCardProps {
  solution: Solution;
  onOpenDetail: (id: number) => void;
}

const SolutionCard = memo(({ solution, onOpenDetail }: SolutionCardProps) => {
  const config = settoreConfig[solution.settore];
  const aiConfig = tipoAIConfig[solution.tipoAI];

  return (
    <div
      className="group bg-white rounded-[20px] border border-neutral-200 overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:-translate-y-1 transition-all duration-[220ms] ease-out cursor-pointer will-change-transform"
      style={{ ['--hover-border' as string]: `${config.color}80` }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = `${config.color}80`)}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = '')}
      onClick={() => onOpenDetail(solution.id)}
    >
      {/* Header */}
      <div className="p-6 pb-5" style={{ backgroundColor: config.colorBg }}>
        <div className="flex items-center justify-between mb-3">
          <span
            className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full font-medium"
            style={{ backgroundColor: `${config.color}15`, color: config.color }}
          >
            {config.emoji} {config.label}
          </span>
          <span className="font-mono text-[10px] bg-neutral-800 text-white px-2 py-1 rounded-full">
            #{String(solution.id).padStart(2, '0')}
          </span>
        </div>
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center text-[32px] mt-3"
          style={{ backgroundColor: `${config.color}12` }}
        >
          {solution.icon}
        </div>
        <h3 className="font-display text-lg font-bold text-neutral-900 mt-3 leading-snug">
          {solution.title}
        </h3>
      </div>

      {/* Body */}
      <div className="px-6 py-5">
        <p className="font-body text-sm text-neutral-500 leading-relaxed line-clamp-3">
          {solution.description}
        </p>
        <div className="border-t border-neutral-100 my-4" />
        <ul className="space-y-1.5">
          {solution.bullets.map((b, i) => (
            <li key={i} className="flex gap-2 items-start">
              <span className="text-xs mt-0.5" style={{ color: config.color }}>✓</span>
              <span className="font-mono text-xs text-neutral-600">{b}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4">
          <span className="inline-block bg-neutral-900 text-primary font-mono text-[11px] px-3 py-1.5 rounded-lg">
            {solution.roiChip}
          </span>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-neutral-50 border-t border-neutral-100 px-6 py-4 flex items-center justify-between">
        <span
          className="font-mono text-[11px] font-medium px-2.5 py-1 rounded-full"
          style={{ backgroundColor: `${aiConfig.color}15`, color: aiConfig.color }}
        >
          {aiConfig.label}
        </span>
        <button
          className="font-display text-[13px] font-semibold transition-colors group-hover:underline flex items-center gap-1"
          style={{ color: config.color }}
          aria-label={`Scopri di più su ${solution.title}`}
        >
          Scopri di più
          <span className="inline-block group-hover:translate-x-0.5 transition-transform">→</span>
        </button>
      </div>
    </div>
  );
});

SolutionCard.displayName = "SolutionCard";
export default SolutionCard;
