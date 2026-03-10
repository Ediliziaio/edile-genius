import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Json } from "@/integrations/supabase/types";
import { Bot, User, Database } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface TranscriptViewerProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  transcript: Json | null;
  agentName?: string;
  inline?: boolean;
  evalScore?: number | null;
  evalNotes?: string | null;
  collectedData?: Json | null;
}

interface TranscriptMessage {
  role: string;
  text: string;
  timestamp?: string;
}

function TranscriptContent({ transcript, agentName, evalScore, evalNotes, collectedData }: {
  transcript: Json | null; agentName?: string;
  evalScore?: number | null; evalNotes?: string | null; collectedData?: Json | null;
}) {
  const messages: TranscriptMessage[] = Array.isArray(transcript)
    ? (transcript as unknown as TranscriptMessage[])
    : [];

  // Parse collected data
  const dataEntries = collectedData && typeof collectedData === "object" && !Array.isArray(collectedData)
    ? Object.entries(collectedData as Record<string, unknown>).filter(([, v]) => v !== null && v !== undefined)
    : [];

  return (
    <div className="space-y-4 py-2">
      {/* Eval info */}
      {(evalScore !== null && evalScore !== undefined) && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-ink-500">Punteggio:</span>
          <Badge className={`text-xs ${evalScore >= 70 ? "bg-green-100 text-green-700" : evalScore >= 40 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>
            {evalScore}/100
          </Badge>
        </div>
      )}
      {evalNotes && <p className="text-xs text-ink-400 italic">{evalNotes}</p>}

      {/* Collected data */}
      {dataEntries.length > 0 && (
        <div className="rounded-lg border border-ink-200 bg-ink-50 p-3 space-y-1.5">
          <div className="flex items-center gap-1.5 mb-1">
            <Database className="w-3.5 h-3.5 text-ink-400" />
            <span className="text-xs font-semibold text-ink-700">Dati Raccolti</span>
          </div>
          {dataEntries.map(([key, val]) => (
            <div key={key} className="flex justify-between text-xs">
              <span className="text-ink-500">{key}</span>
              <span className="text-ink-900 font-medium">{String(val)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Messages */}
      {messages.length === 0 ? (
        <div className="text-center py-12">
          <Bot className="h-10 w-10 mx-auto text-ink-300 mb-3" />
          <p className="text-sm text-ink-400">Nessuna trascrizione disponibile.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {messages.map((msg, i) => {
            const isUser = msg.role === "user";
            return (
              <div key={i} className={`flex gap-2 ${isUser ? "flex-row-reverse" : ""}`}>
                <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center ${isUser ? "bg-brand-light" : "bg-ink-100"}`}>
                  {isUser ? <User className="h-3.5 w-3.5 text-brand" /> : <Bot className="h-3.5 w-3.5 text-ink-500" />}
                </div>
                <div className={`max-w-[80%] ${isUser ? "text-right" : ""}`}>
                  <div className={`rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${isUser ? "bg-brand text-white rounded-tr-sm" : "bg-ink-50 border border-ink-200 text-ink-900 rounded-tl-sm"}`}>
                    {msg.text}
                  </div>
                  {msg.timestamp && <p className={`text-[10px] text-ink-400 mt-0.5 ${isUser ? "text-right mr-1" : "ml-1"}`}>{msg.timestamp}</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function TranscriptViewer({ open, onOpenChange, transcript, agentName, inline, evalScore, evalNotes, collectedData }: TranscriptViewerProps) {
  if (inline) {
    return (
      <div className="flex-1 overflow-y-auto px-1 max-h-[50vh]">
        <TranscriptContent transcript={transcript} agentName={agentName} evalScore={evalScore} evalNotes={evalNotes} collectedData={collectedData} />
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-ink-900">Trascrizione {agentName && `— ${agentName}`}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto pr-2">
          <TranscriptContent transcript={transcript} agentName={agentName} evalScore={evalScore} evalNotes={evalNotes} collectedData={collectedData} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
