import { useState, useCallback, useRef, useEffect } from "react";
import { useConversation } from "@elevenlabs/react";
import { useNavigate } from "react-router-dom";
import { Mic, Square, Loader2, Ban } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import WaveformVisualizer from "@/components/custom/WaveformVisualizer";

interface VoiceTestPanelProps { elevenlabsAgentId: string | null; companyId: string; agentId?: string; }
interface TranscriptEntry { role: "user" | "agent"; text: string; timestamp: Date; }

export default function VoiceTestPanel({ elevenlabsAgentId, companyId, agentId }: VoiceTestPanelProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [creditBlocked, setCreditBlocked] = useState<{ blocked: boolean; balance?: number; minRequired?: number; reason?: string }>({ blocked: false });
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const conversation = useConversation({
    onConnect: () => console.log("Voice test connected"),
    onDisconnect: () => console.log("Voice test disconnected"),
    onMessage: (message: any) => {
      if (message.type === "user_transcript") setTranscript(prev => [...prev, { role: "user", text: message.user_transcription_event?.user_transcript || "", timestamp: new Date() }]);
      else if (message.type === "agent_response") setTranscript(prev => [...prev, { role: "agent", text: message.agent_response_event?.agent_response || "", timestamp: new Date() }]);
    },
    onError: () => toast({ variant: "destructive", title: "Errore connessione", description: "Errore durante la conversazione vocale." }),
  });

  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [transcript]);

  const checkCredits = useCallback(async (): Promise<boolean> => {
    if (!agentId) return true;
    try {
      const { data, error } = await supabase.functions.invoke("check-credits-before-call", {
        body: { agentId },
      });

      // When invoke returns a non-2xx status, error contains the response body
      // and data may be null. Parse the credit info from either source.
      const creditInfo = data || (error ? (() => {
        try {
          return typeof error === "object" && error !== null ? error : JSON.parse(String(error));
        } catch { return {}; }
      })() : {});

      if (creditInfo.allowed === false) {
        setCreditBlocked({
          blocked: true,
          balance: creditInfo.balance_eur,
          minRequired: creditInfo.min_required_eur,
          reason: creditInfo.reason,
        });
        return false;
      }

      if (error && creditInfo.allowed !== true) {
        // Unrecognised error structure — block the call to be safe
        setCreditBlocked({ blocked: true, reason: "check_failed" });
        return false;
      }

      setCreditBlocked({ blocked: false });
      return true;
    } catch {
      return true;
    }
  }, [agentId]);

  const startConversation = useCallback(async () => {
    if (!elevenlabsAgentId) { toast({ variant: "destructive", title: "Agente non configurato", description: "Questo agente non ha un ID ElevenLabs." }); return; }

    // Pre-call credit check
    const ok = await checkCredits();
    if (!ok) return;

    setIsConnecting(true);
    const tokenAbort = new AbortController();
    const tokenTimeout = setTimeout(() => tokenAbort.abort(), 15_000);
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      const { data, error } = await supabase.functions.invoke("elevenlabs-conversation-token", {
        body: { agent_id: elevenlabsAgentId, company_id: companyId },
        signal: tokenAbort.signal,
      });
      if (error || !data?.token) throw new Error("Token non ricevuto");
      setTranscript([]);
      await conversation.startSession({ conversationToken: data.token, connectionType: "webrtc" });
    } catch (err: any) {
      const isTimeout = err?.name === "AbortError" || err?.message?.includes("aborted");
      toast({
        variant: "destructive",
        title: isTimeout ? "Timeout connessione" : "Errore",
        description: isTimeout ? "Il server ha impiegato troppo tempo. Riprova." : (err.message || "Impossibile avviare la conversazione."),
      });
    } finally {
      clearTimeout(tokenTimeout);
      setIsConnecting(false);
    }
  }, [conversation, elevenlabsAgentId, companyId, toast, checkCredits]);

  const stopConversation = useCallback(async () => { await conversation.endSession(); }, [conversation]);
  const isConnected = conversation.status === "connected";

  return (
    <div className="flex flex-col items-center gap-6 py-8">
      {/* Credit blocked overlay */}
      {creditBlocked.blocked && (
        <div className="w-full max-w-md rounded-card p-4 border border-destructive bg-destructive/5 text-center space-y-2">
          <Ban className="h-8 w-8 text-destructive mx-auto" />
          <p className="text-sm font-semibold text-destructive">Crediti insufficienti</p>
          <p className="text-xs text-muted-foreground">
            Saldo: €{(creditBlocked.balance || 0).toFixed(2)} · Minimo richiesto: €{(creditBlocked.minRequired || 0).toFixed(4)}
          </p>
          <button
            onClick={() => navigate("/app/credits")}
            className="mt-2 px-4 py-2 rounded-btn bg-destructive text-white text-sm font-medium hover:bg-destructive/90 transition-colors"
          >
            Ricarica Crediti
          </button>
        </div>
      )}

      <div className="flex items-center gap-2 text-sm text-ink-500">
        <span className={`w-2 h-2 rounded-full ${isConnected ? "bg-status-success shadow-[0_0_8px_rgba(34,197,94,0.5)]" : "bg-ink-300"}`} />
        {isConnected ? "Connesso" : isConnecting ? "Connessione..." : "Disconnesso"}
      </div>

      <button
        onClick={isConnected ? stopConversation : startConversation}
        disabled={isConnecting || !elevenlabsAgentId || creditBlocked.blocked}
        className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-all disabled:opacity-40 border-2 ${isConnected ? "border-status-error bg-status-error-light" : "border-brand bg-brand-light"}`}
      >
        {isConnecting ? <Loader2 className="w-8 h-8 animate-spin text-brand" /> : isConnected ? <Square className="w-8 h-8 text-status-error" /> : <Mic className="w-8 h-8 text-brand" />}
        {isConnected && conversation.isSpeaking && <span className="absolute inset-0 rounded-full animate-ping opacity-20 bg-brand" />}
      </button>

      <p className="text-xs text-ink-400">
        {creditBlocked.blocked ? "Ricarica i crediti per effettuare test" : !elevenlabsAgentId ? "Agente non ha ID ElevenLabs" : isConnected ? conversation.isSpeaking ? "L'agente sta parlando..." : "In ascolto..." : "Premi per iniziare il test vocale"}
      </p>

      {isConnected && <div className="w-full max-w-md"><WaveformVisualizer isActive={conversation.isSpeaking} /></div>}

      {transcript.length > 0 && (
        <div ref={scrollRef} className="w-full max-w-lg rounded-card p-4 space-y-3 max-h-64 overflow-y-auto bg-ink-50 border border-ink-200">
          <p className="text-xs font-medium mb-2 text-ink-500">Trascrizione</p>
          {transcript.map((entry, i) => (
            <div key={i} className={`flex ${entry.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`rounded-btn px-3 py-2 max-w-[80%] text-sm text-ink-900 ${entry.role === "user" ? "bg-brand-light" : "bg-white border border-ink-200"}`}>{entry.text}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
