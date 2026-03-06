import { useMemo } from "react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { format, subDays, isAfter, parseISO } from "date-fns";
import { it } from "date-fns/locale";
import type { Tables } from "@/integrations/supabase/types";

interface Props {
  conversations: Tables<"conversations">[];
}

const OUTCOME_COLORS: Record<string, string> = {
  appointment: "#3ECF6E",
  qualified: "#3B82F6",
  interested: "#F59E0B",
  not_interested: "#EF4444",
  voicemail: "#8A9BAC",
  no_answer: "#B8C5D0",
};

export default function AgentAnalyticsTab({ conversations }: Props) {
  const last30 = useMemo(() => {
    const cutoff = subDays(new Date(), 30);
    return conversations.filter((c) => c.started_at && isAfter(parseISO(c.started_at), cutoff));
  }, [conversations]);

  const callsOverTime = useMemo(() => {
    const map: Record<string, number> = {};
    last30.forEach((c) => {
      if (!c.started_at) return;
      const day = format(parseISO(c.started_at), "dd/MM");
      map[day] = (map[day] || 0) + 1;
    });
    return Object.entries(map).map(([day, count]) => ({ day, chiamate: count }));
  }, [last30]);

  const outcomeData = useMemo(() => {
    const map: Record<string, number> = {};
    last30.forEach((c) => { const o = c.outcome || "sconosciuto"; map[o] = (map[o] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [last30]);

  const durationData = useMemo(() => {
    const buckets: Record<string, number> = { "0-30s": 0, "30-60s": 0, "1-2m": 0, "2-5m": 0, "5m+": 0 };
    last30.forEach((c) => {
      const d = c.duration_sec || 0;
      if (d <= 30) buckets["0-30s"]++;
      else if (d <= 60) buckets["30-60s"]++;
      else if (d <= 120) buckets["1-2m"]++;
      else if (d <= 300) buckets["2-5m"]++;
      else buckets["5m+"]++;
    });
    return Object.entries(buckets).map(([range, count]) => ({ range, count }));
  }, [last30]);

  const avgDuration = last30.length > 0 ? Math.round(last30.reduce((s, c) => s + (c.duration_sec || 0), 0) / last30.length) : 0;
  const conversionRate = last30.length > 0 ? Math.round((last30.filter((c) => c.outcome === "appointment" || c.outcome === "qualified").length / last30.length) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Chiamate (30gg)", value: last30.length },
          { label: "Durata media", value: `${avgDuration}s` },
          { label: "Tasso conversione", value: `${conversionRate}%` },
          { label: "Appuntamenti", value: last30.filter((c) => c.outcome === "appointment").length },
        ].map((s) => (
          <div key={s.label} className="rounded-card p-4 bg-white border border-ink-200 shadow-card">
            <p className="text-xs text-ink-400">{s.label}</p>
            <p className="text-xl font-bold text-ink-900 mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Calls Over Time */}
      <div className="rounded-card p-5 bg-white border border-ink-200 shadow-card">
        <h3 className="text-sm font-semibold text-ink-900 mb-4">Chiamate nel tempo (30gg)</h3>
        {callsOverTime.length === 0 ? (
          <p className="text-sm text-ink-400 py-8 text-center">Nessun dato disponibile</p>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={callsOverTime}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EDF1F5" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#8A9BAC" }} />
              <YAxis tick={{ fontSize: 11, fill: "#8A9BAC" }} allowDecimals={false} />
              <Tooltip />
              <Area type="monotone" dataKey="chiamate" stroke="#3ECF6E" fill="#3ECF6E" fillOpacity={0.15} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Outcomes */}
        <div className="rounded-card p-5 bg-white border border-ink-200 shadow-card">
          <h3 className="text-sm font-semibold text-ink-900 mb-4">Distribuzione Esiti</h3>
          {outcomeData.length === 0 ? (
            <p className="text-sm text-ink-400 py-8 text-center">Nessun dato</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={outcomeData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {outcomeData.map((entry, i) => (
                    <Cell key={i} fill={OUTCOME_COLORS[entry.name] || "#B8C5D0"} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Duration Distribution */}
        <div className="rounded-card p-5 bg-white border border-ink-200 shadow-card">
          <h3 className="text-sm font-semibold text-ink-900 mb-4">Distribuzione Durata</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={durationData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EDF1F5" />
              <XAxis dataKey="range" tick={{ fontSize: 11, fill: "#8A9BAC" }} />
              <YAxis tick={{ fontSize: 11, fill: "#8A9BAC" }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
