
-- ============================================================
-- FIX RLS: Convert ALL policies from RESTRICTIVE to PERMISSIVE
-- Drop all existing RESTRICTIVE policies and recreate as PERMISSIVE
-- ============================================================

-- ---- agents ----
DROP POLICY IF EXISTS "company_agents" ON public.agents;
DROP POLICY IF EXISTS "superadmin_agents" ON public.agents;
CREATE POLICY "company_agents" ON public.agents FOR ALL TO authenticated
  USING (company_id = get_user_company_id(auth.uid()));
CREATE POLICY "superadmin_agents" ON public.agents FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'superadmin') OR has_role(auth.uid(), 'superadmin_user'));

-- ---- conversations ----
DROP POLICY IF EXISTS "company_conversations" ON public.conversations;
DROP POLICY IF EXISTS "superadmin_conversations" ON public.conversations;
CREATE POLICY "company_conversations" ON public.conversations FOR ALL TO authenticated
  USING (company_id = get_user_company_id(auth.uid()));
CREATE POLICY "superadmin_conversations" ON public.conversations FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'superadmin') OR has_role(auth.uid(), 'superadmin_user'));

-- ---- contacts ----
DROP POLICY IF EXISTS "company_contacts" ON public.contacts;
DROP POLICY IF EXISTS "superadmin_contacts" ON public.contacts;
CREATE POLICY "company_contacts" ON public.contacts FOR ALL TO authenticated
  USING (company_id = get_user_company_id(auth.uid()));
CREATE POLICY "superadmin_contacts" ON public.contacts FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'superadmin') OR has_role(auth.uid(), 'superadmin_user'));

-- ---- campaigns ----
DROP POLICY IF EXISTS "company_campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "superadmin_campaigns" ON public.campaigns;
CREATE POLICY "company_campaigns" ON public.campaigns FOR ALL TO authenticated
  USING (company_id = get_user_company_id(auth.uid()));
CREATE POLICY "superadmin_campaigns" ON public.campaigns FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'superadmin') OR has_role(auth.uid(), 'superadmin_user'));

-- ---- companies ----
DROP POLICY IF EXISTS "company_members_own" ON public.companies;
DROP POLICY IF EXISTS "company_update_own" ON public.companies;
DROP POLICY IF EXISTS "superadmin_companies" ON public.companies;
CREATE POLICY "company_members_own" ON public.companies FOR SELECT TO authenticated
  USING (id = get_user_company_id(auth.uid()));
CREATE POLICY "company_update_own" ON public.companies FOR UPDATE TO authenticated
  USING (id = get_user_company_id(auth.uid()));
CREATE POLICY "superadmin_companies" ON public.companies FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'superadmin') OR has_role(auth.uid(), 'superadmin_user'));

-- ---- ai_credits ----
DROP POLICY IF EXISTS "company_ai_credits_select" ON public.ai_credits;
DROP POLICY IF EXISTS "superadmin_ai_credits" ON public.ai_credits;
CREATE POLICY "company_ai_credits_select" ON public.ai_credits FOR SELECT TO authenticated
  USING (company_id = get_user_company_id(auth.uid()));
CREATE POLICY "superadmin_ai_credits" ON public.ai_credits FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'superadmin') OR has_role(auth.uid(), 'superadmin_user'));

-- ---- ai_credit_usage ----
DROP POLICY IF EXISTS "co_usage_select" ON public.ai_credit_usage;
DROP POLICY IF EXISTS "sa_usage_all" ON public.ai_credit_usage;
CREATE POLICY "co_usage_select" ON public.ai_credit_usage FOR SELECT TO authenticated
  USING (company_id = my_company());
CREATE POLICY "sa_usage_all" ON public.ai_credit_usage FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'superadmin') OR has_role(auth.uid(), 'superadmin_user'));

-- ---- ai_credit_topups ----
DROP POLICY IF EXISTS "co_topups_select" ON public.ai_credit_topups;
DROP POLICY IF EXISTS "sa_topups_all" ON public.ai_credit_topups;
CREATE POLICY "co_topups_select" ON public.ai_credit_topups FOR SELECT TO authenticated
  USING (company_id = my_company());
