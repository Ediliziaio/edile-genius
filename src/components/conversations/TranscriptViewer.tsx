import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Json } from "@/integrations/supabase/types";
import { Bot, User } from "lucide-react";

interface TranscriptViewerProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  transcript: Json | null;
  agentName?: string;
  inline?: boolean;
}

interface TranscriptMessage {
  role: string;
  text: string;
  timestamp?: string;
}

function TranscriptContent({ transcript, agentName }: { transcript: Json | null; agentName?: string }) {
  const messages: TranscriptMessage[] = Array.isArray(transcript)
    ? (transcript as unknown as TranscriptMessage[])
    : [];

  if (messages.length === 0) {
    return (
      <div className="text-center py-12">
        <Bot className="h-10 w-10 mx-auto text-ink-300 mb-3" />
        <p className="text-sm text-ink-400">Nessuna trascrizione disponibile.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 py-2">
      {messages.map((msg, i) => {
        const isUser = msg.role === "user";
        return (
          <div key={i} className={`flex gap-2 ${isUser ? "flex-row-reverse" : ""}`}>
            <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center ${
              isUser ? "bg-brand-light" : "bg-ink-100"
            }`}>
              {isUser ? (
                <User className="h-3.5 w-3.5 text-brand" />
              ) : (
                <Bot className="h-3.5 w-3.5 text-ink-500" />
              )}
            </div>
            <div className={`max-w-[80%] ${isUser ? "text-right" : ""}`}>
              <div className={`rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                isUser
                  ? "bg-brand text-white rounded-tr-sm"
                  : "bg-ink-50 border border-ink-200 text-ink-900 rounded-tl-sm"
              }`}>
                {msg.text}
              </div>
              {msg.timestamp && (
                <p className={`text-[10px] text-ink-400 mt-0.5 ${isUser ? "text-right mr-1" : "ml-1"}`}>
                  {msg.timestamp}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function TranscriptViewer({ open, onOpenChange, transcript, agentName, inline }: TranscriptViewerProps) {
  if (inline) {
    return (
      <div className="flex-1 overflow-y-auto px-1 max-h-[50vh]">
        <TranscriptContent transcript={transcript} agentName={agentName} />
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
          <TranscriptContent transcript={transcript} agentName={agentName} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
