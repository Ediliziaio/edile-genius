import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { PreventivoData, TemplateConfig, SezioneContenuto, RenderEntry } from '@/lib/preventivo-pdf';

interface GeneraPDFInput {
  data: PreventivoData;
  template: TemplateConfig;
  sezioniContenuto?: Record<string, SezioneContenuto>;
  sezioniTemplate?: any[];
  renderEntries?: RenderEntry[];
}

export function useGeneraPDF() {
  const [generando, setGenerando] = useState(false);
  const [progresso, setProgresso] = useState(0);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  // Cleanup object URLs to prevent memory leaks
  useEffect(() => {
    return () => {
      if (pdfUrl && pdfUrl.startsWith('blob:')) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  const generaPDF = useCallback(async (input: GeneraPDFInput): Promise<Blob | null> => {
    setGenerando(true);
    setProgresso(10);
    try {
      // Dynamic import to avoid loading @react-pdf/renderer eagerly
      const { getPreventivoBlob } = await import('@/lib/preventivo-pdf');
      setProgresso(40);

      const blob = await getPreventivoBlob(
        input.data,
        input.template,
        input.sezioniContenuto,
        input.sezioniTemplate,
        input.renderEntries,
      );
      setProgresso(90);
      return blob;
    } catch (err: any) {
      console.error('Errore generazione PDF:', err);
      toast.error('Errore generazione PDF: ' + err.message);
      return null;
    } finally {
      setProgresso(100);
      setTimeout(() => { setGenerando(false); setProgresso(0); }, 500);
    }
  }, []);

  const scaricaPDF = useCallback(async (input: GeneraPDFInput, filename?: string) => {
    const blob = await generaPDF(input);
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `Preventivo-${input.data.numero_preventivo}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('PDF scaricato!');
  }, [generaPDF]);

  const apriAnteprima = useCallback(async (input: GeneraPDFInput) => {
    const blob = await generaPDF(input);
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    setPdfUrl(url);
    window.open(url, '_blank');
  }, [generaPDF]);

  const salvaStorage = useCallback(async (
    input: GeneraPDFInput,
    preventivoId: string,
    companyId: string,
  ): Promise<string | null> => {
    const blob = await generaPDF(input);
    if (!blob) return null;

    const filename = `preventivo-${input.data.numero_preventivo || preventivoId}.pdf`;
    const path = `${companyId}/${filename}`;
    const arrayBuf = await blob.arrayBuffer();

    const { data: uploadData, error } = await supabase.storage
      .from('preventivi-pdf')
      .upload(path, new Uint8Array(arrayBuf), { contentType: 'application/pdf', upsert: true });

    if (error) {
      toast.error('Errore upload PDF: ' + error.message);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from('preventivi-pdf')
      .getPublicUrl(uploadData.path);

    // Update DB record
    await supabase
      .from('preventivi')
      .update({ pdf_url: urlData.publicUrl, stato: 'pronto' } as any)
      .eq('id', preventivoId);

    setPdfUrl(urlData.publicUrl);
    toast.success('PDF salvato!');
    return urlData.publicUrl;
  }, [generaPDF]);

  return { generando, progresso, pdfUrl, generaPDF, scaricaPDF, apriAnteprima, salvaStorage };
}
