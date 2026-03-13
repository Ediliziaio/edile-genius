import { useState } from 'react';
import { useGeneraPDF } from '@/hooks/useGeneraPDF';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Download, Eye, ExternalLink, FileText, Loader2 } from 'lucide-react';
import type { PreventivoData, TemplateConfig, SezioneContenuto, RenderEntry } from '@/lib/preventivo-pdf';
import type { PreventivoSezione } from '@/modules/preventivo/types';

interface PDFPreviewPanelProps {
  data: PreventivoData;
  template: TemplateConfig;
  sezioniContenuto?: Record<string, SezioneContenuto>;
  sezioniTemplate?: PreventivoSezione[];
  renderEntries?: RenderEntry[];
  preventivoId?: string;
  companyId?: string;
}

export function PDFPreviewPanel({
  data, template, sezioniContenuto, sezioniTemplate, renderEntries,
  preventivoId, companyId,
}: PDFPreviewPanelProps) {
  const { generando, progresso, scaricaPDF, apriAnteprima, salvaStorage } = useGeneraPDF();
  const [iframeUrl, setIframeUrl] = useState<string | null>(null);

  const input = { data, template, sezioniContenuto, sezioniTemplate, renderEntries };

  const handlePreview = async () => {
    const { generaPDF } = await import('@/hooks/useGeneraPDF').then(() => ({ generaPDF: null }));
    // Use inline generation for iframe
    const { getPreventivoBlob } = await import('@/lib/preventivo-pdf');
    const blob = await getPreventivoBlob(data, template, sezioniContenuto, sezioniTemplate, renderEntries);
    const url = URL.createObjectURL(blob);
    setIframeUrl(url);
  };

  // Active AI sections from template
  const sezioniAI = (sezioniTemplate || [])
    .filter(s => s.attiva && ['ai_generated', 'kb_document'].includes(s.sorgente))
    .sort((a, b) => a.ordine - b.ordine);

  return (
    <div className="space-y-4">
      {/* Progress */}
      {generando && (
        <div className="bg-muted/50 rounded-lg p-4 space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
            <span>Assemblaggio PDF in corso…</span>
          </div>
          <Progress value={progresso} className="h-2" />
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" className="gap-2" onClick={handlePreview} disabled={generando}>
          <Eye className="w-4 h-4" />
          Anteprima
        </Button>
        <Button variant="outline" size="sm" className="gap-2" onClick={() => scaricaPDF(input)} disabled={generando}>
          <Download className="w-4 h-4" />
          Scarica PDF
        </Button>
        <Button variant="outline" size="sm" className="gap-2" onClick={() => apriAnteprima(input)} disabled={generando}>
          <ExternalLink className="w-4 h-4" />
          Apri in nuova tab
        </Button>
        {preventivoId && companyId && (
          <Button
            size="sm"
            className="gap-2"
            onClick={() => salvaStorage(input, preventivoId, companyId)}
            disabled={generando}
          >
            <FileText className="w-4 h-4" />
            Salva e Genera PDF
          </Button>
        )}
      </div>

      {/* Inline preview */}
      {iframeUrl && (
        <div className="border rounded-lg overflow-hidden" style={{ height: 500 }}>
          <iframe src={iframeUrl} className="w-full h-full" title="Anteprima PDF" />
        </div>
      )}

      {/* Section checklist */}
      {!iframeUrl && sezioniAI.length > 0 && (
        <div className="bg-muted/50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Sezioni AI nel PDF</span>
          </div>
          <div className="space-y-1">
            {sezioniAI.map(s => {
              const hasContent = sezioniContenuto?.[s.id]?.testo;
              return (
                <div key={s.id} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${hasContent ? 'bg-green-500' : 'bg-yellow-400'}`} />
                  <span>{s.titolo}</span>
                  <span className={`text-xs px-1 rounded ml-auto ${hasContent ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {hasContent ? '✓ generato' : 'in attesa'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
