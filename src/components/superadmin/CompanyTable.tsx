import { useNavigate } from "react-router-dom";
import { Eye, LogIn } from "lucide-react";
import { useImpersonation } from "@/context/ImpersonationContext";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface Company { id: string; name: string; sector: string | null; plan: string | null; status: string | null; created_at: string | null; agents_count?: number; calls_month?: number; }
interface CompanyTableProps { companies: Company[]; loading: boolean; }

const statusColors: Record<string, string> = {
  active: "bg-status-success-light text-status-success",
  suspended: "bg-status-error-light text-status-error",
  trial: "bg-status-warning-light text-status-warning",
};
const planLabels: Record<string, string> = { starter: "Starter", professional: "Professional", enterprise: "Enterprise" };

export default function CompanyTable({ companies, loading }: CompanyTableProps) {
  const navigate = useNavigate();
  const { startImpersonation } = useImpersonation();

  const handleImpersonate = (company: Company) => {
    startImpersonation(company.id, company.name);
    navigate("/app");
  };

  if (loading) return <div className="rounded-card border border-ink-200 bg-white p-12 text-center shadow-card"><div className="text-ink-500">Caricamento...</div></div>;
  if (companies.length === 0) return <div className="rounded-card border border-ink-200 bg-white p-12 text-center shadow-card"><div className="text-ink-500">Nessuna azienda trovata</div></div>;

  return (
    <div className="rounded-card border border-ink-200 bg-white overflow-hidden shadow-card">
      <Table>
        <TableHeader>
          <TableRow className="bg-ink-50 hover:bg-ink-50">
            <TableHead className="text-ink-500">Nome</TableHead>
            <TableHead className="text-ink-500">Settore</TableHead>
            <TableHead className="text-ink-500">Piano</TableHead>
            <TableHead className="text-ink-500">Stato</TableHead>
            <TableHead className="text-ink-500 text-right">Agenti</TableHead>
            <TableHead className="text-ink-500 text-right">Chiamate/mese</TableHead>
            <TableHead className="text-ink-500">Creata</TableHead>
            <TableHead className="text-ink-500 text-right">Azioni</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {companies.map((company) => (
            <TableRow key={company.id} className="hover:bg-ink-50">
              <TableCell className="text-ink-900 font-medium">{company.name}</TableCell>
              <TableCell className="text-ink-500">{company.sector || "—"}</TableCell>
              <TableCell className="text-ink-500">{planLabels[company.plan || "starter"] || company.plan}</TableCell>
              <TableCell><Badge variant="outline" className={`text-xs ${statusColors[company.status || "active"] || statusColors.active}`}>{company.status || "active"}</Badge></TableCell>
              <TableCell className="text-ink-500 text-right">{company.agents_count ?? 0}</TableCell>
              <TableCell className="text-ink-500 text-right">{company.calls_month ?? 0}</TableCell>
              <TableCell className="text-ink-500 text-sm">{company.created_at ? new Date(company.created_at).toLocaleDateString("it-IT") : "—"}</TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-ink-400 hover:text-ink-900 hover:bg-ink-100" onClick={() => navigate(`/superadmin/companies/${company.id}`)}><Eye className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-ink-400 hover:text-ink-900 hover:bg-ink-100" title="Accedi come azienda" onClick={() => handleImpersonate(company)}><LogIn className="h-4 w-4" /></Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
