
-- ─── Sessioni ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS render_stanza_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'uploading'
    CHECK (status IN ('uploading','analyzing','rendering','completed','failed')),
  original_image_path TEXT,
  original_image_width INTEGER,
  original_image_height INTEGER,
  analisi_json JSONB,
  tipo_stanza TEXT,
  interventi_selezionati TEXT[],
  intensita TEXT DEFAULT 'medio' CHECK (intensita IN ('leggero','medio','radicale')),
  stile_target TEXT,
  config_json JSONB DEFAULT '{}',
  note_aggiuntive TEXT,
  prompt_user TEXT,
  prompt_system TEXT,
  prompt_version TEXT DEFAULT '1.0.0',
  result_image_url TEXT,
  result_image_path TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE render_stanza_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own stanza sessions"
  ON render_stanza_sessions FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ─── Galleria ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS render_stanza_gallery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES render_stanza_sessions(id) ON DELETE SET NULL,
  result_image_url TEXT NOT NULL,
  tipo_stanza TEXT,
  interventi TEXT[],
  stile_target TEXT,
  intensita TEXT,
  config_snapshot JSONB,
  is_favorite BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE render_stanza_gallery ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own stanza gallery"
  ON render_stanza_gallery FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ─── Presets ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS render_stanza_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  categoria TEXT NOT NULL,
  codice TEXT NOT NULL,
  nome TEXT NOT NULL,
  hex TEXT,
  valore_extra TEXT,
  ordine INTEGER DEFAULT 0
);

ALTER TABLE render_stanza_presets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth read stanza presets"
  ON render_stanza_presets FOR SELECT TO authenticated USING (TRUE);

-- Indici
CREATE INDEX idx_stanza_sessions_user ON render_stanza_sessions (user_id, created_at DESC);
CREATE INDEX idx_stanza_gallery_user ON render_stanza_gallery (user_id, created_at DESC);

-- ─── Storage Buckets ──────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('stanza-originals','stanza-originals', FALSE, 15728640,
  ARRAY['image/jpeg','image/png','image/webp']) ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('stanza-results','stanza-results', TRUE, 25165824,
  ARRAY['image/jpeg','image/png','image/webp']) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Auth users upload stanza originals"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'stanza-originals' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Auth users read own stanza originals"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'stanza-originals' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Public read stanza results"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'stanza-results');

CREATE POLICY "Auth users upload stanza results"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'stanza-results');
