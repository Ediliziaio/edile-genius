
-- 1. platform_config (single row, superadmin only)
CREATE TABLE public.platform_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  el_api_key_configured boolean NOT NULL DEFAULT false,
  el_api_key_tested_at timestamptz,
  el_voices_count integer DEFAULT 0,
  el_default_llm text NOT NULL DEFAULT 'gemini-2.0-flash',
  el_default_voice_id text,
  credit_markup numeric NOT NULL DEFAULT 2.0,
  cost_per_min_real numeric NOT NULL DEFAULT 0.07,
  cost_per_min_billed numeric GENERATED ALWAYS AS (cost_per_min_real * credit_markup) STORED,
  updated_at timestamptz DEFAULT now(),
  updated_by uuid
);

-- Seed single row
INSERT INTO public.platform_config (el_api_key_configured) VALUES (true);

-- RLS
CREATE POLICY "superadmin_platform_config_select" ON public.platform_config
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'superadmin') OR has_role(auth.uid(), 'superadmin_user'));

CREATE POLICY "superadmin_platform_config_update" ON public.platform_config
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'superadmin') OR has_role(auth.uid(), 'superadmin_user'))
  WITH CHECK (has_role(auth.uid(), 'superadmin') OR has_role(auth.uid(), 'superadmin_user'));

-- 2. ai_credits (per company)
CREATE TABLE public.ai_credits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE UNIQUE,
  minutes_purchased numeric NOT NULL DEFAULT 0,
  minutes_used numeric NOT NULL DEFAULT 0,
  minutes_reserved numeric NOT NULL DEFAULT 0,
  alert_threshold_pct integer NOT NULL DEFAULT 80,
  alert_email_sent_at timestamptz,
  updated_at timestamptz DEFAULT now()
);

CREATE POLICY "superadmin_ai_credits" ON public.ai_credits
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'superadmin') OR has_role(auth.uid(), 'superadmin_user'));

CREATE POLICY "company_ai_credits_select" ON public.ai_credits
  FOR SELECT TO authenticated
  USING (company_id = get_user_company_id(auth.uid()));

-- 3. ai_credit_packages
CREATE TABLE public.ai_credit_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  minutes integer NOT NULL,
  price_eur numeric NOT NULL,
  price_per_min numeric GENERATED ALWAYS AS (price_eur / NULLIF(minutes, 0)) STORED,
  badge text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Seed default packages
INSERT INTO public.ai_credit_packages (name, minutes, price_eur, badge, sort_order) VALUES
  ('Starter', 100, 29, NULL, 1),
  ('Professional', 500, 99, 'Popolare', 2),
  ('Business', 2000, 299, 'Miglior Valore', 3),
  ('Enterprise', 10000, 990, NULL, 4);

CREATE POLICY "superadmin_ai_credit_packages" ON public.ai_credit_packages
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'superadmin') OR has_role(auth.uid(), 'superadmin_user'));

CREATE POLICY "company_ai_credit_packages_select" ON public.ai_credit_packages
  FOR SELECT TO authenticated
  USING (is_active = true);

-- 4. ai_credit_purchases
CREATE TABLE public.ai_credit_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  package_id uuid REFERENCES public.ai_credit_packages(id),
  minutes_added numeric NOT NULL,
  amount_eur numeric NOT NULL,
  cost_per_min numeric NOT NULL,
  payment_ref text,
  purchased_by uuid,
  purchased_at timestamptz DEFAULT now()
);

CREATE POLICY "superadmin_ai_credit_purchases" ON public.ai_credit_purchases
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'superadmin') OR has_role(auth.uid(), 'superadmin_user'));

CREATE POLICY "company_ai_credit_purchases_select" ON public.ai_credit_purchases
  FOR SELECT TO authenticated
  USING (company_id = get_user_company_id(auth.uid()));

-- 5. ai_audit_log
CREATE TABLE public.ai_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  user_id uuid,
  action text NOT NULL,
  entity_type text,
  entity_id uuid,
  details jsonb DEFAULT '{}',
  ip_address text,
  created_at timestamptz DEFAULT now()
);

CREATE POLICY "superadmin_ai_audit_log" ON public.ai_audit_log
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'superadmin') OR has_role(auth.uid(), 'superadmin_user'));

CREATE POLICY "company_ai_audit_log_select" ON public.ai_audit_log
  FOR SELECT TO authenticated
  USING (company_id = get_user_company_id(auth.uid()));

-- Trigger: auto-create ai_credits row when company is created
CREATE OR REPLACE FUNCTION public.init_company_credits()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.ai_credits (company_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_init_company_credits
  AFTER INSERT ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION public.init_company_credits();

-- updated_at triggers
CREATE TRIGGER trg_ai_credits_updated_at
  BEFORE UPDATE ON public.ai_credits
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_platform_config_updated_at
  BEFORE UPDATE ON public.platform_config
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();
