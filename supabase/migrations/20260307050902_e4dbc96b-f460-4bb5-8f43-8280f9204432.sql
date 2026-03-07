
-- Fix: recreate view with SECURITY INVOKER (default for views, but explicit)
DROP VIEW IF EXISTS public.monthly_billing_summary;

CREATE VIEW public.monthly_billing_summary WITH (security_invoker = true) AS
SELECT
  u.company_id,
  c.name AS company_name,
  DATE_TRUNC('month', u.created_at) AS month,
  COUNT(*)::integer AS conversations_count,
  SUM(u.duration_min) AS total_minutes,
  SUM(u.cost_real_total) AS total_cost_real_eur,
  SUM(u.cost_billed_total) AS total_cost_billed_eur,
  SUM(u.margin_total) AS total_margin_eur,
  ROUND(AVG(u.cost_billed_per_min), 6) AS avg_cost_per_min,
  COUNT(DISTINCT u.agent_id)::integer AS agents_used
FROM public.ai_credit_usage u
JOIN public.companies c ON c.id = u.company_id
GROUP BY u.company_id, c.name, DATE_TRUNC('month', u.created_at);
