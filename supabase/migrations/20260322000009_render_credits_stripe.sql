-- =============================================
-- Render credits Stripe purchase support
-- =============================================

-- 1. Add product_type and render_quantity to ai_credit_packages
ALTER TABLE public.ai_credit_packages
  ADD COLUMN IF NOT EXISTS product_type text NOT NULL DEFAULT 'ai_credits'
    CHECK (product_type IN ('ai_credits', 'render_credits')),
  ADD COLUMN IF NOT EXISTS render_quantity integer;

-- 2. Seed render credit packages
INSERT INTO public.ai_credit_packages (name, minutes, price_eur, badge, sort_order, product_type, render_quantity)
VALUES
  ('Render Starter',      0, 9,  NULL,            10, 'render_credits', 10),
  ('Render Professional', 0, 39, 'Più richiesto',  11, 'render_credits', 50),
  ('Render Business',     0, 69, 'Miglior Valore', 12, 'render_credits', 100)
ON CONFLICT DO NOTHING;

-- 3. Atomic render credit topup RPC (idempotent via stripe_session_id)
CREATE OR REPLACE FUNCTION public.process_stripe_render_topup(
  _company_id        uuid,
  _render_quantity   integer,
  _price_paid_eur    numeric,
  _stripe_session_id text,
  _package_id        uuid DEFAULT NULL,
  _invoice_number    text DEFAULT NULL,
  _triggered_by      uuid DEFAULT NULL,
  _notes             text DEFAULT NULL
)
RETURNS TABLE(new_balance integer, invoice_number text, already_processed boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _current_balance integer;
  _new_balance     integer;
BEGIN
  -- Idempotency: if this stripe session was already processed, return early
  IF EXISTS (
    SELECT 1 FROM public.ai_credit_topups
    WHERE stripe_session_id = _stripe_session_id
      AND status = 'completed'
  ) THEN
    SELECT rc.balance INTO _current_balance
    FROM public.render_credits rc WHERE rc.company_id = _company_id;
    RETURN QUERY SELECT COALESCE(_current_balance, 0), _invoice_number, true;
    RETURN;
  END IF;

  -- Lock render_credits row
  SELECT balance INTO _current_balance
  FROM public.render_credits
  WHERE company_id = _company_id
  FOR UPDATE;

  IF NOT FOUND THEN
    INSERT INTO public.render_credits (company_id, balance, total_purchased)
    VALUES (_company_id, 0, 0)
    ON CONFLICT (company_id) DO NOTHING;
    _current_balance := 0;
  END IF;

  _new_balance := COALESCE(_current_balance, 0) + _render_quantity;

  UPDATE public.render_credits
  SET balance         = _new_balance,
      total_purchased = total_purchased + _render_quantity,
      updated_at      = now()
  WHERE company_id = _company_id;

  -- Record topup in ai_credit_topups (reuse existing table, amount_eur = price paid)
  INSERT INTO public.ai_credit_topups (
    company_id, amount_eur, price_paid_eur, type, status,
    payment_method, stripe_session_id, package_id,
    invoice_number, triggered_by, notes, processed_at
  ) VALUES (
    _company_id, _price_paid_eur, _price_paid_eur, 'stripe', 'completed',
    'stripe', _stripe_session_id, _package_id,
    _invoice_number, _triggered_by,
    COALESCE(_notes, 'Acquisto render Stripe') || ' | render: ' || _render_quantity,
    now()
  );

  RETURN QUERY SELECT _new_balance, _invoice_number, false;
END;
$$;
