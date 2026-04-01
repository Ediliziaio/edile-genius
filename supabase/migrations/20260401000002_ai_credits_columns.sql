-- Migration 002: Nuove colonne su ai_credits per auto-recharge e override
-- Safe: ADD COLUMN IF NOT EXISTS — non tocca dati esistenti

ALTER TABLE public.ai_credits
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_payment_method_id TEXT,
  -- Stripe saved card per auto-recharge PaymentIntents
  ADD COLUMN IF NOT EXISTS min_reserve_eur DECIMAL(10,4) DEFAULT 2.00,
  -- Blocca le chiamate solo sotto questa soglia (default €2, non €0)
  ADD COLUMN IF NOT EXISTS override_until TIMESTAMPTZ,
  -- Superadmin: sblocca temporaneamente nonostante saldo zero
  ADD COLUMN IF NOT EXISTS override_reason TEXT,
  ADD COLUMN IF NOT EXISTS forecast_days_left INTEGER,
  -- Calcolato periodicamente da cron: stima giorni al esaurimento
  ADD COLUMN IF NOT EXISTS forecast_updated_at TIMESTAMPTZ;

-- Aggiorna la logica di blocco: ora blocca sotto min_reserve_eur, non a 0
-- NOTA: il RPC deduct_call_credits va aggiornato (vedi Migration 004)
