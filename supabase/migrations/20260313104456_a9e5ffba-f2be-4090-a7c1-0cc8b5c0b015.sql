
-- ═══════════════════════════════════════════════════════════
-- Render Pavimento: 3 tables + 2 storage buckets + RLS
-- ═══════════════════════════════════════════════════════════

-- 1. Sessions table
CREATE TABLE IF NOT EXISTS public.render_pavimento_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'uploading',
  original_image_path TEXT,
  original_image_url TEXT,
  result_image_url TEXT,
  analysis_result JSONB,
  tipo_operazione TEXT,
  tipo_pavimento TEXT,
  sottotipo TEXT,
  finitura TEXT,
  pattern_posa TEXT,
  colore_mode TEXT,
  colore_name TEXT,
  colore_hex TEXT,
  wood_name TEXT,
  dimensione_piastrella TEXT,
  larghezza_listello_mm INTEGER,
  lunghezza_listello_mm INTEGER,
  larghezza_fuga_mm INTEGER,
  colore_fuga TEXT,
  system_prompt TEXT,
  user_prompt TEXT,
  prompt_usato TEXT,
  original_width INTEGER,
  original_height INTEGER,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.render_pavimento_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own pavimento sessions"
  ON public.render_pavimento_sessions FOR ALL TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Superadmin full access pavimento sessions"
  ON public.render_pavimento_sessions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'superadmin'));

-- 2. Gallery table
CREATE TABLE IF NOT EXISTS public.render_pavimento_gallery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  session_id UUID REFERENCES public.render_pavimento_sessions(id) ON DELETE SET NULL,
  result_image_url TEXT NOT NULL,
  tipo_operazione TEXT,
  tipo_pavimento TEXT,
  sottotipo TEXT,
  finitura TEXT,
  pattern_posa TEXT,
  colore_mode TEXT,
  colore_name TEXT,
  colore_hex TEXT,
  wood_name TEXT,
  is_favorite BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.render_pavimento_gallery ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own pavimento gallery"
  ON public.render_pavimento_gallery FOR ALL TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Superadmin full access pavimento gallery"
  ON public.render_pavimento_gallery FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'superadmin'));

-- 3. Stili pronti table
CREATE TABLE IF NOT EXISTS public.render_pavimento_stili_pronti (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  descrizione TEXT,
  emoji TEXT DEFAULT '🪵',
  preview_hex TEXT,
  config JSONB NOT NULL DEFAULT '{}',
  ordine INTEGER DEFAULT 0,
  attivo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.render_pavimento_stili_pronti ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth users read pavimento stili"
  ON public.render_pavimento_stili_pronti FOR SELECT TO authenticated USING (TRUE);

CREATE INDEX idx_pav_stili_ordine ON public.render_pavimento_stili_pronti (ordine, attivo);

-- 4. Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('pavimento-originals', 'pavimento-originals', false) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('pavimento-results', 'pavimento-results', true) ON CONFLICT (id) DO NOTHING;

-- Storage RLS for pavimento-originals
CREATE POLICY "Auth users upload pavimento originals"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'pavimento-originals');

CREATE POLICY "Auth users read own pavimento originals"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'pavimento-originals' AND (auth.uid()::text = (storage.foldername(name))[1]));

-- Storage RLS for pavimento-results (public read)
CREATE POLICY "Public read pavimento results"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'pavimento-results');

CREATE POLICY "Auth users upload pavimento results"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'pavimento-results');

