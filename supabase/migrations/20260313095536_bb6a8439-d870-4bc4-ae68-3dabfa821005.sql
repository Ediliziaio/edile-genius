
-- ═══ Render Persiane — Tables + Storage ═══

-- Sessions table
CREATE TABLE IF NOT EXISTS public.render_persiane_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  original_image_path TEXT,
  result_image_url TEXT,
  tipo_operazione TEXT,
  tipo_persiana TEXT,
  materiale_persiana TEXT,
  colore_mode TEXT,
  colore_ral_code TEXT,
  colore_ral_name TEXT,
  colore_ral_hex TEXT,
  colore_wood_id TEXT,
  colore_wood_name TEXT,
  stato_apertura TEXT,
  larghezza_lamella_mm INT,
  apertura_lamelle TEXT,
  note_aggiuntive TEXT,
  prompt_user TEXT,
  prompt_system TEXT,
  prompt_version TEXT DEFAULT '1.0.0',
  original_width INT,
  original_height INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.render_persiane_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own persiane sessions"
  ON public.render_persiane_sessions FOR SELECT
  USING (user_id = auth.uid() OR company_id = public.my_company() OR public.has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Users can insert own persiane sessions"
  ON public.render_persiane_sessions FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own persiane sessions"
  ON public.render_persiane_sessions FOR UPDATE
  USING (user_id = auth.uid());

-- Gallery table
CREATE TABLE IF NOT EXISTS public.render_persiane_gallery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  session_id UUID REFERENCES public.render_persiane_sessions(id) ON DELETE SET NULL,
  result_image_url TEXT NOT NULL,
  tipo_operazione TEXT,
  tipo_persiana TEXT,
  materiale TEXT,
  colore_mode TEXT,
  colore_ral_code TEXT,
  colore_wood_name TEXT,
  is_favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.render_persiane_gallery ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own persiane gallery"
  ON public.render_persiane_gallery FOR SELECT
  USING (user_id = auth.uid() OR company_id = public.my_company() OR public.has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Users can insert own persiane gallery"
  ON public.render_persiane_gallery FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own persiane gallery"
  ON public.render_persiane_gallery FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own persiane gallery"
  ON public.render_persiane_gallery FOR DELETE
  USING (user_id = auth.uid());

-- Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('persiane-originals', 'persiane-originals', false) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('persiane-results', 'persiane-results', true) ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "persiane-originals: users upload to own folder"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'persiane-originals' AND auth.role() = 'authenticated');

CREATE POLICY "persiane-originals: users read own folder"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'persiane-originals' AND auth.role() = 'authenticated');

CREATE POLICY "persiane-results: public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'persiane-results');

CREATE POLICY "persiane-results: authenticated insert"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'persiane-results' AND auth.role() = 'authenticated');
