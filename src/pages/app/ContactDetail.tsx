import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Phone, Mail, MapPin, Building2, Loader2, Bot, Zap } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";

interface AiAction {
  ts: string;
  type: string;
  outcome?: string;
  action?: string;
  next_step?: string;
  conversation_id?: string;
  agent_id?: string;
}

interface Contact {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  company_name: string | null;
  city: string | null;
  province: string | null;
  status: string;
  priority: string | null;
  source: string | null;
  notes: string | null;
  created_at: string | null;
  ai_actions_log: AiAction[] | null;
}

const ACTION_LABELS: Record<string, string> = {
  post_call: "📞 Post-chiamata",
  auto_followup: "🤖 Follow-up automatico",
};

const OUTCOME_LABELS: Record<string, string> = {
  appointment: "Appuntamento fissato",
  qualified: "Lead qualificato",
  callback: "Da richiamare",
  not_interested: "Non interessato",
  do_not_call: "Non contattare",
  wrong_number: "Numero errato",
  voicemail: "Segreteria",
  no_answer: "Nessuna risposta",
};

export default function ContactDetail() {
  const { id } = useParams<{ id: string }>();
  const [contact, setContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    supabase.from("contacts").select("*").eq("id", id).single().then(({ data }) => {
      if (data) setContact(data as unknown as Contact);
      setLoading(false);
    });
  }, [id]);

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  if (!contact) return <p className="text-center text-muted-foreground py-12">Contatto non trovato.</p>;

  const aiActions = Array.isArray(contact.ai_actions_log) ? [...contact.ai_actions_log].reverse() : [];

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild><Link to="/app/contacts"><ArrowLeft className="h-4 w-4" /></Link></Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{contact.full_name}</h1>
          <p className="text-sm text-muted-foreground">{contact.company_name || "Nessuna azienda"}</p>
        </div>
        <Badge className="ml-auto" variant={contact.status === "qualified" ? "default" : "secondary"}>{contact.status}</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-sm">Informazioni</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {contact.phone && <div className="flex items-center gap-2 text-sm"><Phone className="h-4 w-4 text-muted-foreground" /> {contact.phone}</div>}
            {contact.email && <div className="flex items-center gap-2 text-sm"><Mail className="h-4 w-4 text-muted-foreground" /> {contact.email}</div>}
            {contact.city && <div className="flex items-center gap-2 text-sm"><MapPin className="h-4 w-4 text-muted-foreground" /> {contact.city}{contact.province ? ` (${contact.province})` : ""}</div>}
            {contact.company_name && <div className="flex items-center gap-2 text-sm"><Building2 className="h-4 w-4 text-muted-foreground" /> {contact.company_name}</div>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Dettagli</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Priorità:</span><span className="font-medium">{contact.priority || "—"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Fonte:</span><span className="font-medium">{contact.source || "—"}</span></div>
          </CardContent>
        </Card>
      </div>

      {contact.notes && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Note</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-muted-foreground whitespace-pre-wrap">{contact.notes}</p></CardContent>
        </Card>
      )}

      {/* AI Actions Timeline */}
      {aiActions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Bot className="h-4 w-4 text-primary" />
              Azioni AI
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{aiActions.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {aiActions.slice(0, 10).map((action, i) => (
                <div key={i} className="flex items-start gap-3 text-sm">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Zap className="w-3 h-3 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground">
                      {ACTION_LABELS[action.type] || action.type}
                      {action.outcome && (
                        <span className="text-muted-foreground font-normal">
                          {" → "}{OUTCOME_LABELS[action.outcome] || action.outcome}
                        </span>
                      )}
                      {action.action && (
                        <span className="text-muted-foreground font-normal">
                          {" — "}{action.action === "outbound_call" ? "Chiamata in uscita" : action.action}
                        </span>
                      )}
                    </p>
                    {action.next_step && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Prossimo passo: {action.next_step}
                      </p>
                    )}
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {format(new Date(action.ts), "d MMM yyyy, HH:mm", { locale: it })}
                    </p>
                  </div>
                </div>
              ))}
              {aiActions.length > 10 && (
                <p className="text-xs text-muted-foreground text-center pt-1">
                  +{aiActions.length - 10} azioni precedenti
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
