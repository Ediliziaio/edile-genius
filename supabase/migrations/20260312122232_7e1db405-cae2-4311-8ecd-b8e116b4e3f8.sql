
-- =============================================
-- FIX 1: Remove duplicate RLS policies on ai_credits
-- =============================================
DROP POLICY IF EXISTS "company_ai_credits_select" ON public.ai_credits;
DROP POLICY IF EXISTS "superadmin_ai_credits" ON public.ai_credits;

-- =============================================
-- FIX 2: Remove duplicate index on ai_credit_topups
-- =============================================
DROP INDEX IF EXISTS public.idx_topups_stripe_session;

-- =============================================
-- FIX 3: Rewrite topup_credits with FOR UPDATE lock (like deduct_call_credits)
-- =============================================
CREATE OR REPLACE FUNCTION public.topup_credits(_company_id uuid, _amount_eur numeric)
 RETURNS numeric
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _current_balance numeric;
  _new_balance numeric;
BEGIN
  -- Lock the row to prevent concurrent updates
  SELECT balance_eur INTO _current_balance
  FROM public.ai_credits
  WHERE company_id = _company_id
  FOR UPDATE;

  -- If no record exists, create one
  IF NOT FOUND THEN
    INSERT INTO public.ai_credits (company_id, balance_eur)
    VALUES (_company_id, 0)
    ON CONFLICT (company_id) DO NOTHING;
    _current_balance := 0;
  END IF;

  _new_balance := COALESCE(_current_balance, 0) + _amount_eur;

  UPDATE public.ai_credits
  SET
    balance_eur = _new_balance,
    total_recharged_eur = COALESCE(total_recharged_eur, 0) + _amount_eur,
    calls_blocked = CASE WHEN calls_blocked = true AND blocked_reason IN ('balance_zero', 'low_balance') THEN false ELSE calls_blocked END,
    blocked_at = CASE WHEN calls_blocked = true AND blocked_reason IN ('balance_zero', 'low_balance') THEN NULL ELSE blocked_at END,
    blocked_reason = CASE WHEN calls_blocked = true AND blocked_reason IN ('balance_zero', 'low_balance') THEN NULL ELSE blocked_reason END,
    updated_at = now()
  WHERE company_id = _company_id;

  RETURN _new_balance;
END;
$function$;

-- =============================================
-- FIX 4: Add RLS to knowledge_base bucket table (if exists)
-- =============================================
-- Note: knowledge_base is a storage bucket, not a table.
-- The ai_knowledge_docs table already has proper RLS.

-- =============================================
-- FIX 5: Add reset_calls_month function for cron use
-- =============================================
CREATE OR REPLACE FUNCTION public.reset_agents_calls_month()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  UPDATE public.agents SET calls_month = 0 WHERE calls_month > 0;
$function$;
