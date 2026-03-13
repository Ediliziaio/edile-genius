import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyId } from '@/hooks/useCompanyId';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Eye, EyeOff, Save, Loader2, CheckCircle2, RefreshCw, Link2, Unlink, Download,
} from 'lucide-react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

interface CrmIntegration {
  id: string; provider: string; is_active: boolean; status: string;
  last_sync_at: string | null; last_sync_status: string | null;
  last_sync_count: number; instance_url: string | null;
}

const CRM_PROVIDERS = [
  { id: 'hubspot', name: 'HubSpot', icon: '🟠', color: 'bg-orange-500/10 border-orange-500/20', desc: 'Importa contatti dal tuo CRM HubSpot', fields: [{ key: 'api_key', label: 'API Key (Private App Token)', placeholder: 'pat-xx-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx' }] },
  { id: 'salesforce', name: 'Salesforce', icon: '☁️', color: 'bg-blue-500/10 border-blue-500/20', desc: 'Importa contatti dalla tua org Salesforce', fields: [{ key: 'api_key', label: 'Access Token', placeholder: '00Dxx0000001gPL!AR...' }, { key: 'instance_url', label: 'Instance URL', placeholder: 'https://yourorg.my.salesforce.com' }] },
  { id: 'pipedrive', name: 'Pipedrive', icon: '🟢', color: 'bg-green-500/10 border-green-500/20', desc: 'Importa persone dal tuo account Pipedrive', fields: [{ key: 'api_key', label: 'API Token', placeholder: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx' }] },
];

export function TabApi() {
  const companyId = useCompanyId();
  const { toast } = useToast();

  const [testing, setTesting] = useState(false);
  const [crmIntegrations, setCrmIntegrations] = useState<CrmIntegration[]>([]);
  const [crmConfigOpen, setCrmConfigOpen] = useState<string | null>(null);
  const [crmApiKey, setCrmApiKey] = useState('');
  const [crmInstanceUrl, setCrmInstanceUrl] = useState('');
  const [crmShowKey, setCrmShowKey] = useState(false);
  const [crmSaving, setCrmSaving] = useState(false);
  const [crmTesting, setCrmTesting] = useState<string | null>(null);
  const [crmSyncing, setCrmSyncing] = useState<string | null>(null);

  const loadCrmIntegrations = useCallback(async () => {
    if (!companyId) return;
    const { data } = await supabase.from('company_integrations').select('id, provider, is_active, status, last_sync_at, last_sync_status, last_sync_count, instance_url').eq('company_id', companyId);
    setCrmIntegrations((data as CrmIntegration[]) || []);
  }, [companyId]);

  useEffect(() => { loadCrmIntegrations(); }, [loadCrmIntegrations]);

  const testConnection = async () => {
    if (!companyId) return;
    setTesting(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-elevenlabs-voices', { body: { company_id: companyId } });
      if (error) throw error;
      toast({ title: 'Connessione riuscita', description: `${data?.voices?.length || 0} voci trovate.` });
    } catch (err: any) { toast({ title: 'Connessione fallita', description: err.message || 'Errore sconosciuto', variant: 'destructive' }); }
    setTesting(false);
  };

  const testCrmConnection = async (provider: string) => {
    if (!companyId) return; setCrmTesting(provider);
    try {
      const { data, error } = await supabase.functions.invoke('crm-sync', { body: { action: 'test_connection', provider, api_key: crmApiKey, instance_url: crmInstanceUrl || undefined, company_id: companyId } });
      if (error || data?.error) { toast({ variant: 'destructive', title: 'Test fallito', description: data?.error || error?.message }); }
      else { toast({ title: 'Connessione riuscita', description: `${data.contacts_count} contatti trovati` }); }
    } catch (err: any) { toast({ variant: 'destructive', title: 'Errore', description: err.message }); }
    finally { setCrmTesting(null); }
  };

  const saveCrmIntegration = async (provider: string) => {
    if (!companyId || !crmApiKey) return; setCrmSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke('crm-sync', { body: { action: 'save_integration', provider, api_key: crmApiKey, instance_url: crmInstanceUrl || undefined, company_id: companyId } });
      if (error || data?.error) { toast({ variant: 'destructive', title: 'Errore', description: data?.error || error?.message }); }
      else { toast({ title: 'Integrazione salvata' }); setCrmConfigOpen(null); setCrmApiKey(''); setCrmInstanceUrl(''); await loadCrmIntegrations(); }
    } finally { setCrmSaving(false); }
  };

  const disconnectCrm = async (provider: string) => {
    if (!companyId) return;
    const { error } = await supabase.functions.invoke('crm-sync', { body: { action: 'disconnect', provider, company_id: companyId } });
    if (error) { toast({ variant: 'destructive', title: 'Errore', description: error.message }); }
    else { toast({ title: 'Integrazione disconnessa' }); await loadCrmIntegrations(); }
  };

  const syncCrmContacts = async (provider: string) => {
    if (!companyId) return; setCrmSyncing(provider);
    try {
      const { data, error } = await supabase.functions.invoke('crm-sync', { body: { action: 'sync_contacts', provider, company_id: companyId } });
      if (error || data?.error) { toast({ variant: 'destructive', title: 'Sync fallito', description: data?.error || error?.message }); }
      else { toast({ title: 'Sync completato', description: `${data.imported} importati, ${data.skipped} saltati` }); await loadCrmIntegrations(); }
    } catch (err: any) { toast({ variant: 'destructive', title: 'Errore sync', description: err.message }); }
    finally { setCrmSyncing(null); }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div><h2 className="text-lg font-semibold text-foreground">API & Integrazioni</h2><p className="text-sm text-muted-foreground">Chiavi API e connessioni esterne</p></div>

      {/* ElevenLabs */}
      <Card><CardContent className="p-6 space-y-4">
        <h3 className="text-base font-semibold text-foreground">Configurazione API</h3>
        <div className="flex items-start gap-3 p-4 rounded-lg bg-primary/5 border border-primary/10">
          <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
          <div><p className="text-sm font-medium text-foreground">ElevenLabs API — Gestita centralmente</p><p className="text-sm text-muted-foreground mt-1">La chiave è configurata a livello di piattaforma.</p></div>
        </div>
        <Button variant="outline" onClick={testConnection} disabled={testing}>
          {testing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}Testa connessione
        </Button>
      </CardContent></Card>

      {/* CRM */}
      <div><h3 className="text-base font-semibold text-foreground">Integrazioni CRM</h3><p className="text-sm text-muted-foreground">Connetti il tuo CRM per importare contatti</p></div>
      <div className="space-y-3">
        {CRM_PROVIDERS.map(crm => {
          const integration = crmIntegrations.find(i => i.provider === crm.id);
          const isConnected = integration?.is_active && integration?.status === 'connected';
          return (
            <Card key={crm.id} className={isConnected ? crm.color : ''}>
              <CardContent className="p-5 flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{crm.icon}</span>
                  <div>
                    <div className="flex items-center gap-2"><h4 className="font-semibold text-foreground">{crm.name}</h4>
                      <Badge variant={isConnected ? 'default' : 'secondary'} className="text-xs">{isConnected ? 'Connesso' : 'Non connesso'}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">{crm.desc}</p>
                    {isConnected && integration?.last_sync_at && <p className="text-xs text-muted-foreground mt-1">Ultimo sync: {format(new Date(integration.last_sync_at), 'dd/MM/yyyy HH:mm', { locale: it })}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {isConnected ? (
                    <>
                      <Button size="sm" variant="outline" onClick={() => syncCrmContacts(crm.id)} disabled={crmSyncing === crm.id}>
                        {crmSyncing === crm.id ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Download className="h-4 w-4 mr-1" />}Sync
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => disconnectCrm(crm.id)} className="text-destructive"><Unlink className="h-4 w-4 mr-1" /> Disconnetti</Button>
                    </>
                  ) : (
                    <Button size="sm" onClick={() => { setCrmConfigOpen(crm.id); setCrmApiKey(''); setCrmInstanceUrl(''); setCrmShowKey(false); }}>
                      <Link2 className="h-4 w-4 mr-1" /> Connetti
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* CRM Config Dialog */}
      <Dialog open={!!crmConfigOpen} onOpenChange={open => { if (!open) setCrmConfigOpen(null); }}>
        <DialogContent><DialogHeader><DialogTitle className="flex items-center gap-2"><span className="text-xl">{CRM_PROVIDERS.find(p => p.id === crmConfigOpen)?.icon}</span>Configura {CRM_PROVIDERS.find(p => p.id === crmConfigOpen)?.name}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {CRM_PROVIDERS.find(p => p.id === crmConfigOpen)?.fields.map(field => (
              <div key={field.key} className="space-y-2"><Label>{field.label}</Label>
                {field.key === 'api_key' ? (
                  <div className="relative"><Input type={crmShowKey ? 'text' : 'password'} value={crmApiKey} onChange={e => setCrmApiKey(e.target.value)} placeholder={field.placeholder} className="pr-10" />
                    <button type="button" onClick={() => setCrmShowKey(!crmShowKey)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">{crmShowKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
                  </div>
                ) : <Input value={crmInstanceUrl} onChange={e => setCrmInstanceUrl(e.target.value)} placeholder={field.placeholder} />}
              </div>
            ))}
            <Separator />
            <div className="flex gap-3">
              <Button onClick={() => crmConfigOpen && testCrmConnection(crmConfigOpen)} disabled={!crmApiKey || crmTesting === crmConfigOpen} variant="outline">
                {crmTesting === crmConfigOpen ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}Testa
              </Button>
              <Button onClick={() => crmConfigOpen && saveCrmIntegration(crmConfigOpen)} disabled={!crmApiKey || crmSaving} className="flex-1">
                {crmSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}Salva e Connetti
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
