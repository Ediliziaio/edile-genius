
-- FIX 1: Invoice number sequence + function
CREATE SEQUENCE IF NOT EXISTS public.invoice_number_seq START 1000;

CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS TEXT AS $$
  SELECT 'EIO-' || EXTRACT(YEAR FROM now())::TEXT || '-' || LPAD(nextval('public.invoice_number_seq')::TEXT, 6, '0');
$$ LANGUAGE sql;

-- FIX 2: RLS policies on ai_credits
-- Company users can read their own credits
CREATE POLICY "ai_credits_company_read"
  ON public.ai_credits
  FOR SELECT TO authenticated
  USING (company_id = public.my_company());

-- Superadmin full access
CREATE POLICY "ai_credits_superadmin_all"
  ON public.ai_credits
  FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'superadmin'::app_role)
    OR public.has_role(auth.uid(), 'superadmin_user'::app_role)
  );

-- FIX 3: Superadmin policy on weekly_reports_log
CREATE POLICY "sa_weekly_reports_all"
  ON public.weekly_reports_log
  FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'superadmin'::app_role)
    OR public.has_role(auth.uid(), 'superadmin_user'::app_role)
  );

-- FIX 4: Add price_paid_eur and stripe_session_id columns if missing
ALTER TABLE public.ai_credit_topups
  ADD COLUMN IF NOT EXISTS price_paid_eur NUMERIC;

-- Unique index on stripe_session_id for idempotency
CREATE UNIQUE INDEX IF NOT EXISTS idx_topups_stripe_session
  ON public.ai_credit_topups(stripe_session_id)
  WHERE stripe_session_id IS NOT NULL;
