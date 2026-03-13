
CREATE TABLE IF NOT EXISTS public.render_bagno_stili_pronti (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  descrizione TEXT,
  icon TEXT,
  tags TEXT[],
  configurazione JSONB NOT NULL DEFAULT '{}'::jsonb,
  preview_hex TEXT[],
  sort_order INT DEFAULT 0,
  is_active BOOL DEFAULT TRUE
);

ALTER TABLE public.render_bagno_stili_pronti ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_select_stili_pronti"
  ON public.render_bagno_stili_pronti
  FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "sa_stili_pronti"
  ON public.render_bagno_stili_pronti
  FOR ALL
  TO authenticated
  USING (
    has_role(auth.uid(), 'superadmin'::app_role) OR has_role(auth.uid(), 'superadmin_user'::app_role)
  );
