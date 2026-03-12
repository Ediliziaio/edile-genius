
-- Add last_sync_error to company_integrations
ALTER TABLE company_integrations
  ADD COLUMN IF NOT EXISTS last_sync_error TEXT;

-- Add onboarding tracking columns to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS onboarding_skipped_seed BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ;

-- Backfill onboarding_completed_at for existing completed users
UPDATE profiles
SET onboarding_completed_at = updated_at
WHERE onboarding_completed = true AND onboarding_completed_at IS NULL;
