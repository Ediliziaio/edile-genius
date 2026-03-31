-- Sprint A Task 1: Add PreventivoEditor + PdfAssembler fields to preventivi

ALTER TABLE public.preventivi
  ADD COLUMN IF NOT EXISTS intro_testo            TEXT,
  ADD COLUMN IF NOT EXISTS condizioni_pagamento   TEXT,
  ADD COLUMN IF NOT EXISTS assembla_config        JSONB NOT NULL DEFAULT '{"blocks":[]}'::jsonb,
  ADD COLUMN IF NOT EXISTS pdf_finale_url         TEXT,
  ADD COLUMN IF NOT EXISTS pdf_finale_generato_at TIMESTAMPTZ;

COMMENT ON COLUMN public.preventivi.intro_testo IS 'Testo introduttivo personalizzabile nel preventivo';
COMMENT ON COLUMN public.preventivi.condizioni_pagamento IS 'Condizioni di pagamento personalizzabili';
COMMENT ON COLUMN public.preventivi.assembla_config IS 'Configurazione blocchi PDF assembler: {"blocks":[{"tipo":"kb_doc","doc_id":"...","titolo":"...","include_copertina":false},{"tipo":"divider","testo":"Capitolo 1"},...]}';
COMMENT ON COLUMN public.preventivi.pdf_finale_url IS 'URL del PDF assemblato finale in storage';
COMMENT ON COLUMN public.preventivi.pdf_finale_generato_at IS 'Timestamp ultima generazione PDF assemblato';
