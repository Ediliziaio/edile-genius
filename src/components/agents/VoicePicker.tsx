import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Play, Square, Loader2 } from "lucide-react";

interface Voice {
  voice_id: string;
  name: string;
  preview_url: string;
  labels: Record<string, string>;
}

interface VoicePickerProps {
  companyId: string;
  selected: string | null;
  onSelect: (voiceId: string) => void;
}

export default function VoicePicker({ companyId, selected, onSelect }: VoicePickerProps) {
  const [voices, setVoices] = useState<Voice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playing, setPlaying] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    async function fetchVoices() {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke("get-elevenlabs-voices", {
        body: { company_id: companyId },
      });
      if (error || data?.error) {
        setError(data?.error || "Errore nel caricamento voci");
      } else {
        setVoices(data.voices || []);
      }
      setLoading(false);
    }
    if (companyId) fetchVoices();
  }, [companyId]);

  const togglePlay = (voice: Voice) => {
    if (playing === voice.voice_id) {
      audioRef.current?.pause();
      setPlaying(null);
      return;
    }
    if (audioRef.current) audioRef.current.pause();
    const audio = new Audio(voice.preview_url);
    audio.onended = () => setPlaying(null);
    audio.play();
    audioRef.current = audio;
    setPlaying(voice.voice_id);
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-8 justify-center" style={{ color: "hsl(var(--app-text-secondary))" }}>
        <Loader2 className="w-4 h-4 animate-spin" /> Caricamento voci...
      </div>
    );
  }

  if (error) {
    return <p className="text-sm py-4" style={{ color: "hsl(var(--app-error))" }}>{error}</p>;
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {voices.map((v) => {
        const isSelected = selected === v.voice_id;
        return (
          <button
            key={v.voice_id}
            type="button"
            onClick={() => onSelect(v.voice_id)}
            className="flex-shrink-0 w-40 rounded-xl p-3 transition-all border text-left"
            style={{
              backgroundColor: isSelected ? "hsl(var(--app-brand-dim))" : "hsl(var(--app-bg-tertiary))",
              borderColor: isSelected ? "hsl(var(--app-brand))" : "transparent",
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium truncate" style={{ color: "hsl(var(--app-text-primary))" }}>
                {v.name}
              </span>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); togglePlay(v); }}
                className="w-6 h-6 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "hsl(var(--app-brand-dim))" }}
              >
                {playing === v.voice_id ? (
                  <Square className="w-3 h-3" style={{ color: "hsl(var(--app-brand))" }} />
                ) : (
                  <Play className="w-3 h-3" style={{ color: "hsl(var(--app-brand))" }} />
                )}
              </button>
            </div>
            {v.labels?.accent && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: "hsl(var(--app-bg-elevated))", color: "hsl(var(--app-text-tertiary))" }}>
                {v.labels.accent}
              </span>
            )}
          </button>
        );
      })}
      {voices.length === 0 && (
        <p className="text-sm py-4" style={{ color: "hsl(var(--app-text-secondary))" }}>
          Nessuna voce disponibile. Configura la chiave API ElevenLabs.
        </p>
      )}
    </div>
  );
}
