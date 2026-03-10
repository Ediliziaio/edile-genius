
-- Add missing columns to preventivo_templates
ALTER TABLE public.preventivo_templates 
  ADD COLUMN IF NOT EXISTS attivo BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS font TEXT DEFAULT 'Helvetica',
  ADD COLUMN IF NOT EXISTS azienda_nome TEXT,
  ADD COLUMN IF NOT EXISTS azienda_indirizzo TEXT,
  ADD COLUMN IF NOT EXISTS azienda_telefono TEXT,
  ADD COLUMN IF NOT EXISTS azienda_email TEXT,
  ADD COLUMN IF NOT EXISTS azienda_piva TEXT,
  ADD COLUMN IF NOT EXISTS azienda_cf TEXT,
  ADD COLUMN IF NOT EXISTS azienda_rea TEXT,
  ADD COLUMN IF NOT EXISTS azienda_sito TEXT,
  ADD COLUMN IF NOT EXISTS oggetto_default TEXT DEFAULT 'Preventivo lavori edili',
  ADD COLUMN IF NOT EXISTS note_finali TEXT,
  ADD COLUMN IF NOT EXISTS valuta TEXT DEFAULT 'EUR',
  ADD COLUMN IF NOT EXISTS iva_inclusa_default BOOLEAN DEFAULT false;

-- Add missing columns to preventivi
ALTER TABLE public.preventivi 
  ADD COLUMN IF NOT EXISTS luogo_lavori TEXT,
  ADD COLUMN IF NOT EXISTS ai_elaborato BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS pdf_generato_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS pdf_versione INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS invio_email TEXT,
  ADD COLUMN IF NOT EXISTS data_invio TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS email_aperta_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS link_aperto_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS link_aperto_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS accettato_online_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS sconto_globale_percentuale NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sconto_globale_importo NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS condizioni_pagamento TEXT,
  ADD COLUMN IF NOT EXISTS note_finali TEXT,
  ADD COLUMN IF NOT EXISTS intro_testo TEXT;
