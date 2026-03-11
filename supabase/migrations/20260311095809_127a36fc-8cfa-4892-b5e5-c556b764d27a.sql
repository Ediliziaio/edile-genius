-- Campaign contacts tracking table
CREATE TABLE public.campaign_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  contact_id uuid NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  attempts integer NOT NULL DEFAULT 0,
  max_attempts integer NOT NULL DEFAULT 3,
  last_call_at timestamptz,
  next_retry_at timestamptz,
  conversation_id uuid REFERENCES public.conversations(id),
  outcome text,
  error text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(campaign_id, contact_id)
);

ALTER TABLE public.campaign_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "company_campaign_contacts" ON public.campaign_contacts
  FOR ALL TO authenticated
  USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "superadmin_campaign_contacts" ON public.campaign_contacts
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'superadmin') OR has_role(auth.uid(), 'superadmin_user'));

CREATE INDEX idx_campaign_contacts_campaign ON public.campaign_contacts(campaign_id);
CREATE INDEX idx_campaign_contacts_status ON public.campaign_contacts(campaign_id, status);