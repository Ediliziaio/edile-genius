import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Bot, BookUser, Megaphone, MessageSquare, Search } from "lucide-react";
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
  icon: typeof Bot;
}

export default function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [agents, setAgents] = useState<SearchResult[]>([]);
  const [contacts, setContacts] = useState<SearchResult[]>([]);
  const [campaigns, setCampaigns] = useState<SearchResult[]>([]);
  const [conversations, setConversations] = useState<SearchResult[]>([]);
  const navigate = useNavigate();
  const companyId = useCompanyId();

  // Cmd+K shortcut
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

  const hasResults = agents.length + contacts.length + campaigns.length + conversations.length > 0;

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Cerca agenti, contatti, campagne…" value={query} onValueChange={setQuery} />
      <CommandList>
        {query.length >= 2 && !hasResults && <CommandEmpty>Nessun risultato trovato.</CommandEmpty>}
        {query.length < 2 && <CommandEmpty>Scrivi almeno 2 caratteri per cercare…</CommandEmpty>}

        {agents.length > 0 && (
          <CommandGroup heading="Agenti">
            {agents.map((r) => (
              <CommandItem key={r.id} onSelect={() => select(r.href)} className="cursor-pointer gap-2">
                <Bot size={16} className="text-muted-foreground" />
                <span>{r.label}</span>
                {r.sublabel && <span className="ml-auto text-xs text-muted-foreground">{r.sublabel}</span>}
              </CommandItem>
            ))}
          </CommandGroup>
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
