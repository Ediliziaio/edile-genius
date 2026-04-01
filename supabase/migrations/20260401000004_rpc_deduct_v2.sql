-- Migration 004: RPC deduct_call_credits v2
-- Blocca sotto min_reserve_eur, rispetta override_until SA, limita debito a -5 EUR

CREATE OR REPLACE FUNCTION public.deduct_call_credits(
  _company_id UUID,
  _cost_billed NUMERIC,
  _cost_real NUMERIC,
  _product_type TEXT DEFAULT 'vocal'
)
RETURNS TABLE(balance_before NUMERIC, balance_after NUMERIC, was_blocked BOOLEAN)
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  _balance_before NUMERIC;
  _balance_after NUMERIC;
  _min_reserve NUMERIC;
  _override_until TIMESTAMPTZ;
  _is_overridden BOOLEAN;
BEGIN
  SELECT balance_eur, COALESCE(min_reserve_eur, 2.00), override_until
    INTO _balance_before, _min_reserve, _override_until
    FROM public.ai_credits
    WHERE company_id = _company_id
    FOR UPDATE;

  IF _balance_before IS NULL THEN _balance_before := 0; END IF;

  -- Limita il debito massimo a -5 EUR (no debito infinito)
  _balance_after := GREATEST(
    ROUND(_balance_before - _cost_billed, 4),
    -5.0000
  );

  -- Override attivo se superadmin ha sbloccato temporaneamente
  _is_overridden := (_override_until IS NOT NULL AND _override_until > now());

  UPDATE public.ai_credits SET
    balance_eur = _balance_after,
    total_spent_eur = COALESCE(total_spent_eur, 0) + _cost_billed,
    updated_at = now(),
    calls_blocked = CASE
      WHEN _is_overridden THEN false
      -- override SA: mai bloccare
      WHEN _balance_after <= _min_reserve THEN true
      -- sotto riserva minima: blocca
      ELSE calls_blocked
    END,
    blocked_at = CASE
      WHEN NOT _is_overridden AND _balance_after <= _min_reserve
        AND (calls_blocked IS NOT TRUE) THEN now()
      ELSE blocked_at
    END,
    blocked_reason = CASE
      WHEN NOT _is_overridden AND _balance_after <= _min_reserve THEN 'min_reserve_reached'
      ELSE blocked_reason
    END
  WHERE company_id = _company_id;

  RETURN QUERY SELECT _balance_before, _balance_after,
    (_balance_after <= _min_reserve AND NOT _is_overridden);
END;
$$;

REVOKE ALL ON FUNCTION public.deduct_call_credits(UUID, NUMERIC, NUMERIC, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.deduct_call_credits(UUID, NUMERIC, NUMERIC, TEXT) TO service_role;
