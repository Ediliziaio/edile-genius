-- 1. Fix profiles: prevent company_id hijack via self-update
DROP POLICY IF EXISTS "users_own_profile" ON public.profiles;

-- SELECT: users can read own profile, superadmins can read all
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid() OR has_role(auth.uid(), 'superadmin') OR has_role(auth.uid(), 'superadmin_user'));

-- INSERT: only for own profile (trigger handles this, but just in case)
CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

-- UPDATE: own profile only, company_id cannot be changed
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid()
    AND company_id IS NOT DISTINCT FROM (SELECT p.company_id FROM profiles p WHERE p.id = auth.uid())
  );

-- UPDATE: superadmins can update any profile including company_id
CREATE POLICY "profiles_update_superadmin" ON public.profiles
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'superadmin'))
  WITH CHECK (has_role(auth.uid(), 'superadmin'));

-- DELETE: superadmins only
CREATE POLICY "profiles_delete_superadmin" ON public.profiles
  FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'superadmin'));

-- 2. Add RLS policies to monthly_billing_summary (it's a view with security_invoker=true,
-- underlying ai_credit_usage already has RLS, but add explicit protection)
-- The view already enforces RLS via security_invoker=true on the underlying tables.
-- No additional action needed for the view itself.