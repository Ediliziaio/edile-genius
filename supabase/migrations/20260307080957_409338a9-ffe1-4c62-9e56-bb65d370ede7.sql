
-- ============================================================
-- 1. Fix RLS policies: drop RESTRICTIVE, recreate as PERMISSIVE
-- ============================================================

-- agent_templates
DROP POLICY IF EXISTS co_templates_select ON public.agent_templates;
DROP POLICY IF EXISTS sa_templates ON public.agent_templates;

CREATE POLICY "co_templates_select" ON public.agent_templates
  FOR SELECT TO authenticated
  USING (is_published = true);

CREATE POLICY "sa_templates" ON public.agent_templates
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'superadmin'::app_role) OR has_role(auth.uid(), 'superadmin_user'::app_role));

-- agent_template_instances
DROP POLICY IF EXISTS co_instances ON public.agent_template_instances;
DROP POLICY IF EXISTS sa_instances ON public.agent_template_instances;

CREATE POLICY "co_instances" ON public.agent_template_instances
  FOR ALL TO authenticated
  USING (company_id = my_company());

CREATE POLICY "sa_instances" ON public.agent_template_instances
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'superadmin'::app_role) OR has_role(auth.uid(), 'superadmin_user'::app_role));

-- agent_reports
DROP POLICY IF EXISTS co_reports ON public.agent_reports;
DROP POLICY IF EXISTS sa_reports ON public.agent_reports;

CREATE POLICY "co_reports" ON public.agent_reports
  FOR ALL TO authenticated
  USING (company_id = my_company());

CREATE POLICY "sa_reports" ON public.agent_reports
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'superadmin'::app_role) OR has_role(auth.uid(), 'superadmin_user'::app_role));

-- ============================================================
-- 2. Create increment_installs_count function
-- ============================================================

CREATE OR REPLACE FUNCTION public.increment_installs_count(tpl_id UUID)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.agent_templates
  SET installs_count = COALESCE(installs_count, 0) + 1
  WHERE id = tpl_id;
$$;
