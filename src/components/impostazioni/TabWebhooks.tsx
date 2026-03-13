import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyId } from '@/hooks/useCompanyId';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Trash2, Send, Globe, History, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

interface Webhook { id: string; url: string; secret: string | null; events: string[]; is_active: boolean; created_at: string; }
interface WebhookLog { id: string; event_type: string; status_code: number | null; success: boolean; created_at: string; }

const EVENT_TYPES = [
  { value: 'conversation.created', label: 'Nuova conversazione' },
  { value: 'appointment.set', label: 'Appuntamento fissato' },
  { value: 'campaign.completed', label: 'Campagna completata' },
  { value: 'contact.created', label: 'Nuovo contatto' },
  { value: 'agent.status_changed', label: 'Stato agente cambiato' },
];

export function TabWebhooks() {
  const companyId = useCompanyId();
  const { toast } = useToast();

  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [loadingWebhooks, setLoadingWebhooks] = useState(false);
  const [showCreateWh, setShowCreateWh] = useState(false);
  const [whForm, setWhForm] = useState({ url: '', secret: '', events: [] as string[] });
  const [savingWh, setSavingWh] = useState(false);
  const [testingWh, setTestingWh] = useState<string | null>(null);
  const [showLogs, setShowLogs] = useState<string | null>(null);
  const [whLogs, setWhLogs] = useState<WebhookLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  const loadWebhooks = async () => {
    if (!companyId) return;
    setLoadingWebhooks(true);
    const { data } = await supabase.from('webhooks').select('id, url, secret, events, is_active, created_at').eq('company_id', companyId).order('created_at', { ascending: false });
    setWebhooks((data as Webhook[]) || []);
    setLoadingWebhooks(false);
  };

  useEffect(() => { loadWebhooks(); }, [companyId]);

  const createWebhook = async () => {
    if (!companyId || !whForm.url || whForm.events.length === 0) return;
    try { new URL(whForm.url); } catch { toast({ title: 'URL non valido', variant: 'destructive' }); return; }
    setSavingWh(true);
    const { error } = await supabase.from('webhooks').insert({ company_id: companyId, url: whForm.url, secret: whForm.secret || null, events: whForm.events, is_active: true });
    setSavingWh(false);
    if (error) { toast({ title: 'Errore', description: error.message, variant: 'destructive' }); }
    else { toast({ title: 'Webhook creato' }); setShowCreateWh(false); setWhForm({ url: '', secret: '', events: [] }); loadWebhooks(); }
  };

  const toggleWebhook = async (id: string, active: boolean) => { await supabase.from('webhooks').update({ is_active: active }).eq('id', id); loadWebhooks(); };
  const deleteWebhook = async (id: string) => { await supabase.from('webhooks').delete().eq('id', id); loadWebhooks(); toast({ title: 'Webhook eliminato' }); };

  const testWebhook = async (wh: Webhook) => {
    if (!companyId) return;
    setTestingWh(wh.id);
    try {
      const { error } = await supabase.functions.invoke('dispatch-webhook', { body: { company_id: companyId, event_type: 'test.ping', payload: { message: 'Test', timestamp: new Date().toISOString() } } });
      if (error) throw error;
      toast({ title: 'Test inviato' });
    } catch (err: any) { toast({ title: 'Errore test', description: err.message, variant: 'destructive' }); }
    setTestingWh(null);
  };

  const openLogs = async (webhookId: string) => {
    setShowLogs(webhookId); setLoadingLogs(true);
    const { data } = await supabase.from('webhook_logs').select('id, event_type, status_code, success, created_at').eq('webhook_id', webhookId).order('created_at', { ascending: false }).limit(50);
    setWhLogs((data as WebhookLog[]) || []); setLoadingLogs(false);
  };

  const toggleEvent = (event: string) => { setWhForm(prev => ({ ...prev, events: prev.events.includes(event) ? prev.events.filter(e => e !== event) : [...prev.events, event] })); };

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="flex items-center justify-between">
        <div><h2 className="text-lg font-semibold text-foreground">Webhooks</h2><p className="text-sm text-muted-foreground">Ricevi notifiche in tempo reale su endpoint esterni</p></div>
        <Button onClick={() => setShowCreateWh(true)}><Plus className="h-4 w-4 mr-2" /> Nuovo webhook</Button>
      </div>

      {loadingWebhooks ? <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      : webhooks.length === 0 ? (
        <Card><CardContent className="p-8 text-center"><Globe className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" /><p className="text-muted-foreground">Nessun webhook configurato</p></CardContent></Card>
      ) : (
        <div className="space-y-3">
          {webhooks.map(wh => (
            <Card key={wh.id}><CardContent className="p-4 flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1"><code className="text-sm font-mono text-foreground truncate block">{wh.url}</code><Badge variant={wh.is_active ? 'default' : 'secondary'} className="text-xs shrink-0">{wh.is_active ? 'Attivo' : 'Disattivo'}</Badge></div>
                <div className="flex flex-wrap gap-1 mt-2">{wh.events.map(ev => <Badge key={ev} variant="outline" className="text-xs">{EVENT_TYPES.find(e => e.value === ev)?.label || ev}</Badge>)}</div>
                {wh.secret && <p className="text-xs text-muted-foreground mt-1">🔐 Firma HMAC attiva</p>}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Switch checked={wh.is_active} onCheckedChange={v => toggleWebhook(wh.id, v)} />
                <Button variant="ghost" size="icon" onClick={() => testWebhook(wh)} disabled={testingWh === wh.id}>{testingWh === wh.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}</Button>
                <Button variant="ghost" size="icon" onClick={() => openLogs(wh.id)}><History className="h-4 w-4" /></Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Eliminare questo webhook?</AlertDialogTitle>
                      <AlertDialogDescription>Il webhook {wh.url} verrà eliminato definitivamente. Questa azione non può essere annullata.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annulla</AlertDialogCancel>
                      <AlertDialogAction onClick={() => deleteWebhook(wh.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Elimina</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent></Card>
          ))}
        </div>
      )}

      {/* Create Webhook Dialog */}
      <Dialog open={showCreateWh} onOpenChange={setShowCreateWh}><DialogContent><DialogHeader><DialogTitle>Nuovo Webhook</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2"><Label>URL Endpoint</Label><Input value={whForm.url} onChange={e => setWhForm(p => ({ ...p, url: e.target.value }))} placeholder="https://example.com/webhook" /></div>
          <div className="space-y-2"><Label>Secret (opzionale)</Label><Input value={whForm.secret} onChange={e => setWhForm(p => ({ ...p, secret: e.target.value }))} placeholder="Chiave segreta per firma HMAC" /><p className="text-xs text-muted-foreground">Se fornito, ogni richiesta includerà X-Webhook-Signature.</p></div>
          <div className="space-y-2"><Label>Eventi</Label><div className="space-y-2">{EVENT_TYPES.map(ev => <label key={ev.value} className="flex items-center gap-2 cursor-pointer"><Checkbox checked={whForm.events.includes(ev.value)} onCheckedChange={() => toggleEvent(ev.value)} /><span className="text-sm">{ev.label}</span><span className="text-xs text-muted-foreground font-mono">{ev.value}</span></label>)}</div></div>
          <Button onClick={createWebhook} disabled={savingWh || !whForm.url || whForm.events.length === 0} className="w-full">{savingWh ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}Crea Webhook</Button>
        </div>
      </DialogContent></Dialog>

      {/* Logs Dialog */}
      <Dialog open={!!showLogs} onOpenChange={() => setShowLogs(null)}><DialogContent className="max-w-lg"><DialogHeader><DialogTitle>Log Consegne</DialogTitle></DialogHeader>
        {loadingLogs ? <div className="flex justify-center py-6"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        : whLogs.length === 0 ? <p className="text-center text-muted-foreground py-6">Nessun log</p>
        : <div className="max-h-80 overflow-y-auto space-y-2">{whLogs.map(log => <div key={log.id} className="flex items-center justify-between text-sm border-b border-border pb-2"><div className="flex items-center gap-2"><span className={`w-2 h-2 rounded-full ${log.success ? 'bg-green-500' : 'bg-red-500'}`} /><span className="font-mono text-xs text-muted-foreground">{log.event_type}</span></div><div className="flex items-center gap-3 text-muted-foreground text-xs">{log.status_code && <span>HTTP {log.status_code}</span>}<span>{format(new Date(log.created_at), 'dd/MM HH:mm', { locale: it })}</span></div></div>)}</div>}
      </DialogContent></Dialog>
    </div>
  );
}
