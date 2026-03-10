import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { ChevronDown, Send, Check, AlertTriangle, Image } from "lucide-react";
import { useState } from "react";

interface Props {
  report: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ReportDetailModal({ report, open, onOpenChange }: Props) {
  const [transcriptOpen, setTranscriptOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  const r = report as any;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            📋 Report {r.date}
            <Badge variant="outline" className="text-xs">{r.fonte || "telegram"}</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Transcription */}
          {r.trascrizione && (
            <Collapsible open={transcriptOpen} onOpenChange={setTranscriptOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between text-sm">
                  🎙️ Trascrizione originale
                  <ChevronDown className={`h-4 w-4 transition-transform ${transcriptOpen ? "rotate-180" : ""}`} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="bg-muted p-4 rounded-lg text-sm text-muted-foreground italic mt-2">
                  {r.trascrizione}
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Audio */}
          {r.audio_url && (
            <div>
              <p className="text-sm font-medium mb-2">🔊 Audio originale</p>
              <audio controls className="w-full" src={r.audio_url} />
            </div>
          )}

          {/* Structured Data */}
          {r.operai_presenti?.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">👷 Operai presenti ({r.operai_presenti.length})</p>
              <div className="space-y-1">
                {r.operai_presenti.map((o: any, i: number) => (
                  <div key={i} className="flex items-center gap-2 text-sm bg-muted px-3 py-1.5 rounded">
                    <span className="font-medium">{o.nome}</span>
                    {o.ruolo && <span className="text-muted-foreground">· {o.ruolo}</span>}
                    {o.ore && <span className="text-primary font-medium ml-auto">{o.ore}h</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {r.lavori_eseguiti?.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">🔨 Lavori eseguiti</p>
              <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                {r.lavori_eseguiti.map((l: string, i: number) => <li key={i}>{l}</li>)}
              </ul>
            </div>
          )}

          {r.materiali_usati?.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">📦 Materiali utilizzati</p>
              <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                {r.materiali_usati.map((m: string, i: number) => <li key={i}>{m}</li>)}
              </ul>
            </div>
          )}

          {r.materiali_da_ordinare?.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">🛒 Materiali da ordinare</p>
              <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                {r.materiali_da_ordinare.map((m: string, i: number) => <li key={i}>{m}</li>)}
              </ul>
            </div>
          )}

          {r.problemi?.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2 flex items-center gap-1">
                <AlertTriangle className="h-4 w-4 text-destructive" /> Problemi ({r.problemi.length})
              </p>
              <ul className="list-disc pl-5 text-sm text-destructive/80 space-y-1">
                {r.problemi.map((p: string, i: number) => <li key={i}>{p}</li>)}
              </ul>
            </div>
          )}

          {r.avanzamento_percentuale && (
            <div>
              <p className="text-sm font-medium mb-2">📊 Avanzamento</p>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${r.avanzamento_percentuale}%` }} />
                </div>
                <span className="text-sm font-bold text-primary">{r.avanzamento_percentuale}%</span>
              </div>
            </div>
          )}

          {r.previsione_domani && (
            <div>
              <p className="text-sm font-medium mb-1">📅 Previsione domani</p>
              <p className="text-sm text-muted-foreground">{r.previsione_domani}</p>
            </div>
          )}

          {/* Photos */}
          {r.foto_urls?.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2 flex items-center gap-1">
                <Image className="h-4 w-4" /> Foto ({r.foto_urls.length})
              </p>
              <div className="grid grid-cols-3 gap-2">
                {r.foto_urls.map((url: string, i: number) => (
                  <img
                    key={i}
                    src={url}
                    alt={`Foto ${i + 1}`}
                    className="rounded-lg object-cover aspect-square cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => setSelectedPhoto(url)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Email status */}
          <div className="border-t pt-3 flex items-center justify-between text-sm">
            {r.email_inviata ? (
              <span className="flex items-center gap-1 text-primary"><Check className="h-4 w-4" /> Email inviata {r.email_inviata_at ? `il ${new Date(r.email_inviata_at).toLocaleDateString("it-IT")}` : ""}</span>
            ) : (
              <span className="text-muted-foreground">Email non inviata</span>
            )}
          </div>
        </div>

        {/* Full photo viewer */}
        {selectedPhoto && (
          <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
            <DialogContent className="max-w-4xl">
              <img src={selectedPhoto} alt="Foto cantiere" className="w-full rounded-lg" />
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  );
}
