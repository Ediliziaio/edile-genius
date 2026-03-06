import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { BarChart3, Phone, Clock, TrendingUp, Target } from "lucide-react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { subDays, format, startOfDay, isAfter } from "date-fns";
import { it } from "date-fns/locale";

const RANGES = [
  { label: "7 giorni", days: 7 },
  { label: "30 giorni", days: 30 },
  { label: "90 giorni", days: 90 },
];

export default function AnalyticsPage() {
  const { profile } = useAuth();
  const companyId = profile?.company_id;
  const [rangeDays, setRangeDays] = useState(30);

  const { data: conversations = [] } = useQuery({
    queryKey: ["analytics-conversations", companyId], enabled: !!companyId,
    queryFn: async () => { const { data } = await supabase.from("conversations").select("*").eq("company_id", companyId!).order("started_at", { ascending: false }).limit(1000); return data || []; },
  });

  const { data: agents = [] } = useQuery({
    queryKey: ["analytics-agents", companyId], enabled: !!companyId,
    queryFn: async () => { const { data } = await supabase.from("agents").select("id, name").eq("company_id", companyId!); return data || []; },
  });

  const agentMap = Object.fromEntries(agents.map(a => [a.id, a.name]));
  const cutoff = startOfDay(subDays(new Date(), rangeDays));
  const filtered = conversations.filter(c => c.started_at && isAfter(new Date(c.started_at), cutoff));

  const stats = useMemo(() => {
    const total = filtered.length;
    const avgDuration = total > 0 ? Math.round(filtered.reduce((s, c) => s + (c.duration_sec || 0), 0) / total) : 0;
    const completed = filtered.filter(c => c.status === "completed").length;
    const successRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    const outcomes = filtered.reduce((acc, c) => { if (c.outcome) acc[c.outcome] = (acc[c.outcome] || 0) + 1; return acc; }, {} as Record<string, number>);
    const topOutcome = Object.entries(outcomes).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";
    return { total, avgDuration, successRate, topOutcome };
  }, [filtered]);

  const callsOverTime = useMemo(() => {
    const buckets: Record<string, number> = {};
    for (let i = rangeDays - 1; i >= 0; i--) buckets[format(subDays(new Date(), i), "yyyy-MM-dd")] = 0;
    filtered.forEach(c => { if (c.started_at) { const day = format(new Date(c.started_at), "yyyy-MM-dd"); if (day in buckets) buckets[day]++; } });
    return Object.entries(buckets).map(([date, count]) => ({ date: format(new Date(date), "dd/MM", { locale: it }), chiamate: count }));
  }, [filtered, rangeDays]);

  const outcomeData = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.forEach(c => { if (c.outcome) map[c.outcome] = (map[c.outcome] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [filtered]);

  const agentData = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.forEach(c => { map[c.agent_id] = (map[c.agent_id] || 0) + 1; });
    return Object.entries(map).map(([id, value]) => ({ name: agentMap[id] || id.slice(0, 8), value })).sort((a, b) => b.value - a.value);
  }, [filtered, agentMap]);

  const statCards = [
    { label: "Chiamate totali", value: stats.total, icon: Phone, colorClass: "text-brand bg-brand-light" },
    { label: "Durata media", value: `${stats.avgDuration}s`, icon: Clock, colorClass: "text-status-info bg-status-info-light" },
    { label: "Tasso successo", value: `${stats.successRate}%`, icon: TrendingUp, colorClass: "text-status-success bg-status-success-light" },
    { label: "Esito principale", value: stats.topOutcome, icon: Target, colorClass: "text-status-warning bg-status-warning-light" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-6 h-6 text-brand" />
          <h1 className="text-2xl font-bold text-ink-900">Analytics</h1>
        </div>
        <div className="flex gap-1 rounded-btn p-1 bg-ink-100">
          {RANGES.map(r => (
            <button key={r.days} onClick={() => setRangeDays(r.days)} className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${rangeDays === r.days ? "bg-brand-light text-brand-text" : "text-ink-500 hover:text-ink-700"}`}>
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map(s => (
          <div key={s.label} className="rounded-card p-4 bg-white border border-ink-200 shadow-card">
            <div className="flex items-center gap-2 mb-1">
              <div className={`w-8 h-8 rounded-btn flex items-center justify-center ${s.colorClass}`}><s.icon className="w-4 h-4" /></div>
              <span className="text-xs text-ink-400">{s.label}</span>
            </div>
            <p className="text-xl font-bold text-ink-900">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-card p-5 bg-white border border-ink-200 shadow-card">
          <h3 className="text-sm font-semibold mb-4 text-ink-900">Chiamate nel tempo</h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={callsOverTime}>
              <CartesianGrid strokeDasharray="3 3" stroke="#D9E2EA" />
              <XAxis dataKey="date" tick={{ fill: "#637485", fontSize: 10 }} />
              <YAxis tick={{ fill: "#637485", fontSize: 10 }} />
              <Tooltip contentStyle={{ backgroundColor: "#fff", border: "1px solid #D9E2EA", borderRadius: 10, color: "#0D1117" }} />
              <Area type="monotone" dataKey="chiamate" stroke="#3ECF6E" fill="rgba(62,207,110,0.1)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-card p-5 bg-white border border-ink-200 shadow-card">
          <h3 className="text-sm font-semibold mb-4 text-ink-900">Distribuzione esiti</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={outcomeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#D9E2EA" />
              <XAxis dataKey="name" tick={{ fill: "#637485", fontSize: 10 }} />
              <YAxis tick={{ fill: "#637485", fontSize: 10 }} />
              <Tooltip contentStyle={{ backgroundColor: "#fff", border: "1px solid #D9E2EA", borderRadius: 10, color: "#0D1117" }} />
              <Bar dataKey="value" fill="#3ECF6E" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-card p-5 lg:col-span-2 bg-white border border-ink-200 shadow-card">
          <h3 className="text-sm font-semibold mb-4 text-ink-900">Chiamate per agente</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={agentData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#D9E2EA" />
              <XAxis type="number" tick={{ fill: "#637485", fontSize: 10 }} />
              <YAxis dataKey="name" type="category" tick={{ fill: "#637485", fontSize: 10 }} width={120} />
              <Tooltip contentStyle={{ backgroundColor: "#fff", border: "1px solid #D9E2EA", borderRadius: 10, color: "#0D1117" }} />
              <Bar dataKey="value" fill="#3B82F6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
