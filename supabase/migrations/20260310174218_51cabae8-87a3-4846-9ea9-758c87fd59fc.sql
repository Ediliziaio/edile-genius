CREATE TABLE public.company_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  provider text NOT NULL CHECK (provider IN ('hubspot', 'salesforce', 'pipedrive')),
  api_key_encrypted text,
  instance_url text,
  is_active boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'disconnected',
  last_sync_at timestamptz,
  last_sync_status text,
  last_sync_count integer DEFAULT 0,
  field_mapping jsonb NOT NULL DEFAULT '{}',
  sync_settings jsonb NOT NULL DEFAULT '{"auto_sync": false, "sync_interval_hours": 24, "default_status": "new"}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(company_id, provider)
);

ALTER TABLE public.company_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "company_integrations_own" ON public.company_integrations
  FOR ALL TO authenticated
  USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "superadmin_company_integrations" ON public.company_integrations
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'superadmin'::app_role) OR has_role(auth.uid(), 'superadmin_user'::app_role));