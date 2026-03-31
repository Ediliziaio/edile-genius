import { useState, useRef, useEffect } from 'react';
import { Search, Plus, Loader2 } from 'lucide-react';
import { useListinoSearch } from '@/hooks/useListinoSearch';
import type { ListinoVoce } from '@/hooks/useListinoSearch';
import type { PreventivoVoce } from '@/lib/preventivo-pdf';
import { formatEuro } from '@/lib/computedTotals';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface CercaListinoPopoverProps {
  companyId: string | null | undefined;
  onSelectVoce: (voce: Omit<PreventivoVoce, 'id' | 'ordine'>) => void;
}

export function CercaListinoPopover({ companyId, onSelectVoce }: CercaListinoPopoverProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const { results, loading, search, clear } = useListinoSearch({ companyId });
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      search(''); // load all on open
    } else {
      clear();
      setQuery('');
    }
  }, [open, search, clear]);

  const handleQuery = (q: string) => {
    setQuery(q);
    search(q);
  };

  const handleSelect = (lv: ListinoVoce) => {
    onSelectVoce({
      categoria: lv.categoria,
      titolo_voce: lv.titolo_voce,
      descrizione: lv.descrizione ?? '',
      unita_misura: lv.unita_misura,
      quantita: 1,
      prezzo_unitario: lv.prezzo_unitario,
      sconto_percentuale: 0,
      totale: lv.prezzo_unitario,
      foto_urls: [],
      note_voce: lv.note ?? '',
      evidenziata: false,
    });
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8">
          <Search className="h-3.5 w-3.5" />
          Cerca nel listino
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="start">
        <div className="p-2 border-b">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              ref={inputRef}
              value={query}
              onChange={e => handleQuery(e.target.value)}
              placeholder="Cerca voce di listino..."
              className="pl-8 h-8 text-sm"
            />
          </div>
        </div>

        <div className="max-h-72 overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          )}

          {!loading && results.length === 0 && (
            <div className="py-6 text-center text-sm text-muted-foreground">
              {query ? 'Nessun risultato trovato' : 'Listino vuoto — aggiungi voci dal Listino Manager'}
            </div>
          )}

          {!loading && results.map(lv => (
            <button
              key={lv.id}
              type="button"
              onClick={() => handleSelect(lv)}
              className="w-full flex items-start gap-3 px-3 py-2.5 hover:bg-muted/50 transition-colors text-left border-b last:border-0"
            >
              <Plus className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{lv.titolo_voce}</div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-muted-foreground">{lv.categoria}</span>
                  <span className="text-xs text-muted-foreground">·</span>
                  <span className="text-xs text-muted-foreground">{lv.unita_misura}</span>
                </div>
              </div>
              <div className="text-sm font-semibold shrink-0">{formatEuro(lv.prezzo_unitario)}</div>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
