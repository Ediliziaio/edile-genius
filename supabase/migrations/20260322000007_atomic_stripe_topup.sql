-- Atomic Stripe topup function.
-- Inserts the topup record and credits the wallet in a single transaction,
-- preventing the race condition where topup_credits() succeeds but the
-- ai_credit_topups INSERT fails, leaving credits added without an audit trail.
-- Idempotency: returns existing record if stripe_session_id already processed.
CREATE OR REPLACE FUNCTION public.process_stripe_topup(
  _company_id        uuid,
  _credits_eur       numeric,
  _price_paid_eur    numeric,
  _stripe_session_id text,
  _payment_intent_id text,
  _package_id        uuid,
  _invoice_number    text,
  _triggered_by      uuid,
  _notes             text DEFAULT NULL
)
RETURNS TABLE (
  new_balance_eur  numeric,
  invoice_number   text,
  already_processed boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_existing_invoice text;
  v_new_balance      numeric;
BEGIN
  -- Idempotency check inside the transaction
  SELECT t.invoice_number INTO v_existing_invoice
  FROM public.ai_credit_topups t
  WHERE t.stripe_session_id = _stripe_session_id
  LIMIT 1;

  IF FOUND THEN
    -- Already processed — return existing invoice without re-crediting
    SELECT ac.balance_eur INTO v_new_balance
    FROM public.ai_credits ac
    WHERE ac.company_id = _company_id;

    RETURN QUERY SELECT
      COALESCE(v_new_balance, 0::numeric),
      v_existing_invoice,
      true;
    RETURN;
  END IF;

  -- Insert audit record first (fails fast if constraint violated)
  INSERT INTO public.ai_credit_topups (
    company_id, amount_eur, price_paid_eur,
    type, status, payment_method, payment_ref,
    stripe_session_id, package_id, invoice_number,
    triggered_by, notes, processed_at
  ) VALUES (
    _company_id, _credits_eur, _price_paid_eur,
    'stripe', 'completed', 'stripe', _payment_intent_id,
    _stripe_session_id, _package_id, _invoice_number,
    _triggered_by, _notes, now()
  );

  -- Then credit the wallet atomically
  SELECT public.topup_credits(_company_id, _credits_eur) INTO v_new_balance;

  RETURN QUERY SELECT
    COALESCE(v_new_balance, 0::numeric),
    _invoice_number,
    false;
END;
$function$;

REVOKE ALL ON FUNCTION public.process_stripe_topup FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.process_stripe_topup TO service_role;
