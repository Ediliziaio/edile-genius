import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload, Wand2, ChevronRight, ChevronLeft, Check, Download,
  RefreshCw, Eye, EyeOff, Layers, Sun, Droplets, RotateCcw, Info, Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useRenderTetto } from '@/hooks/useRenderTetto';
import type { TipoManto, MaterialeGrondaia, ConfigurazioneTetto } from '@/modules/render-tetto/types';
import BeforeAfterSlider from '@/components/render/BeforeAfterSlider';

// ─── Costanti ─────────────────────────────────────────────────────────────────

const TIPO_TETTO_OPTIONS = [
  { value: 'a_falde', label: 'A falde', icon: '🏠', desc: 'Classico a 2 o più falde' },
  { value: 'piano', label: 'Piano', icon: '⬜', desc: 'Terrazza piana con gronda' },
  { value: 'mansardato', label: 'Mansardato', icon: '🏚️', desc: 'Con mansarda abitabile' },
  { value: 'padiglione', label: 'Padiglione', icon: '⛺', desc: '4 falde convergenti' },
  { value: 'altro', label: 'Altro', icon: '🏗️', desc: 'Forma particolare' },
];

interface MantoOption {
  value: TipoManto;
  label: string;
  desc: string;
  emoji: string;
  gruppo: string;
  coloriSuggeriti: { hex: string; nome: string }[];
}

