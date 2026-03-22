-- ============================================================
-- FEATURES SYSTEM - Apply this in Supabase SQL Editor
-- Safe to run multiple times (idempotent)
-- ============================================================

-- 1. Tables (IF NOT EXISTS — safe if already created)
-- -------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.piattaforma_features (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  descrizione TEXT,
  categoria TEXT NOT NULL,
  icona TEXT,
  crediti_per_uso INTEGER DEFAULT 1
);

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

-- 2. RLS
-- -------------------------------------------------------

ALTER TABLE public.piattaforma_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.azienda_features_sbloccate ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_feature_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_feature_usage ENABLE ROW LEVEL SECURITY;

-- piattaforma_features: readable by all authenticated
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'piattaforma_features' AND policyname = 'features_read_all') THEN
    CREATE POLICY "features_read_all" ON public.piattaforma_features FOR SELECT TO authenticated USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'piattaforma_features' AND policyname = 'features_superadmin_all') THEN
    CREATE POLICY "features_superadmin_all" ON public.piattaforma_features FOR ALL TO authenticated
    USING (public.has_role(auth.uid(), 'superadmin'));
  END IF;
END $$;

-- azienda_features_sbloccate
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'azienda_features_sbloccate' AND policyname = 'azienda_features_read') THEN
    CREATE POLICY "azienda_features_read" ON public.azienda_features_sbloccate FOR SELECT TO authenticated
    USING (company_id = public.my_company() OR public.has_role(auth.uid(), 'superadmin'));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'azienda_features_sbloccate' AND policyname = 'azienda_features_superadmin') THEN
    CREATE POLICY "azienda_features_superadmin" ON public.azienda_features_sbloccate FOR ALL TO authenticated
    USING (public.has_role(auth.uid(), 'superadmin'));
  END IF;
END $$;

