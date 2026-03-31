-- Add titolo (title) column to gallery tables that are missing it
-- Also add original_image_url to render_persiane_gallery (missing from initial schema)

ALTER TABLE public.render_persiane_gallery
  ADD COLUMN IF NOT EXISTS titolo TEXT,
  ADD COLUMN IF NOT EXISTS original_image_url TEXT;

ALTER TABLE public.render_pavimento_gallery
  ADD COLUMN IF NOT EXISTS titolo TEXT;

ALTER TABLE public.render_stanza_gallery
  ADD COLUMN IF NOT EXISTS titolo TEXT;
