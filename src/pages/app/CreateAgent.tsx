import { useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Search, Info } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

/* ── Category config ───────────────────────────────── */

interface Category {
  key: string;
  label: string;
  emoji: string;
  stripColor: string;
  iconBg: string;
}

const CATEGORIES: Category[] = [
  { key: "all", label: "Tutti", emoji: "", stripColor: "", iconBg: "" },
  { key: "vocali", label: "Vocali", emoji: "🎙️", stripColor: "bg-brand", iconBg: "bg-brand-light" },
  { key: "whatsapp", label: "WhatsApp & Chat", emoji: "💬", stripColor: "bg-[hsl(142,70%,49%)]", iconBg: "bg-[hsl(142,60%,94%)]" },
  { key: "reportistica", label: "Reportistica", emoji: "📋", stripColor: "bg-status-warning", iconBg: "bg-status-warning-light" },
  { key: "vendita", label: "Strumenti Vendita", emoji: "🎨", stripColor: "bg-settore-ristr", iconBg: "bg-settore-ristr-bg" },
  { key: "operativi", label: "Operativi", emoji: "🔧", stripColor: "bg-accent-blue", iconBg: "bg-status-info-light" },
  { key: "prossimamente", label: "Prossimamente", emoji: "🕐", stripColor: "bg-ink-200", iconBg: "bg-ink-100" },
];

/* ── Static templates (not in DB) ──────────────────── */

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
}

