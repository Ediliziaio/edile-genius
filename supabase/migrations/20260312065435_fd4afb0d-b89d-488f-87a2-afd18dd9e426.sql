-- WhatsApp contacts table for 24h window tracking
CREATE TABLE IF NOT EXISTS public.whatsapp_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  last_inbound_at TIMESTAMPTZ,
  last_message_at TIMESTAMPTZ,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  display_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (company_id, phone_number)
);

ALTER TABLE public.whatsapp_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "whatsapp_contacts_company" ON public.whatsapp_contacts
  FOR ALL USING (company_id = public.my_company());

CREATE POLICY "whatsapp_contacts_superadmin" ON public.whatsapp_contacts
  FOR ALL USING (public.has_role(auth.uid(), 'superadmin'));

-- Add media columns to whatsapp_messages
ALTER TABLE public.whatsapp_messages ADD COLUMN IF NOT EXISTS media_url TEXT;
ALTER TABLE public.whatsapp_messages ADD COLUMN IF NOT EXISTS media_type TEXT;

-- Create whatsapp-media storage bucket (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('whatsapp-media', 'whatsapp-media', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS for whatsapp-media
CREATE POLICY "whatsapp_media_company_read" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'whatsapp-media'
    AND (storage.foldername(name))[1] = public.my_company()::text
  );

CREATE POLICY "whatsapp_media_service_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'whatsapp-media'
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_whatsapp_contacts_company_phone ON public.whatsapp_contacts(company_id, phone_number);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_meta_id ON public.whatsapp_messages(meta_message_id) WHERE meta_message_id IS NOT NULL;