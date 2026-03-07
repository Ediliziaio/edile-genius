
-- Fix RLS: Convert RESTRICTIVE policies to PERMISSIVE on template-related tables

-- 1. agent_templates
DROP POLICY IF EXISTS "co_templates_select" ON public.agent_templates;
DROP POLICY IF EXISTS "sa_templates" ON public.agent_templates;

CREATE POLICY "co_templates_select" ON public.agent_templates
  FOR SELECT TO authenticated
  USING (is_published = true);

CREATE POLICY "sa_templates" ON public.agent_templates
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'superadmin'::app_role) OR has_role(auth.uid(), 'superadmin_user'::app_role));

-- 2. agent_template_instances
DROP POLICY IF EXISTS "co_instances" ON public.agent_template_instances;
DROP POLICY IF EXISTS "sa_instances" ON public.agent_template_instances;

CREATE POLICY "co_instances" ON public.agent_template_instances
  FOR ALL TO authenticated
  USING (company_id = my_company());

CREATE POLICY "sa_instances" ON public.agent_template_instances
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'superadmin'::app_role) OR has_role(auth.uid(), 'superadmin_user'::app_role));

-- 3. agent_reports
DROP POLICY IF EXISTS "co_reports" ON public.agent_reports;
DROP POLICY IF EXISTS "sa_reports" ON public.agent_reports;

CREATE POLICY "co_reports" ON public.agent_reports
  FOR ALL TO authenticated
  USING (company_id = my_company());

CREATE POLICY "sa_reports" ON public.agent_reports
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'superadmin'::app_role) OR has_role(auth.uid(), 'superadmin_user'::app_role));

-- 4. company_channels
DROP POLICY IF EXISTS "co_channels" ON public.company_channels;
DROP POLICY IF EXISTS "sa_channels" ON public.company_channels;

CREATE POLICY "co_channels" ON public.company_channels
  FOR ALL TO authenticated
  USING (company_id = my_company());

CREATE POLICY "sa_channels" ON public.company_channels
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'superadmin'::app_role) OR has_role(auth.uid(), 'superadmin_user'::app_role));
