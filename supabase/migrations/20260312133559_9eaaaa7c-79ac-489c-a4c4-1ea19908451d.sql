
-- Add columns to scheduled_calls
ALTER TABLE scheduled_calls
  ADD COLUMN IF NOT EXISTS rescheduled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancelled_reason TEXT;

-- Indexes for call monitor queries
CREATE INDEX IF NOT EXISTS idx_call_log_status_company
  ON outbound_call_log(company_id, status)
  WHERE status IN ('initiated', 'ringing', 'in_progress');

CREATE INDEX IF NOT EXISTS idx_call_log_started_at
  ON outbound_call_log(started_at DESC);

-- Cancel a scheduled call (company-isolated)
CREATE OR REPLACE FUNCTION cancel_scheduled_call(
  p_call_id UUID,
  p_reason TEXT DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  UPDATE scheduled_calls
  SET
    status = 'cancelled',
    cancelled_reason = p_reason
  WHERE id = p_call_id
    AND company_id = my_company()
    AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Chiamata non trovata o non più in stato pending';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Reschedule a call (company-isolated)
CREATE OR REPLACE FUNCTION reschedule_call(
  p_call_id UUID,
  p_new_scheduled_at TIMESTAMPTZ
) RETURNS VOID AS $$
BEGIN
  IF p_new_scheduled_at <= now() THEN
    RAISE EXCEPTION 'La nuova data deve essere nel futuro';
  END IF;

  UPDATE scheduled_calls
  SET
    scheduled_at = p_new_scheduled_at,
    rescheduled_at = now(),
    status = 'pending'
  WHERE id = p_call_id
    AND company_id = my_company()
    AND status IN ('pending', 'failed');

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Chiamata non trovabile o non riprogrammabile';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
