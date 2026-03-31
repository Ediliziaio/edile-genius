import { memo } from 'react';
import { GripVertical, Trash2, ChevronDown, ChevronUp, Star } from 'lucide-react';
import type { DraggableProvided } from '@hello-pangea/dnd';
import type { PreventivoVoce } from '@/lib/preventivo-pdf';
import { computeVoceTotale, formatEuro } from '@/lib/computedTotals';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

const UNITS = ['mq', 'ml', 'mc', 'nr', 'ore', 'forfait', 'kg', 'cad', 'corpo'];

interface VoceRowProps {
  voce: PreventivoVoce;
  index: number;
  expanded: boolean;
  draggableProvided: DraggableProvided;
  onChange: (field: keyof PreventivoVoce, value: any) => void;
  onToggleExpand: () => void;
  onDelete: () => void;
}

export const VoceRow = memo(function VoceRow({
  voce,
  expanded,
  draggableProvided,
  onChange,
  onToggleExpand,
  onDelete,
}: VoceRowProps) {
  const totale = computeVoceTotale(voce);

  const handleNumeric = (field: keyof PreventivoVoce, raw: string) => {
    const n = parseFloat(raw);
    onChange(field, isNaN(n) ? 0 : n);
  };

  return (
    <div
      ref={draggableProvided.innerRef}
      {...draggableProvided.draggableProps}
      className={cn(
        'rounded-xl border bg-card transition-shadow',
        voce.evidenziata && 'border-amber-400/60 bg-amber-50/5',
      )}
    >
      {/* Main row */}
      <div className="flex items-center gap-2 px-3 py-2">
        {/* Drag handle */}
        <div
          {...draggableProvided.dragHandleProps}
          className="text-muted-foreground/40 hover:text-muted-foreground cursor-grab active:cursor-grabbing shrink-0"
        >
          <GripVertical className="h-4 w-4" />
        </div>

        {/* Categoria */}
        <Input
          value={voce.categoria}
          onChange={e => onChange('categoria', e.target.value)}
          placeholder="Categoria"
          className="w-28 h-8 text-xs shrink-0"
        />

        {/* Titolo voce */}
        <Input
          value={voce.titolo_voce}
          onChange={e => onChange('titolo_voce', e.target.value)}
          placeholder="Descrizione voce"
          className="flex-1 h-8 text-sm min-w-0"
        />

        {/* Quantità */}
        <Input
          type="number"
          value={voce.quantita}
          onChange={e => handleNumeric('quantita', e.target.value)}
          className="w-20 h-8 text-sm text-right shrink-0"
          min={0}
        />

        {/* UM */}
        <Select value={voce.unita_misura} onValueChange={v => onChange('unita_misura', v)}>
          <SelectTrigger className="w-24 h-8 text-xs shrink-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {UNITS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
          </SelectContent>
        </Select>

        {/* Prezzo unitario */}
        <div className="relative shrink-0">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">€</span>
          <Input
            type="number"
            value={voce.prezzo_unitario}
            onChange={e => handleNumeric('prezzo_unitario', e.target.value)}
            className="w-28 h-8 text-sm text-right pl-6"
            min={0}
            step={0.01}
          />
        </div>

        {/* Sconto % */}
        <div className="relative shrink-0">
          <Input
            type="number"
            value={voce.sconto_percentuale}
            onChange={e => handleNumeric('sconto_percentuale', e.target.value)}
            className="w-16 h-8 text-sm text-right pr-5"
            min={0}
            max={100}
          />
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
        </div>

        {/* Totale (read-only) */}
        <div className="w-28 text-right text-sm font-semibold shrink-0">
          {formatEuro(totale)}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => onChange('evidenziata', !voce.evidenziata)}
            className={cn(
              'p-1.5 rounded-lg transition-colors',
              voce.evidenziata
                ? 'text-amber-500 hover:text-amber-400'
                : 'text-muted-foreground/40 hover:text-amber-400',
            )}
            title="Evidenzia voce"
          >
            <Star className="h-3.5 w-3.5" fill={voce.evidenziata ? 'currentColor' : 'none'} />
          </button>
          <button
            type="button"
            onClick={onToggleExpand}
            className="p-1.5 rounded-lg text-muted-foreground/50 hover:text-foreground transition-colors"
            title="Espandi/Comprimi"
          >
            {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="p-1.5 rounded-lg text-muted-foreground/40 hover:text-red-500 transition-colors"
            title="Elimina voce"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Expanded: note + descrizione */}
      {expanded && (
        <div className="px-10 pb-3 grid grid-cols-2 gap-3 border-t pt-3">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Descrizione estesa</label>
            <Textarea
              value={voce.descrizione}
              onChange={e => onChange('descrizione', e.target.value)}
              placeholder="Descrizione dettagliata della voce..."
              className="text-xs resize-none"
              rows={2}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Note interne</label>
            <Textarea
              value={voce.note_voce}
              onChange={e => onChange('note_voce', e.target.value)}
              placeholder="Note non visibili al cliente..."
              className="text-xs resize-none"
              rows={2}
            />
          </div>
        </div>
      )}
    </div>
  );
});
