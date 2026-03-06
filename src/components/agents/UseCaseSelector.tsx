import { USE_CASES, type UseCaseId } from "./PromptTemplates";

interface UseCaseSelectorProps {
  selected: UseCaseId | null;
  onSelect: (id: UseCaseId) => void;
}

export default function UseCaseSelector({ selected, onSelect }: UseCaseSelectorProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {USE_CASES.map((uc) => {
        const isSelected = selected === uc.id;
        return (
          <button
            key={uc.id}
            type="button"
            onClick={() => onSelect(uc.id)}
            className="text-left rounded-xl p-4 transition-all border"
            style={{
              backgroundColor: isSelected ? "hsl(var(--app-brand-dim))" : "hsl(var(--app-bg-tertiary))",
              borderColor: isSelected ? "hsl(var(--app-brand))" : "transparent",
            }}
          >
            <span className="text-2xl">{uc.icon}</span>
            <p className="mt-2 text-sm font-medium" style={{ color: "hsl(var(--app-text-primary))" }}>
              {uc.label}
            </p>
            <p className="text-xs mt-1" style={{ color: "hsl(var(--app-text-secondary))" }}>
              {uc.description}
            </p>
          </button>
        );
      })}
    </div>
  );
}
