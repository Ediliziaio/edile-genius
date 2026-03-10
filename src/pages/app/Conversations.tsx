import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyId } from "@/hooks/useCompanyId";
import {
  MessageSquare, Search, Phone, PhoneIncoming, PhoneOutgoing,
  Clock, ThumbsUp, ThumbsDown, Minus, Calendar, Filter, Eye,
  Loader2, Download, Bot, Star,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TranscriptViewer from "@/components/conversations/TranscriptViewer";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import type { Tables } from "@/integrations/supabase/types";

type Conversation = Tables<"conversations">;

const sentimentConfig: Record<string, { icon: typeof ThumbsUp; color: string; label: string }> = {
  positive: { icon: ThumbsUp, color: "text-emerald-600", label: "Positivo" },
  negative: { icon: ThumbsDown, color: "text-red-500", label: "Negativo" },
  neutral: { icon: Minus, color: "text-ink-400", label: "Neutro" },
};

const statusConfig: Record<string, { label: string; className: string }> = {
  completed: { label: "Completata", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  in_progress: { label: "In corso", className: "bg-amber-50 text-amber-700 border-amber-200" },
  failed: { label: "Fallita", className: "bg-red-50 text-red-700 border-red-200" },
  missed: { label: "Persa", className: "bg-ink-100 text-ink-500 border-ink-200" },
};

const outcomeConfig: Record<string, { label: string; className: string }> = {
  qualified: { label: "Qualificato", className: "bg-emerald-50 text-emerald-700" },
  not_interested: { label: "Non interessato", className: "bg-red-50 text-red-600" },
  callback: { label: "Richiamata", className: "bg-amber-50 text-amber-700" },
  appointment: { label: "Appuntamento", className: "bg-brand-light text-brand" },
  voicemail: { label: "Segreteria", className: "bg-ink-100 text-ink-500" },
};

function formatDuration(sec: number | null): string {
  if (!sec) return "—";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export default function ConversationsPage() {
  const companyId = useCompanyId();
  const [search, setSearch] = useState("");
  const [agentFilter, setAgentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sentimentFilter, setSentimentFilter] = useState("all");
  const [directionFilter, setDirectionFilter] = useState("all");
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [showTranscript, setShowTranscript] = useState(false);

  const { data: agents = [] } = useQuery({
    queryKey: ["conv-agents", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data } = await supabase.from("agents").select("id, name").eq("company_id", companyId!);
      return data || [];
    },
  });

  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ["conv-list", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("conversations")
        .select("*")
        .eq("company_id", companyId!)
        .order("started_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return data;
    },
  });

  const agentMap = useMemo(() => Object.fromEntries(agents.map((a) => [a.id, a.name])), [agents]);

  const filtered = useMemo(() => {
    return conversations.filter((c) => {
      if (agentFilter !== "all" && c.agent_id !== agentFilter) return false;
      if (statusFilter !== "all" && c.status !== statusFilter) return false;
      if (sentimentFilter !== "all" && c.sentiment !== sentimentFilter) return false;
      if (directionFilter !== "all" && c.direction !== directionFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const name = agentMap[c.agent_id]?.toLowerCase() || "";
        const num = (c.caller_number || "").toLowerCase();
        const sum = (c.summary || "").toLowerCase();
        if (!name.includes(q) && !num.includes(q) && !sum.includes(q)) return false;
      }
      return true;
    });
  }, [conversations, agentFilter, statusFilter, sentimentFilter, directionFilter, search, agentMap]);

  // Stats
  const totalConv = conversations.length;
  const totalMin = conversations.reduce((s, c) => s + (c.duration_sec || 0), 0) / 60;
  const avgDuration = totalConv > 0 ? conversations.reduce((s, c) => s + (c.duration_sec || 0), 0) / totalConv : 0;
  const qualifiedCount = conversations.filter((c) => c.outcome === "qualified" || c.outcome === "appointment").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">Conversazioni</h1>
          <p className="text-sm text-ink-500 mt-1">Storico completo delle conversazioni con i tuoi agenti AI</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border border-ink-200">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-btn bg-brand-light flex items-center justify-center">
              <MessageSquare className="h-4 w-4 text-brand" />
            </div>
            <div>
              <p className="text-xl font-bold text-ink-900">{totalConv}</p>
              <p className="text-xs text-ink-500">Conversazioni</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-ink-200">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-btn bg-emerald-50 flex items-center justify-center">
              <Clock className="h-4 w-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-ink-900">{totalMin.toFixed(0)}</p>
              <p className="text-xs text-ink-500">Minuti totali</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-ink-200">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-btn bg-amber-50 flex items-center justify-center">
              <Phone className="h-4 w-4 text-amber-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-ink-900">{formatDuration(Math.round(avgDuration))}</p>
              <p className="text-xs text-ink-500">Durata media</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-ink-200">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-btn bg-violet-50 flex items-center justify-center">
              <Star className="h-4 w-4 text-violet-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-ink-900">{qualifiedCount}</p>
              <p className="text-xs text-ink-500">Qualificati</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cerca agente, numero o riassunto..."
            className="pl-9"
          />
        </div>
        <Select value={agentFilter} onValueChange={setAgentFilter}>
          <SelectTrigger className="w-[170px]"><SelectValue placeholder="Agente" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tutti gli agenti</SelectItem>
            {agents.map((a) => (<SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>))}
          </SelectContent>
        </Select>
        <Select value={directionFilter} onValueChange={setDirectionFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Direzione" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tutte</SelectItem>
            <SelectItem value="inbound">In entrata</SelectItem>
            <SelectItem value="outbound">In uscita</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Stato" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tutti</SelectItem>
            <SelectItem value="completed">Completata</SelectItem>
            <SelectItem value="in_progress">In corso</SelectItem>
            <SelectItem value="failed">Fallita</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sentimentFilter} onValueChange={setSentimentFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Sentiment" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tutti</SelectItem>
            <SelectItem value="positive">Positivo</SelectItem>
            <SelectItem value="neutral">Neutro</SelectItem>
            <SelectItem value="negative">Negativo</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border-dashed border-2 border-ink-200">
          <CardContent className="p-12 text-center space-y-3">
            <MessageSquare className="w-12 h-12 mx-auto text-ink-300" />
            <h3 className="text-lg font-semibold text-ink-900">Nessuna conversazione</h3>
            <p className="text-sm text-ink-500">
              {conversations.length === 0
                ? "Le conversazioni appariranno qui quando i tuoi agenti inizieranno a ricevere chiamate."
                : "Prova a modificare i filtri di ricerca."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-card overflow-hidden border border-ink-200 bg-white shadow-card">
          <Table>
            <TableHeader>
              <TableRow className="bg-ink-50 hover:bg-ink-50">
                <TableHead className="text-ink-500 w-8"></TableHead>
                <TableHead className="text-ink-500">Agente</TableHead>
                <TableHead className="text-ink-500">Numero</TableHead>
                <TableHead className="text-ink-500">Durata</TableHead>
                <TableHead className="text-ink-500">Esito</TableHead>
                <TableHead className="text-ink-500">Sentiment</TableHead>
                <TableHead className="text-ink-500">Stato</TableHead>
                <TableHead className="text-ink-500">Data</TableHead>
                <TableHead className="text-ink-500 text-right">Azioni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((conv) => {
                const sentiment = sentimentConfig[conv.sentiment || ""] || null;
                const SentimentIcon = sentiment?.icon;
                const status = statusConfig[conv.status || ""] || { label: conv.status || "—", className: "bg-ink-100 text-ink-500" };
                const outcome = outcomeConfig[conv.outcome || ""] || null;

                return (
                  <TableRow key={conv.id} className="hover:bg-ink-50">
                    <TableCell className="px-3">
                      {conv.direction === "inbound" ? (
                        <PhoneIncoming className="h-3.5 w-3.5 text-emerald-500" />
                      ) : (
                        <PhoneOutgoing className="h-3.5 w-3.5 text-brand" />
                      )}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium text-ink-900">{agentMap[conv.agent_id] || "—"}</p>
                        {conv.summary && (
                          <p className="text-[11px] text-ink-400 truncate max-w-[200px]">{conv.summary}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-ink-500 text-sm font-mono">{conv.caller_number || conv.phone_number || "—"}</TableCell>
                    <TableCell className="text-ink-500 text-sm">{formatDuration(conv.duration_sec)}</TableCell>
                    <TableCell>
                      {outcome ? (
                        <Badge variant="secondary" className={`text-[10px] ${outcome.className}`}>{outcome.label}</Badge>
                      ) : (
                        <span className="text-xs text-ink-400">{conv.outcome || "—"}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {SentimentIcon ? (
                        <div className="flex items-center gap-1">
                          <SentimentIcon className={`h-3.5 w-3.5 ${sentiment!.color}`} />
                          <span className={`text-xs ${sentiment!.color}`}>{sentiment!.label}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-ink-400">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-[10px] ${status.className}`}>{status.label}</Badge>
                    </TableCell>
                    <TableCell className="text-ink-500 text-sm">
                      {conv.started_at ? format(new Date(conv.started_at), "dd MMM HH:mm", { locale: it }) : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSelectedConv(conv)} title="Dettaglio">
                        <Eye className="h-3.5 w-3.5 text-ink-400" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          <div className="px-4 py-2 border-t border-ink-100 bg-ink-50 text-xs text-ink-400">
            {filtered.length} conversazioni su {conversations.length} totali
          </div>
        </div>
      )}

      {/* Detail Panel */}
      <Dialog open={!!selectedConv} onOpenChange={(open) => { if (!open) { setSelectedConv(null); setShowTranscript(false); } }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-ink-900">
              <MessageSquare className="h-4 w-4 text-brand" />
              Dettaglio Conversazione
            </DialogTitle>
          </DialogHeader>

          {selectedConv && (
            <Tabs defaultValue="info" className="flex-1 overflow-hidden flex flex-col">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="info">Informazioni</TabsTrigger>
                <TabsTrigger value="transcript">Trascrizione</TabsTrigger>
              </TabsList>

              <TabsContent value="info" className="flex-1 overflow-y-auto space-y-4 mt-4">
                {/* Summary */}
                {selectedConv.summary && (
                  <div className="bg-ink-50 rounded-btn p-4">
                    <p className="text-xs font-medium text-ink-500 mb-1">Riassunto</p>
                    <p className="text-sm text-ink-900">{selectedConv.summary}</p>
                  </div>
                )}

                {/* Grid info */}
                <div className="grid grid-cols-2 gap-3">
                  <InfoItem label="Agente" value={agentMap[selectedConv.agent_id] || "—"} />
                  <InfoItem label="Direzione" value={selectedConv.direction === "inbound" ? "In entrata" : "In uscita"} />
                  <InfoItem label="Numero" value={selectedConv.caller_number || selectedConv.phone_number || "—"} />
                  <InfoItem label="Durata" value={formatDuration(selectedConv.duration_sec)} />
                  <InfoItem label="Esito" value={selectedConv.outcome || "—"} />
                  <InfoItem label="Sentiment" value={sentimentConfig[selectedConv.sentiment || ""]?.label || "—"} />
                  <InfoItem label="Inizio" value={selectedConv.started_at ? format(new Date(selectedConv.started_at), "dd MMM yyyy HH:mm:ss", { locale: it }) : "—"} />
                  <InfoItem label="Fine" value={selectedConv.ended_at ? format(new Date(selectedConv.ended_at), "HH:mm:ss", { locale: it }) : "—"} />
                  <InfoItem label="Minuti fatturati" value={selectedConv.minutes_billed ? `${Number(selectedConv.minutes_billed).toFixed(2)} min` : "—"} />
                  <InfoItem label="Punteggio eval" value={selectedConv.eval_score != null ? `${Number(selectedConv.eval_score)}/10` : "—"} />
                </div>

                {/* Eval notes */}
                {selectedConv.eval_notes && (
                  <div className="bg-amber-50 rounded-btn p-3">
                    <p className="text-xs font-medium text-amber-700 mb-1">Note valutazione</p>
                    <p className="text-sm text-amber-900">{selectedConv.eval_notes}</p>
                  </div>
                )}

                {/* Collected data */}
                {selectedConv.collected_data && Object.keys(selectedConv.collected_data as Record<string, unknown>).length > 0 && (
                  <div className="bg-ink-50 rounded-btn p-3">
                    <p className="text-xs font-medium text-ink-500 mb-2">Dati raccolti</p>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(selectedConv.collected_data as Record<string, unknown>).map(([k, v]) => (
                        <div key={k} className="text-xs">
                          <span className="text-ink-400">{k}: </span>
                          <span className="text-ink-900 font-medium">{String(v)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Flags */}
                <div className="flex gap-2 flex-wrap">
                  {selectedConv.appointment_created && (
                    <Badge className="bg-brand-light text-brand border-brand-border">📅 Appuntamento creato</Badge>
                  )}
                  {selectedConv.lead_created && (
                    <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">✅ Lead creato</Badge>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="transcript" className="flex-1 overflow-hidden">
                <TranscriptViewer
                  inline
                  transcript={selectedConv.transcript}
                  agentName={agentMap[selectedConv.agent_id]}
                />
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white border border-ink-100 rounded-btn p-3">
      <p className="text-[10px] uppercase tracking-wider text-ink-400 mb-0.5">{label}</p>
      <p className="text-sm font-medium text-ink-900">{value}</p>
    </div>
  );
}
