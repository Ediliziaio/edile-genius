
DROP POLICY IF EXISTS "superadmin_companies" ON public.companies;
DROP POLICY IF EXISTS "company_members_own" ON public.companies;
DROP POLICY IF EXISTS "superadmin_agents" ON public.agents;
DROP POLICY IF EXISTS "company_agents" ON public.agents;
DROP POLICY IF EXISTS "superadmin_conversations" ON public.conversations;
DROP POLICY IF EXISTS "company_conversations" ON public.conversations;
DROP POLICY IF EXISTS "users_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "users_own_roles" ON public.user_roles;

CREATE POLICY "superadmin_companies" ON public.companies AS PERMISSIVE FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'superadmin') OR has_role(auth.uid(), 'superadmin_user'));
CREATE POLICY "company_members_own" ON public.companies AS PERMISSIVE FOR SELECT TO authenticated
  USING (id = get_user_company_id(auth.uid()));

CREATE POLICY "superadmin_agents" ON public.agents AS PERMISSIVE FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'superadmin') OR has_role(auth.uid(), 'superadmin_user'));
CREATE POLICY "company_agents" ON public.agents AS PERMISSIVE FOR ALL TO authenticated
  USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "superadmin_conversations" ON public.conversations AS PERMISSIVE FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'superadmin') OR has_role(auth.uid(), 'superadmin_user'));
CREATE POLICY "company_conversations" ON public.conversations AS PERMISSIVE FOR ALL TO authenticated
  USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "users_own_profile" ON public.profiles AS PERMISSIVE FOR ALL TO authenticated
  USING (id = auth.uid() OR has_role(auth.uid(), 'superadmin'));
CREATE POLICY "users_own_roles" ON public.user_roles AS PERMISSIVE FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR has_role(auth.uid(), 'superadmin'));
