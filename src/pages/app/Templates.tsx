import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import TemplateCard from "@/components/templates/TemplateCard";

const categories = [
  { value: "all", label: "Tutti" },
  { value: "reportistica", label: "Reportistica" },
  { value: "qualifica_lead", label: "Qualifica Lead" },
  { value: "assistenza", label: "Assistenza" },
  { value: "appuntamenti", label: "Appuntamenti" },
  { value: "sicurezza", label: "Sicurezza" },
  { value: "hr_operai", label: "HR Operai" },
];

interface Template {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  category: string | null;
  icon: string;
  channel: string[];
  estimated_setup_min: number;
  difficulty: string;
  is_featured: boolean;
  installs_count: number;
}

const upcomingTemplates = [
  { slug: "richiamo-lead", name: "Richiamo Lead Inattivi", icon: "📞", description: "Ricontatta automaticamente i lead che non hanno risposto.", category: "qualifica_lead", channel: ["whatsapp", "voice"], estimated_setup_min: 25, difficulty: "medio", is_featured: false, installs_count: 0 },
  { slug: "assistenza-post-vendita", name: "Assistenza Post-Vendita", icon: "🔧", description: "Gestisci richieste di assistenza post-installazione.", category: "post_vendita", channel: ["whatsapp"], estimated_setup_min: 20, difficulty: "facile", is_featured: false, installs_count: 0 },
  { slug: "prenotazione-appuntamenti", name: "Prenotazione Appuntamenti", icon: "📅", description: "Prenota sopralluoghi e appuntamenti con i clienti.", category: "appuntamenti", channel: ["whatsapp", "voice"], estimated_setup_min: 30, difficulty: "facile", is_featured: false, installs_count: 0 },
  { slug: "check-sicurezza", name: "Check Sicurezza Cantiere", icon: "🦺", description: "Checklist di sicurezza giornaliera per ogni cantiere.", category: "sicurezza", channel: ["whatsapp"], estimated_setup_min: 15, difficulty: "facile", is_featured: false, installs_count: 0 },
  { slug: "onboarding-operaio", name: "Onboarding Nuovo Operaio", icon: "💼", description: "Guida i nuovi operai nei primi giorni di lavoro.", category: "hr_operai", channel: ["whatsapp", "telegram"], estimated_setup_min: 35, difficulty: "medio", is_featured: false, installs_count: 0 },
  { slug: "avanzamento-settimanale", name: "Avanzamento Lavori Settimanale", icon: "📊", description: "Report settimanale aggregato di tutti i cantieri.", category: "reportistica", channel: ["email", "whatsapp"], estimated_setup_min: 20, difficulty: "facile", is_featured: false, installs_count: 0 },
];

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("agent_templates")
        .select("id, slug, name, description, category, icon, channel, estimated_setup_min, difficulty, is_featured, installs_count")
        .eq("is_published", true);
      setTemplates((data as Template[]) || []);
      setLoading(false);
    };
    fetch();
  }, []);

  const filtered = templates.filter((t) => {
    if (activeCategory !== "all" && t.category !== activeCategory) return false;
    if (search && !t.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const upcomingFiltered = upcomingTemplates.filter((t) => {
    if (activeCategory !== "all" && t.category !== activeCategory) return false;
    if (search && !t.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div>
      {/* Hero */}
      <div className="bg-card border-b border-border px-8 py-10">
        <h1 className="text-[28px] font-extrabold text-foreground">🧩 Template Agenti AI</h1>
        <p className="text-[15px] text-muted-foreground mt-1 max-w-xl">
          Configura agenti pre-costruiti in meno di 30 minuti. Ogni template include prompt, workflow di automazione n8n e integrazione canali.
        </p>

        <div className="flex items-center gap-3 mt-6 flex-wrap">
          <div className="flex gap-1 bg-muted rounded-lg p-1">
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setActiveCategory(cat.value)}
                className={`px-3 py-1.5 text-sm rounded-md font-medium transition-colors ${
                  activeCategory === cat.value
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
          <div className="ml-auto relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <Input
              className="pl-9 w-60"
              placeholder="Cerca template..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="px-8 py-8">
        {loading ? (
          <div className="grid grid-cols-3 gap-5">
            {[1,2,3].map((i) => (
              <div key={i} className="h-[340px] bg-muted animate-pulse rounded-card" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filtered.map((t) => (
              <TemplateCard key={t.id} {...t} />
            ))}
            {upcomingFiltered.map((t) => (
              <TemplateCard key={t.slug} {...t} disabled />
            ))}
          </div>
        )}

        {!loading && filtered.length === 0 && upcomingFiltered.length === 0 && (
          <p className="text-center text-muted-foreground py-12">
            Nessun template trovato per questa ricerca.
          </p>
        )}
      </div>
    </div>
  );
}
