
-- Tabella chiamate schedulate
CREATE TABLE IF NOT EXISTS scheduled_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  scheduled_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','calling','completed','cancelled','failed')),
  dynamic_variables JSONB DEFAULT '{}',
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  executed_at TIMESTAMPTZ,
  call_log_id UUID REFERENCES outbound_call_log(id)
);

CREATE INDEX idx_scheduled_calls_company ON scheduled_calls(company_id, scheduled_at);
CREATE INDEX idx_scheduled_calls_pending ON scheduled_calls(status, scheduled_at)
  WHERE status = 'pending';

ALTER TABLE scheduled_calls ENABLE ROW LEVEL SECURITY;
CREATE POLICY "scheduled_calls_company" ON scheduled_calls
  FOR ALL TO authenticated
  USING (company_id = public.my_company());
CREATE POLICY "scheduled_calls_superadmin" ON scheduled_calls
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'superadmin'::app_role) OR has_role(auth.uid(), 'superadmin_user'::app_role));

-- Aggiungi colonne mancanti alla tabella contacts
ALTER TABLE contacts
  ADD COLUMN IF NOT EXISTS last_call_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_call_outcome TEXT,
  ADD COLUMN IF NOT EXISTS last_call_duration_sec INTEGER,
  ADD COLUMN IF NOT EXISTS last_call_agent_id UUID REFERENCES agents(id),
  ADD COLUMN IF NOT EXISTS call_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS best_call_time TEXT,
  ADD COLUMN IF NOT EXISTS do_not_call BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS do_not_call_reason TEXT,
  ADD COLUMN IF NOT EXISTS ai_call_notes TEXT;

-- Aggiungi colonne a outbound_call_log
ALTER TABLE outbound_call_log
  ADD COLUMN IF NOT EXISTS contact_id UUID REFERENCES contacts(id),
  ADD COLUMN IF NOT EXISTS el_conversation_id TEXT,
  ADD COLUMN IF NOT EXISTS outcome TEXT,
  ADD COLUMN IF NOT EXISTS sentiment TEXT,
  ADD COLUMN IF NOT EXISTS ai_summary TEXT,
  ADD COLUMN IF NOT EXISTS transcript JSONB,
  ADD COLUMN IF NOT EXISTS duration_sec INTEGER,
  ADD COLUMN IF NOT EXISTS ended_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS dynamic_variables JSONB DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_call_log_contact ON outbound_call_log(contact_id, started_at DESC);

-- Funzione per aggiornare contact dopo chiamata (atomica)
CREATE OR REPLACE FUNCTION update_contact_after_call(
  p_contact_id UUID,
  p_outcome TEXT,
  p_duration_sec INTEGER,
  p_agent_id UUID,
  p_ai_summary TEXT DEFAULT NULL,
  p_next_call_at TIMESTAMPTZ DEFAULT NULL,
  p_sentiment TEXT DEFAULT 'unknown'
) RETURNS void AS $$
BEGIN
  UPDATE contacts SET
    last_call_at = now(),
    last_call_outcome = p_outcome,
    last_call_duration_sec = p_duration_sec,
    last_call_agent_id = p_agent_id,
    call_count = COALESCE(call_count, 0) + 1,
    ai_call_notes = CASE
      WHEN p_ai_summary IS NOT NULL THEN p_ai_summary
      ELSE ai_call_notes
    END,
    next_call_at = p_next_call_at,
    status = CASE
      WHEN p_outcome = 'answered' AND p_sentiment = 'positive' THEN 'qualified'
      WHEN p_outcome = 'answered' AND p_sentiment = 'negative' THEN 'not_qualified'
      WHEN p_outcome = 'answered' THEN 'called'
      WHEN p_outcome = 'no_answer' OR p_outcome = 'busy' THEN 'callback'
      WHEN p_outcome = 'voicemail' THEN 'callback'
      ELSE status
    END,
    updated_at = now()
  WHERE id = p_contact_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