CREATE POLICY "sa_topups_all" ON public.ai_credit_topups FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'superadmin') OR has_role(auth.uid(), 'superadmin_user'));

-- ---- ai_credit_packages ----
DROP POLICY IF EXISTS "company_ai_credit_packages_select" ON public.ai_credit_packages;
DROP POLICY IF EXISTS "superadmin_ai_credit_packages" ON public.ai_credit_packages;
CREATE POLICY "company_ai_credit_packages_select" ON public.ai_credit_packages FOR SELECT TO authenticated
  USING (is_active = true);
CREATE POLICY "superadmin_ai_credit_packages" ON public.ai_credit_packages FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'superadmin') OR has_role(auth.uid(), 'superadmin_user'));

-- ---- ai_credit_purchases ----
DROP POLICY IF EXISTS "company_ai_credit_purchases_select" ON public.ai_credit_purchases;
DROP POLICY IF EXISTS "superadmin_ai_credit_purchases" ON public.ai_credit_purchases;
CREATE POLICY "company_ai_credit_purchases_select" ON public.ai_credit_purchases FOR SELECT TO authenticated
  USING (company_id = get_user_company_id(auth.uid()));
CREATE POLICY "superadmin_ai_credit_purchases" ON public.ai_credit_purchases FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'superadmin') OR has_role(auth.uid(), 'superadmin_user'));

-- ---- ai_phone_numbers ----
DROP POLICY IF EXISTS "company_ai_phone_numbers" ON public.ai_phone_numbers;
DROP POLICY IF EXISTS "superadmin_ai_phone_numbers" ON public.ai_phone_numbers;
CREATE POLICY "company_ai_phone_numbers" ON public.ai_phone_numbers FOR ALL TO authenticated
  USING (company_id = get_user_company_id(auth.uid()));
CREATE POLICY "superadmin_ai_phone_numbers" ON public.ai_phone_numbers FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'superadmin') OR has_role(auth.uid(), 'superadmin_user'));

-- ---- ai_knowledge_docs ----
DROP POLICY IF EXISTS "company_ai_knowledge_docs" ON public.ai_knowledge_docs;
DROP POLICY IF EXISTS "superadmin_ai_knowledge_docs" ON public.ai_knowledge_docs;
CREATE POLICY "company_ai_knowledge_docs" ON public.ai_knowledge_docs FOR ALL TO authenticated
  USING (company_id = get_user_company_id(auth.uid()));
CREATE POLICY "superadmin_ai_knowledge_docs" ON public.ai_knowledge_docs FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'superadmin') OR has_role(auth.uid(), 'superadmin_user'));

-- ---- ai_agent_tools ----
DROP POLICY IF EXISTS "company_ai_agent_tools" ON public.ai_agent_tools;
DROP POLICY IF EXISTS "superadmin_ai_agent_tools" ON public.ai_agent_tools;
CREATE POLICY "company_ai_agent_tools" ON public.ai_agent_tools FOR ALL TO authenticated
  USING (company_id = get_user_company_id(auth.uid()));
CREATE POLICY "superadmin_ai_agent_tools" ON public.ai_agent_tools FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'superadmin') OR has_role(auth.uid(), 'superadmin_user'));

-- ---- ai_agent_workflows ----
DROP POLICY IF EXISTS "company_ai_agent_workflows" ON public.ai_agent_workflows;
DROP POLICY IF EXISTS "superadmin_ai_agent_workflows" ON public.ai_agent_workflows;
CREATE POLICY "company_ai_agent_workflows" ON public.ai_agent_workflows FOR ALL TO authenticated
  USING (company_id = get_user_company_id(auth.uid()));
CREATE POLICY "superadmin_ai_agent_workflows" ON public.ai_agent_workflows FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'superadmin') OR has_role(auth.uid(), 'superadmin_user'));

