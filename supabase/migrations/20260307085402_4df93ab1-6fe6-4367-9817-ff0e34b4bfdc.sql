
-- =============================================
-- MODULO RENDER AI — Database Migration
-- =============================================

-- 1. render_provider_config
CREATE TABLE public.render_provider_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_key text NOT NULL UNIQUE,
  label text NOT NULL,
  model text NOT NULL,
  api_endpoint text,
  is_active boolean DEFAULT false,
  is_default boolean DEFAULT false,
  quality text DEFAULT 'high',
  max_resolution integer DEFAULT 1024,
  timeout_sec integer DEFAULT 120,
  cost_real_per_render numeric DEFAULT 0.04,
  markup_multiplier numeric DEFAULT 2.5,
  cost_billed_per_render numeric DEFAULT 0.10,
  renders_generated integer DEFAULT 0,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. render_infissi_presets
CREATE TABLE public.render_infissi_presets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  category text NOT NULL,
  name text NOT NULL,
  value text NOT NULL,
  prompt_fragment text NOT NULL,
  icon text,
  color_hex text,
  sort_order integer DEFAULT 0,
  is_global boolean DEFAULT true,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- 3. render_sessions
CREATE TABLE public.render_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  created_by uuid REFERENCES public.profiles(id),
  contact_id uuid REFERENCES public.contacts(id),
  original_photo_url text NOT NULL,
  original_analysis jsonb DEFAULT '{}'::jsonb,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  prompt_used text,
  provider_key text,
  status text DEFAULT 'pending',
  result_urls jsonb DEFAULT '[]'::jsonb,
  selected_result_index integer,
  error_message text,
  processing_started_at timestamptz,
  processing_completed_at timestamptz,
  cost_real numeric DEFAULT 0,
  cost_billed numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 4. render_gallery
CREATE TABLE public.render_gallery (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  session_id uuid NOT NULL REFERENCES public.render_sessions(id) ON DELETE CASCADE,
  contact_id uuid REFERENCES public.contacts(id),
  title text,
  original_url text NOT NULL,
  render_url text NOT NULL,
  config_summary jsonb DEFAULT '{}'::jsonb,
  share_token text UNIQUE,
  is_favorite boolean DEFAULT false,
  notes text,
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz DEFAULT now()
);

-- 5. render_credits
CREATE TABLE public.render_credits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL UNIQUE REFERENCES public.companies(id) ON DELETE CASCADE,
  balance integer DEFAULT 5,
  total_purchased integer DEFAULT 5,
  total_used integer DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

-- =============================================
-- RLS POLICIES (PERMISSIVE)
-- =============================================

-- render_provider_config: superadmin only
CREATE POLICY "sa_render_provider" ON public.render_provider_config
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'superadmin'::app_role) OR has_role(auth.uid(), 'superadmin_user'::app_role));

-- render_infissi_presets: global readable, company-owned editable
CREATE POLICY "co_presets_select" ON public.render_infissi_presets
  FOR SELECT TO authenticated
  USING (is_global = true OR company_id = my_company());

CREATE POLICY "co_presets_modify" ON public.render_infissi_presets
  FOR ALL TO authenticated
  USING (company_id = my_company());

CREATE POLICY "sa_presets" ON public.render_infissi_presets
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'superadmin'::app_role) OR has_role(auth.uid(), 'superadmin_user'::app_role));

-- render_sessions
CREATE POLICY "co_render_sessions" ON public.render_sessions
  FOR ALL TO authenticated
  USING (company_id = my_company());

CREATE POLICY "sa_render_sessions" ON public.render_sessions
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'superadmin'::app_role) OR has_role(auth.uid(), 'superadmin_user'::app_role));

-- render_gallery
CREATE POLICY "co_render_gallery" ON public.render_gallery
  FOR ALL TO authenticated
  USING (company_id = my_company());

CREATE POLICY "sa_render_gallery" ON public.render_gallery
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'superadmin'::app_role) OR has_role(auth.uid(), 'superadmin_user'::app_role));

-- render_credits
CREATE POLICY "co_render_credits" ON public.render_credits
  FOR SELECT TO authenticated
  USING (company_id = my_company());

CREATE POLICY "sa_render_credits" ON public.render_credits
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'superadmin'::app_role) OR has_role(auth.uid(), 'superadmin_user'::app_role));

-- =============================================
-- TRIGGERS
-- =============================================

CREATE TRIGGER set_render_sessions_updated_at
  BEFORE UPDATE ON public.render_sessions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_render_credits_updated_at
  BEFORE UPDATE ON public.render_credits
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Init render credits on new company
CREATE OR REPLACE FUNCTION public.init_render_credits()
  RETURNS trigger
  LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.render_credits (company_id) VALUES (NEW.id)
  ON CONFLICT (company_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_init_render_credits
  AFTER INSERT ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.init_render_credits();

-- =============================================
-- STORAGE BUCKETS
-- =============================================

INSERT INTO storage.buckets (id, name, public) VALUES ('render-originals', 'render-originals', false) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('render-results', 'render-results', true) ON CONFLICT DO NOTHING;

-- Storage RLS for render-originals
CREATE POLICY "co_render_originals_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'render-originals' AND (storage.foldername(name))[1] = (my_company())::text);

CREATE POLICY "co_render_originals_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'render-originals' AND (storage.foldername(name))[1] = (my_company())::text);

CREATE POLICY "sa_render_originals" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'render-originals' AND (has_role(auth.uid(), 'superadmin'::app_role) OR has_role(auth.uid(), 'superadmin_user'::app_role)));

