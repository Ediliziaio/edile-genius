
-- ============================================
-- FASE D1: Schema DB Alignment
-- ============================================

-- 1. COMPANIES — add missing columns
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS website text,
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS vat_number text,
  ADD COLUMN IF NOT EXISTS notes_internal text,
  ADD COLUMN IF NOT EXISTS monthly_calls_limit integer NOT NULL DEFAULT 500,
  ADD COLUMN IF NOT EXISTS calls_used_month integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- 2. PROFILES — add missing columns
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS job_title text;

-- 3. AGENTS — add missing columns
ALTER TABLE public.agents
  ADD COLUMN IF NOT EXISTS voice_name text,
  ADD COLUMN IF NOT EXISTS temperature numeric DEFAULT 0.7,
  ADD COLUMN IF NOT EXISTS max_duration_sec integer DEFAULT 300,
  ADD COLUMN IF NOT EXISTS silence_sec integer DEFAULT 3,
  ADD COLUMN IF NOT EXISTS interrupt_enabled boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS calls_qualified integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- 4. CONTACTS — add missing columns + new status/source values
ALTER TABLE public.contacts
  ADD COLUMN IF NOT EXISTS phone_alt text,
  ADD COLUMN IF NOT EXISTS company_name text,
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS province text,
  ADD COLUMN IF NOT EXISTS cap text,
  ADD COLUMN IF NOT EXISTS sector text,
  ADD COLUMN IF NOT EXISTS priority text DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS last_contact_at timestamptz,
  ADD COLUMN IF NOT EXISTS next_call_at timestamptz,
  ADD COLUMN IF NOT EXISTS assigned_agent uuid REFERENCES public.agents(id),
  ADD COLUMN IF NOT EXISTS assigned_user uuid,
  ADD COLUMN IF NOT EXISTS call_attempts integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS created_by uuid;

-- 5. CONTACT_LISTS — add missing columns
ALTER TABLE public.contact_lists
  ADD COLUMN IF NOT EXISTS color text DEFAULT '#6366f1',
  ADD COLUMN IF NOT EXISTS icon text DEFAULT 'list',
  ADD COLUMN IF NOT EXISTS contact_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS created_by uuid;

-- 6. CONTACT_LIST_MEMBERS — add missing column
ALTER TABLE public.contact_list_members
  ADD COLUMN IF NOT EXISTS added_at timestamptz DEFAULT now();

-- 7. CAMPAIGNS — add missing columns
ALTER TABLE public.campaigns
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS custom_first_msg text,
  ADD COLUMN IF NOT EXISTS scheduled_start timestamptz,
  ADD COLUMN IF NOT EXISTS scheduled_end timestamptz,
  ADD COLUMN IF NOT EXISTS call_hour_limit integer,
  ADD COLUMN IF NOT EXISTS retry_attempts integer DEFAULT 2,
  ADD COLUMN IF NOT EXISTS retry_delay_min integer DEFAULT 30,
  ADD COLUMN IF NOT EXISTS call_window_start time DEFAULT '09:00',
  ADD COLUMN IF NOT EXISTS call_window_end time DEFAULT '19:00',
  ADD COLUMN IF NOT EXISTS call_days text[] DEFAULT '{mon,tue,wed,thu,fri}',
  ADD COLUMN IF NOT EXISTS contacts_total integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS contacts_called integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS contacts_reached integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS contacts_qualified integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS appointments_set integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS avg_duration integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS created_by uuid,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- 8. CONVERSATIONS — add missing columns
ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS contact_id uuid REFERENCES public.contacts(id),
  ADD COLUMN IF NOT EXISTS campaign_id uuid REFERENCES public.campaigns(id),
  ADD COLUMN IF NOT EXISTS direction text DEFAULT 'outbound',
  ADD COLUMN IF NOT EXISTS phone_number text,
  ADD COLUMN IF NOT EXISTS summary text,
  ADD COLUMN IF NOT EXISTS sentiment text;

-- 9. TRIGGER: set_updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
  RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_companies_updated_at BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE TRIGGER trg_agents_updated_at BEFORE UPDATE ON public.agents
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE TRIGGER trg_contacts_updated_at BEFORE UPDATE ON public.contacts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE TRIGGER trg_campaigns_updated_at BEFORE UPDATE ON public.campaigns
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 10. TRIGGER: sync_list_count
CREATE OR REPLACE FUNCTION public.sync_list_count()
  RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.contact_lists SET contact_count = contact_count + 1 WHERE id = NEW.list_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.contact_lists SET contact_count = GREATEST(contact_count - 1, 0) WHERE id = OLD.list_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE OR REPLACE TRIGGER trg_sync_list_count
  AFTER INSERT OR DELETE ON public.contact_list_members
  FOR EACH ROW EXECUTE FUNCTION public.sync_list_count();
