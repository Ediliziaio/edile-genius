import { useState } from 'react';
import { usePreventivo } from '@/hooks/usePreventivo';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, RefreshCw, Zap } from 'lucide-react';
import { SEZIONI_DEFAULT, TIPO_SEZIONE_META } from '@/modules/preventivo/lib/defaultTemplate';
import type { PreventivoSezione } from '@/modules/preventivo/types';
import type { SezioneContenuto } from '@/lib/preventivo-pdf';
import type { StepProps } from './types';

interface StepSezioniProps extends StepProps {
  sezioni: PreventivoSezione[];
  onSezioniChange: (s: PreventivoSezione[]) => void;
  sezioniContenuto: Record<string, SezioneContenuto>;
  onContenutoChange: (c: Record<string, SezioneContenuto>) => void;
}

// Re-export SezioneContenuto from preventivo-pdf for compatibility
type SezioneContenutoPdf = { testo: string; chunks_usati?: string[] };

export function StepSezioni({
  state, companyId, preventivoId,
  sezioni, onSezioniChange,
  sezioniContenuto, onContenutoChange,
}: StepSezioniProps) {
  const { generaSezione, generaTutte, generando, progresseSezioni } = usePreventivo(preventivoId || undefined);
  const [editingId, setEditingId] = useState<string | null>(null);

  const toggleSezione = (id: string) => {
    onSezioniChange(sezioni.map(s => s.id === id ? { ...s, attiva: !s.attiva } : s));
  };

  const handleGeneraSezione = async (sez: PreventivoSezione) => {
    if (!preventivoId) return;
    await generaSezione(
      { id: sez.id, tipo: sez.tipo, titolo: sez.titolo, config: sez.config as unknown as Record<string, unknown> },
      companyId
    );
  };

  const handleGeneraTutte = async () => {
    if (!preventivoId) return;
    await generaTutte(
      sezioni.map(s => ({ ...s, sorgente: s.sorgente, config: s.config } as any)),
      companyId
    );
  };

  const sezioniAttive = sezioni.filter(s => s.attiva && ['ai_generated', 'kb_document'].includes(s.sorgente));
  const tutteGenerate = sezioniAttive.every(s => sezioniContenuto[s.id]?.testo);

  return (
    <div className="space-y-6">
      {/* Generate all banner */}
      {preventivoId && sezioniAttive.length > 0 && !tutteGenerate && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">🚀 Genera tutte le sezioni AI</p>
              <p className="text-xs text-muted-foreground">{sezioniAttive.length} sezioni da generare</p>
            </div>
            <Button onClick={handleGeneraTutte} disabled={generando} className="gap-2">
              {generando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
              Genera Tutto
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Section list */}
      <div className="space-y-3">
        {sezioni.sort((a, b) => a.ordine - b.ordine).map(sez => {
          const meta = TIPO_SEZIONE_META[sez.tipo];
          const contenuto = sezioniContenuto[sez.id];
          const isAI = ['ai_generated', 'kb_document'].includes(sez.sorgente);
          const progress = progresseSezioni[sez.id];

          return (
            <Card key={sez.id} className={!sez.attiva ? 'opacity-50' : ''}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{meta?.emoji || '📄'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{sez.titolo}</span>
                      <Badge variant="outline" className="text-[10px]">{sez.sorgente}</Badge>
                      {progress === 'generating' && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
                      {contenuto?.testo && <Badge variant="secondary" className="text-[10px] bg-green-100 text-green-700">✓</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{meta?.desc}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {isAI && sez.attiva && preventivoId && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1 text-xs"
                        onClick={() => handleGeneraSezione(sez)}
                        disabled={progress === 'generating' || generando}
                      >
                        {contenuto?.testo ? <RefreshCw className="h-3 w-3" /> : <Sparkles className="h-3 w-3" />}
                        {contenuto?.testo ? 'Rigenera' : 'Genera'}
                      </Button>
                    )}
                    <Switch checked={sez.attiva} onCheckedChange={() => toggleSezione(sez.id)} />
                  </div>
                </div>

                {/* Inline content preview/edit */}
                {sez.attiva && contenuto?.testo && (
                  <div className="mt-3">
                    {editingId === sez.id ? (
                      <div className="space-y-2">
                        <Textarea
                          value={contenuto.testo}
                          onChange={e => onContenutoChange({
                            ...sezioniContenuto,
                            [sez.id]: { ...contenuto, testo: e.target.value },
                          })}
                          rows={6}
                          className="text-sm"
                        />
                        <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>Chiudi</Button>
                      </div>
                    ) : (
                      <div
                        className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3 cursor-pointer hover:bg-muted transition-colors max-h-32 overflow-hidden"
                        onClick={() => setEditingId(sez.id)}
                      >
                        <p className="line-clamp-4 whitespace-pre-wrap">{contenuto.testo}</p>
                        <span className="text-xs text-primary mt-1 block">Clicca per modificare</span>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {!preventivoId && (
        <p className="text-sm text-center text-muted-foreground py-4">
          ⚠️ Salva il preventivo (torna allo step 1 e vai avanti) per generare le sezioni AI.
        </p>
      )}
    </div>
  );
}
