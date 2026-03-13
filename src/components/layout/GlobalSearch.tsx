import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bot, BookUser, Megaphone, MessageSquare, Search,
  LayoutDashboard, Zap, BarChart3, Activity, CalendarClock,
  FileSignature, HardHat, ShieldCheck, ClipboardList,
  Palette, Bath, Home, Layers, Wand2,
  Coins, Puzzle, Settings, FileText, type LucideIcon,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyId } from "@/hooks/useCompanyId";

interface SearchResult {
  id: string;
  label: string;
  sublabel?: string;
  href: string;
  icon: LucideIcon;
}

interface StaticPage {
  label: string;
  href: string;
  icon: LucideIcon;
  keywords: string[];
}

const STATIC_PAGES: StaticPage[] = [
  { label: "Dashboard", href: "/app", icon: LayoutDashboard, keywords: ["home", "pannello", "principale"] },
  { label: "Agenti", href: "/app/agents", icon: Bot, keywords: ["bot", "vocale", "assistente"] },
  { label: "Automazioni AI", href: "/app/automations", icon: Zap, keywords: ["workflow", "automazione"] },
  { label: "Risultati", href: "/app/analytics", icon: BarChart3, keywords: ["statistiche", "grafici", "report"] },
  { label: "Contatti", href: "/app/contacts", icon: BookUser, keywords: ["rubrica", "lead", "clienti"] },
  { label: "Campagne", href: "/app/campaigns", icon: Megaphone, keywords: ["outbound", "chiamate massa"] },
  { label: "Monitor Chiamate", href: "/app/call-monitor", icon: Activity, keywords: ["live", "attive"] },
  { label: "Chiamate Programmate", href: "/app/scheduled-calls", icon: CalendarClock, keywords: ["schedulate", "pianificate"] },
  { label: "Preventivi", href: "/app/preventivi", icon: FileSignature, keywords: ["offerta", "quotazione", "prezzo"] },
  { label: "Template Preventivo", href: "/app/impostazioni/template-preventivo", icon: FileText, keywords: ["modello preventivo"] },
  { label: "Cantieri", href: "/app/cantieri", icon: HardHat, keywords: ["cantiere", "lavori", "costruzione"] },
  { label: "Documenti", href: "/app/documenti", icon: ShieldCheck, keywords: ["scadenze", "sicurezza"] },
  { label: "Presenze", href: "/app/presenze", icon: ClipboardList, keywords: ["foglio", "operai", "ore"] },
  { label: "Render Infissi", href: "/app/render", icon: Palette, keywords: ["finestre", "porte", "serramenti", "colore infisso", "ral"] },
  { label: "Render Bagno", href: "/app/render-bagno", icon: Bath, keywords: ["bathroom", "piastrelle", "sanitari"] },
  { label: "Render Facciata", href: "/app/render-facciata", icon: Home, keywords: ["esterno", "intonaco", "cappotto", "edificio"] },
  { label: "Render Persiane", href: "/app/render-persiane", icon: Layers, keywords: ["veneziane", "scuri", "lamelle"] },
  { label: "Render Pavimento", href: "/app/render-pavimento", icon: HardHat, keywords: ["pavimenti", "parquet", "gres", "piastrella"] },
  { label: "Render Stanza", href: "/app/render-stanza", icon: Wand2, keywords: ["stanze", "soggiorno", "camera", "cucina", "arredo", "trasformazione"] },
  { label: "Crediti", href: "/app/credits", icon: Coins, keywords: ["saldo", "ricarica", "minuti"] },
  { label: "Integrazioni", href: "/app/integrations", icon: Puzzle, keywords: ["webhook", "n8n", "api"] },
  { label: "Account", href: "/app/settings", icon: Settings, keywords: ["profilo", "impostazioni", "password"] },
];