-- ---- ai_audit_log ----
DROP POLICY IF EXISTS "company_ai_audit_log_select" ON public.ai_audit_log;
DROP POLICY IF EXISTS "superadmin_ai_audit_log" ON public.ai_audit_log;
CREATE POLICY "company_ai_audit_log_select" ON public.ai_audit_log FOR SELECT TO authenticated
  USING (company_id = get_user_company_id(auth.uid()));
CREATE POLICY "superadmin_ai_audit_log" ON public.ai_audit_log FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'superadmin') OR has_role(auth.uid(), 'superadmin_user'));

-- ---- knowledge_base_files ----
DROP POLICY IF EXISTS "company_kb_files" ON public.knowledge_base_files;
DROP POLICY IF EXISTS "superadmin_kb_files" ON public.knowledge_base_files;
CREATE POLICY "company_kb_files" ON public.knowledge_base_files FOR ALL TO authenticated
  USING (company_id = get_user_company_id(auth.uid()));
CREATE POLICY "superadmin_kb_files" ON public.knowledge_base_files FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'superadmin') OR has_role(auth.uid(), 'superadmin_user'));

-- ---- notes ----
DROP POLICY IF EXISTS "company_notes" ON public.notes;
DROP POLICY IF EXISTS "superadmin_notes" ON public.notes;
CREATE POLICY "company_notes" ON public.notes FOR ALL TO authenticated
  USING (company_id = get_user_company_id(auth.uid()));
CREATE POLICY "superadmin_notes" ON public.notes FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'superadmin') OR has_role(auth.uid(), 'superadmin_user'));

-- ---- contact_lists ----
DROP POLICY IF EXISTS "company_contact_lists" ON public.contact_lists;
DROP POLICY IF EXISTS "superadmin_contact_lists" ON public.contact_lists;
CREATE POLICY "company_contact_lists" ON public.contact_lists FOR ALL TO authenticated
  USING (company_id = get_user_company_id(auth.uid()));
CREATE POLICY "superadmin_contact_lists" ON public.contact_lists FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'superadmin') OR has_role(auth.uid(), 'superadmin_user'));

-- ---- contact_list_members ----
DROP POLICY IF EXISTS "company_contact_list_members" ON public.contact_list_members;
DROP POLICY IF EXISTS "superadmin_contact_list_members" ON public.contact_list_members;
CREATE POLICY "company_contact_list_members" ON public.contact_list_members FOR ALL TO authenticated
  USING (list_id IN (SELECT id FROM contact_lists WHERE company_id = get_user_company_id(auth.uid())));
CREATE POLICY "superadmin_contact_list_members" ON public.contact_list_members FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'superadmin') OR has_role(auth.uid(), 'superadmin_user'));

-- ---- platform_config ----
DROP POLICY IF EXISTS "superadmin_platform_config_select" ON public.platform_config;
DROP POLICY IF EXISTS "superadmin_platform_config_update" ON public.platform_config;
CREATE POLICY "superadmin_platform_config_select" ON public.platform_config FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'superadmin') OR has_role(auth.uid(), 'superadmin_user'));
CREATE POLICY "superadmin_platform_config_update" ON public.platform_config FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'superadmin') OR has_role(auth.uid(), 'superadmin_user'))
  WITH CHECK (has_role(auth.uid(), 'superadmin') OR has_role(auth.uid(), 'superadmin_user'));

-- ---- platform_pricing ----
DROP POLICY IF EXISTS "sa_pricing_all" ON public.platform_pricing;
CREATE POLICY "sa_pricing_all" ON public.platform_pricing FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'superadmin') OR has_role(auth.uid(), 'superadmin_user'));

-- ---- profiles ----
DROP POLICY IF EXISTS "users_own_profile" ON public.profiles;
CREATE POLICY "users_own_profile" ON public.profiles FOR ALL TO authenticated
  USING (id = auth.uid() OR has_role(auth.uid(), 'superadmin'));

-- ---- company_channels ----
DROP POLICY IF EXISTS "co_channels" ON public.company_channels;
DROP POLICY IF EXISTS "sa_channels" ON public.company_channels;
CREATE POLICY "co_channels" ON public.company_channels FOR ALL TO authenticated
  USING (company_id = my_company());
