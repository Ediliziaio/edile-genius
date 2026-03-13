import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyId } from '@/hooks/useCompanyId';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Plus, FileText, BookOpen, Layout, Sparkles,
  TrendingUp, Send, CheckCircle, ArrowRight, FileSignature
} from 'lucide-react';

type TabType = 'overview' | 'knowledge-base' | 'template';

// Lazy-import the embedded pages
import KnowledgeBasePreventivo from './KnowledgeBasePreventivo';
import PreventivoTemplateList from './PreventivoTemplateList';

const STATO_COLORS: Record<string, string> = {
  bozza:      'bg-muted text-muted-foreground',
  completato: 'bg-blue-100 text-blue-700',
  inviato:    'bg-amber-100 text-amber-700',
  accettato:  'bg-green-100 text-green-700',
  scaduto:    'bg-destructive/10 text-destructive',
};

export default function PreventivoHub() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const companyId = useCompanyId();
  const [activeTab, setActiveTab] = useState<TabType>(
    (searchParams.get('tab') as TabType) || 'overview'
  );

  const { data: stats } = useQuery({
    queryKey: ['preventivo-hub-stats', companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data: preventivi } = await supabase
        .from('preventivi' as any)
        .select('id, stato, totale_lordo')
        .eq('company_id', companyId!);
      const { data: kbDocs } = await supabase
        .from('preventivo_kb_documenti' as any)
        .select('id, stato')
        .eq('company_id', companyId!);
      const items = (preventivi || []) as any[];
      const docs = (kbDocs || []) as any[];
      return {
        totale: items.length,
        bozze: items.filter(p => p.stato === 'bozza').length,
        inviati: items.filter(p => p.stato === 'inviato').length,
        accettati: items.filter(p => p.stato === 'accettato').length,
        valoreAccettato: items
          .filter(p => p.stato === 'accettato')
          .reduce((acc: number, p: any) => acc + (p.totale_lordo || 0), 0),
        kbDocs: docs.filter(d => d.stato === 'indicizzato').length,
      };
    },
  });

  const { data: ultimiPreventivi = [] } = useQuery({
    queryKey: ['ultimi-preventivi', companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data } = await supabase
        .from('preventivi' as any)
        .select('id, numero_preventivo, cliente_nome, totale_lordo, stato, created_at')
        .eq('company_id', companyId!)
        .order('created_at', { ascending: false })
        .limit(5);
      return (data || []) as any[];
    },
  });

  return (
    <div className="space-y-6 p-6 max-w-6xl mx-auto">
      {/* Hero */}
      <div className="rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <FileSignature className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Generatore Preventivi AI</h1>
              <p className="text-sm text-muted-foreground">
                Crea offerte personalizzate in pochi minuti con l'intelligenza artificiale
              </p>
            </div>
          </div>
          <Button onClick={() => navigate('/app/preventivi/nuovo')} className="gap-2" size="lg">
            <Plus className="h-4 w-4" />
            Nuovo preventivo
          </Button>
        </div>

        {/* KPIs */}
        {stats && stats.totale > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
            {[
              { label: 'Totali', value: stats.totale },
              { label: 'Inviati', value: stats.inviati },
              { label: 'Accettati', value: stats.accettati },
              {
                label: 'Valore accettato',
                value: stats.valoreAccettato > 0
                  ? `€${(stats.valoreAccettato / 1000).toFixed(1)}k`
                  : '—',
              },
            ].map(kpi => (
              <div key={kpi.label} className="rounded-xl bg-background/60 border border-border p-3 text-center">
                <p className="text-xl font-bold text-foreground">{kpi.value}</p>
                <p className="text-xs text-muted-foreground">{kpi.label}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Onboarding — only when no preventivi */}
      {stats?.totale === 0 && (
        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold mb-4">Come funziona</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { n: '1', icon: BookOpen,  title: 'Carica la KB',     desc: "Carica presentazione aziendale e schede prodotto. L'AI le indicizza." },
              { n: '2', icon: Layout,    title: 'Imposta template', desc: 'Definisci la sequenza delle sezioni e lo stile del documento.' },
              { n: '3', icon: Sparkles,  title: 'Genera con AI',    desc: "L'AI genera testi personalizzati usando la tua knowledge base." },
              { n: '4', icon: Send,      title: 'Invia al cliente', desc: 'Assembla il PDF brandizzato e invialo direttamente via email.' },
            ].map(step => (
              <div key={step.n} className="flex flex-col items-center text-center gap-2 p-4 rounded-xl border border-border bg-muted/30">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <step.icon className="h-5 w-5 text-primary" />
                </div>
                <p className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">Step {step.n}</p>
                <p className="text-sm font-semibold">{step.title}</p>
                <p className="text-xs text-muted-foreground">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={v => setActiveTab(v as TabType)}>
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger value="overview" className="gap-2">
            <TrendingUp className="h-4 w-4" /> Panoramica
          </TabsTrigger>
          <TabsTrigger value="knowledge-base" className="gap-2">
            <BookOpen className="h-4 w-4" /> Knowledge Base
            {stats?.kbDocs !== undefined && stats.kbDocs > 0 && (
              <Badge variant="secondary" className="ml-1 text-[10px] px-1.5">{stats.kbDocs}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="template" className="gap-2">
            <Layout className="h-4 w-4" /> Template
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6 mt-4">
          {/* Recent preventivi */}
          <div className="rounded-xl border border-border bg-card">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="text-sm font-semibold">Preventivi recenti</h3>
              <Button variant="ghost" size="sm" onClick={() => navigate('/app/preventivi')} className="gap-1 text-primary">
                Vedi tutti <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
            <div className="divide-y divide-border">
              {ultimiPreventivi.map((p: any) => (
                <div
                  key={p.id}
                  onClick={() => navigate(`/app/preventivi/nuovo?id=${p.id}`)}
                  className="flex items-center gap-4 p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                >
                  <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{p.numero_preventivo || 'Bozza'}</p>
                    <p className="text-xs text-muted-foreground">{p.cliente_nome || '—'}</p>
                  </div>
                  <Badge className={`text-[10px] ${STATO_COLORS[p.stato] || ''}`}>
                    {p.stato}
                  </Badge>
                  {p.totale_lordo != null && (
                    <span className="text-sm font-semibold text-foreground">
                      € {Number(p.totale_lordo).toLocaleString('it-IT')}
                    </span>
                  )}
                </div>
              ))}
              {ultimiPreventivi.length === 0 && (
                <div className="p-8 text-center">
                  <p className="text-sm text-muted-foreground">Nessun preventivo ancora</p>
                  <Button onClick={() => navigate('/app/preventivi/nuovo')} className="mt-3 gap-2" size="sm">
                    <Plus className="h-3.5 w-3.5" /> Crea il primo preventivo
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Quick actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              {
                icon: Plus, title: 'Nuovo preventivo', desc: 'Wizard guidato in 6 step',
                action: () => navigate('/app/preventivi/nuovo'),
              },
              {
                icon: BookOpen, title: 'Knowledge Base',
                desc: stats?.kbDocs ? `${stats.kbDocs} documenti indicizzati` : 'Carica presentazioni e schede prodotto',
                action: () => setActiveTab('knowledge-base'),
              },
              {
                icon: Layout, title: 'Template',
                desc: 'Personalizza la struttura del documento',
                action: () => setActiveTab('template'),
              },
            ].map(card => (
              <button
                key={card.title}
                onClick={card.action}
                className="group flex flex-col items-start gap-2 rounded-xl border border-border bg-card p-4 text-left hover:bg-muted/50 transition-colors"
              >
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <card.icon className="h-4.5 w-4.5 text-primary" />
                </div>
                <p className="text-sm font-semibold">{card.title}</p>
                <p className="text-xs text-muted-foreground">{card.desc}</p>
              </button>
            ))}
          </div>
        </TabsContent>

        {/* KB Tab */}
        <TabsContent value="knowledge-base" className="mt-0">
          <KnowledgeBasePreventivo />
        </TabsContent>

        {/* Template Tab */}
        <TabsContent value="template" className="mt-0">
          <PreventivoTemplateList />
        </TabsContent>
      </Tabs>
    </div>
  );
}
