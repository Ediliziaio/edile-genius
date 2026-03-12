import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyId } from "@/hooks/useCompanyId";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, CheckCircle2, XCircle, Play, RotateCcw, Eye, EyeOff, RefreshCw, Zap } from "lucide-react";
import { toast } from "sonner";

const TRIGGER_EVENTS = [
  { value: "nuovo_cantiere", label: "Nuovo cantiere" },
  { value: "preventivo_approvato", label: "Preventivo approvato" },
  { value: "documento_scadenza", label: "Documento in scadenza" },
  { value: "mancato_report", label: "Mancato report" },
  { value: "sal_aggiornato", label: "SAL aggiornato" },
  { value: "nuovo_contatto", label: "Nuovo contatto CRM" },
];

function statusBadge(status: string) {
  switch (status) {
    case "pending": return <Badge variant="secondary">In attesa</Badge>;
    case "running": return <Badge className="bg-blue-500 text-white animate-pulse">In esecuzione</Badge>;
    case "completed": return <Badge className="bg-green-600 text-white">Completato</Badge>;
    case "failed": return <Badge variant="destructive">Fallito</Badge>;
    case "cancelled": return <Badge variant="outline">Annullato</Badge>;
    default: return <Badge variant="secondary">{status}</Badge>;
  }
}

