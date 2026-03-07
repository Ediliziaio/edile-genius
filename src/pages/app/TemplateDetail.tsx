import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Clock, CheckCircle2, MessageCircle, Send, Bot, BarChart3, Timer } from "lucide-react";

interface Template {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  icon: string;
  category: string | null;
  channel: string[];
  difficulty: string;
  estimated_setup_min: number;
  installs_count: number;
  config_schema: any;
  output_schema: any;
}

const flowSteps = [
  { icon: <Timer size={20} />, color: "bg-primary-light text-brand-text", label: "Trigger orario", title: "Ogni sera all'orario configurato", tech: "n8n Schedule Trigger" },
  { icon: <MessageCircle size={20} />, color: "bg-status-info-light text-status-info", label: "Messaggio ai capi-cantiere", title: "L'agente AI invia il primo messaggio su WhatsApp/Telegram a ogni capo-cantiere", tech: "WhatsApp / Telegram" },
  { icon: <Bot size={20} />, color: "bg-purple-100 text-purple-700", label: "Conversazione guidata", title: "L'agente raccoglie le informazioni in 7 domande. Tempo medio: 3-5 min per operaio.", tech: "ElevenLabs Conversational AI" },
  { icon: <BarChart3 size={20} />, color: "bg-status-warning-light text-status-warning", label: "Generazione report", title: "I dati raccolti vengono strutturati in un report professionale.", tech: "n8n + AI" },
  { icon: <Send size={20} />, color: "bg-emerald-100 text-emerald-700", label: "Invio al titolare", title: "Il report arriva via Email + WhatsApp/Telegram entro 10 minuti.", tech: "Email / WhatsApp / Telegram" },
];

const channelIcons: Record<string, string> = {
  whatsapp: "💬",
  telegram: "✈️",
  email: "📧",
  voice: "📞",
  sms: "💬",
};

