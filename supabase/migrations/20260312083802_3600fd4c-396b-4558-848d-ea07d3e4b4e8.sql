-- Add Stripe-related columns
ALTER TABLE ai_credit_packages
  ADD COLUMN IF NOT EXISTS stripe_price_id TEXT;

ALTER TABLE ai_credit_topups
  ADD COLUMN IF NOT EXISTS stripe_session_id TEXT,
  ADD COLUMN IF NOT EXISTS package_id UUID REFERENCES ai_credit_packages(id);

-- Unique constraint to prevent double-crediting
CREATE UNIQUE INDEX IF NOT EXISTS idx_ai_credit_topups_stripe_session
  ON ai_credit_topups(stripe_session_id) WHERE stripe_session_id IS NOT NULL;