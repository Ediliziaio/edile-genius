import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Search, Play, Pause, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface Voice {
  voice_id: string;
  name: string;
  preview_url: string;
  labels: Record<string, string>;
}

interface VoicePickerEnhancedProps {
  companyId: string;
  selected: string | null;
  onSelect: (voiceId: string) => void;
  voiceSettings: { stability: number; similarity: number; speed: number };
  onSettingsChange: (settings: { stability: number; similarity: number; speed: number }) => void;
}

const CATEGORIES = ["Tutti", "Professional", "Casual", "Young", "Old", "Male", "Female"] as const;

export default function VoicePickerEnhanced({ companyId, selected, onSelect, voiceSettings, onSettingsChange }: VoicePickerEnhancedProps) {
  const [voices, setVoices] = useState<Voice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("Tutti");
  const [playing, setPlaying] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase.functions.invoke("get-elevenlabs-voices", { body: { company_id: companyId } });
      if (data?.voices) setVoices(data.voices);
      setLoading(false);
    })();
  }, [companyId]);

  const togglePlay = (voice: Voice) => {
    if (playing === voice.voice_id) {
      audioRef.current?.pause();
      setPlaying(null);
    } else {
      if (audioRef.current) audioRef.current.pause();
      const audio = new Audio(voice.preview_url);
      audio.onended = () => setPlaying(null);
      audio.play();
      audioRef.current = audio;
      setPlaying(voice.voice_id);
    }
  };

  const filtered = voices.filter(v => {
    const matchSearch = !search || v.name.toLowerCase().includes(search.toLowerCase());
    if (category === "Tutti") return matchSearch;
    const labelsStr = Object.values(v.labels).join(" ").toLowerCase();
    return matchSearch && labelsStr.includes(category.toLowerCase());
  });

  return (
    <div className="space-y-6">
      {/* Search + Categories */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-300" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cerca voce..." className="pl-9 border border-ink-200 bg-ink-50 text-ink-900" />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={cn(
                "px-3 py-1 rounded-pill text-xs font-medium transition-all border",
                category === cat ? "bg-brand-light border-brand-border text-brand-text" : "bg-ink-50 border-ink-200 text-ink-500 hover:border-ink-300"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Voice Grid */}
      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-brand" /></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[320px] overflow-y-auto pr-1">
          {filtered.map(voice => {
            const isSelected = selected === voice.voice_id;
            const isPlaying = playing === voice.voice_id;
            const accent = voice.labels?.accent || "";
            const gender = voice.labels?.gender || "";

            return (
              <button
                key={voice.voice_id}
                onClick={() => onSelect(voice.voice_id)}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-btn text-left transition-all border",
                  isSelected ? "border-brand bg-brand-light" : "border-ink-200 bg-white hover:border-ink-300"
                )}
              >
                <button
                  onClick={e => { e.stopPropagation(); togglePlay(voice); }}
                  className="w-9 h-9 rounded-full bg-ink-100 flex items-center justify-center shrink-0 hover:bg-ink-200 transition-colors"
                >
                  {isPlaying ? <Pause className="w-3.5 h-3.5 text-brand" /> : <Play className="w-3.5 h-3.5 text-ink-500 ml-0.5" />}
                </button>
                <div className="min-w-0 flex-1">
                  <p className={cn("text-sm font-medium truncate", isSelected ? "text-brand-text" : "text-ink-900")}>{voice.name}</p>
                  <p className="text-[10px] text-ink-400 truncate">{[gender, accent].filter(Boolean).join(" · ")}</p>
                </div>
                {isSelected && <div className="w-2 h-2 rounded-full bg-brand shrink-0" />}
              </button>
            );
          })}
          {filtered.length === 0 && <p className="col-span-2 text-center text-sm text-ink-400 py-4">Nessuna voce trovata</p>}
        </div>
      )}

      {/* Voice Settings */}
      <div className="space-y-4 pt-4 border-t border-ink-200">
        <h3 className="text-sm font-semibold text-ink-700">Impostazioni Voce</h3>
        {[
          { key: "stability" as const, label: "Stabilità", min: 0, max: 1, step: 0.05, left: "Espressivo", right: "Stabile" },
          { key: "similarity" as const, label: "Somiglianza", min: 0, max: 1, step: 0.05, left: "Bassa", right: "Alta" },
          { key: "speed" as const, label: "Velocità", min: 0.7, max: 1.2, step: 0.05, left: "Lento", right: "Veloce" },
        ].map(s => (
          <div key={s.key} className="space-y-1.5">
            <Label className="text-xs text-ink-500">{s.label}: {voiceSettings[s.key].toFixed(2)}</Label>
            <Slider value={[voiceSettings[s.key]]} onValueChange={([v]) => onSettingsChange({ ...voiceSettings, [s.key]: v })} min={s.min} max={s.max} step={s.step} />
            <div className="flex justify-between text-[10px] text-ink-300"><span>{s.left}</span><span>{s.right}</span></div>
          </div>
        ))}
      </div>
    </div>
  );
}
