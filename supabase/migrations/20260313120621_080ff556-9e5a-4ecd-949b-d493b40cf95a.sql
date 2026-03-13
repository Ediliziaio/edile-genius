
-- Create render_stanza_stili_pronti table
CREATE TABLE IF NOT EXISTS public.render_stanza_stili_pronti (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome          TEXT NOT NULL,
  descrizione   TEXT,
  emoji         TEXT DEFAULT '✨',
  tags          TEXT[] DEFAULT '{}',
  tipo_stanza   TEXT DEFAULT 'universale',
  config        JSONB NOT NULL,
  preview_hex   TEXT,
  stile         TEXT,
  attivo        BOOLEAN DEFAULT TRUE,
  ordine        INTEGER DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: public read for active records
ALTER TABLE public.render_stanza_stili_pronti ENABLE ROW LEVEL SECURITY;
CREATE POLICY "stili_stanza_public_read" ON public.render_stanza_stili_pronti
  FOR SELECT USING (attivo = TRUE);

-- Add original_image_url to gallery for before/after display
ALTER TABLE public.render_stanza_gallery ADD COLUMN IF NOT EXISTS original_image_url TEXT;