export default function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [agents, setAgents] = useState<SearchResult[]>([]);
  const [contacts, setContacts] = useState<SearchResult[]>([]);
  const [campaigns, setCampaigns] = useState<SearchResult[]>([]);
  const [conversations, setConversations] = useState<SearchResult[]>([]);
  const navigate = useNavigate();
  const companyId = useCompanyId();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Static pages filtered by query
  const filteredPages = useMemo(() => {
    if (query.length < 2) return [];
    const q = query.toLowerCase();
    return STATIC_PAGES.filter(
      (p) =>
        p.label.toLowerCase().includes(q) ||
        p.keywords.some((k) => k.includes(q))
    );
  }, [query]);

  const search = useCallback(async (q: string) => {
    if (!companyId || q.length < 2) {
      setAgents([]);
      setContacts([]);
      setCampaigns([]);
      setConversations([]);
      return;
    }
    const like = `%${q}%`;

    const [agRes, coRes, caRes, cvRes] = await Promise.all([
      supabase.from("agents").select("id, name, use_case").eq("company_id", companyId).ilike("name", like).limit(5),
      supabase.from("contacts").select("id, full_name, phone").eq("company_id", companyId).ilike("full_name", like).limit(5),
      supabase.from("campaigns").select("id, name, status").eq("company_id", companyId).ilike("name", like).limit(5),
      supabase.from("conversations").select("id, summary, agent_id").eq("company_id", companyId).ilike("summary", like).limit(5),
    ]);

    setAgents((agRes.data || []).map((a) => ({ id: a.id, label: a.name, sublabel: a.use_case || undefined, href: `/app/agents/${a.id}`, icon: Bot })));
    setContacts((coRes.data || []).map((c) => ({ id: c.id, label: c.full_name, sublabel: c.phone || undefined, href: `/app/contacts/${c.id}`, icon: BookUser })));
    setCampaigns((caRes.data || []).map((c) => ({ id: c.id, label: c.name, sublabel: c.status, href: `/app/campaigns/${c.id}`, icon: Megaphone })));
    setConversations((cvRes.data || []).map((c) => ({ id: c.id, label: c.summary?.slice(0, 60) || c.id.slice(0, 8), href: `/app/conversations`, icon: MessageSquare })));
  }, [companyId]);

  useEffect(() => {
    const timer = setTimeout(() => search(query), 300);
    return () => clearTimeout(timer);
  }, [query, search]);

  const select = (href: string) => {
    setOpen(false);
    setQuery("");
    navigate(href);
  };

  const hasResults = filteredPages.length + agents.length + contacts.length + campaigns.length + conversations.length > 0;

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Cerca agenti, contatti, pagine, render…" value={query} onValueChange={setQuery} />
      <CommandList>
        {query.length >= 2 && !hasResults && <CommandEmpty>Nessun risultato trovato.</CommandEmpty>}
        {query.length < 2 && <CommandEmpty>Scrivi almeno 2 caratteri per cercare…</CommandEmpty>}

        {filteredPages.length > 0 && (
          <CommandGroup heading="Pagine">
            {filteredPages.map((p) => {
              const Icon = p.icon;
              return (
                <CommandItem key={p.href} onSelect={() => select(p.href)} className="cursor-pointer gap-2">
                  <Icon size={16} className="text-muted-foreground" />
                  <span>{p.label}</span>
                </CommandItem>
              );
            })}
          </CommandGroup>
        )}

        {agents.length > 0 && (
          <>
            {filteredPages.length > 0 && <CommandSeparator />}
            <CommandGroup heading="Agenti">
              {agents.map((r) => (
                <CommandItem key={r.id} onSelect={() => select(r.href)} className="cursor-pointer gap-2">
                  <Bot size={16} className="text-muted-foreground" />
                  <span>{r.label}</span>
                  {r.sublabel && <span className="ml-auto text-xs text-muted-foreground">{r.sublabel}</span>}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {contacts.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Contatti">
              {contacts.map((r) => (
                <CommandItem key={r.id} onSelect={() => select(r.href)} className="cursor-pointer gap-2">
                  <BookUser size={16} className="text-muted-foreground" />
                  <span>{r.label}</span>
                  {r.sublabel && <span className="ml-auto text-xs text-muted-foreground">{r.sublabel}</span>}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {campaigns.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Campagne">
              {campaigns.map((r) => (
                <CommandItem key={r.id} onSelect={() => select(r.href)} className="cursor-pointer gap-2">
                  <Megaphone size={16} className="text-muted-foreground" />
                  <span>{r.label}</span>
                  {r.sublabel && <span className="ml-auto text-xs text-muted-foreground">{r.sublabel}</span>}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {conversations.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Conversazioni">
              {conversations.map((r) => (
                <CommandItem key={r.id} onSelect={() => select(r.href)} className="cursor-pointer gap-2">
                  <MessageSquare size={16} className="text-muted-foreground" />
                  <span>{r.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
