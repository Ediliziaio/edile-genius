
# Stato Implementazione — Blocco 1-5 + Render AI + Preventivi Pro + AI Avanzata

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
- Step 2 Operai: lista card + importa CSV con template scaricabile
- Step 3 Manager: canali multi-checkbox + anteprima email mockup HTML
- Step 4 Canali: WA status check + Telegram con salvataggio in company_channels + link condivisione bot
- Step 5 Attiva: riepilogo 4 card + stima costi giornaliera/mensile + crediti disponibili + 4 deploy steps visibili + salva bozza

### SuperAdmin
- /superadmin/templates: CRUD completo con JSON editor per config_schema

## ✅ Blocco 6 — Modulo Render AI (Visualizzatore Infissi)

### Database (5 tabelle)
- render_provider_config, render_infissi_presets, render_sessions, render_gallery, render_credits
- RLS PERMISSIVE per tutte le tabelle
- Trigger set_updated_at + init_render_credits su companies
- Funzione deduct_render_credit
- Storage buckets: render-originals (privato), render-results (pubblico)

### Edge Functions
- generate-render: auth + crediti + AI gateway (Gemini Flash Image) + storage + audit log
- analyze-window-photo: analisi AI della foto (tipo finestra, materiale, dimensioni, stile)

### Frontend
- RenderHub, RenderNew, RenderGallery, RenderGalleryDetail
- RenderConfig (/superadmin/render-config)
- BeforeAfterSlider, promptBuilder.ts

## ✅ Blocco 7 — Preventivi Professionali (Audio + Foto → PDF Branded)

### Database
- Nuova tabella `preventivo_templates` (branding, colori, testi standard, layout toggles)
- Estensione `preventivi` con +26 colonne
- Sequenza `preventivo_seq` per numerazione PV-YYYY-NNN
- Storage buckets: preventivi-media (privato), template-assets (pubblico)
- RLS company-scoped + superadmin

### Edge Functions
- `process-preventivo-audio` RISCRITTO

### PDF Client-side (@react-pdf/renderer)
- `src/lib/preventivo-pdf.tsx`: template PDF professionale A4

### Frontend
- NuovoPreventivo.tsx, PreventivoDetail.tsx, PreventiviList.tsx, TemplatePreventivo.tsx

## ✅ Blocco 8 — AI Avanzata P1 (Smart Actions + Lead Score + Timeline)

### Smart Actions Engine (Dashboard)
- Espanso da 3 regole hardcoded a 10+ regole basate su dati reali:
  - Crediti in esaurimento (danger)
  - Agenti in bozza (warning)
  - Agenti senza numero telefono (warning)
  - Agenti inattivi >7 giorni (info)
  - Contatti da richiamare con next_call_at scaduto (warning)
  - Preventivi in bozza da >7 giorni (warning)
  - Preventivi inviati senza risposta da >10 giorni (warning)
  - Documenti in scadenza entro 15 giorni (warning)
  - Campagne con tasso appuntamenti <5% (info)
- Query Supabase dedicate per ogni regola
- Stato "Tutto in ordine" quando nessuna azione è necessaria
- Mostra summary delle conversazioni recenti nella tabella attività

### Lead Score Automatico
- `src/lib/lead-score.ts`: motore di scoring 0-100 senza LLM
  - +30 outcome qualified/appointment
  - +20 sentiment positivo
  - +15 preventivo associato
  - +10 contatto completo (tel+email)
  - +10 callback attempts
  - +5 fonte inbound
  - -10 inattivo >30 giorni
  - -20 not_interested
  - -30 do_not_call/invalid
- `src/components/contacts/LeadScoreBadge.tsx`: badge con tooltip fattori
  - Compact mode per tabella (emoji + score numerico)
  - Full mode per scheda contatto (con lista fattori)
  - Colori: 🔴 Caldo (>60), 🟠 Tiepido (30-60), 🔵 Freddo (<30)
- Badge integrato nella tabella contatti (nuova colonna "Score")
- Badge integrato nell'header della scheda contatto

### Timeline Unificata del Contatto
- `ContactDetailPanel.tsx` completamente refactorato:
  - Tab "Timeline" come default (al posto di "Info")
  - Cronologia verticale con linea e pallini colorati per tipo:
    - 🔵 Conversazioni (con summary, outcome, sentiment, durata)
    - 🟡 Note manuali
    - 🟢 Preventivi collegati (stato, importo, numero)
    - ⚪ Eventi (contatto creato)
  - Query preventivi per nome/telefono contatto
  - Lead Score full display nell'header della scheda

## ✅ Blocco 8 — P1-C: Call Summary Automatico

### Backend
- `supabase/functions/elevenlabs-webhook/summary.ts`: modulo separato per generazione summary
  - Chiama OpenAI gpt-4o-mini con prompt minimale in italiano
  - Non-blocking: se OPENAI_API_KEY non è configurata, salta silenziosamente
  - Cap transcript a 6000 chars per contenere i costi (~$0.001/call)
- `elevenlabs-webhook/index.ts`: importa e chiama `generateCallSummary()` dopo step 7
  - Popola `conversations.summary` solo se la generazione ha successo

### Frontend (già predisposto)
- Dashboard "Attività recente": mostra `c.summary` sotto il nome agente
- Conversazioni: mostra summary nella tabella e nel dialog dettaglio
- Timeline contatto: mostra summary nelle conversazioni

### Requisito SuperAdmin
- Aggiungere OPENAI_API_KEY come Supabase Secret (da configurare via SuperAdmin)

## ✅ Blocco 9 — Audit Finale & Hardening

### Sicurezza Edge Functions
- Validazione JWT (getClaims) aggiunta a: generate-render, crm-sync, deploy-template-instance, process-preventivo-audio, generate-preventivo-pdf
- Verifica tenant (company_id cross-check) aggiunta a tutte le funzioni interne
- Funzioni webhook esterne (elevenlabs-webhook, whatsapp-webhook, telegram-cantiere-webhook) lasciate senza JWT (corretto)

### Atomicità Crediti
- Creata RPC `topup_credits(_company_id, _amount_eur)` con UPDATE atomico
- topup-credits edge function refactorato per usare RPC

### UX — Progressive Disclosure Sidebar
- Sezioni OPERATIVITÀ e STRUMENTI AI visibili solo se il settore è rilevante o se esistono dati
- Campi vuoti nelle conversazioni nascosti (eval_score, minutes_billed, cost_billed_eur)

### UX — Dead-End Fix
- Card CRM e Webhooks in Integrazioni: badge "Prossimamente" + bottoni disabilitati

### Signup Self-Service
- Pagina /signup con form registrazione
- Edge function self-service-signup: crea company (trial 14gg) + profilo + ruolo company_admin

### AI Avanzata P2
- Follow-up Generator: edge function generate-followup (GPT-4o-mini) + bottone in ContactDetailPanel
- Opportunity Recovery: Smart Actions per lead qualificati dormenti >5 giorni
- Campi conversazione vuoti nascosti per UX più pulita

## 🔜 Prossimi Step

### P2 — Importante dopo
- Motivo principale (estrarre dal transcript motivo interesse/rifiuto)
- Campagne outbound end-to-end (schedulazione batch, retry automatico)

### P3 — Avanzato / successivo
- Personalizzazione regole Smart Actions per admin
- Report settimanale automatico via email al titolare
- Trend predittivo su tasso conversione
- Integrazione Stripe per pagamenti reali
