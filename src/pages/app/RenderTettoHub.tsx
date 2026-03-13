import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Plus, Home, Wand2, Layers, Sun, Droplets } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { RenderTettoResultCard } from '@/modules/render-tetto/components/RenderTettoResultCard';
import type { ConfigurazioneTetto } from '@/modules/render-tetto/types';

// ─── Costanti ─────────────────────────────────────────────────────────────────

const HOW_IT_WORKS = [
  { step: '01', icon: '📸', title: 'Carica la foto del tetto', desc: "Foto da drone, strada o cantiere — l'AI riconosce il tipo di copertura automaticamente" },
  { step: '02', icon: '🎨', title: 'Scegli manto e finiture', desc: 'Tegole, lamiera, ardesia, guaina, fotovoltaico — 12 materiali con 4+ colori per tipo' },
  { step: '03', icon: '☀️', title: 'Aggiungi lucernari', desc: 'Inserisci lucernari piatti, Velux o abbaini nella posizione desiderata' },
  { step: '04', icon: '✨', title: 'Genera in 30 secondi', desc: 'Gemini 2.5 Flash applica le modifiche con fisica dei materiali realistica' },
];

const MANTO_HIGHLIGHTS = [
  { emoji: '🟤', nome: 'Tegole coppo', desc: 'Classico mediterraneo' },
  { emoji: '🟠', nome: 'Marsigliesi', desc: 'Stile toscano' },
  { emoji: '🪨', nome: 'Ardesia naturale', desc: 'Elegante e durevole' },
  { emoji: '▧', nome: 'Lamiera aggraffata', desc: 'Moderno e impermeabile' },
  { emoji: '⬜', nome: 'Guaina TPO', desc: 'Tetti piani, bianca' },
  { emoji: '☀️', nome: 'Fotovoltaico', desc: 'Integrazione solare' },
];

const CASI_USO = [
  { emoji: '🏠', title: 'Ristrutturazione', desc: 'Mostra al cliente le opzioni prima di iniziare i lavori' },
  { emoji: '🏗️', title: 'Progettazione', desc: 'Testa diversi materiali senza rendering 3D costosi' },
  { emoji: '📊', title: 'Preventivo', desc: 'Accompagna il preventivo con visualizzazioni realistiche' },
  { emoji: '🌿', title: 'Retrofit solare', desc: "Visualizza l'integrazione fotovoltaica sul tetto esistente" },
];

// ─── Componente principale ────────────────────────────────────────────────────

