import { useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Search, Info, CheckCircle, Zap } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

/* ── Category config (per risultato, non per canale) ── */

interface Category {
  key: string;
  label: string;
  emoji: string;
  stripColor: string;
  iconBg: string;
}

const CATEGORIES: Category[] = [
  { key: "all", label: "Tutti", emoji: "", stripColor: "", iconBg: "" },
  { key: "lead", label: "Lead e Appuntamenti", emoji: "📞", stripColor: "bg-brand", iconBg: "bg-brand-light" },
  { key: "preventivi", label: "Preventivi e Trattative", emoji: "💰", stripColor: "bg-[hsl(45,90%,50%)]", iconBg: "bg-[hsl(45,90%,94%)]" },
  { key: "whatsapp", label: "WhatsApp e Assistenza", emoji: "💬", stripColor: "bg-[hsl(142,70%,49%)]", iconBg: "bg-[hsl(142,60%,94%)]" },
  { key: "postvendita", label: "Post-vendita", emoji: "⭐", stripColor: "bg-[hsl(280,70%,55%)]", iconBg: "bg-[hsl(280,60%,94%)]" },
  { key: "vendita", label: "Vendita Visiva", emoji: "🎨", stripColor: "bg-settore-ristr", iconBg: "bg-settore-ristr-bg" },
  { key: "prossimamente", label: "Prossimamente", emoji: "🕐", stripColor: "bg-ink-200", iconBg: "bg-ink-100" },
];

/* ── Settore filter ────────────────────────────────── */

const SETTORI_FILTER = [
  { key: "tutti", label: "Tutti i settori" },
  { key: "serramenti", label: "🪟 Serramenti" },
  { key: "fotovoltaico", label: "☀️ Fotovoltaico" },
  { key: "ristrutturazioni", label: "🏗️ Ristrutturazioni" },
  { key: "edilizia", label: "🏠 Edilizia" },
];

/* ── Static templates ──────────────────────────────── */

interface HubTemplate {
  slug: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  channel: string[];
  difficulty: string;
  estimated_setup_min: number;
  installs_count: number;
  is_featured: boolean;
  badge?: string;
  disabled?: boolean;
  fromDb?: boolean;
  settore: string;
  kpi?: string;
  result?: string;
}

