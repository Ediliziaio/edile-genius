import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyId } from '@/hooks/useCompanyId';

interface Props {
  balanceConv: number;
  forecastDays: number | null;
  renderCredits: number;
}

export function ForecastWidget({ balanceConv, forecastDays, renderCredits }: Props) {
  const companyId = useCompanyId();
  const [dailyUsage, setDailyUsage] = useState<{ day: string; conv: number }[]>([]);

  useEffect(() => {
    if (!companyId) return;
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();

    supabase.from('ai_credit_usage')
      .select('created_at, cost_billed_total')
      .eq('company_id', companyId)
      .eq('product_type', 'vocal')
      .gte('created_at', sevenDaysAgo)
      .then(({ data }) => {
        if (!data) return;

        // Raggruppa per giorno e conta conversazioni
        const byDay: Record<string, number> = {};
        data.forEach(row => {
          const day = row.created_at.slice(0, 10);
          byDay[day] = (byDay[day] || 0) + 1;
        });

        const sorted = Object.entries(byDay)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([day, conv]) => ({
            day: new Intl.DateTimeFormat('it-IT', { weekday: 'short', day: 'numeric' })
              .format(new Date(day)),
            conv,
          }));
        setDailyUsage(sorted);
      });
  }, [companyId]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Mini bar chart */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="text-sm">Consumo ultimi 7 giorni</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={dailyUsage}>
              <XAxis dataKey="day" tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="conv" fill="hsl(var(--primary))" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Numeri chiave */}
      <Card>
        <CardContent className="p-4 space-y-4 pt-4">
          <div>
            <p className="text-xs text-muted-foreground">🎙️ Conversazioni rimaste</p>
            <p className="text-2xl font-bold">{balanceConv.toLocaleString('it-IT')}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">🖼️ Render rimasti</p>
            <p className="text-2xl font-bold">{renderCredits}</p>
          </div>
          {forecastDays !== null && forecastDays < 999 && (
            <div className={forecastDays <= 7 ? 'text-red-600' : 'text-muted-foreground'}>
              <p className="text-xs">⏱ Autonomia stimata</p>
              <p className="text-lg font-semibold">~{forecastDays} giorni</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
