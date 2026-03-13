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
  app: "Pannello di Controllo",
  superadmin: "SuperAdmin",
  agents: "Tutti gli Agenti",
  new: "Crea Nuovo",
  templates: "Template",
  "phone-numbers": "Telefono e WhatsApp",
  buy: "Acquista",
  whatsapp: "WhatsApp",
  "knowledge-base": "Archivio Conoscenze",
  conversations: "Conversazioni",
  contacts: "Rubrica",
  lists: "Liste",
  campaigns: "Campagne",
  analytics: "Report e Statistiche",
  credits: "Crediti e Piano",
  settings: "Account",
  companies: "Aziende",
  team: "Team",
  logs: "Log Sistema",
  "platform-settings": "Impostazioni Piattaforma",
  "render-config": "Config Render",
  render: "Render AI",
  gallery: "Gallery",
  cantieri: "Gestione Cantieri",
  configurazione: "Configurazione",
  preventivi: "Preventivi",
  documenti: "Documenti e Scadenze",
  presenze: "Presenze",
  import: "Importa",
};

export default function AppBreadcrumb() {
  const { pathname } = useLocation();
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length <= 1) return null;

  const isUuid = (s: string) => /^[0-9a-f]{8}-/.test(s);

  const crumbs = segments.map((seg, i) => {
    const path = "/" + segments.slice(0, i + 1).join("/");
    const label = isUuid(seg) ? "Dettaglio" : (labelMap[seg] || seg);
    const isLast = i === segments.length - 1;
    return { path, label, isLast };
  });

  return (
    <Breadcrumb className="mb-4 hidden md:block">
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
