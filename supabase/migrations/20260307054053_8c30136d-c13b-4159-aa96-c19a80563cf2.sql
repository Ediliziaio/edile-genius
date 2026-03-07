
-- SuperAdmin WhatsApp config (global Meta API keys)
CREATE TABLE superadmin_whatsapp_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meta_app_id TEXT NOT NULL DEFAULT '',
  meta_app_secret_encrypted TEXT NOT NULL DEFAULT '',
  webhook_verify_token TEXT NOT NULL DEFAULT '',
  webhook_url TEXT NOT NULL DEFAULT '',
  subscription_price_monthly NUMERIC(10,2) DEFAULT 29.99,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE superadmin_whatsapp_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sa_wa_config_all" ON superadmin_whatsapp_config
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'superadmin') OR has_role(auth.uid(), 'superadmin_user'));

-- WhatsApp subscriptions per company
CREATE TABLE whatsapp_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'inactive',
  plan TEXT NOT NULL DEFAULT 'standard',
  price_monthly NUMERIC(10,2) DEFAULT 29.99,
  activated_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id)
);

ALTER TABLE whatsapp_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "co_wa_sub" ON whatsapp_subscriptions
  FOR ALL TO authenticated
  USING (company_id = my_company());

CREATE POLICY "sa_wa_sub" ON whatsapp_subscriptions
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'superadmin') OR has_role(auth.uid(), 'superadmin_user'));

-- WABA config per company (encrypted access tokens)
CREATE TABLE whatsapp_waba_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  waba_id TEXT NOT NULL,
  business_id TEXT,
  business_name TEXT,
  meta_verified BOOLEAN DEFAULT FALSE,
  meta_verification_status TEXT DEFAULT 'not_started',
  access_token_encrypted TEXT,
  system_user_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, waba_id)
);

ALTER TABLE whatsapp_waba_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "co_wa_waba" ON whatsapp_waba_config
  FOR ALL TO authenticated
  USING (company_id = my_company());

CREATE POLICY "sa_wa_waba" ON whatsapp_waba_config
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'superadmin') OR has_role(auth.uid(), 'superadmin_user'));

-- WhatsApp phone numbers
CREATE TABLE whatsapp_phone_numbers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  waba_id TEXT NOT NULL,
  phone_number_id TEXT NOT NULL UNIQUE,
  display_phone_number TEXT NOT NULL,
  display_name TEXT NOT NULL,
  verified_name TEXT,
  quality_rating TEXT DEFAULT 'UNKNOWN',
  messaging_limit_tier TEXT,
  certificate TEXT,
  name_status TEXT DEFAULT 'PENDING',
  status TEXT DEFAULT 'PENDING',
  webhook_verified BOOLEAN DEFAULT FALSE,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE whatsapp_phone_numbers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "co_wa_numbers" ON whatsapp_phone_numbers
  FOR ALL TO authenticated
  USING (company_id = my_company());

CREATE POLICY "sa_wa_numbers" ON whatsapp_phone_numbers
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'superadmin') OR has_role(auth.uid(), 'superadmin_user'));

-- WhatsApp templates
CREATE TABLE whatsapp_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  phone_number_id TEXT REFERENCES whatsapp_phone_numbers(phone_number_id),
  meta_template_id TEXT,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'MARKETING',
  language TEXT NOT NULL DEFAULT 'it',
  status TEXT NOT NULL DEFAULT 'PENDING',
  components JSONB NOT NULL DEFAULT '[]',
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, name, language)
);

ALTER TABLE whatsapp_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "co_wa_templates" ON whatsapp_templates
  FOR ALL TO authenticated
  USING (company_id = my_company());

CREATE POLICY "sa_wa_templates" ON whatsapp_templates
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'superadmin') OR has_role(auth.uid(), 'superadmin_user'));

-- WhatsApp conversations
CREATE TABLE whatsapp_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  phone_number_id TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  contact_id UUID REFERENCES contacts(id),
  assigned_user_id UUID,
  status TEXT DEFAULT 'open',
  unread_count INT DEFAULT 0,
  last_message_at TIMESTAMPTZ,
  window_expires_at TIMESTAMPTZ,
  ai_enabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE whatsapp_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "co_wa_conversations" ON whatsapp_conversations
  FOR ALL TO authenticated
  USING (company_id = my_company());

CREATE POLICY "sa_wa_conversations" ON whatsapp_conversations
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'superadmin') OR has_role(auth.uid(), 'superadmin_user'));

-- WhatsApp messages
CREATE TABLE whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  phone_number_id TEXT NOT NULL,
  contact_id UUID REFERENCES contacts(id),
  conversation_id UUID REFERENCES whatsapp_conversations(id),
  meta_message_id TEXT UNIQUE,
  direction TEXT NOT NULL DEFAULT 'outbound',
  type TEXT NOT NULL DEFAULT 'text',
  content JSONB NOT NULL DEFAULT '{}',
  status TEXT DEFAULT 'sent',
  error_code TEXT,
  error_message TEXT,
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "co_wa_messages" ON whatsapp_messages
  FOR ALL TO authenticated
  USING (company_id = my_company());

CREATE POLICY "sa_wa_messages" ON whatsapp_messages
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'superadmin') OR has_role(auth.uid(), 'superadmin_user'));

-- Triggers for updated_at
CREATE TRIGGER set_updated_at_wa_sub BEFORE UPDATE ON whatsapp_subscriptions FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER set_updated_at_wa_waba BEFORE UPDATE ON whatsapp_waba_config FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER set_updated_at_wa_numbers BEFORE UPDATE ON whatsapp_phone_numbers FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER set_updated_at_wa_templates BEFORE UPDATE ON whatsapp_templates FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER set_updated_at_wa_conversations BEFORE UPDATE ON whatsapp_conversations FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER set_updated_at_sa_wa_config BEFORE UPDATE ON superadmin_whatsapp_config FOR EACH ROW EXECUTE FUNCTION set_updated_at();
