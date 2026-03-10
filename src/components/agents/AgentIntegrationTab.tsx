import { useState } from "react";
import { Copy, Check, Code, Globe, Webhook } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  agentId: string;
  elAgentId: string | null;
  agentName: string;
  webhookUrl?: string;
  onSaveWebhook?: (url: string) => void;
}

export default function AgentIntegrationTab({ agentId, elAgentId, agentName, webhookUrl, onSaveWebhook }: Props) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [customWebhook, setCustomWebhook] = useState(webhookUrl || "");

  const copy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
  const elWebhookUrl = `${supabaseUrl}/functions/v1/elevenlabs-webhook`;

  const widgetCode = `<script src="https://elevenlabs.io/convai-widget/index.js" async></script>
<elevenlabs-convai agent-id="${elAgentId || "YOUR_AGENT_ID"}"></elevenlabs-convai>`;

  const reactCode = `import { useConversation } from "@elevenlabs/react";

function VoiceWidget() {
  const conversation = useConversation();

  const start = async () => {
    await navigator.mediaDevices.getUserMedia({ audio: true });
    await conversation.startSession({
      agentId: "${elAgentId || "YOUR_AGENT_ID"}",
      connectionType: "webrtc",
    });
  };

  return (
    <button onClick={conversation.status === "connected" ? () => conversation.endSession() : start}>
      {conversation.status === "connected" ? "Stop" : "Start"}
    </button>
  );
}`;

  return (
    <div className="space-y-6">
      {/* IDs */}
      <div className="rounded-card border border-ink-200 bg-white p-5 shadow-card space-y-4">
        <h3 className="text-sm font-semibold text-ink-900">Identificatori</h3>
        {[
          { label: "Agent ID (interno)", value: agentId },
          { label: "ElevenLabs Agent ID", value: elAgentId || "Non configurato" },
        ].map((item) => (
          <div key={item.label} className="flex items-center justify-between">
            <div>
              <p className="text-xs text-ink-400">{item.label}</p>
              <p className="text-sm font-mono text-ink-900">{item.value}</p>
            </div>
            {item.value !== "Non configurato" && (
              <Button variant="ghost" size="sm" onClick={() => copy(item.value, item.label)} className="text-ink-400 hover:text-ink-700">
                {copiedField === item.label ? <Check className="w-4 h-4 text-status-success" /> : <Copy className="w-4 h-4" />}
              </Button>
            )}
          </div>
        ))}
      </div>

      {/* Webhook Post-Chiamata */}
      <div className="rounded-card border border-ink-200 bg-white p-5 shadow-card space-y-3">
        <div className="flex items-center gap-2">
          <Webhook className="w-4 h-4 text-ink-400" />
          <h3 className="text-sm font-semibold text-ink-900">Webhook Post-Chiamata</h3>
        </div>
        <p className="text-xs text-ink-500">Ricevi i dati di ogni chiamata nel tuo sistema esterno.</p>

        <div className="space-y-1">
          <p className="text-xs text-ink-400">URL webhook (registrato su ElevenLabs)</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 p-2 rounded bg-ink-50 text-xs text-ink-800 font-mono truncate border border-ink-200">{elWebhookUrl}</code>
            <Button variant="ghost" size="sm" onClick={() => copy(elWebhookUrl, "webhook")}>
              {copiedField === "webhook" ? <Check className="w-4 h-4 text-status-success" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        <div className="space-y-1">
          <Label className="text-xs text-ink-500">Webhook aziendale (opzionale)</Label>
          <div className="flex gap-2">
            <Input placeholder="https://tuosito.com/webhook" value={customWebhook} onChange={e => setCustomWebhook(e.target.value)} className="font-mono text-sm" />
            <Button variant="outline" size="sm" onClick={() => onSaveWebhook?.(customWebhook)}>Salva</Button>
          </div>
          <p className="text-[10px] text-ink-400">Riceverai un POST con i dati completi di ogni conversazione</p>
        </div>
      </div>

      {/* HTML Embed */}
      <div className="rounded-card border border-ink-200 bg-white p-5 shadow-card space-y-3">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-ink-400" />
          <h3 className="text-sm font-semibold text-ink-900">Widget HTML</h3>
        </div>
        <p className="text-xs text-ink-500">Incolla questo codice nel tuo sito web per integrare l'agente vocale.</p>
        <div className="relative">
          <pre className="p-4 rounded-btn bg-ink-50 border border-ink-200 text-xs overflow-x-auto font-mono text-ink-800">{widgetCode}</pre>
          <Button variant="ghost" size="sm" className="absolute top-2 right-2 text-ink-400 hover:text-ink-700" onClick={() => copy(widgetCode, "html")}>
            {copiedField === "html" ? <Check className="w-4 h-4 text-status-success" /> : <Copy className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* React Embed */}
      <div className="rounded-card border border-ink-200 bg-white p-5 shadow-card space-y-3">
        <div className="flex items-center gap-2">
          <Code className="w-4 h-4 text-ink-400" />
          <h3 className="text-sm font-semibold text-ink-900">Componente React</h3>
        </div>
        <p className="text-xs text-ink-500">Usa questo componente nella tua app React.</p>
        <div className="relative">
          <pre className="p-4 rounded-btn bg-ink-50 border border-ink-200 text-xs overflow-x-auto font-mono text-ink-800 max-h-64">{reactCode}</pre>
          <Button variant="ghost" size="sm" className="absolute top-2 right-2 text-ink-400 hover:text-ink-700" onClick={() => copy(reactCode, "react")}>
            {copiedField === "react" ? <Check className="w-4 h-4 text-status-success" /> : <Copy className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
