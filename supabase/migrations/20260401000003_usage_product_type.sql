-- Migration 003: Tag per tipo prodotto su ogni riga di utilizzo

ALTER TABLE public.ai_credit_usage
  ADD COLUMN IF NOT EXISTS product_type TEXT DEFAULT 'vocal';
  -- 'vocal' | 'render' | 'preventivo' | 'automation' | 'other'

CREATE INDEX IF NOT EXISTS idx_usage_product_type
  ON public.ai_credit_usage(product_type, company_id, created_at DESC);

-- Backfill: tutti i record esistenti sono conversazioni vocali
UPDATE public.ai_credit_usage
  SET product_type = 'vocal'
  WHERE product_type IS NULL;
