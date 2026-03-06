import VoicePickerEnhanced from "@/components/agents/VoicePickerEnhanced";

interface StepVoiceProps {
  companyId: string;
  form: any;
  update: (key: string, value: any) => void;
}

export default function StepVoice({ companyId, form, update }: StepVoiceProps) {
  const voiceSettings = {
    stability: form.voice_stability ?? 0.5,
    similarity: form.voice_similarity ?? 0.75,
    speed: form.voice_speed ?? 1.0,
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-ink-900">Voce</h2>
        <p className="text-sm text-ink-400 mt-1">Scegli la voce del tuo agente e regola le impostazioni audio.</p>
      </div>

      <VoicePickerEnhanced
        companyId={companyId}
        selected={form.voice_id || null}
        onSelect={v => update("voice_id", v)}
        voiceSettings={voiceSettings}
        onSettingsChange={s => {
          update("voice_stability", s.stability);
          update("voice_similarity", s.similarity);
          update("voice_speed", s.speed);
        }}
      />
    </div>
  );
}
