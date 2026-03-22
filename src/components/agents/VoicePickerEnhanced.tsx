import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Search, Play, Pause, Loader2, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface Voice {
  voice_id: string;
  name: string;
  preview_url: string;
  labels: Record<string, string>;
  category?: string;
  gender?: string | null;
  accent?: string | null;
  age?: string | null;
  use_case?: string | null;
}

interface VoicePickerEnhancedProps {
  companyId: string;
  selected: string | null;
  onSelect: (voiceId: string) => void;
  voiceSettings: { stability: number; similarity: number; speed: number };
  onSettingsChange: (settings: { stability: number; similarity: number; speed: number }) => void;
}

export default function VoicePickerEnhanced({ companyId, selected, onSelect, voiceSettings, onSettingsChange }: VoicePickerEnhancedProps) {
  const [voices, setVoices] = useState<Voice[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [search, setSearch] = useState("");
  const [genderFilter, setGenderFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [playing, setPlaying] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    let cancelled = false;
    setFetchError(false);
    setVoices([]);
    setLoading(true);

    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke("get-elevenlabs-voices", { body: { company_id: companyId } });
        if (cancelled) return;
        if (error || !data?.voices) {
          setFetchError(true);
          toast({ variant: "destructive", title: "Errore", description: "Impossibile caricare le voci ElevenLabs." });
        } else {
          setVoices(data.voices);
        }
      } catch {
        if (!cancelled) {
          setFetchError(true);
          toast({ variant: "destructive", title: "Errore", description: "Impossibile caricare le voci ElevenLabs." });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [companyId]);

  const togglePlay = (voice: Voice) => {
    if (playing === voice.voice_id) {
      audioRef.current?.pause();
      setPlaying(null);
    } else {
      if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
      const audio = new Audio(voice.preview_url);
      audio.onended = () => setPlaying(null);
      audio.onerror = () => {
        setPlaying(null);
        toast({ variant: "destructive", title: "Errore riproduzione", description: "Impossibile riprodurre l'anteprima vocale." });
      };
      audio.play().catch(() => {
        setPlaying(null);
        toast({ variant: "destructive", title: "Errore riproduzione", description: "Impossibile riprodurre l'anteprima vocale." });
      });
      audioRef.current = audio;
      setPlaying(voice.voice_id);
    }
  };

  const filtered = voices.filter(v => {
    const matchSearch = !search || v.name.toLowerCase().includes(search.toLowerCase());
    const matchGender = genderFilter === "all" || (v.gender || v.labels?.gender || "").toLowerCase() === genderFilter;
    const matchCategory = categoryFilter === "all" || (v.category || "").toLowerCase() === categoryFilter;
    return matchSearch && matchGender && matchCategory;
  });

  const categoryColor = (cat?: string) => {
    if (cat === "premade") return "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300";
    if (cat === "generated" || cat === "cloned") return "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300";
    return "bg-muted text-muted-foreground";
  };

  return (
    <div className="space-y-6">
      {/* Search + Filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-300" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cerca voce..." className="pl-9 border border-ink-200 bg-ink-50 text-ink-900" />
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={genderFilter} onValueChange={setGenderFilter}>
            <SelectTrigger className="w-[120px] h-8 text-xs border-ink-200"><SelectValue placeholder="Genere" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutti</SelectItem>
              <SelectItem value="male">Maschile</SelectItem>
              <SelectItem value="female">Femminile</SelectItem>
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[130px] h-8 text-xs border-ink-200"><SelectValue placeholder="Categoria" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutte</SelectItem>
              <SelectItem value="premade">Premade</SelectItem>
              <SelectItem value="generated">Generate</SelectItem>
              <SelectItem value="cloned">Clonate</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Voice Grid */}
      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-brand" /></div>
      ) : fetchError ? (
        <div className="flex flex-col items-center gap-2 py-8 text-destructive">
          <AlertCircle className="w-5 h-5" />
          <p className="text-sm">Impossibile caricare le voci. Controlla la configurazione API ElevenLabs.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[320px] overflow-y-auto pr-1">
          {filtered.map(voice => {
            const isSelected = selected === voice.voice_id;
            const isPlaying = playing === voice.voice_id;
            const gender = voice.gender || voice.labels?.gender || "";
            const accent = voice.accent || voice.labels?.accent || "";
            const useCase = voice.use_case || voice.labels?.use_case || "";

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
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {voice.category && <Badge variant="secondary" className={`text-[9px] px-1 py-0 ${categoryColor(voice.category)}`}>{voice.category}</Badge>}
                    {gender && <Badge variant="outline" className="text-[9px] px-1 py-0">{gender}</Badge>}
                    {accent && <Badge variant="outline" className="text-[9px] px-1 py-0">{accent}</Badge>}
                    {useCase && <Badge variant="outline" className="text-[9px] px-1 py-0">{useCase}</Badge>}
                  </div>
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
