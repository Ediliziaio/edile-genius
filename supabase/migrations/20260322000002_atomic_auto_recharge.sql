-- Atomic auto-recharge deduplication function.
-- Uses advisory lock to prevent concurrent webhooks from triggering multiple recharges.
-- Returns true if recharge was executed, false if skipped (already done recently).
CREATE OR REPLACE FUNCTION public.try_auto_recharge(
  _company_id    uuid,
  _amount_eur    numeric,
  _balance_after numeric,
  _method        text DEFAULT 'card'
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_lock_key  bigint;
  v_lock_held boolean;
  v_recent    int;
BEGIN
  -- Derive a stable integer key from company_id for advisory lock
  v_lock_key := abs(hashtext(_company_id::text));

  -- Try to acquire session-level advisory lock (non-blocking)
  v_lock_held := pg_try_advisory_xact_lock(v_lock_key);
  IF NOT v_lock_held THEN
    RETURN false; -- another transaction holds the lock → skip
  END IF;

  -- Check if auto-recharge already executed in the last 5 minutes
  SELECT count(*) INTO v_recent
  FROM public.ai_credit_topups
  WHERE company_id = _company_id
    AND type = 'auto'
    AND created_at >= now() - interval '5 minutes';

  IF v_recent > 0 THEN
    RETURN false; -- already recharged recently
  END IF;

  -- Execute recharge atomically
  PERFORM public.topup_credits(_company_id, _amount_eur);

  INSERT INTO public.ai_credit_topups (
    company_id, amount_eur, type, status, payment_method, notes, processed_at
  ) VALUES (
    _company_id,
    _amount_eur,
    'auto',
    'completed',
    _method,
    format('Ricarica automatica — saldo era €%s', round(_balance_after::numeric, 2)),
    now()
  );

  RETURN true;
END;
$function$;

REVOKE ALL ON FUNCTION public.try_auto_recharge FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.try_auto_recharge TO service_role;
