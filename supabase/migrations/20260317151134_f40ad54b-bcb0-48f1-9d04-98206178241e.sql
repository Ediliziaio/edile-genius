
-- Task 1: monthly_billing_summary — revoke SELECT from authenticated, keep only service_role
REVOKE SELECT ON public.monthly_billing_summary FROM authenticated;

-- Task 2: user_feature_permissions — fix privilege escalation
DROP POLICY IF EXISTS "permissions_company_admin" ON public.user_feature_permissions;

CREATE POLICY "permissions_company_read"
  ON public.user_feature_permissions
  FOR SELECT
  TO authenticated
  USING (company_id = public.my_company());

CREATE POLICY "permissions_admin_write"
  ON public.user_feature_permissions
  FOR ALL
  TO authenticated
  USING (
    company_id = public.my_company()
    AND public.my_role() IN ('company_admin', 'superadmin', 'superadmin_user')
  )
  WITH CHECK (
    company_id = public.my_company()
    AND public.my_role() IN ('company_admin', 'superadmin', 'superadmin_user')
  );

-- Task 3: azienda_inviti — fix any-member write access
DROP POLICY IF EXISTS "inviti_company_admin" ON public.azienda_inviti;

CREATE POLICY "inviti_company_read"
  ON public.azienda_inviti
  FOR SELECT
  TO authenticated
  USING (company_id = public.my_company());

CREATE POLICY "inviti_admin_write"
  ON public.azienda_inviti
  FOR ALL
  TO authenticated
  USING (
    company_id = public.my_company()
    AND public.my_role() IN ('company_admin', 'superadmin', 'superadmin_user')
  )
  WITH CHECK (
    company_id = public.my_company()
    AND public.my_role() IN ('company_admin', 'superadmin', 'superadmin_user')
  );
