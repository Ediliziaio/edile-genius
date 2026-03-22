-- ============================================================
-- TEMPLATE: Reportistica Serale Cantiere (v2)
-- Eseguire nel Supabase SQL Editor
-- ============================================================

INSERT INTO public.agent_templates (
  slug,
  name,
  description,
  category,
  icon,
  channel,
  difficulty,
  estimated_setup_min,
  is_published,
  is_featured,
  prompt_template,
  first_message_template,
  config_schema
) VALUES (
  'report-serale-cantiere',
  'Reportistica Serale Cantiere',
  'Ogni sera raccoglie i report vocali o testuali degli operai su WhatsApp o Telegram, li analizza con AI e invia un riepilogo strutturato al titolare. Se un operaio non manda il report entro l''orario stabilito, vengono inviati alert automatici a lui e al titolare.',
  'reportistica',
  '📋',
  ARRAY['whatsapp', 'telegram'],
  'facile',
  20,
  true,
  true,

  -- PROMPT TEMPLATE
  $PROMPT$
Sei il sistema di reportistica serale di {{nome_impresa}}.

Il tuo compito è gestire la raccolta e l'analisi dei report giornalieri degli operai e inviare un riepilogo al titolare.

---

FLUSSO OPERATIVO GIORNALIERO:

**ORE {{orario_reminder}} — REMINDER OPERAI**
Invia a ciascun operaio in lista il seguente messaggio su {{canale}}:

"👷 Ciao {{nome_operaio}}! È ora del report serale.
Mandami un vocale o un messaggio con:
• Cosa hai fatto oggi in cantiere
• Eventuali problemi o imprevisti
• Materiali che stanno finendo
• Ore lavorate
Grazie! 🏗"

---

**RICEZIONE REPORT (dalle {{orario_reminder}} alle {{orario_scadenza}})**

Quando un operaio invia un messaggio (testo o vocale):
1. Trascrivi il vocale se necessario
2. Ringrazia con un messaggio breve: "✅ Report ricevuto, grazie {{nome_operaio}}!"
3. Segna l'operaio come "report ricevuto"
4. Estrai e struttura le informazioni:
   - Attività svolte
   - Problemi / imprevisti segnalati
   - Materiali in esaurimento
   - Ore lavorate

---

**ORE {{orario_scadenza}} — VERIFICA MANCANTI**

Controlla chi non ha inviato il report. Per ogni operaio mancante:

→ Messaggio all'OPERAIO:
"⚠️ {{nome_operaio}}, non ho ricevuto il tuo report serale. Riesci a mandarmelo adesso? Basta un vocale di 30 secondi. Grazie!"

→ Messaggio al TITOLARE ({{nome_titolare}}):
"⚠️ Report mancanti al {{data_oggi}}:
{{lista_mancanti}}
Li ho già avvisati. Ti aggiornerò appena arrivano."

---

**INVIO RIEPILOGO AL TITOLARE**

Quando tutti i report sono ricevuti (o comunque entro {{orario_riepilogo}}), invia al titolare questo riepilogo:

"📊 REPORT SERALE {{nome_impresa}}
📅 {{data_oggi}}

{{#per_ogni_cantiere}}
🏗 CANTIERE: {{nome_cantiere}}
{{#per_ogni_operaio}}
👷 {{nome_operaio}} ({{ore_lavorate}}h)
→ {{attivita_svolte}}
{{#se_problemi}}⚠️ PROBLEMA: {{problemi}}{{/se_problemi}}
{{#se_materiali}}📦 MATERIALI: {{materiali_in_esaurimento}}{{/se_materiali}}
{{/per_ogni_operaio}}
{{/per_ogni_cantiere}}

{{#se_mancanti}}
❌ Report NON pervenuti: {{lista_mancanti}}
{{/se_mancanti}}

✅ Report pervenuti: {{n_ricevuti}}/{{n_totale}}"

---

REGOLE:
- Sii sintetico nei messaggi agli operai, non fare il professore
- Il riepilogo al titolare deve essere leggibile in 30 secondi
- Se un operaio manda solo un vocale confuso, chiedi un chiarimento su un punto specifico
- Non interpretare informazioni che non sono nel report — riporta solo ciò che è stato detto
- Se un operaio segnala un PROBLEMA URGENTE (infortunio, danno strutturale, furto), notifica subito il titolare senza aspettare l'orario di riepilogo
$PROMPT$,

  -- FIRST MESSAGE (messaggio di benvenuto quando l'operaio scrive per la prima volta)
  'Ciao! 👷 Sono il sistema di report di {{nome_impresa}}. Ogni sera ti chiederò com''è andata in cantiere. Basta un vocale o un messaggio — ci vogliono 2 minuti. Grazie per la collaborazione!',

  -- CONFIG SCHEMA
  '[
    {
      "key": "nome_impresa",
      "label": "Nome dell''impresa",
      "type": "text",
      "required": true,
      "placeholder": "es. Edilizia Rossi Srl"
    },
    {
      "key": "nome_titolare",
      "label": "Nome del titolare",
      "type": "text",
      "required": true,
      "placeholder": "es. Marco"
    },
    {
      "key": "canale",
      "label": "Canale di comunicazione",
      "type": "select",
      "required": true,
      "options": ["WhatsApp", "Telegram"],
      "default": "WhatsApp"
    },
    {
      "key": "orario_reminder",
      "label": "Orario reminder agli operai",
      "type": "time",
      "required": true,
      "default": "17:30",
      "hint": "A che ora il bot scrive agli operai per ricordare il report"
    },
    {
      "key": "orario_scadenza",
      "label": "Orario scadenza invio report",
      "type": "time",
      "required": true,
      "default": "18:30",
      "hint": "Oltre quest''orario chi non ha inviato riceve l''alert"
    },
    {
      "key": "orario_riepilogo",
      "label": "Orario invio riepilogo al titolare",
      "type": "time",
      "required": true,
      "default": "19:00",
      "hint": "A che ora al massimo viene inviato il riepilogo, anche se mancano report"
    },
    {
      "key": "operai",
      "label": "Lista operai (nome e numero)",
      "type": "textarea",
      "required": true,
      "placeholder": "Mario Rossi — +39 333 1234567\nLuca Bianchi — +39 347 9876543",
      "hint": "Un operaio per riga, nome e numero WhatsApp/Telegram"
    }
  ]'::jsonb

) ON CONFLICT (slug) DO UPDATE SET
  name                  = EXCLUDED.name,
  description           = EXCLUDED.description,
  category              = EXCLUDED.category,
  icon                  = EXCLUDED.icon,
  channel               = EXCLUDED.channel,
  difficulty            = EXCLUDED.difficulty,
  estimated_setup_min   = EXCLUDED.estimated_setup_min,
  is_published          = EXCLUDED.is_published,
  is_featured           = EXCLUDED.is_featured,
  prompt_template       = EXCLUDED.prompt_template,
  first_message_template = EXCLUDED.first_message_template,
  config_schema         = EXCLUDED.config_schema;
