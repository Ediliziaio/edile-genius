import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useImpersonation } from "@/context/ImpersonationContext";
import {
  LayoutDashboard, Bot, MessageSquare, BarChart3, Settings,
  CreditCard, HelpCircle, Building2, UserPlus, Users, Key, FileText,
  BookUser, ListChecks, Megaphone, Phone, BookOpen, Coins, type LucideIcon
} from "lucide-react";

interface NavItem {
  label: string;
  icon: LucideIcon;
  href: string;
}

interface NavSection {
  header?: string;
  items: NavItem[];
}

const companyNav: NavSection[] = [
  {
    header: "PRINCIPALE",
    items: [
      { label: "Dashboard", icon: LayoutDashboard, href: "/app" },
      { label: "Agenti AI", icon: Bot, href: "/app/agents" },
      { label: "Conversazioni", icon: MessageSquare, href: "/app/conversations" },
    ],
  },
  {
    header: "CONTATTI",
    items: [
      { label: "Rubrica", icon: BookUser, href: "/app/contacts" },
      { label: "Liste & Gruppi", icon: ListChecks, href: "/app/lists" },
      { label: "Campagne", icon: Megaphone, href: "/app/campaigns" },
    ],
  },
  {
    header: "RISORSE",
    items: [
      { label: "Numeri di Telefono", icon: Phone, href: "/app/phone-numbers" },
      { label: "Knowledge Base", icon: BookOpen, href: "/app/knowledge-base" },
      { label: "Crediti & Utilizzo", icon: Coins, href: "/app/credits" },
    ],
  },
  {
    header: "REPORT",
    items: [
      { label: "Analytics", icon: BarChart3, href: "/app/analytics" },
    ],
  },
  {
    header: "ACCOUNT",
    items: [
      { label: "Impostazioni", icon: Settings, href: "/app/settings" },
      { label: "Piano & Fatturazione", icon: CreditCard, href: "/app/settings/billing" },
      { label: "Supporto", icon: HelpCircle, href: "#" },
    ],
  },
];

const superadminNav: NavSection[] = [
  {
    header: "PRINCIPALE",
    items: [
      { label: "Dashboard", icon: LayoutDashboard, href: "/superadmin" },
      { label: "Aziende", icon: Building2, href: "/superadmin/companies" },
      { label: "Nuova Azienda", icon: UserPlus, href: "/superadmin/companies/new" },
      { label: "Team SuperAdmin", icon: Users, href: "/superadmin/team" },
    ],
  },
  {
    header: "REPORT",
    items: [
      { label: "Analytics Globali", icon: BarChart3, href: "/superadmin/analytics" },
    ],
  },
  {
    header: "ACCOUNT",
    items: [
      { label: "Impostazioni Piattaforma", icon: Settings, href: "/superadmin/platform-settings" },
      { label: "Log Sistema", icon: FileText, href: "/superadmin/logs" },
    ],
  },
];

export default function Sidebar() {
  const { isSuperAdmin } = useAuth();
  const { isImpersonating } = useImpersonation();
  const location = useLocation();
  const sections = (isSuperAdmin && !isImpersonating) ? superadminNav : companyNav;

  return (
    <aside className="w-[240px] shrink-0 flex flex-col h-screen sticky top-0 bg-white border-r border-ink-200">
      {/* Logo */}
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
                  <Link
                    key={item.href}
                    to={item.href}
                    className={`flex items-center gap-3 px-3 py-2 rounded-btn text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-brand-light text-brand-text"
                        : "text-ink-500 hover:bg-ink-50 hover:text-ink-900"
                    }`}
                  >
                    <Icon size={18} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}
