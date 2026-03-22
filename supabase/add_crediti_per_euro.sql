-- Aggiunge il tasso di conversione €→crediti alla configurazione piattaforma
-- Esegui questo nel Supabase SQL Editor

ALTER TABLE public.platform_config
  ADD COLUMN IF NOT EXISTS crediti_per_euro numeric NOT NULL DEFAULT 10;

-- Imposta il valore attuale (1€ = 10 crediti)
UPDATE public.platform_config SET crediti_per_euro = 10;
