import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyId } from '@/hooks/useCompanyId';

// Conversione: 1 conversazione = 2.5 min medi al costo base €0.065/min
// Piano Starter default
const DEFAULT_EUR_PER_CONV = 0.65;

export interface ModuleSub {
  module: string;
  plan_id: string | null;
  status: string;
  monthly_units: number;
  units_used_month: number;
  overage_rate_eur: number;
  price_eur: number;
}

export interface CreditsState {
  balance_eur: number;
  balance_conv: number;      // Conversazioni stimate rimanenti
  calls_blocked: boolean;
  min_reserve_eur: number;
  forecast_days_left: number | null;
  alert_threshold_eur: number;
  is_loading: boolean;
  vocal_sub: ModuleSub | null;
  render_credits: number;    // Render rimanenti dal render_credits
  preventivi_active: boolean;
  automazioni_active: boolean;
}

export function useCredits() {
  const companyId = useCompanyId();
  const [state, setState] = useState<CreditsState>({
    balance_eur: 0, balance_conv: 0, calls_blocked: false,
    min_reserve_eur: 2, forecast_days_left: null,
    alert_threshold_eur: 5, is_loading: true,
    vocal_sub: null, render_credits: 0,
    preventivi_active: false, automazioni_active: false,
  });

  const fetchAll = useCallback(async () => {
    if (!companyId) return;

    const [creditsRes, subsRes, renderRes] = await Promise.all([
      supabase.from('ai_credits').select('*').eq('company_id', companyId).single(),
      supabase.from('company_subscriptions')
        .select('*').eq('company_id', companyId).eq('status', 'active'),
      supabase.from('render_credits')
        .select('balance').eq('company_id', companyId).maybeSingle(),
    ]);

    const credits = creditsRes.data;
    const subs = subsRes.data || [];
    const vocalSub = subs.find(s => s.module === 'vocal') ?? null;

    // Calcola conversazioni rimanenti dal piano attivo
    const eurPerConv = vocalSub?.overage_rate_eur ?? DEFAULT_EUR_PER_CONV;
    const rawBalance = Number(credits?.balance_eur ?? 0);
    const reserve = Number(credits?.min_reserve_eur ?? 2);
    const usableEur = Math.max(0, rawBalance - reserve);
    const balanceConv = Math.floor(usableEur / eurPerConv);

    setState({
      balance_eur: rawBalance,
      balance_conv: balanceConv,
      calls_blocked: credits?.calls_blocked ?? false,
      min_reserve_eur: reserve,
      forecast_days_left: (credits as Record<string, unknown>)?.forecast_days_left as number ?? null,
      alert_threshold_eur: Number(credits?.alert_threshold_eur ?? 5),
      is_loading: false,
      vocal_sub: vocalSub as ModuleSub | null,
      render_credits: Number(renderRes.data?.balance ?? 0),
      preventivi_active: subs.some(s => s.module === 'preventivi'),
      automazioni_active: subs.some(s => s.module === 'automazioni'),
    });
  }, [companyId]);

  useEffect(() => {
    fetchAll();
    if (!companyId) return;

    // Realtime subscription su ai_credits — aggiorna senza polling
    const channel = supabase
      .channel(`credits-${companyId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'ai_credits',
        filter: `company_id=eq.${companyId}`,
      }, () => { fetchAll(); })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [companyId, fetchAll]);

  return { ...state, refetch: fetchAll };
}
