-- ============================================================
-- Area Vendite — Cron jobs
-- B5: process-call-queue ogni minuto
-- B6: process-scheduled-voice-campaigns ogni 5 minuti
-- ============================================================

-- Rimuovi cron esistenti se già presenti (idempotente)
SELECT cron.unschedule('process-call-queue') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'process-call-queue'
);
SELECT cron.unschedule('process-scheduled-voice-campaigns') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'process-scheduled-voice-campaigns'
);

-- B5: process-call-queue ogni minuto
SELECT cron.schedule(
  'process-call-queue',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := current_setting('app.supabase_url') || '/functions/v1/process-call-queue',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', current_setting('app.internal_cron_secret', true)
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);

-- B6: process-scheduled-voice-campaigns ogni 5 minuti
SELECT cron.schedule(
  'process-scheduled-voice-campaigns',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := current_setting('app.supabase_url') || '/functions/v1/process-scheduled-voice-campaigns',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', current_setting('app.internal_cron_secret', true)
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
