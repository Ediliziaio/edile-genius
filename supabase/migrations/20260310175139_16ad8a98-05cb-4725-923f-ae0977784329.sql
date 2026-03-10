
-- Migration: elevenlabs_full_integration

-- 1. Agents: add missing columns
ALTER TABLE public.agents
  ADD COLUMN IF NOT EXISTS el_phone_number_id TEXT,
  ADD COLUMN IF NOT EXISTS asr_quality TEXT DEFAULT 'high',
  ADD COLUMN IF NOT EXISTS asr_keywords TEXT[],
  ADD COLUMN IF NOT EXISTS vad_enabled BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS silence_end_call_timeout INTEGER DEFAULT 20,
  ADD COLUMN IF NOT EXISTS speculative_turn BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS evaluation_prompt TEXT,
  ADD COLUMN IF NOT EXISTS post_call_webhook_url TEXT,
  ADD COLUMN IF NOT EXISTS dynamic_variables JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS built_in_tools JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS transfer_number TEXT,
  ADD COLUMN IF NOT EXISTS monitoring_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS pii_redaction BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS blocked_topics TEXT,
  ADD COLUMN IF NOT EXISTS outbound_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS el_webhook_secret TEXT;

-- 2. Conversations: add cost_billed_eur
ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS cost_billed_eur NUMERIC;

-- 3. ai_phone_numbers: add EL + Twilio fields
ALTER TABLE public.ai_phone_numbers
  ADD COLUMN IF NOT EXISTS el_phone_number_id TEXT,
  ADD COLUMN IF NOT EXISTS twilio_sid TEXT,
  ADD COLUMN IF NOT EXISTS provider_type TEXT DEFAULT 'twilio',
  ADD COLUMN IF NOT EXISTS inbound_enabled BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS outbound_enabled BOOLEAN DEFAULT true;

-- 4. ai_knowledge_docs: add sync fields
ALTER TABLE public.ai_knowledge_docs
  ADD COLUMN IF NOT EXISTS el_sync_status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS el_sync_at TIMESTAMPTZ;

-- 5. Outbound call log table
CREATE TABLE IF NOT EXISTS public.outbound_call_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES public.agents(id),
  phone_number_id UUID REFERENCES public.ai_phone_numbers(id),
  to_number TEXT NOT NULL,
  from_number TEXT,
  el_call_id TEXT,
  status TEXT DEFAULT 'initiated',
  duration_sec INTEGER,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  error_message TEXT
);

ALTER TABLE public.outbound_call_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "company_outbound_calls" ON public.outbound_call_log
  FOR ALL TO authenticated
  USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "superadmin_outbound_calls" ON public.outbound_call_log
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'superadmin'::app_role) OR has_role(auth.uid(), 'superadmin_user'::app_role));
