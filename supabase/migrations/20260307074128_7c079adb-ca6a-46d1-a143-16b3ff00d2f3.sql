
-- ================================================================
-- AGENT TEMPLATES SYSTEM — 4 tables + RLS + Seed
-- ================================================================

-- 1. Catalogo template (gestiti dal SuperAdmin)
CREATE TABLE IF NOT EXISTS agent_templates (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug              TEXT UNIQUE NOT NULL,
  name              TEXT NOT NULL,
  description       TEXT,
  category          TEXT CHECK (category IN (
    'reportistica', 'qualifica_lead', 'assistenza', 'appuntamenti',
    'preventivi', 'sicurezza', 'hr_operai', 'post_vendita'
  )),
  icon              TEXT DEFAULT '🤖',
  channel           TEXT[] DEFAULT '{whatsapp}',
  estimated_setup_min INTEGER DEFAULT 30,
  difficulty        TEXT DEFAULT 'facile' CHECK (difficulty IN ('facile','medio','avanzato')),
  is_published      BOOLEAN DEFAULT false,
  is_featured       BOOLEAN DEFAULT false,
  prompt_template   TEXT NOT NULL,
  first_message_template TEXT,
  config_schema     JSONB NOT NULL DEFAULT '[]',
  n8n_workflow_json JSONB,
  output_schema     JSONB DEFAULT '{}',
  preview_image_url TEXT,
  installs_count    INTEGER DEFAULT 0,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_by        UUID REFERENCES profiles(id)
);

-- 2. Istanze per azienda
CREATE TABLE IF NOT EXISTS agent_template_instances (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id       UUID NOT NULL REFERENCES agent_templates(id),
  company_id        UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  agent_id          UUID REFERENCES agents(id) ON DELETE SET NULL,
  name              TEXT NOT NULL,
  status            TEXT DEFAULT 'setup' CHECK (status IN ('setup','active','paused','error')),
  config_values     JSONB NOT NULL DEFAULT '{}',
  n8n_workflow_id   TEXT,
  n8n_workflow_active BOOLEAN DEFAULT false,
  responders        JSONB DEFAULT '[]',
  recipients        JSONB DEFAULT '[]',
  trigger_time      TIME DEFAULT '17:30:00',
  trigger_days      TEXT[] DEFAULT '{monday,tuesday,wednesday,thursday,friday,saturday}',
  timezone          TEXT DEFAULT 'Europe/Rome',
  reports_generated INTEGER DEFAULT 0,
  last_run_at       TIMESTAMPTZ,
  last_report_url   TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  created_by        UUID REFERENCES profiles(id)
);

-- 3. Report generati
CREATE TABLE IF NOT EXISTS agent_reports (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id       UUID NOT NULL REFERENCES agent_template_instances(id) ON DELETE CASCADE,
  company_id        UUID NOT NULL REFERENCES companies(id),
  conversation_id   UUID REFERENCES conversations(id),
  date              DATE NOT NULL,
  raw_data          JSONB NOT NULL DEFAULT '{}',
  report_html       TEXT,
  report_summary    TEXT,
  sent_to           JSONB DEFAULT '[]',
  status            TEXT DEFAULT 'draft' CHECK (status IN ('draft','sent','error','partial')),
  generated_at      TIMESTAMPTZ DEFAULT NOW(),
  pdf_url           TEXT
);