const STATIC_TEMPLATES: HubTemplate[] = [
  // ── 📞 Lead e Appuntamenti ──
  {
    slug: "richiama-lead-ads", name: "Richiama Lead da Campagne",
    description: "Risponde in automatico ai lead da Meta e Google Ads. Qualifica velocemente e fissa il sopralluogo prima che il cliente chiami un concorrente.",
    icon: "📱", category: "lead", channel: ["vocale"], difficulty: "facile",
    estimated_setup_min: 8, installs_count: 38, is_featured: true, badge: "🔥 ALTO ROI",
    settore: "tutti", kpi: "Risposta in <10 sec",
    result: "→ Non perdi più lead dalle tue campagne",
  },
  {
    slug: "qualifica-serramenti", name: "Qualifica Lead Serramenti",
    description: "Raccoglie tipo infisso, materiale, quantità e fissa il sopralluogo in automatico. Solo lead pronti arrivano al tuo commerciale.",
    icon: "🪟", category: "lead", channel: ["vocale"], difficulty: "facile",
    estimated_setup_min: 10, installs_count: 47, is_featured: true, badge: "TOP SERRAMENTI",
    settore: "serramenti", kpi: "Tasso qualifica ~35%",
    result: "→ Il commerciale riceve solo lead qualificati",
  },
  {
    slug: "qualifica-fotovoltaico", name: "Qualifica Lead Fotovoltaico",
    description: "Verifica tipo immobile, consumo, copertura e interesse accumulo. Gestisce obiezioni sul prezzo con dati di risparmio reali.",
    icon: "☀️", category: "lead", channel: ["vocale"], difficulty: "facile",
    estimated_setup_min: 10, installs_count: 28, is_featured: false,
    settore: "fotovoltaico", kpi: "Tasso qualifica ~40%",
    result: "→ Solo sopralluoghi con clienti realmente interessati",
  },
  {
    slug: "qualifica-ristrutturazione", name: "Qualifica Lead Ristrutturazione",
    description: "Filtra i lead per tipo intervento, metratura, budget e tempistica. Propone il sopralluogo gratuito ai qualificati.",
    icon: "🏗️", category: "lead", channel: ["vocale"], difficulty: "facile",
    estimated_setup_min: 10, installs_count: 31, is_featured: true, badge: "POPOLARE",
    settore: "ristrutturazioni", kpi: "Tasso qualifica ~30%",
    result: "→ Meno tempo perso con richieste non in target",
  },
  {
    slug: "conferma-appuntamenti", name: "Conferma Appuntamenti",
    description: "Chiama il giorno prima per confermare l'appuntamento. Gestisce riprogrammazioni e raccoglie info logistiche (citofono, parcheggio).",
    icon: "📋", category: "lead", channel: ["vocale"], difficulty: "facile",
    estimated_setup_min: 8, installs_count: 24, is_featured: false,
    settore: "tutti", kpi: "No-show -40%",
    result: "→ Meno sopralluoghi saltati, più giornate produttive",
  },
  {
    slug: "recupera-noshow", name: "Recupera No-Show",
    description: "Ricontatta chi ha saltato il sopralluogo senza accusare. Capisce cosa è successo e riprogramma l'appuntamento.",
    icon: "📞", category: "lead", channel: ["vocale"], difficulty: "facile",
    estimated_setup_min: 8, installs_count: 15, is_featured: false,
    settore: "tutti", kpi: "Recupero ~50%",
    result: "→ Recuperi metà degli appuntamenti persi",
  },

  // ── 💰 Preventivi e Trattative ──
  {
    slug: "recupera-preventivi", name: "Recupera Preventivi Fermi",
    description: "Richiama i preventivi non chiusi dopo 7-14 giorni. Scopre il motivo del blocco, rilancia e recupera fino al 25% dei lead persi.",
    icon: "🔄", category: "preventivi", channel: ["vocale"], difficulty: "facile",
    estimated_setup_min: 10, installs_count: 22, is_featured: true, badge: "ESSENZIALE",
    settore: "tutti", kpi: "Recupero ~25%",
    result: "→ Recupera 1 preventivo su 4 che stavi perdendo",
  },
  {
    slug: "followup-sopralluogo", name: "Follow-up Dopo Sopralluogo",
    description: "Chiama 2-3 giorni dopo il sopralluogo per rispondere a dubbi e accelerare la decisione del cliente. Il venditore non deve ricordarsi di richiamare.",
    icon: "🤝", category: "preventivi", channel: ["vocale"], difficulty: "facile",
    estimated_setup_min: 10, installs_count: 0, is_featured: false,
    settore: "tutti", kpi: "Decisione +15% più veloce",
    result: "→ Il cliente decide prima, meno trattative che si spengono",
  },
  {
    slug: "followup-preventivi-wa", name: "Follow-up Preventivi WhatsApp",
    description: "Invia follow-up automatici via WhatsApp ai preventivi in scadenza. Meno invasivo della telefonata, più efficace dell'email.",
    icon: "📩", category: "preventivi", channel: ["whatsapp"], difficulty: "facile",
    estimated_setup_min: 10, installs_count: 16, is_featured: false,
    settore: "tutti", kpi: "Tasso apertura ~85%",
    result: "→ I tuoi preventivi non restano più senza risposta",
  },

  // ── 💬 WhatsApp e Assistenza ──
  {
    slug: "assistente-whatsapp", name: "Assistente WhatsApp Commerciale",
    description: "Risponde ai clienti su WhatsApp H24. Fornisce info, raccoglie richieste di preventivo e fissa appuntamenti. Come un commerciale che non dorme mai.",
    icon: "💬", category: "whatsapp", channel: ["whatsapp"], difficulty: "medio",
    estimated_setup_min: 15, installs_count: 34, is_featured: true, badge: "ESSENZIALE",
    settore: "tutti", kpi: "Risposta <30 sec",
    result: "→ Non perdi più messaggi, neanche di notte o nel weekend",
  },
  {
    slug: "primo-contatto-wa", name: "Primo Contatto Lead WhatsApp",
    description: "Messaggio automatico di benvenuto e qualifica rapida quando un lead scrive per la prima volta. Il lead si sente accolto subito.",
    icon: "👋", category: "whatsapp", channel: ["whatsapp"], difficulty: "facile",
    estimated_setup_min: 8, installs_count: 0, is_featured: false,
    settore: "tutti", kpi: "Tempo risposta <1 min",
    result: "→ Ogni nuovo contatto riceve subito attenzione",
  },

  // ── ⭐ Post-vendita ──
  {
    slug: "raccolta-recensioni", name: "Raccolta Recensioni Google",
    description: "Chiama dopo i lavori, raccoglie un voto 1-5. Se soddisfatto, guida alla recensione Google. Se insoddisfatto, attiva il supporto.",
    icon: "⭐", category: "postvendita", channel: ["vocale"], difficulty: "facile",
    estimated_setup_min: 8, installs_count: 19, is_featured: false,
    settore: "tutti", kpi: "+3 recensioni/mese",
    result: "→ Più recensioni positive senza chiederle manualmente",
  },
  {
    slug: "verifica-soddisfazione", name: "Verifica Soddisfazione Post-Lavoro",
    description: "Contatta il cliente 1 settimana dopo per verificare che tutto funzioni. Previene reclami e mostra attenzione professionale.",
    icon: "✅", category: "postvendita", channel: ["vocale"], difficulty: "facile",
    estimated_setup_min: 8, installs_count: 0, is_featured: false,
    settore: "tutti", kpi: "Reclami -30%",
    result: "→ Meno reclami, clienti più fidelizzati",
  },

  // ── 🎨 Vendita Visiva ──
  {
    slug: "render-infissi", name: "Render Infissi AI",
    description: "Trasforma una foto della facciata in un render professionale con i nuovi infissi. Il cliente vede il risultato prima di comprare.",
    icon: "🪟", category: "vendita", channel: ["visuale"], difficulty: "facile",
    estimated_setup_min: 5, installs_count: 52, is_featured: true, badge: "BEST SELLER",
    settore: "serramenti", kpi: "Conversione +30%",
    result: "→ Il cliente si convince vedendo il risultato finale",
  },

  {
    slug: "render-bagno", name: "Render Bagno AI",
    description: "Trasforma una foto del bagno in un render fotorealistico con nuove piastrelle, sanitari e finiture. Il cliente vede il risultato prima di ristrutturare.",
    icon: "🛁", category: "vendita", channel: ["visuale"], difficulty: "facile",
    estimated_setup_min: 5, installs_count: 0, is_featured: true, badge: "NUOVO",
    settore: "ristrutturazioni", kpi: "Conversione +35%",
    result: "→ Il cliente decide più velocemente vedendo il bagno finito",
  },

  // ── 🕐 Prossimamente ──
  {
    slug: "render-coperture", name: "Render Coperture AI",
    description: "Genera render realistici di coperture e tetti con diversi materiali e colori.",
    icon: "🏠", category: "prossimamente", channel: ["visuale"], difficulty: "facile",
    estimated_setup_min: 5, installs_count: 0, is_featured: false, disabled: true,
    settore: "edilizia",
  },
  {
    slug: "render-facciate", name: "Render Facciate AI",
    description: "Visualizza il restyling di facciate con cappotto termico, colori e finiture diverse.",
    icon: "🏢", category: "prossimamente", channel: ["visuale"], difficulty: "facile",
    estimated_setup_min: 5, installs_count: 0, is_featured: false, disabled: true,
    settore: "edilizia",
  },
  {
    slug: "assistente-showroom", name: "Assistente Showroom",
    description: "Accoglie i visitatori dello showroom con un totem vocale. Risponde a domande su prodotti, prezzi e disponibilità mentre il team è occupato.",
    icon: "🏪", category: "prossimamente", channel: ["vocale"], difficulty: "medio",
    estimated_setup_min: 20, installs_count: 0, is_featured: false, disabled: true,
    settore: "serramenti",
  },
];

