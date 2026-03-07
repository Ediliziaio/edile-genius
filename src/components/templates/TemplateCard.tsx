import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Clock, Users } from "lucide-react";

interface TemplateCardProps {
  slug: string;
  name: string;
  description: string | null;
  icon: string;
  channel: string[];
  estimated_setup_min: number;
  difficulty: string;
  is_featured: boolean;
  installs_count: number;
  disabled?: boolean;
}

const difficultyStyles: Record<string, string> = {
  facile: "bg-primary-light text-brand-text",
  medio: "bg-status-warning-light text-amber-700",
  avanzato: "bg-purple-100 text-purple-700",
};

export default function TemplateCard({
  slug, name, description, icon, channel,
  estimated_setup_min, difficulty, is_featured,
  installs_count, disabled,
}: TemplateCardProps) {
  const navigate = useNavigate();

  return (
    <div
      className={`bg-card border border-border rounded-card shadow-card overflow-hidden transition-all ${
        disabled
          ? "opacity-60 cursor-not-allowed"
          : "hover:shadow-card-hover hover:border-ink-300 hover:-translate-y-1 cursor-pointer"
      }`}
      onClick={() => !disabled && navigate(`/app/templates/${slug}`)}
    >
      {/* Preview header */}
      <div className="h-[140px] bg-gradient-to-br from-primary-light to-brand-muted border-b border-border relative overflow-hidden px-5 py-5">
        {is_featured && !disabled && (
          <span className="absolute top-3 right-3 text-[10px] font-bold uppercase tracking-wider bg-brand text-primary-foreground px-2.5 py-1 rounded-pill">
            ⭐ Consigliato
          </span>
        )}
        {disabled && (
          <span className="absolute top-3 right-3 text-[10px] font-bold uppercase tracking-wider bg-ink-400 text-primary-foreground px-2.5 py-1 rounded-pill">
            Presto
          </span>
        )}
        <div className="w-12 h-12 bg-card rounded-xl shadow-card flex items-center justify-center text-3xl">
          {icon}
        </div>
        {/* Decorative dots */}
        <div className="absolute inset-0 opacity-[0.06]" style={{
          backgroundImage: "radial-gradient(circle, currentColor 1px, transparent 1px)",
          backgroundSize: "16px 16px",
        }} />
      </div>

      {/* Content */}
      <div className="px-5 py-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-base font-bold text-foreground leading-tight">{name}</h3>
          <div className="flex gap-1 shrink-0">
            {channel.map((ch) => (
              <span key={ch} className="text-[10px] font-mono uppercase bg-muted text-muted-foreground px-2 py-0.5 rounded-pill">
                {ch}
              </span>
            ))}
          </div>
        </div>

        <p className="text-[13px] text-muted-foreground mt-1.5 line-clamp-2">{description}</p>

        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border text-xs text-muted-foreground">
          <Clock size={12} />
          <span>{estimated_setup_min} min setup</span>
          <span>·</span>
          <span className={`px-2 py-0.5 rounded-pill text-[10px] font-semibold ${difficultyStyles[difficulty] || ""}`}>
            {difficulty}
          </span>
          <span className="ml-auto flex items-center gap-1">
            <Users size={12} />
            {installs_count}
          </span>
        </div>

        <Button
          className="w-full mt-3"
          disabled={disabled}
          onClick={(e) => {
            e.stopPropagation();
            if (!disabled) navigate(`/app/templates/${slug}`);
          }}
        >
          {disabled ? "In arrivo" : "Configura →"}
        </Button>
      </div>
    </div>
  );
}
