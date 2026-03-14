import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Wand2, Plus, Sparkles, Info, Images,
  Paintbrush, LayoutGrid, Sofa, Layers, Lightbulb,
  Wallpaper, BookOpen, Home, UtensilsCrossed, Bath,
  Loader2,
} from 'lucide-react';
import { RenderStanzaResultCard } from '@/modules/render-stanza/components/RenderStanzaResultCard';
import { VirtualGalleryGrid } from "@/components/ui/VirtualGalleryGrid";

// ─── COSTANTI ────────────────────────────────────────────────────────────────

const TIPO_STANZA_INFO = [
  { emoji: '🛋️', label: 'Soggiorno', desc: 'Divani, pareti, pavimento, illuminazione' },
  { emoji: '🍳', label: 'Cucina', desc: 'Frontali, piano lavoro, maniglie, rivestimenti' },
  { emoji: '🛏️', label: 'Camera da letto', desc: 'Colori, arredo, tende, illuminazione' },
  { emoji: '🚿', label: 'Bagno', desc: 'Piastrelle, sanitari, rubinetteria, specchi' },
  { emoji: '💻', label: 'Studio / Ufficio', desc: 'Pareti, pavimento, illuminazione, arredo' },
  { emoji: '🍽️', label: 'Sala da pranzo', desc: 'Colori, mobili, illuminazione' },
];

