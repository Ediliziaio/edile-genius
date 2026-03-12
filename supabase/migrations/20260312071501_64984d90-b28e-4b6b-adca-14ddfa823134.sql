
-- Fix release_campaign_lock: use SELECT instead of PERFORM for SQL language
CREATE OR REPLACE FUNCTION public.release_campaign_lock(p_lock_id BIGINT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$ SELECT pg_advisory_unlock(p_lock_id); $$;