CREATE POLICY "sa_channels" ON public.company_channels FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'superadmin') OR has_role(auth.uid(), 'superadmin_user'));

-- ---- agent_reports ----
DROP POLICY IF EXISTS "co_reports" ON public.agent_reports;
DROP POLICY IF EXISTS "sa_reports" ON public.agent_reports;
CREATE POLICY "co_reports" ON public.agent_reports FOR ALL TO authenticated
  USING (company_id = my_company());
CREATE POLICY "sa_reports" ON public.agent_reports FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'superadmin') OR has_role(auth.uid(), 'superadmin_user'));

-- ---- agent_template_instances ----
DROP POLICY IF EXISTS "co_instances" ON public.agent_template_instances;
DROP POLICY IF EXISTS "sa_instances" ON public.agent_template_instances;
CREATE POLICY "co_instances" ON public.agent_template_instances FOR ALL TO authenticated
  USING (company_id = my_company());
CREATE POLICY "sa_instances" ON public.agent_template_instances FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'superadmin') OR has_role(auth.uid(), 'superadmin_user'));

-- ---- agent_templates ----
DROP POLICY IF EXISTS "co_templates_select" ON public.agent_templates;
DROP POLICY IF EXISTS "sa_templates" ON public.agent_templates;
CREATE POLICY "co_templates_select" ON public.agent_templates FOR SELECT TO authenticated
  USING (is_published = true);
CREATE POLICY "sa_templates" ON public.agent_templates FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'superadmin') OR has_role(auth.uid(), 'superadmin_user'));

-- ---- render_credits ----
DROP POLICY IF EXISTS "co_render_credits" ON public.render_credits;
DROP POLICY IF EXISTS "sa_render_credits" ON public.render_credits;
CREATE POLICY "co_render_credits" ON public.render_credits FOR SELECT TO authenticated
  USING (company_id = my_company());
CREATE POLICY "sa_render_credits" ON public.render_credits FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'superadmin') OR has_role(auth.uid(), 'superadmin_user'));

-- ---- render_gallery ----
DROP POLICY IF EXISTS "co_render_gallery" ON public.render_gallery;
DROP POLICY IF EXISTS "sa_render_gallery" ON public.render_gallery;
CREATE POLICY "co_render_gallery" ON public.render_gallery FOR ALL TO authenticated
  USING (company_id = my_company());
CREATE POLICY "sa_render_gallery" ON public.render_gallery FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'superadmin') OR has_role(auth.uid(), 'superadmin_user'));

-- ---- render_infissi_presets ----
DROP POLICY IF EXISTS "co_presets_select" ON public.render_infissi_presets;
DROP POLICY IF EXISTS "co_presets_modify" ON public.render_infissi_presets;
DROP POLICY IF EXISTS "sa_presets" ON public.render_infissi_presets;
CREATE POLICY "co_presets_select" ON public.render_infissi_presets FOR SELECT TO authenticated
  USING (is_global = true OR company_id = my_company());
CREATE POLICY "co_presets_modify" ON public.render_infissi_presets FOR ALL TO authenticated
  USING (company_id = my_company());
CREATE POLICY "sa_presets" ON public.render_infissi_presets FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'superadmin') OR has_role(auth.uid(), 'superadmin_user'));

-- ---- render_provider_config ----
DROP POLICY IF EXISTS "sa_render_provider" ON public.render_provider_config;
CREATE POLICY "sa_render_provider" ON public.render_provider_config FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'superadmin') OR has_role(auth.uid(), 'superadmin_user'));

-- ---- render_sessions ----
DROP POLICY IF EXISTS "co_render_sessions" ON public.render_sessions;
DROP POLICY IF EXISTS "sa_render_sessions" ON public.render_sessions;
CREATE POLICY "co_render_sessions" ON public.render_sessions FOR ALL TO authenticated
  USING (company_id = my_company());
CREATE POLICY "sa_render_sessions" ON public.render_sessions FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'superadmin') OR has_role(auth.uid(), 'superadmin_user'));
