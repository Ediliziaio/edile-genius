
-- AI Orchestrator log table for deduplication and activity tracking
CREATE TABLE public.ai_orchestrator_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  entity_type text,
  entity_id uuid,
  action_taken text NOT NULL,
  action_details jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Index for fast deduplication queries
CREATE INDEX idx_orchestrator_dedup ON public.ai_orchestrator_log (company_id, entity_id, event_type, created_at DESC);

-- Index for recent activity feed
CREATE INDEX idx_orchestrator_recent ON public.ai_orchestrator_log (company_id, created_at DESC);

-- Enable RLS
ALTER TABLE public.ai_orchestrator_log ENABLE ROW LEVEL SECURITY;

-- Company users can read their own logs
CREATE POLICY "co_orchestrator_select" ON public.ai_orchestrator_log
  FOR SELECT TO authenticated
  USING (company_id = my_company());

-- Superadmin full access
CREATE POLICY "sa_orchestrator_all" ON public.ai_orchestrator_log
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'superadmin'::app_role) OR has_role(auth.uid(), 'superadmin_user'::app_role));
