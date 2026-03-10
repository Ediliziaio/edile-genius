import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyId } from "@/hooks/useCompanyId";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Phone, Plus, Clock, Bot, Globe, Loader2, Pencil, Trash2, PhoneOff } from "lucide-react";

interface PhoneNumber {
  id: string;
  phone_number: string;
  label: string | null;
  status: string | null;
  country_code: string | null;
  provider: string | null;
  agent_id: string | null;
  active_hours_start: string | null;
  active_hours_end: string | null;
  active_days: string[] | null;
  monthly_cost: number | null;
  voicemail_enabled: boolean | null;
  out_of_hours_msg: string | null;
  created_at: string | null;
}

interface Agent { id: string; name: string; }

export default function PhoneNumbers() {
  const companyId = useCompanyId();
  const { toast } = useToast();
  const [numbers, setNumbers] = useState<PhoneNumber[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [agentMap, setAgentMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  // Edit dialog
  const [editing, setEditing] = useState<PhoneNumber | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editAgent, setEditAgent] = useState("");
  const [editStart, setEditStart] = useState("09:00");
  const [editEnd, setEditEnd] = useState("19:00");
  const [editVoicemail, setEditVoicemail] = useState(false);
  const [editOutOfHoursMsg, setEditOutOfHoursMsg] = useState("");
  const [saving, setSaving] = useState(false);

  // Delete
  const [deleting, setDeleting] = useState<PhoneNumber | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const fetchData = useCallback(async () => {
    if (!companyId) return;
    const [numRes, agRes] = await Promise.all([
      supabase.from("ai_phone_numbers").select("*").eq("company_id", companyId).order("created_at", { ascending: false }),
      supabase.from("agents").select("id, name").eq("company_id", companyId),
    ]);
    if (numRes.data) setNumbers(numRes.data as unknown as PhoneNumber[]);
    if (agRes.data) {
      setAgents(agRes.data as Agent[]);
      const map: Record<string, string> = {};
      (agRes.data as Agent[]).forEach(a => { map[a.id] = a.name; });
      setAgentMap(map);
    }
    setLoading(false);
  }, [companyId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openEdit = (num: PhoneNumber) => {
    setEditing(num);
    setEditLabel(num.label || "");
    setEditAgent(num.agent_id || "");
    setEditStart(num.active_hours_start || "09:00");
    setEditEnd(num.active_hours_end || "19:00");
    setEditVoicemail(num.voicemail_enabled || false);
    setEditOutOfHoursMsg(num.out_of_hours_msg || "");
  };

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);
    const { error } = await supabase.from("ai_phone_numbers").update({
      label: editLabel || null,
      agent_id: editAgent || null,
      active_hours_start: editStart,
      active_hours_end: editEnd,
      voicemail_enabled: editVoicemail,
      out_of_hours_msg: editOutOfHoursMsg || null,
    } as any).eq("id", editing.id);
    setSaving(false);
    if (error) {
      toast({ variant: "destructive", title: "Errore", description: error.message });
    } else {
      toast({ title: "Salvato", description: "Numero aggiornato con successo." });
      setEditing(null);
      fetchData();
    }
  };

  const handleToggleStatus = async (num: PhoneNumber) => {
    const newStatus = num.status === "active" ? "inactive" : "active";
    await supabase.from("ai_phone_numbers").update({ status: newStatus } as any).eq("id", num.id);
    toast({ title: newStatus === "active" ? "Numero attivato" : "Numero disattivato" });
    fetchData();
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setDeleteBusy(true);
    await supabase.from("ai_phone_numbers").delete().eq("id", deleting.id);
    setDeleteBusy(false);
    setDeleting(null);
    toast({ title: "Numero eliminato" });
    fetchData();
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">Numeri di Telefono</h1>
          <p className="text-sm text-ink-500 mt-1">Gestisci i numeri assegnati ai tuoi agenti AI</p>
        </div>
        <Button asChild className="bg-brand hover:bg-brand-hover text-white">
          <Link to="/app/phone-numbers/buy"><Plus className="h-4 w-4 mr-2" /> Acquista Numero</Link>
        </Button>
      </div>

      {/* Stats */}
      {numbers.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Numeri totali", value: numbers.length },
            { label: "Attivi", value: numbers.filter(n => n.status === "active").length },
            { label: "Con agente", value: numbers.filter(n => n.agent_id).length },
          ].map(s => (
            <Card key={s.label} className="border border-border">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-ink-900">{s.value}</p>
                <p className="text-xs text-ink-500 mt-1">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {numbers.length === 0 ? (
        <Card className="border-dashed border-2 border-ink-200">
          <CardContent className="p-12 text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-brand-light flex items-center justify-center">
              <Phone className="h-8 w-8 text-brand" />
            </div>
            <h3 className="text-lg font-semibold text-ink-900">Nessun numero configurato</h3>
            <p className="text-sm text-ink-500 max-w-md mx-auto">
              Acquista un numero di telefono per permettere ai tuoi agenti AI di ricevere ed effettuare chiamate.
            </p>
            <Button asChild className="bg-brand hover:bg-brand-hover text-white">
              <Link to="/app/phone-numbers/buy"><Plus className="h-4 w-4 mr-2" /> Acquista il tuo primo numero</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {numbers.map((num) => (
            <Card key={num.id} className="border border-ink-200 shadow-card hover:shadow-hover transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-btn flex items-center justify-center ${num.status === "active" ? "bg-brand-light" : "bg-ink-100"}`}>
                      {num.status === "active" ? <Phone className="h-5 w-5 text-brand" /> : <PhoneOff className="h-5 w-5 text-ink-400" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-base font-semibold text-ink-900 font-mono">{num.phone_number}</p>
                        {num.label && <span className="text-sm text-ink-500">— {num.label}</span>}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-ink-400">
                        <span className="flex items-center gap-1"><Globe className="h-3 w-3" /> {num.country_code || "IT"}</span>
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {num.active_hours_start || "09:00"}-{num.active_hours_end || "19:00"}</span>
                        {num.agent_id ? (
                          <span className="flex items-center gap-1 text-brand"><Bot className="h-3 w-3" /> {agentMap[num.agent_id] || "Agente"}</span>
                        ) : (
                          <span className="text-yellow-600">⚠ Nessun agente</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {num.monthly_cost != null && num.monthly_cost > 0 && (
                      <span className="text-xs font-mono text-ink-500">€{num.monthly_cost}/mese</span>
                    )}
                    <Badge variant={num.status === "active" ? "default" : "secondary"} className={num.status === "active" ? "bg-brand-light text-brand-text border-brand-border" : ""}>
                      {num.status === "active" ? "Attivo" : "Inattivo"}
                    </Badge>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(num)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleting(num)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Modifica Numero</DialogTitle>
            <DialogDescription className="font-mono">{editing?.phone_number}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Etichetta</Label>
              <Input value={editLabel} onChange={e => setEditLabel(e.target.value)} placeholder="es. Ufficio Milano" />
            </div>

            <div className="space-y-1.5">
              <Label>Agente collegato</Label>
              <Select value={editAgent} onValueChange={setEditAgent}>
                <SelectTrigger><SelectValue placeholder="Nessun agente" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nessun agente</SelectItem>
                  {agents.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Orario inizio</Label>
                <Input type="time" value={editStart} onChange={e => setEditStart(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Orario fine</Label>
                <Input type="time" value={editEnd} onChange={e => setEditEnd(e.target.value)} />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label>Segreteria fuori orario</Label>
              <Switch checked={editVoicemail} onCheckedChange={setEditVoicemail} />
            </div>

            {editVoicemail && (
              <div className="space-y-1.5">
                <Label>Messaggio fuori orario</Label>
                <Input value={editOutOfHoursMsg} onChange={e => setEditOutOfHoursMsg(e.target.value)} placeholder="Siamo chiusi, richiamare domani..." />
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-border">
              <Label>Stato</Label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-ink-500">{editing?.status === "active" ? "Attivo" : "Inattivo"}</span>
                <Switch
                  checked={editing?.status === "active"}
                  onCheckedChange={() => editing && handleToggleStatus(editing).then(() => setEditing(null))}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Annulla</Button>
            <Button className="bg-brand hover:bg-brand-hover text-white" onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Salva
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminare questo numero?</AlertDialogTitle>
            <AlertDialogDescription>
              Il numero <strong className="font-mono">{deleting?.phone_number}</strong> verrà rimosso permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleteBusy} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleteBusy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
