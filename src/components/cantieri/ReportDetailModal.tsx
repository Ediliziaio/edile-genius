import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronLeft, ChevronRight, Check, AlertTriangle, Image, Download, X } from "lucide-react";
import { useState } from "react";

interface Props {
  report: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function safeDateFormat(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleDateString("it-IT");
  } catch {
    return "";
  }
}

export default function ReportDetailModal({ report, open, onOpenChange }: Props) {
  const [transcriptOpen, setTranscriptOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const r = report as any;
  const photos: string[] = r.foto_urls || [];

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
          {photos.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2 flex items-center gap-1">
                <Image className="h-4 w-4" /> Foto ({photos.length})
              </p>
              <div className="grid grid-cols-3 gap-2">
                {photos.map((url: string, i: number) => (
                  <img
                    key={i}
                    src={url}
                    alt={`Foto ${i + 1}`}
                    className="rounded-lg object-cover aspect-square cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => setLightboxIndex(i)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Email status */}
          <div className="border-t pt-3 flex items-center justify-between text-sm">
            {r.email_inviata ? (
              <span className="flex items-center gap-1 text-primary">
                <Check className="h-4 w-4" /> Email inviata {safeDateFormat(r.email_inviata_at) ? `il ${safeDateFormat(r.email_inviata_at)}` : ""}
              </span>
            ) : (
              <span className="text-muted-foreground">Email non inviata</span>
            )}
          </div>
        </div>
      </DialogContent>

      {/* Lightbox with prev/next navigation */}
      {lightboxIndex !== null && photos.length > 0 && (
        <Dialog open={lightboxIndex !== null} onOpenChange={() => setLightboxIndex(null)}>
          <DialogContent className="max-w-4xl p-2 bg-black/95 border-none">
            <div className="relative flex items-center justify-center min-h-[60vh]">
              {/* Close */}
              <button
                onClick={() => setLightboxIndex(null)}
                className="absolute top-2 right-2 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Previous */}
              {photos.length > 1 && (
                <button
                  onClick={() => setLightboxIndex((lightboxIndex - 1 + photos.length) % photos.length)}
                  className="absolute left-2 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
              )}

              {/* Image */}
              <img
                src={photos[lightboxIndex]}
                alt={`Foto ${lightboxIndex + 1}`}
                className="max-h-[80vh] max-w-full rounded-lg object-contain"
              />

              {/* Next */}
              {photos.length > 1 && (
                <button
                  onClick={() => setLightboxIndex((lightboxIndex + 1) % photos.length)}
                  className="absolute right-2 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              )}

              {/* Counter + Download */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-3">
                <span className="text-white/80 text-sm">{lightboxIndex + 1} / {photos.length}</span>
                <a
                  href={photos[lightboxIndex]}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                >
                  <Download className="h-4 w-4" />
                </a>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Dialog>
  );
}
