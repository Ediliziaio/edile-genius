import { useLocation, Link } from "react-router-dom";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const labelMap: Record<string, string> = {
  app: "Dashboard",
  superadmin: "SuperAdmin",
  agents: "Agenti AI",
  new: "Nuovo",
  templates: "Template",
  "phone-numbers": "Numeri Telefono",
  buy: "Acquista",
  whatsapp: "WhatsApp",
  "knowledge-base": "Knowledge Base",
  conversations: "Conversazioni",
  contacts: "Rubrica",
  lists: "Liste",
  campaigns: "Campagne",
  analytics: "Analytics",
  credits: "Crediti",
  settings: "Impostazioni",
  companies: "Aziende",
  team: "Team",
  logs: "Log Sistema",
  "platform-settings": "Impostazioni Piattaforma",
  "render-config": "Config Render",
  render: "Render AI",
  gallery: "Gallery",
};

export default function AppBreadcrumb() {
  const { pathname } = useLocation();
  const segments = pathname.split("/").filter(Boolean);

  // Only show for nested pages (more than 1 segment)
  if (segments.length <= 1) return null;

  // Check if a segment looks like a UUID
  const isUuid = (s: string) => /^[0-9a-f]{8}-/.test(s);

  const crumbs = segments.map((seg, i) => {
    const path = "/" + segments.slice(0, i + 1).join("/");
    const label = isUuid(seg) ? "Dettaglio" : (labelMap[seg] || seg);
    const isLast = i === segments.length - 1;
    return { path, label, isLast };
  });

  return (
    <Breadcrumb className="mb-4">
      <BreadcrumbList>
        {crumbs.map((c, i) => (
          <BreadcrumbItem key={c.path}>
            {i > 0 && <BreadcrumbSeparator />}
            {c.isLast ? (
              <BreadcrumbPage>{c.label}</BreadcrumbPage>
            ) : (
              <BreadcrumbLink asChild>
                <Link to={c.path}>{c.label}</Link>
              </BreadcrumbLink>
            )}
          </BreadcrumbItem>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
