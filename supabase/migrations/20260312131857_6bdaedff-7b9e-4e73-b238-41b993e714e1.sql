
-- Fix search_path on update_contact_after_call
CREATE OR REPLACE FUNCTION update_contact_after_call(
  p_contact_id UUID,
  p_outcome TEXT,
  p_duration_sec INTEGER,
  p_agent_id UUID,
  p_ai_summary TEXT DEFAULT NULL,
  p_next_call_at TIMESTAMPTZ DEFAULT NULL,
  p_sentiment TEXT DEFAULT 'unknown'
) RETURNS void AS $$
BEGIN
  UPDATE public.contacts SET
    last_call_at = now(),
    last_call_outcome = p_outcome,
    last_call_duration_sec = p_duration_sec,
    last_call_agent_id = p_agent_id,
    call_count = COALESCE(call_count, 0) + 1,
    ai_call_notes = CASE
      WHEN p_ai_summary IS NOT NULL THEN p_ai_summary
      ELSE ai_call_notes
    END,
    next_call_at = p_next_call_at,
    status = CASE
      WHEN p_outcome = 'answered' AND p_sentiment = 'positive' THEN 'qualified'
      WHEN p_outcome = 'answered' AND p_sentiment = 'negative' THEN 'not_qualified'
      WHEN p_outcome = 'answered' THEN 'called'
      WHEN p_outcome = 'no_answer' OR p_outcome = 'busy' THEN 'callback'
      WHEN p_outcome = 'voicemail' THEN 'callback'
      ELSE status
    END,
    updated_at = now()
  WHERE id = p_contact_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;
