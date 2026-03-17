import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { unwrapEdge } from '@/lib/edgePayload';
import type { Preventivo, PreventivoVoce, AnalisiSuperfici } from '@/modules/preventivo/types';

type SezioneProgress = 'pending' | 'generating' | 'done' | 'error';

export function usePreventivo(preventivoId?: string) {
  const queryClient = useQueryClient();
  const [generando, setGenerando] = useState(false);
  const [analizziandoSuperfici, setAnalizziandoSuperfici] = useState(false);
  const [progresseSezioni, setProgresseSezioni] = useState<Record<string, SezioneProgress>>({});

  // Load preventivo with auto-polling during generation
  const { data: preventivo, isLoading } = useQuery({
    queryKey: ['preventivo', preventivoId],
    enabled: !!preventivoId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('preventivi')
        .select('*')
        .eq('id', preventivoId!)
        .single();
      if (error) throw error;
      return data as unknown as Preventivo;
    },
    refetchInterval: (query) => {
      const p = query.state.data as Preventivo | undefined;
      if (p?.stato !== 'generazione') return false;
      // Timeout: if stuck in 'generazione' for >10 min, reset to 'bozza'
      const updatedAt = (p as any)?.updated_at;
      if (updatedAt) {
        const elapsed = Date.now() - new Date(updatedAt).getTime();
        if (elapsed > 10 * 60 * 1000) {
          supabase.from('preventivi')
            .update({ stato: 'bozza' } as any)
            .eq('id', preventivoId!);
          return false;
        }
      }
      return 2000;
    },
  });

  // Analyze surfaces from photos
  const analizzaSuperfici = useCallback(async (fotoUrls: string[]) => {
    if (!preventivoId) return null;
    setAnalizziandoSuperfici(true);
    try {
      const { data, error } = await supabase.functions.invoke('analizza-superfici-preventivo', {
        body: {
          fotoUrls,
          oggettoCantiere: preventivo?.oggetto_lavori,
          preventivoId,
        },
      });
      if (error) throw error;
      const payload = unwrapEdge<{ analisi: AnalisiSuperfici }>(data);
      queryClient.invalidateQueries({ queryKey: ['preventivo', preventivoId] });
      toast.success(`Analisi completata — ${payload.analisi?.superfici?.length || 0} superfici rilevate`);
      return payload.analisi;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error('Analisi superfici fallita: ' + msg);
      return null;
    } finally {
      setAnalizziandoSuperfici(false);
    }
  }, [preventivoId, preventivo, queryClient]);

  // Generate single section
  const generaSezione = useCallback(async (
    sezione: { id: string; tipo: string; titolo: string; config: Record<string, unknown> },
    aziendaId: string
  ) => {
    if (!preventivoId || !preventivo) return null;

    setProgresseSezioni(prev => ({ ...prev, [sezione.id]: 'generating' }));

    try {
      const { data, error } = await supabase.functions.invoke('genera-sezione-preventivo', {
        body: {
          preventivoId,
          sezioneId: sezione.id,
          tipoSezione: sezione.tipo,
          titoloSezione: sezione.titolo,
          config: sezione.config,
          contesto: {
            clienteNome: preventivo.cliente_nome,
            oggettoLavori: preventivo.oggetto_lavori,
            indirizzoCantiere: preventivo.indirizzo_cantiere,
            superficiStimate: preventivo.superfici_stimate,
          },
          aziendaId,
          categoriaKb: sezione.config?.categoria_kb,
        },
      });

      if (error) throw error;
      setProgresseSezioni(prev => ({ ...prev, [sezione.id]: 'done' }));
      queryClient.invalidateQueries({ queryKey: ['preventivo', preventivoId] });
      return unwrapEdge(data);
    } catch (err: unknown) {
      setProgresseSezioni(prev => ({ ...prev, [sezione.id]: 'error' }));
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Errore sezione "${sezione.titolo}": ${msg}`);
      return null;
    }
  }, [preventivoId, preventivo, queryClient]);

  // Generate all sections via orchestrator
  const generaTutte = useCallback(async (
    templateSezioni: Array<{ id: string; attiva: boolean; sorgente: string; [key: string]: unknown }>,
    aziendaId: string
  ) => {
    if (!preventivoId) return;
    setGenerando(true);

    // Initialize progress
    const initial: Record<string, SezioneProgress> = {};
    templateSezioni
      .filter(s => s.attiva && ['ai_generated', 'kb_document'].includes(s.sorgente))
      .forEach(s => { initial[s.id] = 'pending'; });
    setProgresseSezioni(initial);

    try {
      const { data, error } = await supabase.functions.invoke('genera-preventivo-completo', {
        body: { preventivoId, templateSezioni, aziendaId },
      });

      if (error) throw error;
      const payload = unwrapEdge<{ sezioni_generate: number; errori: string[] | null }>(data);
      queryClient.invalidateQueries({ queryKey: ['preventivo', preventivoId] });

      if (payload?.errori?.length) {
        toast.warning(`Generato con ${payload.errori.length} errori`);
      } else {
        toast.success(`${payload?.sezioni_generate || 0} sezioni generate!`);
      }

      return payload;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error('Errore generazione: ' + msg);
    } finally {
      setGenerando(false);
      setProgresseSezioni({});
    }
  }, [preventivoId, queryClient]);

  // Update voci and recalculate totals
  const updateVoci = useCallback(async (voci: PreventivoVoce[]) => {
    if (!preventivoId) return;
    const subtotale = voci.reduce((sum, v) => sum + v.importo, 0);
    const ivaPerc = preventivo?.iva_percentuale ?? 22;
    const scontoPerc = preventivo?.sconto_globale_percentuale ?? 0;
    const nettoConSconto = subtotale * (1 - scontoPerc / 100);
    const totaleFinale = nettoConSconto * (1 + ivaPerc / 100);

    await supabase
      .from('preventivi')
      .update({
        voci: voci as unknown as Record<string, unknown>[],
        subtotale,
        totale_finale: Math.round(totaleFinale * 100) / 100,
      } as Record<string, unknown>)
      .eq('id', preventivoId);

    queryClient.invalidateQueries({ queryKey: ['preventivo', preventivoId] });
  }, [preventivoId, preventivo, queryClient]);

  // Update a single field
  const updateCampo = useCallback(async (campo: string, valore: unknown) => {
    if (!preventivoId) return;
    await supabase
      .from('preventivi')
      .update({ [campo]: valore } as Record<string, unknown>)
      .eq('id', preventivoId);
    queryClient.invalidateQueries({ queryKey: ['preventivo', preventivoId] });
  }, [preventivoId, queryClient]);

  return {
    preventivo,
    isLoading,
    generando,
    analizziandoSuperfici,
    progresseSezioni,
    analizzaSuperfici,
    generaSezione,
    generaTutte,
    updateVoci,
    updateCampo,
  };
}
