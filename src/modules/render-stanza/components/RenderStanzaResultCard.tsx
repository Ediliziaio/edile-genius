import { useState } from 'react';
import { Heart, Download, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const INTERVENTO_EMOJI: Record<string, string> = {
  verniciatura:        '🎨',
  pavimento:           '⬜',
  arredo:              '🛋️',
  soffitto:            '🏠',
  illuminazione:       '💡',
  carta_da_parati:     '🌸',
  rivestimento_pareti: '🧱',
  tende:               '🪟',
  restyling_cucina:    '🍳',
  restyling_bagno:     '🚿',
};

const TIPO_STANZA_EMOJI: Record<string, string> = {
  soggiorno:       '🛋️',
  cucina:          '🍳',
  camera_da_letto: '🛏️',
  bagno:           '🚿',
  studio:          '💻',
  sala_da_pranzo:  '🍽️',
  corridoio:       '🚪',
  altro:           '🏠',
};

interface RenderStanzaResultCardProps {
  originalUrl: string;
  resultUrl: string;
  tipoStanza?: string;
  interventiEseguiti?: string[];
  createdAt?: string;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  onView?: () => void;
}

export function RenderStanzaResultCard({
  originalUrl,
  resultUrl,
  tipoStanza = 'soggiorno',
  interventiEseguiti = [],
  createdAt,
  isFavorite = false,
  onToggleFavorite,
  onView,
}: RenderStanzaResultCardProps) {
  const [showOriginal, setShowOriginal] = useState(false);
  const [hovering, setHovering] = useState(false);

  const stanzaEmoji = TIPO_STANZA_EMOJI[tipoStanza] || '🏠';

  return (
    <div
      className="group rounded-xl overflow-hidden border border-border bg-card shadow-sm hover:shadow-md transition-all"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={showOriginal ? originalUrl : resultUrl}
          alt={showOriginal ? 'Prima' : 'Dopo'}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover transition-all duration-300"
        />

        <div className={`absolute inset-0 transition-opacity duration-200 ${hovering ? 'opacity-100' : 'opacity-0'}`}>
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/60 to-transparent" />

          {/* Before/after toggle */}
          <button
            onClick={() => setShowOriginal(prev => !prev)}
            className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2.5 py-1 rounded-full font-medium hover:bg-black/80 transition-colors"
          >
            {showOriginal ? 'Prima' : 'Dopo'}
          </button>

          {/* Actions */}
          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
            <a
              href={resultUrl}
              download
              onClick={e => e.stopPropagation()}
              className="flex items-center gap-1.5 bg-background/90 text-foreground text-xs px-2.5 py-1.5 rounded-full font-medium hover:bg-background transition-colors"
            >
              <Download className="w-3 h-3" />
              Scarica
            </a>

            <div className="flex gap-1.5">
              {onView && (
                <button onClick={onView} className="p-1.5 bg-background/90 rounded-full hover:bg-background transition-colors">
                  <Eye className="w-3.5 h-3.5 text-foreground" />
                </button>
              )}
              {onToggleFavorite && (
                <button onClick={onToggleFavorite} className="p-1.5 bg-background/90 rounded-full hover:bg-background transition-colors">
                  <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-foreground'}`} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Room type badge */}
        <div className="absolute top-2 right-2">
          <Badge variant="secondary" className="text-xs">
            {stanzaEmoji}
          </Badge>
        </div>
      </div>

      {/* Footer */}
      <div className="p-3 space-y-2">
        {interventiEseguiti.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {interventiEseguiti.slice(0, 4).map(k => (
              <Badge key={k} variant="outline" className="text-[10px] py-0 px-1.5">
                {INTERVENTO_EMOJI[k] || '✨'} {k.replace(/_/g, ' ')}
              </Badge>
            ))}
            {interventiEseguiti.length > 4 && (
              <Badge variant="outline" className="text-[10px] py-0 px-1.5">+{interventiEseguiti.length - 4}</Badge>
            )}
          </div>
        )}

        {createdAt && (
          <p className="text-[10px] text-muted-foreground">
            {new Date(createdAt).toLocaleDateString('it-IT', {
              day: 'numeric', month: 'short', year: 'numeric'
            })}
          </p>
        )}
      </div>
    </div>
  );
}