-- Storage RLS for render-results (public read, company write)
CREATE POLICY "public_render_results_select" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'render-results');

CREATE POLICY "co_render_results_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'render-results' AND (storage.foldername(name))[1] = (my_company())::text);

CREATE POLICY "sa_render_results" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'render-results' AND (has_role(auth.uid(), 'superadmin'::app_role) OR has_role(auth.uid(), 'superadmin_user'::app_role)));

-- =============================================
-- SEED: Provider configs
-- =============================================

INSERT INTO public.render_provider_config (provider_key, label, model, is_active, is_default, cost_real_per_render, markup_multiplier, cost_billed_per_render, notes) VALUES
('openai_gpt_image', 'OpenAI GPT-Image-1', 'gpt-image-1', true, true, 0.04, 2.5, 0.10, 'Best quality, recommended'),
('gemini_flash_image', 'Google Gemini Flash', 'gemini-2.5-flash-image', true, false, 0.02, 2.5, 0.05, 'Fast and cheap, good quality');

-- =============================================
-- SEED: Infissi presets (global)
-- =============================================

INSERT INTO public.render_infissi_presets (category, name, value, prompt_fragment, icon, sort_order, is_global) VALUES
-- Materiali
('materiale', 'PVC Bianco', 'pvc_bianco', 'white PVC window frame with smooth finish', '🪟', 1, true),
('materiale', 'PVC Effetto Legno', 'pvc_legno', 'PVC window frame with realistic wood grain texture in warm oak color', '🪵', 2, true),
('materiale', 'Alluminio Nero', 'alluminio_nero', 'sleek matte black aluminum window frame with minimal profile', '⬛', 3, true),
('materiale', 'Alluminio Bronzo', 'alluminio_bronzo', 'bronze anodized aluminum window frame', '🟤', 4, true),
('materiale', 'Legno Naturale', 'legno_naturale', 'natural solid wood window frame with visible grain in light oak', '🌳', 5, true),
('materiale', 'Legno Noce', 'legno_noce', 'dark walnut wood window frame with rich grain pattern', '🪵', 6, true),
('materiale', 'Legno-Alluminio', 'legno_alluminio', 'hybrid wood-aluminum window frame, interior wood exterior aluminum', '🔲', 7, true),
-- Stili telaio
('stile', 'Minimale', 'minimale', 'ultra-thin minimal frame profile', '➖', 1, true),
('stile', 'Classico', 'classico', 'traditional classic window frame with decorative molding', '🏛️', 2, true),
('stile', 'Industriale', 'industriale', 'industrial style window frame with steel-look grid pattern', '🏭', 3, true),
('stile', 'Arco', 'arco', 'arched top window frame', '🌈', 4, true),
-- Vetri
('vetro', 'Trasparente', 'trasparente', 'clear transparent double-glazed glass', '💎', 1, true),
('vetro', 'Satinato', 'satinato', 'frosted satin glass for privacy', '🌫️', 2, true),
('vetro', 'Riflettente', 'riflettente', 'reflective solar control glass with mirror effect', '🪞', 3, true),
('vetro', 'Basso Emissivo', 'basso_emissivo', 'low-emissivity energy-efficient glass', '♻️', 4, true),
-- Persiane/Oscuranti
('oscurante', 'Nessuno', 'nessuno', 'no shutters or blinds', '❌', 0, true),
('oscurante', 'Persiana Alluminio', 'persiana_alluminio', 'aluminum roller shutters in matching color', '🔲', 1, true),
('oscurante', 'Scuro Legno', 'scuro_legno', 'traditional wooden window shutters', '🚪', 2, true),
('oscurante', 'Veneziana Integrata', 'veneziana', 'integrated venetian blinds between glass panes', '📏', 3, true),
-- Colori
('colore', 'Bianco RAL 9016', 'bianco_9016', 'traffic white RAL 9016 color', '⬜', 1, true),
('colore', 'Grigio Antracite RAL 7016', 'grigio_7016', 'anthracite grey RAL 7016 color', '🩶', 2, true),
('colore', 'Nero RAL 9005', 'nero_9005', 'jet black RAL 9005 color', '⬛', 3, true),
('colore', 'Marrone RAL 8014', 'marrone_8014', 'sepia brown RAL 8014 color', '🟫', 4, true),
('colore', 'Verde Muschio RAL 6005', 'verde_6005', 'moss green RAL 6005 color', '🟩', 5, true);
