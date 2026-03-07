
# Stato Implementazione — Blocco 1-5 Completato

## ✅ Completato in questo blocco

### Database Migration
- Aggiunto 17 colonne ad `agents` (voice_stability, tts_model, llm_model, llm_backup_enabled, post_call_summary, voicemail_detection, etc.)
- Aggiunto 6 colonne a `conversations` (minutes_billed, collected_data, eval_score, eval_notes, etc.)
- Creato tabelle: ai_phone_numbers, ai_knowledge_docs, ai_agent_workflows, ai_agent_tools
- RLS policies per tutte le nuove tabelle

## ✅ Blocco 2 — Sistema Crediti Euro-based

### Database
- platform_pricing (8 combo LLM+TTS con costi reali/fatturati)
- ai_credit_topups (ricariche manual/auto/promo/adjustment)
- ai_credit_usage (consumo per conversazione con margini)
- ai_credits: +12 colonne euro (balance_eur, auto_recharge, calls_blocked, etc.)
- monthly_billing_summary view (security_invoker)

### Edge Functions
- check-credits-before-call: verifica saldo pre-chiamata
- topup-credits: ricarica manuale con fattura
- elevenlabs-webhook: post-call billing, auto-recharge, blocco
- platform-config: +apply_global_markup action

### Frontend
- Credits page: saldo euro, ricarica manuale €10/20/50/100, auto-recharge toggle, utilizzo per agente, storico
- PlatformSettings: tab Prezzi & Markup con tabella pricing editabile
- Sidebar: footer saldo crediti con barra e alert
- VoiceTestPanel: check crediti pre-chiamata con blocco UI

## ✅ Blocco 3-5 — Agent Templates System

### Database
- agent_templates + agent_template_instances + agent_reports + company_channels
- RLS policies PERMISSIVE (fix da RESTRICTIVE)
- Funzione DB `increment_installs_count(tpl_id UUID)`
- Seed template "Reportistica Serale Cantiere" con n8n_workflow_json completo

### Edge Functions (CORS headers completi)
- deploy-template-instance: crea agente ElevenLabs + workflow n8n + audit log
- generate-report: estrae dati strutturati da trascrizione + genera HTML/summary
- save-report: salva report in DB + aggiorna contatori istanza

### Frontend — Wizard 5 Step (TemplateSetup.tsx)
- Step 1 Personalizza: form dinamico da config_schema, anteprima messaggio live
- Step 2 Operai: lista card + **importa CSV** con template scaricabile
- Step 3 Manager: canali multi-checkbox + **anteprima email mockup HTML**
- Step 4 Canali: WA status check + Telegram con **salvataggio in company_channels** + link condivisione bot
- Step 5 Attiva: riepilogo 4 card + **stima costi giornaliera/mensile** + **crediti disponibili** + **4 deploy steps visibili** (config, ElevenLabs, n8n, scheduling) + salva bozza

### SuperAdmin
- /superadmin/templates: CRUD completo con JSON editor per config_schema
- **Link "Template Agenti" aggiunto alla sidebar superadmin**

## 🔜 Prossimi Blocchi
- Pagine: /app/phone-numbers, /app/knowledge-base
- Editor Agente 8 tab
- Wizard 4 step (CreateAgent)
- SuperAdmin Dashboard economics
- Edge functions: add-knowledge-doc
- Integrazioni CRM native
- Configurazione N8N_BASE_URL e N8N_API_KEY come secrets