-- user_feature_permissions
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_feature_permissions' AND policyname = 'permissions_own_read') THEN
    CREATE POLICY "permissions_own_read" ON public.user_feature_permissions FOR SELECT TO authenticated
    USING (user_id = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_feature_permissions' AND policyname = 'permissions_company_read') THEN
    CREATE POLICY "permissions_company_read" ON public.user_feature_permissions FOR SELECT TO authenticated
    USING (company_id = public.my_company());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_feature_permissions' AND policyname = 'permissions_admin_write') THEN
    CREATE POLICY "permissions_admin_write" ON public.user_feature_permissions FOR ALL TO authenticated
    USING (company_id = public.my_company() AND public.my_role() IN ('company_admin', 'superadmin', 'superadmin_user'))
    WITH CHECK (company_id = public.my_company() AND public.my_role() IN ('company_admin', 'superadmin', 'superadmin_user'));
  END IF;
END $$;

-- user_feature_usage
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_feature_usage' AND policyname = 'usage_own_read') THEN
    CREATE POLICY "usage_own_read" ON public.user_feature_usage FOR SELECT TO authenticated
    USING (user_id = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_feature_usage' AND policyname = 'usage_insert_own') THEN
    CREATE POLICY "usage_insert_own" ON public.user_feature_usage FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid() AND company_id = public.my_company());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_feature_usage' AND policyname = 'usage_company_read') THEN
    CREATE POLICY "usage_company_read" ON public.user_feature_usage FOR SELECT TO authenticated
    USING (company_id = public.my_company());
  END IF;
END $$;

-- 3. Seed feature catalog (ON CONFLICT DO NOTHING = safe to re-run)
-- -------------------------------------------------------

INSERT INTO public.piattaforma_features (id, nome, descrizione, categoria, icona, crediti_per_uso) VALUES
  ('render_stanza',       'Render Stanza',          'Trasforma interni con AI',                       'render',     '🛋',  1),
  ('render_bagno',        'Render Bagno',            'Ristruttura bagni con AI',                       'render',     '🚿',  1),
  ('render_facciata',     'Render Facciata',         'Rinnova facciate esterne',                       'render',     '🏠',  1),
  ('render_tetto',        'Render Tetto',            'Cambia manto e colore del tetto',                'render',     '🏗',  1),
  ('render_infissi',      'Render Infissi',          'Sostituisci finestre e porte',                   'render',     '🪟',  1),
  ('render_pavimento',    'Render Pavimento',        'Cambia pavimenti con AI',                        'render',     '🪵',  1),
  ('render_persiane',     'Render Persiane',         'Cambia persiane e tapparelle',                   'render',     '🌂',  1),
  ('varianti_render',     'Varianti Render',         'Genera 2-3 varianti a confronto',                'render',     '⚡',  2),
  ('condivisione_link',   'Condivisione Link',       'Invia render ai clienti via link',               'render',     '🔗',  0),
  ('generatore_preventivi','Generatore Preventivi',  'Crea offerte brandizzate con AI+RAG',            'preventivi', '📄',  0),
  ('knowledge_base',      'Knowledge Base',          'Carica PDF e schede prodotto per AI',            'preventivi', '📚',  0),
  ('analisi_superfici',   'Analisi Superfici AI',    'Stima mq da foto con Gemini Vision',             'preventivi', '📐',  2),
  ('agente_vendita',      'Agente Vendita AI',       'Automazione follow-up e lead',                   'agenti_ai',  '🤖',  0),
  ('automazioni_ai',      'Automazioni AI',          'Workflow automatici personalizzati',              'automazioni','⚙',   0),
  ('crm_avanzato',        'CRM Avanzato',            'Pipeline, campagne e monitor chiamate',          'crm',        '📊',  0)
ON CONFLICT (id) DO NOTHING;

-- 4. RPC: set_company_feature (superadmin toggle — CREATE OR REPLACE is idempotent)
-- -------------------------------------------------------

CREATE OR REPLACE FUNCTION public.set_company_feature(
  _company_id     uuid,
  _feature_id     text,
  _attivo         boolean,
  _limite_mensile integer DEFAULT NULL,
  _expires_at     timestamptz DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF _attivo THEN
    INSERT INTO public.azienda_features_sbloccate
      (company_id, feature_id, attivo, limite_mensile, scade_il)
    VALUES
      (_company_id, _feature_id, true, _limite_mensile, _expires_at)
    ON CONFLICT (company_id, feature_id)
    DO UPDATE SET
      attivo         = true,
      limite_mensile = EXCLUDED.limite_mensile,
      scade_il       = EXCLUDED.scade_il,
      sbloccato_il   = now();
  ELSE
    UPDATE public.azienda_features_sbloccate
    SET attivo = false
    WHERE company_id = _company_id AND feature_id = _feature_id;
  END IF;
END;
$$;

-- Allow superadmin to call this RPC
GRANT EXECUTE ON FUNCTION public.set_company_feature TO authenticated;

-- 5. RPC: unlock_package_features (called on Stripe purchase)
-- -------------------------------------------------------

ALTER TABLE public.ai_credit_packages
  ADD COLUMN IF NOT EXISTS features_sbloccate text[] DEFAULT '{}';

CREATE OR REPLACE FUNCTION public.unlock_package_features(
  _company_id     uuid,
  _package_id     uuid,
  _expires_at     timestamptz DEFAULT NULL,
  _limite_mensile integer DEFAULT NULL
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _features text[];
  _feat     text;
  _count    integer := 0;
BEGIN
  SELECT features_sbloccate INTO _features
  FROM public.ai_credit_packages
  WHERE id = _package_id;

  IF _features IS NULL OR array_length(_features, 1) = 0 THEN
    RETURN 0;
  END IF;

  FOREACH _feat IN ARRAY _features LOOP
    INSERT INTO public.azienda_features_sbloccate
      (company_id, feature_id, scade_il, limite_mensile, attivo)
    VALUES
      (_company_id, _feat, _expires_at, _limite_mensile, true)
    ON CONFLICT (company_id, feature_id)
    DO UPDATE SET
      attivo         = true,
      scade_il       = EXCLUDED.scade_il,
      limite_mensile = COALESCE(EXCLUDED.limite_mensile, azienda_features_sbloccate.limite_mensile),
      sbloccato_il   = now();
    _count := _count + 1;
  END LOOP;

  RETURN _count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.unlock_package_features TO authenticated;
