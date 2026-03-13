import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useCompanyId } from '@/hooks/useCompanyId';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  Upload, Camera, Sparkles, ChevronLeft, ChevronRight,
  Eye, EyeOff, Download, Loader2, CheckCircle2, AlertCircle,
  Wand2, Home, Sofa, Lightbulb, Layers, LayoutGrid,
  Paintbrush, Wallpaper, BookOpen, UtensilsCrossed, Bath,
  RotateCcw, Settings2
} from 'lucide-react';
import {
  buildStanzaPrompt,
  getInterventiAttivi,
  type ConfigurazioneStanza,
  type AnalisiStanza,
  STANZA_STILI_PRONTI_FALLBACK,
} from '@/modules/render-stanza/lib/stanzaPromptBuilder';
import { unwrapEdge } from '@/lib/edgePayload';
import { ConfigRiepilogo } from '@/modules/render-stanza/components/ConfigRiepilogo';
import { InterventiSummaryBar } from '@/modules/render-stanza/components/InterventiSummaryBar';
import { VariantiModal } from '@/components/varianti/VariantiModal';

// ─── COSTANTI ────────────────────────────────────────────────────────────────

const STEPS = [
  { id: 1, label: 'Foto', icon: Camera },
  { id: 2, label: 'Analisi', icon: Eye },
  { id: 3, label: 'Interventi', icon: Settings2 },
  { id: 4, label: 'Render', icon: Sparkles },
  { id: 5, label: 'Risultato', icon: CheckCircle2 },
];

type TipoStanza =
  | 'soggiorno' | 'cucina' | 'camera_da_letto' | 'bagno'
  | 'studio' | 'sala_da_pranzo' | 'corridoio' | 'altro';

const TIPO_STANZA_OPTIONS: { value: TipoStanza; label: string; emoji: string }[] = [
  { value: 'soggiorno',      label: 'Soggiorno',       emoji: '🛋️' },
  { value: 'cucina',         label: 'Cucina',          emoji: '🍳' },
  { value: 'camera_da_letto',label: 'Camera da letto', emoji: '🛏️' },
  { value: 'bagno',          label: 'Bagno',           emoji: '🚿' },
  { value: 'studio',         label: 'Studio / Ufficio',emoji: '💻' },
  { value: 'sala_da_pranzo', label: 'Sala da pranzo',  emoji: '🍽️' },
  { value: 'corridoio',      label: 'Corridoio / Ingresso', emoji: '🚪' },
  { value: 'altro',          label: 'Altro',           emoji: '🏠' },
];

type InterventiState = {
  verniciatura: boolean;
  pavimento: boolean;
  arredo: boolean;
  soffitto: boolean;
  illuminazione: boolean;
  carta_da_parati: boolean;
  rivestimento_pareti: boolean;
  tende: boolean;
  restyling_cucina: boolean;
  restyling_bagno: boolean;
};

const INTERVENTO_META: Record<
  keyof InterventiState,
  { label: string; desc: string; icon: React.ElementType; color: string; onlyFor?: TipoStanza[] }
> = {
  verniciatura:       { label: 'Verniciatura pareti',   desc: 'Cambia colore e finitura delle pareti',       icon: Paintbrush,       color: 'violet' },
  pavimento:          { label: 'Pavimento',              desc: 'Sostituisci il rivestimento del pavimento',    icon: LayoutGrid,       color: 'amber' },
  arredo:             { label: 'Arredo / Mobili',        desc: 'Rinnova o restyling dei mobili e oggetti',    icon: Sofa,             color: 'blue' },
  soffitto:           { label: 'Soffitto',               desc: 'Modifica il soffitto (controsoffitto, travi)', icon: Layers,          color: 'slate' },
  illuminazione:      { label: 'Illuminazione',          desc: 'Cambia tipo, temperatura e sorgenti di luce', icon: Lightbulb,       color: 'yellow' },
  carta_da_parati:    { label: 'Carta da parati',        desc: 'Applica carta da parati o decori su una parete', icon: Wallpaper,     color: 'pink' },
  rivestimento_pareti:{ label: 'Rivestimento pareti',   desc: 'Boiserie, mattoni, pietra, pannelli 3D…',     icon: BookOpen,         color: 'stone' },
  tende:              { label: 'Tende / Tendaggi',       desc: 'Aggiungi, cambia o rimuovi le tende',         icon: Home,            color: 'emerald' },
  restyling_cucina:   { label: 'Restyling cucina',       desc: 'Frontali, piano lavoro, maniglie',            icon: UtensilsCrossed, color: 'orange', onlyFor: ['cucina', 'soggiorno', 'sala_da_pranzo'] },
  restyling_bagno:    { label: 'Restyling bagno',        desc: 'Rivestimenti, sanitari, rubinetteria',        icon: Bath,            color: 'teal',   onlyFor: ['bagno'] },
};

const STILI_TARGET = [
  { value: 'moderno',      label: 'Moderno',      emoji: '⬛' },
  { value: 'scandinavo',   label: 'Scandinavo',   emoji: '🪵' },
  { value: 'industriale',  label: 'Industriale',  emoji: '⚙️' },
  { value: 'classico',     label: 'Classico',     emoji: '🏛️' },
  { value: 'minimalista',  label: 'Minimalista',  emoji: '⬜' },
  { value: 'mediterraneo', label: 'Mediterraneo', emoji: '🌊' },
  { value: 'luxe_contemporaneo', label: 'Lusso',  emoji: '💎' },
  { value: 'giapponese',   label: 'Japandi',      emoji: '🎋' },
  { value: 'nessuno',      label: 'Mantieni stile attuale', emoji: '✋' },
];

// Palette pareti rapide (20 colori)
const WALL_QUICK_COLORS = [
  { name: 'Bianco Puro',    hex: '#FFFFFF' },
  { name: 'Bianco Caldo',   hex: '#FAF7F2' },
  { name: 'Bianco Ghiaccio',hex: '#F0F4F8' },
  { name: 'Grigio Chiaro',  hex: '#D9D9D9' },
  { name: 'Grigio Medio',   hex: '#9E9E9E' },
  { name: 'Grigio Scuro',   hex: '#616161' },
  { name: 'Antracite',      hex: '#373737' },
  { name: 'Nero',           hex: '#1C1C1C' },
  { name: 'Beige Sabbia',   hex: '#E8D5B7' },
  { name: 'Greige',         hex: '#C4B49A' },
  { name: 'Cappuccino',     hex: '#A08060' },
  { name: 'Terra',          hex: '#8B6347' },
  { name: 'Verde Salvia',   hex: '#B2C5B0' },
  { name: 'Verde Bosco',    hex: '#4A7C59' },
  { name: 'Verde Bottiglia',hex: '#2D5016' },
  { name: 'Azzurro Cielo',  hex: '#B8D4E8' },
  { name: 'Blu Notte',      hex: '#1A2C4A' },
  { name: 'Rosa Polvere',   hex: '#F2D7D5' },
  { name: 'Terracotta',     hex: '#C66F43' },
  { name: 'Giallo Ocra',    hex: '#D4A843' },
];

// ─── INTERNAL UI STATE TYPE ──────────────────────────────────────────────────
// Richer than ConfigurazioneStanza — maps to it only when generating prompt

interface WizardConfig {
  tipo_stanza: TipoStanza;
  stile_target: string;
  intensita: 'leggero' | 'medio' | 'radicale';

