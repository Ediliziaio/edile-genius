
-- Update the seed template with n8n_workflow_json base structure
UPDATE public.agent_templates 
SET n8n_workflow_json = '{
  "name": "[edilizia.io] {{NOME_AZIENDA}} — Reportistica Serale",
  "active": false,
  "tags": ["edilizia.io", "reportistica"],
  "nodes": [
    {
      "id": "trigger_schedule",
      "name": "Ogni Sera",
      "type": "n8n-nodes-base.scheduleTrigger",
      "position": [250, 300],
      "parameters": {
        "rule": {
          "interval": [{"field": "cronExpression", "expression": "30 17 * * 1,2,3,4,5,6"}]
        }
      }
    },
    {
      "id": "split_responders",
      "name": "Per ogni operaio",
      "type": "n8n-nodes-base.splitInBatches",
      "position": [450, 300],
      "parameters": {
        "batchSize": 1,
        "options": {"reset": false}
      }
    },
    {
      "id": "set_responder_data",
      "name": "Dati operaio",
      "type": "n8n-nodes-base.set",
      "position": [650, 300],
      "parameters": {
        "values": {
          "string": [
            {"name": "operaio_nome", "value": "={{ $json.name }}"},
            {"name": "operaio_phone", "value": "={{ $json.phone }}"},
            {"name": "operaio_cantiere", "value": "={{ $json.cantiere }}"},
            {"name": "data_oggi", "value": "={{ new Date().toLocaleDateString(\"it-IT\") }}"}
          ]
        }
      }
    },
    {
      "id": "send_whatsapp",
      "name": "Invia WhatsApp",
      "type": "n8n-nodes-base.twilio",
      "position": [850, 200],
      "parameters": {
        "operation": "send",
        "from": "whatsapp:{{WHATSAPP_NUMBER}}",
        "to": "=whatsapp:{{ $json.operaio_phone }}",
        "message": "=Buonasera {{ $json.operaio_nome }} 👷\nReport serale {{ $json.operaio_cantiere }}.\n2 minuti. Pronto?"
      }
    },
    {
      "id": "send_telegram",
      "name": "Invia Telegram",
      "type": "n8n-nodes-base.telegram",
      "position": [850, 400],
      "parameters": {
        "operation": "sendMessage",
        "chatId": "={{ $json.operaio_phone }}",
        "text": "=Buonasera {{ $json.operaio_nome }} 👷\nReport serale {{ $json.operaio_cantiere }}.\n2 minuti. Pronto?"
      }
    },
    {
      "id": "webhook_receive",
      "name": "Ricevi dati conversazione",
      "type": "n8n-nodes-base.webhook",
      "position": [1050, 300],
      "parameters": {
        "path": "report-serale/{{INSTANCE_ID}}",
        "httpMethod": "POST",
        "responseMode": "onReceived"
      }
    },
    {
      "id": "wait_response",
      "name": "Attendi risposta operaio",
      "type": "n8n-nodes-base.wait",
      "position": [1050, 150],
      "parameters": {
        "amount": 30,
        "unit": "minutes",
        "resume": "webhook"
      }
    },
    {
      "id": "generate_report",
      "name": "Genera Report",
      "type": "n8n-nodes-base.httpRequest",
      "position": [1450, 200],
      "parameters": {
        "method": "POST",
        "url": "{{SUPABASE_URL}}/functions/v1/generate-report",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [{"name": "Authorization", "value": "=Bearer {{ $env.SUPABASE_ANON_KEY }}"}]
        },
        "sendBody": true,
        "bodyParameters": {
          "parameters": [
            {"name": "instanceId", "value": "{{INSTANCE_ID}}"},
            {"name": "conversationData", "value": "={{ JSON.stringify($json) }}"},
            {"name": "operaio", "value": "={{ $json.operaio_nome }}"},
            {"name": "cantiere", "value": "={{ $json.operaio_cantiere }}"},
            {"name": "dataOggi", "value": "={{ $json.data_oggi }}"}
          ]
        }
      }
    },
    {
      "id": "send_report_email",
      "name": "Invia report via Email",
      "type": "n8n-nodes-base.emailSend",
      "position": [1650, 100],
      "parameters": {
        "subject": "=📋 Report Cantiere {{ $json.cantiere }} — {{ $json.data }}",
        "emailFormat": "html",
        "message": "={{ $json.report_html }}"
      }
    },
    {
      "id": "save_report",
      "name": "Salva report su Supabase",
      "type": "n8n-nodes-base.httpRequest",
      "position": [1850, 200],
      "parameters": {
        "method": "POST",
        "url": "{{SUPABASE_URL}}/functions/v1/save-report",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [{"name": "Authorization", "value": "=Bearer {{ $env.SUPABASE_ANON_KEY }}"}]
        },
        "sendBody": true,
        "bodyParameters": {
          "parameters": [
            {"name": "instanceId", "value": "{{INSTANCE_ID}}"},
            {"name": "companyId", "value": "{{COMPANY_ID}}"},
            {"name": "reportData", "value": "={{ JSON.stringify($json) }}"}
          ]
        }
      }
    }
  ],
  "connections": {
    "trigger_schedule": {"main": [[{"node": "split_responders"}]]},
    "split_responders": {"main": [[{"node": "set_responder_data"}]]},
    "set_responder_data": {"main": [[{"node": "send_whatsapp"}, {"node": "send_telegram"}]]},
    "webhook_receive": {"main": [[{"node": "generate_report"}]]},
    "generate_report": {"main": [[{"node": "send_report_email"}, {"node": "save_report"}]]}
  }
}'::jsonb
WHERE slug = 'report-serale-cantiere';
