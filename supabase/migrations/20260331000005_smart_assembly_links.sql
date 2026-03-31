-- Sprint D: Smart Assembly — link prodotti ↔ KB documenti ↔ listino_voci

-- D1: codice_prodotto su preventivo_kb_documenti
-- Permette di dire: "questo PDF è la scheda tecnica di URBAN"
ALTER TABLE public.preventivo_kb_documenti
  ADD COLUMN IF NOT EXISTS codice_prodotto TEXT;

-- Index per ricerca rapida per codice
CREATE INDEX IF NOT EXISTS idx_kb_doc_codice_prodotto
  ON public.preventivo_kb_documenti (company_id, codice_prodotto)
  WHERE codice_prodotto IS NOT NULL;

COMMENT ON COLUMN public.preventivo_kb_documenti.codice_prodotto
  IS 'Codice/nome prodotto per abbinamento automatico (es. "URBAN", "WALK-IN-X"). Case-insensitive.';

-- D2: kb_documento_id su listino_voci
-- Collega una voce di listino al suo PDF tecnico
ALTER TABLE public.listino_voci
  ADD COLUMN IF NOT EXISTS kb_documento_id UUID
    REFERENCES public.preventivo_kb_documenti(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_listino_voci_kb_doc
  ON public.listino_voci (kb_documento_id)
  WHERE kb_documento_id IS NOT NULL;

COMMENT ON COLUMN public.listino_voci.kb_documento_id
  IS 'FK opzionale al PDF tecnico associato a questa voce di listino (scheda prodotto, certificazioni, ecc.)';
