import { useNavigate } from "react-router-dom";
import { Eye, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface Company {
  id: string;
  name: string;
  sector: string | null;
  plan: string | null;
  status: string | null;
  created_at: string | null;
  agents_count?: number;
  calls_month?: number;
}

interface CompanyTableProps {
  companies: Company[];
  loading: boolean;
}

const statusColors: Record<string, string> = {
  active: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  suspended: "bg-red-500/20 text-red-400 border-red-500/30",
  trial: "bg-orange-500/20 text-orange-400 border-orange-500/30",
};

const planLabels: Record<string, string> = {
  starter: "Starter",
  professional: "Professional",
  enterprise: "Enterprise",
};

export default function CompanyTable({ companies, loading }: CompanyTableProps) {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="rounded-xl border border-[hsl(var(--app-border))] bg-[hsl(var(--app-secondary))] p-12 text-center">
        <div className="text-[hsl(var(--app-text-secondary))]">Caricamento...</div>
      </div>
    );
  }

  if (companies.length === 0) {
    return (
      <div className="rounded-xl border border-[hsl(var(--app-border))] bg-[hsl(var(--app-secondary))] p-12 text-center">
        <div className="text-[hsl(var(--app-text-secondary))]">Nessuna azienda trovata</div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[hsl(var(--app-border))] bg-[hsl(var(--app-secondary))] overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="border-[hsl(var(--app-border))] hover:bg-transparent">
            <TableHead className="text-[hsl(var(--app-text-secondary))] bg-[hsl(var(--app-elevated))]">Nome</TableHead>
            <TableHead className="text-[hsl(var(--app-text-secondary))] bg-[hsl(var(--app-elevated))]">Settore</TableHead>
            <TableHead className="text-[hsl(var(--app-text-secondary))] bg-[hsl(var(--app-elevated))]">Piano</TableHead>
            <TableHead className="text-[hsl(var(--app-text-secondary))] bg-[hsl(var(--app-elevated))]">Stato</TableHead>
            <TableHead className="text-[hsl(var(--app-text-secondary))] bg-[hsl(var(--app-elevated))] text-right">Agenti</TableHead>
            <TableHead className="text-[hsl(var(--app-text-secondary))] bg-[hsl(var(--app-elevated))] text-right">Chiamate/mese</TableHead>
            <TableHead className="text-[hsl(var(--app-text-secondary))] bg-[hsl(var(--app-elevated))]">Creata</TableHead>
            <TableHead className="text-[hsl(var(--app-text-secondary))] bg-[hsl(var(--app-elevated))] text-right">Azioni</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {companies.map((company) => (
            <TableRow
              key={company.id}
              className="border-[hsl(var(--app-border))] hover:bg-[hsl(var(--app-elevated))]/50"
            >
              <TableCell className="text-[hsl(var(--app-text-primary))] font-medium">{company.name}</TableCell>
              <TableCell className="text-[hsl(var(--app-text-secondary))]">{company.sector || "—"}</TableCell>
              <TableCell className="text-[hsl(var(--app-text-secondary))]">
                {planLabels[company.plan || "starter"] || company.plan}
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={`text-xs ${statusColors[company.status || "active"] || statusColors.active}`}
                >
                  {company.status || "active"}
                </Badge>
              </TableCell>
              <TableCell className="text-[hsl(var(--app-text-secondary))] text-right">
                {company.agents_count ?? 0}
              </TableCell>
              <TableCell className="text-[hsl(var(--app-text-secondary))] text-right">
                {company.calls_month ?? 0}
              </TableCell>
              <TableCell className="text-[hsl(var(--app-text-secondary))] text-sm">
                {company.created_at
                  ? new Date(company.created_at).toLocaleDateString("it-IT")
                  : "—"}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-[hsl(var(--app-text-secondary))] hover:text-[hsl(var(--app-text-primary))] hover:bg-[hsl(var(--app-elevated))]"
                    onClick={() => navigate(`/superadmin/companies/${company.id}`)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-[hsl(var(--app-text-secondary))] hover:text-[hsl(var(--app-text-primary))] hover:bg-[hsl(var(--app-elevated))]"
                    title="Accedi come azienda"
                    disabled
                  >
                    <LogIn className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
