
CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS TEXT
LANGUAGE sql
SECURITY INVOKER
SET search_path = 'public'
AS $$
  SELECT 'EIO-' || EXTRACT(YEAR FROM now())::TEXT || '-' || LPAD(nextval('public.invoice_number_seq')::TEXT, 6, '0');
$$;
