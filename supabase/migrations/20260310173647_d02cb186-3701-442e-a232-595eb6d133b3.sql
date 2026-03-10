ALTER TABLE public.platform_config
  ADD COLUMN IF NOT EXISTS n8n_configured boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS n8n_base_url text,
  ADD COLUMN IF NOT EXISTS n8n_api_key_set boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS n8n_tested_at timestamptz,
  ADD COLUMN IF NOT EXISTS n8n_workflows_count integer NOT NULL DEFAULT 0;