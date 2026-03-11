-- Atomic credit deduction RPC to prevent race conditions in elevenlabs-webhook
CREATE OR REPLACE FUNCTION public.deduct_call_credits(
  _company_id uuid,
  _cost_billed numeric,
  _cost_real numeric
)
RETURNS TABLE(balance_before numeric, balance_after numeric, was_blocked boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _balance_before numeric;
  _balance_after numeric;
  _auto_recharge_enabled boolean;
  _auto_recharge_threshold numeric;
  _auto_recharge_amount numeric;
BEGIN
  -- Lock the row to prevent concurrent updates
  SELECT balance_eur, auto_recharge_enabled, auto_recharge_threshold, auto_recharge_amount
  INTO _balance_before, _auto_recharge_enabled, _auto_recharge_threshold, _auto_recharge_amount
  FROM public.ai_credits
  WHERE company_id = _company_id
  FOR UPDATE;

  IF _balance_before IS NULL THEN
    _balance_before := 0;
  END IF;

  _balance_after := ROUND(_balance_before - _cost_billed, 4);

  UPDATE public.ai_credits
  SET
    balance_eur = _balance_after,
    total_spent_eur = COALESCE(total_spent_eur, 0) + _cost_billed,
    updated_at = now(),
    -- Block calls if balance is zero or negative
    calls_blocked = CASE WHEN _balance_after <= 0 THEN true ELSE calls_blocked END,
    blocked_at = CASE WHEN _balance_after <= 0 AND (calls_blocked IS NOT TRUE) THEN now() ELSE blocked_at END,
    blocked_reason = CASE WHEN _balance_after <= 0 THEN 'balance_zero' ELSE blocked_reason END
  WHERE company_id = _company_id;

  RETURN QUERY SELECT _balance_before, _balance_after, (_balance_after <= 0);
END;
$$;