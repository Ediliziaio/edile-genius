import { Info, Wind, Sun, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AnalisiTetto } from '../types';

interface TettoAnalisiCardProps {
  analisi: AnalisiTetto;
  compact?: boolean;
  className?: string;
}

const TIPO_LABEL: Record<string, string> = {
  a_falde: 'A falde',
  piano: 'Piano',
  mansardato: 'Mansardato',
  padiglione: 'A padiglione',
  altro: 'Altro',
};

const PENDENZA_INFO: Record<string, { label: string; color: string }> = {
  bassa: { label: 'Bassa (<15°)', color: 'text-blue-600 bg-blue-50' },
  media: { label: 'Media (15–35°)', color: 'text-amber-600 bg-amber-50' },
  alta: { label: 'Alta (>35°)', color: 'text-red-600 bg-red-50' },
};

export function TettoAnalisiCard({ analisi, compact = false, className }: TettoAnalisiCardProps) {
  if (compact) {
    return (
      <div className={cn('flex flex-wrap items-center gap-2', className)}>
        <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-amber-50 text-amber-700 px-2 py-1 rounded-full">
          <span className="w-3 h-3 rounded-full border border-amber-300" style={{ backgroundColor: analisi.colore_manto_hex }} />
          {analisi.manto_attuale}
        </span>
        <span className="text-xs font-medium bg-muted text-muted-foreground px-2 py-1 rounded-full">
          {TIPO_LABEL[analisi.tipo_tetto] || analisi.tipo_tetto}
        </span>
        <span className="text-xs font-medium bg-muted text-muted-foreground px-2 py-1 rounded-full">
          {analisi.numero_falde} {analisi.numero_falde === 1 ? 'falda' : 'falde'}
        </span>
        {analisi.presenza_lucernari && (
          <span className="text-xs font-medium bg-yellow-50 text-yellow-700 px-2 py-1 rounded-full">
            ☀️ {analisi.numero_lucernari} lucernar{analisi.numero_lucernari === 1 ? 'io' : 'i'}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={cn('rounded-2xl border border-amber-200 bg-card overflow-hidden', className)}>
      {/* Color bar */}
      <div className="h-2 w-full" style={{ backgroundColor: analisi.colore_manto_hex }} />

      <div className="p-4 space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Info className="w-4 h-4 text-amber-500" />
          Analisi AI tetto
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          {/* Tipo tetto */}
          <div>
            <p className="text-xs text-muted-foreground">Tipo</p>
            <p className="font-medium text-foreground">
              {TIPO_LABEL[analisi.tipo_tetto] || analisi.tipo_tetto}
            </p>
          </div>

          {/* Falde */}
          <div>
            <p className="text-xs text-muted-foreground">Falde</p>
            <p className="font-medium text-foreground">
              {analisi.numero_falde} {analisi.numero_falde === 1 ? 'falda' : 'falde'}
            </p>
          </div>

          {/* Manto attuale */}
          <div>
            <p className="text-xs text-muted-foreground">Manto attuale</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-4 h-4 rounded-full border border-border" style={{ backgroundColor: analisi.colore_manto_hex }} />
              <span className="font-medium text-foreground">{analisi.manto_attuale}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{analisi.colore_manto_attuale}</p>
          </div>

          {/* Pendenza */}
          <div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Wind className="w-3 h-3" /> Pendenza
            </div>
            <span className={cn('inline-block text-xs font-medium px-2 py-0.5 rounded-full mt-1', PENDENZA_INFO[analisi.pendenza_stimata]?.color)}>
              {PENDENZA_INFO[analisi.pendenza_stimata]?.label || analisi.pendenza_stimata}
            </span>
          </div>

          {/* Lucernari */}
          <div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Sun className="w-3 h-3" /> Lucernari
            </div>
            <p className="font-medium text-foreground mt-0.5">
              {analisi.presenza_lucernari
                ? `${analisi.numero_lucernari} presenti`
                : 'Assenti'}
            </p>
          </div>

          {/* Gronda */}
          <div>
            <p className="text-xs text-muted-foreground">Grondaie</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-4 h-4 rounded-full border border-border" style={{ backgroundColor: analisi.colore_gronda_hex }} />
              <span className="font-medium text-foreground">{analisi.colore_gronda_attuale}</span>
            </div>
          </div>

          {/* Note */}
          {analisi.note_particolari && (
            <div className="col-span-2">
              <p className="text-xs text-muted-foreground">Note</p>
              <p className="text-sm text-foreground mt-0.5">{analisi.note_particolari}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
