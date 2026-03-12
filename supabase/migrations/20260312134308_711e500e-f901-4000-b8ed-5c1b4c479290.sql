
-- RPC function for bulk calling with DNC/dedup protection
CREATE OR REPLACE FUNCTION public.launch_bulk_calls(
  p_company_id       UUID,
  p_contact_ids      UUID[],
  p_agent_id         TEXT,
  p_scheduled_at     TIMESTAMPTZ DEFAULT NULL,
  p_notes            TEXT DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  v_contact        RECORD;
  v_queued_count   INT := 0;
  v_skipped_dnc    INT := 0;
  v_skipped_dup    INT := 0;
  v_errors         INT := 0;
  v_scheduled_time TIMESTAMPTZ;
  v_offset         INT := 0;
BEGIN
  -- Must be called by company member
  IF p_company_id != my_company() THEN
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
    -- Skip DNC
    IF v_contact.do_not_call THEN
      v_skipped_dnc := v_skipped_dnc + 1;
      CONTINUE;
    END IF;

    -- Skip if no phone
    IF v_contact.phone IS NULL OR v_contact.phone = '' THEN
      v_errors := v_errors + 1;
      CONTINUE;
    END IF;

    -- Skip if pending scheduled_call already exists for this contact within 1 hour
    IF EXISTS (
      SELECT 1 FROM scheduled_calls
      WHERE contact_id = v_contact.id
        AND status = 'pending'
        AND scheduled_at > now() - interval '1 hour'
    ) THEN
      v_skipped_dup := v_skipped_dup + 1;
      CONTINUE;
    END IF;

    -- Calculate staggered time
    IF p_scheduled_at IS NULL THEN
      v_scheduled_time := now() + (v_offset * interval '30 seconds');
    ELSE
      v_scheduled_time := p_scheduled_at + (v_offset * interval '1 minute');
    END IF;

    INSERT INTO scheduled_calls (
      company_id, contact_id, agent_id, scheduled_at, status, notes
    ) VALUES (
      p_company_id, v_contact.id, p_agent_id, v_scheduled_time, 'pending', p_notes
    );

    v_queued_count := v_queued_count + 1;
    v_offset := v_offset + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'queued',       v_queued_count,
    'skipped_dnc',  v_skipped_dnc,
    'skipped_dup',  v_skipped_dup,
    'errors',       v_errors,
    'first_call_at', COALESCE(p_scheduled_at, now())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

REVOKE ALL ON FUNCTION public.launch_bulk_calls FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.launch_bulk_calls TO authenticated;
