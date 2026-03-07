
CREATE OR REPLACE FUNCTION public.deduct_render_credit(_company_id uuid)
  RETURNS void
  LANGUAGE sql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
  UPDATE public.render_credits
  SET balance = GREATEST(balance - 1, 0),
      total_used = total_used + 1
  WHERE company_id = _company_id;
$$;
