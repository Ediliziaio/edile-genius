import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { usePreventivo } from '@/hooks/usePreventivo';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Camera, X, Loader2, UploadCloud } from 'lucide-react';
import { toast } from 'sonner';
import type { StepProps } from './types';
import type { AnalisiSuperfici } from '@/modules/preventivo/types';

interface StepSuperficiProps extends StepProps {
  analisi: AnalisiSuperfici | null;
  onAnalisi: (a: AnalisiSuperfici) => void;
}

export function StepSuperfici({ state, setState, companyId, preventivoId, analisi, onAnalisi }: StepSuperficiProps) {
  const { analizzaSuperfici, analizziandoSuperfici } = usePreventivo(preventivoId || undefined);
  const [photos, setPhotos] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).slice(0, 5 - photos.length);
    setPhotos(prev => [...prev, ...files]);
    setPreviews(prev => [...prev, ...files.map(f => URL.createObjectURL(f))]);
  };

  const removePhoto = (i: number) => {
    URL.revokeObjectURL(previews[i]);
    setPhotos(photos.filter((_, idx) => idx !== i));
    setPreviews(previews.filter((_, idx) => idx !== i));
  };

  const uploadAndAnalyze = async () => {
    if (photos.length === 0) { toast.error('Carica almeno una foto'); return; }
    setUploading(true);
    try {
      const urls: string[] = [];
      for (const photo of photos) {
        const path = `${companyId}/${preventivoId || 'draft'}/${crypto.randomUUID()}.${photo.name.split('.').pop()}`;
        const { error } = await supabase.storage.from('preventivi-media').upload(path, photo);
        if (error) throw error;
        const { data: urlData } = supabase.storage.from('preventivi-media').getPublicUrl(path);
        urls.push(urlData.publicUrl);
      }
      setState(prev => ({ ...prev, fotoAnalisiUrls: urls }));

      if (preventivoId) {
        const result = await analizzaSuperfici(urls);
        if (result) onAnalisi(result);
      } else {
        toast.info('Salva prima il preventivo per analizzare le superfici');
      }
    } catch (err: any) {
      toast.error('Errore upload: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const confidenzaColor: Record<string, string> = {
    alta: 'bg-green-100 text-green-700',
    media: 'bg-yellow-100 text-yellow-700',
    bassa: 'bg-red-100 text-red-700',
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle className="text-lg">📸 Foto per Analisi Superfici</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Carica fino a 5 foto del cantiere. L'AI stimerà le superfici da lavorare.
            Questo step è opzionale.
          </p>
          <div className="relative">
            <input type="file" accept="image/*" multiple onChange={handleUpload} className="absolute inset-0 opacity-0 cursor-pointer" disabled={photos.length >= 5} />
            <Button variant="outline" className="gap-2 w-full" disabled={photos.length >= 5}>
              <Camera className="h-4 w-4" /> Aggiungi Foto ({photos.length}/5)
            </Button>
          </div>
          {previews.length > 0 && (
            <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
              {previews.map((url, i) => (
                <div key={i} className="relative group aspect-square rounded-lg overflow-hidden bg-muted">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <button
                    onClick={() => removePhoto(i)}
                    className="absolute top-1 right-1 h-6 w-6 rounded-full bg-destructive/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
          {photos.length > 0 && (
            <Button onClick={uploadAndAnalyze} disabled={uploading || analizziandoSuperfici} className="w-full gap-2">
              {(uploading || analizziandoSuperfici) ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Analisi in corso…</>
              ) : (
                <><UploadCloud className="h-4 w-4" /> Carica e Analizza</>
              )}
            </Button>
          )}
        </CardContent>
      </Card>

      {analisi && analisi.superfici.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-lg">📐 Superfici Rilevate</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analisi.superfici.map((s, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <span className="text-sm font-medium">{s.elemento}</span>
                    {s.note && <p className="text-xs text-muted-foreground">{s.note}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono">{s.mq_stimati} mq</span>
                    <Badge variant="secondary" className={confidenzaColor[s.confidenza] || ''}>
                      {s.confidenza}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
            {analisi.note_generali && (
              <p className="mt-3 text-sm text-muted-foreground italic">{analisi.note_generali}</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
