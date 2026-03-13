-- ══════════════════════════════════════════════════════════════════
-- Doc 1/7: pgvector + KB tables + RAG columns + search function
-- ══════════════════════════════════════════════════════════════════

-- 1. Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Knowledge Base documents table
CREATE TABLE IF NOT EXISTS preventivo_kb_documenti (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),
  nome            TEXT NOT NULL,
  descrizione     TEXT,
  file_url        TEXT NOT NULL,
  file_type       TEXT NOT NULL,
  file_size_kb    INTEGER,
  pagine          INTEGER,
  categoria       TEXT NOT NULL DEFAULT 'altro',
  stato           TEXT DEFAULT 'caricato',
  errore_msg      TEXT,
  indicizzato_at  TIMESTAMPTZ,
  chunks_count    INTEGER DEFAULT 0,
  tags            TEXT[],
  visibile        BOOLEAN DEFAULT true
);

ALTER TABLE preventivo_kb_documenti ENABLE ROW LEVEL SECURITY;

CREATE POLICY "kb_doc_company_access" ON preventivo_kb_documenti
  FOR ALL TO authenticated
  USING (company_id = my_company());

CREATE POLICY "kb_doc_superadmin" ON preventivo_kb_documenti
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'superadmin'));

CREATE TRIGGER set_updated_at_kb_documenti
  BEFORE UPDATE ON preventivo_kb_documenti
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 3. KB chunks with vector embeddings
CREATE TABLE IF NOT EXISTS preventivo_kb_chunks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  documento_id    UUID NOT NULL REFERENCES preventivo_kb_documenti(id) ON DELETE CASCADE,
  company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ DEFAULT now(),
  testo           TEXT NOT NULL,
  testo_preview   TEXT,
  pagina          INTEGER,
  chunk_index     INTEGER,
  embedding       vector(768),
  categoria       TEXT,
  tags            TEXT[]
);

ALTER TABLE preventivo_kb_chunks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "kb_chunks_company_access" ON preventivo_kb_chunks
  FOR ALL TO authenticated
  USING (company_id = my_company());

CREATE POLICY "kb_chunks_superadmin" ON preventivo_kb_chunks
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'superadmin'));

-- Vector index for similarity search
CREATE INDEX IF NOT EXISTS idx_kb_chunks_embedding
  ON preventivo_kb_chunks
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- Category filtering index
CREATE INDEX IF NOT EXISTS idx_kb_chunks_company_categoria
  ON preventivo_kb_chunks (company_id, categoria);

-- 4. Add RAG columns to existing preventivi table
ALTER TABLE preventivi
  ADD COLUMN IF NOT EXISTS render_ids UUID[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS foto_analisi_urls TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS superfici_stimate JSONB,
  ADD COLUMN IF NOT EXISTS sezioni_json JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS oggetto_lavori TEXT,
  ADD COLUMN IF NOT EXISTS indirizzo_cantiere TEXT,
  ADD COLUMN IF NOT EXISTS note_interne TEXT;

-- 5. Add sezioni column to existing preventivo_templates
ALTER TABLE preventivo_templates
  ADD COLUMN IF NOT EXISTS sezioni JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS descrizione TEXT,
  ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT false;

-- 6. Similarity search function (SECURITY DEFINER - uses explicit company_id param)
CREATE OR REPLACE FUNCTION search_kb_chunks(
  p_company_id  UUID,
  p_embedding   vector(768),
  p_categoria   TEXT DEFAULT NULL,
  p_top_k       INTEGER DEFAULT 6,
  p_threshold   FLOAT DEFAULT 0.70
)
RETURNS TABLE (
  id            UUID,
  documento_id  UUID,
  testo         TEXT,
  pagina        INTEGER,
  categoria     TEXT,
  similarity    FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.documento_id,
    c.testo,
    c.pagina,
    c.categoria,
    (1 - (c.embedding <=> p_embedding))::FLOAT AS similarity
  FROM preventivo_kb_chunks c
  WHERE c.company_id = p_company_id
    AND (p_categoria IS NULL OR c.categoria = p_categoria)
    AND 1 - (c.embedding <=> p_embedding) > p_threshold
  ORDER BY c.embedding <=> p_embedding
  LIMIT p_top_k;
END;
$$;

-- 7. Storage bucket for KB documents
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('preventivo-kb', 'preventivo-kb', false, 52428800)
ON CONFLICT DO NOTHING;

CREATE POLICY "kb_upload_auth" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'preventivo-kb');

CREATE POLICY "kb_read_auth" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'preventivo-kb');

CREATE POLICY "kb_delete_auth" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'preventivo-kb');