-- 4. Canali comunicazione azienda
CREATE TABLE IF NOT EXISTS company_channels (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  channel_type    TEXT NOT NULL CHECK (channel_type IN ('whatsapp','telegram','email','sms')),
  label           TEXT,
  whatsapp_number TEXT,
  whatsapp_provider TEXT DEFAULT 'twilio',
  whatsapp_token  TEXT,
  telegram_bot_token TEXT,
  telegram_bot_name  TEXT,
  email_from      TEXT,
  email_provider  TEXT DEFAULT 'resend',
  is_verified     BOOLEAN DEFAULT false,
  verified_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE agent_templates            ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_template_instances   ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_reports              ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_channels           ENABLE ROW LEVEL SECURITY;

-- SuperAdmin: tutto (PERMISSIVE)
CREATE POLICY "sa_templates"   ON agent_templates          FOR ALL TO authenticated USING (has_role(auth.uid(), 'superadmin') OR has_role(auth.uid(), 'superadmin_user'));
CREATE POLICY "sa_instances"   ON agent_template_instances FOR ALL TO authenticated USING (has_role(auth.uid(), 'superadmin') OR has_role(auth.uid(), 'superadmin_user'));
CREATE POLICY "sa_reports"     ON agent_reports            FOR ALL TO authenticated USING (has_role(auth.uid(), 'superadmin') OR has_role(auth.uid(), 'superadmin_user'));
CREATE POLICY "sa_channels"    ON company_channels         FOR ALL TO authenticated USING (has_role(auth.uid(), 'superadmin') OR has_role(auth.uid(), 'superadmin_user'));

-- Aziende: templates published = SELECT only
CREATE POLICY "co_templates_select" ON agent_templates FOR SELECT TO authenticated USING (is_published = true);
-- Aziende: propri dati
CREATE POLICY "co_instances"   ON agent_template_instances FOR ALL TO authenticated USING (company_id = my_company());
CREATE POLICY "co_reports"     ON agent_reports            FOR ALL TO authenticated USING (company_id = my_company());
CREATE POLICY "co_channels"    ON company_channels         FOR ALL TO authenticated USING (company_id = my_company());

-- ================================================================
-- SEED: Template "Reportistica Serale Cantiere"
-- ================================================================
INSERT INTO agent_templates (
  slug, name, description, category, icon,
  channel, estimated_setup_min, difficulty,
  is_published, is_featured,
  prompt_template, first_message_template,
  config_schema, output_schema
) VALUES (
  'report-serale-cantiere',
  'Reportistica Serale Cantiere',
  'Ogni sera l''agente contatta i capi-cantiere su WhatsApp o Telegram, raccoglie la reportistica giornaliera e invia un report completo al titolare.',
  'reportistica',
  '📋',
  '{whatsapp,telegram}',
  30,
  'facile',
  true,
  true,
  E'Sei l''assistente operativo di {{NOME_AZIENDA}}, specializzata in {{SETTORE}}.\nOgni sera contatti i capi-cantiere per raccogliere la reportistica giornaliera.\n\nTONO: Professionale ma diretto. Messaggi brevi e chiari.\nLINGUA: Italiano. Messaggi max 2-3 righe ciascuno.\nCANALE: {{CANALE}}\n\nIL TUO OBIETTIVO: raccogliere queste informazioni per il cantiere {{NOME_CANTIERE}}:\n1. Numero di operai presenti oggi\n2. Lavorazioni eseguite oggi\n3. Materiali utilizzati o consegnati\n4. Problemi o imprevisti\n5. Avanzamento rispetto al programma (in anticipo / in pari / in ritardo)\n6. Previsione lavori domani\n7. Note o segnalazioni al titolare (opzionale)\n\nREGOLE:\n- Fai UNA domanda alla volta\n- Se la risposta è vaga, chiedi un dettaglio specifico\n- Accetta anche risposte brevi\n- Al termine: riepiloga brevemente e chiedi conferma\n- Se non risponde entro 30 min: invia un promemoria\n- Se non risponde dopo 2 tentativi: notifica {{NOME_RESPONSABILE}}',
  E'Buonasera {{NOME_CAPOCANTIERE}} 👷\nReport serale {{NOME_CANTIERE}} — ci vogliono 2 minuti. Pronto?',
  '[
    {"key":"nome_azienda","label":"Nome della tua azienda","type":"text","placeholder":"es. Rossi Costruzioni Srl","required":true,"section":"Azienda"},
    {"key":"settore","label":"Settore principale","type":"select","options":["Infissi e serramenti","Ristrutturazioni","Fotovoltaico","Edilizia generale","Impianti","Altro"],"required":true,"section":"Azienda"},
    {"key":"orario_invio","label":"Orario invio messaggio serale","type":"time","default":"17:30","help":"A che ora vuoi che l''agente contatti i capi-cantiere?","required":true,"section":"Scheduling"},
    {"key":"giorni_attivi","label":"Giorni in cui inviare il report","type":"multiselect","options":["Lunedì","Martedì","Mercoledì","Giovedì","Venerdì","Sabato","Domenica"],"default":["Lunedì","Martedì","Mercoledì","Giovedì","Venerdì","Sabato"],"required":true,"section":"Scheduling"},
    {"key":"canale_operai","label":"Canale per contattare gli operai","type":"select","options":["WhatsApp","Telegram"],"default":"WhatsApp","required":true,"section":"Canali"},
    {"key":"canale_report","label":"Come inviare il report al titolare","type":"multiselect","options":["Email","WhatsApp","Telegram"],"default":["Email","WhatsApp"],"required":true,"section":"Canali"},
    {"key":"promemoria_minuti","label":"Minuti prima del promemoria","type":"number","default":30,"min":10,"max":120,"help":"Dopo quanti minuti senza risposta inviare un promemoria?","section":"Comportamento"},
    {"key":"lingua_report","label":"Lingua del report finale","type":"select","options":["Italiano","English"],"default":"Italiano","section":"Comportamento"}
  ]'::jsonb,
  '{"fields":[
    {"key":"operai_presenti","label":"Operai presenti","type":"number"},
    {"key":"lavorazioni","label":"Lavorazioni eseguite","type":"text"},
    {"key":"materiali","label":"Materiali utilizzati","type":"text"},
    {"key":"problemi","label":"Problemi/imprevisti","type":"text"},
    {"key":"avanzamento","label":"Avanzamento","type":"enum","values":["anticipo","pari","ritardo"]},
    {"key":"previsione_domani","label":"Previsione domani","type":"text"},
    {"key":"note_titolare","label":"Note per il titolare","type":"text"}
  ]}'::jsonb
);