  verniciatura: {
    attivo: boolean;
    colore_hex: string;
    finitura: string;
    applica_a: string;
    colore_accento_hex?: string;
  };
  pavimento: {
    attivo: boolean;
    tipo_pavimento: string;
    colore_hex: string;
    pattern_posa: string;
    finitura: string;
  };
  arredo: {
    attivo: boolean;
    intensita_cambio: string;
    colore_dominante: string;
    materiale: string;
    mantieni_elettrodomestici: boolean;
  };
  soffitto: {
    attivo: boolean;
    tipo: string;
    colore_hex: string;
  };
  illuminazione: {
    attivo: boolean;
    tipo_fixture: string;
    temperatura: string;
    intensita_luce: string;
  };
  carta_da_parati: {
    attivo: boolean;
    pattern: string;
    colore_base: string;
    colore_motivo: string;
    parete_target: string;
  };
  rivestimento_pareti: {
    attivo: boolean;
    tipo: string;
    colore_hex: string;
  };
  tende: {
    attivo: boolean;
    tipo: string;
    colore_hex: string;
    materiale: string;
    lunghezza: string;
  };
  restyling_cucina: {
    attivo: boolean;
    frontali: { cambia: boolean; colore_hex: string; materiale: string };
    piano_lavoro: { cambia: boolean; materiale: string; colore_hex: string };
    maniglie: { cambia: boolean; stile: string };
  };
  restyling_bagno: {
    attivo: boolean;
    rivestimento: { cambia: boolean; colore_hex: string; pattern: string };
    sanitari: { cambia: boolean; stile: string };
    rubinetteria: { cambia: boolean; finitura: string };
  };
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ─── DEFAULT CONFIG ───────────────────────────────────────────────────────────

function getDefaultWizardConfig(): WizardConfig {
  return {
    tipo_stanza: 'soggiorno',
    stile_target: 'nessuno',
    intensita: 'medio',
    verniciatura: { attivo: false, colore_hex: '#FFFFFF', finitura: 'opaco', applica_a: 'tutte' },
    pavimento: { attivo: false, tipo_pavimento: 'parquet', colore_hex: '#C8A96E', pattern_posa: 'a_correre', finitura: 'opaco' },
    arredo: { attivo: false, intensita_cambio: 'stile_mantenendo_layout', colore_dominante: '#E0D5C5', materiale: 'legno', mantieni_elettrodomestici: true },
    soffitto: { attivo: false, tipo: 'piano', colore_hex: '#FFFFFF' },
    illuminazione: { attivo: false, tipo_fixture: 'plafoniera', temperatura: 'warm', intensita_luce: 'media' },
    carta_da_parati: { attivo: false, pattern: 'geometrico', colore_base: '#F5F0E8', colore_motivo: '#C4A882', parete_target: 'parete_principale' },
    rivestimento_pareti: { attivo: false, tipo: 'boiserie', colore_hex: '#E8E0D0' },
    tende: { attivo: false, tipo: 'tende_a_pannello', colore_hex: '#F0EBE0', materiale: 'lino', lunghezza: 'fino_pavimento' },
    restyling_cucina: {
      attivo: false,
      frontali: { cambia: false, colore_hex: '#FFFFFF', materiale: 'laccato' },
      piano_lavoro: { cambia: false, materiale: 'quarzo', colore_hex: '#E8E8E8' },
      maniglie: { cambia: false, stile: 'moderne_inox' },
    },
    restyling_bagno: {
      attivo: false,
      rivestimento: { cambia: false, colore_hex: '#FFFFFF', pattern: 'subway' },
      sanitari: { cambia: false, stile: 'moderno' },
      rubinetteria: { cambia: false, finitura: 'cromato' },
    },
  };
}

// ─── MAP WIZARD → ConfigurazioneStanza ────────────────────────────────────────

const TEMP_MAP: Record<string, 'calda_2700k' | 'neutra_3000k' | 'fredda_4000k'> = {
  warm: 'calda_2700k', neutral: 'neutra_3000k', cool: 'fredda_4000k',
};

const FIXTURE_MAP: Record<string, string> = {
  lampadario: 'lampadario_centrale',
  plafoniera: 'faretti_incassati',
  faretti: 'faretti_incassati',
  led_strip: 'led_strip_perimetrale',
  piantana: 'lampade_sospensione',
  applique: 'applique_parete',
};

const INTENSITA_LUCE_MAP: Record<string, 'soffusa' | 'normale' | 'forte'> = {
  soffusa: 'soffusa', media: 'normale', intensa: 'forte',
};

const RIVESTIMENTO_MAP: Record<string, string> = {
  boiserie: 'boiserie_legno', mattone: 'mattone_vista', pietra: 'pietra_naturale',
  pannelli_3d: 'pannelli_3d', intonaco: 'intonaco_spatolato', stucco: 'stucco_veneziano',
};

const MANIGLIE_MAP: Record<string, string> = {
  moderne_inox: 'cromato', nere_opache: 'metallo_nero', oro_bronzo: 'metallo_oro',
  minimal_invisible: 'senza_maniglia', vintage_ottone: 'legno',
};

const RUBINETTERIA_MAP: Record<string, string> = {
  cromato: 'moderno', nero_opaco: 'nero_opaco', oro_bronzo: 'oro',
  nichel_spazzolato: 'industriale', bianco_opaco: 'moderno',
};

function mapWizardToConfig(w: WizardConfig, noteLibere: string): ConfigurazioneStanza {
  return {
    tipo_stanza: w.tipo_stanza as any,
    stile_target: w.stile_target === 'nessuno' ? undefined : w.stile_target as any,
    intensita: w.intensita,
    verniciatura: {
      attivo: w.verniciatura.attivo,
      colore_hex: w.verniciatura.colore_hex,
      colore_nome: WALL_QUICK_COLORS.find(c => c.hex === w.verniciatura.colore_hex)?.name,
      finitura: w.verniciatura.finitura as any,
      applica_a: w.verniciatura.applica_a === 'parete_accent' ? 'parete_accento' : w.verniciatura.applica_a as any,
      colore_accento_hex: w.verniciatura.colore_accento_hex,
    },
    pavimento: {
      attivo: w.pavimento.attivo,
      tipo: w.pavimento.tipo_pavimento,
      colore_hex: w.pavimento.colore_hex,
      pattern: w.pavimento.pattern_posa,
      finitura: w.pavimento.finitura,
    },
    arredo: {
      attivo: w.arredo.attivo,
      intensita_cambio: w.arredo.intensita_cambio as any,
      colore_principale_hex: w.arredo.colore_dominante,
      materiale: w.arredo.materiale,
      mantieni_elettrodomestici: w.arredo.mantieni_elettrodomestici,
      stile: w.stile_target === 'nessuno' ? undefined : w.stile_target as any,
    },
    soffitto: {
      attivo: w.soffitto.attivo,
      tipo: w.soffitto.tipo === 'controsoffitto' ? 'controsoffitto_cartongesso' : w.soffitto.tipo === 'boiserie' ? 'boiserie_soffitto' : w.soffitto.tipo as any,
      colore_hex: w.soffitto.colore_hex,
      colore_travi: w.soffitto.tipo === 'travi_legno' ? 'legno naturale' : undefined,
    },
    illuminazione: {
      attivo: w.illuminazione.attivo,
      tipo: FIXTURE_MAP[w.illuminazione.tipo_fixture] as any,
      temperatura: TEMP_MAP[w.illuminazione.temperatura] ?? 'neutra_3000k',
      intensita_luce: INTENSITA_LUCE_MAP[w.illuminazione.intensita_luce] ?? 'normale',
    },
    carta_da_parati: {
      attivo: w.carta_da_parati.attivo,
      stile_pattern: w.carta_da_parati.pattern,
      colore_base: w.carta_da_parati.colore_base,
      applica_a: w.carta_da_parati.parete_target as any,
      descrizione: w.carta_da_parati.colore_motivo ? `Pattern accent color: ${w.carta_da_parati.colore_motivo}` : undefined,
    },
    rivestimento_pareti: {
      attivo: w.rivestimento_pareti.attivo,
      tipo: RIVESTIMENTO_MAP[w.rivestimento_pareti.tipo] as any ?? w.rivestimento_pareti.tipo,
      colore_hex: w.rivestimento_pareti.colore_hex,
      applica_a: 'parete_principale',
    },
    tende: {
      attivo: w.tende.attivo,
      tipo: w.tende.tipo as any,
      colore_hex: w.tende.colore_hex,
      colore_nome: w.tende.materiale,
    },
    restyling_cucina: {
      attivo: w.restyling_cucina.attivo,
      colore_frontali_hex: w.restyling_cucina.frontali.cambia ? w.restyling_cucina.frontali.colore_hex : undefined,
      materiale_frontali: w.restyling_cucina.frontali.cambia ? w.restyling_cucina.frontali.materiale as any : undefined,
      colore_piano_lavoro_hex: w.restyling_cucina.piano_lavoro.cambia ? w.restyling_cucina.piano_lavoro.colore_hex : undefined,
      piano_lavoro_materiale: w.restyling_cucina.piano_lavoro.cambia ? w.restyling_cucina.piano_lavoro.materiale as any : undefined,
      maniglie: w.restyling_cucina.maniglie.cambia ? MANIGLIE_MAP[w.restyling_cucina.maniglie.stile] as any : undefined,
    },
    restyling_bagno: {
      attivo: w.restyling_bagno.attivo,
      colore_rivestimento_hex: w.restyling_bagno.rivestimento.cambia ? w.restyling_bagno.rivestimento.colore_hex : undefined,
      tipo_rivestimento: w.restyling_bagno.rivestimento.cambia ? 'ceramica' : undefined,
      cambia_sanitari: w.restyling_bagno.sanitari.cambia,
      cambia_rubinetteria: w.restyling_bagno.rubinetteria.cambia,
      stile_rubinetteria: w.restyling_bagno.rubinetteria.cambia ? RUBINETTERIA_MAP[w.restyling_bagno.rubinetteria.finitura] as any : undefined,
    },
    note_aggiuntive: noteLibere || undefined,
  };
}

// ─── MAP ConfigurazioneStanza (preset) → WizardConfig ────────────────────────

function mapPresetToWizard(preset: Partial<ConfigurazioneStanza>, base: WizardConfig): WizardConfig {
  const p = preset;
  return {
    ...base,
    intensita: p.intensita ?? base.intensita,
    stile_target: (p as any).stile_target ?? base.stile_target,
    verniciatura: {
      attivo: p.verniciatura?.attivo ?? false,
      colore_hex: p.verniciatura?.colore_hex ?? base.verniciatura.colore_hex,
      finitura: p.verniciatura?.finitura ?? 'opaco',
      applica_a: p.verniciatura?.applica_a === 'parete_accento' ? 'parete_accent' : p.verniciatura?.applica_a ?? 'tutte',
      colore_accento_hex: p.verniciatura?.colore_accento_hex,
    },
    pavimento: {
      attivo: p.pavimento?.attivo ?? false,
      tipo_pavimento: p.pavimento?.tipo ?? base.pavimento.tipo_pavimento,
      colore_hex: p.pavimento?.colore_hex ?? base.pavimento.colore_hex,
      pattern_posa: p.pavimento?.pattern ?? base.pavimento.pattern_posa,
      finitura: p.pavimento?.finitura ?? 'opaco',
    },
    arredo: {
      attivo: p.arredo?.attivo ?? false,
      intensita_cambio: p.arredo?.intensita_cambio ?? 'stile_mantenendo_layout',
      colore_dominante: p.arredo?.colore_principale_hex ?? base.arredo.colore_dominante,
      materiale: p.arredo?.materiale ?? 'legno',
      mantieni_elettrodomestici: p.arredo?.mantieni_elettrodomestici ?? true,
    },
    soffitto: {
      attivo: p.soffitto?.attivo ?? false,
      tipo: p.soffitto?.tipo ?? 'piano',
      colore_hex: p.soffitto?.colore_hex ?? '#FFFFFF',
    },
    illuminazione: {
      attivo: p.illuminazione?.attivo ?? false,
      tipo_fixture: Object.entries(FIXTURE_MAP).find(([, v]) => v === p.illuminazione?.tipo)?.[0] ?? 'plafoniera',
      temperatura: Object.entries(TEMP_MAP).find(([, v]) => v === p.illuminazione?.temperatura)?.[0] ?? 'warm',
      intensita_luce: Object.entries(INTENSITA_LUCE_MAP).find(([, v]) => v === p.illuminazione?.intensita_luce)?.[0] ?? 'media',
    },
    carta_da_parati: {
      attivo: p.carta_da_parati?.attivo ?? false,
      pattern: p.carta_da_parati?.stile_pattern ?? 'geometrico',
      colore_base: p.carta_da_parati?.colore_base ?? '#F5F0E8',
      colore_motivo: '#C4A882',
      parete_target: p.carta_da_parati?.applica_a ?? 'parete_principale',
    },
    rivestimento_pareti: {
      attivo: p.rivestimento_pareti?.attivo ?? false,
      tipo: Object.entries(RIVESTIMENTO_MAP).find(([, v]) => v === p.rivestimento_pareti?.tipo)?.[0] ?? 'boiserie',
      colore_hex: p.rivestimento_pareti?.colore_hex ?? '#E8E0D0',
    },
    tende: {
      attivo: p.tende?.attivo ?? false,
      tipo: p.tende?.tipo ?? 'tende_a_pannello',
      colore_hex: p.tende?.colore_hex ?? '#F0EBE0',
      materiale: 'lino',
      lunghezza: 'fino_pavimento',
    },
    restyling_cucina: {
      attivo: p.restyling_cucina?.attivo ?? false,
      frontali: { cambia: !!p.restyling_cucina?.colore_frontali_hex, colore_hex: p.restyling_cucina?.colore_frontali_hex ?? '#FFFFFF', materiale: p.restyling_cucina?.materiale_frontali ?? 'laccato' },
      piano_lavoro: { cambia: !!p.restyling_cucina?.colore_piano_lavoro_hex, materiale: p.restyling_cucina?.piano_lavoro_materiale ?? 'quarzo', colore_hex: p.restyling_cucina?.colore_piano_lavoro_hex ?? '#E8E8E8' },
      maniglie: { cambia: !!p.restyling_cucina?.maniglie, stile: Object.entries(MANIGLIE_MAP).find(([, v]) => v === p.restyling_cucina?.maniglie)?.[0] ?? 'moderne_inox' },
    },
    restyling_bagno: {
      attivo: p.restyling_bagno?.attivo ?? false,
      rivestimento: { cambia: !!p.restyling_bagno?.colore_rivestimento_hex, colore_hex: p.restyling_bagno?.colore_rivestimento_hex ?? '#FFFFFF', pattern: 'subway' },
      sanitari: { cambia: p.restyling_bagno?.cambia_sanitari ?? false, stile: 'moderno' },
      rubinetteria: { cambia: p.restyling_bagno?.cambia_rubinetteria ?? false, finitura: Object.entries(RUBINETTERIA_MAP).find(([, v]) => v === p.restyling_bagno?.stile_rubinetteria)?.[0] ?? 'cromato' },
    },
  };
}

// ─── COMPONENTE PRINCIPALE ────────────────────────────────────────────────────

export default function RenderStanzaNew() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const companyId = useCompanyId();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Step & navigation
  const [step, setStep] = useState(1);

