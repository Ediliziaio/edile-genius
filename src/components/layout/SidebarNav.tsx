import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useImpersonation } from "@/context/ImpersonationContext";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  LayoutDashboard, Bot, BarChart3, Settings,
  Building2, UserPlus, Users, FileText,
  BookUser, Megaphone, type LucideIcon,
  AlertTriangle, MessageCircle, Puzzle, Palette, HardHat, Bath, Home, Layers,
  FileSignature, ShieldCheck, ClipboardList,
  Coins, ChevronDown, Clock, Zap, Activity, CalendarClock,
} from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { differenceInDays } from "date-fns";

interface NavItem { label: string; icon: LucideIcon; href: string; }
interface NavSection {
  header?: string;
  items: NavItem[];
  collapsible?: boolean;
  defaultOpen?: boolean;
  visibilityKey?: string;
}

const companyNav: NavSection[] = [
  { header: "PANNELLO DI CONTROLLO", items: [
    { label: "Dashboard", icon: LayoutDashboard, href: "/app" },
  ]},
  { header: "I MIEI AGENTI", items: [
    { label: "Agenti", icon: Bot, href: "/app/agents" },
    { label: "Automazioni AI", icon: Zap, href: "/app/automations" },
    { label: "Risultati", icon: BarChart3, href: "/app/analytics" },
  ]},
  { header: "VENDITE", items: [
    { label: "Contatti", icon: BookUser, href: "/app/contacts" },
    { label: "Campagne", icon: Megaphone, href: "/app/campaigns" },
    { label: "Monitor Chiamate", icon: Activity, href: "/app/call-monitor" },
    { label: "Chiamate Programmate", icon: CalendarClock, href: "/app/scheduled-calls" },
  ]},
  { header: "VENDITE AVANZATE", collapsible: true, defaultOpen: false, visibilityKey: "preventivi", items: [
    { label: "Preventivi", icon: FileSignature, href: "/app/preventivi" },
    { label: "Template Preventivo", icon: FileText, href: "/app/impostazioni/template-preventivo" },
  ]},
  { header: "OPERATIVITÀ", collapsible: true, defaultOpen: false, visibilityKey: "cantieri", items: [
    { label: "Cantieri", icon: HardHat, href: "/app/cantieri" },
    { label: "Documenti", icon: ShieldCheck, href: "/app/documenti" },
    { label: "Presenze", icon: ClipboardList, href: "/app/presenze" },
  ]},
  { header: "STRUMENTI AI", collapsible: true, defaultOpen: false, visibilityKey: "render", items: [
    { label: "Render Infissi", icon: Palette, href: "/app/render" },
    { label: "Render Bagno", icon: Bath, href: "/app/render-bagno" },
    { label: "Render Facciata", icon: Home, href: "/app/render-facciata" },
    { label: "Render Persiane", icon: Layers, href: "/app/render-persiane" },
    { label: "Render Pavimento", icon: HardHat, href: "/app/render-pavimento" },
  ]},
  { header: "IMPOSTAZIONI", items: [
    { label: "Crediti", icon: Coins, href: "/app/credits" },
    { label: "Integrazioni", icon: Puzzle, href: "/app/integrations" },
    { label: "Account", icon: Settings, href: "/app/settings" },
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
    { label: "Monitoraggio", icon: AlertTriangle, href: "/superadmin/monitoring" },
  ]},
  { header: "PIATTAFORMA", items: [
    { label: "Config Render AI", icon: Palette, href: "/superadmin/render-config" },
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

interface SidebarNavProps {
  onNavigate?: () => void;
}

export default function SidebarNav({ onNavigate }: SidebarNavProps) {
  const { isSuperAdmin } = useAuth();
  const { isImpersonating } = useImpersonation();
  const location = useLocation();
  const isCompanyView = !(isSuperAdmin && !isImpersonating);

  const [creditInfo, setCreditInfo] = useState<CreditInfo | null>(null);
  const [sectionVisibility, setSectionVisibility] = useState<Record<string, boolean>>({});
  const [trialDaysLeft, setTrialDaysLeft] = useState<number | null>(null);

  useEffect(() => {
    if (!isCompanyView) return;
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase.from("profiles").select("company_id").eq("id", user.id).single();
      if (!profile?.company_id) return;
      const companyId = profile.company_id;

      const [creditsRes, cantieriRes, renderRes, companyRes, preventiviRes] = await Promise.all([
        supabase.from("ai_credits").select("balance_eur, total_recharged_eur, total_spent_eur, calls_blocked, alert_threshold_eur").eq("company_id", companyId).single(),
        supabase.from("cantieri").select("id", { count: "exact", head: true }).eq("company_id", companyId),
        supabase.from("render_credits" as any).select("balance", { count: "exact", head: true }).eq("company_id", companyId),
        supabase.from("companies").select("sector, plan, trial_ends_at").eq("id", companyId).single(),
        supabase.from("preventivi" as any).select("id", { count: "exact", head: true }).eq("company_id", companyId),
      ]);

      if (creditsRes.data) setCreditInfo(creditsRes.data as unknown as CreditInfo);

      // Trial countdown
      const company = companyRes.data;
      if (company?.plan === "trial" && company.trial_ends_at) {
        const days = differenceInDays(new Date(company.trial_ends_at), new Date());
        setTrialDaysLeft(Math.max(0, days));
      }

      const hasCantieri = (cantieriRes.count ?? 0) > 0;
      const hasPreventivi = (preventiviRes.count ?? 0) > 0;
      const sector = company?.sector?.toLowerCase() || "";
      const isEdile = ["edilizia", "costruzioni", "impresa_edile", "ristrutturazione"].some(s => sector.includes(s));
      const isSerramenti = ["serramenti", "infissi", "finestre", "showroom"].some(s => sector.includes(s));
      const hasRenderCredits = (renderRes.data as any)?.balance > 0;

      setSectionVisibility({
        cantieri: hasCantieri || isEdile,
        render: isSerramenti || hasRenderCredits,
        preventivi: hasPreventivi || isEdile || isSerramenti,
      });
    };
    fetchData();
  }, [isCompanyView]);

  const sections = (isSuperAdmin && !isImpersonating) ? superadminNav : companyNav.filter(section => {
    if (!section.visibilityKey) return true;
    if (section.items.some(item => location.pathname.startsWith(item.href))) return true;
    return sectionVisibility[section.visibilityKey] ?? false;
  });

  const balanceColor = creditInfo?.calls_blocked
    ? "text-destructive"
    : (creditInfo?.balance_eur || 0) <= (creditInfo?.alert_threshold_eur || 5)
      ? "text-yellow-600"
      : "text-primary";

  const usagePct = creditInfo && creditInfo.total_recharged_eur > 0
    ? (creditInfo.total_spent_eur / creditInfo.total_recharged_eur) * 100 : 0;
  const barColor = usagePct > 80 ? "bg-destructive" : usagePct > 60 ? "bg-yellow-500" : "bg-primary";

  const isItemActive = (href: string) =>
    location.pathname === href ||
    (href !== "/app" && href !== "/superadmin" && location.pathname.startsWith(href + "/"));

  const isSectionActive = (section: NavSection) =>
    section.items.some(item => isItemActive(item.href));

  const renderItems = (items: NavItem[]) => (
    <div className="space-y-0.5">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = isItemActive(item.href);
        return (
          <Link
            key={item.href}
            to={item.href}
            onClick={onNavigate}
            className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              isActive
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <Icon size={18} />
            {item.label}
          </Link>
        );
      })}
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      <div className="p-5">
        <span className="text-lg font-bold text-foreground">
          edilizia<span className="text-primary">.io</span>
        </span>
      </div>

      <nav className="flex-1 px-3 py-2 overflow-auto space-y-5">
        {sections.map((section, si) => {
          if (section.collapsible) {
            const active = isSectionActive(section);
            return (
              <Collapsible key={si} defaultOpen={active || section.defaultOpen}>
                <CollapsibleTrigger className="flex items-center justify-between w-full px-3 mb-2 group">
                  <p className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
                    {section.header}
                  </p>
                  <ChevronDown size={14} className="text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  {renderItems(section.items)}
                </CollapsibleContent>
              </Collapsible>
            );
          }

          return (
            <div key={si}>
              {section.header && (
                <p className="px-3 mb-2 text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
                  {section.header}
                </p>
              )}
              {renderItems(section.items)}
            </div>
          );
        })}
      </nav>

      {/* Trial countdown */}
      {isCompanyView && trialDaysLeft !== null && (
        <div className="mx-3 mb-2 rounded-lg border border-yellow-300 bg-yellow-50 px-3 py-2.5">
          <div className="flex items-center gap-2">
            <Clock size={14} className="text-yellow-600 shrink-0" />
            <p className="text-xs font-semibold text-yellow-800">
              {trialDaysLeft === 0
                ? "Trial scaduto oggi"
                : `${trialDaysLeft} giorn${trialDaysLeft === 1 ? "o" : "i"} di prova rimast${trialDaysLeft === 1 ? "o" : "i"}`}
            </p>
          </div>
        </div>
      )}

      {isCompanyView && creditInfo && (
        <div className="mt-auto border-t border-border px-4 py-4 space-y-2">
          <p className="text-[10px] font-mono font-semibold tracking-wide text-muted-foreground uppercase">Saldo Crediti</p>
          <p className={`text-base font-extrabold ${balanceColor}`}>
            €{Number(creditInfo?.balance_eur ?? 0).toFixed(2)}
          </p>
          <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
            <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${Math.min(usagePct, 100)}%` }} />
          </div>
          {creditInfo.calls_blocked && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-2 mt-1">
              <p className="text-[11px] font-semibold text-destructive flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" /> Agenti bloccati
              </p>
              <p className="text-[10px] text-destructive/80">Saldo esaurito — ricarica</p>
            </div>
          )}
          <Link
            to="/app/credits"
            onClick={onNavigate}
            className={`block w-full text-center text-xs py-1.5 rounded-md font-medium transition-colors ${
              (creditInfo.balance_eur <= (creditInfo.alert_threshold_eur || 5))
                ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                : "bg-muted text-muted-foreground hover:bg-accent"
            }`}
          >
            {creditInfo.balance_eur <= (creditInfo.alert_threshold_eur || 5) ? "⚠️ Ricarica Ora" : "Gestisci Crediti"}
          </Link>
        </div>
      )}
    </div>
  );
}
