import { useNavigate } from 'react-router-dom';
import { PDFPreviewPanel } from '@/components/preventivo/PDFPreviewPanel';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import type { StepProps } from './types';
import type { PreventivoData, TemplateConfig, SezioneContenuto, RenderEntry } from '@/lib/preventivo-pdf';
import type { PreventivoSezione } from '@/modules/preventivo/types';

interface StepPDFProps extends StepProps {
  pdfData: PreventivoData;
  pdfTemplate: TemplateConfig;
  sezioniContenuto: Record<string, SezioneContenuto>;
  sezioniTemplate: PreventivoSezione[];
  renderEntries: RenderEntry[];
}

export function StepPDF({
  state, companyId, preventivoId,
  pdfData, pdfTemplate, sezioniContenuto, sezioniTemplate, renderEntries,
}: StepPDFProps) {
  const navigate = useNavigate();

  const checks = [
    { label: 'Dati cliente', ok: !!state.clienteNome.trim() },
    { label: 'Oggetto lavori', ok: !!state.oggetto.trim() },
    { label: 'Voci preventivo', ok: state.voci.length > 0 },
    { label: 'Totale calcolato', ok: state.voci.some(v => v.totale > 0) },
  ];

  const allOk = checks.every(c => c.ok);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle className="text-lg">✅ Checklist Completamento</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {checks.map((c, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                {c.ok ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                )}
                <span className={c.ok ? 'text-foreground' : 'text-muted-foreground'}>{c.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg">📄 PDF Preventivo</CardTitle></CardHeader>
        <CardContent>
          <PDFPreviewPanel
            data={pdfData}
            template={pdfTemplate}
            sezioniContenuto={sezioniContenuto}
            sezioniTemplate={sezioniTemplate}
            renderEntries={renderEntries}
            preventivoId={preventivoId || undefined}
            companyId={companyId}
          />
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button variant="outline" className="gap-2" onClick={() => navigate('/app/preventivi')}>
          <ArrowLeft className="h-4 w-4" /> Torna alla lista
        </Button>
        {preventivoId && (
          <Button variant="outline" onClick={() => navigate(`/app/preventivi/${preventivoId}`)}>
            Vai al dettaglio
          </Button>
        )}
      </div>
    </div>
  );
}