  // ── Foto
  const [foto, setFoto] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [imageNaturalWidth, setImageNaturalWidth] = useState(0);
  const [imageNaturalHeight, setImageNaturalHeight] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);

  // ── Analisi
  const [analizzando, setAnalizzando] = useState(false);
  const [analisi, setAnalisi] = useState<AnalisiStanza | null>(null);

  // ── Configurazione stanza (internal UI state)
  const [config, setConfig] = useState<WizardConfig>(getDefaultWizardConfig());

  // ── Interventi attivi (for UI toggle)
  const [interventiAttivi, setInterventiAttivi] = useState<InterventiState>({
    verniciatura: false, pavimento: false, arredo: false,
    soffitto: false, illuminazione: false, carta_da_parati: false,
    rivestimento_pareti: false, tende: false,
    restyling_cucina: false, restyling_bagno: false,
  });

  // ── Generazione
  const [rendering, setRendering] = useState(false);
  const [renderUrl, setRenderUrl] = useState<string | null>(null);
  const [showOriginal, setShowOriginal] = useState(false);
  const [imageBase64, setImageBase64] = useState<string>('');
  const [showVarianti, setShowVarianti] = useState(false);

  // ── Note libere
  const [noteLibere, setNoteLibere] = useState('');

  // ── Debug
  const [debug, setDebug] = useState<string | null>(null);

  // ─── HANDLERS ──────────────────────────────────────────────────────────────

  const handleFotoSelect = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Seleziona un file immagine valido');
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      toast.error('Immagine troppo grande (max 20MB)');
      return;
    }

    setFoto(file);
    const previewUrl = URL.createObjectURL(file);
    setFotoPreview(previewUrl);

    // Capture base64 for varianti
    const reader = new FileReader();
    reader.onload = (e) => setImageBase64((e.target?.result as string).split(',')[1]);
    reader.readAsDataURL(file);

    // Rileva dimensioni naturali
    const img = new Image();
    img.onload = () => {
      setImageNaturalWidth(img.naturalWidth);
      setImageNaturalHeight(img.naturalHeight);
    };
    img.src = previewUrl;
  }, []);

  const handleAnalyzeRoom = async () => {
    if (!foto || !user) return;
    setAnalizzando(true);

    try {
      // 1. Crea sessione DB — render_stanza_sessions has NO company_id column
      const { data: session, error: sessErr } = await supabase
        .from('render_stanza_sessions' as any)
        .insert({
          user_id: user.id,
          tipo_stanza: config.tipo_stanza,
          status: 'analyzing',
        })
        .select()
        .single();
      if (sessErr) throw sessErr;
      setSessionId((session as any).id);

      // 2. Upload originale
      const ext = foto.name.split('.').pop() || 'jpg';
      const storagePath = `${user.id}/${(session as any).id}/original.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from('stanza-originals')
        .upload(storagePath, foto, { contentType: foto.type });
      if (uploadErr) throw uploadErr;

      // 3. Chiama edge function analyze-room-photo
      const base64 = await fileToBase64(foto);
      const { data: analyzeData, error: analyzeErr } = await supabase.functions.invoke(
        'analyze-room-photo',
        {
          body: {
            image_base64: base64,
            mime_type: foto.type,
            session_id: (session as any).id,
            tipo_stanza: config.tipo_stanza,
            target_width: imageNaturalWidth,
            target_height: imageNaturalHeight,
          },
        }
      );
      if (analyzeErr) throw analyzeErr;

      const payload = unwrapEdge<{ analisi?: AnalisiStanza }>(analyzeData);
      if (!payload?.analisi) {
        toast.error('Analisi non riuscita: nessun dato ricevuto. Riprova.');
        return;
      }

      setAnalisi(payload.analisi);

      // Build the public URL from storage path for gallery usage
      const origPath = `${user.id}/${(session as any).id}/original.${ext}`;
      const { data: pubUrlData } = supabase.storage.from('stanza-originals').getPublicUrl(origPath);
      setOriginalUrl(pubUrlData?.publicUrl || null);

      // Pre-fill config con dati analisi
      prefillFromAnalisi(payload.analisi);

      // Avanza a step 2 (analisi)
      setStep(2);
    } catch (err) {
      console.error(err);
      toast.error('Errore durante l\'analisi della foto');
      setDebug(String(err));
    } finally {
      setAnalizzando(false);
    }
  };

  // Pre-compila config con i dati rilevati dall'AI
  const prefillFromAnalisi = (a: AnalisiStanza) => {
    if (!a) return;
    setConfig(prev => ({
      ...prev,
      verniciatura: {
        ...prev.verniciatura,
        colore_hex: a.pareti?.colore_hex || prev.verniciatura.colore_hex,
      },
      pavimento: {
        ...prev.pavimento,
        tipo_pavimento: (a.pavimento?.tipo as any) || prev.pavimento.tipo_pavimento,
        colore_hex: a.pavimento?.colore_hex || prev.pavimento.colore_hex,
      },
    }));
  };

  // Toggle intervento ON/OFF
  const toggleIntervento = (key: keyof InterventiState, value: boolean) => {
    setInterventiAttivi(prev => ({ ...prev, [key]: value }));
    setConfig(prev => {
      const existing = prev[key as keyof WizardConfig];
      return {
        ...prev,
        [key]: typeof existing === 'object' && existing !== null
          ? { ...existing, attivo: value }
          : { attivo: value },
      };
    });
  };

  // Aggiorna una sub-config
  const updateConfig = <K extends keyof WizardConfig>(
    key: K,
    partial: Partial<WizardConfig[K]>
  ) => {
    setConfig(prev => {
      const existing = prev[key];
      return {
        ...prev,
        [key]: typeof existing === 'object' && existing !== null
          ? { ...existing, ...partial }
          : { ...partial },
      };
    });
  };

  const handleStartRender = async () => {
    if (!sessionId || !foto || !user) return;

    // Map wizard state → ConfigurazioneStanza for prompt builder
    const configForPrompt = mapWizardToConfig(config, noteLibere);
    const attivi = getInterventiAttivi(configForPrompt);
    if (attivi.length === 0) {
      toast.error('Seleziona almeno un intervento da eseguire');
      return;
    }

    setRendering(true);
    setStep(4);

    try {
      const { userPrompt, systemPrompt } = buildStanzaPrompt(analisi ?? null, configForPrompt);

      const base64 = await fileToBase64(foto);
      const { data: renderData, error: renderErr } = await supabase.functions.invoke(
        'generate-room-render',
        {
          body: {
            image_base64: base64,
            mime_type: foto.type,
            prompt: userPrompt,
            system_prompt: systemPrompt,
            session_id: sessionId,
            target_width: imageNaturalWidth,
            target_height: imageNaturalHeight,
            config: {
              tipo_stanza: config.tipo_stanza,
              interventi_selezionati: attivi,
              config_json: configForPrompt,
            },
          },
        }
      );
      if (renderErr) throw renderErr;

      const renderPayload = unwrapEdge<{ result_url?: string; result_image_url?: string; result_base64?: string }>(renderData);
      const finalUrl = renderPayload?.result_url || renderPayload?.result_image_url || renderPayload?.result_base64 || null;
      
      // Don't mark as completed if no result URL
      if (!finalUrl) {
        toast.error('Render completato ma nessuna immagine ricevuta. Riprova.');
        setStep(3);
        return;
      }
      
      setRenderUrl(finalUrl);

      // Salva in gallery — render_stanza_gallery has NO company_id column
      await supabase.from('render_stanza_gallery' as any).insert({
        user_id: user.id,
        session_id: sessionId,
        original_image_url: originalUrl || '',
        result_image_url: finalUrl,
        tipo_stanza: config.tipo_stanza,
        interventi: attivi,
        config_snapshot: configForPrompt,
      });

      // Aggiorna stato sessione
      await supabase
        .from('render_stanza_sessions' as any)
        .update({
          status: 'completed',
          result_image_url: finalUrl,
          interventi_selezionati: attivi,
          config_json: configForPrompt,
        })
        .eq('id', sessionId);

      setStep(5);
    } catch (err) {
      console.error(err);
      toast.error('Errore durante la generazione del render');
      setDebug(String(err));
      setStep(3);
    } finally {
      setRendering(false);
    }
  };

  const handleReset = () => {
    setStep(1);
    setFoto(null);
    setFotoPreview(null);
    setSessionId(null);
    setOriginalUrl(null);
    setAnalisi(null);
    setConfig(getDefaultWizardConfig());
    setInterventiAttivi({
      verniciatura: false, pavimento: false, arredo: false,
      soffitto: false, illuminazione: false, carta_da_parati: false,
      rivestimento_pareti: false, tende: false,
      restyling_cucina: false, restyling_bagno: false,
    });
    setRenderUrl(null);
    setShowOriginal(false);
    setNoteLibere('');
    setDebug(null);
  };

  // Applica uno stile pronto
  const applyStile = (stile: typeof STANZA_STILI_PRONTI_FALLBACK[0]) => {
    const mapped = mapPresetToWizard(stile.config as Partial<ConfigurazioneStanza>, config);
    setConfig(mapped);
    // Sincronizza i toggle degli interventi
    const nuoviAttivi: InterventiState = {
      verniciatura: mapped.verniciatura?.attivo ?? false,
      pavimento: mapped.pavimento?.attivo ?? false,
      arredo: mapped.arredo?.attivo ?? false,
      soffitto: mapped.soffitto?.attivo ?? false,
      illuminazione: mapped.illuminazione?.attivo ?? false,
      carta_da_parati: mapped.carta_da_parati?.attivo ?? false,
      rivestimento_pareti: mapped.rivestimento_pareti?.attivo ?? false,
      tende: mapped.tende?.attivo ?? false,
      restyling_cucina: mapped.restyling_cucina?.attivo ?? false,
      restyling_bagno: mapped.restyling_bagno?.attivo ?? false,
    };
    setInterventiAttivi(nuoviAttivi);
    toast.success(`Stile "${stile.nome}" applicato`);
  };

  // ─── CONTEGGIO INTERVENTI ATTIVI ──────────────────────────────────────────

  const countAttivi = Object.values(interventiAttivi).filter(Boolean).length;

  // ─── RENDER UI ─────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-background to-purple-50">
      {/* Header */}
      <div className="bg-background border-b shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/app/render-stanza')}>
            <ChevronLeft className="w-4 h-4 mr-1" /> Indietro
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Wand2 className="w-5 h-5 text-violet-600" />
              Render Stanza Completo
            </h1>
            <p className="text-xs text-muted-foreground">Trasforma la tua stanza con l'AI</p>
          </div>
          {/* Step indicator */}
          <div className="hidden sm:flex items-center gap-1">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const isActive = s.id === step;
              const isDone = s.id < step;
              return (
                <div key={s.id} className="flex items-center">
                  <div className={`
                    flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-all
                    ${isActive ? 'bg-violet-600 text-white' : isDone ? 'bg-violet-100 text-violet-700' : 'text-muted-foreground'}
                  `}>
                    <Icon className="w-3 h-3" />
                    <span className="hidden md:inline">{s.label}</span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={`w-4 h-px mx-1 ${isDone ? 'bg-violet-300' : 'bg-border'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
        {/* Progress bar */}
        <Progress value={(step / STEPS.length) * 100} className="h-0.5 rounded-none bg-muted [&>div]:bg-violet-500" />
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* ═══════════════════════════════════════════════════════════════════
            STEP 1 — CARICA FOTO
        ════════════════════════════════════════════════════════════════════ */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-foreground mb-2">Carica la foto della stanza</h2>
              <p className="text-muted-foreground">Una buona foto frontale garantisce i migliori risultati</p>
            </div>

            {/* Tipo stanza */}
            <Card>
              <CardContent className="pt-5">
                <Label className="text-sm font-medium text-muted-foreground mb-3 block">
                  Che tipo di stanza è?
                </Label>
                <div className="grid grid-cols-4 gap-2">
                  {TIPO_STANZA_OPTIONS.map(t => (
                    <button
                      key={t.value}
                      onClick={() => setConfig(prev => ({ ...prev, tipo_stanza: t.value }))}
                      className={`
                        p-3 rounded-xl border-2 text-center transition-all hover:border-violet-400
                        ${config.tipo_stanza === t.value
                          ? 'border-violet-600 bg-violet-50'
                          : 'border-border bg-background'}
                      `}
                    >
                      <div className="text-2xl mb-1">{t.emoji}</div>
                      <div className="text-xs font-medium text-foreground leading-tight">{t.label}</div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Upload foto */}
            {!fotoPreview ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={e => e.preventDefault()}
                onDrop={e => {
                  e.preventDefault();
                  const file = e.dataTransfer.files[0];
                  if (file) handleFotoSelect(file);
                }}
                className="border-2 border-dashed border-violet-300 rounded-2xl p-12 text-center cursor-pointer hover:border-violet-500 hover:bg-violet-50 transition-all"
              >
                <div className="w-16 h-16 bg-violet-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Upload className="w-8 h-8 text-violet-600" />
                </div>
                <p className="text-foreground font-medium mb-1">Trascina qui la foto oppure clicca per selezionarla</p>
                <p className="text-muted-foreground text-sm">JPG, PNG, WebP — max 20MB</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) handleFotoSelect(file);
                  }}
                />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative rounded-2xl overflow-hidden shadow-lg">
                  <img src={fotoPreview} alt="Foto stanza" className="w-full max-h-80 object-cover" />
                  <button
                    onClick={() => {
                      setFoto(null);
                      setFotoPreview(null);
                    }}
                    className="absolute top-3 right-3 bg-black/60 text-white rounded-full p-1.5 hover:bg-black/80 transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                  <div className="absolute bottom-3 left-3 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
                    {imageNaturalWidth > 0 ? `${imageNaturalWidth} × ${imageNaturalHeight}px` : foto?.name}
                  </div>
                </div>

                <Button
                  onClick={handleAnalyzeRoom}
                  disabled={analizzando}
                  className="w-full bg-violet-600 hover:bg-violet-700 text-white h-12 text-base font-medium"
                >
                  {analizzando ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analisi in corso…
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4 mr-2" />
                      Analizza la stanza con AI
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Stili pronti (preview rapida) */}
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-3">Oppure parti da uno stile pronto:</p>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {STANZA_STILI_PRONTI_FALLBACK.map(stile => (
                  <button
                    key={stile.nome}
                    onClick={() => applyStile(stile)}
                    className="flex-shrink-0 px-3 py-2 bg-background border border-border rounded-xl text-xs font-medium text-foreground hover:border-violet-400 hover:bg-violet-50 transition-all whitespace-nowrap"
                  >
                    {stile.emoji} {stile.nome}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            STEP 2 — RISULTATI ANALISI AI
        ════════════════════════════════════════════════════════════════════ */}
        {step === 2 && !analisi && (
          <div className="text-center space-y-4 py-12">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
            <h2 className="text-xl font-bold text-foreground">Analisi non disponibile</h2>
            <p className="text-muted-foreground">Non è stato possibile recuperare i dati dell'analisi. Riprova.</p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => setStep(1)}>
                <ChevronLeft className="w-4 h-4 mr-1" /> Torna alla foto
              </Button>
              <Button onClick={handleAnalyzeRoom} disabled={analizzando} className="bg-violet-600 hover:bg-violet-700 text-white">
                {analizzando ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RotateCcw className="w-4 h-4 mr-2" />}
                Riprova analisi
              </Button>
            </div>
          </div>
        )}

        {step === 2 && analisi && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Stanza analizzata!</h2>
              <p className="text-muted-foreground">Ecco cosa ha rilevato l'AI. Nella prossima schermata sceglierai cosa cambiare.</p>
            </div>

            {/* Griglia analisi */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* Pareti */}
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Paintbrush className="w-4 h-4 text-violet-600" />
                    <span className="font-semibold text-foreground">Pareti</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Colore principale</span>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-5 h-5 rounded-full border border-border shadow-sm"
                          style={{ backgroundColor: analisi.pareti?.colore_hex || '#CCCCCC' }}
                        />
                        <span className="font-medium text-foreground">{analisi.pareti?.colore_principale}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Finitura</span>
                      <span className="font-medium text-foreground capitalize">{analisi.pareti?.finitura}</span>
                    </div>
                    {analisi.pareti?.presenza_carta_da_parati && (
                      <Badge variant="secondary" className="text-xs">Carta da parati presente</Badge>
                    )}
                    {analisi.pareti?.presenza_rivestimento && (
                      <Badge variant="secondary" className="text-xs">Rivestimento presente</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Pavimento */}
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <LayoutGrid className="w-4 h-4 text-amber-600" />
                    <span className="font-semibold text-foreground">Pavimento</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Tipo</span>
                      <span className="font-medium text-foreground capitalize">{analisi.pavimento?.tipo?.replace(/_/g, ' ')}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Colore</span>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-5 h-5 rounded-full border border-border shadow-sm"
                          style={{ backgroundColor: analisi.pavimento?.colore_hex || '#CCCCCC' }}
                        />
                        <span className="font-medium text-foreground">{analisi.pavimento?.colore}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Condizione</span>
                      <span className="font-medium text-foreground capitalize">{analisi.pavimento?.condizione}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Arredo */}
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Sofa className="w-4 h-4 text-blue-600" />
                    <span className="font-semibold text-foreground">Arredo</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Stile attuale</span>
                      <span className="font-medium text-foreground capitalize">{analisi.arredo?.stile?.replace(/_/g, ' ')}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Colore dominante</span>
                      <span className="font-medium text-foreground">{analisi.arredo?.colore_dominante}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Densità mobili</span>
                      <span className="font-medium text-foreground capitalize">{analisi.arredo?.densita}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Illuminazione */}
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Lightbulb className="w-4 h-4 text-yellow-600" />
                    <span className="font-semibold text-foreground">Illuminazione</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Tipo</span>
                      <span className="font-medium text-foreground capitalize">{analisi.illuminazione?.tipo_principale?.replace(/_/g, ' ')}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Temperatura</span>
                      <span className="font-medium text-foreground capitalize">{analisi.illuminazione?.temperatura_stimata}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Luminosità</span>
                      <span className="font-medium text-foreground capitalize">{analisi.illuminazione?.luminosita_ambiente}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Soffitto */}
              {analisi.soffitto && (
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Layers className="w-4 h-4 text-slate-600" />
                      <span className="font-semibold text-foreground">Soffitto</span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Tipo</span>
                        <span className="font-medium text-foreground capitalize">{analisi.soffitto.tipo?.replace(/_/g, ' ')}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Colore</span>
                        <span className="font-medium text-foreground">{analisi.soffitto.colore}</span>
                      </div>
                      {analisi.soffitto.altezza_stimata && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Altezza stimata</span>
                          <span className="font-medium text-foreground">{analisi.soffitto.altezza_stimata}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Caratteristiche speciali */}
              {analisi.caratteristiche_speciali && Object.values(analisi.caratteristiche_speciali).some(Boolean) && (
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Home className="w-4 h-4 text-emerald-600" />
                      <span className="font-semibold text-foreground">Caratteristiche speciali</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {analisi.caratteristiche_speciali.presenza_finestre && <Badge variant="outline" className="text-xs">🪟 Finestre visibili</Badge>}
                      {analisi.caratteristiche_speciali.presenza_camino && <Badge variant="outline" className="text-xs">🔥 Camino</Badge>}
                      {analisi.caratteristiche_speciali.presenza_travi && <Badge variant="outline" className="text-xs">🪵 Travi a vista</Badge>}
                      {analisi.caratteristiche_speciali.presenza_colonne && <Badge variant="outline" className="text-xs">🏛️ Colonne</Badge>}
                      {analisi.caratteristiche_speciali.presenza_nicchie && <Badge variant="outline" className="text-xs">🔲 Nicchie</Badge>}
                      {analisi.caratteristiche_speciali.presenza_arco && <Badge variant="outline" className="text-xs">🌙 Archi</Badge>}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Interventi suggeriti dall'AI */}
            {analisi.interventi_suggeriti && analisi.interventi_suggeriti.length > 0 && (
              <Card className="border-violet-200 bg-violet-50">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-violet-600" />
                    <span className="font-semibold text-violet-800 text-sm">Suggeriti dall'AI</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {analisi.interventi_suggeriti.map(suggerito => (
                      <Badge
                        key={suggerito}
                        className="text-xs cursor-pointer bg-violet-100 text-violet-700 hover:bg-violet-200 transition-colors border-violet-200"
                        onClick={() => {
                          const key = suggerito as keyof InterventiState;
                          if (key in interventiAttivi) toggleIntervento(key, true);
                        }}
                      >
                        + {suggerito.replace(/_/g, ' ')}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Palette colori rilevate */}
            {analisi.palette_principale && analisi.palette_principale.length > 0 && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Palette colori attuale:</p>
                <div className="flex gap-2">
                  {analisi.palette_principale.map((hex, i) => (
                    <div key={i} className="flex flex-col items-center gap-1">
                      <div
                        className="w-10 h-10 rounded-lg shadow-sm border border-border"
                        style={{ backgroundColor: hex }}
                      />
                      <span className="text-xs text-muted-foreground font-mono">{hex}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Button
              onClick={() => setStep(3)}
              className="w-full bg-violet-600 hover:bg-violet-700 text-white h-12 text-base font-medium"
            >
              Scegli gli interventi
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            STEP 3 — SELEZIONA E CONFIGURA INTERVENTI
        ════════════════════════════════════════════════════════════════════ */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-1">Cosa vuoi cambiare?</h2>
              <p className="text-muted-foreground text-sm">
                Attiva uno o più interventi e configurali. Puoi combinarne quanti vuoi.
                {countAttivi > 0 && (
                  <span className="ml-2 inline-flex items-center gap-1 bg-violet-100 text-violet-700 text-xs font-medium px-2 py-0.5 rounded-full">
                    <Sparkles className="w-3 h-3" />
                    {countAttivi} {countAttivi === 1 ? 'intervento' : 'interventi'} attivi
                  </span>
                )}
              </p>
            </div>

            {/* Stile target globale */}
            <Card>
              <CardContent className="pt-4">
                <Label className="text-sm font-medium text-muted-foreground mb-3 block">
                  Stile da raggiungere (opzionale)
                </Label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {STILI_TARGET.map(s => (
                    <button
                      key={s.value}
                      onClick={() => setConfig(prev => ({ ...prev, stile_target: s.value }))}
                      className={`
                        p-2 rounded-xl border-2 text-center transition-all text-xs font-medium
                        ${config.stile_target === s.value
                          ? 'border-violet-600 bg-violet-50 text-violet-800'
                          : 'border-border hover:border-violet-300 text-muted-foreground'}
                      `}
                    >
                      <div className="text-lg mb-0.5">{s.emoji}</div>
                      {s.label}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Intensità globale */}
            <Card>
              <CardContent className="pt-4">
                <Label className="text-sm font-medium text-muted-foreground mb-3 block">
                  Intensità del cambiamento
                </Label>
                <div className="grid grid-cols-3 gap-3">
                  {([
                    { value: 'leggero', label: 'Leggero', desc: 'Cambiamenti sottili, stile simile', emoji: '🌿' },
                    { value: 'medio',   label: 'Medio',   desc: 'Rinnovamento bilanciato',             emoji: '✨' },
                    { value: 'radicale',label: 'Radicale',desc: 'Trasformazione completa',             emoji: '🔥' },
                  ] as const).map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setConfig(prev => ({ ...prev, intensita: opt.value }))}
                      className={`
                        p-3 rounded-xl border-2 text-center transition-all
                        ${config.intensita === opt.value
                          ? 'border-violet-600 bg-violet-50'
                          : 'border-border hover:border-violet-300'}
                      `}
                    >
                      <div className="text-xl mb-1">{opt.emoji}</div>
                      <div className="text-sm font-semibold text-foreground">{opt.label}</div>
                      <div className="text-xs text-muted-foreground mt-0.5 leading-tight">{opt.desc}</div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Separator />

            {/* ── Cards interventi ── */}
            <div className="space-y-3">
              {(Object.keys(INTERVENTO_META) as (keyof InterventiState)[]).map(key => {
                const meta = INTERVENTO_META[key];
                const Icon = meta.icon;
                const isActive = interventiAttivi[key];

                // Nascondi interventi non pertinenti
                if (meta.onlyFor && !meta.onlyFor.includes(config.tipo_stanza)) {
                  return null;
                }

                return (
                  <Card
                    key={key}
                    className={`transition-all duration-200 ${isActive ? 'border-violet-300 shadow-sm' : 'border-border'}`}
                  >
                    {/* Header card */}
                    <div
                      className={`
                        flex items-center justify-between p-4 cursor-pointer rounded-t-xl
                        ${isActive ? 'bg-violet-50' : 'bg-background hover:bg-muted/50'}
                      `}
                      onClick={() => toggleIntervento(key, !isActive)}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`
                          w-9 h-9 rounded-xl flex items-center justify-center
                          ${isActive ? 'bg-violet-600' : 'bg-muted'}
                        `}>
                          <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-muted-foreground'}`} />
                        </div>
                        <div>
                          <p className="font-semibold text-foreground text-sm">{meta.label}</p>
                          <p className="text-xs text-muted-foreground">{meta.desc}</p>
                        </div>
                      </div>
                      <Switch
                        checked={isActive}
                        onCheckedChange={val => toggleIntervento(key, val)}
                        onClick={e => e.stopPropagation()}
                        className="data-[state=checked]:bg-violet-600"
                      />
                    </div>

                    {/* Pannello configurazione — espanso quando attivo */}
                    {isActive && (
                      <CardContent className="pt-0 pb-4 border-t border-violet-100">
                        <div className="pt-4">
                          {/* ── VERNICIATURA ── */}
                          {key === 'verniciatura' && (
                            <div className="space-y-4">
                              <div>
                                <Label className="text-xs font-medium text-muted-foreground mb-2 block">Colore pareti</Label>
                                <div className="grid grid-cols-10 gap-1.5 mb-3">
                                  {WALL_QUICK_COLORS.map(c => (
                                    <button
                                      key={c.hex}
                                      title={c.name}
                                      onClick={() => updateConfig('verniciatura', { colore_hex: c.hex })}
                                      className={`
                                        w-full aspect-square rounded-lg transition-all
                                        ${config.verniciatura.colore_hex === c.hex
                                          ? 'ring-2 ring-violet-600 ring-offset-1 scale-110'
                                          : 'hover:scale-105'}
                                        ${c.hex === '#FFFFFF' ? 'border border-border' : ''}
                                      `}
                                      style={{ backgroundColor: c.hex }}
                                    />
                                  ))}
                                </div>
                                {/* Colore personalizzato */}
                                <div className="flex items-center gap-3">
                                  <label className="flex items-center gap-2 cursor-pointer">
                                    <div
                                      className="w-8 h-8 rounded-lg border-2 border-border cursor-pointer overflow-hidden"
                                      style={{ backgroundColor: config.verniciatura.colore_hex }}
                                    >
                                      <input
                                        type="color"
                                        value={config.verniciatura.colore_hex}
                                        onChange={e => updateConfig('verniciatura', { colore_hex: e.target.value })}
                                        className="opacity-0 w-full h-full cursor-pointer"
                                      />
                                    </div>
                                  </label>
                                  <span className="text-sm font-mono text-muted-foreground">{config.verniciatura.colore_hex}</span>
                                  <span className="text-xs text-muted-foreground">{WALL_QUICK_COLORS.find(c => c.hex === config.verniciatura.colore_hex)?.name || 'Personalizzato'}</span>
                                </div>
                              </div>

                              <div>
                                <Label className="text-xs font-medium text-muted-foreground mb-2 block">Finitura</Label>
                                <div className="grid grid-cols-3 gap-2">
                                  {(['opaco', 'satinato', 'lucido'] as const).map(f => (
                                    <button
                                      key={f}
                                      onClick={() => updateConfig('verniciatura', { finitura: f })}
                                      className={`
                                        py-2 px-3 rounded-lg border text-xs font-medium transition-all capitalize
                                        ${config.verniciatura.finitura === f
                                          ? 'border-violet-600 bg-violet-50 text-violet-700'
                                          : 'border-border text-muted-foreground hover:border-violet-300'}
                                      `}
                                    >
                                      {f}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              <div>
                                <Label className="text-xs font-medium text-muted-foreground mb-2 block">Applica a</Label>
                                <div className="grid grid-cols-2 gap-2">
                                  {([
                                    { value: 'tutte', label: 'Tutte le pareti' },
                                    { value: 'parete_principale', label: 'Parete principale' },
                                    { value: 'parete_accent', label: '+ Parete accent' },
                                    { value: 'solo_soffitto_e_pareti', label: 'Pareti + soffitto' },
                                  ] as const).map(opt => (
                                    <button
                                      key={opt.value}
                                      onClick={() => updateConfig('verniciatura', { applica_a: opt.value })}
                                      className={`
                                        py-2 px-3 rounded-lg border text-xs font-medium text-left transition-all
                                        ${config.verniciatura.applica_a === opt.value
                                          ? 'border-violet-600 bg-violet-50 text-violet-700'
                                          : 'border-border text-muted-foreground hover:border-violet-300'}
                                      `}
                                    >
                                      {opt.label}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              {/* Feature wall — colore accento */}
                              {config.verniciatura.applica_a === 'parete_accent' && (
                                <div className="bg-muted rounded-xl p-3">
                                  <Label className="text-xs font-medium text-muted-foreground mb-2 block">
                                    Colore parete accent (diverso dalle altre)
                                  </Label>
                                  <div className="flex items-center gap-3">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                      <div
                                        className="w-8 h-8 rounded-lg border-2 border-border overflow-hidden"
                                        style={{ backgroundColor: config.verniciatura.colore_accento_hex || '#C4A882' }}
                                      >
                                        <input
                                          type="color"
                                          value={config.verniciatura.colore_accento_hex || '#C4A882'}
                                          onChange={e => updateConfig('verniciatura', { colore_accento_hex: e.target.value })}
                                          className="opacity-0 w-full h-full cursor-pointer"
                                        />
                                      </div>
                                    </label>
                                    <span className="text-sm font-mono text-muted-foreground">
                                      {config.verniciatura.colore_accento_hex || '#C4A882'}
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* ── PAVIMENTO ── */}
                          {key === 'pavimento' && (
                            <div className="space-y-4">
                              <div>
                                <Label className="text-xs font-medium text-muted-foreground mb-2 block">Tipo di pavimento</Label>
                                <div className="flex gap-2 overflow-x-auto pb-2">
                                  {([
                                    { value: 'parquet',          label: 'Parquet',      emoji: '🪵' },
                                    { value: 'laminato',         label: 'Laminato',     emoji: '📦' },
                                    { value: 'ceramica',         label: 'Ceramica',     emoji: '🔲' },
                                    { value: 'gres_porcellanato',label: 'Gres',         emoji: '⬜' },
                                    { value: 'marmo',            label: 'Marmo',        emoji: '💎' },
                                    { value: 'pietra_naturale',  label: 'Pietra',       emoji: '🪨' },
                                    { value: 'vinile_lvt',       label: 'Vinile LVT',   emoji: '🔶' },
                                    { value: 'cotto',            label: 'Cotto',        emoji: '🧱' },
                                    { value: 'cemento_resina',   label: 'Cemento/Resina',emoji: '🔘' },
                                    { value: 'moquette',         label: 'Moquette',     emoji: '🟫' },
                                  ] as const).map(t => (
                                    <button
                                      key={t.value}
                                      onClick={() => updateConfig('pavimento', { tipo_pavimento: t.value })}
                                      className={`
                                        flex-shrink-0 px-3 py-2 rounded-xl border text-xs font-medium transition-all
                                        ${config.pavimento.tipo_pavimento === t.value
                                          ? 'border-violet-600 bg-violet-50 text-violet-700'
                                          : 'border-border text-muted-foreground hover:border-violet-300'}
                                      `}
                                    >
                                      {t.emoji} {t.label}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              <div>
                                <Label className="text-xs font-medium text-muted-foreground mb-2 block">Colore</Label>
                                <div className="flex items-center gap-3">
                                  <label className="flex items-center gap-2 cursor-pointer">
                                    <div
                                      className="w-9 h-9 rounded-xl border-2 border-border overflow-hidden"
                                      style={{ backgroundColor: config.pavimento.colore_hex }}
                                    >
                                      <input
                                        type="color"
                                        value={config.pavimento.colore_hex}
                                        onChange={e => updateConfig('pavimento', { colore_hex: e.target.value })}
                                        className="opacity-0 w-full h-full cursor-pointer"
                                      />
                                    </div>
                                  </label>
                                  <span className="text-sm font-mono text-muted-foreground">{config.pavimento.colore_hex}</span>
                                </div>
                              </div>

                              {!['cemento_resina', 'moquette'].includes(config.pavimento.tipo_pavimento) && (
                                <div>
                                  <Label className="text-xs font-medium text-muted-foreground mb-2 block">Pattern di posa</Label>
                                  <div className="grid grid-cols-3 gap-2">
                                    {([
                                      { value: 'a_correre', label: 'A correre' },
                                      { value: 'spina_di_pesce', label: 'Spina di pesce' },
                                      { value: 'diagonale_45', label: 'Diagonale 45°' },
                                      { value: 'a_quadri', label: 'A quadri' },
                                      { value: 'opus_incertum', label: 'Opus incertum' },
                                      { value: 'versailles', label: 'Versailles' },
                                    ] as const).map(p => (
                                      <button
                                        key={p.value}
                                        onClick={() => updateConfig('pavimento', { pattern_posa: p.value })}
                                        className={`
                                          py-2 px-2 rounded-lg border text-xs font-medium transition-all
                                          ${config.pavimento.pattern_posa === p.value
                                            ? 'border-violet-600 bg-violet-50 text-violet-700'
                                            : 'border-border text-muted-foreground hover:border-violet-300'}
                                        `}
                                      >
                                        {p.label}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* ── ARREDO ── */}
                          {key === 'arredo' && (
                            <div className="space-y-4">
                              <div>
                                <Label className="text-xs font-medium text-muted-foreground mb-2 block">Intensità cambio arredo</Label>
                                <div className="space-y-2">
                                  {([
                                    { value: 'colore_sola', label: 'Solo colore', desc: 'Stessa forma, colori diversi' },
                                    { value: 'stile_mantenendo_layout', label: 'Nuovo stile', desc: 'Restyling mantenendo il layout' },
                                    { value: 'arredo_completo', label: 'Arredo completo', desc: 'Tutto nuovo da zero' },
                                  ] as const).map(opt => (
                                    <button
                                      key={opt.value}
                                      onClick={() => updateConfig('arredo', { intensita_cambio: opt.value })}
                                      className={`
                                        w-full p-3 rounded-xl border-2 text-left transition-all
                                        ${config.arredo.intensita_cambio === opt.value
                                          ? 'border-violet-600 bg-violet-50'
                                          : 'border-border hover:border-violet-300'}
                                      `}
                                    >
                                      <div className="font-medium text-sm text-foreground">{opt.label}</div>
                                      <div className="text-xs text-muted-foreground">{opt.desc}</div>
                                    </button>
                                  ))}
                                </div>
                              </div>

                              <div>
                                <Label className="text-xs font-medium text-muted-foreground mb-2 block">Colore dominante arredo</Label>
                                <div className="flex items-center gap-3">
                                  <label>
                                    <div
                                      className="w-9 h-9 rounded-xl border-2 border-border overflow-hidden cursor-pointer"
                                      style={{ backgroundColor: config.arredo.colore_dominante }}
                                    >
                                      <input
                                        type="color"
                                        value={config.arredo.colore_dominante}
                                        onChange={e => updateConfig('arredo', { colore_dominante: e.target.value })}
                                        className="opacity-0 w-full h-full cursor-pointer"
                                      />
                                    </div>
                                  </label>
                                  <span className="text-sm font-mono text-muted-foreground">{config.arredo.colore_dominante}</span>
                                </div>
                              </div>

                              <div>
                                <Label className="text-xs font-medium text-muted-foreground mb-2 block">Materiale prevalente</Label>
                                <div className="flex flex-wrap gap-2">
                                  {(['legno', 'metallo', 'vetro', 'tessuto', 'misto'] as const).map(m => (
                                    <button
                                      key={m}
                                      onClick={() => updateConfig('arredo', { materiale: m })}
                                      className={`
                                        px-3 py-1.5 rounded-lg border text-xs font-medium capitalize transition-all
                                        ${config.arredo.materiale === m
                                          ? 'border-violet-600 bg-violet-50 text-violet-700'
                                          : 'border-border text-muted-foreground hover:border-violet-300'}
                                      `}
                                    >
                                      {m}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              {config.tipo_stanza === 'cucina' && (
                                <div className="flex items-center justify-between p-3 bg-amber-50 rounded-xl border border-amber-200">
                                  <div>
                                    <p className="text-sm font-medium text-amber-800">Mantieni elettrodomestici</p>
                                    <p className="text-xs text-amber-600">Non cambiare frigorifero, piano cottura, ecc.</p>
                                  </div>
                                  <Switch
                                    checked={config.arredo.mantieni_elettrodomestici}
                                    onCheckedChange={val => updateConfig('arredo', { mantieni_elettrodomestici: val })}
                                    className="data-[state=checked]:bg-amber-500"
                                  />
                                </div>
                              )}
                            </div>
                          )}

                          {/* ── SOFFITTO ── */}
                          {key === 'soffitto' && (
                            <div className="space-y-4">
                              <div>
                                <Label className="text-xs font-medium text-muted-foreground mb-2 block">Tipo di soffitto</Label>
                                <div className="grid grid-cols-2 gap-2">
                                  {([
                                    { value: 'piano', label: 'Piano / Tinteggiato' },
                                    { value: 'controsoffitto', label: 'Controsoffitto' },
                                    { value: 'travi_legno', label: 'Travi in legno a vista' },
                                    { value: 'boiserie', label: 'Boiserie / Cornici' },
                                  ] as const).map(opt => (
                                    <button
                                      key={opt.value}
                                      onClick={() => updateConfig('soffitto', { tipo: opt.value })}
                                      className={`
                                        py-2 px-3 rounded-xl border text-xs font-medium transition-all
                                        ${config.soffitto.tipo === opt.value
                                          ? 'border-violet-600 bg-violet-50 text-violet-700'
                                          : 'border-border text-muted-foreground hover:border-violet-300'}
                                      `}
                                    >
                                      {opt.label}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              <div>
                                <Label className="text-xs font-medium text-muted-foreground mb-2 block">Colore soffitto</Label>
                                <div className="flex items-center gap-3">
                                  <label>
                                    <div
                                      className="w-9 h-9 rounded-xl border-2 border-border overflow-hidden cursor-pointer"
                                      style={{ backgroundColor: config.soffitto.colore_hex }}
                                    >
                                      <input
                                        type="color"
                                        value={config.soffitto.colore_hex}
                                        onChange={e => updateConfig('soffitto', { colore_hex: e.target.value })}
                                        className="opacity-0 w-full h-full cursor-pointer"
                                      />
                                    </div>
                                  </label>
                                  <span className="text-sm font-mono text-muted-foreground">{config.soffitto.colore_hex}</span>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* ── ILLUMINAZIONE ── */}
                          {key === 'illuminazione' && (
                            <div className="space-y-4">
                              <div>
                                <Label className="text-xs font-medium text-muted-foreground mb-2 block">Tipo di lampada</Label>
                                <div className="grid grid-cols-3 gap-2">
                                  {([
                                    { value: 'lampadario',   label: 'Lampadario' },
                                    { value: 'plafoniera',   label: 'Plafoniera' },
                                    { value: 'faretti',      label: 'Faretti' },
                                    { value: 'led_strip',    label: 'Striscia LED' },
                                    { value: 'piantana',     label: 'Piantana' },
                                    { value: 'applique',     label: 'Applique' },
                                  ] as const).map(t => (
                                    <button
                                      key={t.value}
                                      onClick={() => updateConfig('illuminazione', { tipo_fixture: t.value })}
                                      className={`
                                        py-2 px-2 rounded-lg border text-xs font-medium transition-all
                                        ${config.illuminazione.tipo_fixture === t.value
                                          ? 'border-violet-600 bg-violet-50 text-violet-700'
                                          : 'border-border text-muted-foreground hover:border-violet-300'}
                                      `}
                                    >
                                      {t.label}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              <div>
                                <Label className="text-xs font-medium text-muted-foreground mb-2 block">Temperatura colore</Label>
                                <div className="grid grid-cols-3 gap-2">
                                  {([
                                    { value: 'warm', label: 'Calda 2700K', color: '#FFF0C0' },
                                    { value: 'neutral', label: 'Neutra 4000K', color: '#FFFBE8' },
                                    { value: 'cool', label: 'Fredda 6500K', color: '#E8F4FF' },
                                  ] as const).map(t => (
                                    <button
                                      key={t.value}
                                      onClick={() => updateConfig('illuminazione', { temperatura: t.value })}
                                      className={`
                                        py-2 px-2 rounded-lg border-2 text-xs font-medium transition-all
                                        ${config.illuminazione.temperatura === t.value
                                          ? 'border-violet-600'
                                          : 'border-border hover:border-violet-300'}
                                      `}
                                      style={{ backgroundColor: t.color }}
                                    >
                                      {t.label}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              <div>
                                <Label className="text-xs font-medium text-muted-foreground mb-2 block">Intensità luce</Label>
                                <div className="grid grid-cols-3 gap-2">
                                  {(['soffusa', 'media', 'intensa'] as const).map(i => (
                                    <button
                                      key={i}
                                      onClick={() => updateConfig('illuminazione', { intensita_luce: i })}
                                      className={`
                                        py-2 px-3 rounded-lg border text-xs font-medium capitalize transition-all
                                        ${config.illuminazione.intensita_luce === i
                                          ? 'border-violet-600 bg-violet-50 text-violet-700'
                                          : 'border-border text-muted-foreground hover:border-violet-300'}
                                      `}
                                    >
                                      {i}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* ── CARTA DA PARATI ── */}
                          {key === 'carta_da_parati' && (
                            <div className="space-y-4">
                              <div>
                                <Label className="text-xs font-medium text-muted-foreground mb-2 block">Pattern carta</Label>
                                <div className="grid grid-cols-3 gap-2">
                                  {([
                                    { value: 'geometrico',  label: 'Geometrico' },
                                    { value: 'botanico',    label: 'Botanico/Foglie' },
                                    { value: 'floreale',    label: 'Floreale' },
                                    { value: 'righe',       label: 'Righe' },
                                    { value: 'astratto',    label: 'Astratto' },
                                    { value: 'effetto_muro',label: 'Effetto mattone/pietra' },
                                  ] as const).map(p => (
                                    <button
                                      key={p.value}
                                      onClick={() => updateConfig('carta_da_parati', { pattern: p.value })}
                                      className={`
                                        py-2 px-2 rounded-lg border text-xs font-medium transition-all
                                        ${config.carta_da_parati.pattern === p.value
                                          ? 'border-violet-600 bg-violet-50 text-violet-700'
                                          : 'border-border text-muted-foreground hover:border-violet-300'}
                                      `}
                                    >
                                      {p.label}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">Colore base</Label>
                                  <div className="flex items-center gap-2">
                                    <label>
                                      <div
                                        className="w-8 h-8 rounded-lg border-2 border-border overflow-hidden cursor-pointer"
                                        style={{ backgroundColor: config.carta_da_parati.colore_base }}
                                      >
                                        <input type="color" value={config.carta_da_parati.colore_base} onChange={e => updateConfig('carta_da_parati', { colore_base: e.target.value })} className="opacity-0 w-full h-full cursor-pointer" />
                                      </div>
                                    </label>
                                    <span className="text-xs font-mono text-muted-foreground">{config.carta_da_parati.colore_base}</span>
                                  </div>
                                </div>
                                <div>
                                  <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">Colore motivo</Label>
                                  <div className="flex items-center gap-2">
                                    <label>
                                      <div
                                        className="w-8 h-8 rounded-lg border-2 border-border overflow-hidden cursor-pointer"
                                        style={{ backgroundColor: config.carta_da_parati.colore_motivo }}
                                      >
                                        <input type="color" value={config.carta_da_parati.colore_motivo} onChange={e => updateConfig('carta_da_parati', { colore_motivo: e.target.value })} className="opacity-0 w-full h-full cursor-pointer" />
                                      </div>
                                    </label>
                                    <span className="text-xs font-mono text-muted-foreground">{config.carta_da_parati.colore_motivo}</span>
                                  </div>
                                </div>
                              </div>

                              <div>
                                <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">Parete target</Label>
                                <div className="grid grid-cols-2 gap-2">
                                  {([
                                    { value: 'parete_principale', label: 'Parete principale' },
                                    { value: 'tutte', label: 'Tutte le pareti' },
                                  ] as const).map(opt => (
                                    <button key={opt.value} onClick={() => updateConfig('carta_da_parati', { parete_target: opt.value })}
                                      className={`py-2 px-3 rounded-lg border text-xs font-medium transition-all ${config.carta_da_parati.parete_target === opt.value ? 'border-violet-600 bg-violet-50 text-violet-700' : 'border-border text-muted-foreground hover:border-violet-300'}`}>
                                      {opt.label}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* ── RIVESTIMENTO PARETI ── */}
                          {key === 'rivestimento_pareti' && (
                            <div className="space-y-4">
                              <div>
                                <Label className="text-xs font-medium text-muted-foreground mb-2 block">Tipo rivestimento</Label>
                                <div className="grid grid-cols-3 gap-2">
                                  {([
                                    { value: 'boiserie',    label: 'Boiserie' },
                                    { value: 'mattone',     label: 'Mattone' },
                                    { value: 'pietra',      label: 'Pietra naturale' },
                                    { value: 'pannelli_3d', label: 'Pannelli 3D' },
                                    { value: 'intonaco',    label: 'Intonaco decorativo' },
                                    { value: 'stucco',      label: 'Stucco veneziano' },
                                  ] as const).map(t => (
                                    <button key={t.value} onClick={() => updateConfig('rivestimento_pareti', { tipo: t.value })}
                                      className={`py-2 px-2 rounded-lg border text-xs font-medium transition-all ${config.rivestimento_pareti.tipo === t.value ? 'border-violet-600 bg-violet-50 text-violet-700' : 'border-border text-muted-foreground hover:border-violet-300'}`}>
                                      {t.label}
                                    </button>
                                  ))}
                                </div>
                              </div>
                              <div>
                                <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">Colore</Label>
                                <div className="flex items-center gap-3">
                                  <label>
                                    <div className="w-8 h-8 rounded-lg border-2 border-border overflow-hidden cursor-pointer" style={{ backgroundColor: config.rivestimento_pareti.colore_hex }}>
                                      <input type="color" value={config.rivestimento_pareti.colore_hex} onChange={e => updateConfig('rivestimento_pareti', { colore_hex: e.target.value })} className="opacity-0 w-full h-full cursor-pointer" />
                                    </div>
                                  </label>
                                  <span className="text-xs font-mono text-muted-foreground">{config.rivestimento_pareti.colore_hex}</span>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* ── TENDE ── */}
                          {key === 'tende' && (
                            <div className="space-y-4">
                              <div>
                                <Label className="text-xs font-medium text-muted-foreground mb-2 block">Tipo di tende</Label>
                                <div className="grid grid-cols-2 gap-2">
                                  {([
                                    { value: 'tende_a_pannello', label: 'Tende a pannello' },
                                    { value: 'tende_a_rullo',    label: 'Tende a rullo' },
                                    { value: 'veneziane',        label: 'Veneziane' },
                                    { value: 'tendaggi_pesanti', label: 'Tendaggi pesanti' },
                                    { value: 'sheer_leggere',    label: 'Tende sheer (leggere)' },
                                    { value: 'nessuna',          label: 'Rimuovi tende' },
                                  ] as const).map(t => (
                                    <button key={t.value} onClick={() => updateConfig('tende', { tipo: t.value })}
                                      className={`py-2 px-3 rounded-lg border text-xs font-medium transition-all ${config.tende.tipo === t.value ? 'border-violet-600 bg-violet-50 text-violet-700' : 'border-border text-muted-foreground hover:border-violet-300'}`}>
                                      {t.label}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              {config.tende.tipo !== 'nessuna' && (
                                <>
                                  <div>
                                    <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">Colore tende</Label>
                                    <div className="flex items-center gap-3">
                                      <label>
                                        <div className="w-8 h-8 rounded-lg border-2 border-border overflow-hidden cursor-pointer" style={{ backgroundColor: config.tende.colore_hex }}>
                                          <input type="color" value={config.tende.colore_hex} onChange={e => updateConfig('tende', { colore_hex: e.target.value })} className="opacity-0 w-full h-full cursor-pointer" />
                                        </div>
                                      </label>
                                      <span className="text-xs font-mono text-muted-foreground">{config.tende.colore_hex}</span>
                                    </div>
                                  </div>
                                  <div>
                                    <Label className="text-xs font-medium text-muted-foreground mb-2 block">Materiale</Label>
                                    <div className="flex flex-wrap gap-2">
                                      {(['lino', 'velluto', 'cotone', 'seta', 'poliestere'] as const).map(m => (
                                        <button key={m} onClick={() => updateConfig('tende', { materiale: m })}
                                          className={`px-3 py-1.5 rounded-lg border text-xs font-medium capitalize transition-all ${config.tende.materiale === m ? 'border-violet-600 bg-violet-50 text-violet-700' : 'border-border text-muted-foreground hover:border-violet-300'}`}>
                                          {m}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                  <div>
                                    <Label className="text-xs font-medium text-muted-foreground mb-2 block">Lunghezza</Label>
                                    <div className="grid grid-cols-3 gap-2">
                                      {([
                                        { value: 'fino_davanzale', label: 'Al davanzale' },
                                        { value: 'fino_pavimento', label: 'Al pavimento' },
                                        { value: 'pool',           label: 'Pool (oltre il pavimento)' },
                                      ] as const).map(l => (
                                        <button key={l.value} onClick={() => updateConfig('tende', { lunghezza: l.value })}
                                          className={`py-2 px-2 rounded-lg border text-xs font-medium transition-all ${config.tende.lunghezza === l.value ? 'border-violet-600 bg-violet-50 text-violet-700' : 'border-border text-muted-foreground hover:border-violet-300'}`}>
                                          {l.label}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                </>
                              )}
                            </div>
                          )}

                          {/* ── RESTYLING CUCINA ── */}
                          {key === 'restyling_cucina' && (
                            <div className="space-y-4">
                              {/* Frontali */}
                              <div className="flex items-center justify-between p-3 bg-orange-50 rounded-xl border border-orange-200">
                                <div>
                                  <p className="text-sm font-medium text-orange-800">Cambia frontali</p>
                                  <p className="text-xs text-orange-600">Sportelli e cassetti</p>
                                </div>
                                <Switch
                                  checked={config.restyling_cucina.frontali.cambia}
                                  onCheckedChange={val => updateConfig('restyling_cucina', { frontali: { ...config.restyling_cucina.frontali, cambia: val } } as any)}
                                  className="data-[state=checked]:bg-orange-500"
                                />
                              </div>
                              {config.restyling_cucina.frontali.cambia && (
                                <div className="pl-3 space-y-3">
                                  <div className="grid grid-cols-3 gap-2">
                                    {(['laccato', 'legno', 'melaminico', 'vetro', 'pietra'] as const).map(m => (
                                      <button key={m} onClick={() => updateConfig('restyling_cucina', { frontali: { ...config.restyling_cucina.frontali, materiale: m } } as any)}
                                        className={`py-2 px-2 rounded-lg border text-xs font-medium capitalize transition-all ${config.restyling_cucina.frontali.materiale === m ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-border text-muted-foreground hover:border-orange-300'}`}>
                                        {m}
                                      </button>
                                    ))}
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <label>
                                      <div className="w-8 h-8 rounded-lg border-2 border-border overflow-hidden cursor-pointer" style={{ backgroundColor: config.restyling_cucina.frontali.colore_hex }}>
                                        <input type="color" value={config.restyling_cucina.frontali.colore_hex} onChange={e => updateConfig('restyling_cucina', { frontali: { ...config.restyling_cucina.frontali, colore_hex: e.target.value } } as any)} className="opacity-0 w-full h-full cursor-pointer" />
                                      </div>
                                    </label>
                                    <span className="text-xs font-mono text-muted-foreground">{config.restyling_cucina.frontali.colore_hex}</span>
                                  </div>
                                </div>
                              )}

                              {/* Piano lavoro */}
                              <div className="flex items-center justify-between p-3 bg-orange-50 rounded-xl border border-orange-200">
                                <div>
                                  <p className="text-sm font-medium text-orange-800">Cambia piano lavoro</p>
                                  <p className="text-xs text-orange-600">Top cucina</p>
                                </div>
                                <Switch
                                  checked={config.restyling_cucina.piano_lavoro.cambia}
                                  onCheckedChange={val => updateConfig('restyling_cucina', { piano_lavoro: { ...config.restyling_cucina.piano_lavoro, cambia: val } } as any)}
                                  className="data-[state=checked]:bg-orange-500"
                                />
                              </div>
                              {config.restyling_cucina.piano_lavoro.cambia && (
                                <div className="pl-3">
                                  <div className="flex flex-wrap gap-2">
                                    {(['quarzo', 'marmo', 'granito', 'legno', 'ceramica', 'acciaio_inox'] as const).map(m => (
                                      <button key={m} onClick={() => updateConfig('restyling_cucina', { piano_lavoro: { ...config.restyling_cucina.piano_lavoro, materiale: m } } as any)}
                                        className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${config.restyling_cucina.piano_lavoro.materiale === m ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-border text-muted-foreground'}`}>
                                        {m.replace(/_/g, ' ')}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Maniglie */}
                              <div className="flex items-center justify-between p-3 bg-orange-50 rounded-xl border border-orange-200">
                                <div>
                                  <p className="text-sm font-medium text-orange-800">Cambia maniglie</p>
                                </div>
                                <Switch
                                  checked={config.restyling_cucina.maniglie.cambia}
                                  onCheckedChange={val => updateConfig('restyling_cucina', { maniglie: { ...config.restyling_cucina.maniglie, cambia: val } } as any)}
                                  className="data-[state=checked]:bg-orange-500"
                                />
                              </div>
                              {config.restyling_cucina.maniglie.cambia && (
                                <div className="pl-3">
                                  <div className="flex flex-wrap gap-2">
                                    {(['moderne_inox', 'nere_opache', 'oro_bronzo', 'minimal_invisible', 'vintage_ottone'] as const).map(s => (
                                      <button key={s} onClick={() => updateConfig('restyling_cucina', { maniglie: { ...config.restyling_cucina.maniglie, stile: s } } as any)}
                                        className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${config.restyling_cucina.maniglie.stile === s ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-border text-muted-foreground'}`}>
                                        {s.replace(/_/g, ' ')}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* ── RESTYLING BAGNO ── */}
                          {key === 'restyling_bagno' && (
                            <div className="space-y-4">
                              {/* Rivestimento */}
                              <div className="flex items-center justify-between p-3 bg-teal-50 rounded-xl border border-teal-200">
                                <div>
                                  <p className="text-sm font-medium text-teal-800">Cambia rivestimento</p>
                                  <p className="text-xs text-teal-600">Piastrelle pareti e pavimento</p>
                                </div>
                                <Switch
                                  checked={config.restyling_bagno.rivestimento.cambia}
                                  onCheckedChange={val => updateConfig('restyling_bagno', { rivestimento: { ...config.restyling_bagno.rivestimento, cambia: val } } as any)}
                                  className="data-[state=checked]:bg-teal-500"
                                />
                              </div>
                              {config.restyling_bagno.rivestimento.cambia && (
                                <div className="pl-3 space-y-2">
                                  <div className="flex flex-wrap gap-2">
                                    {(['subway', 'esagono', 'marmo_grande', 'microcemento', 'listelli_verticali', 'mosaico'] as const).map(p => (
                                      <button key={p} onClick={() => updateConfig('restyling_bagno', { rivestimento: { ...config.restyling_bagno.rivestimento, pattern: p } } as any)}
                                        className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${config.restyling_bagno.rivestimento.pattern === p ? 'border-teal-500 bg-teal-50 text-teal-700' : 'border-border text-muted-foreground'}`}>
                                        {p.replace(/_/g, ' ')}
                                      </button>
                                    ))}
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <label>
                                      <div className="w-8 h-8 rounded-lg border-2 border-border overflow-hidden cursor-pointer" style={{ backgroundColor: config.restyling_bagno.rivestimento.colore_hex }}>
                                        <input type="color" value={config.restyling_bagno.rivestimento.colore_hex} onChange={e => updateConfig('restyling_bagno', { rivestimento: { ...config.restyling_bagno.rivestimento, colore_hex: e.target.value } } as any)} className="opacity-0 w-full h-full cursor-pointer" />
                                      </div>
                                    </label>
                                    <span className="text-xs font-mono text-muted-foreground">{config.restyling_bagno.rivestimento.colore_hex}</span>
                                  </div>
                                </div>
                              )}

                              {/* Sanitari */}
                              <div className="flex items-center justify-between p-3 bg-teal-50 rounded-xl border border-teal-200">
                                <div>
                                  <p className="text-sm font-medium text-teal-800">Cambia sanitari</p>
                                  <p className="text-xs text-teal-600">WC, lavabo, vasca/doccia</p>
                                </div>
                                <Switch
                                  checked={config.restyling_bagno.sanitari.cambia}
                                  onCheckedChange={val => updateConfig('restyling_bagno', { sanitari: { ...config.restyling_bagno.sanitari, cambia: val } } as any)}
                                  className="data-[state=checked]:bg-teal-500"
                                />
                              </div>
                              {config.restyling_bagno.sanitari.cambia && (
                                <div className="pl-3">
                                  <div className="flex flex-wrap gap-2">
                                    {(['moderno', 'classico', 'minimalista', 'freestanding', 'industriale'] as const).map(s => (
                                      <button key={s} onClick={() => updateConfig('restyling_bagno', { sanitari: { ...config.restyling_bagno.sanitari, stile: s } } as any)}
                                        className={`px-3 py-1.5 rounded-lg border text-xs font-medium capitalize transition-all ${config.restyling_bagno.sanitari.stile === s ? 'border-teal-500 bg-teal-50 text-teal-700' : 'border-border text-muted-foreground'}`}>
                                        {s}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Rubinetteria */}
                              <div className="flex items-center justify-between p-3 bg-teal-50 rounded-xl border border-teal-200">
                                <div>
                                  <p className="text-sm font-medium text-teal-800">Cambia rubinetteria</p>
                                </div>
                                <Switch
                                  checked={config.restyling_bagno.rubinetteria.cambia}
                                  onCheckedChange={val => updateConfig('restyling_bagno', { rubinetteria: { ...config.restyling_bagno.rubinetteria, cambia: val } } as any)}
                                  className="data-[state=checked]:bg-teal-500"
                                />
                              </div>
                              {config.restyling_bagno.rubinetteria.cambia && (
                                <div className="pl-3">
                                  <div className="flex flex-wrap gap-2">
                                    {(['cromato', 'nero_opaco', 'oro_bronzo', 'nichel_spazzolato', 'bianco_opaco'] as const).map(f => (
                                      <button key={f} onClick={() => updateConfig('restyling_bagno', { rubinetteria: { ...config.restyling_bagno.rubinetteria, finitura: f } } as any)}
                                        className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${config.restyling_bagno.rubinetteria.finitura === f ? 'border-teal-500 bg-teal-50 text-teal-700' : 'border-border text-muted-foreground'}`}>
                                        {f.replace(/_/g, ' ')}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    )}
                  </Card>
                );
              })}
            </div>

            {/* Note libere */}
            <Card>
              <CardContent className="pt-4">
                <Label className="text-sm font-medium text-muted-foreground mb-2 block">
                  Note aggiuntive (opzionale)
                </Label>
                <Textarea
                  value={noteLibere}
                  onChange={e => setNoteLibere(e.target.value)}
                  placeholder="Es: 'Voglio un effetto vintage', 'Mantieni le travi', 'Aggiungi una libreria integrata'..."
                  rows={3}
                  className="resize-none text-sm"
                />
              </CardContent>
            </Card>

            {/* Riepilogo configurazione */}
            {countAttivi > 0 && (
              <Card>
                <CardContent className="pt-4">
                  <p className="text-sm font-semibold text-foreground mb-3">📋 Riepilogo configurazione:</p>
                  <ConfigRiepilogo config={mapWizardToConfig(config, noteLibere)} />
                </CardContent>
              </Card>
            )}

            {/* CTA */}
            <div className="space-y-3">
              {countAttivi === 0 && (
                <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                  <p className="text-sm text-amber-700">Attiva almeno un intervento per procedere</p>
                </div>
              )}

              <Button
                onClick={handleStartRender}
                disabled={rendering || countAttivi === 0}
                className="w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white h-12 text-base font-medium"
              >
                {rendering ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generazione in corso…
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Genera render
                    {countAttivi > 0 && (
                      <Badge className="ml-2 bg-white/20 text-white text-xs border-0">
                        {countAttivi} {countAttivi === 1 ? 'intervento' : 'interventi'}
                      </Badge>
                    )}
                  </>
                )}
              </Button>

              <Button variant="outline" onClick={() => setStep(2)} className="w-full">
                <ChevronLeft className="w-4 h-4 mr-2" />
                Torna all'analisi
              </Button>
            </div>

            {/* Sticky summary bar */}
            <InterventiSummaryBar
              interventi={interventiAttivi}
              meta={Object.fromEntries(
                Object.entries(INTERVENTO_META).map(([k, v]) => [k, { label: v.label, icon: v.icon, color: v.color }])
              )}
              onRemove={key => toggleIntervento(key as keyof InterventiState, false)}
              onGenerate={handleStartRender}
              loading={rendering}
            />
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            STEP 4 — GENERAZIONE IN CORSO
        ════════════════════════════════════════════════════════════════════ */}
        {step === 4 && (
          <div className="text-center py-16 space-y-8">
            <div className="relative inline-block">
              <div className="w-24 h-24 bg-violet-100 rounded-full flex items-center justify-center">
                <Wand2 className="w-12 h-12 text-violet-600" />
              </div>
              <div className="absolute inset-0 rounded-full border-4 border-violet-300 animate-ping opacity-30" />
              <div className="absolute -inset-2 rounded-full border-2 border-violet-200 animate-pulse" />
            </div>

            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Trasformando la tua stanza…</h2>
              <p className="text-muted-foreground">
                L'AI sta applicando{' '}
                <strong className="text-violet-700">{countAttivi} {countAttivi === 1 ? 'intervento' : 'interventi'}</strong>
                {' '}alla foto
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-2">
              {(Object.keys(interventiAttivi) as (keyof InterventiState)[])
                .filter(k => interventiAttivi[k])
                .map(k => {
                  const meta = INTERVENTO_META[k];
                  const Icon = meta.icon;
                  return (
                    <div key={k} className="flex items-center gap-1.5 bg-violet-100 text-violet-700 px-3 py-1.5 rounded-full text-sm font-medium">
                      <Icon className="w-3.5 h-3.5" />
                      {meta.label}
                    </div>
                  );
                })}
            </div>

            <p className="text-muted-foreground text-sm">Questo potrebbe richiedere 20-40 secondi…</p>

            {debug && (
              <div className="text-left bg-red-50 border border-red-200 rounded-xl p-4 max-w-lg mx-auto">
                <p className="text-xs font-mono text-red-700 break-all">{debug}</p>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            STEP 5 — RISULTATO BEFORE/AFTER
        ════════════════════════════════════════════════════════════════════ */}
        {step === 5 && !renderUrl && (
          <div className="text-center space-y-4 py-12">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
            <h2 className="text-xl font-semibold">Render non disponibile</h2>
            <p className="text-muted-foreground">La generazione è terminata ma l'immagine non è stata ricevuta.</p>
            <div className="flex justify-center gap-4">
              <Button variant="outline" onClick={() => setStep(3)}>Torna agli interventi</Button>
              <Button onClick={handleStartRender}>Riprova render</Button>
            </div>
          </div>
        )}
        {step === 5 && renderUrl && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Sparkles className="w-6 h-6 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-1">Stanza trasformata!</h2>
              <p className="text-muted-foreground text-sm">
                {countAttivi} {countAttivi === 1 ? 'intervento applicato' : 'interventi applicati'} con successo
              </p>
            </div>

            {/* Toggle before/after */}
            <div className="flex justify-center">
              <div className="inline-flex rounded-full bg-muted p-1">
                <button
                  onClick={() => setShowOriginal(false)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${!showOriginal ? 'bg-background shadow text-violet-700' : 'text-muted-foreground'}`}
                >
                  Dopo
                </button>
                <button
                  onClick={() => setShowOriginal(true)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${showOriginal ? 'bg-background shadow text-foreground' : 'text-muted-foreground'}`}
                >
                  Prima
                </button>
              </div>
            </div>

            {/* Immagine */}
            <div className="relative rounded-2xl overflow-hidden shadow-xl">
              <img
                src={showOriginal ? (fotoPreview || '') : renderUrl}
                alt={showOriginal ? 'Stanza originale' : 'Render trasformato'}
                className="w-full transition-opacity duration-300"
              />
              <div className="absolute top-3 left-3">
                <Badge className={showOriginal ? 'bg-gray-700 text-white' : 'bg-violet-600 text-white'}>
                  {showOriginal ? 'PRIMA' : 'DOPO'}
                </Badge>
              </div>
              <button
                onClick={() => setShowOriginal(prev => !prev)}
                className="absolute bottom-3 right-3 bg-black/60 text-white rounded-full p-2 hover:bg-black/80 transition-colors"
              >
                {showOriginal ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>
            </div>

            {/* Genera varianti */}
            {imageBase64 && (
              <div className="flex justify-center">
                <button
                  onClick={() => setShowVarianti(true)}
                  className="flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 font-medium py-2 px-3 hover:bg-primary/5 rounded-xl transition-colors"
                >
                  <Layers className="w-4 h-4" />
                  Genera varianti di confronto
                </button>
              </div>
            )}

            {/* Riepilogo interventi eseguiti */}
            <Card className="border-violet-200">
              <CardContent className="pt-4">
                <p className="text-sm font-semibold text-foreground mb-3">Interventi eseguiti:</p>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(interventiAttivi) as (keyof InterventiState)[])
                    .filter(k => interventiAttivi[k])
                    .map(k => {
                      const meta = INTERVENTO_META[k];
                      const Icon = meta.icon;
                      return (
                        <div key={k} className="flex items-center gap-1.5 bg-violet-50 text-violet-700 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-violet-200">
                          <Icon className="w-3.5 h-3.5" />
                          {meta.label}
                        </div>
                      );
                    })}
                </div>
              </CardContent>
            </Card>

            {/* Azioni */}
            <div className="grid grid-cols-2 gap-3">
              <a
                href={renderUrl}
                download={`render-stanza-${Date.now()}.jpg`}
                className="flex items-center justify-center gap-2 bg-foreground text-background h-11 rounded-xl text-sm font-medium hover:opacity-90 transition-colors"
              >
                <Download className="w-4 h-4" />
                Scarica
              </a>
              <Button
                variant="outline"
                onClick={handleReset}
                className="h-11 text-sm border-violet-200 text-violet-700 hover:bg-violet-50"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Nuova stanza
              </Button>
            </div>

            <Button
              onClick={() => navigate('/app/render-stanza')}
              variant="ghost"
              className="w-full text-muted-foreground"
            >
              Vai alla galleria
            </Button>
          </div>
        )}

        {/* Modal varianti */}
        {showVarianti && renderUrl && imageBase64 && (
          <VariantiModal
            imageBase64={imageBase64}
            mimeType={foto?.type || 'image/jpeg'}
            originalUrl={fotoPreview || ''}
            basePrompt={buildStanzaPrompt(analisi ?? null, mapWizardToConfig(config, noteLibere)).userPrompt}
            systemPrompt={buildStanzaPrompt(analisi ?? null, mapWizardToConfig(config, noteLibere)).systemPrompt}
            naturalWidth={imageNaturalWidth}
            naturalHeight={imageNaturalHeight}
            sourceModulo="stanza"
            sourceSessionId={sessionId || undefined}
            onClose={() => setShowVarianti(false)}
          />
        )}

      </div>
    </div>
  );
}
