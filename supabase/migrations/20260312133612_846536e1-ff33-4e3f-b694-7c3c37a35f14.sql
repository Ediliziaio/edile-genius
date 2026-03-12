
-- Fix search_path for cancel_scheduled_call
CREATE OR REPLACE FUNCTION cancel_scheduled_call(
  p_call_id UUID,
  p_reason TEXT DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  UPDATE public.scheduled_calls
  SET
    status = 'cancelled',
    cancelled_reason = p_reason
  WHERE id = p_call_id
    AND company_id = public.my_company()
    AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Chiamata non trovata o non più in stato pending';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix search_path for reschedule_call
CREATE OR REPLACE FUNCTION reschedule_call(
  p_call_id UUID,
  p_new_scheduled_at TIMESTAMPTZ
) RETURNS VOID AS $$
BEGIN
  IF p_new_scheduled_at <= now() THEN
    RAISE EXCEPTION 'La nuova data deve essere nel futuro';
  END IF;

  UPDATE public.scheduled_calls
  SET
    scheduled_at = p_new_scheduled_at,
    rescheduled_at = now(),
    status = 'pending'
  WHERE id = p_call_id
    AND company_id = public.my_company()
    AND status IN ('pending', 'failed');

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Chiamata non trovabile o non riprogrammabile';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
