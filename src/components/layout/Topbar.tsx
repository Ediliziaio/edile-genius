import { useAuth } from "@/context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { Bell, LogOut, Menu, Search, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useIsMobile } from "@/hooks/use-mobile";

interface TopbarProps {
  onMenuOpen?: () => void;
}

const pageTitleMap: Record<string, string> = {
  dashboard: "Dashboard",
  agents: "Agenti",
  conversations: "Conversazioni",
  contacts: "Rubrica",
  campaigns: "Campagne",
  analytics: "Report",
  credits: "Crediti",
  settings: "Account",
  render: "Render AI",
  "render-bagno": "Render Bagno",
  "render-stanza": "Render Stanza",
  "render-tetto": "Render Tetto",
  "render-facciata": "Render Facciata",
  "render-persiane": "Render Persiane",
  "render-pavimento": "Render Pavimento",
  cantieri: "Cantieri",
  preventivi: "Preventivi",
  integrations: "Integrazioni",
  templates: "Template",
  "phone-numbers": "Telefono",
  "knowledge-base": "Knowledge Base",
  automations: "Automazioni",
  // Superadmin
  superadmin: "Dashboard SA",
  companies: "Aziende",
  "platform-settings": "Impostazioni",
  "render-config": "Config Render",
  logs: "Log Sistema",
  team: "Team",
  whatsapp: "WhatsApp",
  monitoring: "Monitoraggio",
  "api-keys": "API Keys",
};

export default function Topbar({ onMenuOpen }: TopbarProps) {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isMobile = useIsMobile();

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  const initials = profile?.full_name
    ? profile.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : profile?.email?.slice(0, 2).toUpperCase() ?? "U";

  // Derive page title from pathname for mobile
  const segments = pathname.split("/").filter(Boolean);
  const lastMeaningful = segments.find((s, i) => i >= 1 && !/^[0-9a-f]{8}-/.test(s));
  const pageTitle = lastMeaningful ? (pageTitleMap[lastMeaningful] || "") : "";

  return (
    <header className="h-14 shrink-0 flex items-center justify-between px-4 md:px-6 bg-card border-b border-border">
      <div className="flex items-center gap-2 min-w-0">
        {isMobile && (
          <button
            onClick={onMenuOpen}
            className="p-2.5 -ml-1 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <Menu size={20} />
          </button>
        )}
        {isMobile && pageTitle && (
          <span className="text-sm font-semibold text-foreground truncate">{pageTitle}</span>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        {/* Cmd+K search trigger */}
        <button
          onClick={() => {
            document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }));
          }}
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-md border border-border bg-muted/50 text-muted-foreground text-xs hover:bg-muted transition-colors"
        >
          <Search size={14} />
          <span>Cerca…</span>
          <kbd className="ml-2 pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-card px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
            ⌘K
          </kbd>
        </button>

        <button className="p-2.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center">
          <Bell size={18} />
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold bg-primary/10 text-primary min-w-[44px] min-h-[44px]">
              {initials}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem className="gap-2 text-sm cursor-pointer">
              <User size={14} /> Profilo
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="gap-2 text-sm cursor-pointer text-destructive">
              <LogOut size={14} /> Esci
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
