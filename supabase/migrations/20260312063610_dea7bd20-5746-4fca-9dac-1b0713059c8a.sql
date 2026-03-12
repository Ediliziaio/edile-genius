
-- n8n_executions: tracking workflow executions
CREATE TABLE IF NOT EXISTS public.n8n_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  workflow_id TEXT NOT NULL,
  idempotency_key TEXT UNIQUE NOT NULL,
  trigger_data JSONB DEFAULT '{}',
  output_data JSONB,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
  n8n_execution_id TEXT,
  error_message TEXT,
  triggered_by UUID REFERENCES auth.users(id),
  triggered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_n8n_executions_company_id ON public.n8n_executions(company_id);
CREATE INDEX IF NOT EXISTS idx_n8n_executions_status ON public.n8n_executions(status);
CREATE INDEX IF NOT EXISTS idx_n8n_executions_triggered_at ON public.n8n_executions(triggered_at DESC);

-- n8n_workflows: registered workflows per company
CREATE TABLE IF NOT EXISTS public.n8n_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  workflow_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  trigger_event TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, workflow_id)
);

-- Add encrypted API key column to platform_config if not exists
ALTER TABLE public.platform_config ADD COLUMN IF NOT EXISTS n8n_api_key_encrypted TEXT;

-- RLS
ALTER TABLE public.n8n_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.n8n_workflows ENABLE ROW LEVEL SECURITY;

-- Policies: company isolation
CREATE POLICY "n8n_executions_company_isolation" ON public.n8n_executions
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "n8n_workflows_company_isolation" ON public.n8n_workflows
  FOR ALL USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

-- Superadmin full access
CREATE POLICY "n8n_executions_superadmin" ON public.n8n_executions
  FOR ALL USING (public.has_role(auth.uid(), 'superadmin'));

CREATE POLICY "n8n_workflows_superadmin" ON public.n8n_workflows
  FOR ALL USING (public.has_role(auth.uid(), 'superadmin'));
