
-- Add meta_config_id to superadmin_whatsapp_config
ALTER TABLE public.superadmin_whatsapp_config
  ADD COLUMN IF NOT EXISTS meta_config_id text DEFAULT NULL;

-- Add token refresh tracking to whatsapp_waba_config
ALTER TABLE public.whatsapp_waba_config
  ADD COLUMN IF NOT EXISTS token_refreshed_at timestamptz DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS token_refresh_error text DEFAULT NULL;
