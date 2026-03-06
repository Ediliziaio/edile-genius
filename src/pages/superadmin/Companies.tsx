import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import CompanyTable from "@/components/superadmin/CompanyTable";

interface CompanyRow {
  id: string;
  name: string;
  sector: string | null;
  plan: string | null;
  status: string | null;
  created_at: string | null;
  agents_count?: number;
  calls_month?: number;
}

const PAGE_SIZE = 10;

export default function Companies() {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState<CompanyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sectorFilter, setSectorFilter] = useState("all");
  const [planFilter, setPlanFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(0);

  useEffect(() => {
    async function fetchCompanies() {
      setLoading(true);
      try {
        const { data: companiesData } = await supabase
          .from("companies")
          .select("*")
          .order("created_at", { ascending: false });

        const { data: agentsData } = await supabase
          .from("agents")
          .select("company_id, status, calls_this_month");

        const agentsByCompany = (agentsData || []).reduce<Record<string, { count: number; calls: number }>>((acc, a) => {
          if (!acc[a.company_id]) acc[a.company_id] = { count: 0, calls: 0 };
          acc[a.company_id].count++;
          acc[a.company_id].calls += a.calls_this_month || 0;
          return acc;
        }, {});

        const rows: CompanyRow[] = (companiesData || []).map((c) => ({
          id: c.id,
          name: c.name,
          sector: c.sector,
          plan: c.plan,
          status: c.status,
          created_at: c.created_at,
          agents_count: agentsByCompany[c.id]?.count || 0,
          calls_month: agentsByCompany[c.id]?.calls || 0,
        }));

        setCompanies(rows);
      } catch (err) {
        console.error("Error fetching companies:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchCompanies();
  }, []);

  const sectors = useMemo(
    () => [...new Set(companies.map((c) => c.sector).filter(Boolean))] as string[],
    [companies]
  );

  const filtered = useMemo(() => {
    return companies.filter((c) => {
      if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (sectorFilter !== "all" && c.sector !== sectorFilter) return false;
      if (planFilter !== "all" && c.plan !== planFilter) return false;
      if (statusFilter !== "all" && c.status !== statusFilter) return false;
      return true;
    });
  }, [companies, search, sectorFilter, planFilter, statusFilter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[hsl(var(--app-text-primary))]">Aziende</h1>
          <p className="text-sm text-[hsl(var(--app-text-secondary))] mt-1">
            Gestisci le aziende della piattaforma
          </p>
        </div>
        <Button
          onClick={() => navigate("/superadmin/companies/new")}
          className="bg-[hsl(var(--app-accent))] hover:bg-[hsl(var(--app-accent))]/90 text-white"
        >
          <Plus className="mr-2 h-4 w-4" /> Nuova Azienda
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--app-text-secondary))]" />
          <Input
            placeholder="Cerca per nome..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            className="pl-10 bg-[hsl(var(--app-secondary))] border-[hsl(var(--app-border))] text-[hsl(var(--app-text-primary))] placeholder:text-[hsl(var(--app-text-secondary))]"
          />
        </div>
        <Select value={sectorFilter} onValueChange={(v) => { setSectorFilter(v); setPage(0); }}>
          <SelectTrigger className="w-[160px] bg-[hsl(var(--app-secondary))] border-[hsl(var(--app-border))] text-[hsl(var(--app-text-primary))]">
            <SelectValue placeholder="Settore" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tutti i settori</SelectItem>
            {sectors.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={planFilter} onValueChange={(v) => { setPlanFilter(v); setPage(0); }}>
          <SelectTrigger className="w-[160px] bg-[hsl(var(--app-secondary))] border-[hsl(var(--app-border))] text-[hsl(var(--app-text-primary))]">
            <SelectValue placeholder="Piano" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tutti i piani</SelectItem>
            <SelectItem value="starter">Starter</SelectItem>
            <SelectItem value="professional">Professional</SelectItem>
            <SelectItem value="enterprise">Enterprise</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(0); }}>
          <SelectTrigger className="w-[160px] bg-[hsl(var(--app-secondary))] border-[hsl(var(--app-border))] text-[hsl(var(--app-text-primary))]">
            <SelectValue placeholder="Stato" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tutti gli stati</SelectItem>
            <SelectItem value="active">Attivo</SelectItem>
            <SelectItem value="trial">Trial</SelectItem>
            <SelectItem value="suspended">Sospeso</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <CompanyTable companies={paged} loading={loading} />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-[hsl(var(--app-text-secondary))]">
            {filtered.length} risultati — pagina {page + 1} di {totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
              className="border-[hsl(var(--app-border))] text-[hsl(var(--app-text-primary))]"
            >
              Precedente
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
              className="border-[hsl(var(--app-border))] text-[hsl(var(--app-text-primary))]"
            >
              Successiva
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