/* ── Category helpers ──────────────────────────────── */

function getCategoryConfig(cat: string): Category {
  return CATEGORIES.find((c) => c.key === cat) || CATEGORIES[0];
}

function getChannelBadge(ch: string) {
  switch (ch) {
    case "vocale": return { label: "🎙️ Vocale", cls: "bg-brand-light text-brand-text" };
    case "whatsapp": return { label: "💬 WhatsApp", cls: "bg-[hsl(142,60%,94%)] text-[hsl(142,70%,30%)]" };
    case "visuale": return { label: "🎨 Visuale", cls: "bg-settore-ristr-bg text-settore-ristr" };
    default: return { label: ch, cls: "bg-ink-100 text-ink-500" };
  }
}

const difficultyStyles: Record<string, string> = {
  facile: "bg-brand-light text-brand-text",
  medio: "bg-status-warning-light text-status-warning",
  avanzato: "bg-settore-ristr-bg text-settore-ristr",
};

const settoreBadgeStyles: Record<string, string> = {
  serramenti: "bg-[hsl(200,70%,92%)] text-[hsl(200,70%,35%)]",
  fotovoltaico: "bg-[hsl(45,90%,90%)] text-[hsl(45,80%,30%)]",
  ristrutturazioni: "bg-[hsl(20,70%,92%)] text-[hsl(20,70%,35%)]",
  edilizia: "bg-[hsl(160,50%,92%)] text-[hsl(160,50%,30%)]",
};

