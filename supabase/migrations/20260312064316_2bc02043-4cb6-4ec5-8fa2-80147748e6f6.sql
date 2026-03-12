
-- Add missing columns to telegram_sessions if needed
ALTER TABLE public.telegram_sessions ADD COLUMN IF NOT EXISTS pending_foto_urls TEXT[] DEFAULT '{}';
ALTER TABLE public.telegram_sessions ADD COLUMN IF NOT EXISTS pending_report_data JSONB;
ALTER TABLE public.telegram_sessions ADD COLUMN IF NOT EXISTS stato TEXT DEFAULT 'attesa';

-- Telegram message log for debug/audit
CREATE TABLE IF NOT EXISTS public.telegram_message_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  telegram_user_id BIGINT,
  chat_id BIGINT,
  message_type TEXT,
  message_text TEXT,
  processed_at TIMESTAMPTZ DEFAULT now(),
  action_taken TEXT,
  error_message TEXT
);

ALTER TABLE public.telegram_message_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "telegram_log_company_isolation" ON public.telegram_message_log
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "telegram_log_superadmin" ON public.telegram_message_log
  FOR ALL USING (public.has_role(auth.uid(), 'superadmin'));

-- Atomic append foto to agent_reports
CREATE OR REPLACE FUNCTION public.append_foto_report(p_report_id UUID, p_foto_url TEXT)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  UPDATE public.agent_reports
  SET foto_urls = array_append(COALESCE(foto_urls, '{}'), p_foto_url)
  WHERE id = p_report_id;
$$;

-- Index for telegram lookup
CREATE INDEX IF NOT EXISTS idx_cantiere_operai_telegram ON public.cantiere_operai(telegram_user_id, company_id) WHERE telegram_user_id IS NOT NULL;
