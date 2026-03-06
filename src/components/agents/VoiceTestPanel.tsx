import { useState, useCallback, useRef, useEffect } from "react";
import { useConversation } from "@elevenlabs/react";
import { Mic, MicOff, Square, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import WaveformVisualizer from "@/components/custom/WaveformVisualizer";

interface VoiceTestPanelProps {
  elevenlabsAgentId: string | null;
  companyId: string;
}

interface TranscriptEntry {
  role: "user" | "agent";
  text: string;
  timestamp: Date;
}

export default function VoiceTestPanel({ elevenlabsAgentId, companyId }: VoiceTestPanelProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [micGranted, setMicGranted] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const conversation = useConversation({
    onConnect: () => console.log("Voice test connected"),
    onDisconnect: () => console.log("Voice test disconnected"),
    onMessage: (message: any) => {
      if (message.type === "user_transcript") {
        setTranscript(prev => [...prev, {
          role: "user",
          text: message.user_transcription_event?.user_transcript || "",
          timestamp: new Date(),
        }]);
      } else if (message.type === "agent_response") {
        setTranscript(prev => [...prev, {
          role: "agent",
          text: message.agent_response_event?.agent_response || "",
          timestamp: new Date(),
        }]);
      }
    },
    onError: (error: any) => {
      console.error("Voice test error:", error);
      toast({ variant: "destructive", title: "Errore connessione", description: "Errore durante la conversazione vocale." });
    },
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcript]);

  const startConversation = useCallback(async () => {
    if (!elevenlabsAgentId) {
      toast({ variant: "destructive", title: "Agente non configurato", description: "Questo agente non ha un ID ElevenLabs." });
      return;
    }

    setIsConnecting(true);
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicGranted(true);

      const { data, error } = await supabase.functions.invoke("elevenlabs-conversation-token", {
        body: { agent_id: elevenlabsAgentId, company_id: companyId },
      });

      if (error || !data?.token) {
        throw new Error("Token non ricevuto");
      }

      setTranscript([]);
      await conversation.startSession({
        conversationToken: data.token,
        connectionType: "webrtc",
      });
    } catch (err: any) {
      console.error("Failed to start:", err);
      toast({ variant: "destructive", title: "Errore", description: err.message || "Impossibile avviare la conversazione." });
    } finally {
      setIsConnecting(false);
    }
  }, [conversation, elevenlabsAgentId, companyId, toast]);

  const stopConversation = useCallback(async () => {
    await conversation.endSession();
  }, [conversation]);

  const isConnected = conversation.status === "connected";

  return (
    <div className="flex flex-col items-center gap-6 py-8">
      {/* Status */}
      <div className="flex items-center gap-2 text-sm" style={{ color: "hsl(var(--app-text-secondary))" }}>
        <span
          className="w-2 h-2 rounded-full"
          style={{
            backgroundColor: isConnected ? "hsl(var(--app-success))" : "hsl(var(--app-text-tertiary))",
            boxShadow: isConnected ? "0 0 8px hsl(var(--app-success) / 0.5)" : "none",
          }}
        />
        {isConnected ? "Connesso" : isConnecting ? "Connessione..." : "Disconnesso"}
      </div>

      {/* Mic button */}
      <button
        onClick={isConnected ? stopConversation : startConversation}
        disabled={isConnecting || !elevenlabsAgentId}
        className="relative w-24 h-24 rounded-full flex items-center justify-center transition-all disabled:opacity-40"
        style={{
          backgroundColor: isConnected ? "hsl(var(--app-error) / 0.15)" : "hsl(var(--app-brand-dim))",
          border: `2px solid ${isConnected ? "hsl(var(--app-error))" : "hsl(var(--app-brand))"}`,
        }}
      >
        {isConnecting ? (
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: "hsl(var(--app-brand))" }} />
        ) : isConnected ? (
          <Square className="w-8 h-8" style={{ color: "hsl(var(--app-error))" }} />
        ) : (
          <Mic className="w-8 h-8" style={{ color: "hsl(var(--app-brand))" }} />
        )}
        {isConnected && conversation.isSpeaking && (
          <span className="absolute inset-0 rounded-full animate-ping opacity-20" style={{ backgroundColor: "hsl(var(--app-brand))" }} />
        )}
      </button>

      <p className="text-xs" style={{ color: "hsl(var(--app-text-tertiary))" }}>
        {!elevenlabsAgentId ? "Agente non ha ID ElevenLabs" : isConnected
          ? conversation.isSpeaking ? "L'agente sta parlando..." : "In ascolto..."
          : "Premi per iniziare il test vocale"}
      </p>

      {/* Waveform */}
      {isConnected && (
        <div className="w-full max-w-md">
          <WaveformVisualizer isActive={conversation.isSpeaking} />
        </div>
      )}

      {/* Transcript */}
      {transcript.length > 0 && (
        <div
          ref={scrollRef}
          className="w-full max-w-lg rounded-xl p-4 space-y-3 max-h-64 overflow-y-auto"
          style={{ backgroundColor: "hsl(var(--app-bg-tertiary))" }}
        >
          <p className="text-xs font-medium mb-2" style={{ color: "hsl(var(--app-text-secondary))" }}>Trascrizione</p>
          {transcript.map((entry, i) => (
            <div key={i} className={`flex ${entry.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className="rounded-lg px-3 py-2 max-w-[80%] text-sm"
                style={{
                  backgroundColor: entry.role === "user" ? "hsl(var(--app-brand-dim))" : "hsl(var(--app-bg-elevated))",
                  color: "hsl(var(--app-text-primary))",
                }}
              >
                {entry.text}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
