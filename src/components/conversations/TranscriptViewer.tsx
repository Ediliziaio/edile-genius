import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Json } from "@/integrations/supabase/types";

interface TranscriptViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transcript: Json | null;
  agentName?: string;
}

interface TranscriptMessage { role: string; text: string; timestamp?: string; }

export default function TranscriptViewer({ open, onOpenChange, transcript, agentName }: TranscriptViewerProps) {
  const messages: TranscriptMessage[] = Array.isArray(transcript) ? (transcript as unknown as TranscriptMessage[]) : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-hidden flex flex-col bg-white border border-ink-200 shadow-modal">
        <DialogHeader>
          <DialogTitle className="text-ink-900">Trascrizione {agentName && `— ${agentName}`}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-3 pr-2 py-4">
          {messages.length === 0 ? (
            <p className="text-sm text-center py-8 text-ink-400">Nessuna trascrizione disponibile.</p>
          ) : (
            messages.map((msg, i) => {
              const isUser = msg.role === "user";
              return (
                <div key={i} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                  <div className={`rounded-btn px-3 py-2 max-w-[80%] text-sm text-ink-900 ${isUser ? "bg-brand-light" : "bg-ink-50 border border-ink-200"}`}>
                    <p className="text-[10px] font-medium mb-1 text-ink-400">{isUser ? "Utente" : "Agente"}</p>
                    {msg.text}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
