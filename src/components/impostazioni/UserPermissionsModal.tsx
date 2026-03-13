import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAziendaSettings } from '@/hooks/useAziendaSettings';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { AlertTriangle, Save, Loader2 } from 'lucide-react';

interface Props {
  userId: string;
  companyId: string;
  onClose: () => void;
}

const CATEGORIE_ORDER = ['render', 'preventivi', 'agenti_ai', 'automazioni', 'crm'];
const CATEGORIE_LABELS: Record<string, string> = {
  render: 'Render AI', preventivi: 'Preventivi', agenti_ai: 'Agenti AI',
  automazioni: 'Automazioni', crm: 'CRM',
};

export function UserPermissionsModal({ userId, companyId, onClose }: Props) {
  const { aggiornaPermesso, featuresAzienda } = useAziendaSettings(companyId);

  const { data: permessiUtente = [] } = useQuery({
    queryKey: ['user-permissions', companyId, userId],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from('user_feature_permissions')
        .select('*')
        .eq('company_id', companyId)
        .eq('user_id', userId);
      return data || [];
    },
  });

  const { data: usageMensile = {} as Record<string, number> } = useQuery({
    queryKey: ['user-usage', companyId, userId],
    queryFn: async () => {
      const start = new Date();
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      const { data } = await (supabase as any)
        .from('user_feature_usage')
        .select('feature_id')
        .eq('user_id', userId)
        .eq('company_id', companyId)
        .gte('usato_il', start.toISOString());
      const counts: Record<string, number> = {};
      for (const r of (data || [])) counts[r.feature_id] = (counts[r.feature_id] || 0) + 1;
      return counts;
    },
  });

  const { data: utente } = useQuery({
    queryKey: ['utente-info', userId],
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
      return data;
    },
  });

  type PermState = { abilitato: boolean; limiteMensile: string; limiteGiornaliero: string };
  const [localPerms, setLocalPerms] = useState<Record<string, PermState>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const init: Record<string, PermState> = {};
    for (const f of featuresAzienda) {
      const perm = permessiUtente.find((p: any) => p.feature_id === (f as any).feature_id);
      init[(f as any).feature_id] = {
        abilitato: perm ? perm.abilitato : true,
        limiteMensile: perm?.limite_mensile?.toString() || '',
        limiteGiornaliero: perm?.limite_giornaliero?.toString() || '',
      };
    }
    setLocalPerms(init);
  }, [featuresAzienda, permessiUtente]);

  const handleSave = async () => {
    setSaving(true);
    for (const featureId of Object.keys(localPerms)) {
      const p = localPerms[featureId];
      await aggiornaPermesso.mutateAsync({
        userId, featureId, abilitato: p.abilitato,
        limiteMensile: p.limiteMensile ? parseInt(p.limiteMensile) : null,
        limiteGiornaliero: p.limiteGiornaliero ? parseInt(p.limiteGiornaliero) : null,
      });
    }
    setSaving(false);
    onClose();
  };

  const email = utente?.email || '—';
  const nome = utente?.full_name || email;

  const featuresByCategoria = CATEGORIE_ORDER.reduce((acc, cat) => {
    acc[cat] = featuresAzienda.filter((f: any) => f.piattaforma_features?.categoria === cat);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Permessi utente</DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-3 mb-4">
          <Avatar className="w-10 h-10">
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {nome.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-foreground">{nome}</p>
            <p className="text-xs text-muted-foreground">{email}</p>
          </div>
          <Badge className="ml-auto">
            {Object.values(localPerms).filter(p => p.abilitato).length} funzioni attive
          </Badge>
        </div>

        <div className="flex items-start gap-2 p-3 rounded-lg bg-muted text-sm text-muted-foreground mb-4">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>L'utente può accedere solo agli strumenti che il tuo piano ha sbloccato. I limiti che imposti si aggiungono a quelli del piano aziendale.</span>
        </div>

        <div className="space-y-6">
          {CATEGORIE_ORDER.map(cat => {
            const features = featuresByCategoria[cat] || [];
            if (features.length === 0) return null;

            return (
              <div key={cat}>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  {CATEGORIE_LABELS[cat]}
                </p>
                <div className="space-y-2">
                  {features.map((f: any) => {
                    const fId = f.feature_id;
                    const perm = localPerms[fId];
                    if (!perm) return null;
                    const usato = (usageMensile as Record<string, number>)[fId] || 0;
                    const limite = perm.limiteMensile ? parseInt(perm.limiteMensile) : null;

                    return (
                      <div key={fId} className="flex items-center gap-4 p-3 rounded-lg border border-border">
                        <span className="text-lg">{f.piattaforma_features?.icona}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground">{f.piattaforma_features?.nome}</p>
                          {limite && (
                            <div className="flex items-center gap-2 mt-1">
                              <Progress value={(usato / limite) * 100} className="h-1 w-20" />
                              <span className="text-xs text-muted-foreground">{usato}/{limite}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <Input
                            placeholder="Mese"
                            value={perm.limiteMensile}
                            onChange={e => setLocalPerms(p => ({ ...p, [fId]: { ...p[fId], limiteMensile: e.target.value } }))}
                            className="w-16 h-8 text-xs text-center"
                            type="number"
                          />
                          <Input
                            placeholder="Giorno"
                            value={perm.limiteGiornaliero}
                            onChange={e => setLocalPerms(p => ({ ...p, [fId]: { ...p[fId], limiteGiornaliero: e.target.value } }))}
                            className="w-16 h-8 text-xs text-center"
                            type="number"
                          />
                          <Switch
                            checked={perm.abilitato}
                            onCheckedChange={v => setLocalPerms(p => ({ ...p, [fId]: { ...p[fId], abilitato: v } }))}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-end mt-4">
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Salva permessi
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
