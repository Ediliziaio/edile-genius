
-- =====================================================
-- Fix RLS policies: change role from public to authenticated
-- =====================================================

-- render_bagno_gallery
DROP POLICY IF EXISTS "Company users manage own gallery" ON render_bagno_gallery;
CREATE POLICY "Company users manage own gallery" ON render_bagno_gallery FOR ALL TO authenticated
  USING ((company_id = my_company()) OR (is_public = true))
  WITH CHECK (company_id = my_company());

DROP POLICY IF EXISTS "Superadmin full access gallery" ON render_bagno_gallery;
CREATE POLICY "Superadmin full access gallery" ON render_bagno_gallery FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'superadmin')) WITH CHECK (has_role(auth.uid(), 'superadmin'));

-- render_bagno_presets
DROP POLICY IF EXISTS "Presets pubblici" ON render_bagno_presets;
CREATE POLICY "Presets pubblici" ON render_bagno_presets FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Superadmin manage presets" ON render_bagno_presets;
CREATE POLICY "Superadmin manage presets" ON render_bagno_presets FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'superadmin')) WITH CHECK (has_role(auth.uid(), 'superadmin'));

-- render_bagno_sessions
DROP POLICY IF EXISTS "Company users manage own sessions" ON render_bagno_sessions;
CREATE POLICY "Company users manage own sessions" ON render_bagno_sessions FOR ALL TO authenticated
  USING (company_id = my_company()) WITH CHECK (company_id = my_company());

DROP POLICY IF EXISTS "Superadmin full access sessions" ON render_bagno_sessions;
CREATE POLICY "Superadmin full access sessions" ON render_bagno_sessions FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'superadmin')) WITH CHECK (has_role(auth.uid(), 'superadmin'));

-- render_facciata_gallery
DROP POLICY IF EXISTS "Users own gallery" ON render_facciata_gallery;
CREATE POLICY "Users own gallery" ON render_facciata_gallery FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- render_facciata_sessions
DROP POLICY IF EXISTS "Users own sessions" ON render_facciata_sessions;
CREATE POLICY "Users own sessions" ON render_facciata_sessions FOR ALL TO authenticated
  USING (company_id = my_company()) WITH CHECK (company_id = my_company());

-- render_persiane_gallery
DROP POLICY IF EXISTS "Users can view own persiane gallery" ON render_persiane_gallery;
CREATE POLICY "Users can view own persiane gallery" ON render_persiane_gallery FOR SELECT TO authenticated
  USING ((user_id = auth.uid()) OR (company_id = my_company()) OR has_role(auth.uid(), 'superadmin'));

DROP POLICY IF EXISTS "Users can insert own persiane gallery" ON render_persiane_gallery;
CREATE POLICY "Users can insert own persiane gallery" ON render_persiane_gallery FOR INSERT TO authenticated
  WITH CHECK (company_id = my_company());

DROP POLICY IF EXISTS "Users can update own persiane gallery" ON render_persiane_gallery;
CREATE POLICY "Users can update own persiane gallery" ON render_persiane_gallery FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own persiane gallery" ON render_persiane_gallery;
CREATE POLICY "Users can delete own persiane gallery" ON render_persiane_gallery FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- render_persiane_sessions
DROP POLICY IF EXISTS "Users can view own persiane sessions" ON render_persiane_sessions;
CREATE POLICY "Users can view own persiane sessions" ON render_persiane_sessions FOR SELECT TO authenticated
  USING (company_id = my_company());

DROP POLICY IF EXISTS "Users can insert own persiane sessions" ON render_persiane_sessions;
CREATE POLICY "Users can insert own persiane sessions" ON render_persiane_sessions FOR INSERT TO authenticated
  WITH CHECK (company_id = my_company());

DROP POLICY IF EXISTS "Users can update own persiane sessions" ON render_persiane_sessions;
CREATE POLICY "Users can update own persiane sessions" ON render_persiane_sessions FOR UPDATE TO authenticated
  USING (company_id = my_company()) WITH CHECK (company_id = my_company());

-- render_stanza_stili_pronti
DROP POLICY IF EXISTS "stili_stanza_public_read" ON render_stanza_stili_pronti;
CREATE POLICY "stili_stanza_public_read" ON render_stanza_stili_pronti FOR SELECT TO authenticated USING (true);

-- render_tetto_gallery
DROP POLICY IF EXISTS "tetto_gallery_company" ON render_tetto_gallery;
CREATE POLICY "tetto_gallery_company" ON render_tetto_gallery FOR ALL TO authenticated
  USING (company_id = my_company()) WITH CHECK (company_id = my_company());

DROP POLICY IF EXISTS "tetto_gallery_superadmin" ON render_tetto_gallery;
CREATE POLICY "tetto_gallery_superadmin" ON render_tetto_gallery FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'superadmin') OR has_role(auth.uid(), 'superadmin_user'))
  WITH CHECK (has_role(auth.uid(), 'superadmin') OR has_role(auth.uid(), 'superadmin_user'));

-- render_tetto_sessions
DROP POLICY IF EXISTS "tetto_sessions_company" ON render_tetto_sessions;
CREATE POLICY "tetto_sessions_company" ON render_tetto_sessions FOR ALL TO authenticated
  USING (company_id = my_company()) WITH CHECK (company_id = my_company());

DROP POLICY IF EXISTS "tetto_sessions_superadmin" ON render_tetto_sessions;
CREATE POLICY "tetto_sessions_superadmin" ON render_tetto_sessions FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'superadmin') OR has_role(auth.uid(), 'superadmin_user'))
  WITH CHECK (has_role(auth.uid(), 'superadmin') OR has_role(auth.uid(), 'superadmin_user'));

-- render_tetto_stili_pronti
DROP POLICY IF EXISTS "tetto_stili_superadmin" ON render_tetto_stili_pronti;
CREATE POLICY "tetto_stili_superadmin" ON render_tetto_stili_pronti FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'superadmin')) WITH CHECK (has_role(auth.uid(), 'superadmin'));

-- =====================================================
-- TASK 2: Restrict monthly_billing_summary access
-- =====================================================
REVOKE ALL ON monthly_billing_summary FROM anon;
REVOKE ALL ON monthly_billing_summary FROM authenticated;
GRANT SELECT ON monthly_billing_summary TO authenticated;