const INTERVENTI_LIST = [
  { icon: Paintbrush, label: 'Verniciatura pareti', desc: 'Colori RAL, finiture, pareti accent', color: 'bg-violet-50 text-violet-700 border-violet-200' },
  { icon: LayoutGrid, label: 'Pavimento', desc: 'Parquet, ceramica, marmo, gres e altro', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { icon: Sofa, label: 'Arredo', desc: 'Restyling colore, stile o arredo completo', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { icon: Layers, label: 'Soffitto', desc: 'Piano, controsoffitto, travi, boiserie', color: 'bg-slate-50 text-slate-700 border-slate-200' },
  { icon: Lightbulb, label: 'Illuminazione', desc: 'Tipo fixture, temperatura, intensità', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  { icon: Wallpaper, label: 'Carta da parati', desc: 'Geometrica, botanica, floreale, righe…', color: 'bg-pink-50 text-pink-700 border-pink-200' },
  { icon: BookOpen, label: 'Rivestimento pareti', desc: 'Boiserie, mattone, pietra, pannelli 3D', color: 'bg-stone-50 text-stone-700 border-stone-200' },
  { icon: Home, label: 'Tende', desc: 'Aggiungi, cambia o rimuovi i tendaggi', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { icon: UtensilsCrossed, label: 'Restyling cucina', desc: 'Frontali, piano lavoro, maniglie', color: 'bg-orange-50 text-orange-700 border-orange-200' },
  { icon: Bath, label: 'Restyling bagno', desc: 'Piastrelle, sanitari, rubinetteria', color: 'bg-teal-50 text-teal-700 border-teal-200' },
];

const HOW_IT_WORKS = [
  { step: '01', title: 'Scatta o carica una foto', desc: 'Una foto frontale della stanza, con buona luce. Qualsiasi smartphone va bene.', icon: '📷', color: 'bg-violet-50' },
  { step: '02', title: "L'AI analizza la stanza", desc: 'Rileva pareti, pavimento, arredo, illuminazione e caratteristiche speciali come travi o camino.', icon: '🔍', color: 'bg-blue-50' },
  { step: '03', title: 'Scegli cosa cambiare', desc: 'Attiva uno o più interventi tra i 10 disponibili e configura colori, materiali, stili.', icon: '⚙️', color: 'bg-amber-50' },
  { step: '04', title: 'Visualizza la trasformazione', desc: 'Il render AI applica tutti gli interventi contemporaneamente. Confronta prima/dopo in un click.', icon: '✨', color: 'bg-green-50' },
];

// ─── COMPONENTE ───────────────────────────────────────────────────────────────

export default function RenderStanzaHub() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('info');

  const {
    data: gallery,
    isLoading: galleryLoading,
    refetch: refetchGallery,
  } = useQuery({
    queryKey: ['render_stanza_gallery', user?.id],
    queryFn: async () => {
      try {
        const { data, error } = await (supabase
          .from('render_stanza_gallery' as any)
          .select('*')
          .eq('user_id', user!.id)
          .order('created_at', { ascending: false })
          .limit(200) as any);
        if (error) return [];
        return (data || []) as any[];
      } catch {
        return [];
      }
    },
    enabled: !!user && activeTab === 'galleria',
    staleTime: 2 * 60 * 1000,
  });

  const handleToggleFavorite = async (item: any) => {
    await (supabase
      .from('render_stanza_gallery' as any)
      .update({ is_favorite: !item.is_favorite } as any)
      .eq('id', item.id) as any);
    refetchGallery();
  };

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-violet-700 to-purple-800 p-6 md:p-10">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-4 right-8 w-64 h-64 rounded-full bg-white/20 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-violet-300/30 blur-2xl" />
        </div>
        <div className="relative flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="flex-1 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-white/20 backdrop-blur-sm">
                <Wand2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white">Render Stanza Completo</h1>
                <p className="text-violet-200 text-sm">Il modulo più potente della suite</p>
              </div>
            </div>
            <p className="text-violet-100 text-sm md:text-base max-w-xl">
              Trasforma qualsiasi stanza con fino a 10 interventi simultanei:
              pareti, pavimento, arredo, illuminazione, tende e molto altro.
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-white/20 text-white border-white/30 text-xs">10 tipi di intervento</Badge>
              <Badge className="bg-white/20 text-white border-white/30 text-xs">Analisi AI avanzata</Badge>
              <Badge className="bg-white/20 text-white border-white/30 text-xs">Stili pronti inclusi</Badge>
              <Badge className="bg-white/20 text-white border-white/30 text-xs">Before/After istantaneo</Badge>
            </div>
          </div>
          <Button
            onClick={() => navigate('/app/render-stanza/new')}
            size="lg"
            className="bg-white text-violet-700 hover:bg-violet-50 font-semibold shadow-lg flex-shrink-0"
          >
            <Plus className="mr-2 h-4 w-4" />
            Nuova stanza
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full max-w-md">
          <TabsTrigger value="info" className="flex-1 gap-1.5">
            <Info className="h-4 w-4" />
            Come funziona
          </TabsTrigger>
          <TabsTrigger value="galleria" className="flex-1 gap-1.5">
            <Images className="h-4 w-4" />
            La mia galleria
          </TabsTrigger>
        </TabsList>

        {/* ── TAB INFO ── */}
        <TabsContent value="info" className="space-y-10 mt-6">
          {/* Come funziona */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-foreground">Come funziona</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {HOW_IT_WORKS.map((s) => (
                <Card key={s.step} className="border-border">
                  <CardContent className="p-5 text-center space-y-2">
                    <span className="text-3xl">{s.icon}</span>
                    <p className="text-xs font-bold text-muted-foreground">{s.step}</p>
                    <p className="font-semibold text-foreground text-sm">{s.title}</p>
                    <p className="text-xs text-muted-foreground">{s.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* 10 interventi */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-foreground">10 interventi disponibili</h2>
            <p className="text-sm text-muted-foreground">
              Puoi attivarli tutti contemporaneamente — il risultato include tutte le modifiche in un unico render.
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {INTERVENTI_LIST.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="flex items-start gap-3 p-3 rounded-xl border border-border bg-card">
                    <div className={`p-2 rounded-lg ${item.color} flex-shrink-0`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Stanze supportate */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-foreground">Stanze supportate</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {TIPO_STANZA_INFO.map((t) => (
                <Card key={t.label} className="border-border">
                  <CardContent className="p-4 text-center space-y-1">
                    <span className="text-2xl">{t.emoji}</span>
                    <p className="text-sm font-semibold text-foreground">{t.label}</p>
                    <p className="text-[10px] text-muted-foreground">{t.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* CTA bottom */}
          <div className="rounded-2xl bg-gradient-to-r from-violet-600 to-purple-700 p-8 text-center space-y-4">
            <Sparkles className="h-8 w-8 text-white mx-auto" />
            <h3 className="text-xl font-bold text-white">Pronto a trasformare la tua stanza?</h3>
            <p className="text-violet-200 text-sm max-w-md mx-auto">
              Carica una foto, scegli gli interventi, e in 30 secondi vedi la tua stanza rinnovata.
            </p>
            <Button
              onClick={() => navigate('/app/render-stanza/new')}
              className="bg-white text-violet-700 hover:bg-violet-50 font-semibold px-8"
            >
              <Wand2 className="mr-2 h-4 w-4" />
              Inizia ora
            </Button>
          </div>
        </TabsContent>

        {/* ── TAB GALLERIA ── */}
        <TabsContent value="galleria" className="mt-6">
          {galleryLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
            </div>
          ) : !gallery || gallery.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="p-4 rounded-full bg-violet-50">
                <Images className="h-10 w-10 text-violet-400" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Nessun render ancora</h3>
              <p className="text-sm text-muted-foreground text-center max-w-sm">
                Carica la prima foto e trasforma la tua stanza!
              </p>
              <Button
                onClick={() => navigate('/app/render-stanza/new')}
                className="bg-violet-600 hover:bg-violet-700 text-white"
              >
                <Wand2 className="mr-2 h-4 w-4" />
                Crea il primo render
              </Button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <Badge variant="secondary" className="text-xs">
                  {gallery.length} render
                </Badge>
                <Button
                  onClick={() => navigate('/app/render-stanza/new')}
                  size="sm"
                  className="bg-violet-600 hover:bg-violet-700 text-white"
                >
                  <Plus className="mr-1 h-3.5 w-3.5" />
                  Nuovo
                </Button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {gallery.map((item: any) => (
                  <RenderStanzaResultCard
                    key={item.id}
                    originalUrl={item.original_image_url || item.result_image_url}
                    resultUrl={item.result_image_url}
                    tipoStanza={item.tipo_stanza}
                    interventiEseguiti={item.interventi || []}
                    createdAt={item.created_at}
                    isFavorite={item.is_favorite}
                    onToggleFavorite={() => handleToggleFavorite(item)}
                  />
                ))}
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
