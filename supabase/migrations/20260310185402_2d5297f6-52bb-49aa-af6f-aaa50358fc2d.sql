
-- 1. Tabella Cantieri
CREATE TABLE IF NOT EXISTS public.cantieri (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  indirizzo TEXT,
  committente TEXT,
  responsabile TEXT,
  data_inizio DATE,
  data_fine_prevista DATE,
  stato TEXT DEFAULT 'attivo',
  note TEXT,
  foto_url TEXT,
  telegram_chat_ids TEXT[],
  email_report TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE POLICY "company_cantieri" ON public.cantieri
  FOR ALL TO authenticated USING (company_id = get_user_company_id(auth.uid()));
CREATE POLICY "superadmin_cantieri" ON public.cantieri
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'superadmin'::app_role) OR has_role(auth.uid(), 'superadmin_user'::app_role));

-- 2. Tabella Operai
CREATE TABLE IF NOT EXISTS public.cantiere_operai (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  cantiere_id UUID REFERENCES public.cantieri(id) ON DELETE SET NULL,
  nome TEXT NOT NULL,
  cognome TEXT,
  ruolo TEXT,
  telefono TEXT,
  telegram_user_id TEXT,
  telegram_username TEXT,
  attivo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE POLICY "company_operai" ON public.cantiere_operai
  FOR ALL TO authenticated USING (company_id = get_user_company_id(auth.uid()));
CREATE POLICY "superadmin_operai" ON public.cantiere_operai
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'superadmin'::app_role) OR has_role(auth.uid(), 'superadmin_user'::app_role));

-- 3. Estendi agent_reports
ALTER TABLE public.agent_reports
  ADD COLUMN IF NOT EXISTS cantiere_id UUID REFERENCES public.cantieri(id),
  ADD COLUMN IF NOT EXISTS operaio_id UUID REFERENCES public.cantiere_operai(id),
  ADD COLUMN IF NOT EXISTS telegram_chat_id TEXT,
  ADD COLUMN IF NOT EXISTS telegram_message_id TEXT,
  ADD COLUMN IF NOT EXISTS audio_url TEXT,
  ADD COLUMN IF NOT EXISTS trascrizione TEXT,
  ADD COLUMN IF NOT EXISTS foto_urls TEXT[],
  ADD COLUMN IF NOT EXISTS operai_presenti JSONB,
  ADD COLUMN IF NOT EXISTS lavori_eseguiti TEXT[],
  ADD COLUMN IF NOT EXISTS materiali_usati TEXT[],
  ADD COLUMN IF NOT EXISTS materiali_da_ordinare TEXT[],
  ADD COLUMN IF NOT EXISTS problemi TEXT[],
  ADD COLUMN IF NOT EXISTS avanzamento_percentuale INTEGER,
  ADD COLUMN IF NOT EXISTS previsione_domani TEXT,
  ADD COLUMN IF NOT EXISTS condizioni_meteo TEXT,
  ADD COLUMN IF NOT EXISTS email_inviata BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS email_inviata_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS fonte TEXT DEFAULT 'telegram';

-- 4. Sessioni Telegram
CREATE TABLE IF NOT EXISTS public.telegram_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id TEXT NOT NULL UNIQUE,
  company_id UUID REFERENCES public.companies(id),
  cantiere_id UUID REFERENCES public.cantieri(id),
  operaio_id UUID REFERENCES public.cantiere_operai(id),
  stato TEXT DEFAULT 'attesa',
  pending_report_data JSONB,
  pending_foto_urls TEXT[],
  ultimo_messaggio_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE POLICY "superadmin_telegram_sessions" ON public.telegram_sessions
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'superadmin'::app_role) OR has_role(auth.uid(), 'superadmin_user'::app_role));

-- 5. Config Telegram per company
CREATE TABLE IF NOT EXISTS public.telegram_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL UNIQUE REFERENCES public.companies(id) ON DELETE CASCADE,
  bot_token TEXT,
  bot_username TEXT,
  webhook_secret TEXT,
  attivo BOOLEAN DEFAULT false,
  report_ora_invio TEXT DEFAULT '18:00',
  email_report_default TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE POLICY "company_telegram_config" ON public.telegram_config
  FOR ALL TO authenticated USING (company_id = get_user_company_id(auth.uid()));
CREATE POLICY "superadmin_telegram_config" ON public.telegram_config
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'superadmin'::app_role) OR has_role(auth.uid(), 'superadmin_user'::app_role));

-- 6. Storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('cantiere-media', 'cantiere-media', false) ON CONFLICT DO NOTHING;

-- Storage policies for cantiere-media
CREATE POLICY "company_cantiere_media_select" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'cantiere-media');
CREATE POLICY "company_cantiere_media_insert" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'cantiere-media');
CREATE POLICY "service_role_cantiere_media" ON storage.objects
  FOR ALL TO service_role USING (bucket_id = 'cantiere-media');