-- 5. Insert 8 stili pronti
INSERT INTO public.render_pavimento_stili_pronti (nome, descrizione, emoji, preview_hex, ordine, config) VALUES
('Parquet rovere miele', 'Parquet prefinito, tono miele dorato, spina di pesce, finitura opaca', '🪵', '#C8913A', 1, '{"tipo_operazione":"sostituisci","tipo_pavimento":"parquet","sottotipo":"prefinito","finitura":"opaco","pattern_posa":"spina_di_pesce","colore":{"mode":"palette","code":"miele","name":"Miele dorato","hex":"#C8913A"},"larghezza_listello_mm":140,"lunghezza_listello_mm":900}'::jsonb),
('Gres effetto marmo', 'Gres rettificato 120×120, effetto Calacatta oro, lucido', '🏛️', '#EDE8DC', 2, '{"tipo_operazione":"sostituisci","tipo_pavimento":"gres_porcellanato","sottotipo":"effetto_marmo","finitura":"lucido","pattern_posa":"rettilineo_dritto","colore":{"mode":"palette","code":"calacatta","name":"Calacatta oro","hex":"#EDE8DC"},"dimensione_piastrella":"120x120","larghezza_fuga_mm":2,"colore_fuga":"bianco"}'::jsonb),
('Ceramica grigio antracite', 'Ceramica rettificata 80×80, antracite opaco, posa dritta', '🔲', '#454545', 3, '{"tipo_operazione":"sostituisci","tipo_pavimento":"ceramica","sottotipo":"rettificato","finitura":"opaco","pattern_posa":"rettilineo_dritto","colore":{"mode":"palette","code":"grigio_ant","name":"Grigio antracite","hex":"#454545"},"dimensione_piastrella":"80x80","larghezza_fuga_mm":3,"colore_fuga":"grigio_sc"}'::jsonb),
('Marmo Bianco Carrara', 'Marmo naturale levigato, posa diagonale 45°, fuga minima bianca', '🤍', '#F5F2EE', 4, '{"tipo_operazione":"sostituisci","tipo_pavimento":"marmo","sottotipo":"levigato","finitura":"lucido","pattern_posa":"diagonale_45","colore":{"mode":"palette","code":"bianco_carrara","name":"Bianco Carrara","hex":"#F5F2EE"},"dimensione_piastrella":"60x60","larghezza_fuga_mm":2,"colore_fuga":"bianco"}'::jsonb),
('Parquet wengé scuro', 'Parquet massello wengé, posa a correre lungo, spazzolato', '🌑', '#3D2B1F', 5, '{"tipo_operazione":"sostituisci","tipo_pavimento":"parquet","sottotipo":"massello","finitura":"spazzolato","pattern_posa":"a_correre","colore":{"mode":"palette","code":"wengé","name":"Wengé scuro","hex":"#3D2B1F"},"larghezza_listello_mm":140,"lunghezza_listello_mm":1800}'::jsonb),
('Cotto toscano', 'Cotto artigianale terracotta, opus incertum, finitura anticata', '🏺', '#C1693A', 6, '{"tipo_operazione":"sostituisci","tipo_pavimento":"cotto","sottotipo":"cotto_artigianale","finitura":"anticato","pattern_posa":"opus_incertum","colore":{"mode":"palette","code":"terracotta","name":"Terracotta","hex":"#C1693A"},"dimensione_piastrella":"30x30","larghezza_fuga_mm":8,"colore_fuga":"cementite"}'::jsonb),
('Microcemento grigio', 'Microcemento seamless grigio medio, finitura satinata', '⬛', '#9E9E9E', 7, '{"tipo_operazione":"sostituisci","tipo_pavimento":"cemento_resina","sottotipo":"microcemento","finitura":"satinato","pattern_posa":"rettilineo_dritto","colore":{"mode":"palette","code":"grigio_med","name":"Grigio medio","hex":"#9E9E9E"}}'::jsonb),
('LVT rovere bianco', 'Vinile LVT click, rovere bianco neve, posa a correre', '🪣', '#F0EDE8', 8, '{"tipo_operazione":"sostituisci","tipo_pavimento":"vinile_lvt","sottotipo":"click_lvt","finitura":"opaco","pattern_posa":"a_correre","colore":{"mode":"palette","code":"bianco_neve","name":"Rovere bianco neve","hex":"#F0EDE8"},"larghezza_listello_mm":180,"lunghezza_listello_mm":1200}'::jsonb);
