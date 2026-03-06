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
            className={`text-left rounded-card p-4 transition-all border ${
              isSelected
                ? "border-brand bg-brand-light"
                : "border-ink-200 bg-ink-50 hover:border-ink-400"
            }`}
          >
            <span className="text-2xl">{uc.icon}</span>
            <p className="mt-2 text-sm font-medium text-ink-900">{uc.label}</p>
            <p className="text-xs mt-1 text-ink-500">{uc.description}</p>
          </button>
        );
      })}
    </div>
  );
}