const STATIC_TEMPLATES: HubTemplate[] = [
  {
    slug: "vocale-custom", name: "Agente Vocale Personalizzato",
    description: "Crea un agente vocale da zero con il tuo prompt, voce e configurazione completa.",
    icon: "🤖", category: "vocali", channel: ["vocale"], difficulty: "avanzato",
    estimated_setup_min: 15, installs_count: 0, is_featured: false,
  },
  {
    slug: "qualifica-inbound", name: "Qualifica Lead Inbound",
    description: "Risponde alle chiamate in entrata e qualifica i lead con domande intelligenti.",
    icon: "📞", category: "vocali", channel: ["vocale"], difficulty: "facile",
    estimated_setup_min: 10, installs_count: 32, is_featured: true, badge: "POPOLARE",
  },
  {
    slug: "richiamo-outbound", name: "Richiamo Clienti (Outbound)",
    description: "Ricontatta prospect e clienti inattivi con chiamate outbound automatiche.",
    icon: "📲", category: "vocali", channel: ["vocale"], difficulty: "facile",
    estimated_setup_min: 10, installs_count: 18, is_featured: false,
  },
  {
    slug: "prenotazione-appuntamenti", name: "Prenotazione Appuntamenti",
    description: "Fissa sopralluoghi e appuntamenti in autonomia, integrato con il calendario.",
    icon: "📅", category: "vocali", channel: ["vocale"], difficulty: "facile",
    estimated_setup_min: 10, installs_count: 24, is_featured: false,
  },
  {
    slug: "assistenza-post-vendita", name: "Assistenza Post-Vendita",
    description: "Gestisce richieste di assistenza, garanzia e supporto tecnico.",
    icon: "🔧", category: "vocali", channel: ["vocale"], difficulty: "medio",
    estimated_setup_min: 12, installs_count: 8, is_featured: false,
  },
  {
    slug: "assistente-whatsapp", name: "Assistente WhatsApp",
    description: "Risponde ai clienti su WhatsApp H24 con risposte intelligenti.",
    icon: "💬", category: "whatsapp", channel: ["whatsapp"], difficulty: "medio",
    estimated_setup_min: 15, installs_count: 12, is_featured: false,
  },
  {
    slug: "render-infissi", name: "Render Infissi AI",
    description: "Trasforma una foto in un render professionale del nuovo infisso installato.",
    icon: "🪟", category: "vendita", channel: ["visuale"], difficulty: "facile",
    estimated_setup_min: 5, installs_count: 45, is_featured: true, badge: "NUOVO",
  },
  {
    slug: "render-coperture", name: "Render Coperture AI",
    description: "Genera render realistici di coperture e tetti con diversi materiali.",
    icon: "🏠", category: "prossimamente", channel: ["visuale"], difficulty: "facile",
    estimated_setup_min: 5, installs_count: 0, is_featured: false, disabled: true,
  },
  {
    slug: "render-facciate", name: "Render Facciate AI",
    description: "Visualizza il restyling di facciate con cappotto termico e finiture.",
    icon: "🏢", category: "prossimamente", channel: ["visuale"], difficulty: "facile",
    estimated_setup_min: 5, installs_count: 0, is_featured: false, disabled: true,
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

/* ── Component ─────────────────────────────────────── */

export default function CreateAgent() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const activeCategory = searchParams.get("category") || "all";

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
        is_featured: t.is_featured || false, fromDb: true,
      }));
    },
  });

  // Merge: DB templates override static ones with same slug
  const allTemplates = useMemo(() => {
    const dbSlugs = new Set((dbTemplates || []).map((t) => t.slug));
    const statics = STATIC_TEMPLATES.filter((t) => !dbSlugs.has(t.slug));
    return [...(dbTemplates || []), ...statics];
  }, [dbTemplates]);

  // Filter
  const filtered = useMemo(() => {
    let list = allTemplates;
    if (activeCategory !== "all") {
      list = list.filter((t) => t.category === activeCategory || (activeCategory === "prossimamente" && t.disabled));
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((t) =>
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.channel.some((c) => c.toLowerCase().includes(q)) ||
        t.category.toLowerCase().includes(q)
      );
    }
    return list;
  }, [allTemplates, activeCategory, search]);

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
            <h1 className="text-[26px] font-extrabold text-ink-900">Scegli il tipo di agente</h1>
            <p className="text-sm text-ink-500 mt-1">
              Seleziona un template per iniziare. Ogni agente è pre-configurato e pronto in pochi minuti.
            </p>
          </div>
          <div className="relative w-80 hidden md:block shrink-0 mt-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
            <Input
              placeholder="Cerca template..."
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
        </div>
      </div>

      {/* Mobile search */}
      <div className="px-8 pt-4 md:hidden">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
          <Input
            placeholder="Cerca template..."
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
            <p className="text-sm mt-1">Prova a cambiare categoria o cerca qualcos'altro.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
            {filtered.map((t) => (
              <TemplateHubCard key={t.slug} template={t} />
            ))}
          </div>
        )}
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
    // For DB templates, route to the template setup wizard
    if (t.fromDb) {
      navigate(`/app/templates/${t.slug}/setup`);
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
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-pill ${difficultyStyles[t.difficulty] || "bg-ink-100 text-ink-500"}`}>
                {t.difficulty.charAt(0).toUpperCase() + t.difficulty.slice(1)}
              </span>
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

        {!t.disabled && (
          <div className="grid grid-cols-2 gap-2 mt-3">
            <div className="bg-ink-50 rounded-lg px-3 py-2">
              <span className="text-xs text-ink-500">⏱ {t.estimated_setup_min} min setup</span>
            </div>
            <div className="bg-ink-50 rounded-lg px-3 py-2">
              <span className="text-xs text-ink-500">🏢 {t.installs_count} aziende</span>
            </div>
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
          {t.disabled ? "In arrivo" : "Configura →"}
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
    if (ch === "vocale" || ch === "voice") return "vocali";
    return "operativi";
  }
  const cat = category.toLowerCase();
  if (cat.includes("vocal") || cat.includes("voice")) return "vocali";
  if (cat.includes("whatsapp") || cat.includes("chat")) return "whatsapp";
  if (cat.includes("report")) return "reportistica";
  if (cat.includes("vendita") || cat.includes("render")) return "vendita";
  if (cat.includes("operat")) return "operativi";
  return "operativi";
}
