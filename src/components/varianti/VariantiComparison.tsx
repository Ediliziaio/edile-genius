import { useState, useRef } from 'react';
import { Check, ChevronLeft, ChevronRight, Download, Star, X, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { VarianteConfig, VarianteResult } from '@/hooks/useVariantiGenerator';

interface VariantiComparisonProps {
  originalUrl: string;
  varianti: VarianteConfig[];
  results: VarianteResult[];
  onSelectPreferred?: (indice: number) => void;
  onSaveToProgetto?: (indice: number) => void;
  onClose?: () => void;
  preferitaIndice?: number | null;
}

export function VariantiComparison({
  originalUrl,
  varianti,
  results,
  onSelectPreferred,
  onSaveToProgetto,
  onClose,
  preferitaIndice,
}: VariantiComparisonProps) {
  const [selectedIndice, setSelectedIndice] = useState<number | null>(preferitaIndice ?? null);
  const [showOriginal, setShowOriginal] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'focus'>('grid');
  const [focusIndice, setFocusIndice] = useState(0);
  const [saved, setSaved] = useState(false);

  const count = results.length;

  const handleSelect = (indice: number) => {
    setSelectedIndice(indice);
    onSelectPreferred?.(indice);
  };

  const handleSave = async () => {
    if (selectedIndice === null) return;
    onSaveToProgetto?.(selectedIndice);
    setSaved(true);
  };

  const openFocus = (indice: number) => {
    setFocusIndice(indice);
    setViewMode('focus');
  };

  const handleDownload = async (result: VarianteResult, index: number) => {
    try {
      const res = await fetch(result.result_url);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `variante-${index + 1}-${result.nome.toLowerCase().replace(/\s+/g, '-')}.jpg`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // fallback: open in new tab
      window.open(result.result_url, '_blank');
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-950 text-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <Layers className="w-4 h-4 text-primary" />
          </div>
          <span className="font-semibold text-sm">Confronto varianti</span>
          <Badge variant="secondary" className="text-xs">{count} varianti</Badge>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-white/10 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'px-3 py-1 rounded-md text-xs transition-all',
                viewMode === 'grid' ? 'bg-white text-gray-900 font-medium' : 'text-white/70 hover:text-white'
              )}
            >
              Griglia
            </button>
            <button
              onClick={() => setViewMode('focus')}
              className={cn(
                'px-3 py-1 rounded-md text-xs transition-all',
                viewMode === 'focus' ? 'bg-white text-gray-900 font-medium' : 'text-white/70 hover:text-white'
              )}
            >
              Focus
            </button>
          </div>
          {onClose && (
            <button onClick={onClose} className="p-1.5 text-white/60 hover:text-white rounded-lg hover:bg-white/10 transition-colors">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4">
        {viewMode === 'grid' ? (
          <GridView
            originalUrl={originalUrl}
            varianti={varianti}
            results={results}
            selectedIndice={selectedIndice}
            showOriginal={showOriginal}
            onToggleOriginal={(i) => setShowOriginal(showOriginal === i ? null : i)}
            onSelect={handleSelect}
            onFocus={openFocus}
            onDownload={handleDownload}
          />
        ) : (
          <FocusView
            originalUrl={originalUrl}
            varianti={varianti}
            results={results}
            focusIndice={focusIndice}
            selectedIndice={selectedIndice}
            count={count}
            onChangeFocus={setFocusIndice}
            onSelect={handleSelect}
            onDownload={handleDownload}
          />
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-white/10 flex items-center justify-between">
        <div className="text-sm text-white/60">
          {selectedIndice !== null ? (
            <span className="text-primary font-medium">✓ Selezionata: {results[selectedIndice]?.nome}</span>
          ) : (
            'Clicca "Scegli" su una variante per selezionarla'
          )}
        </div>
        <div className="flex items-center gap-2">
          {onClose && (
            <Button variant="outline" size="sm" onClick={onClose} className="border-white/20 text-white hover:bg-white/10">
              Chiudi
            </Button>
          )}
          {onSaveToProgetto && (
            <Button
              size="sm"
              disabled={selectedIndice === null || saved}
              onClick={handleSave}
            >
              {saved ? (
                <><Check className="w-3.5 h-3.5 mr-1" /> Salvata nel progetto</>
              ) : (
                <><Star className="w-3.5 h-3.5 mr-1" /> Salva preferita</>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── GridView ─────────────────────────────────────────────────────────────────

interface GridViewProps {
  originalUrl: string;
  varianti: VarianteConfig[];
  results: VarianteResult[];
  selectedIndice: number | null;
  showOriginal: number | null;
  onToggleOriginal: (i: number) => void;
  onSelect: (i: number) => void;
  onFocus: (i: number) => void;
  onDownload: (r: VarianteResult, i: number) => void;
}

function GridView({
  originalUrl, varianti, results, selectedIndice,
  showOriginal, onToggleOriginal, onSelect, onFocus, onDownload
}: GridViewProps) {
  const count = results.length;

  return (
    <div className={cn('grid gap-4', count <= 2 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3')}>
      {results.map((result, i) => {
        const isSelected = selectedIndice === i;
        const isShowingOriginal = showOriginal === i;
        const config = varianti[i];

        return (
          <div key={i} className={cn(
            'relative rounded-xl overflow-hidden bg-gray-900 border-2 transition-all',
            isSelected ? 'border-primary shadow-lg shadow-primary/20' : 'border-white/10 hover:border-white/20'
          )}>
            {/* Badge variante */}
            <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5">
              <div className="w-4 h-4 rounded-full border-2 border-white shadow-md" style={{ backgroundColor: config?.colore_hex }} />
              <span className="bg-black/70 text-white text-xs font-medium px-2 py-0.5 rounded-full backdrop-blur-sm">
                {result.nome}
              </span>
            </div>

            {/* Badge selezionata */}
            {isSelected && (
              <div className="absolute top-3 right-3 z-10">
                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                  <Check className="w-3.5 h-3.5 text-primary-foreground" />
                </div>
              </div>
            )}

            {/* Immagine */}
            <div className="cursor-pointer aspect-[4/3]" onClick={() => onFocus(i)}>
              <img
                src={isShowingOriginal ? originalUrl : result.result_url}
                alt={result.nome}
                className="w-full h-full object-cover"
                draggable={false}
              />
              {/* Overlay hover */}
              <div className="absolute inset-0 bg-black/0 hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
                <span className="bg-white/90 text-gray-900 text-xs font-medium px-3 py-1.5 rounded-full">
                  Espandi
                </span>
              </div>
            </div>

            {/* Barra azioni */}
            <div className="flex items-center gap-1 p-2 bg-gray-900/90">
              <button
                onClick={() => onToggleOriginal(i)}
                className={cn(
                  'text-xs px-2 py-1 rounded-md transition-colors flex-shrink-0',
                  isShowingOriginal
                    ? 'bg-amber-500/20 text-amber-300 font-medium'
                    : 'text-white/50 hover:text-white/80 hover:bg-white/10'
                )}
              >
                {isShowingOriginal ? 'Prima ↩' : 'Mostra prima'}
              </button>

              <div className="flex-1" />

              <button
                onClick={() => onDownload(result, i)}
                className="p-1.5 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => onSelect(i)}
                className={cn(
                  'text-xs px-3 py-1.5 rounded-lg font-medium transition-all',
                  isSelected
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-white/10 text-white/80 hover:bg-white/20'
                )}
              >
                {isSelected ? '✓ Scelta' : 'Scegli'}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── FocusView ────────────────────────────────────────────────────────────────

interface FocusViewProps {
  originalUrl: string;
  varianti: VarianteConfig[];
  results: VarianteResult[];
  focusIndice: number;
  selectedIndice: number | null;
  count: number;
  onChangeFocus: (i: number) => void;
  onSelect: (i: number) => void;
  onDownload: (r: VarianteResult, i: number) => void;
}

function FocusView({
  originalUrl, varianti, results,
  focusIndice, selectedIndice, count,
  onChangeFocus, onSelect, onDownload
}: FocusViewProps) {
  const [showOrig, setShowOrig] = useState(false);
  const result = results[focusIndice];
  const config = varianti[focusIndice];
  const isSelected = selectedIndice === focusIndice;

  const touchStartX = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(delta) > 50) {
      if (delta < 0 && focusIndice < count - 1) onChangeFocus(focusIndice + 1);
      if (delta > 0 && focusIndice > 0) onChangeFocus(focusIndice - 1);
    }
    touchStartX.current = null;
  };

  if (!result) return null;

  return (
    <div className="space-y-4">
      {/* Main image with swipe */}
      <div
        className="relative rounded-xl overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{ touchAction: 'pan-y' }}
      >
        <img
          src={showOrig ? originalUrl : result.result_url}
          alt={result.nome}
          className="w-full rounded-xl"
          draggable={false}
        />

        {/* Nav arrows */}
        {focusIndice > 0 && (
          <button
            onClick={() => onChangeFocus(focusIndice - 1)}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center text-white transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
        {focusIndice < count - 1 && (
          <button
            onClick={() => onChangeFocus(focusIndice + 1)}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center text-white transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}

        {/* Badge */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5">
          <div className="w-4 h-4 rounded-full border-2 border-white" style={{ backgroundColor: config?.colore_hex }} />
          <span className="bg-black/70 backdrop-blur-sm text-white text-xs font-medium px-2 py-0.5 rounded-full">
            {result.nome}
          </span>
          {isSelected && <Check className="w-4 h-4 text-primary" />}
        </div>

        {showOrig && (
          <div className="absolute bottom-3 left-3 bg-amber-500/80 text-white text-xs px-2 py-1 rounded-full font-medium">
            Immagine originale
          </div>
        )}
      </div>

      {/* Thumbnail strip */}
      <div className="space-y-3">
        <div className="flex gap-2 overflow-x-auto pb-1 justify-center">
          {results.map((r, i) => (
            <button
              key={i}
              onClick={() => onChangeFocus(i)}
              className={cn(
                'relative rounded-lg overflow-hidden transition-all flex-shrink-0',
                i === focusIndice
                  ? 'ring-2 ring-primary ring-offset-1 ring-offset-gray-950 w-20 h-14'
                  : 'opacity-60 hover:opacity-90 w-16 h-11'
              )}
            >
              <img src={r.result_url} alt={r.nome} className="w-full h-full object-cover" />
              {selectedIndice === i && (
                <div className="absolute inset-0 bg-primary/30 flex items-center justify-center">
                  <Check className="w-3.5 h-3.5 text-white" />
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowOrig(!showOrig)}
            className={cn(
              'text-xs px-3 py-1.5 rounded-lg transition-colors',
              showOrig
                ? 'bg-amber-500/20 text-amber-300'
                : 'bg-white/10 text-white/70 hover:bg-white/20'
            )}
          >
            {showOrig ? '← Dopo' : 'Mostra prima'}
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onDownload(result, focusIndice)}
              className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={() => onSelect(focusIndice)}
              className={cn(
                'text-sm px-4 py-2 rounded-lg font-medium transition-all',
                isSelected
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-white/15 text-white hover:bg-white/25'
              )}
            >
              {isSelected ? '✓ Selezionata' : 'Scegli questa'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
