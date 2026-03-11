
-- Agent Automations table for configuring autonomous agents per company
CREATE TABLE public.agent_automations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  automation_type text NOT NULL,
  is_enabled boolean DEFAULT false,
  config jsonb DEFAULT '{}'::jsonb,
  last_run_at timestamptz,
  total_actions integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(company_id, automation_type)
);

ALTER TABLE public.agent_automations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "co_automations" ON public.agent_automations
  FOR ALL TO authenticated
  USING (company_id = public.my_company());

CREATE POLICY "sa_automations" ON public.agent_automations
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'superadmin') OR public.has_role(auth.uid(), 'superadmin_user'));

-- Add ai_actions_log to contacts
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS ai_actions_log jsonb DEFAULT '[]'::jsonb;

-- Add auto_pilot to campaigns
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS auto_pilot boolean DEFAULT false;
