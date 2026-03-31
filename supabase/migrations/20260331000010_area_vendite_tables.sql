-- ============================================================
-- Area Vendite — Tabelle fondamentali
-- B7 fix: target_type DEFAULT 'manual' (non 'contact_list')
-- B5 fix: campaign_call_queue per architettura job queue
-- B8 fix: ai_credit_usage.internal_call_log_id
-- ============================================================

-- ── 1. internal_outbound_campaigns ──────────────────────────
CREATE TABLE IF NOT EXISTS public.internal_outbound_campaigns (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id        UUID        NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name              TEXT        NOT NULL,
  description       TEXT,
  agent_id          UUID        REFERENCES public.agents(id) ON DELETE SET NULL,

  -- B7 fix: DEFAULT 'manual' (non 'contact_list')
  target_type       TEXT        NOT NULL DEFAULT 'manual'
                                CHECK (target_type IN ('manual','filter')),
  contact_ids       UUID[]      NOT NULL DEFAULT '{}',
  filter_tags       TEXT,
  filter_source     TEXT,

  status            TEXT        NOT NULL DEFAULT 'draft'
                                CHECK (status IN ('draft','scheduled','queued','running','paused','completed','cancelled','failed')),
  scheduled_at      TIMESTAMPTZ,
  started_at        TIMESTAMPTZ,
  completed_at      TIMESTAMPTZ,

  total_calls       INT         NOT NULL DEFAULT 0,
  calls_answered    INT         NOT NULL DEFAULT 0,
  calls_failed      INT         NOT NULL DEFAULT 0,
  calls_per_minute  INT         NOT NULL DEFAULT 2,

  retry_max_attempts INT        NOT NULL DEFAULT 3,
  retry_delay_min   INT         NOT NULL DEFAULT 30,
  error_message     TEXT,

  created_by        UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ioc_company_status
  ON public.internal_outbound_campaigns(company_id, status);
CREATE INDEX IF NOT EXISTS idx_ioc_scheduled
  ON public.internal_outbound_campaigns(scheduled_at)
  WHERE status = 'scheduled';

ALTER TABLE public.internal_outbound_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "company_rw_ioc" ON public.internal_outbound_campaigns
  USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

-- ── 2. internal_call_logs ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.internal_call_logs (
  id                          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id                  UUID        NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  campaign_id                 UUID        REFERENCES public.internal_outbound_campaigns(id) ON DELETE SET NULL,
  contact_id                  UUID        REFERENCES public.contacts(id) ON DELETE SET NULL,
  agent_id                    UUID        REFERENCES public.agents(id) ON DELETE SET NULL,

  phone_number                TEXT,
  direction                   TEXT        NOT NULL DEFAULT 'outbound',
  status                      TEXT        NOT NULL DEFAULT 'initiated'
                                          CHECK (status IN ('initiated','answered','no_answer','failed','busy')),
  outcome                     TEXT        CHECK (outcome IN ('interested','not_interested','callback','dnc','no_answer','voicemail')),

  started_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at                    TIMESTAMPTZ,
  duration_sec                INT,

  elevenlabs_conversation_id  TEXT,
  notes                       TEXT,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_icl_company_created
  ON public.internal_call_logs(company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_icl_campaign
  ON public.internal_call_logs(campaign_id);
CREATE INDEX IF NOT EXISTS idx_icl_elevenlabs_conv
  ON public.internal_call_logs(elevenlabs_conversation_id)
  WHERE elevenlabs_conversation_id IS NOT NULL;

ALTER TABLE public.internal_call_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "company_rw_icl" ON public.internal_call_logs
  USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

-- ── 3. campaign_call_queue (B5: job queue async) ─────────────
CREATE TABLE IF NOT EXISTS public.campaign_call_queue (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID        NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  campaign_id     UUID        NOT NULL REFERENCES public.internal_outbound_campaigns(id) ON DELETE CASCADE,
  contact_id      UUID        NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  status          TEXT        NOT NULL DEFAULT 'pending'
                              CHECK (status IN ('pending','calling','done','failed','paused')),
  attempt_number  INT         NOT NULL DEFAULT 1,
  scheduled_for   TIMESTAMPTZ NOT NULL DEFAULT now(),
  called_at       TIMESTAMPTZ,
  result          TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ccq_pending_scheduled
  ON public.campaign_call_queue(scheduled_for, campaign_id)
  WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_ccq_campaign_status
  ON public.campaign_call_queue(campaign_id, status);

ALTER TABLE public.campaign_call_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "company_rw_ccq" ON public.campaign_call_queue
  USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

-- ── 4. campaign_retry_log ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.campaign_retry_log (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id          UUID        NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  campaign_id         UUID        NOT NULL REFERENCES public.internal_outbound_campaigns(id) ON DELETE CASCADE,
  contact_id          UUID        REFERENCES public.contacts(id) ON DELETE SET NULL,
  call_log_id         UUID        REFERENCES public.internal_call_logs(id) ON DELETE SET NULL,
  attempt_number      INT         NOT NULL DEFAULT 1,
  retry_max_attempts  INT         NOT NULL DEFAULT 3,
  result              TEXT        NOT NULL DEFAULT 'retry_due'
                                  CHECK (result IN ('retry_due','calling','done','failed','failed_final')),
  next_retry_at       TIMESTAMPTZ NOT NULL DEFAULT now() + INTERVAL '30 minutes',
  error_message       TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_crl_retry_due
  ON public.campaign_retry_log(next_retry_at)
  WHERE result = 'retry_due';
CREATE INDEX IF NOT EXISTS idx_crl_campaign
  ON public.campaign_retry_log(campaign_id);

ALTER TABLE public.campaign_retry_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "company_rw_crl" ON public.campaign_retry_log
  USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

-- ── 5. B8: ai_credit_usage — aggiungi internal_call_log_id ───
ALTER TABLE public.ai_credit_usage
  ADD COLUMN IF NOT EXISTS internal_call_log_id UUID
    REFERENCES public.internal_call_logs(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_acu_internal_call_log
  ON public.ai_credit_usage(internal_call_log_id)
  WHERE internal_call_log_id IS NOT NULL;

-- ── 6. Updated_at trigger per internal_outbound_campaigns ────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ioc_updated_at ON public.internal_outbound_campaigns;
CREATE TRIGGER trg_ioc_updated_at
  BEFORE UPDATE ON public.internal_outbound_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
