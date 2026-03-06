
-- 1. Column renames
ALTER TABLE public.companies RENAME COLUMN elevenlabs_api_key TO el_api_key;
ALTER TABLE public.agents RENAME COLUMN elevenlabs_voice_id TO el_voice_id;
ALTER TABLE public.agents RENAME COLUMN elevenlabs_agent_id TO el_agent_id;
ALTER TABLE public.agents RENAME COLUMN calls_this_month TO calls_month;
ALTER TABLE public.conversations RENAME COLUMN elevenlabs_conv_id TO el_conv_id;

-- 2. New helper functions
CREATE OR REPLACE FUNCTION public.my_role()
  RETURNS app_role LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT role FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1 $$;

CREATE OR REPLACE FUNCTION public.my_company()
  RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT company_id FROM public.profiles WHERE id = auth.uid() $$;

-- 3. New tables
CREATE TABLE public.contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  phone text,
  email text,
  source text,
  status text NOT NULL DEFAULT 'lead',
  tags jsonb DEFAULT '[]'::jsonb,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.contact_lists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.contact_list_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id uuid NOT NULL REFERENCES public.contact_lists(id) ON DELETE CASCADE,
  contact_id uuid NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  UNIQUE(list_id, contact_id)
);

CREATE TABLE public.campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  agent_id uuid REFERENCES public.agents(id) ON DELETE SET NULL,
  contact_list_id uuid REFERENCES public.contact_lists(id) ON DELETE SET NULL,
  name text NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  type text NOT NULL DEFAULT 'outbound',
  scheduled_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  config jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  contact_id uuid REFERENCES public.contacts(id) ON DELETE CASCADE,
  conversation_id uuid REFERENCES public.conversations(id) ON DELETE SET NULL,
  author_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- 4. RLS policies for new tables
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_list_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

-- contacts
CREATE POLICY "superadmin_contacts" ON public.contacts FOR ALL
  USING (has_role(auth.uid(), 'superadmin'::app_role) OR has_role(auth.uid(), 'superadmin_user'::app_role));
CREATE POLICY "company_contacts" ON public.contacts FOR ALL
  USING (company_id = get_user_company_id(auth.uid()));

-- contact_lists
CREATE POLICY "superadmin_contact_lists" ON public.contact_lists FOR ALL
  USING (has_role(auth.uid(), 'superadmin'::app_role) OR has_role(auth.uid(), 'superadmin_user'::app_role));
CREATE POLICY "company_contact_lists" ON public.contact_lists FOR ALL
  USING (company_id = get_user_company_id(auth.uid()));

-- contact_list_members
CREATE POLICY "superadmin_contact_list_members" ON public.contact_list_members FOR ALL
  USING (has_role(auth.uid(), 'superadmin'::app_role) OR has_role(auth.uid(), 'superadmin_user'::app_role));
CREATE POLICY "company_contact_list_members" ON public.contact_list_members FOR ALL
  USING (list_id IN (SELECT id FROM public.contact_lists WHERE company_id = get_user_company_id(auth.uid())));

-- campaigns
CREATE POLICY "superadmin_campaigns" ON public.campaigns FOR ALL
  USING (has_role(auth.uid(), 'superadmin'::app_role) OR has_role(auth.uid(), 'superadmin_user'::app_role));
CREATE POLICY "company_campaigns" ON public.campaigns FOR ALL
  USING (company_id = get_user_company_id(auth.uid()));

-- notes
CREATE POLICY "superadmin_notes" ON public.notes FOR ALL
  USING (has_role(auth.uid(), 'superadmin'::app_role) OR has_role(auth.uid(), 'superadmin_user'::app_role));
CREATE POLICY "company_notes" ON public.notes FOR ALL
  USING (company_id = get_user_company_id(auth.uid()));
