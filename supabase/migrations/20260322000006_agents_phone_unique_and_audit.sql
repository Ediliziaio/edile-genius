-- 1. Prevent multiple agents from sharing the same ElevenLabs phone number.
--    Allows NULL (agents without a number) but enforces uniqueness when set.
CREATE UNIQUE INDEX IF NOT EXISTS idx_agents_el_phone_number_id_unique
  ON public.agents (el_phone_number_id)
  WHERE el_phone_number_id IS NOT NULL;

-- 2. Audit trail table for agent configuration changes.
--    Records who changed what field, from which value to which, with a timestamp.
CREATE TABLE IF NOT EXISTS public.agent_audit_log (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id     UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  company_id   UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  changed_by   UUID REFERENCES auth.users(id),
  changed_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  field        TEXT NOT NULL,           -- which field was changed
  old_value    TEXT,                    -- previous value (serialized)
  new_value    TEXT,                    -- new value (serialized)
  action       TEXT NOT NULL DEFAULT 'update' -- create | update | delete | status_change
);

CREATE INDEX idx_agent_audit_agent ON public.agent_audit_log (agent_id, changed_at DESC);
CREATE INDEX idx_agent_audit_company ON public.agent_audit_log (company_id, changed_at DESC);

ALTER TABLE public.agent_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "agent_audit_company_read" ON public.agent_audit_log
  FOR SELECT TO authenticated
  USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "agent_audit_superadmin" ON public.agent_audit_log
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'superadmin') OR has_role(auth.uid(), 'superadmin_user'));

-- Service role can insert audit entries from edge functions
GRANT INSERT ON public.agent_audit_log TO service_role;
GRANT SELECT ON public.agent_audit_log TO authenticated;

-- 3. DB-level function to record a single audit entry (called from update-agent edge function).
CREATE OR REPLACE FUNCTION public.log_agent_change(
  _agent_id   uuid,
  _company_id uuid,
  _user_id    uuid,
  _field      text,
  _old_value  text,
  _new_value  text,
  _action     text DEFAULT 'update'
)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  INSERT INTO public.agent_audit_log (agent_id, company_id, changed_by, field, old_value, new_value, action)
  VALUES (_agent_id, _company_id, _user_id, _field, _old_value, _new_value, _action);
$$;

GRANT EXECUTE ON FUNCTION public.log_agent_change TO service_role;
