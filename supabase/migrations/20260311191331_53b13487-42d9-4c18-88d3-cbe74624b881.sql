-- Index for campaign_contacts performance
CREATE INDEX IF NOT EXISTS idx_campaign_contacts_campaign_status 
ON public.campaign_contacts(campaign_id, status);

-- Fix topup_credits to also handle 'low_balance' blocked_reason
CREATE OR REPLACE FUNCTION public.topup_credits(_company_id uuid, _amount_eur numeric)
 RETURNS numeric
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
  UPDATE public.ai_credits
  SET
    balance_eur = COALESCE(balance_eur, 0) + _amount_eur,
    total_recharged_eur = COALESCE(total_recharged_eur, 0) + _amount_eur,
    calls_blocked = CASE WHEN calls_blocked = true AND blocked_reason IN ('balance_zero', 'low_balance') THEN false ELSE calls_blocked END,
    blocked_at = CASE WHEN calls_blocked = true AND blocked_reason IN ('balance_zero', 'low_balance') THEN NULL ELSE blocked_at END,
    blocked_reason = CASE WHEN calls_blocked = true AND blocked_reason IN ('balance_zero', 'low_balance') THEN NULL ELSE blocked_reason END,
    updated_at = now()
  WHERE company_id = _company_id
  RETURNING balance_eur;
$$;