const MANTO_OPTIONS: MantoOption[] = [
  {
    value: 'tegole_coppi', label: 'Tegole coppo', desc: 'Canale e coppo in laterizio, stile mediterraneo',
    emoji: '🟤', gruppo: 'Tegole in laterizio',
    coloriSuggeriti: [
      { hex: '#8B3A2C', nome: 'Rosso cotto' }, { hex: '#A0522D', nome: 'Siena' },
      { hex: '#6B3022', nome: 'Mattone scuro' }, { hex: '#C17C5A', nome: 'Terracotta chiara' },
    ],
  },
  {
    value: 'tegole_marsigliesi', label: 'Tegole marsigliesi', desc: 'Profilo a doppia onda, tono rustico toscano',
    emoji: '🟠', gruppo: 'Tegole in laterizio',
    coloriSuggeriti: [
      { hex: '#9B4520', nome: 'Rosso marsigliese' }, { hex: '#7A3B1E', nome: 'Bordeaux tetto' },
      { hex: '#B06A3A', nome: 'Arancio antico' }, { hex: '#5C2E0E', nome: 'Bruno scuro' },
    ],
  },
  {
    value: 'tegole_portoghesi', label: 'Tegole portoghesi', desc: 'Profilo a S, file sfalsate, caldo e tradizionale',
    emoji: '🔶', gruppo: 'Tegole in laterizio',
    coloriSuggeriti: [
      { hex: '#B05A28', nome: 'Cotto classico' }, { hex: '#8C4520', nome: 'Rosso antico' },
      { hex: '#C4784A', nome: 'Arancio terracotta' }, { hex: '#6B3510', nome: 'Mogano tetto' },
    ],
  },
  {
    value: 'tegole_piane', label: 'Tegole piane', desc: 'Superficie liscia, file parallele, aspetto moderno',
    emoji: '⬛', gruppo: 'Tegole',
    coloriSuggeriti: [
      { hex: '#2D2D2D', nome: 'Antracite' }, { hex: '#8A8A8A', nome: 'Grigio cenere' },
      { hex: '#4A4A5A', nome: 'Grigio ardesia' }, { hex: '#C0B090', nome: 'Beige sabbia' },
    ],
  },
  {
    value: 'ardesia_naturale', label: 'Ardesia naturale', desc: 'Lastre naturali nere/grigio scuro, venature',
    emoji: '⬛', gruppo: 'Pietra',
    coloriSuggeriti: [
      { hex: '#2A2A2A', nome: 'Nero ardesia' }, { hex: '#3A3A4A', nome: 'Grigio notte' },
      { hex: '#4A4A5A', nome: 'Blu ardesia' }, { hex: '#5A5A50', nome: 'Verde ardesia' },
    ],
  },
  {
    value: 'ardesia_sintetica', label: 'Ardesia sintetica', desc: 'Colore omogeneo, contemporaneo e leggero',
    emoji: '🔲', gruppo: 'Pietra',
    coloriSuggeriti: [
      { hex: '#4A4A5A', nome: 'Grigio ardesia' }, { hex: '#2C2C3A', nome: 'Antracite scuro' },
      { hex: '#6A6A7A', nome: 'Grigio medio' }, { hex: '#3A3A2A', nome: 'Grigio verde' },
    ],
  },
  {
    value: 'lamiera_grecata', label: 'Lamiera grecata', desc: 'Profilo a greche, industriale, leggero',
    emoji: '▦', gruppo: 'Lamiera',
    coloriSuggeriti: [
      { hex: '#B0B0B0', nome: 'Grigio alluminio' }, { hex: '#8B3A2C', nome: 'Rosso RAL' },
      { hex: '#2A4A2A', nome: 'Verde scuro' }, { hex: '#1A1A2A', nome: 'Antracite RAL' },
    ],
  },
  {
    value: 'lamiera_aggraffata', label: 'Lamiera aggraffata', desc: 'Pannelli con nervature verticali, elegante',
    emoji: '▧', gruppo: 'Lamiera',
    coloriSuggeriti: [
      { hex: '#2A2A3A', nome: 'Antracite' }, { hex: '#8A8A9A', nome: 'Grigio titanio' },
      { hex: '#3A4A3A', nome: 'Verde scuro' }, { hex: '#C0A060', nome: 'Rame invecchiato' },
    ],
  },
  {
    value: 'lamiera_zinco_titanio', label: 'Zinco titanio', desc: 'Grigio piombo con patina, premium e durevole',
    emoji: '🔘', gruppo: 'Lamiera',
    coloriSuggeriti: [
      { hex: '#7A8A8A', nome: 'Zinco naturale' }, { hex: '#6A7A8A', nome: 'Blu zinco' },
      { hex: '#8A9080', nome: 'Verde patina' }, { hex: '#5A6A6A', nome: 'Antracite zinco' },
    ],
  },
  {
    value: 'guaina_bituminosa', label: 'Guaina bituminosa', desc: 'Ardesiata, tetto piano, graniglie minerali',
    emoji: '⬜', gruppo: 'Guaina (tetto piano)',
    coloriSuggeriti: [
      { hex: '#3A3A3A', nome: 'Nero ardesiato' }, { hex: '#6A6A6A', nome: 'Grigio graniglie' },
      { hex: '#8A6040', nome: 'Marrone graniglie' }, { hex: '#5A4A3A', nome: 'Bruno scuro' },
    ],
  },
  {
    value: 'guaina_tpo', label: 'Guaina TPO', desc: 'Membrana liscia bianca, industriale e moderna',
    emoji: '⬜', gruppo: 'Guaina (tetto piano)',
    coloriSuggeriti: [
      { hex: '#F0F0F0', nome: 'Bianco TPO' }, { hex: '#D0D0D0', nome: 'Grigio chiaro' },
      { hex: '#E0E0E0', nome: 'Bianco sporco' }, { hex: '#B0B8B0', nome: 'Grigio verde chiaro' },
    ],
  },
  {
    value: 'tegole_fotovoltaiche', label: 'Tegole fotovoltaiche', desc: 'Integrazione solare tipo Solar Roof',
    emoji: '☀️', gruppo: 'Speciale',
    coloriSuggeriti: [
      { hex: '#1A1A2A', nome: 'Blu notte solare' }, { hex: '#2A2A3A', nome: 'Antracite solar' },
      { hex: '#0A0A1A', nome: 'Nero profondo' }, { hex: '#3A3040', nome: 'Viola scuro' },
    ],
  },
];

const MANTO_GRUPPI = ['Tegole in laterizio', 'Tegole', 'Pietra', 'Lamiera', 'Guaina (tetto piano)', 'Speciale'];

const MATERIALE_GRONDA_OPTIONS: { value: MaterialeGrondaia; label: string; desc: string }[] = [
  { value: 'alluminio', label: 'Alluminio', desc: 'Leggero, resistente, verniciabile' },
  { value: 'rame', label: 'Rame', desc: 'Nobile, sviluppa patina verde' },
  { value: 'zinco_titanio', label: 'Zinco titanio', desc: 'Premium, grigio piombo' },
  { value: 'acciaio_zincato', label: 'Acciaio zincato', desc: 'Economico, grigio argento' },
  { value: 'pvc', label: 'PVC', desc: 'Leggero, economico, vari colori' },
];

