import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyId } from '@/hooks/useCompanyId';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, Lock, Zap, Calendar, TrendingUp } from 'lucide-react';

const CATEGORIE = [
  { id: 'render', label: 'Render AI', color: 'text-blue-600', bg: 'bg-blue-50' },
  { id: 'preventivi', label: 'Preventivi', color: 'text-green-600', bg: 'bg-green-50' },
  { id: 'agenti_ai', label: 'Agenti AI', color: 'text-purple-600', bg: 'bg-purple-50' },
  { id: 'automazioni', label: 'Automazioni', color: 'text-orange-600', bg: 'bg-orange-50' },
  { id: 'crm', label: 'CRM', color: 'text-cyan-600', bg: 'bg-cyan-50' },
];

export function TabPiano() {
  const companyId = useCompanyId();

  const { data: company } = useQuery({
    queryKey: ['company-plan', companyId],
    queryFn: async () => {
      const { data } = await supabase.from('companies').select('plan').eq('id', companyId!).single();
      return data;
    },
    enabled: !!companyId,
  });

  const { data: tutteFeatures = [] } = useQuery({
    queryKey: ['piattaforma-features'],
    queryFn: async () => {
      const { data } = await (supabase as any).from('piattaforma_features').select('*');
      return data || [];
    },
  });

  const { data: featuresSbloccate = [] } = useQuery({
    queryKey: ['azienda-features', companyId],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from('azienda_features_sbloccate')
        .select('*, piattaforma_features(*)')
        .eq('company_id', companyId!)
        .eq('attivo', true);
      return data || [];
    },
    enabled: !!companyId,
  });

  const { data: usageMensile = {} as Record<string, number> } = useQuery({
    queryKey: ['azienda-usage-mensile', companyId],
    queryFn: async () => {
      const start = new Date();
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      const { data } = await (supabase as any)
        .from('user_feature_usage')
        .select('feature_id')
        .eq('company_id', companyId!)
        .gte('usato_il', start.toISOString());
      const counts: Record<string, number> = {};
      for (const r of (data || [])) counts[r.feature_id] = (counts[r.feature_id] || 0) + 1;
      return counts;
    },
    enabled: !!companyId,
  });

  const sbloccateIds = new Set(featuresSbloccate.map((f: any) => f.feature_id));
  const totalSbloccate = sbloccateIds.size;
  const totalDisponibili = tutteFeatures.length;
  const pctSbloccate = totalDisponibili > 0 ? Math.round((totalSbloccate / totalDisponibili) * 100) : 0;

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Piano & Funzionalità</h2>
        <p className="text-sm text-muted-foreground">Funzionalità AI attive nel tuo piano. Per sbloccare nuovi strumenti contatta il supporto.</p>
      </div>

      {/* Hero card */}
      <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Piano attuale</p>
              <p className="text-2xl font-bold text-foreground capitalize">{company?.plan || 'Pro'}</p>
            </div>
            <Badge className="text-sm">{totalSbloccate} / {totalDisponibili} funzionalità attive</Badge>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Funzionalità sbloccate</span>
              <span>{pctSbloccate}%</span>
            </div>
            <Progress value={pctSbloccate} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Features by category */}
      {CATEGORIE.map(cat => {
        const catFeatures = tutteFeatures.filter((f: any) => f.categoria === cat.id);
        if (catFeatures.length === 0) return null;
        const catSbloccate = catFeatures.filter((f: any) => sbloccateIds.has(f.id));

        return (
          <div key={cat.id}>
            <div className="flex items-center gap-2 mb-3">
              <span className={`text-sm font-semibold ${cat.color}`}>{cat.label}</span>
              <Badge variant="outline" className="text-xs">{catSbloccate.length}/{catFeatures.length}</Badge>
            </div>
            <div className="grid gap-2">
              {catFeatures.map((feature: any) => {
                const sbloccata = featuresSbloccate.find((f: any) => f.feature_id === feature.id);
                const isActive = !!sbloccata;
                const usato = (usageMensile as Record<string, number>)[feature.id] || 0;
                const limite = sbloccata?.limite_mensile;

                return (
                  <Card key={feature.id} className={`${isActive ? '' : 'opacity-50'}`}>
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{feature.icona}</span>
                        <div>
                          <p className="text-sm font-medium text-foreground">{feature.nome}</p>
                          <p className="text-xs text-muted-foreground">{feature.descrizione}</p>
                          {feature.crediti_per_uso > 0 && (
                            <span className="text-xs text-muted-foreground">{feature.crediti_per_uso} credito/uso</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {isActive && limite && (
                          <div className="text-right">
                            <span className="text-xs text-muted-foreground">{usato}/{limite}</span>
                            <Progress value={(usato / limite) * 100} className="h-1 w-16" />
                          </div>
                        )}
                        {isActive ? (
                          <div className="flex items-center gap-1 text-primary">
                            <CheckCircle className="w-4 h-4" />
                            <span className="text-xs font-medium">Attiva</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Lock className="w-4 h-4" />
                            <span className="text-xs">Non attiva</span>
                          </div>
                        )}
                        {sbloccata?.scade_il && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            <span>Scade {new Date(sbloccata.scade_il).toLocaleDateString('it-IT')}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Upgrade CTA */}
      <Card className="border-dashed">
        <CardContent className="p-8 text-center">
          <Zap className="w-8 h-8 text-primary mx-auto mb-2" />
          <p className="font-semibold text-foreground">Vuoi sbloccare altre funzionalità?</p>
          <p className="text-sm text-muted-foreground mt-1">Contatta il nostro team per un piano personalizzato</p>
          <Button variant="outline" className="mt-4 gap-2">
            <TrendingUp className="w-4 h-4" /> Parla con noi
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
