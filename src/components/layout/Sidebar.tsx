import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useImpersonation } from "@/context/ImpersonationContext";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  LayoutDashboard, Bot, MessageSquare, BarChart3, Settings,
  CreditCard, HelpCircle, Building2, UserPlus, Users, FileText,
  BookUser, ListChecks, Megaphone, Phone, BookOpen, Coins, type LucideIcon,
  AlertTriangle, MessageCircle, Puzzle, Paintbrush, Palette
} from "lucide-react";

interface NavItem { label: string; icon: LucideIcon; href: string; }
interface NavSection { header?: string; items: NavItem[]; }

const companyNav: NavSection[] = [
  { header: "PRINCIPALE", items: [
    { label: "Dashboard", icon: LayoutDashboard, href: "/app" },
    { label: "Agenti AI", icon: Bot, href: "/app/agents" },
  ]},
  { header: "AUTOMAZIONI", items: [
    { label: "Template Agenti", icon: Puzzle, href: "/app/templates" },
  ]},
  { header: "COMUNICAZIONE", items: [
    { label: "Numeri di Telefono", icon: Phone, href: "/app/phone-numbers" },
    { label: "WhatsApp", icon: MessageCircle, href: "/app/whatsapp" },
    { label: "Knowledge Base", icon: BookOpen, href: "/app/knowledge-base" },
    { label: "Conversazioni", icon: MessageSquare, href: "/app/conversations" },
  ]},
  { header: "CONTATTI", items: [
    { label: "Rubrica", icon: BookUser, href: "/app/contacts" },
    { label: "Liste & Gruppi", icon: ListChecks, href: "/app/lists" },
    { label: "Campagne", icon: Megaphone, href: "/app/campaigns" },
  ]},
  { header: "STRUMENTI VENDITA", items: [
    { label: "Render AI", icon: Paintbrush, href: "/app/render" },
  ]},
  { header: "REPORT", items: [
    { label: "Analytics", icon: BarChart3, href: "/app/analytics" },
    { label: "Crediti & Utilizzo", icon: Coins, href: "/app/credits" },
  ]},
  { header: "ACCOUNT", items: [
    { label: "Impostazioni", icon: Settings, href: "/app/settings" },
    { label: "Supporto", icon: HelpCircle, href: "#" },
  ]},
];

const superadminNav: NavSection[] = [
  { header: "PRINCIPALE", items: [
    { label: "Dashboard", icon: LayoutDashboard, href: "/superadmin" },
    { label: "Aziende", icon: Building2, href: "/superadmin/companies" },
    { label: "Nuova Azienda", icon: UserPlus, href: "/superadmin/companies/new" },
    { label: "WhatsApp", icon: MessageCircle, href: "/superadmin/whatsapp" },
    { label: "Team SuperAdmin", icon: Users, href: "/superadmin/team" },
  ]},
  { header: "AUTOMAZIONI", items: [
    { label: "Template Agenti", icon: Puzzle, href: "/superadmin/templates" },
  ]},
  { header: "REPORT", items: [
    { label: "Analytics Globali", icon: BarChart3, href: "/superadmin/analytics" },
  ]},
  { header: "ACCOUNT", items: [
    { label: "Impostazioni Piattaforma", icon: Settings, href: "/superadmin/platform-settings" },
    { label: "Log Sistema", icon: FileText, href: "/superadmin/logs" },
  ]},
];

interface CreditInfo {
  balance_eur: number;
  total_recharged_eur: number;
  total_spent_eur: number;
  calls_blocked: boolean;
  alert_threshold_eur: number;
}

export default function Sidebar() {
  const { isSuperAdmin } = useAuth();
  const { isImpersonating } = useImpersonation();
  const location = useLocation();
  const sections = (isSuperAdmin && !isImpersonating) ? superadminNav : companyNav;
  const isCompanyView = !(isSuperAdmin && !isImpersonating);

  const [creditInfo, setCreditInfo] = useState<CreditInfo | null>(null);

  useEffect(() => {
    if (!isCompanyView) return;
    const fetchCredits = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase.from("profiles").select("company_id").eq("id", user.id).single();
      if (!profile?.company_id) return;
      const { data } = await supabase.from("ai_credits").select("balance_eur, total_recharged_eur, total_spent_eur, calls_blocked, alert_threshold_eur").eq("company_id", profile.company_id).single();
      if (data) setCreditInfo(data as unknown as CreditInfo);
    };
    fetchCredits();
  }, [isCompanyView]);

  const balanceColor = creditInfo?.calls_blocked
    ? "text-destructive"
    : (creditInfo?.balance_eur || 0) <= (creditInfo?.alert_threshold_eur || 5)
      ? "text-yellow-600"
      : "text-primary";

  const usagePct = creditInfo && creditInfo.total_recharged_eur > 0
    ? (creditInfo.total_spent_eur / creditInfo.total_recharged_eur) * 100 : 0;
  const barColor = usagePct > 80 ? "bg-destructive" : usagePct > 60 ? "bg-yellow-500" : "bg-primary";

  return (
    <aside className="w-[240px] shrink-0 flex flex-col h-screen sticky top-0 bg-white border-r border-ink-200">
      <div className="p-5">
        <span className="text-lg font-bold text-ink-900">
          edilizia<span className="text-brand">.io</span>
        </span>
      </div>

      <nav className="flex-1 px-3 py-2 overflow-auto space-y-5">
        {sections.map((section, si) => (
          <div key={si}>
            {section.header && (
              <p className="px-3 mb-2 text-[10px] font-semibold tracking-widest text-ink-400 uppercase">
                {section.header}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href ||
                  (item.href !== "/app" && item.href !== "/superadmin" && location.pathname.startsWith(item.href));
                return (
                  <Link key={item.href} to={item.href} className={`flex items-center gap-3 px-3 py-2 rounded-btn text-sm font-medium transition-colors ${isActive ? "bg-brand-light text-brand-text" : "text-ink-500 hover:bg-ink-50 hover:text-ink-900"}`}>
                    <Icon size={18} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Credit balance footer — company view only */}
      {isCompanyView && creditInfo && (
        <div className="mt-auto border-t border-ink-100 px-4 py-4 space-y-2">
          <p className="text-[10px] font-mono font-semibold tracking-wide text-ink-400 uppercase">Saldo Crediti</p>
          <p className={`text-base font-extrabold ${balanceColor}`}>
            €{creditInfo.balance_eur.toFixed(2)}
          </p>
          <div className="w-full h-1.5 rounded-full bg-ink-100 overflow-hidden">
            <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${Math.min(usagePct, 100)}%` }} />
          </div>

          {creditInfo.calls_blocked ? (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-2 mt-1">
              <p className="text-[11px] font-semibold text-destructive flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" /> Agenti bloccati
              </p>
              <p className="text-[10px] text-destructive/80">Saldo esaurito — ricarica</p>
            </div>
          ) : null}

          <Link
            to="/app/credits"
            className={`block w-full text-center text-xs py-1.5 rounded-btn font-medium transition-colors ${
              (creditInfo.balance_eur <= (creditInfo.alert_threshold_eur || 5))
                ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                : "bg-ink-50 text-ink-600 hover:bg-ink-100"
            }`}
          >
            {creditInfo.balance_eur <= (creditInfo.alert_threshold_eur || 5) ? "⚠️ Ricarica Ora" : "Gestisci Crediti"}
          </Link>
        </div>
      )}
    </aside>
  );
}
