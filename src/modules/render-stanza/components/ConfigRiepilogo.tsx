import { type ConfigurazioneStanza } from '@/modules/render-stanza/lib/stanzaPromptBuilder';
import {
  Paintbrush, LayoutGrid, Sofa, Layers, Lightbulb,
  Wallpaper, BookOpen, Home, UtensilsCrossed, Bath
} from 'lucide-react';

const ICON_MAP: Record<string, React.ElementType> = {
  verniciatura:        Paintbrush,
  pavimento:           LayoutGrid,
  arredo:              Sofa,
  soffitto:            Layers,
  illuminazione:       Lightbulb,
  carta_da_parati:     Wallpaper,
  rivestimento_pareti: BookOpen,
  tende:               Home,
  restyling_cucina:    UtensilsCrossed,
  restyling_bagno:     Bath,
};

const LABEL_MAP: Record<string, string> = {
  verniciatura:        'Verniciatura',
  pavimento:           'Pavimento',
  arredo:              'Arredo',
  soffitto:            'Soffitto',
  illuminazione:       'Illuminazione',
  carta_da_parati:     'Carta da parati',
  rivestimento_pareti: 'Rivestimento',
  tende:               'Tende',
  restyling_cucina:    'Cucina',
  restyling_bagno:     'Bagno',
};

function getConfigSummary(key: string, config: ConfigurazioneStanza): string {
  const c = (config as any)[key];
  if (!c || !c.attivo) return '';

  switch (key) {
    case 'verniciatura': {
      const applies = c.applica_a === 'tutte' ? 'tutte le pareti' : c.applica_a?.replace(/_/g, ' ');
      return [c.colore_nome || c.colore_hex, c.finitura, applies].filter(Boolean).join(' · ');
    }
    case 'pavimento':
      return [c.tipo?.replace(/_/g, ' '), c.pattern?.replace(/_/g, ' '), c.finitura].filter(Boolean).join(' · ');
    case 'arredo':
      return [c.intensita_cambio?.replace(/_/g, ' '), c.materiale].filter(Boolean).join(' · ');
    case 'soffitto':
      return [c.tipo?.replace(/_/g, ' '), c.colore_nome || c.colore_hex].filter(Boolean).join(' · ');
    case 'illuminazione':
      return [c.tipo?.replace(/_/g, ' '), c.temperatura, c.intensita_luce].filter(Boolean).join(' · ');
    case 'carta_da_parati':
      return [c.stile_pattern, c.colore_base ? `base ${c.colore_base}` : ''].filter(Boolean).join(' · ');
    case 'rivestimento_pareti':
      return [c.tipo?.replace(/_/g, ' '), c.colore_nome || c.colore_hex].filter(Boolean).join(' · ');
    case 'tende':
      return c.tipo === 'nessuna' ? 'Rimuovi tende' : [c.tipo?.replace(/_/g, ' '), c.colore_nome || c.colore_hex].filter(Boolean).join(' · ');
    case 'restyling_cucina': {
      const parts = [];
      if (c.colore_frontali_hex) parts.push('frontali');
      if (c.piano_lavoro_materiale) parts.push('piano lavoro');
      if (c.maniglie) parts.push('maniglie');
      return parts.join(' · ') || 'configurato';
    }
    case 'restyling_bagno': {
      const parts = [];
      if (c.colore_rivestimento_hex) parts.push('rivestimento');
      if (c.cambia_sanitari) parts.push('sanitari');
      if (c.cambia_rubinetteria) parts.push('rubinetteria');
      return parts.join(' · ') || 'configurato';
    }
    default:
      return '';
  }
}

interface ConfigRiepilogoProps {
  config: ConfigurazioneStanza;
  className?: string;
}

export function ConfigRiepilogo({ config, className = '' }: ConfigRiepilogoProps) {
  const INTERVENTI_KEYS = [
    'verniciatura', 'pavimento', 'arredo', 'soffitto', 'illuminazione',
    'carta_da_parati', 'rivestimento_pareti', 'tende', 'restyling_cucina', 'restyling_bagno',
  ];

  const attivi = INTERVENTI_KEYS.filter(k => {
    const c = (config as any)[k];
    return c && c.attivo;
  });

  if (attivi.length === 0) {
    return (
      <div className={`text-sm text-muted-foreground italic p-3 ${className}`}>
        Nessun intervento selezionato
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {attivi.map(key => {
        const Icon = ICON_MAP[key] || Paintbrush;
        const summary = getConfigSummary(key, config);
        return (
          <div key={key} className="flex items-start gap-3 p-2 rounded-lg bg-muted/50">
            <div className="w-7 h-7 flex items-center justify-center rounded-md bg-primary/10 text-primary flex-shrink-0">
              <Icon className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">{LABEL_MAP[key]}</p>
              {summary && (
                <p className="text-xs text-muted-foreground truncate">{summary}</p>
              )}
            </div>
          </div>
        );
      })}

      {config.stile_target && config.stile_target !== 'nessuno' as any && (
        <div className="pt-2 border-t border-border">
          <span className="text-xs text-muted-foreground">
            Stile target: <span className="font-medium text-foreground">{config.stile_target}</span>
            {' · '}
            Intensità: <span className="font-medium text-foreground">{config.intensita}</span>
          </span>
        </div>
      )}
    </div>
  );
}
