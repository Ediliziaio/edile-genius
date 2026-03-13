-- ══════════════════════════════════════════════════════════════════
-- RENDER TETTO — Schema DB
-- ══════════════════════════════════════════════════════════════════

-- Sessioni di render tetto
CREATE TABLE IF NOT EXISTS render_tetto_sessions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id        UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now(),
  status            TEXT DEFAULT 'draft',

  -- Input
  original_url      TEXT,
  original_image_path TEXT,
  natural_width     INTEGER,
  natural_height    INTEGER,

  -- Analisi AI
  analisi_json      JSONB,

  -- Configurazione
  tipo_tetto        TEXT,
  config_json       JSONB,

  -- Output
  result_url        TEXT,
  prompt_usato      TEXT,
  prompt_user       TEXT,
  prompt_system     TEXT,
  prompt_version    TEXT DEFAULT 'tetto-v1',
  processing_ms     INTEGER,

  -- Note
  session_note      TEXT
);

ALTER TABLE render_tetto_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tetto_sessions_company" ON render_tetto_sessions
  FOR ALL USING (company_id = public.my_company());

CREATE POLICY "tetto_sessions_superadmin" ON render_tetto_sessions
  FOR ALL USING (
    public.has_role(auth.uid(), 'superadmin') OR
    public.has_role(auth.uid(), 'superadmin_user')
  );

CREATE INDEX idx_tetto_sessions_company ON render_tetto_sessions(company_id, created_at DESC);
CREATE INDEX idx_tetto_sessions_user ON render_tetto_sessions(user_id, created_at DESC);

CREATE TRIGGER set_tetto_sessions_updated
  BEFORE UPDATE ON render_tetto_sessions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Gallery tetto
CREATE TABLE IF NOT EXISTS render_tetto_gallery (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id        UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  session_id        UUID REFERENCES render_tetto_sessions(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ DEFAULT now(),
  result_image_url  TEXT NOT NULL,
  original_image_url TEXT,
  tipo_tetto        TEXT,
  config_snapshot   JSONB,
  is_favorite       BOOLEAN DEFAULT false,
  note              TEXT
);

ALTER TABLE render_tetto_gallery ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tetto_gallery_company" ON render_tetto_gallery
  FOR ALL USING (company_id = public.my_company());

CREATE POLICY "tetto_gallery_superadmin" ON render_tetto_gallery
  FOR ALL USING (
    public.has_role(auth.uid(), 'superadmin') OR
    public.has_role(auth.uid(), 'superadmin_user')
  );

CREATE INDEX idx_tetto_gallery_company ON render_tetto_gallery(company_id, created_at DESC);

-- Stili pronti tetto
CREATE TABLE IF NOT EXISTS render_tetto_stili_pronti (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome        TEXT NOT NULL,
  descrizione TEXT,
  emoji       TEXT DEFAULT '🏠',
  preview_url TEXT,
  preview_hex TEXT,
  tipo_tetto  TEXT[],
  config      JSONB NOT NULL,
  tags        TEXT[] DEFAULT '{}',
  ordine      INTEGER DEFAULT 0,
  attivo      BOOLEAN DEFAULT true
);

ALTER TABLE render_tetto_stili_pronti ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tetto_stili_read" ON render_tetto_stili_pronti
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "tetto_stili_superadmin" ON render_tetto_stili_pronti
  FOR ALL USING (
    public.has_role(auth.uid(), 'superadmin') OR
    public.has_role(auth.uid(), 'superadmin_user')
  );

-- Storage buckets
INSERT INTO storage.buckets (id, name, public)
VALUES ('tetto-originals', 'tetto-originals', false)
ON CONFLICT DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('tetto-results', 'tetto-results', true)
ON CONFLICT DO NOTHING;

-- Storage policies: originals (private, user-folder)
CREATE POLICY "tetto_originals_auth_upload"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'tetto-originals');

CREATE POLICY "tetto_originals_owner_read"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'tetto-originals' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Storage policies: results (public read, auth write)
CREATE POLICY "tetto_results_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'tetto-results');

CREATE POLICY "tetto_results_auth_write"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'tetto-results');