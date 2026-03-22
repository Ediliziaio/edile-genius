-- Add retry_count to scheduled_calls for retry logic in execute-scheduled-calls.
ALTER TABLE public.scheduled_calls
  ADD COLUMN IF NOT EXISTS retry_count INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_error  TEXT;

-- Index to efficiently find retryable failed calls
CREATE INDEX IF NOT EXISTS idx_scheduled_calls_retryable
  ON public.scheduled_calls (status, retry_count, scheduled_at)
  WHERE status = 'failed';
