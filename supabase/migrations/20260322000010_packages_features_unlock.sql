-- =============================================
-- Package → Feature mapping + unlock RPC
-- =============================================

-- 1. Add features_sbloccate array to ai_credit_packages
ALTER TABLE public.ai_credit_packages
  ADD COLUMN IF NOT EXISTS features_sbloccate text[] DEFAULT '{}';

-- 2. Update existing AI credits packages with their feature sets
UPDATE public.ai_credit_packages
SET features_sbloccate = ARRAY[
  'agente_vendita', 'crm_avanzato', 'automazioni_ai'
]
WHERE product_type = 'ai_credits' AND name IN ('Starter', 'Professional', 'Business', 'Enterprise');

-- 3. Update render packages with their feature sets
UPDATE public.ai_credit_packages
SET features_sbloccate = ARRAY[
  'render_stanza', 'render_bagno', 'render_facciata', 'render_tetto',
  'render_infissi', 'render_pavimento', 'render_persiane',
  'varianti_render', 'condivisione_link'
]
WHERE product_type = 'render_credits';

-- 4. Preventivi package (standalone, no credits needed — just feature unlock)
INSERT INTO public.ai_credit_packages (name, minutes, price_eur, badge, sort_order, product_type, features_sbloccate)
VALUES ('Preventivi AI', 0, 49, NULL, 20, 'ai_credits', ARRAY[
  'generatore_preventivi', 'knowledge_base', 'analisi_superfici'
])
ON CONFLICT DO NOTHING;

-- 5. RPC: unlock features for a company from a package
CREATE OR REPLACE FUNCTION public.unlock_package_features(
  _company_id   uuid,
  _package_id   uuid,
  _expires_at   timestamptz DEFAULT NULL,
  _limite_mensile integer DEFAULT NULL
)
RETURNS integer  -- number of features unlocked
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

-- 6. RPC: manually unlock/lock a single feature for a company (superadmin use)
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
