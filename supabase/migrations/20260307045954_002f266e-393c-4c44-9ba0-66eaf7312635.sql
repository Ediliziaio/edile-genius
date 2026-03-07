
-- =============================================
-- 1. ADD MISSING COLUMNS TO agents
-- =============================================
ALTER TABLE public.agents
  ADD COLUMN IF NOT EXISTS voice_stability numeric DEFAULT 0.5,
  ADD COLUMN IF NOT EXISTS voice_similarity numeric DEFAULT 0.75,
  ADD COLUMN IF NOT EXISTS voice_speed numeric DEFAULT 1.0,
  ADD COLUMN IF NOT EXISTS tts_model text DEFAULT 'eleven_turbo_v2_5',
  ADD COLUMN IF NOT EXISTS llm_model text DEFAULT 'gemini-2.0-flash',
  ADD COLUMN IF NOT EXISTS llm_temperature numeric DEFAULT 0.7,
  ADD COLUMN IF NOT EXISTS llm_max_tokens integer DEFAULT 1024,
  ADD COLUMN IF NOT EXISTS llm_backup_enabled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS llm_backup_model text,
  ADD COLUMN IF NOT EXISTS additional_languages text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS post_call_summary boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS post_call_prompt text,
  ADD COLUMN IF NOT EXISTS voicemail_detection boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS voicemail_message text,
  ADD COLUMN IF NOT EXISTS evaluation_criteria text,
  ADD COLUMN IF NOT EXISTS webhook_url text,
  ADD COLUMN IF NOT EXISTS phone_number_id uuid;

-- =============================================
-- 2. ADD MISSING COLUMNS TO conversations
-- =============================================
ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS minutes_billed numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS collected_data jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS appointment_created boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS lead_created boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS eval_score numeric,
  ADD COLUMN IF NOT EXISTS eval_notes text;

-- =============================================
-- 3. CREATE ai_phone_numbers
-- =============================================
CREATE TABLE IF NOT EXISTS public.ai_phone_numbers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  agent_id uuid REFERENCES public.agents(id) ON DELETE SET NULL,
  phone_number text NOT NULL,
  label text,
  el_phone_id text,
  provider text DEFAULT 'twilio',
  country_code text DEFAULT 'IT',
  status text DEFAULT 'active',
  active_hours_start time DEFAULT '09:00',
  active_hours_end time DEFAULT '19:00',
  active_days text[] DEFAULT '{mon,tue,wed,thu,fri}',
  out_of_hours_msg text,
  voicemail_enabled boolean DEFAULT false,
  monthly_cost numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.ai_phone_numbers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "superadmin_ai_phone_numbers" ON public.ai_phone_numbers
  AS PERMISSIVE FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'superadmin') OR has_role(auth.uid(), 'superadmin_user'));

CREATE POLICY "company_ai_phone_numbers" ON public.ai_phone_numbers
  AS PERMISSIVE FOR ALL TO authenticated
  USING (company_id = get_user_company_id(auth.uid()));

-- FK from agents.phone_number_id
ALTER TABLE public.agents
  ADD CONSTRAINT agents_phone_number_id_fkey
  FOREIGN KEY (phone_number_id) REFERENCES public.ai_phone_numbers(id) ON DELETE SET NULL;

-- =============================================
-- 4. CREATE ai_knowledge_docs
-- =============================================
CREATE TABLE IF NOT EXISTS public.ai_knowledge_docs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  agent_id uuid REFERENCES public.agents(id) ON DELETE SET NULL,
  el_doc_id text,
  type text NOT NULL DEFAULT 'file' CHECK (type IN ('url','file','text')),
  name text NOT NULL,
  source_url text,
  content_preview text,
  file_path text,
  size_bytes integer DEFAULT 0,
  status text DEFAULT 'processing' CHECK (status IN ('processing','ready','error')),
  created_by uuid,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.ai_knowledge_docs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "superadmin_ai_knowledge_docs" ON public.ai_knowledge_docs
  AS PERMISSIVE FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'superadmin') OR has_role(auth.uid(), 'superadmin_user'));

CREATE POLICY "company_ai_knowledge_docs" ON public.ai_knowledge_docs
  AS PERMISSIVE FOR ALL TO authenticated
  USING (company_id = get_user_company_id(auth.uid()));

-- =============================================
-- 5. CREATE ai_agent_workflows
-- =============================================
CREATE TABLE IF NOT EXISTS public.ai_agent_workflows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'Main',
  nodes jsonb DEFAULT '[]',
  edges jsonb DEFAULT '[]',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.ai_agent_workflows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "superadmin_ai_agent_workflows" ON public.ai_agent_workflows
  AS PERMISSIVE FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'superadmin') OR has_role(auth.uid(), 'superadmin_user'));

CREATE POLICY "company_ai_agent_workflows" ON public.ai_agent_workflows
  AS PERMISSIVE FOR ALL TO authenticated
  USING (company_id = get_user_company_id(auth.uid()));

-- =============================================
-- 6. CREATE ai_agent_tools
-- =============================================
CREATE TABLE IF NOT EXISTS public.ai_agent_tools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  type text NOT NULL DEFAULT 'custom_api' CHECK (type IN ('native_crm','native_calendar','custom_api','mcp','system')),
  config jsonb DEFAULT '{}',
  is_enabled boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.ai_agent_tools ENABLE ROW LEVEL SECURITY;

CREATE POLICY "superadmin_ai_agent_tools" ON public.ai_agent_tools
  AS PERMISSIVE FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'superadmin') OR has_role(auth.uid(), 'superadmin_user'));

CREATE POLICY "company_ai_agent_tools" ON public.ai_agent_tools
  AS PERMISSIVE FOR ALL TO authenticated
  USING (company_id = get_user_company_id(auth.uid()));