const COLORI_GRONDA_QUICK = [
  { hex: '#808080', nome: 'Grigio alluminio' },
  { hex: '#B8860B', nome: 'Rame nuovo' },
  { hex: '#4A7A4A', nome: 'Rame invecchiato' },
  { hex: '#F5F5F5', nome: 'Bianco' },
  { hex: '#2C2C2C', nome: 'Antracite' },
  { hex: '#8B4513', nome: 'Marrone' },
  { hex: '#C0C0C0', nome: 'Argento' },
  { hex: '#3C3C3C', nome: 'Nero' },
];

// ─── SectionCard ──────────────────────────────────────────────────────────────

interface SectionCardProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  active: boolean;
  onToggle: (v: boolean) => void;
  color?: 'amber' | 'blue' | 'yellow' | 'green';
  children: React.ReactNode;
}

function SectionCard({ icon, title, subtitle, active, onToggle, color = 'amber', children }: SectionCardProps) {
  const styles: Record<string, { bg: string; text: string; border: string; bodyBg: string; bodyBorder: string }> = {
    amber: { bg: 'bg-amber-100', text: 'text-amber-600', border: 'border-amber-300', bodyBg: 'bg-amber-50/30', bodyBorder: 'border-amber-100' },
    blue: { bg: 'bg-blue-100', text: 'text-blue-600', border: 'border-blue-300', bodyBg: 'bg-blue-50/30', bodyBorder: 'border-blue-100' },
    yellow: { bg: 'bg-yellow-100', text: 'text-yellow-600', border: 'border-yellow-300', bodyBg: 'bg-yellow-50/30', bodyBorder: 'border-yellow-100' },
    green: { bg: 'bg-green-100', text: 'text-green-600', border: 'border-green-300', bodyBg: 'bg-green-50/30', bodyBorder: 'border-green-100' },
  };
  const s = styles[color];

  return (
    <div className={cn('rounded-2xl border-2 transition-all overflow-hidden', active ? `${s.border} shadow-sm` : 'border-border')}>
      <div className="flex items-center gap-3 px-4 py-3 bg-card">
        <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0', s.bg, s.text)}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground text-sm">{title}</p>
          {subtitle && <p className="text-xs text-muted-foreground truncate">{subtitle}</p>}
        </div>
        <Switch checked={active} onCheckedChange={onToggle} />
      </div>
      {active && (
        <div className={cn('px-4 py-3 border-t space-y-3', s.bodyBorder, s.bodyBg)}>
          {children}
        </div>
      )}
    </div>
  );
}

// ─── Componente principale ────────────────────────────────────────────────────

