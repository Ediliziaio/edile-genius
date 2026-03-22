-- Tabella per le API key della piattaforma (cifrate con AES-256-GCM)
-- Esegui nel Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.platform_api_keys (
  key_name         TEXT PRIMARY KEY,
  encrypted_value  TEXT,                     -- valore cifrato con META_ENCRYPTION_KEY
  masked_value     TEXT,                     -- es. "sk-proj-••••••••ab12"
  is_configured    BOOLEAN NOT NULL DEFAULT FALSE,
  last_tested_at   TIMESTAMPTZ,
  last_test_status TEXT CHECK (last_test_status IN ('ok','error')),
  last_test_message TEXT,
  description      TEXT,
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Solo superadmin può accedere
ALTER TABLE public.platform_api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "superadmin_only" ON public.platform_api_keys
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('superadmin','superadmin_user')
    )
  );

-- Righe iniziali (configurazione vuota)
INSERT INTO public.platform_api_keys (key_name, description) VALUES
  ('OPENAI_API_KEY',         'OpenAI — usata per chiamate LLM (GPT-4o, GPT-4o-mini)'),
  ('GEMINI_API_KEY',         'Google Gemini — LLM alternativo (Gemini 2.0/2.5 Flash)'),
  ('ELEVENLABS_API_KEY',     'ElevenLabs — sintesi vocale e agenti vocali'),
  ('STRIPE_SECRET_KEY',      'Stripe — gestione pagamenti e abbonamenti'),
  ('RESEND_API_KEY',         'Resend — invio email transazionali'),
  ('FIRECRAWL_API_KEY',      'Firecrawl — scraping e analisi pagine web')
ON CONFLICT (key_name) DO NOTHING;