export default function N8nIntegrationTab() {
  const companyId = useCompanyId();
  const queryClient = useQueryClient();
  const [n8nUrl, setN8nUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [selectedExec, setSelectedExec] = useState<any>(null);
  const [manualWorkflowId, setManualWorkflowId] = useState("");
  const [manualData, setManualData] = useState("{}");

  // Platform config status
  const { data: configStatus, isLoading: configLoading } = useQuery({
    queryKey: ["n8n-config-status"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("manage-n8n-config", {
        body: { action: "get_status" },
      });
      if (error) throw error;
      return data?.config;
    },
  });

  useEffect(() => {
    if (configStatus?.n8n_base_url) setN8nUrl(configStatus.n8n_base_url);
  }, [configStatus]);

  // Executions
  const { data: executions, isLoading: execLoading } = useQuery({
    queryKey: ["n8n-executions", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data } = await supabase
        .from("n8n_executions")
        .select("*")
        .eq("company_id", companyId!)
        .order("triggered_at", { ascending: false })
        .limit(20);
      return data ?? [];
    },
  });

  // Workflows
  const { data: workflows } = useQuery({
    queryKey: ["n8n-workflows", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data } = await supabase
        .from("n8n_workflows")
        .select("*")
        .eq("company_id", companyId!)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  // Realtime subscription for executions
  useEffect(() => {
    if (!companyId) return;
    const channel = supabase
      .channel("n8n-exec-realtime")
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "n8n_executions",
        filter: `company_id=eq.${companyId}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ["n8n-executions", companyId] });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [companyId, queryClient]);

  // Test connection
  const testMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("manage-n8n-config", {
        body: { action: "test_connection", base_url: n8nUrl, api_key: apiKey || undefined },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      toast.success(`Connessione riuscita! ${data.workflows_count} workflow trovati.`);
      queryClient.invalidateQueries({ queryKey: ["n8n-config-status"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // Save config
  const saveMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("manage-n8n-config", {
        body: { action: "save_config", base_url: n8nUrl, api_key: apiKey || undefined },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      toast.success("Configurazione n8n salvata!");
      setApiKey("");
      queryClient.invalidateQueries({ queryKey: ["n8n-config-status"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // Trigger workflow
  const triggerMutation = useMutation({
    mutationFn: async () => {
      let parsedData = {};
      try { parsedData = JSON.parse(manualData); } catch { throw new Error("JSON non valido"); }
      const { data, error } = await supabase.functions.invoke("n8n-trigger-webhook", {
        body: { workflow_id: manualWorkflowId, trigger_data: parsedData },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      toast.success(`Workflow triggerato! Execution: ${data.execution_id?.substring(0, 8)}...`);
      queryClient.invalidateQueries({ queryKey: ["n8n-executions", companyId] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // Update workflow trigger event
  const updateTriggerMutation = useMutation({
    mutationFn: async ({ workflowDbId, event }: { workflowDbId: string; event: string }) => {
      const { error } = await supabase
        .from("n8n_workflows")
        .update({ trigger_event: event || null })
        .eq("id", workflowDbId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Evento trigger aggiornato");
      queryClient.invalidateQueries({ queryKey: ["n8n-workflows", companyId] });
    },
  });

  const isConnected = configStatus?.n8n_configured && configStatus?.n8n_api_key_set;

  return (
    <div className="space-y-6">
      {/* CONFIG SECTION */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Configurazione n8n</CardTitle>
              <CardDescription>Connetti la tua istanza n8n per automazioni avanzate</CardDescription>
            </div>
            {configLoading ? (
              <Loader2 className="animate-spin text-muted-foreground" size={20} />
            ) : isConnected ? (
              <Badge className="bg-green-600 text-white gap-1"><CheckCircle2 size={12} /> Connesso</Badge>
            ) : (
              <Badge variant="destructive" className="gap-1"><XCircle size={12} /> Non connesso</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">URL istanza n8n</label>
              <Input
                placeholder="https://n8n.mia-azienda.com"
                value={n8nUrl}
                onChange={(e) => setN8nUrl(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">API Key</label>
              <div className="flex gap-2">
                <Input
                  type={showKey ? "text" : "password"}
                  placeholder={configStatus?.n8n_api_key_set ? "••••••••••• (già impostata)" : "Inserisci API key"}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                />
                <Button variant="ghost" size="icon" onClick={() => setShowKey(!showKey)}>
                  {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                </Button>
              </div>
            </div>
          </div>
          {configStatus?.n8n_tested_at && (
            <p className="text-xs text-muted-foreground">
              Ultimo test: {new Date(configStatus.n8n_tested_at).toLocaleString("it-IT")}
              {configStatus.n8n_workflows_count != null && ` — ${configStatus.n8n_workflows_count} workflow`}
            </p>
          )}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => testMutation.mutate()}
              disabled={!n8nUrl || testMutation.isPending}
            >
              {testMutation.isPending ? <Loader2 className="animate-spin mr-2" size={14} /> : <RefreshCw size={14} className="mr-2" />}
              Testa connessione
            </Button>
            <Button
              size="sm"
              onClick={() => saveMutation.mutate()}
              disabled={!n8nUrl || saveMutation.isPending}
            >
              {saveMutation.isPending && <Loader2 className="animate-spin mr-2" size={14} />}
              Salva configurazione
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* WORKFLOWS SECTION */}
      {workflows && workflows.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Workflow Registrati</CardTitle>
            <CardDescription>Associa eventi Edile Genius ai workflow n8n</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Workflow ID</TableHead>
                  <TableHead>Evento Trigger</TableHead>
                  <TableHead>Stato</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {workflows.map((wf: any) => (
                  <TableRow key={wf.id}>
                    <TableCell className="font-medium">{wf.name}</TableCell>
                    <TableCell className="text-xs font-mono text-muted-foreground">{wf.workflow_id}</TableCell>
                    <TableCell>
                      <Select
                        value={wf.trigger_event || ""}
                        onValueChange={(val) => updateTriggerMutation.mutate({ workflowDbId: wf.id, event: val })}
                      >
                        <SelectTrigger className="w-[200px] h-8 text-xs">
                          <SelectValue placeholder="Seleziona evento..." />
                        </SelectTrigger>
                        <SelectContent>
                          {TRIGGER_EVENTS.map((ev) => (
                            <SelectItem key={ev.value} value={ev.value}>{ev.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      {wf.is_active ? (
                        <Badge className="bg-green-600 text-white text-[10px]">Attivo</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[10px]">Inattivo</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* EXECUTIONS SECTION */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Esecuzioni Recenti</CardTitle>
          <CardDescription>Ultime 20 esecuzioni di workflow n8n</CardDescription>
        </CardHeader>
        <CardContent>
          {execLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="animate-spin text-muted-foreground" /></div>
          ) : !executions || executions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8 text-sm">Nessuna esecuzione trovata</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Workflow</TableHead>
                  <TableHead>Stato</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Durata</TableHead>
                  <TableHead className="text-right">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {executions.map((exec: any) => {
                  const duration = exec.completed_at && exec.triggered_at
                    ? Math.round((new Date(exec.completed_at).getTime() - new Date(exec.triggered_at).getTime()) / 1000)
                    : null;
                  return (
                    <TableRow
                      key={exec.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setSelectedExec(exec)}
                    >
                      <TableCell className="font-mono text-xs">{exec.workflow_id}</TableCell>
                      <TableCell>{statusBadge(exec.status)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(exec.triggered_at).toLocaleString("it-IT")}
                      </TableCell>
                      <TableCell className="text-xs">
                        {duration != null ? `${duration}s` : exec.status === "running" ? "..." : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        {exec.status === "failed" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setManualWorkflowId(exec.workflow_id);
                              setManualData(JSON.stringify(exec.trigger_data || {}, null, 2));
                              triggerMutation.mutate();
                            }}
                          >
                            <RotateCcw size={14} />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* MANUAL TRIGGER SECTION */}
      {isConnected && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap size={18} /> Trigger Manuale
            </CardTitle>
            <CardDescription>Esegui un workflow n8n manualmente con dati custom</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Workflow ID</label>
              <Input
                placeholder="es: report-cantiere-serale"
                value={manualWorkflowId}
                onChange={(e) => setManualWorkflowId(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Dati (JSON)</label>
              <Textarea
                className="font-mono text-xs min-h-[100px]"
                placeholder='{"cantiere_id": "...", "action": "genera_report"}'
                value={manualData}
                onChange={(e) => setManualData(e.target.value)}
              />
            </div>
            <Button
              onClick={() => triggerMutation.mutate()}
              disabled={!manualWorkflowId || triggerMutation.isPending}
            >
              {triggerMutation.isPending ? <Loader2 className="animate-spin mr-2" size={14} /> : <Play size={14} className="mr-2" />}
              Esegui ora
            </Button>
          </CardContent>
        </Card>
      )}

      {/* EXECUTION DETAIL DIALOG */}
      <Dialog open={!!selectedExec} onOpenChange={() => setSelectedExec(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Dettaglio Esecuzione</DialogTitle>
          </DialogHeader>
          {selectedExec && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-muted-foreground">Workflow:</span> <span className="font-mono">{selectedExec.workflow_id}</span></div>
                <div><span className="text-muted-foreground">Stato:</span> {statusBadge(selectedExec.status)}</div>
                <div><span className="text-muted-foreground">Triggerato:</span> {new Date(selectedExec.triggered_at).toLocaleString("it-IT")}</div>
                {selectedExec.completed_at && (
                  <div><span className="text-muted-foreground">Completato:</span> {new Date(selectedExec.completed_at).toLocaleString("it-IT")}</div>
                )}
                {selectedExec.n8n_execution_id && (
                  <div><span className="text-muted-foreground">n8n ID:</span> <span className="font-mono text-xs">{selectedExec.n8n_execution_id}</span></div>
                )}
              </div>
              {selectedExec.error_message && (
                <div>
                  <p className="text-sm font-medium text-destructive mb-1">Errore:</p>
                  <pre className="bg-destructive/10 text-destructive text-xs p-3 rounded overflow-auto">{selectedExec.error_message}</pre>
                </div>
              )}
              {selectedExec.trigger_data && Object.keys(selectedExec.trigger_data).length > 0 && (
                <div>
                  <p className="text-sm font-medium text-foreground mb-1">Trigger Data:</p>
                  <pre className="bg-muted text-foreground text-xs p-3 rounded overflow-auto max-h-[200px]">
                    {JSON.stringify(selectedExec.trigger_data, null, 2)}
                  </pre>
                </div>
              )}
              {selectedExec.output_data && (
                <div>
                  <p className="text-sm font-medium text-foreground mb-1">Output Data:</p>
                  <pre className="bg-muted text-foreground text-xs p-3 rounded overflow-auto max-h-[200px]">
                    {JSON.stringify(selectedExec.output_data, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