export default function RenderTettoNew() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [showOriginal, setShowOriginal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const {
    foto, fotoPreview, imageBase64,
    originalUrl, handleFotoChange,
    sessionId,
    analizzando, analisi, analizzaTetto,
    tipoTetto, setTipoTetto,
    config, setConfig, updateConfig, countAttive,
    rendering, renderUrl, generaRender,
    reset,
  } = useRenderTetto();

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) handleFotoChange(file);
  }, [handleFotoChange]);

  const canGoNext: Record<number, boolean> = {
    1: !!foto,
    2: true,
    3: countAttive > 0 || !!config.note_libere?.trim(),
    4: true,
    5: true,
  };

  const handleNext = async () => {
    if (step === 1 && foto && imageBase64 && !analisi && !analizzando) {
      await analizzaTetto();
    }
    if (step < 5) setStep(s => s + 1);
  };

  const handleDownload = () => {
    if (!renderUrl) return;
    const a = document.createElement('a');
    a.href = renderUrl;
    a.download = `render-tetto-${Date.now()}.jpg`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-muted/30">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="sticky top-14 md:top-0 z-30 bg-card/95 backdrop-blur border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={() => navigate('/app/render')}
              className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="flex-1 flex flex-col items-center">
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map(s => (
                  <div key={s} className="flex items-center gap-1.5">
                    <button
                      disabled={s > step}
                      onClick={() => s < step && setStep(s)}
                      className={cn(
                        'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all',
                        s === step
                          ? 'bg-amber-500 text-white shadow-md scale-110'
                          : s < step
                          ? 'bg-amber-200 text-amber-700 hover:bg-amber-300 cursor-pointer'
                          : 'bg-muted text-muted-foreground cursor-not-allowed'
                      )}
                    >
                      {s < step ? <Check className="w-3.5 h-3.5" /> : s}
                    </button>
                    {s < 5 && (
                      <div className={cn('w-4 h-0.5 rounded-full', s < step ? 'bg-amber-300' : 'bg-muted')} />
                    )}
                  </div>
                ))}
              </div>
              <span className="text-[10px] text-muted-foreground mt-1 font-medium">
                {['Carica foto', 'Tipo tetto', 'Configura', 'Genera', 'Risultato'][step - 1]}
              </span>
            </div>

            {step < 5 && (
              <Button
                size="sm"
                disabled={!canGoNext[step] || analizzando}
                onClick={handleNext}
                className="bg-amber-500 hover:bg-amber-600 text-white gap-1"
              >
                {analizzando ? (
                  <><Wand2 className="w-3.5 h-3.5 animate-spin" /> Analisi…</>
                ) : step === 3 ? (
                  <>Configura <ChevronRight className="w-3.5 h-3.5" /></>
                ) : (
                  <>Avanti <ChevronRight className="w-3.5 h-3.5" /></>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">

        {/* ══ STEP 1: CARICA FOTO ══════════════════════════════════════════ */}
        {step === 1 && (
          <div className="space-y-5">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto">
                <Upload className="w-7 h-7 text-amber-600" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">Render Tetto</h1>
              <p className="text-muted-foreground text-sm">
                Carica una foto del tetto — l'AI lo trasformerà con i materiali che scegli
              </p>
            </div>

            {/* Drop area */}
            <div
              onDrop={handleDrop}
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onClick={() => !foto && fileInputRef.current?.click()}
              className={cn(
                'relative rounded-2xl border-2 border-dashed transition-all overflow-hidden min-h-[240px]',
                foto ? 'border-amber-300 cursor-default' : 'border-amber-200 hover:border-amber-400 cursor-pointer',
                dragOver && 'border-amber-500 bg-amber-50 scale-[1.01]'
              )}
            >
              {fotoPreview ? (
                <>
                  <img src={fotoPreview} alt="Tetto" className="w-full object-cover" />
                  <button
                    onClick={e => { e.stopPropagation(); reset(); fileInputRef.current?.click(); }}
                    className="absolute top-3 right-3 bg-white/90 hover:bg-white rounded-full p-2 shadow-md"
                  >
                    <RefreshCw className="w-4 h-4 text-muted-foreground" />
                  </button>
                  {analizzando && (
                    <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center">
                      <Wand2 className="w-8 h-8 text-white animate-spin" />
                      <p className="text-white text-sm mt-2 font-medium">Analisi tetto in corso…</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                  <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mb-4">
                    <Upload className="w-8 h-8 text-amber-500" />
                  </div>
                  <p className="font-semibold text-foreground">Trascina qui la foto del tetto</p>
                  <p className="text-muted-foreground text-sm mt-1">o clicca per sfogliare</p>
                  <p className="text-muted-foreground/60 text-xs mt-2">JPG, PNG, WEBP • max 10MB</p>
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={e => {
                const f = e.target.files?.[0];
                if (f) handleFotoChange(f);
              }}
            />

            {/* Analisi risultato */}
            {analisi && (
              <div className="bg-card rounded-2xl border border-amber-200 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500" />
                  <span className="text-sm font-semibold text-foreground">Analisi completata</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { label: 'Tipo tetto', val: analisi.tipo_tetto.replace(/_/g, ' ') },
                    { label: 'Falde', val: `${analisi.numero_falde}` },
                    { label: 'Manto attuale', val: analisi.manto_attuale },
                    { label: 'Pendenza', val: analisi.pendenza_stimata },
                    { label: 'Lucernari', val: analisi.presenza_lucernari ? `Sì (${analisi.numero_lucernari})` : 'No' },
                    { label: 'Note', val: analisi.note_particolari || '–' },
                  ].map(item => (
                    <div key={item.label} className="bg-muted/50 rounded-lg px-3 py-2">
                      <p className="text-muted-foreground">{item.label}</p>
                      <p className="font-medium text-foreground capitalize">{item.val}</p>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  Colori rilevati:
                  {[analisi.colore_manto_hex, analisi.colore_gronda_hex, analisi.colore_pluviali_hex]
                    .filter(Boolean)
                    .map((c, i) => (
                      <div key={i} className="w-5 h-5 rounded-full border border-border shadow-sm" style={{ backgroundColor: c }} />
                    ))}
                </div>
              </div>
            )}

            {foto && !analisi && !analizzando && (
              <Button onClick={analizzaTetto} className="w-full bg-amber-500 hover:bg-amber-600 text-white gap-2">
                <Wand2 className="w-4 h-4" />
                Analizza tetto con AI
              </Button>
            )}
          </div>
        )}

        {/* ══ STEP 2: TIPO TETTO ═══════════════════════════════════════════ */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-bold text-foreground">Tipo di tetto</h2>
              <p className="text-muted-foreground text-sm mt-1">
                {analisi ? `L'AI ha rilevato: ${analisi.tipo_tetto.replace(/_/g, ' ')} — puoi correggerlo` : 'Seleziona la tipologia del tetto'}
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {TIPO_TETTO_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setTipoTetto(opt.value)}
                  className={cn(
                    'p-4 rounded-2xl border-2 text-left transition-all hover:shadow-md',
                    tipoTetto === opt.value
                      ? 'border-amber-500 bg-amber-50 shadow-md'
                      : 'border-border bg-card hover:border-amber-300'
                  )}
                >
                  <p className="text-2xl mb-1">{opt.icon}</p>
                  <p className="font-semibold text-foreground text-sm">{opt.label}</p>
                  <p className="text-muted-foreground text-xs mt-0.5">{opt.desc}</p>
                </button>
              ))}
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
              <p className="text-sm font-medium text-amber-800">💡 Suggerimento</p>
              <p className="text-xs text-amber-700 mt-1">
                Nel prossimo step trovi la configurazione completa — scegli manto, colori e lucernari.
              </p>
            </div>
          </div>
        )}

        {/* ══ STEP 3: CONFIGURA ════════════════════════════════════════════ */}
        {step === 3 && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-foreground">Configura modifiche</h2>
              {countAttive > 0 && (
                <Badge className="bg-amber-500 text-white border-0">
                  {countAttive} attiv{countAttive === 1 ? 'a' : 'e'}
                </Badge>
              )}
            </div>

            {/* ── Sezione Manto ──────────────────────────────────────────── */}
            <SectionCard
              icon={<Layers className="w-4 h-4" />}
              title="Manto di copertura"
              subtitle="Sostituisci il materiale del tetto"
              active={config.manto.attivo}
              onToggle={v => updateConfig('manto', { attivo: v })}
              color="amber"
            >
              {MANTO_GRUPPI.map(gruppo => {
                const opts = MANTO_OPTIONS.filter(o => o.gruppo === gruppo);
                if (!opts.length) return null;
                return (
                  <div key={gruppo}>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1.5">{gruppo}</p>
                    <div className="grid grid-cols-2 gap-2">
                      {opts.map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => updateConfig('manto', { tipo: opt.value })}
                          className={cn(
                            'p-2.5 rounded-xl border-2 text-left transition-all text-sm',
                            config.manto.tipo === opt.value
                              ? 'border-amber-500 bg-amber-50'
                              : 'border-border hover:border-amber-300'
                          )}
                        >
                          <span>{opt.emoji} </span>
                          <span className="font-medium text-foreground">{opt.label}</span>
                          <p className="text-muted-foreground text-[11px] mt-0.5">{opt.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}

              {/* Colori suggeriti per il manto selezionato */}
              {(() => {
                const sel = MANTO_OPTIONS.find(o => o.value === config.manto.tipo);
                return sel ? (
                  <div className="space-y-1.5">
                    <p className="text-xs text-muted-foreground font-medium">Colori consigliati per {sel.label}:</p>
                    <div className="flex flex-wrap gap-2">
                      {sel.coloriSuggeriti.map(c => (
                        <button
                          key={c.hex}
                          onClick={() => updateConfig('manto', { colore_hex: c.hex, descrizione_colore: c.nome })}
                          className={cn(
                            'flex items-center gap-2 px-2.5 py-1.5 rounded-lg border-2 text-xs transition-all',
                            config.manto.colore_hex === c.hex
                              ? 'border-amber-500 bg-amber-50 font-medium'
                              : 'border-border hover:border-amber-300'
                          )}
                        >
                          <div className="w-4 h-4 rounded-full border border-border" style={{ backgroundColor: c.hex }} />
                          {c.nome}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null;
              })()}

              {/* Color picker + finitura */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Colore personalizzato</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <label className="relative w-9 h-9 rounded-lg overflow-hidden border border-border cursor-pointer flex-shrink-0">
                      <div className="w-full h-full" style={{ backgroundColor: config.manto.colore_hex }} />
                      <input
                        type="color"
                        value={config.manto.colore_hex}
                        onChange={e => updateConfig('manto', { colore_hex: e.target.value })}
                        className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                      />
                    </label>
                    <Input
                      value={config.manto.colore_hex}
                      onChange={e => updateConfig('manto', { colore_hex: e.target.value })}
                      className="h-9 text-xs font-mono"
                      placeholder="#8B3A2C"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Finitura superficie</Label>
                  <Select value={config.manto.finitura} onValueChange={v => updateConfig('manto', { finitura: v as any })}>
                    <SelectTrigger className="mt-1 h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="opaco">Opaco</SelectItem>
                      <SelectItem value="semi_lucido">Semi-lucido</SelectItem>
                      <SelectItem value="lucido">Lucido</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </SectionCard>

            {/* ── Sezione Gronde ─────────────────────────────────────────── */}
            <SectionCard
              icon={<Droplets className="w-4 h-4" />}
              title="Gronde e pluviali"
              subtitle="Cambia materiale e colore delle grondaie"
              active={config.gronde.attivo}
              onToggle={v => updateConfig('gronde', { attivo: v })}
              color="blue"
            >
              <div className="space-y-2">
                <Label className="text-xs">Materiale</Label>
                <div className="space-y-1.5">
                  {MATERIALE_GRONDA_OPTIONS.map(opt => (
                    <label key={opt.value} className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="radio"
                        name="materiale_gronda"
                        checked={config.gronde.materiale === opt.value}
                        onChange={() => updateConfig('gronde', { materiale: opt.value })}
                        className="accent-amber-500"
                      />
                      <div>
                        <span className="text-sm font-medium text-foreground">{opt.label}</span>
                        <span className="text-xs text-muted-foreground ml-1.5">— {opt.desc}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Colore grondaia</Label>
                <div className="flex flex-wrap gap-1.5">
                  {COLORI_GRONDA_QUICK.map(c => (
                    <button
                      key={c.hex}
                      onClick={() => updateConfig('gronde', { colore_hex: c.hex })}
                      title={c.nome}
                      className={cn(
                        'w-7 h-7 rounded-full border-2 transition-all hover:scale-110',
                        config.gronde.colore_hex === c.hex
                          ? 'border-amber-500 scale-110'
                          : 'border-transparent hover:border-muted-foreground/30'
                      )}
                      style={{ backgroundColor: c.hex, boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }}
                    />
                  ))}
                  <label className="relative">
                    <div className="w-7 h-7 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center text-muted-foreground text-xs cursor-pointer hover:border-muted-foreground/60">
                      +
                      <input
                        type="color"
                        value={config.gronde.colore_hex}
                        onChange={e => updateConfig('gronde', { colore_hex: e.target.value })}
                        className="opacity-0 absolute w-0 h-0"
                      />
                    </div>
                  </label>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="w-4 h-4 rounded-full border border-border" style={{ backgroundColor: config.gronde.colore_hex }} />
                  {config.gronde.colore_hex}
                </div>
              </div>
            </SectionCard>

            {/* ── Sezione Lucernari ──────────────────────────────────────── */}
            <SectionCard
              icon={<Sun className="w-4 h-4" />}
              title="Lucernari"
              subtitle={analisi?.presenza_lucernari ? `Tetto ha ${analisi.numero_lucernari} lucernari esistenti` : 'Aggiungi lucernari al tetto'}
              active={config.lucernari.attivo}
              onToggle={v => updateConfig('lucernari', { attivo: v })}
              color="yellow"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Tipo lucernario</Label>
                  <Select value={config.lucernari.tipo} onValueChange={v => updateConfig('lucernari', { tipo: v as any })}>
                    <SelectTrigger className="mt-1 h-9 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="piatto">🔲 Piatto (filo tetto)</SelectItem>
                      <SelectItem value="sporgente">🪟 Sporgente (Velux)</SelectItem>
                      <SelectItem value="abbaino">🏠 Abbaino (frontone)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Quantità</Label>
                  <Select value={String(config.lucernari.quantita)} onValueChange={v => updateConfig('lucernari', { quantita: parseInt(v) as any })}>
                    <SelectTrigger className="mt-1 h-9 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 lucernario</SelectItem>
                      <SelectItem value="2">2 lucernari</SelectItem>
                      <SelectItem value="3">3 lucernari</SelectItem>
                      <SelectItem value="4">4 lucernari</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Posizione</Label>
                  <Select value={config.lucernari.posizione} onValueChange={v => updateConfig('lucernari', { posizione: v as any })}>
                    <SelectTrigger className="mt-1 h-9 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="centrale">Centrale</SelectItem>
                      <SelectItem value="laterale">Laterale</SelectItem>
                      <SelectItem value="distribuiti">Distribuiti</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Colore telaio</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <label className="relative w-9 h-9 rounded-lg overflow-hidden border border-border cursor-pointer flex-shrink-0">
                      <div className="w-full h-full" style={{ backgroundColor: config.lucernari.colore_telaio_hex }} />
                      <input
                        type="color"
                        value={config.lucernari.colore_telaio_hex}
                        onChange={e => updateConfig('lucernari', { colore_telaio_hex: e.target.value })}
                        className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                      />
                    </label>
                    <Input
                      value={config.lucernari.colore_telaio_hex}
                      onChange={e => updateConfig('lucernari', { colore_telaio_hex: e.target.value })}
                      className="h-9 text-xs font-mono"
                    />
                  </div>
                </div>
              </div>
            </SectionCard>

            {/* Note libere */}
            <div>
              <Label className="text-sm">Note aggiuntive (opzionale)</Label>
              <Textarea
                value={config.note_libere || ''}
                onChange={e => setConfig(prev => ({ ...prev, note_libere: e.target.value }))}
                className="mt-2 text-sm resize-none"
                rows={2}
                placeholder="es. mantieni i comignoli in mattoni, aggiungi pannelli solari…"
              />
            </div>
          </div>
        )}

        {/* ══ STEP 4: GENERA ═══════════════════════════════════════════════ */}
        {step === 4 && (
          <div className="space-y-5">
            <div className="text-center">
              <h2 className="text-xl font-bold text-foreground">Pronto per generare</h2>
              <p className="text-muted-foreground text-sm mt-1">Controlla il riepilogo e avvia la generazione AI</p>
            </div>

            {fotoPreview && (
              <div className="rounded-2xl overflow-hidden border border-amber-200">
                <img src={fotoPreview} alt="Tetto originale" className="w-full object-cover max-h-60" />
                <div className="bg-amber-50 px-4 py-2 text-xs text-amber-600 font-medium">Foto originale</div>
              </div>
            )}

            <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
              <p className="text-sm font-semibold text-foreground">Modifiche da applicare:</p>

              {config.manto.attivo && (
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                    <Layers className="w-3.5 h-3.5 text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">
                      {MANTO_OPTIONS.find(o => o.value === config.manto.tipo)?.label || config.manto.tipo}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="w-4 h-4 rounded-full border border-border" style={{ backgroundColor: config.manto.colore_hex }} />
                      <span className="text-xs text-muted-foreground">{config.manto.colore_hex} • {config.manto.finitura}</span>
                    </div>
                  </div>
                  <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                </div>
              )}

              {config.gronde.attivo && (
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <Droplets className="w-3.5 h-3.5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">
                      Gronde {MATERIALE_GRONDA_OPTIONS.find(o => o.value === config.gronde.materiale)?.label}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="w-4 h-4 rounded-full border border-border" style={{ backgroundColor: config.gronde.colore_hex }} />
                      <span className="text-xs text-muted-foreground">{config.gronde.colore_hex}</span>
                    </div>
                  </div>
                  <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                </div>
              )}

              {config.lucernari.attivo && (
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-yellow-100 flex items-center justify-center flex-shrink-0">
                    <Sun className="w-3.5 h-3.5 text-yellow-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">
                      {config.lucernari.quantita} lucernar{config.lucernari.quantita === 1 ? 'io' : 'i'} {config.lucernari.tipo}
                    </p>
                    <p className="text-xs text-muted-foreground">{config.lucernari.posizione}</p>
                  </div>
                  <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                </div>
              )}

              {config.note_libere?.trim() && (
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Info className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground italic flex-1">"{config.note_libere.trim()}"</p>
                </div>
              )}

              {countAttive === 0 && !config.note_libere?.trim() && (
                <p className="text-sm text-amber-600 text-center py-2">
                  ⚠️ Nessuna modifica selezionata — torna allo step precedente
                </p>
              )}
            </div>

            <Button
              size="lg"
              className="w-full bg-amber-500 hover:bg-amber-600 text-white h-14 text-base font-semibold gap-2 shadow-lg"
              disabled={rendering || countAttive === 0}
              onClick={async () => {
                const url = await generaRender();
                if (url) setStep(5);
              }}
            >
              {rendering ? (
                <><Wand2 className="w-5 h-5 animate-spin" /> Generazione in corso…</>
              ) : (
                <><Wand2 className="w-5 h-5" /> Genera render AI</>
              )}
            </Button>

            {rendering && (
              <div className="text-center">
                <p className="text-sm text-muted-foreground animate-pulse">
                  L'AI sta applicando le modifiche al tetto… (20-40 secondi)
                </p>
                <div className="mt-3 flex justify-center gap-1">
                  {[0, 1, 2].map(i => (
                    <div
                      key={i}
                      className="w-2 h-2 bg-amber-400 rounded-full animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══ STEP 5: RISULTATO ════════════════════════════════════════════ */}
        {step === 5 && renderUrl && (
          <div className="space-y-5">
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-2">
                <Check className="w-6 h-6 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-foreground">Render completato!</h2>
              <p className="text-muted-foreground text-sm mt-1">Il tuo tetto rinnovato</p>
            </div>

            {fotoPreview ? (
              <BeforeAfterSlider
                beforeSrc={fotoPreview}
                afterSrc={renderUrl}
                className="aspect-[4/3] rounded-2xl border border-amber-200"
              />
            ) : (
              <div className="rounded-2xl overflow-hidden shadow-xl border border-amber-200">
                <img src={renderUrl} alt="Render tetto" className="w-full object-cover" />
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" onClick={() => { setStep(3); setShowOriginal(false); }} className="gap-1.5">
                <RotateCcw className="w-4 h-4" /> Modifica
              </Button>
              <Button onClick={handleDownload} className="bg-amber-500 hover:bg-amber-600 text-white gap-1.5">
                <Download className="w-4 h-4" /> Scarica
              </Button>
            </div>

            <a
              href={`https://wa.me/?text=${encodeURIComponent(`Guarda il render del tetto rinnovato: ${renderUrl || ""}`)}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full h-10 rounded-xl bg-[#25D366] hover:bg-[#20bc5a] text-white text-sm font-medium transition-colors"
            >
              📱 Condividi su WhatsApp
            </a>
            <button
              onClick={() => { reset(); setStep(1); setShowOriginal(false); }}
              className="w-full text-center text-sm text-muted-foreground hover:text-foreground py-2 transition-colors"
            >
              + Nuovo render tetto
            </button>
          </div>
        )}

        {step === 5 && !renderUrl && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Nessun render disponibile</p>
            <Button onClick={() => setStep(4)} variant="outline" className="mt-3">Torna a genera</Button>
          </div>
        )}
      </div>
    </div>
  );
}
