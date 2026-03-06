import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Json } from "@/integrations/supabase/types";

interface TranscriptViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transcript: Json | null;
  agentName?: string;
}

interface TranscriptMessage {
  role: string;
  text: string;
  timestamp?: string;
}

export default function TranscriptViewer({ open, onOpenChange, transcript, agentName }: TranscriptViewerProps) {
  const messages: TranscriptMessage[] = Array.isArray(transcript)
    ? (transcript as unknown as TranscriptMessage[])
    : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-hidden flex flex-col" style={{ backgroundColor: "hsl(var(--app-bg-secondary))", borderColor: "hsl(var(--app-border-subtle))" }}>
        <DialogHeader>
          <DialogTitle style={{ color: "hsl(var(--app-text-primary))" }}>
            Trascrizione {agentName && `— ${agentName}`}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-3 pr-2 py-4">
          {messages.length === 0 ? (
            <p className="text-sm text-center py-8" style={{ color: "hsl(var(--app-text-tertiary))" }}>
              Nessuna trascrizione disponibile.
            </p>
          ) : (
            messages.map((msg, i) => {
              const isUser = msg.role === "user";
              return (
                <div key={i} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                  <div
                    className="rounded-lg px-3 py-2 max-w-[80%] text-sm"
                    style={{
                      backgroundColor: isUser ? "hsl(var(--app-brand-dim))" : "hsl(var(--app-bg-elevated))",
                      color: "hsl(var(--app-text-primary))",
                    }}
                  >
                    <p className="text-[10px] font-medium mb-1" style={{ color: "hsl(var(--app-text-tertiary))" }}>
                      {isUser ? "Utente" : "Agente"}
                    </p>
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
