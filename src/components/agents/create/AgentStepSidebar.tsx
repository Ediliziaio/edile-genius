import { Bot, Mic, MessageSquare, Settings2, PlayCircle, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: 0, label: "Agente", sublabel: "Identità e prompt", icon: Bot },
  { id: 1, label: "Voce", sublabel: "Selezione e impostazioni", icon: Mic },
  { id: 2, label: "Conversazione", sublabel: "Flusso e timeout", icon: MessageSquare },
  { id: 3, label: "Avanzate", sublabel: "Knowledge base e tools", icon: Settings2 },
  { id: 4, label: "Revisione & Test", sublabel: "Riepilogo e prova", icon: PlayCircle },
];

interface AgentStepSidebarProps {
  currentStep: number;
  onStepChange: (step: number) => void;
  completedSteps: Set<number>;
}

export default function AgentStepSidebar({ currentStep, onStepChange, completedSteps }: AgentStepSidebarProps) {
  return (
    <nav className="w-56 shrink-0 space-y-1">
      {STEPS.map((step) => {
        const isActive = currentStep === step.id;
        const isCompleted = completedSteps.has(step.id);
        const Icon = step.icon;

        return (
          <button
            key={step.id}
            onClick={() => onStepChange(step.id)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-3 rounded-btn text-left transition-all group",
              isActive
                ? "bg-brand-light border border-brand-border"
                : "hover:bg-ink-50 border border-transparent"
            )}
          >
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold transition-colors",
                isActive
                  ? "bg-brand text-white"
                  : isCompleted
                  ? "bg-brand-muted text-brand-text"
                  : "bg-ink-100 text-ink-400"
              )}
            >
              {isCompleted && !isActive ? <Check className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
            </div>
            <div className="min-w-0">
              <p
                className={cn(
                  "text-sm font-medium truncate",
                  isActive ? "text-brand-text" : "text-ink-700"
                )}
              >
                {step.label}
              </p>
              <p className="text-[10px] text-ink-400 truncate">{step.sublabel}</p>
            </div>
          </button>
        );
      })}
    </nav>
  );
}

export { STEPS };
