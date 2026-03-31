-- Sprint A Task 2: Tabella listino_voci con full-text search

CREATE TABLE IF NOT EXISTS public.listino_voci (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id       UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now(),
  codice           TEXT,
  categoria        TEXT NOT NULL DEFAULT 'generale',
  titolo_voce      TEXT NOT NULL,
  descrizione      TEXT,
  unita_misura     TEXT NOT NULL DEFAULT 'corpo',
  prezzo_unitario  NUMERIC(12,2) NOT NULL DEFAULT 0,
  iva_percentuale  NUMERIC(5,2) DEFAULT 22,
  note             TEXT,
  attivo           BOOLEAN DEFAULT true,
  -- Full-text search vector (Italian stemming)
  fts              TSVECTOR GENERATED ALWAYS AS (
    to_tsvector('italian',
      coalesce(codice, '') || ' ' ||
      coalesce(titolo_voce, '') || ' ' ||
      coalesce(descrizione, '') || ' ' ||
      coalesce(categoria, '')
    )
  ) STORED
);

-- Index for FTS
CREATE INDEX IF NOT EXISTS idx_listino_voci_fts
  ON public.listino_voci USING GIN (fts);

-- Index for company lookups
CREATE INDEX IF NOT EXISTS idx_listino_voci_company
  ON public.listino_voci (company_id, attivo);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at_listino_voci()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_listino_voci_updated_at
  BEFORE UPDATE ON public.listino_voci
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_listino_voci();

-- RLS
ALTER TABLE public.listino_voci ENABLE ROW LEVEL SECURITY;

CREATE POLICY "listino_voci_company" ON public.listino_voci
  FOR ALL TO authenticated
  USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "listino_voci_superadmin" ON public.listino_voci
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'superadmin') OR has_role(auth.uid(), 'superadmin_user'));

-- Full-text search helper function
CREATE OR REPLACE FUNCTION public.cerca_listino(
  p_company_id UUID,
  p_query      TEXT,
  p_limit      INT DEFAULT 20
)
RETURNS SETOF public.listino_voci
LANGUAGE sql
STABLE
AS $$
  SELECT *
  FROM public.listino_voci
  WHERE company_id = p_company_id
    AND attivo = true
    AND (
      p_query IS NULL OR p_query = ''
      OR fts @@ plainto_tsquery('italian', p_query)
      OR titolo_voce ILIKE '%' || p_query || '%'
      OR codice ILIKE '%' || p_query || '%'
    )
  ORDER BY
    CASE WHEN p_query IS NOT NULL AND p_query != ''
      THEN ts_rank(fts, plainto_tsquery('italian', p_query))
      ELSE 0
    END DESC,
    categoria,
    titolo_voce
  LIMIT p_limit;
$$;

COMMENT ON TABLE public.listino_voci IS 'Listino prezzi aziendale per preventivi con ricerca full-text in italiano';
