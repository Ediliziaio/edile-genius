-- 1. Fix launch_bulk_calls: remove my_company() check, use profiles lookup instead
CREATE OR REPLACE FUNCTION public.launch_bulk_calls(
  p_company_id uuid,
  p_contact_ids uuid[],
  p_agent_id uuid,
  p_scheduled_at timestamptz DEFAULT NULL,
  p_notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_contact        RECORD;
  v_queued_count   INT := 0;
  v_skipped_dnc    INT := 0;
  v_skipped_dup    INT := 0;
  v_errors         INT := 0;
  v_scheduled_time TIMESTAMPTZ;
  v_offset         INT := 0;
  v_caller_company UUID;
BEGIN
  SELECT company_id INTO v_caller_company
  FROM public.profiles WHERE id = auth.uid();

  IF v_caller_company IS NULL OR v_caller_company != p_company_id THEN
    RAISE EXCEPTION 'Accesso negato: company_id non corrisponde';
  END IF;

  IF array_length(p_contact_ids, 1) IS NULL THEN
    RAISE EXCEPTION 'Lista contatti vuota';
  END IF;
  IF array_length(p_contact_ids, 1) > 200 THEN
    RAISE EXCEPTION 'Massimo 200 contatti per batch';
  END IF;

  FOR v_contact IN
    SELECT id, phone, full_name, do_not_call
    FROM contacts
    WHERE id = ANY(p_contact_ids)
      AND company_id = p_company_id
  LOOP
    IF v_contact.do_not_call THEN
      v_skipped_dnc := v_skipped_dnc + 1;
      CONTINUE;
    END IF;
    IF v_contact.phone IS NULL OR v_contact.phone = '' THEN
      v_errors := v_errors + 1;
      CONTINUE;
    END IF;
    IF EXISTS (
      SELECT 1 FROM scheduled_calls
      WHERE contact_id = v_contact.id AND status = 'pending'
        AND scheduled_at > now() - interval '1 hour'
    ) THEN
      v_skipped_dup := v_skipped_dup + 1;
      CONTINUE;
    END IF;

    IF p_scheduled_at IS NULL THEN
      v_scheduled_time := now() + (v_offset * interval '30 seconds');
    ELSE
      v_scheduled_time := p_scheduled_at + (v_offset * interval '1 minute');
    END IF;

    INSERT INTO scheduled_calls (company_id, contact_id, agent_id, scheduled_at, status, notes)
    VALUES (p_company_id, v_contact.id, p_agent_id::text, v_scheduled_time, 'pending', p_notes);

    v_queued_count := v_queued_count + 1;
    v_offset := v_offset + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'queued', v_queued_count, 'skipped_dnc', v_skipped_dnc,
    'skipped_dup', v_skipped_dup, 'errors', v_errors,
    'first_call_at', COALESCE(p_scheduled_at, now())
  );
END;
$function$;

-- 2. Change RLS policies from public to authenticated on 6 tables
-- Drop all old policies
DROP POLICY IF EXISTS "company_webhooks" ON public.webhooks;
DROP POLICY IF EXISTS "superadmin_webhooks" ON public.webhooks;
DROP POLICY IF EXISTS "company_webhook_logs" ON public.webhook_logs;
DROP POLICY IF EXISTS "superadmin_webhook_logs" ON public.webhook_logs;
DROP POLICY IF EXISTS "n8n_executions_company_isolation" ON public.n8n_executions;
DROP POLICY IF EXISTS "n8n_executions_superadmin" ON public.n8n_executions;
DROP POLICY IF EXISTS "n8n_workflows_company_isolation" ON public.n8n_workflows;
DROP POLICY IF EXISTS "n8n_workflows_superadmin" ON public.n8n_workflows;
DROP POLICY IF EXISTS "telegram_log_company_isolation" ON public.telegram_message_log;
DROP POLICY IF EXISTS "telegram_log_superadmin" ON public.telegram_message_log;
DROP POLICY IF EXISTS "whatsapp_contacts_company" ON public.whatsapp_contacts;
DROP POLICY IF EXISTS "whatsapp_contacts_superadmin" ON public.whatsapp_contacts;

-- Recreate with authenticated role (preserving original USING clauses)
CREATE POLICY "company_webhooks" ON public.webhooks FOR ALL TO authenticated
  USING (company_id = get_user_company_id(auth.uid()));
CREATE POLICY "superadmin_webhooks" ON public.webhooks FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'superadmin') OR has_role(auth.uid(), 'superadmin_user'));

CREATE POLICY "company_webhook_logs" ON public.webhook_logs FOR ALL TO authenticated
  USING (webhook_id IN (SELECT id FROM webhooks WHERE company_id = get_user_company_id(auth.uid())));
CREATE POLICY "superadmin_webhook_logs" ON public.webhook_logs FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'superadmin') OR has_role(auth.uid(), 'superadmin_user'));

CREATE POLICY "n8n_executions_company_isolation" ON public.n8n_executions FOR ALL TO authenticated
  USING (company_id = get_user_company_id(auth.uid()));
CREATE POLICY "n8n_executions_superadmin" ON public.n8n_executions FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'superadmin') OR has_role(auth.uid(), 'superadmin_user'));

CREATE POLICY "n8n_workflows_company_isolation" ON public.n8n_workflows FOR ALL TO authenticated
  USING (company_id = get_user_company_id(auth.uid()));
CREATE POLICY "n8n_workflows_superadmin" ON public.n8n_workflows FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'superadmin') OR has_role(auth.uid(), 'superadmin_user'));

CREATE POLICY "telegram_log_company_isolation" ON public.telegram_message_log FOR ALL TO authenticated
  USING (company_id = get_user_company_id(auth.uid()));
CREATE POLICY "telegram_log_superadmin" ON public.telegram_message_log FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'superadmin') OR has_role(auth.uid(), 'superadmin_user'));

CREATE POLICY "whatsapp_contacts_company" ON public.whatsapp_contacts FOR ALL TO authenticated
  USING (company_id = get_user_company_id(auth.uid()));
CREATE POLICY "whatsapp_contacts_superadmin" ON public.whatsapp_contacts FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'superadmin') OR has_role(auth.uid(), 'superadmin_user'));

-- 3. Fix companies UPDATE policy: prevent privilege escalation on sensitive columns
DROP POLICY IF EXISTS "company_update_own" ON public.companies;

CREATE POLICY "company_update_own" ON public.companies
  FOR UPDATE TO authenticated
  USING (id = get_user_company_id(auth.uid()))
  WITH CHECK (
    has_role(auth.uid(), 'superadmin')
    OR (
      id = get_user_company_id(auth.uid())
      AND plan IS NOT DISTINCT FROM (SELECT c.plan FROM companies c WHERE c.id = get_user_company_id(auth.uid()))
      AND monthly_calls_limit IS NOT DISTINCT FROM (SELECT c.monthly_calls_limit FROM companies c WHERE c.id = get_user_company_id(auth.uid()))
      AND status IS NOT DISTINCT FROM (SELECT c.status FROM companies c WHERE c.id = get_user_company_id(auth.uid()))
      AND el_api_key IS NOT DISTINCT FROM (SELECT c.el_api_key FROM companies c WHERE c.id = get_user_company_id(auth.uid()))
      AND notes_internal IS NOT DISTINCT FROM (SELECT c.notes_internal FROM companies c WHERE c.id = get_user_company_id(auth.uid()))
    )
  );