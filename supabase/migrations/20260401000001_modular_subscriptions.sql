-- Migration 001: Modular subscription system
-- Safe: additive only, no existing data touched

CREATE TABLE IF NOT EXISTS public.company_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  module TEXT NOT NULL,
  -- 'vocal' | 'render' | 'preventivi' | 'automazioni'
  plan_id TEXT,
  -- es. 'vocal_s' | 'vocal_m' | 'render_pack_10' | 'flat_preventivi'
  stripe_sub_id TEXT,
  stripe_price_id TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  -- 'active' | 'cancelled' | 'past_due' | 'trialing'
  monthly_units INTEGER DEFAULT 0,
  -- conv. incluse/mese (vocal) o render inclusi (render)
  units_used_month INTEGER DEFAULT 0,
  overage_rate_eur DECIMAL(10,4) DEFAULT 0,
  -- costo per unità extra (es. 0.65 per conversazione)
  price_eur DECIMAL(10,2) NOT NULL DEFAULT 0,
  billing_cycle_start DATE,
  next_billing_date DATE,
  trial_ends_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, module)
  -- una sola sub attiva per modulo per azienda
);

ALTER TABLE public.company_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sa_subs_all" ON public.company_subscriptions
  FOR ALL USING (
    has_role(auth.uid(), 'superadmin') OR has_role(auth.uid(), 'superadmin_user')
  );

CREATE POLICY "co_subs_select" ON public.company_subscriptions
  FOR SELECT USING (company_id = my_company());

CREATE INDEX idx_company_subs_company ON public.company_subscriptions(company_id);
CREATE INDEX idx_company_subs_module ON public.company_subscriptions(module);
CREATE INDEX idx_company_subs_status ON public.company_subscriptions(status)
  WHERE status = 'active';