/* ── Component ─────────────────────────────────────── */

export default function CreateAgent() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const activeCategory = searchParams.get("category") || "all";
  const [activeSettore, setActiveSettore] = useState("tutti");

  // Load DB templates
  const { data: dbTemplates } = useQuery({
    queryKey: ["agent-templates-hub"],
    queryFn: async () => {
      const { data } = await supabase
        .from("agent_templates")
        .select("slug, name, description, icon, channel, difficulty, estimated_setup_min, installs_count, is_featured, category, is_published")
        .eq("is_published", true);
      return (data || []).map((t: any): HubTemplate => ({
        slug: t.slug, name: t.name, description: t.description || "",
        icon: t.icon || "🤖", category: mapDbCategory(t.category, t.channel),
        channel: t.channel || [], difficulty: t.difficulty || "facile",
        estimated_setup_min: t.estimated_setup_min || 30,
        installs_count: t.installs_count || 0,
        is_featured: t.is_featured || false, fromDb: true, settore: "tutti",
      }));
    },
  });

  // Merge: DB templates override static ones with same slug
  const allTemplates = useMemo(() => {
    const dbSlugs = new Set((dbTemplates || []).map((t) => t.slug));
    const statics = STATIC_TEMPLATES.filter((t) => !dbSlugs.has(t.slug));
    const merged = [...(dbTemplates || []), ...statics];
    // Sort: featured first, then by installs_count desc
    return merged.sort((a, b) => {
      if (a.disabled && !b.disabled) return 1;
      if (!a.disabled && b.disabled) return -1;
      if (a.is_featured && !b.is_featured) return -1;
      if (!a.is_featured && b.is_featured) return 1;
      return (b.installs_count || 0) - (a.installs_count || 0);
    });
  }, [dbTemplates]);

  // Filter
  const filtered = useMemo(() => {
    let list = allTemplates;
    if (activeCategory !== "all") {
      list = list.filter((t) => t.category === activeCategory || (activeCategory === "prossimamente" && t.disabled));
    }
    if (activeSettore !== "tutti") {
      list = list.filter((t) => t.settore === activeSettore || t.settore === "tutti");
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((t) =>
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.channel.some((c) => c.toLowerCase().includes(q)) ||
        t.settore.toLowerCase().includes(q)
      );
    }
    return list;
  }, [allTemplates, activeCategory, activeSettore, search]);

  const setCategory = (key: string) => {
    if (key === "all") {
      searchParams.delete("category");
    } else {
      searchParams.set("category", key);
    }
    setSearchParams(searchParams, { replace: true });
  };

  return (
    <div className="min-h-[80vh]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-card border-b border-border px-8 py-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <button
              onClick={() => navigate("/app/agents")}
              className="flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-700 transition-colors mb-3"
            >
              <ArrowLeft className="w-4 h-4" /> Agenti
            </button>
            <h1 className="text-[26px] font-extrabold text-ink-900">Cosa vuoi automatizzare?</h1>
            <p className="text-sm text-ink-500 mt-1">
              Scegli un obiettivo e attiva il tuo agente in pochi minuti. Tutto già pronto, basta personalizzare.
            </p>
          </div>
          <div className="relative w-80 hidden md:block shrink-0 mt-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
            <Input
              placeholder="Cerca per obiettivo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-ink-50 border-ink-200 text-sm"
            />
          </div>
        </div>

        {/* Category pills */}
        <div className="flex gap-2 mt-4 overflow-x-auto pb-2 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setCategory(cat.key)}
              className={`shrink-0 px-4 py-1.5 rounded-pill text-sm font-medium transition-colors ${
                activeCategory === cat.key
                  ? "bg-brand text-white"
                  : cat.key === "prossimamente"
                    ? "bg-ink-100 text-ink-400"
                    : "bg-ink-100 text-ink-600 hover:bg-ink-200"
              }`}
            >
              {cat.emoji ? `${cat.emoji} ` : ""}{cat.label}
            </button>
          ))}

          {/* Settore filter */}
          <div className="border-l border-border pl-2 ml-1 flex gap-1.5">
            {SETTORI_FILTER.map((s) => (
              <button
                key={s.key}
                onClick={() => setActiveSettore(s.key)}
                className={`shrink-0 px-3 py-1.5 rounded-pill text-xs font-medium transition-colors ${
                  activeSettore === s.key
                    ? "bg-ink-800 text-white"
                    : "bg-ink-50 text-ink-500 hover:bg-ink-100"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile search */}
      <div className="px-8 pt-4 md:hidden">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
            <Input
              placeholder="Cerca per obiettivo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-ink-50 border-ink-200 text-sm"
            />
        </div>
      </div>

      {/* Grid */}
      <div className="px-8 pb-12 mt-8">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-ink-400">
            <p className="text-base font-medium">Nessun template trovato</p>
            <p className="text-sm mt-1">Prova a cambiare categoria o settore.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
            {filtered.map((t) => (
              <TemplateHubCard key={t.slug} template={t} />
            ))}
          </div>
        )}

        {/* Crea da zero link */}
        <div className="mt-10 text-center">
          <button
            onClick={() => navigate("/app/agents/new/vocale-custom")}
            className="inline-flex items-center gap-2 text-sm text-ink-400 hover:text-brand transition-colors font-medium"
          >
            <Zap className="w-4 h-4" />
            Non trovi quello che cerchi? Crea un agente da zero →
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Template Hub Card ─────────────────────────────── */

function TemplateHubCard({ template: t }: { template: HubTemplate }) {
  const navigate = useNavigate();
  const catConfig = getCategoryConfig(t.category);
  const stripColor = t.disabled ? "bg-ink-200" : catConfig.stripColor || "bg-brand";
  const iconBg = t.disabled ? "bg-ink-100" : catConfig.iconBg || "bg-brand-light";

  const handleClick = () => {
    if (t.disabled) return;
    if (t.fromDb) {
      navigate(`/app/templates/${t.slug}/setup`);
    } else if (t.channel?.includes("whatsapp")) {
      navigate("/app/whatsapp");
    } else {
      navigate(`/app/agents/new/${t.slug}`);
    }
  };

  return (
    <div
      className={`bg-card border border-border rounded-card shadow-card overflow-hidden transition-all duration-200 ${
        t.disabled
          ? "opacity-60 cursor-not-allowed"
          : "hover:shadow-card-hover hover:border-ink-300 hover:-translate-y-0.5 cursor-pointer"
      }`}
      onClick={handleClick}
    >
      {/* Top strip */}
      <div className={`h-1 ${stripColor}`} />

      {/* Header */}
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-start justify-between">
          <div>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${iconBg}`}>
              {t.icon}
            </div>
            <h3 className="text-[15px] font-bold text-foreground mt-3">{t.name}</h3>
            <div className="flex gap-1.5 mt-1.5 flex-wrap">
              {t.channel.map((ch) => {
                const badge = getChannelBadge(ch);
                return (
                  <span key={ch} className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-pill ${badge.cls}`}>
                    {badge.label}
                  </span>
                );
              })}
              {t.estimated_setup_min <= 10 && !t.disabled && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-pill bg-brand-light text-brand-text flex items-center gap-0.5">
                  <CheckCircle className="w-2.5 h-2.5" /> Facile
                </span>
              )}
              {t.settore && t.settore !== "tutti" && (
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-pill ${settoreBadgeStyles[t.settore] || "bg-ink-100 text-ink-600"}`}>
                  {t.settore === "serramenti" ? "Ideale per Serramentisti" :
                   t.settore === "fotovoltaico" ? "Ideale per Fotovoltaico" :
                   t.settore === "ristrutturazioni" ? "Ideale per Ristrutturazioni" :
                   t.settore.charAt(0).toUpperCase() + t.settore.slice(1)}
                </span>
              )}
            </div>
          </div>
          {t.badge && !t.disabled && (
            <span className="text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-pill bg-brand text-white shrink-0">
              {t.badge}
            </span>
          )}
          {t.disabled && (
            <span className="text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-pill bg-ink-300 text-white shrink-0">
              PROSSIMAMENTE
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="px-5 pb-4">
        <p className="text-[13px] text-muted-foreground leading-relaxed line-clamp-2">{t.description}</p>

        {/* Risultato atteso — la riga più importante */}
        {t.result && !t.disabled && (
          <div className="mt-2.5 bg-brand-light rounded-lg px-3 py-2">
            <span className="text-[12px] font-semibold text-brand-text">{t.result}</span>
          </div>
        )}

        {!t.disabled && (
          <div className="flex items-center gap-3 mt-3 text-xs text-ink-500">
            <span>⏱ {t.estimated_setup_min} min setup</span>
            {t.installs_count > 5 && (
              <>
                <span>·</span>
                <span>🏢 {t.installs_count} aziende</span>
              </>
            )}
            {t.kpi && (
              <>
                <span>·</span>
                <span className="font-medium text-ink-600">📊 {t.kpi}</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-border px-5 py-3 flex items-center justify-between">
        <button
          disabled={t.disabled}
          onClick={(e) => {
            e.stopPropagation();
            handleClick();
          }}
          className={`text-sm py-2 px-4 rounded-btn font-medium transition-colors ${
            t.disabled
              ? "bg-ink-100 text-ink-400 cursor-not-allowed"
              : "bg-brand text-white hover:bg-brand-hover"
          }`}
        >
          {t.disabled ? "In arrivo" : "Attiva →"}
        </button>
        {!t.disabled && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="p-1.5 rounded-lg hover:bg-ink-100 transition-colors">
                <Info className="w-4 h-4 text-ink-300 hover:text-ink-600" />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs max-w-[200px]">{t.description}</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </div>
  );
}

/* ── Helpers ────────────────────────────────────────── */

function mapDbCategory(category: string | null, channel: string[] | null): string {
  if (!category) {
    const ch = channel?.[0] || "";
    if (ch === "whatsapp") return "whatsapp";
    return "lead";
  }
  const cat = category.toLowerCase();
  if (cat.includes("lead") || cat.includes("appuntament") || cat.includes("qualifica")) return "lead";
  if (cat.includes("preventiv") || cat.includes("trattativ")) return "preventivi";
  if (cat.includes("whatsapp") || cat.includes("chat") || cat.includes("assistenza")) return "whatsapp";
  if (cat.includes("post") || cat.includes("recension") || cat.includes("soddisfaz")) return "postvendita";
  if (cat.includes("vendita") || cat.includes("render") || cat.includes("visual")) return "vendita";
  if (cat.includes("report")) return "lead";
  return "lead";
}