export default function TemplateDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [template, setTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    const fetch = async () => {
      const { data } = await supabase
        .from("agent_templates")
        .select("*")
        .eq("slug", slug)
        .single();
      setTemplate(data as Template | null);
      setLoading(false);
    };
    fetch();
  }, [slug]);

  if (loading) return <div className="p-8"><div className="h-96 bg-muted animate-pulse rounded-card" /></div>;
  if (!template) return <div className="p-8 text-center text-muted-foreground">Template non trovato.</div>;

  const diffStyle = template.difficulty === "facile" ? "bg-primary-light text-brand-text"
    : template.difficulty === "medio" ? "bg-status-warning-light text-amber-700"
    : "bg-purple-100 text-purple-700";

  return (
    <div className="px-8 py-8">
      <Button variant="ghost" size="sm" className="mb-4" onClick={() => navigate("/app/templates")}>
        <ArrowLeft size={16} className="mr-1" /> Template
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">
        {/* Left column */}
        <div>
          <div className="flex items-center gap-4">
            <span className="text-5xl">{template.icon}</span>
            <div>
              <h1 className="text-[26px] font-extrabold text-foreground">{template.name}</h1>
              <div className="flex gap-2 mt-1">
                {template.category && (
                  <span className="text-[11px] font-mono uppercase bg-muted text-muted-foreground px-2 py-0.5 rounded-pill">
                    {template.category}
                  </span>
                )}
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-pill ${diffStyle}`}>
                  {template.difficulty}
                </span>
              </div>
            </div>
          </div>

          <p className="text-[15px] text-muted-foreground mt-3 max-w-prose">{template.description}</p>

          {/* Flow visuale */}
          <Card className="mt-6">
            <CardContent className="p-5">
              <h2 className="text-base font-bold text-foreground mb-5">Come funziona questo agente</h2>

              <div className="space-y-0">
                {flowSteps.map((step, i) => (
                  <div key={i}>
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${step.color}`}>
                        {step.icon}
                      </div>
                      <div className="flex-1 pb-1">
                        <p className="text-[11px] font-mono uppercase tracking-wider text-primary font-semibold">{step.label}</p>
                        <p className="text-sm font-semibold text-foreground mt-0.5">{step.title}</p>
                        <span className="inline-block text-[10px] font-mono bg-muted text-muted-foreground px-2 py-0.5 rounded-pill mt-1.5">
                          {step.tech}
                        </span>
                      </div>
                    </div>
                    {i < flowSteps.length - 1 && (
                      <div className="ml-5 h-8 border-l-2 border-dashed border-primary/30" />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Report preview */}
          <Card className="mt-5 overflow-hidden">
            <div className="bg-muted border-b border-border px-5 py-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">📋 Esempio Report — Cantiere Via Roma, 15</p>
                <p className="text-[12px] font-mono text-muted-foreground">Giovedì 6 Marzo 2025 · Generato alle 18:12</p>
              </div>
            </div>
            <CardContent className="p-5">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-primary-light border border-brand-border rounded-lg p-3">
                  <p className="text-[11px] text-muted-foreground">👷 Operai presenti</p>
                  <p className="text-3xl font-extrabold text-brand-text">5</p>
                  <p className="text-[11px] text-muted-foreground">su 6 previsti</p>
                </div>
                <div className="bg-muted border border-border rounded-lg p-3">
                  <p className="text-[11px] text-muted-foreground">📅 Avanzamento</p>
                  <p className="text-sm font-bold text-foreground mt-1">🟢 In pari</p>
                  <p className="text-[11px] text-muted-foreground">Rispetto al programma</p>
                </div>
              </div>

              <p className="text-[12px] font-semibold text-foreground mt-3">Lavorazioni eseguite:</p>
              <p className="text-[13px] text-muted-foreground">Posa infissi piano primo (finestre cucina e soggiorno completate). Sigillatura perimetrale camera da letto in corso.</p>

              <p className="text-[12px] font-semibold text-foreground mt-3">Materiali utilizzati:</p>
              <p className="text-[13px] text-muted-foreground">12 finestre PVC serie 70, 8 kg silicone trasparente, 4 tappi coprifilo</p>

              <div className="inline-flex items-center gap-1 bg-status-success-light text-status-success text-[12px] font-semibold px-3 py-1 rounded-pill mt-3">
                ✅ Nessun problema segnalato
              </div>

              <p className="text-[12px] font-semibold text-foreground mt-3">Previsione domani:</p>
              <p className="text-[13px] text-muted-foreground">Completamento sigillature piano primo + inizio piano secondo</p>

              <div className="border-t border-border mt-4 pt-4">
                <p className="text-[11px] font-mono uppercase text-muted-foreground mb-3">Conversazione originale:</p>
                <div className="space-y-2">
                  <div className="flex justify-end">
                    <div className="bg-[#DCF8C6] rounded-[12px_12px_3px_12px] px-3 py-2 text-[13px] max-w-[75%]">
                      Buonasera Marco 👷 Report cantiere Via Roma...
                      <span className="block text-[10px] text-right text-muted-foreground mt-0.5">17:30 ✓✓</span>
                    </div>
                  </div>
                  <div className="flex justify-start">
                    <div className="bg-card border border-border rounded-[12px_12px_12px_3px] px-3 py-2 text-[13px] max-w-[75%]">
                      Sì dai
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <div className="bg-[#DCF8C6] rounded-[12px_12px_3px_12px] px-3 py-2 text-[13px] max-w-[75%]">
                      Quanti operai oggi?
                      <span className="block text-[10px] text-right text-muted-foreground mt-0.5">17:30 ✓✓</span>
                    </div>
                  </div>
                  <div className="flex justify-start">
                    <div className="bg-card border border-border rounded-[12px_12px_12px_3px] px-3 py-2 text-[13px] max-w-[75%]">
                      5, mancava Giovanni per malattia
                    </div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground text-center mt-3">... altri 12 messaggi</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right column — sticky */}
        <div className="lg:sticky lg:top-[88px] self-start">
          <Card className="shadow-card">
            <CardContent className="p-6">
              <p className="text-[13px] text-primary font-semibold flex items-center gap-1.5">
                <Clock size={14} /> Setup in {template.estimated_setup_min} minuti
              </p>

              <div className="mt-4 space-y-2">
                {["Prompt pre-configurato", "Workflow n8n incluso", "Integrazione WhatsApp/Telegram", "Report automatico", "Invio al titolare"].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-sm text-foreground">
                    <CheckCircle2 size={15} className="text-primary shrink-0" />
                    {item}
                  </div>
                ))}
              </div>

              <div className="border-t border-border my-5" />

              <p className="text-[12px] text-muted-foreground">Canali supportati:</p>
              <div className="flex gap-2 mt-2">
                {template.channel.map((ch) => (
                  <span key={ch} className="flex items-center gap-1 text-sm text-foreground bg-muted px-2.5 py-1 rounded-lg">
                    {channelIcons[ch] || "📡"} {ch.charAt(0).toUpperCase() + ch.slice(1)}
                  </span>
                ))}
              </div>

              <p className="text-[12px] text-muted-foreground mt-4">Consuma crediti:</p>
              <p className="text-sm font-bold text-foreground">~€0.28 per conversazione</p>
              <p className="text-[11px] text-muted-foreground">stimato su 4 min a operaio · Gemini Flash</p>

              <div className="border-t border-border my-5" />

              <p className="text-[12px] text-muted-foreground">{template.installs_count} aziende attive</p>

              <Button className="w-full text-base py-3 mt-3" onClick={() => navigate(`/app/templates/${slug}/setup`)}>
                🚀 Configura Questo Template
              </Button>

              <Button variant="ghost" className="w-full mt-2" onClick={() => {}}>
                Vedi workflow n8n →
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
