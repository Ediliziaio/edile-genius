
-- ── FIX 1: RPC atomica per post-call-actions ──
CREATE OR REPLACE FUNCTION public.process_post_call_atomic(
  p_contact_id UUID,
  p_company_id UUID,
  p_outcome TEXT,
  p_next_step TEXT DEFAULT NULL,
  p_conversation_id TEXT DEFAULT NULL,
  p_action_log_entry JSONB DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_current_status TEXT;
  v_current_log JSONB;
  v_current_attempts INT;
  v_new_status TEXT;
  v_next_call_at TIMESTAMPTZ;
  v_campaigns_excluded INT := 0;
BEGIN
  SELECT status, ai_actions_log, call_attempts
  INTO v_current_status, v_current_log, v_current_attempts
  FROM contacts WHERE id = p_contact_id FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'contact_not_found');
  END IF;

  v_new_status := CASE p_outcome
    WHEN 'appointment' THEN 'qualified'
    WHEN 'qualified' THEN 'qualified'
    WHEN 'callback' THEN 'callback'
    WHEN 'not_interested' THEN 'not_interested'
    WHEN 'do_not_call' THEN 'do_not_call'
    WHEN 'wrong_number' THEN 'invalid'
    ELSE NULL
  END;

  IF p_outcome = 'appointment' OR p_outcome = 'callback' THEN
    v_next_call_at := (CURRENT_DATE + 1) +
      CASE p_outcome WHEN 'appointment' THEN interval '9 hours' ELSE interval '10 hours' END;
    IF EXTRACT(DOW FROM v_next_call_at) = 0 THEN v_next_call_at := v_next_call_at + interval '1 day'; END IF;
    IF EXTRACT(DOW FROM v_next_call_at) = 6 THEN v_next_call_at := v_next_call_at + interval '2 days'; END IF;
  END IF;

  IF v_current_log IS NULL OR jsonb_typeof(v_current_log) != 'array' THEN
    v_current_log := '[]'::jsonb;
  END IF;
  IF p_action_log_entry IS NOT NULL THEN
    v_current_log := v_current_log || jsonb_build_array(p_action_log_entry);
    IF jsonb_array_length(v_current_log) > 50 THEN
      v_current_log := (SELECT jsonb_agg(elem) FROM (
        SELECT elem FROM jsonb_array_elements(v_current_log) WITH ORDINALITY AS t(elem, ord)
        ORDER BY ord DESC LIMIT 50
      ) sub);
    END IF;
  END IF;

  UPDATE contacts SET
    last_contact_at = now(),
    call_attempts = COALESCE(v_current_attempts, 0) + 1,
    ai_actions_log = v_current_log,
    status = COALESCE(v_new_status, status),
    next_call_at = COALESCE(v_next_call_at, next_call_at),
    notes = COALESCE(p_next_step, notes)
  WHERE id = p_contact_id;

  IF p_outcome IN ('not_interested', 'do_not_call') THEN
    UPDATE campaign_contacts cc SET status = 'excluded', updated_at = now()
    FROM campaigns c
    WHERE cc.contact_id = p_contact_id
      AND cc.campaign_id = c.id
      AND c.company_id = p_company_id
      AND c.status IN ('active', 'scheduled')
      AND cc.status IN ('pending', 'retry');
    GET DIAGNOSTICS v_campaigns_excluded = ROW_COUNT;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'new_status', COALESCE(v_new_status, v_current_status),
    'campaigns_excluded', v_campaigns_excluded
  );
END;
$$;

-- ── FIX 2: Index for orchestrator dedup performance ──
CREATE INDEX IF NOT EXISTS idx_orchestrator_log_dedup
  ON ai_orchestrator_log (company_id, entity_id, event_type, created_at DESC);

-- ── FIX 3: Advisory lock acquire function ──
CREATE OR REPLACE FUNCTION public.try_acquire_campaign_lock(p_lock_id BIGINT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$ SELECT pg_try_advisory_lock(p_lock_id); $$;

-- ── FIX 4: Weekly reports log table ──
CREATE TABLE IF NOT EXISTS public.weekly_reports_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  week_start DATE NOT NULL,
  sent_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  error_message TEXT,
  retry_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, week_start)
);

ALTER TABLE public.weekly_reports_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "weekly_reports_company_read"
  ON public.weekly_reports_log
  FOR SELECT
  TO authenticated
  USING (company_id = public.my_company());

-- ── FIX 5: Atomic credit reservation ──
CREATE OR REPLACE FUNCTION public.reserve_followup_credits(
  p_company_id UUID,
  p_amount_eur NUMERIC
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_balance NUMERIC;
BEGIN
  SELECT balance_eur INTO v_balance FROM ai_credits WHERE company_id = p_company_id FOR UPDATE;
  IF v_balance IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'no_credits_record');
  END IF;
  IF v_balance < p_amount_eur THEN
    RETURN jsonb_build_object('success', false, 'available', v_balance, 'required', p_amount_eur);
  END IF;
  UPDATE ai_credits SET balance_eur = balance_eur - p_amount_eur, updated_at = now()
  WHERE company_id = p_company_id;
  RETURN jsonb_build_object('success', true, 'balance_after', v_balance - p_amount_eur);
END;
$$;

CREATE OR REPLACE FUNCTION public.release_followup_credits(
  p_company_id UUID,
  p_used_eur NUMERIC,
  p_reserved_eur NUMERIC
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_refund NUMERIC;
BEGIN
  v_refund := GREATEST(0, p_reserved_eur - p_used_eur);
  IF v_refund > 0 THEN
    UPDATE ai_credits SET balance_eur = balance_eur + v_refund, updated_at = now()
    WHERE company_id = p_company_id;
  END IF;
END;
$$;
