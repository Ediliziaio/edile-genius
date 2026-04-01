import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyId } from '@/hooks/useCompanyId';
import type { ModuleSub } from '@/hooks/useCredits';

const MODULE_CONFIG = {
  vocal: {
    icon: '🎙️',
    label: 'AI Vocale',
    description: 'Agenti, chiamate, campagne outbound',
    color: 'text-purple-700 bg-purple-50 border-purple-200',
  },
  render: {
    icon: '🖼️',
    label: 'Render AI',
    description: 'Facciate, bagni, interni, persiane',
    color: 'text-orange-700 bg-orange-50 border-orange-200',
  },
  preventivi: {
    icon: '📄',
    label: 'Preventivi AI',
    description: 'Generazione + firma digitale',
    color: 'text-green-700 bg-green-50 border-green-200',
  },
  automazioni: {
    icon: '⚡',
    label: 'Automazioni',
    description: 'Follow-up, reminder, WhatsApp, n8n',
    color: 'text-blue-700 bg-blue-50 border-blue-200',
  },
} as const;

interface Props {
  module: keyof typeof MODULE_CONFIG;
  sub?: ModuleSub | null;
  balance?: number;
  active?: boolean;
}

export function ModuleCard({ module, sub, balance, active }: Props) {
  const companyId = useCompanyId();
  const cfg = MODULE_CONFIG[module];
  const isActive = sub?.status === 'active' || active || (balance !== undefined && balance > 0);

  const handleActivate = async () => {
    const { data, error } = await supabase.functions.invoke('manage-subscriptions', {
      body: {
        action: 'activate',
        module,
        plan_id: module === 'vocal' ? 'vocal_s' : module,
        company_id: companyId,
      },
    });
    if (!error && data?.url) window.location.href = data.url;
  };

  return (
    <Card className={`border ${isActive ? cfg.color : 'opacity-60'}`}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-2xl">{cfg.icon}</span>
          {isActive
            ? <Badge className="bg-green-100 text-green-700">Attivo</Badge>
            : <Badge variant="outline">Non attivo</Badge>
          }
        </div>
        <div>
          <p className="font-semibold text-sm">{cfg.label}</p>
          <p className="text-xs text-muted-foreground">{cfg.description}</p>
        </div>

        {/* Mostra unità specifiche per modulo */}
        {module === 'vocal' && sub && (
          <p className="text-xs font-mono text-muted-foreground">
            {sub.monthly_units - sub.units_used_month}/{sub.monthly_units} conv./mese
          </p>
        )}
        {module === 'render' && typeof balance === 'number' && (
          <p className="text-xs font-mono text-muted-foreground">
            {balance} render rimanenti
          </p>
        )}

        {!isActive && (
          <Button size="sm" className="w-full" onClick={handleActivate}>
            Attiva →
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
