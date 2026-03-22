-- =============================================
-- Atomic render credit deduction with FOR UPDATE
-- Returns: 'ok' if deducted, 'insufficient' if balance was 0
-- =============================================
CREATE OR REPLACE FUNCTION public.deduct_render_credit(_company_id uuid)
  RETURNS text
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
DECLARE
  _balance integer;
BEGIN
  SELECT balance INTO _balance
  FROM public.render_credits
  WHERE company_id = _company_id
  FOR UPDATE;

  IF NOT FOUND OR _balance <= 0 THEN
    RETURN 'insufficient';
  END IF;

  UPDATE public.render_credits
  SET balance    = balance - 1,
      total_used = total_used + 1,
      updated_at = now()
  WHERE company_id = _company_id;

  RETURN 'ok';
END;
$$;
