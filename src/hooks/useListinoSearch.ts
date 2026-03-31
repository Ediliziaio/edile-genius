import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ListinoVoce {
  id: string;
  company_id: string;
  codice: string | null;
  categoria: string;
  titolo_voce: string;
  descrizione: string | null;
  unita_misura: string;
  prezzo_unitario: number;
  iva_percentuale: number | null;
  note: string | null;
  attivo: boolean;
  created_at: string;
  updated_at: string;
}

interface UseListinoSearchOptions {
  companyId: string | null | undefined;
  debounceMs?: number;
}

export function useListinoSearch({ companyId, debounceMs = 300 }: UseListinoSearchOptions) {
  const [results, setResults] = useState<ListinoVoce[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback((query: string) => {
    if (!companyId) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const { data, error } = await (supabase.rpc as any)('cerca_listino', {
          p_company_id: companyId,
          p_query: query.trim() || null,
          p_limit: 20,
        });
        if (!error && data) {
          setResults(data as ListinoVoce[]);
        } else {
          setResults([]);
        }
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, debounceMs);
  }, [companyId, debounceMs]);

  const clear = useCallback(() => {
    setResults([]);
    setLoading(false);
    if (debounceRef.current) clearTimeout(debounceRef.current);
  }, []);

  return { results, loading, search, clear };
}
