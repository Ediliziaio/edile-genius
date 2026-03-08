
-- Add new columns to render_sessions for prompt master system
ALTER TABLE public.render_sessions 
  ADD COLUMN IF NOT EXISTS prompt_blocks jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS prompt_version text,
  ADD COLUMN IF NOT EXISTS prompt_char_count integer,
  ADD COLUMN IF NOT EXISTS foto_analisi jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS config_snapshot jsonb DEFAULT '{}'::jsonb;

-- Add new columns to render_infissi_presets for extended material info
ALTER TABLE public.render_infissi_presets
  ADD COLUMN IF NOT EXISTS materiale_tipo text,
  ADD COLUMN IF NOT EXISTS colore_ral text,
  ADD COLUMN IF NOT EXISTS colore_ncs text,
  ADD COLUMN IF NOT EXISTS finitura text DEFAULT 'liscio_opaco';
