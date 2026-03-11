import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Phone, PhoneOutgoing } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";

interface Props {
  agentId: string;
  companyId: string;
  outboundEnabled: boolean;
  elAgentId: string | null;
}

export default function AgentOutboundTab({ agentId, companyId, outboundEnabled, elAgentId }: Props) {
  const { toast } = useToast();
  const [enabled, setEnabled] = useState(outboundEnabled);
  const [toNumber, setToNumber] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [calling, setCalling] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [calls, setCalls] = useState<any[]>([]);
  const [loadingCalls, setLoadingCalls] = useState(true);
  const [callPage, setCallPage] = useState(0);
  const CALLS_PER_PAGE = 20;

  const loadCalls = (page = 0) => {
    setLoadingCalls(true);
    supabase.from("outbound_call_log").select("*").eq("agent_id", agentId)
      .order("started_at", { ascending: false })
      .range(page * CALLS_PER_PAGE, (page + 1) * CALLS_PER_PAGE - 1)
      .then(({ data }) => { setCalls(prev => page === 0 ? (data || []) : [...prev, ...(data || [])]); setLoadingCalls(false); });
  };

  useEffect(() => { loadCalls(0); }, [agentId]);

  const toggleOutbound = async () => {
    setToggling(true);
    try {
      await supabase.functions.invoke("update-agent", { body: { id: agentId, outbound_enabled: !enabled } });
      setEnabled(!enabled);
      toast({ title: !enabled ? "Outbound abilitato" : "Outbound disabilitato" });
    } catch { toast({ variant: "destructive", title: "Errore" }); }
    finally { setToggling(false); }
  };

  const validateE164 = (num: string): boolean => /^\+[1-9]\d{6,14}$/.test(num.replace(/\s/g, ""));

  const handleNumberChange = (val: string) => {
    setToNumber(val);
    const clean = val.replace(/\s/g, "");
    if (clean && !validateE164(clean)) {
      setPhoneError("Formato E.164 richiesto (es. +39XXXXXXXXXX)");
    } else {
      setPhoneError("");
    }
  };

  const startCall = async () => {
    const cleanNumber = toNumber.replace(/\s/g, "");
    if (!cleanNumber) return;
    if (!validateE164(cleanNumber)) {
      setPhoneError("Formato E.164 richiesto (es. +39XXXXXXXXXX)");
      return;
    }
    setCalling(true);
    try {
      const { data, error } = await supabase.functions.invoke("elevenlabs-outbound-call", {
        body: { agent_id: agentId, to_number: cleanNumber },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({ title: "Chiamata avviata!", description: `Chiamata a ${cleanNumber} in corso...` });
      setToNumber("");
      setPhoneError("");
      // Refresh calls after short delay for DB propagation
      await new Promise(r => setTimeout(r, 1000));
      loadCalls(0);
      setCallPage(0);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Errore", description: err.message });
    } finally { setCalling(false); }
  };

  const statusColor = (s: string) => {
    if (s === "completed") return "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300";
    if (s === "failed") return "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300";
    if (s === "in_progress") return "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300";
    return "bg-muted text-muted-foreground";
  };

  return (
    <div className="space-y-6">
      {/* Toggle */}
      <Card className="border border-border bg-card shadow-card">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Chiamate in uscita (Outbound)</h3>
              <p className="text-xs text-muted-foreground mt-1">Abilita l'agente ad avviare chiamate verso numeri esterni tramite ElevenLabs + Twilio.</p>
            </div>
            <Switch checked={enabled} onCheckedChange={toggleOutbound} disabled={toggling} />
          </div>
        </CardContent>
      </Card>

      {enabled && (
        <>
          {/* Call form */}
          <Card className="border border-border bg-card shadow-card">
            <CardContent className="p-5 space-y-4">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <PhoneOutgoing className="w-4 h-4" /> Avvia chiamata
              </h3>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Numero da chiamare</Label>
                <div className="flex gap-2">
                  <Input value={toNumber} onChange={e => setToNumber(e.target.value)} placeholder="+39 02 XXXX XXXX" className="font-mono flex-1" />
                  <Button onClick={startCall} disabled={calling || !toNumber || !elAgentId} className="bg-brand hover:bg-brand/90 text-white">
                    {calling ? <Loader2 className="h-4 w-4 animate-spin" /> : <Phone className="h-4 w-4 mr-1" />}
                    Chiama
                  </Button>
                </div>
                {!elAgentId && <p className="text-[10px] text-destructive">L'agente non ha un ID ElevenLabs associato.</p>}
              </div>
            </CardContent>
          </Card>

          {/* Call log */}
          <Card className="border border-border bg-card shadow-card">
            <CardContent className="p-5 space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Ultime chiamate</h3>
              {loadingCalls ? (
                <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
              ) : calls.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Nessuna chiamata outbound registrata.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow><TableHead>Data</TableHead><TableHead>Numero</TableHead><TableHead>Stato</TableHead><TableHead>Durata</TableHead></TableRow>
                  </TableHeader>
                  <TableBody>
                    {calls.map(c => (
                      <TableRow key={c.id}>
                        <TableCell className="text-sm">{c.started_at ? format(new Date(c.started_at), "dd MMM HH:mm", { locale: it }) : "—"}</TableCell>
                        <TableCell className="text-sm font-mono">{c.to_number}</TableCell>
                        <TableCell><Badge className={`text-xs ${statusColor(c.status)}`}>{c.status}</Badge></TableCell>
                        <TableCell className="text-sm">{c.duration_sec ? `${Math.floor(c.duration_sec / 60)}:${String(c.duration_sec % 60).padStart(2, "0")}` : "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
