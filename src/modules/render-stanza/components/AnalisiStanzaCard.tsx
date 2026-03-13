import { type AnalisiStanza } from '@/modules/render-stanza/lib/stanzaPromptBuilder';
import { Paintbrush, LayoutGrid, Sofa, Lightbulb, Home } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface AnalisiStanzaCardProps {
  analisi: AnalisiStanza;
  compact?: boolean;
  className?: string;
}

export function AnalisiStanzaCard({ analisi, compact = false, className = '' }: AnalisiStanzaCardProps) {
  return (
    <div className={`rounded-xl border border-border bg-card p-4 space-y-3 ${className}`}>
      {/* Palette */}
      {analisi.palette_principale && analisi.palette_principale.length > 0 && (
        <div className="flex gap-1.5">
          {analisi.palette_principale.map((hex, i) => (
            <div
              key={i}
              className="w-6 h-6 rounded-full border border-border shadow-sm"
              style={{ backgroundColor: hex }}
              title={hex}
            />
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 text-sm">
        {/* Pareti */}
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-muted-foreground font-medium">
            <Paintbrush className="w-3.5 h-3.5" />
            Pareti
          </div>
          <div className="flex items-center gap-1.5">
            {analisi.pareti?.colore_hex && (
              <div
                className="w-4 h-4 rounded-full border border-border"
                style={{ backgroundColor: analisi.pareti.colore_hex }}
              />
            )}
            <span className="text-foreground text-xs">
              {analisi.pareti?.colore_principale}
              {analisi.pareti?.finitura ? ` · ${analisi.pareti.finitura}` : ''}
            </span>
          </div>
        </div>

        {/* Pavimento */}
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-muted-foreground font-medium">
            <LayoutGrid className="w-3.5 h-3.5" />
            Pavimento
          </div>
          <div className="flex items-center gap-1.5">
            {analisi.pavimento?.colore_hex && (
              <div
                className="w-4 h-4 rounded-full border border-border"
                style={{ backgroundColor: analisi.pavimento.colore_hex }}
              />
            )}
            <span className="text-foreground text-xs">
              {analisi.pavimento?.tipo?.replace(/_/g, ' ')}
            </span>
          </div>
        </div>

        {/* Arredo */}
        {!compact && (
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-muted-foreground font-medium">
              <Sofa className="w-3.5 h-3.5" />
              Arredo
            </div>
            <span className="text-foreground text-xs">
              {analisi.arredo?.stile?.replace(/_/g, ' ')} · {analisi.arredo?.densita}
            </span>
          </div>
        )}

        {/* Illuminazione */}
        {!compact && (
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-muted-foreground font-medium">
              <Lightbulb className="w-3.5 h-3.5" />
              Luce
            </div>
            <span className="text-foreground text-xs">
              {analisi.illuminazione?.temperatura_stimata} · {analisi.illuminazione?.luminosita_ambiente}
            </span>
          </div>
        )}

        {/* Caratteristiche speciali */}
        {analisi.caratteristiche_speciali && (
          <div className="col-span-2 flex gap-1.5 flex-wrap">
            {analisi.caratteristiche_speciali.presenza_camino && (
              <Badge variant="outline" className="text-xs">🔥 Camino</Badge>
            )}
            {analisi.caratteristiche_speciali.presenza_travi && (
              <Badge variant="outline" className="text-xs">🪵 Travi</Badge>
            )}
            {analisi.caratteristiche_speciali.presenza_arco && (
              <Badge variant="outline" className="text-xs">🌙 Archi</Badge>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
