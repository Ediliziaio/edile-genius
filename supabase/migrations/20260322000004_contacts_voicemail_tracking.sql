-- Track voicemail attempts per contact to avoid endless voicemail loops.
-- After max_voicemail_attempts consecutive voicemails, pause outbound calls.
ALTER TABLE public.contacts
  ADD COLUMN IF NOT EXISTS voicemail_count    INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_voicemail_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS do_not_call_reason TEXT;

-- Track voicemail on outbound_call_log too
ALTER TABLE public.outbound_call_log
  ADD COLUMN IF NOT EXISTS is_voicemail BOOLEAN NOT NULL DEFAULT false;

-- Index to efficiently look up contacts with high voicemail counts
CREATE INDEX IF NOT EXISTS idx_contacts_voicemail
  ON public.contacts (company_id, voicemail_count)
  WHERE voicemail_count > 0;
