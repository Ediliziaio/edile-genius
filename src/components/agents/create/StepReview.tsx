import { LANGUAGES } from "@/components/agents/PromptTemplates";
import { Badge } from "@/components/ui/badge";

interface StepReviewProps {
  form: any;
  update: (key: string, value: any) => void;
}

const LLM_LABELS: Record<string, string> = {
  "gpt-4o-mini": "GPT-4o Mini",
  "gpt-4o": "GPT-4o",
  "gpt-4.1-mini": "GPT-4.1 Mini",
  "gpt-4.1": "GPT-4.1",
  "claude-3.5-sonnet": "Claude 3.5 Sonnet",
  "claude-3-haiku": "Claude 3 Haiku",
  "gemini-2.0-flash": "Gemini 2.0 Flash",
};

export default function StepReview({ form, update }: StepReviewProps) {
  const langLabel = LANGUAGES.find(l => l.value === form.language)?.label || form.language;

  const sections = [
    {
      title: "Identità",
      rows: [
        ["Nome", form.name || "—"],
        ["Caso d'uso", form.use_case || "—"],
        ["Settore", form.sector || "—"],
        ["Lingua", langLabel],
        ["Modello LLM", LLM_LABELS[form.llm_model] || form.llm_model],
        ["Temperatura", form.temperature.toFixed(1)],
      ],
    },
    {
      title: "Voce",
      rows: [
        ["Voice ID", form.voice_id ? `${form.voice_id.slice(0, 16)}…` : "Non selezionata"],
        ["Stabilità", form.voice_stability?.toFixed(2) ?? "0.50"],
        ["Somiglianza", form.voice_similarity?.toFixed(2) ?? "0.75"],
        ["Velocità", form.voice_speed?.toFixed(2) ?? "1.00"],
      ],
    },
    {
      title: "Conversazione",
      rows: [
        ["Turn Timeout", `${form.turn_timeout_sec}s`],
        ["Reattività", form.turn_eagerness],
        ["Durata max", `${Math.floor(form.max_duration_sec / 60)} min`],
        ["Interruzioni", form.interruptions_enabled ? "Sì" : "No"],
        ["End Call auto", form.end_call_enabled ? "Sì" : "No"],
        ["Language Detection", form.language_detection_enabled ? "Sì" : "No"],
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-ink-900">Revisione & Pubblica</h2>
        <p className="text-sm text-ink-400 mt-1">Controlla le impostazioni prima di creare l'agente.</p>
      </div>

      {sections.map(section => (
        <div key={section.title} className="rounded-card border border-ink-200 bg-white overflow-hidden">
          <div className="px-4 py-2.5 bg-ink-50 border-b border-ink-200">
            <h3 className="text-xs font-semibold text-ink-500 uppercase tracking-wide">{section.title}</h3>
          </div>
          <div className="divide-y divide-ink-100">
            {section.rows.map(([label, value]) => (
              <div key={label as string} className="flex justify-between px-4 py-2.5 text-sm">
                <span className="text-ink-400">{label}</span>
                <span className="text-ink-900 font-medium">{value}</span>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* System Prompt Preview */}
      {form.system_prompt && (
        <div className="rounded-card border border-ink-200 bg-white overflow-hidden">
          <div className="px-4 py-2.5 bg-ink-50 border-b border-ink-200">
            <h3 className="text-xs font-semibold text-ink-500 uppercase tracking-wide">System Prompt</h3>
          </div>
          <pre className="p-4 text-xs text-ink-700 font-mono-brand whitespace-pre-wrap max-h-[200px] overflow-y-auto">{form.system_prompt}</pre>
        </div>
      )}

      {/* Publish Mode */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-ink-600">Modalità pubblicazione</p>
        <div className="flex gap-3">
          {(["draft", "active"] as const).map(s => (
            <button
              key={s}
              onClick={() => update("status", s)}
              className={`flex-1 py-3 rounded-btn text-sm font-medium border transition-all ${form.status === s ? "border-brand bg-brand-light text-brand-text" : "border-ink-200 text-ink-500 bg-ink-50"}`}
            >
              {s === "draft" ? "🔒 Bozza" : "🟢 Attivo"}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
