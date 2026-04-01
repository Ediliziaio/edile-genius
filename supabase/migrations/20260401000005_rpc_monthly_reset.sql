-- Migration 005: RPC reset mensile crediti + forecast giornaliero
-- pg_cron chiama questa funzione il 1° di ogni mese alle 6:00 UTC

CREATE OR REPLACE FUNCTION public.reset_monthly_subscriptions()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  -- Reset unità usate nel mese
  UPDATE public.company_subscriptions
    SET
      units_used_month = 0,
      billing_cycle_start = CURRENT_DATE,
      next_billing_date = CURRENT_DATE + INTERVAL '1 month',
      updated_at = now()
    WHERE status = 'active';

  -- Aggiorna forecast_days_left per ogni azienda
  -- (basato su media consumo ultimi 7 giorni)
  UPDATE public.ai_credits ac SET
    forecast_days_left = (
      SELECT CASE
        WHEN COALESCE(avg_daily, 0) > 0.01
          THEN LEAST(FLOOR(ac.balance_eur / avg_daily), 999)
        ELSE 999
      END
      FROM (
        SELECT SUM(cost_billed_total) /
          GREATEST(EXTRACT(EPOCH FROM (MAX(created_at) - MIN(created_at)))/86400, 1)
          AS avg_daily
        FROM public.ai_credit_usage
        WHERE company_id = ac.company_id
          AND created_at > now() - INTERVAL '7 days'
      ) sub
    ),
    forecast_updated_at = now();
END;
$$;

REVOKE ALL ON FUNCTION public.reset_monthly_subscriptions FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reset_monthly_subscriptions TO service_role;

-- Nota: configurare pg_cron nel dashboard Supabase:
-- SELECT cron.schedule('monthly-credit-reset', '0 6 1 * *',
--   'SELECT public.reset_monthly_subscriptions()');
-- SELECT cron.schedule('daily-forecast-update', '0 5 * * *',
--   'SELECT public.reset_monthly_subscriptions()');
