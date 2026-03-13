
-- render_share_links: shareable public links for render galleries
CREATE TABLE public.render_share_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  gallery_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  nome_destinatario TEXT,
  email_destinatario TEXT,
  messaggio TEXT,
  titolo_pagina TEXT,
  colore_header TEXT,
  mostra_before BOOLEAN DEFAULT true,
  scade_il TIMESTAMPTZ,
  attivo BOOLEAN DEFAULT true,
  views_count INTEGER DEFAULT 0,
  ultima_visita_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_share_links_token ON public.render_share_links(token) WHERE attivo = true;
CREATE INDEX idx_share_links_company ON public.render_share_links(company_id);

-- RLS
ALTER TABLE public.render_share_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company members manage share links"
  ON public.render_share_links FOR ALL TO authenticated
  USING (company_id = public.my_company())
  WITH CHECK (company_id = public.my_company());

-- Superadmin full access
CREATE POLICY "Superadmin full access share links"
  ON public.render_share_links FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'superadmin'));
