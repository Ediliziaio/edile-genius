
-- ================================================================
-- SISTEMA CREDITI BASATO SU EURO
-- ================================================================

-- 1. platform_pricing: costo per combinazione LLM+TTS
CREATE TABLE IF NOT EXISTS public.platform_pricing (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  llm_model           TEXT NOT NULL,
  tts_model           TEXT NOT NULL,
  cost_real_per_min   DECIMAL(10,6) NOT NULL,
  cost_billed_per_min DECIMAL(10,6) NOT NULL,
  markup_multiplier   DECIMAL(5,2) NOT NULL DEFAULT 2.00,
  is_active           BOOLEAN DEFAULT true,
  label               TEXT,
  updated_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_by          UUID,
  UNIQUE(llm_model, tts_model)
);

-- Seed pricing
INSERT INTO public.platform_pricing (llm_model, tts_model, cost_real_per_min, cost_billed_per_min, markup_multiplier, label)
VALUES
  ('gemini-2.5-flash',  'eleven_turbo_v2_5',       0.0200, 0.0400, 2.0, 'Flash + Turbo (Base)'),
  ('gemini-2.5-flash',  'eleven_multilingual_v2',  0.0300, 0.0600, 2.0, 'Flash + Multilingual'),
  ('gpt-4o-mini',       'eleven_turbo_v2_5',       0.0350, 0.0700, 2.0, 'GPT-4o Mini + Turbo'),
  ('gpt-4o-mini',       'eleven_multilingual_v2',  0.0450, 0.0900, 2.0, 'GPT-4o Mini + Multi'),
  ('gpt-4o',            'eleven_turbo_v2_5',       0.0600, 0.1200, 2.0, 'GPT-4o + Turbo (Pro)'),
  ('gpt-4o',            'eleven_multilingual_v2',  0.0700, 0.1400, 2.0, 'GPT-4o + Multi (Pro)'),
  ('claude-sonnet-4-5', 'eleven_multilingual_v2',  0.0800, 0.1600, 2.0, 'Claude Sonnet + Multi'),
  ('claude-haiku-4-5',  'eleven_turbo_v2_5',       0.0400, 0.0800, 2.0, 'Claude Haiku + Turbo')
ON CONFLICT (llm_model, tts_model) DO NOTHING;

-- RLS for platform_pricing
ALTER TABLE public.platform_pricing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sa_pricing_all" ON public.platform_pricing
  FOR ALL USING (
    has_role(auth.uid(), 'superadmin'::app_role) OR has_role(auth.uid(), 'superadmin_user'::app_role)
  );

-- 2. Modify ai_credits: add euro columns, keep old for compat
ALTER TABLE public.ai_credits
  ADD COLUMN IF NOT EXISTS balance_eur DECIMAL(10,4) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_recharged_eur DECIMAL(10,4) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_spent_eur DECIMAL(10,4) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS auto_recharge_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS auto_recharge_threshold DECIMAL(10,4) DEFAULT 5.00,
  ADD COLUMN IF NOT EXISTS auto_recharge_amount DECIMAL(10,4) DEFAULT 20.00,
  ADD COLUMN IF NOT EXISTS auto_recharge_method TEXT,
  ADD COLUMN IF NOT EXISTS auto_recharge_payment_ref TEXT,
  ADD COLUMN IF NOT EXISTS alert_threshold_eur DECIMAL(10,4) DEFAULT 5.00,
  ADD COLUMN IF NOT EXISTS calls_blocked BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS blocked_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS blocked_reason TEXT;

-- 3. ai_credit_topups
CREATE TABLE IF NOT EXISTS public.ai_credit_topups (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  amount_eur      DECIMAL(10,4) NOT NULL,
  type            TEXT NOT NULL DEFAULT 'manual',
  status          TEXT NOT NULL DEFAULT 'pending',
  payment_method  TEXT,
  payment_ref     TEXT,
  invoice_number  TEXT,
  notes           TEXT,
  triggered_by    UUID,
  processed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.ai_credit_topups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sa_topups_all" ON public.ai_credit_topups
  FOR ALL USING (
    has_role(auth.uid(), 'superadmin'::app_role) OR has_role(auth.uid(), 'superadmin_user'::app_role)
  );

CREATE POLICY "co_topups_select" ON public.ai_credit_topups
  FOR SELECT USING (company_id = my_company());

-- 4. ai_credit_usage
CREATE TABLE IF NOT EXISTS public.ai_credit_usage (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id          UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  conversation_id     UUID,
  agent_id            UUID,
  duration_sec        INTEGER NOT NULL,
  duration_min        DECIMAL(10,4) NOT NULL,
  llm_model           TEXT NOT NULL,
  tts_model           TEXT NOT NULL,
  cost_real_per_min   DECIMAL(10,6) NOT NULL,
  cost_billed_per_min DECIMAL(10,6) NOT NULL,
  cost_real_total     DECIMAL(10,4) NOT NULL,
  cost_billed_total   DECIMAL(10,4) NOT NULL,
  margin_total        DECIMAL(10,4) NOT NULL,
  balance_before      DECIMAL(10,4) NOT NULL,
  balance_after       DECIMAL(10,4) NOT NULL,
  call_direction      TEXT DEFAULT 'inbound',
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.ai_credit_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sa_usage_all" ON public.ai_credit_usage
  FOR ALL USING (
    has_role(auth.uid(), 'superadmin'::app_role) OR has_role(auth.uid(), 'superadmin_user'::app_role)
  );

CREATE POLICY "co_usage_select" ON public.ai_credit_usage
  FOR SELECT USING (company_id = my_company());

-- 5. View: monthly_billing_summary
CREATE OR REPLACE VIEW public.monthly_billing_summary AS
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
