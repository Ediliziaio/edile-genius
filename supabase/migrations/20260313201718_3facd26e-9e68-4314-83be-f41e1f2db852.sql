
-- Catalogo funzionalità piattaforma
CREATE TABLE IF NOT EXISTS public.piattaforma_features (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  descrizione TEXT,
  categoria TEXT NOT NULL,
  icona TEXT,
  crediti_per_uso INTEGER DEFAULT 1
);

-- Funzionalità sbloccate per azienda
CREATE TABLE IF NOT EXISTS public.azienda_features_sbloccate (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  feature_id TEXT NOT NULL REFERENCES public.piattaforma_features(id),
  sbloccato_il TIMESTAMPTZ DEFAULT NOW(),
  scade_il TIMESTAMPTZ,
  limite_mensile INTEGER,
  attivo BOOLEAN DEFAULT true,
  UNIQUE(company_id, feature_id)
);

-- Permessi utente per feature
CREATE TABLE IF NOT EXISTS public.user_feature_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feature_id TEXT NOT NULL REFERENCES public.piattaforma_features(id),
  abilitato BOOLEAN DEFAULT true,
  limite_mensile INTEGER,
  limite_giornaliero INTEGER,
  note_admin TEXT,
  creato_il TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, user_id, feature_id)
);

-- Tracking utilizzo
CREATE TABLE IF NOT EXISTS public.user_feature_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  feature_id TEXT NOT NULL REFERENCES public.piattaforma_features(id),
  usato_il TIMESTAMPTZ DEFAULT NOW(),
  dettagli JSONB
);
CREATE INDEX IF NOT EXISTS idx_usage_user_feature ON public.user_feature_usage(user_id, feature_id, usato_il DESC);
CREATE INDEX IF NOT EXISTS idx_usage_company_month ON public.user_feature_usage(company_id, usato_il DESC);

-- Inviti in attesa
CREATE TABLE IF NOT EXISTS public.azienda_inviti (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  ruolo TEXT DEFAULT 'membro' CHECK (ruolo IN ('admin', 'membro')),
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
  scade_il TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days',
  invitato_da UUID REFERENCES auth.users(id),
  accettato BOOLEAN DEFAULT false,
  creato_il TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.piattaforma_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.azienda_features_sbloccate ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_feature_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_feature_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.azienda_inviti ENABLE ROW LEVEL SECURITY;

-- piattaforma_features: readable by all authenticated
CREATE POLICY "features_read_all" ON public.piattaforma_features FOR SELECT TO authenticated USING (true);

-- SuperAdmin full access to piattaforma_features
CREATE POLICY "features_superadmin_all" ON public.piattaforma_features FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'superadmin'));

-- azienda_features_sbloccate: company members can read
CREATE POLICY "azienda_features_read" ON public.azienda_features_sbloccate FOR SELECT TO authenticated
USING (company_id = public.my_company() OR public.has_role(auth.uid(), 'superadmin'));

-- SuperAdmin manages azienda features
CREATE POLICY "azienda_features_superadmin" ON public.azienda_features_sbloccate FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'superadmin'));

-- user_feature_permissions: own user can read
CREATE POLICY "permissions_own_read" ON public.user_feature_permissions FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- company admin/owner can manage permissions
CREATE POLICY "permissions_company_admin" ON public.user_feature_permissions FOR ALL TO authenticated
USING (company_id = public.my_company());

-- user_feature_usage: own user reads
CREATE POLICY "usage_own_read" ON public.user_feature_usage FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- company members can insert own usage
CREATE POLICY "usage_insert_own" ON public.user_feature_usage FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid() AND company_id = public.my_company());

-- company admin reads all company usage
CREATE POLICY "usage_company_read" ON public.user_feature_usage FOR SELECT TO authenticated
USING (company_id = public.my_company());

-- azienda_inviti: company admin manages
CREATE POLICY "inviti_company_admin" ON public.azienda_inviti FOR ALL TO authenticated
USING (company_id = public.my_company());

-- Seed features catalog
INSERT INTO public.piattaforma_features (id, nome, descrizione, categoria, icona, crediti_per_uso) VALUES
  ('render_stanza', 'Render Stanza', 'Trasforma interni con AI', 'render', '🛋', 1),
  ('render_bagno', 'Render Bagno', 'Ristruttura bagni con AI', 'render', '🚿', 1),
  ('render_facciata', 'Render Facciata', 'Rinnova facciate esterne', 'render', '🏠', 1),
  ('render_tetto', 'Render Tetto', 'Cambia manto e colore del tetto', 'render', '🏗', 1),
  ('render_infissi', 'Render Infissi', 'Sostituisci finestre e porte', 'render', '🪟', 1),
  ('render_pavimento', 'Render Pavimento', 'Cambia pavimenti con AI', 'render', '🪵', 1),
  ('render_persiane', 'Render Persiane', 'Cambia persiane e tapparelle', 'render', '🌂', 1),
  ('varianti_render', 'Varianti Render', 'Genera 2-3 varianti a confronto', 'render', '⚡', 2),
  ('condivisione_link', 'Condivisione Link', 'Invia render ai clienti via link', 'render', '🔗', 0),
  ('generatore_preventivi', 'Generatore Preventivi', 'Crea offerte brandizzate con AI+RAG', 'preventivi', '📄', 0),
  ('knowledge_base', 'Knowledge Base', 'Carica PDF e schede prodotto per AI', 'preventivi', '📚', 0),
  ('analisi_superfici', 'Analisi Superfici AI', 'Stima mq da foto con Gemini Vision', 'preventivi', '📐', 2),
  ('agente_vendita', 'Agente Vendita AI', 'Automazione follow-up e lead', 'agenti_ai', '🤖', 0),
  ('automazioni_ai', 'Automazioni AI', 'Workflow automatici personalizzati', 'automazioni', '⚙', 0),
  ('crm_avanzato', 'CRM Avanzato', 'Pipeline, campagne e monitor chiamate', 'crm', '📊', 0)
ON CONFLICT (id) DO NOTHING;
