-- Add missing indexes on outbound_call_log for webhook and reporting queries.

-- Used by elevenlabs-webhook to match call log entries by ElevenLabs conversation ID
CREATE INDEX IF NOT EXISTS idx_outbound_call_log_el_conversation_id
  ON public.outbound_call_log (el_conversation_id)
  WHERE el_conversation_id IS NOT NULL;

-- Used by reporting queries: calls per company ordered by date
CREATE INDEX IF NOT EXISTS idx_outbound_call_log_company_started
  ON public.outbound_call_log (company_id, started_at DESC);

-- Used by concurrent-call protection check in elevenlabs-outbound-call
CREATE INDEX IF NOT EXISTS idx_outbound_call_log_contact_active
  ON public.outbound_call_log (contact_id, status)
  WHERE status IN ('initiated', 'ringing', 'in_progress');
