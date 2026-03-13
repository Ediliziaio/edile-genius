import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { KBDocumento, CategoriaKB } from '@/modules/preventivo/types';
import { useCompanyId } from '@/hooks/useCompanyId';

export function useKnowledgeBase() {
  const companyId = useCompanyId();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});

  // Document list
  const { data: documenti, isLoading } = useQuery({
    queryKey: ['kb_documenti', companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('preventivo_kb_documenti')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as KBDocumento[];
    },
    refetchInterval: (query) => {
      const docs = query.state.data;
      const hasPending = docs?.some(
        (d: KBDocumento) => d.stato === 'elaborazione' || d.stato === 'caricato'
      );
      return hasPending ? 3000 : false;
    },
  });

  const stats = {
    totale: documenti?.length || 0,
    indicizzati: documenti?.filter(d => d.stato === 'indicizzato').length || 0,
    in_elaborazione: documenti?.filter(d => d.stato === 'elaborazione').length || 0,
    errori: documenti?.filter(d => d.stato === 'errore').length || 0,
    chunks_totali: documenti?.reduce((sum, d) => sum + (d.chunks_count || 0), 0) || 0,
  };

  // Upload + index pipeline
  const uploadDocumento = useCallback(async (
    file: File,
    categoria: CategoriaKB,
    nome?: string,
    descrizione?: string,
    tags?: string[]
  ): Promise<KBDocumento | null> => {
    if (!companyId) return null;
    setUploading(true);

    const tempId = `upload-${Date.now()}`;
    setUploadProgress(prev => ({ ...prev, [tempId]: 0 }));

    try {
      const fileType = file.name.split('.').pop()?.toLowerCase() as 'pdf' | 'docx' | 'txt';
      const fileSizeKb = Math.round(file.size / 1024);
      const storageKey = `${companyId}/${Date.now()}-${file.name}`;

      // 1. Storage upload
      setUploadProgress(prev => ({ ...prev, [tempId]: 20 }));
      const { error: uploadErr } = await supabase.storage
        .from('preventivo-kb')
        .upload(storageKey, file, { contentType: file.type });
      if (uploadErr) throw uploadErr;

      // 2. DB record
      setUploadProgress(prev => ({ ...prev, [tempId]: 40 }));
      const { data: doc, error: dbErr } = await supabase
        .from('preventivo_kb_documenti')
        .insert({
          company_id: companyId,
          nome: nome || file.name.replace(/\.[^/.]+$/, ''),
          descrizione,
          file_url: storageKey,
          file_type: fileType,
          file_size_kb: fileSizeKb,
          categoria,
          stato: 'caricato',
          tags: tags || [],
        } as Record<string, unknown>)
        .select()
        .single();
      if (dbErr) throw dbErr;

      // 3. Extract text
      setUploadProgress(prev => ({ ...prev, [tempId]: 55 }));
      const { data: extractData, error: extractErr } = await supabase.functions.invoke(
        'extract-document-text',
        { body: { documentoId: doc.id } }
      );
      if (extractErr) throw extractErr;

      // 4. Chunk + embed
      setUploadProgress(prev => ({ ...prev, [tempId]: 75 }));
      const { error: embedErr } = await supabase.functions.invoke('chunk-and-embed', {
        body: {
          documentoId: doc.id,
          companyId,
          categoria,
          pagineTesto: extractData.pagineTesto,
        },
      });
      if (embedErr) throw embedErr;

      setUploadProgress(prev => ({ ...prev, [tempId]: 100 }));
      queryClient.invalidateQueries({ queryKey: ['kb_documenti', companyId] });
      toast.success(`"${doc.nome}" indicizzato — ${extractData.totalePagine} pagine`);

      return doc as unknown as KBDocumento;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      toast.error('Errore upload: ' + message);
      return null;
    } finally {
      setUploading(false);
      setTimeout(() => {
        setUploadProgress(prev => {
          const next = { ...prev };
          delete next[tempId];
          return next;
        });
      }, 2000);
    }
  }, [companyId, queryClient]);

  // Delete document
  const eliminaDocumento = useCallback(async (docId: string) => {
    const { error } = await supabase
      .from('preventivo_kb_documenti')
      .delete()
      .eq('id', docId);
    if (!error) {
      queryClient.invalidateQueries({ queryKey: ['kb_documenti', companyId] });
      toast.success('Documento rimosso dalla knowledge base');
    }
  }, [companyId, queryClient]);

  // Re-index
  const reIndicizza = useCallback(async (doc: KBDocumento) => {
    await supabase
      .from('preventivo_kb_documenti')
      .update({ stato: 'caricato' } as Record<string, unknown>)
      .eq('id', doc.id);

    const { data: extractData, error: extractErr } = await supabase.functions.invoke(
      'extract-document-text',
      { body: { documentoId: doc.id } }
    );
    if (extractErr) {
      toast.error('Errore re-indicizzazione');
      return;
    }

    await supabase.functions.invoke('chunk-and-embed', {
      body: {
        documentoId: doc.id,
        companyId,
        categoria: doc.categoria,
        pagineTesto: extractData.pagineTesto,
      },
    });

    queryClient.invalidateQueries({ queryKey: ['kb_documenti', companyId] });
    toast.success('Re-indicizzazione completata');
  }, [companyId, queryClient]);

  // Test RAG search
  const testSearch = useCallback(async (
    query: string,
    categoria?: string
  ): Promise<Array<{ id: string; testo: string; categoria: string; similarity: number }>> => {
    if (!companyId) return [];

    const { data: embData, error: embErr } = await supabase.functions.invoke('embed-query', {
      body: { testo: query },
    });
    if (embErr || !embData?.embedding) return [];

    const { data: chunks, error: searchErr } = await supabase.rpc('search_kb_chunks', {
      p_company_id: companyId,
      p_embedding: embData.embedding,
      p_categoria: categoria || null,
      p_top_k: 5,
      p_threshold: 0.65,
    });

    if (searchErr) {
      console.error('Search error:', searchErr);
      return [];
    }

    return (chunks || []) as Array<{ id: string; testo: string; categoria: string; similarity: number }>;
  }, [companyId]);

  return {
    documenti: documenti || [],
    isLoading,
    stats,
    uploading,
    uploadProgress,
    uploadDocumento,
    eliminaDocumento,
    reIndicizza,
    testSearch,
  };
}
