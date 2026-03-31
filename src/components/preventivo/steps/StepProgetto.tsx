import { useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Mic, Square, Upload, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import type { StepProps } from './types';

interface StepProgettoProps extends StepProps {
  onAudioProcessed: (result: any) => void;
}

export function StepProgetto({ state, setState, companyId, onAudioProcessed }: StepProgettoProps) {
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [processing, setProcessing] = useState(false);
  const [smartAssembly, setSmartAssembly] = useState(true);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      chunks.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunks.current.push(e.data); };
      mr.onstop = () => {
        setAudioBlob(new Blob(chunks.current, { type: 'audio/webm' }));
        stream.getTracks().forEach(t => t.stop());
      };
      mr.start();
      mediaRecorder.current = mr;
      setRecording(true);
    } catch {
      toast.error('Impossibile accedere al microfono');
    }
  };

  const stopRecording = () => { mediaRecorder.current?.stop(); setRecording(false); };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file?.type.startsWith('audio/')) setAudioBlob(file);
    else toast.error('Seleziona un file audio');
  };

  const processAudio = async () => {
    if (!audioBlob || !companyId) return;
    setProcessing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Non autenticato');

      const formData = new FormData();
      formData.append('audio', audioBlob, 'audio.webm');
      formData.append('company_id', companyId);
      if (state.cantiereId) formData.append('cantiere_id', state.cantiereId);
      if (state.clienteNome) formData.append('cliente_nome', state.clienteNome);
      if (state.oggetto) formData.append('oggetto', state.oggetto);
      if (smartAssembly) formData.append('smart_assembly', 'true');

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-preventivo-audio`,
        { method: 'POST', headers: { Authorization: `Bearer ${session.access_token}` }, body: formData }
      );
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Errore elaborazione'); }
      const result = await res.json();
      onAudioProcessed(result);
      toast.success('Audio elaborato!');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const update = (field: string, value: any) => setState(prev => ({ ...prev, [field]: value }));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle className="text-lg">🎙️ Registra Sopralluogo</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Descrivi a voce i lavori. L'AI estrarrà le voci del preventivo.
          </p>
          <div className="flex gap-3">
            {!recording ? (
              <Button onClick={startRecording} variant="outline" className="gap-2 flex-1" disabled={processing}>
                <Mic className="h-4 w-4" /> Registra
              </Button>
            ) : (
              <Button onClick={stopRecording} variant="destructive" className="gap-2 flex-1">
                <Square className="h-4 w-4" /> Ferma
              </Button>
            )}
            <div className="relative flex-1">
              <input type="file" accept="audio/*" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer" disabled={processing} />
              <Button variant="outline" className="gap-2 w-full" disabled={processing}>
                <Upload className="h-4 w-4" /> Carica Audio
              </Button>
            </div>
          </div>
          {audioBlob && (
            <div className="bg-muted rounded-lg p-3">
              <audio controls src={URL.createObjectURL(audioBlob)} className="w-full" />
            </div>
          )}
          {audioBlob && (
            <div className="space-y-3">
              {/* Smart Assembly toggle */}
              <div className="flex items-center justify-between rounded-lg border bg-muted/40 px-4 py-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    Assembla PDF automaticamente
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Cerca schede tecniche e presentazione aziendale nella KB e assembla il PDF finale
                  </p>
                </div>
                <Switch checked={smartAssembly} onCheckedChange={setSmartAssembly} />
              </div>
              <Button onClick={processAudio} disabled={processing} className="w-full gap-2">
                {processing
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> {smartAssembly ? 'Elaborazione + ricerca prodotti…' : 'Elaborazione AI…'}</>
                  : <><Sparkles className="h-4 w-4" /> {smartAssembly ? 'Elabora e assembla PDF' : 'Elabora con AI'}</>
                }
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg">🖼️ Render associati</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>ID Render (separati da virgola)</Label>
            <Input
              placeholder="uuid1, uuid2..."
              value={state.renderIds.join(', ')}
              onChange={e => update('renderIds', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            I render verranno inclusi nella galleria visiva del PDF.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
