import { Bot, Mic, Settings2, PlayCircle, Check, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: 0, label: "Il Tuo Agente", sublabel: "Nome e personalità", icon: Bot },
  { id: 1, label: "Scegli la Voce", sublabel: "Come parla il tuo agente", icon: Mic },
  { id: 2, label: "Impostazioni", sublabel: "Opzioni avanzate", icon: Settings2 },
  { id: 3, label: "Rivedi e Attiva", sublabel: "Controlla e pubblica", icon: PlayCircle },
];

interface AgentStepSidebarProps {
  currentStep: number;
  onStepChange: (step: number) => void;
  completedSteps: Set<number>;
  validatedSteps: Set<number>;
}

export default function AgentStepSidebar({ currentStep, onStepChange, completedSteps, validatedSteps }: AgentStepSidebarProps) {
  const safeCompleted = completedSteps ?? new Set<number>();
  const safeValidated = validatedSteps ?? new Set<number>();
  return (
    <nav className="w-56 shrink-0 space-y-1">
      {STEPS.map((step) => {
        const isActive = currentStep === step.id;
        const wasVisited = safeCompleted.has(step.id);
        const isValid = safeValidated.has(step.id);
        const showCheck = wasVisited && isValid && !isActive;
        const showWarning = wasVisited && !isValid && !isActive;
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
                  : showCheck
                  ? "bg-brand-muted text-brand-text"
                  : showWarning
                  ? "bg-amber-100 text-amber-600"
                  : "bg-ink-100 text-ink-400"
              )}
            >
              {showCheck ? <Check className="w-3.5 h-3.5" /> : showWarning ? <AlertCircle className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
            </div>
            <div className="min-w-0">
              <p
                className={cn(
                  "text-sm font-medium truncate",
                  isActive ? "text-brand-text" : showWarning ? "text-amber-700" : "text-ink-700"
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
