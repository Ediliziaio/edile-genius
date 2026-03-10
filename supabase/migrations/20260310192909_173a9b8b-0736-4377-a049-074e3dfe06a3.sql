
-- 1. Create preventivo_templates table
CREATE TABLE IF NOT EXISTS public.preventivo_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  nome TEXT NOT NULL DEFAULT 'Template Standard',
  logo_url TEXT,
  colore_primario TEXT DEFAULT '#1a1a2e',
  colore_secondario TEXT DEFAULT '#e94560',
  intestazione_azienda TEXT,
  piede_pagina TEXT,
  intro_default TEXT DEFAULT 'A seguito del sopralluogo effettuato, Vi sottoponiamo la nostra migliore offerta per i lavori di seguito descritti.',
  condizioni_default TEXT DEFAULT 'Pagamento: 30% alla conferma, 40% in corso d''opera, 30% a fine lavori.',
  clausole_default TEXT DEFAULT 'I prezzi si intendono IVA esclusa. La presente offerta ha validità 30 giorni dalla data di emissione.',
  firma_testo TEXT DEFAULT 'Il Responsabile',
  show_foto_copertina BOOLEAN DEFAULT true,
  show_foto_voci BOOLEAN DEFAULT true,
  show_subtotali_categoria BOOLEAN DEFAULT true,
  show_firma BOOLEAN DEFAULT true,
  show_condizioni BOOLEAN DEFAULT true,
  validita_giorni_default INTEGER DEFAULT 30,
  iva_default NUMERIC DEFAULT 22,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.preventivo_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "company_preventivo_templates" ON public.preventivo_templates
  FOR ALL TO authenticated USING (company_id = get_user_company_id(auth.uid()));
CREATE POLICY "superadmin_preventivo_templates" ON public.preventivo_templates
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'superadmin'::app_role) OR has_role(auth.uid(), 'superadmin_user'::app_role));

-- 2. Extend preventivi table with ~20 new columns
ALTER TABLE public.preventivi
  ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES public.preventivo_templates(id),
  ADD COLUMN IF NOT EXISTS versione INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS titolo TEXT,
  ADD COLUMN IF NOT EXISTS foto_sopralluogo_urls TEXT[],
  ADD COLUMN IF NOT EXISTS foto_copertina_url TEXT,
  ADD COLUMN IF NOT EXISTS sconto_globale NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS imponibile NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS iva_importo NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS totale_finale NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS condizioni TEXT,
  ADD COLUMN IF NOT EXISTS clausole TEXT,
  ADD COLUMN IF NOT EXISTS intro TEXT,
  ADD COLUMN IF NOT EXISTS firma_testo TEXT,
  ADD COLUMN IF NOT EXISTS tempi_esecuzione TEXT,
  ADD COLUMN IF NOT EXISTS validita_giorni INTEGER DEFAULT 30,
  ADD COLUMN IF NOT EXISTS data_scadenza DATE,
  ADD COLUMN IF NOT EXISTS tracking_aperto_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS tracking_aperto_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS link_accettazione TEXT,
  ADD COLUMN IF NOT EXISTS firma_cliente_url TEXT,
  ADD COLUMN IF NOT EXISTS accettato_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rifiutato_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rifiuto_motivo TEXT,
  ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.preventivi(id),
  ADD COLUMN IF NOT EXISTS inviato_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS inviato_via TEXT,
  ADD COLUMN IF NOT EXISTS cliente_piva TEXT,
  ADD COLUMN IF NOT EXISTS cliente_codice_fiscale TEXT;

-- 3. Create preventivo number sequence
CREATE SEQUENCE IF NOT EXISTS public.preventivo_seq START 1;

-- 4. Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('preventivi-media', 'preventivi-media', false) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('template-assets', 'template-assets', true) ON CONFLICT DO NOTHING;

-- 5. Storage policies for preventivi-media
CREATE POLICY "company_upload_preventivi_media" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'preventivi-media');
CREATE POLICY "company_read_preventivi_media" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'preventivi-media');

-- 6. Storage policies for template-assets
CREATE POLICY "company_upload_template_assets" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'template-assets');
CREATE POLICY "company_read_template_assets" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'template-assets');
CREATE POLICY "public_read_template_assets" ON storage.objects
  FOR SELECT TO anon
  USING (bucket_id = 'template-assets');
