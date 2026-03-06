import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import {
  LayoutDashboard, Bot, MessageSquare, BarChart3, Settings,
  CreditCard, HelpCircle, Building2, UserPlus, Users, Key, FileText
} from "lucide-react";

const companyNav = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/app" },
  { label: "Agenti AI", icon: Bot, href: "/app/agents" },
  { label: "Conversazioni", icon: MessageSquare, href: "/app/conversations" },
  { label: "Analytics", icon: BarChart3, href: "/app/analytics" },
  { divider: true },
  { label: "Impostazioni", icon: Settings, href: "/app/settings" },
  { label: "Piano & Fatturazione", icon: CreditCard, href: "/app/settings/billing" },
  { divider: true },
  { label: "Supporto", icon: HelpCircle, href: "#" },
] as const;

const superadminNav = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/superadmin" },
  { label: "Aziende", icon: Building2, href: "/superadmin/companies" },
  { label: "Nuova Azienda", icon: UserPlus, href: "/superadmin/companies/new" },
  { label: "Team SuperAdmin", icon: Users, href: "/superadmin/team" },
  { divider: true },
  { label: "Analytics Globali", icon: BarChart3, href: "/superadmin/analytics" },
  { label: "Impostazioni", icon: Settings, href: "/superadmin/settings" },
  { divider: true },
  { label: "API Keys", icon: Key, href: "/superadmin/api-keys" },
  { label: "Log Sistema", icon: FileText, href: "/superadmin/logs" },
] as const;

export default function Sidebar() {
  const { isSuperAdmin } = useAuth();
  const location = useLocation();
  const nav = isSuperAdmin ? superadminNav : companyNav;

  return (
    <aside
      className="w-[240px] shrink-0 flex flex-col h-screen sticky top-0"
      style={{
        backgroundColor: "hsl(var(--app-bg-secondary))",
        borderRight: "1px solid hsl(var(--app-border-subtle))",
      }}
    >
      <div className="p-4">
        <span className="text-base font-semibold" style={{ color: "hsl(var(--app-text-primary))" }}>
          EdiliziaInCloud<span style={{ color: "hsl(var(--app-brand))" }}>.</span>
        </span>
      </div>

      <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-auto">
        {nav.map((item, i) => {
          if ("divider" in item) {
            return (
              <div
                key={`d-${i}`}
                className="my-3 h-px"
                style={{ backgroundColor: "hsl(var(--app-border-subtle))" }}
              />
            );
          }

          const Icon = item.icon;
          const isActive = location.pathname === item.href ||
            (item.href !== "/app" && item.href !== "/superadmin" && location.pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              to={item.href}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{
                backgroundColor: isActive ? "hsl(var(--app-brand-dim))" : "transparent",
                color: isActive ? "hsl(var(--app-brand))" : "hsl(var(--app-text-secondary))",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = "hsl(var(--app-bg-elevated))";
                  e.currentTarget.style.color = "hsl(var(--app-text-primary))";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.color = "hsl(var(--app-text-secondary))";
                }
              }}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
