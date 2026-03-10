
-- =============================================
-- BLOCCO A+B+C: Tutte le 6 automazioni
-- =============================================

-- 1. Tabella preventivi (Automazione 1)
CREATE TABLE public.preventivi (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  cantiere_id uuid REFERENCES public.cantieri(id) ON DELETE SET NULL,
  numero_preventivo text NOT NULL,
  cliente_nome text,
  cliente_indirizzo text,
  cliente_telefono text,
  cliente_email text,
  oggetto text,
  voci jsonb NOT NULL DEFAULT '[]'::jsonb,
  subtotale numeric DEFAULT 0,
  iva_percentuale numeric DEFAULT 22,
  totale numeric DEFAULT 0,
  note text,
  stato text DEFAULT 'bozza',
  audio_url text,
  trascrizione text,
  pdf_url text,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.preventivi ENABLE ROW LEVEL SECURITY;

CREATE POLICY "company_preventivi" ON public.preventivi FOR ALL TO authenticated
  USING (company_id = get_user_company_id(auth.uid()));
CREATE POLICY "superadmin_preventivi" ON public.preventivi FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'superadmin') OR has_role(auth.uid(), 'superadmin_user'));

-- Sequence per numero preventivo
CREATE SEQUENCE IF NOT EXISTS preventivo_seq START 1;

-- 2. Tabella documenti_azienda (Automazione 2)
CREATE TABLE public.documenti_azienda (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  operaio_id uuid REFERENCES public.cantiere_operai(id) ON DELETE SET NULL,
  tipo text NOT NULL,
  nome text NOT NULL,
  numero_documento text,
  data_emissione date,
  data_scadenza date NOT NULL,
  file_url text,
  stato text DEFAULT 'valido',
  alert_30g boolean DEFAULT false,
  alert_15g boolean DEFAULT false,
  alert_7g boolean DEFAULT false,
  alert_scaduto boolean DEFAULT false,
  note text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.documenti_azienda ENABLE ROW LEVEL SECURITY;

CREATE POLICY "company_documenti" ON public.documenti_azienda FOR ALL TO authenticated
  USING (company_id = get_user_company_id(auth.uid()));
CREATE POLICY "superadmin_documenti" ON public.documenti_azienda FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'superadmin') OR has_role(auth.uid(), 'superadmin_user'));

-- 3. Tabella presenze_mensili (Automazione 3)
CREATE TABLE public.presenze_mensili (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  operaio_id uuid NOT NULL REFERENCES public.cantiere_operai(id) ON DELETE CASCADE,
  cantiere_id uuid REFERENCES public.cantieri(id) ON DELETE SET NULL,
  mese integer NOT NULL CHECK (mese BETWEEN 1 AND 12),
  anno integer NOT NULL,
  ore_giornaliere jsonb NOT NULL DEFAULT '{}'::jsonb,
  ore_totali numeric DEFAULT 0,
  note text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(operaio_id, cantiere_id, mese, anno)
);

ALTER TABLE public.presenze_mensili ENABLE ROW LEVEL SECURITY;

CREATE POLICY "company_presenze" ON public.presenze_mensili FOR ALL TO authenticated
  USING (company_id = get_user_company_id(auth.uid()));
CREATE POLICY "superadmin_presenze" ON public.presenze_mensili FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'superadmin') OR has_role(auth.uid(), 'superadmin_user'));

-- 4. Tabella alert_mancato_report (Automazione 5)
CREATE TABLE public.alert_mancato_report (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  cantiere_id uuid NOT NULL REFERENCES public.cantieri(id) ON DELETE CASCADE,
  data_mancanza date NOT NULL,
  tipo_alert text DEFAULT 'telegram',
  inviato_a jsonb DEFAULT '[]'::jsonb,
  inviato_at timestamptz DEFAULT now(),
  UNIQUE(cantiere_id, data_mancanza)
);

ALTER TABLE public.alert_mancato_report ENABLE ROW LEVEL SECURITY;

CREATE POLICY "company_alert_mr" ON public.alert_mancato_report FOR ALL TO authenticated
  USING (company_id = get_user_company_id(auth.uid()));
CREATE POLICY "superadmin_alert_mr" ON public.alert_mancato_report FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'superadmin') OR has_role(auth.uid(), 'superadmin_user'));

-- 5. Tabella sal_milestones (Automazione 6)
CREATE TABLE public.sal_milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  cantiere_id uuid NOT NULL REFERENCES public.cantieri(id) ON DELETE CASCADE,
  nome text NOT NULL,
  descrizione text,
  target_percentuale integer NOT NULL CHECK (target_percentuale BETWEEN 0 AND 100),
  percentuale_attuale integer DEFAULT 0,
  data_prevista date,
  data_completamento date,
  stato text DEFAULT 'in_corso',
  alert_ritardo_inviato boolean DEFAULT false,
  ordine integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.sal_milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "company_sal" ON public.sal_milestones FOR ALL TO authenticated
  USING (company_id = get_user_company_id(auth.uid()));
CREATE POLICY "superadmin_sal" ON public.sal_milestones FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'superadmin') OR has_role(auth.uid(), 'superadmin_user'));

-- 6. Estensione cantieri (Automazioni 4, 5)
ALTER TABLE public.cantieri
  ADD COLUMN IF NOT EXISTS reminder_ora time DEFAULT '18:00',
  ADD COLUMN IF NOT EXISTS fine_turno_ora time DEFAULT '17:00',
  ADD COLUMN IF NOT EXISTS alert_mancato_report_ore integer DEFAULT 3;

-- 7. Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('preventivi-audio', 'preventivi-audio', false) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('preventivi-pdf', 'preventivi-pdf', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('documenti-azienda', 'documenti-azienda', false) ON CONFLICT DO NOTHING;

-- Storage RLS for preventivi-audio
CREATE POLICY "company_upload_preventivi_audio" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'preventivi-audio' AND (storage.foldername(name))[1] = (get_user_company_id(auth.uid()))::text);
CREATE POLICY "company_read_preventivi_audio" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'preventivi-audio' AND (storage.foldername(name))[1] = (get_user_company_id(auth.uid()))::text);

-- Storage RLS for preventivi-pdf
CREATE POLICY "company_upload_preventivi_pdf" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'preventivi-pdf' AND (storage.foldername(name))[1] = (get_user_company_id(auth.uid()))::text);
CREATE POLICY "company_read_preventivi_pdf" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'preventivi-pdf' AND (storage.foldername(name))[1] = (get_user_company_id(auth.uid()))::text);
CREATE POLICY "public_read_preventivi_pdf" ON storage.objects FOR SELECT TO anon
  USING (bucket_id = 'preventivi-pdf');

-- Storage RLS for documenti-azienda
CREATE POLICY "company_upload_documenti" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'documenti-azienda' AND (storage.foldername(name))[1] = (get_user_company_id(auth.uid()))::text);
CREATE POLICY "company_read_documenti" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'documenti-azienda' AND (storage.foldername(name))[1] = (get_user_company_id(auth.uid()))::text);

-- Trigger updated_at
CREATE TRIGGER set_preventivi_updated_at BEFORE UPDATE ON public.preventivi FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER set_documenti_updated_at BEFORE UPDATE ON public.documenti_azienda FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER set_presenze_updated_at BEFORE UPDATE ON public.presenze_mensili FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER set_sal_updated_at BEFORE UPDATE ON public.sal_milestones FOR EACH ROW EXECUTE FUNCTION set_updated_at();
