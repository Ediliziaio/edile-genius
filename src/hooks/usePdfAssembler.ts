import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type PdfBlockType = 'kb_doc' | 'divider' | 'preventivo';

export interface PdfBlock {
  id: string;           // local UUID for DnD key
  tipo: PdfBlockType;
  // kb_doc fields
  doc_id?: string;
  doc_nome?: string;
  doc_pagine?: number | null;
  include_copertina?: boolean;
  // divider fields
  testo?: string;
  // preventivo: always included implicitly as first block
}

export interface AssembledResult {
  pdf_url: string;
  pagine_totali: number;
}

interface UsePdfAssemblerOptions {
  preventivoId: string;
  companyId: string | null | undefined;
}

export function usePdfAssembler({ preventivoId, companyId }: UsePdfAssemblerOptions) {
  const [blocks, setBlocks] = useState<PdfBlock[]>([]);
  const [assembling, setAssembling] = useState(false);
  const [result, setResult] = useState<AssembledResult | null>(null);

  const addBlock = useCallback((block: Omit<PdfBlock, 'id'>) => {
    const newBlock: PdfBlock = {
      id: crypto.randomUUID(),
      ...block,
    };
    setBlocks(prev => [...prev, newBlock]);
  }, []);

  const removeBlock = useCallback((id: string) => {
    setBlocks(prev => prev.filter(b => b.id !== id));
  }, []);

  const reorderBlocks = useCallback((newBlocks: PdfBlock[]) => {
    setBlocks(newBlocks);
  }, []);

  const updateBlock = useCallback((id: string, patch: Partial<PdfBlock>) => {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, ...patch } : b));
  }, []);

  const loadFromPreventivo = useCallback(async () => {
    const { data } = await (supabase
      .from('preventivi' as any)
      .select('assembla_config')
      .eq('id', preventivoId)
      .single() as any);

    if (data?.assembla_config?.blocks) {
      const loaded: PdfBlock[] = (data.assembla_config.blocks as any[]).map((b: any) => ({
        id: crypto.randomUUID(),
        ...b,
      }));
      setBlocks(loaded);
    }
  }, [preventivoId]);

  const saveConfig = useCallback(async () => {
    const configBlocks = blocks.map(({ id: _id, ...rest }) => rest);
    await (supabase
      .from('preventivi' as any)
      .update({ assembla_config: { blocks: configBlocks } })
      .eq('id', preventivoId) as any);
  }, [blocks, preventivoId]);

  const assemble = useCallback(async () => {
    if (!companyId) return;
    setAssembling(true);
    try {
      await saveConfig();

      const { data, error } = await supabase.functions.invoke('assemble-preventivo-pdf', {
        body: {
          preventivo_id: preventivoId,
          company_id: companyId,
          blocks: blocks.map(({ id: _id, ...rest }) => rest),
        },
      });

      if (error) throw error;

      const pdfUrl = data?.pdf_url || data?.result?.pdf_url;
      if (!pdfUrl) throw new Error('Nessun PDF ricevuto dall\'edge function');

      const assembled: AssembledResult = {
        pdf_url: pdfUrl,
        pagine_totali: data?.pagine_totali ?? 0,
      };

      // Persist to DB
      await (supabase
        .from('preventivi' as any)
        .update({
          pdf_finale_url: pdfUrl,
          pdf_finale_generato_at: new Date().toISOString(),
        })
        .eq('id', preventivoId) as any);

      setResult(assembled);
      toast.success('PDF assemblato con successo');
      return assembled;
    } catch (err) {
      console.error('assemble error:', err);
      toast.error('Errore durante l\'assemblaggio del PDF');
      return null;
    } finally {
      setAssembling(false);
    }
  }, [blocks, companyId, preventivoId, saveConfig]);

  return {
    blocks,
    assembling,
    result,
    addBlock,
    removeBlock,
    reorderBlocks,
    updateBlock,
    loadFromPreventivo,
    saveConfig,
    assemble,
  };
}