export default function RenderTettoHub() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'gallery' | 'info'>('gallery');

  const { data: sessions, isLoading } = useQuery({
    queryKey: ['render_tetto_sessions'],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('render_tetto_sessions' as any)
        .select('id, result_url, original_url, config_json, session_note, created_at')
        .not('result_url', 'is', null)
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data || []) as unknown as Array<{
        id: string;
        result_url: string;
        original_url?: string;
        config_json?: ConfigurazioneTetto;
        session_note?: string;
        created_at?: string;
      }>;
    },
  });

  return (
    <div className="space-y-0">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/60">
        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(circle_at_30%_50%,hsl(var(--primary)),transparent_70%)]" />

        <div className="relative px-6 py-10 md:px-10 md:py-14">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-4 max-w-xl">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-100 border border-amber-200">
                  <Home className="w-6 h-6 text-amber-600" />
                </div>
                <Badge variant="secondary" className="bg-amber-100 text-amber-700 border-amber-200">
                  AI Render
                </Badge>
              </div>

              <h1 className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight">
                Render Tetto
              </h1>

              <p className="text-muted-foreground leading-relaxed">
                Sostituisci visivamente il manto di copertura, cambia i colori,
                aggiungi lucernari. Risultato fotografico in 30 secondi.
              </p>

              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="bg-white/70 gap-1.5">
                  <Layers className="w-3 h-3" /> 12 tipi di manto
                </Badge>
                <Badge variant="outline" className="bg-white/70 gap-1.5">
                  <Sun className="w-3 h-3" /> Lucernari AI
                </Badge>
                <Badge variant="outline" className="bg-white/70 gap-1.5">
                  <Droplets className="w-3 h-3" /> Gronde e pluviali
                </Badge>
              </div>
            </div>

            <Button size="lg" onClick={() => navigate('/app/render-tetto/new')} className="gap-2 self-start">
              <Wand2 className="w-5 h-5" />
              Nuovo render tetto
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <div className="flex gap-6 px-1">
          {(['gallery', 'info'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-3.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-amber-500 text-amber-600'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab === 'gallery' ? `I miei render (${sessions?.length || 0})` : 'Come funziona'}
            </button>
          ))}
        </div>
      </div>

      <div className="py-6">
        {/* Gallery Tab */}
        {activeTab === 'gallery' && (
          <>
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="aspect-video rounded-xl bg-muted animate-pulse" />
                ))}
              </div>
            ) : sessions && sessions.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Card nuovo render */}
                <Link
                  to="/app/render-tetto/new"
                  className="flex flex-col items-center justify-center gap-3 aspect-video rounded-xl border-2 border-dashed border-amber-300 bg-amber-50/50 hover:bg-amber-100/50 transition-colors"
                >
                  <div className="p-3 rounded-full bg-amber-100">
                    <Plus className="w-6 h-6 text-amber-600" />
                  </div>
                  <span className="text-sm font-medium text-amber-700">Nuovo render</span>
                </Link>

                {sessions.map(session => (
                  <RenderTettoResultCard
                    key={session.id}
                    id={session.id}
                    resultUrl={session.result_url}
                    originalUrl={session.original_url}
                    titoloSessione={session.session_note}
                    configJson={session.config_json}
                    createdAt={session.created_at}
                    onClick={() => navigate(`/app/render-tetto/new?session=${session.id}`)}
                  />
                ))}
              </div>
            ) : (
              <EmptyState />
            )}
          </>
        )}

        {/* Info Tab */}
        {activeTab === 'info' && (
          <div className="space-y-10">
            {/* Come funziona */}
            <section>
              <h2 className="text-lg font-bold text-foreground mb-4">Come funziona</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {HOW_IT_WORKS.map((step) => (
                  <div key={step.step} className="rounded-xl border border-border bg-card p-5 space-y-2">
                    <span className="text-3xl">{step.icon}</span>
                    <p className="text-[10px] font-mono font-semibold text-muted-foreground">STEP {step.step}</p>
                    <p className="text-sm font-semibold text-foreground">{step.title}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{step.desc}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Materiali */}
            <section>
              <h2 className="text-lg font-bold text-foreground mb-4">Materiali disponibili</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {MANTO_HIGHLIGHTS.map((m) => (
                  <div key={m.nome} className="text-center rounded-xl border border-border bg-card p-4 space-y-1">
                    <span className="text-2xl">{m.emoji}</span>
                    <p className="text-xs font-semibold text-foreground">{m.nome}</p>
                    <p className="text-[10px] text-muted-foreground">{m.desc}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Casi d'uso */}
            <section>
              <h2 className="text-lg font-bold text-foreground mb-4">Per chi è utile</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {CASI_USO.map((caso) => (
                  <div key={caso.title} className="flex items-start gap-3 rounded-xl border border-border bg-card p-4">
                    <span className="text-2xl shrink-0">{caso.emoji}</span>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{caso.title}</p>
                      <p className="text-xs text-muted-foreground">{caso.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* CTA */}
            <section className="text-center py-6 space-y-3">
              <h3 className="text-lg font-bold text-foreground">Pronto a trasformare il tuo tetto?</h3>
              <p className="text-sm text-muted-foreground">Carica una foto e ottieni il risultato in meno di un minuto</p>
              <Button size="lg" onClick={() => navigate('/app/render-tetto/new')} className="gap-2">
                <Wand2 className="w-5 h-5" />
                Inizia ora — è gratuito
              </Button>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 space-y-4 text-center">
      <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200">
        <Home className="w-10 h-10 text-amber-500" />
      </div>
      <h3 className="text-base font-semibold text-foreground">Nessun render ancora</h3>
      <p className="text-sm text-muted-foreground max-w-sm">
        Carica la foto di un tetto e l'AI applicherà il materiale scelto in modo realistico
      </p>
      <Button asChild className="gap-2">
        <Link to="/app/render-tetto/new">
          <Wand2 className="w-4 h-4" />
          Crea il tuo primo render tetto
        </Link>
      </Button>
    </div>
  );
}
