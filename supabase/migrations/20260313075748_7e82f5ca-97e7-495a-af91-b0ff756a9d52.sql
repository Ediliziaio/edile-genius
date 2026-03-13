
-- ── TABELLA SESSIONI ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS render_facciata_sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),
  status          TEXT DEFAULT 'pending'
                  CHECK (status IN ('pending','analyzing','analyzed','rendering','completed','error')),
  original_path   TEXT,
  original_width  INT,
  original_height INT,
  analisi         JSONB,
  tipo_intervento TEXT CHECK (tipo_intervento IN (
    'tinteggiatura','cappotto','rivestimento','misto','rifacimento_totale'
  )),
  configurazione  JSONB,
  render_path     TEXT,
  render_url      TEXT,
  prompt_used     TEXT,
  prompt_version  TEXT,
  generation_ms   INT,
  credits_used    INT DEFAULT 1,
  error_message   TEXT
);

-- ── TABELLA GALLERIA ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS render_facciata_gallery (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  session_id      UUID REFERENCES render_facciata_sessions(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ DEFAULT now(),
  original_url    TEXT,
  render_url      TEXT NOT NULL,
  thumbnail_url   TEXT,
  title           TEXT,
  tipo_intervento TEXT,
  colore_name     TEXT,
  is_favorite     BOOLEAN DEFAULT false,
  tags            TEXT[] DEFAULT '{}'
);

-- ── TABELLA PRESET ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS render_facciata_presets (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category      TEXT NOT NULL,
  name          TEXT NOT NULL,
  value         TEXT NOT NULL,
  prompt_fragment TEXT,
  hex_color     TEXT,
  icon          TEXT,
  sort_order    INT DEFAULT 0,
  is_active     BOOLEAN DEFAULT true
);

-- ── RLS POLICIES ─────────────────────────────────────────────
ALTER TABLE render_facciata_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE render_facciata_gallery  ENABLE ROW LEVEL SECURITY;
ALTER TABLE render_facciata_presets  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users own sessions"
  ON render_facciata_sessions FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users own gallery"
  ON render_facciata_gallery FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Presets readable by all authenticated"
  ON render_facciata_presets FOR SELECT
  TO authenticated
  USING (true);

-- ── STORAGE BUCKETS ──────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('facciata-originals', 'facciata-originals', false, 15728640,
   ARRAY['image/jpeg','image/png','image/webp','image/heic']),
  ('facciata-results',   'facciata-results',   true,  25165824,
   ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Users upload facciata originals"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'facciata-originals' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users read own facciata originals"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'facciata-originals' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Facciata results public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'facciata-results');

CREATE POLICY "Service can upload facciata results"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'facciata-results');
