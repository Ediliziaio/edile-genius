
-- Webhooks table: stores webhook endpoints per company
CREATE TABLE public.webhooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  url text NOT NULL,
  secret text,
  events text[] NOT NULL DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Webhook delivery log
CREATE TABLE public.webhook_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id uuid NOT NULL REFERENCES public.webhooks(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}',
  status_code integer,
  response_body text,
  success boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE public.webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY superadmin_webhooks ON public.webhooks FOR ALL
  USING (has_role(auth.uid(), 'superadmin') OR has_role(auth.uid(), 'superadmin_user'));

CREATE POLICY company_webhooks ON public.webhooks FOR ALL
  USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY superadmin_webhook_logs ON public.webhook_logs FOR ALL
  USING (has_role(auth.uid(), 'superadmin') OR has_role(auth.uid(), 'superadmin_user'));

CREATE POLICY company_webhook_logs ON public.webhook_logs FOR ALL
  USING (webhook_id IN (SELECT id FROM public.webhooks WHERE company_id = get_user_company_id(auth.uid())));

-- Updated_at trigger
CREATE TRIGGER set_webhooks_updated_at BEFORE UPDATE ON public.webhooks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
