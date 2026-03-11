
# Stato Implementazione — Blocco 1-5 + Render AI + Preventivi Pro

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
- Estensione `preventivi` con +26 colonne (template_id, versione, titolo, foto_sopralluogo_urls, foto_copertina_url, sconto_globale, imponibile, iva_importo, totale_finale, condizioni, clausole, intro, firma_testo, tempi_esecuzione, validita_giorni, data_scadenza, tracking_aperto_at/count, link_accettazione, firma_cliente_url, accettato_at, rifiutato_at, rifiuto_motivo, parent_id, inviato_at, inviato_via, cliente_piva, cliente_codice_fiscale)
- Sequenza `preventivo_seq` per numerazione PV-YYYY-NNN
- Storage buckets: preventivi-media (privato), template-assets (pubblico)
- RLS company-scoped + superadmin

### Edge Functions
- `process-preventivo-audio` RISCRITTO: prompt GPT esperto (prezzario DEI, categorie edilizie, sconti), nuovo formato voci con id/ordine/categoria/titolo_voce/sconto_percentuale/foto_urls/note_voce/evidenziata, calcolo totali con sconto e IVA, data_scadenza automatica

### PDF Client-side (@react-pdf/renderer)
- `src/lib/preventivo-pdf.tsx`: template PDF professionale A4 con:
  - Header azienda + logo
  - Band titolo colorata (colore_primario)
  - Grid cliente/riferimenti
  - Testo intro
  - Foto copertina
  - Tabella voci per categoria con subtotali
  - Totali con sconto globale + IVA
  - Note, condizioni, clausole
  - Sezione firma doppia (azienda + cliente)
  - Footer pagina

### Frontend
- **NuovoPreventivo.tsx** → Wizard 3 step:
  - Step 1: dati cliente (nome, indirizzo, telefono, email, P.IVA, CF) + titolo/oggetto + cantiere
  - Step 2: registrazione/upload audio + upload foto multiplo con grid preview e badge copertina
  - Step 3: editor visuale voci per categoria (card editabili con titolo, descrizione, U.M., quantità, prezzo, sconto, totale) + totali live + scarica PDF anteprima
- **PreventivoDetail.tsx** → 3 tabs:
  - Dettaglio: voci per categoria con badge sconto, trascrizione collapsible, note/stato/tempi
  - Cronologia: timeline eventi (creato, inviato, accettato/rifiutato)
  - Tracking: KPI aperture, ultima apertura, ultimo invio
  - Azioni: scarica PDF, modifica, elimina
- **PreventiviList.tsx** → KPI cards (totale, bozze, in attesa, valore accettati) + filtri tab per stato + ricerca + lista con badge versione e scadenza
- **TemplatePreventivo.tsx** (`/app/impostazioni/template-preventivo`): 3 tabs:
  - Branding: logo upload, color picker primario/secondario con preview gradient, intestazione/piè di pagina
  - Testi Standard: intro, condizioni, clausole, firma, validità giorni, IVA default
  - Layout: 5 toggle (foto copertina, foto voci, subtotali categoria, firma, condizioni)

### Navigazione
- Sidebar: aggiunto "Template PDF" nella sezione AUTOMAZIONI
- Route: `/app/impostazioni/template-preventivo`

## 🔜 Prossimi Blocchi
- SuperAdmin Dashboard economics
- Integrazioni CRM native
- Configurazione N8N_BASE_URL e N8N_API_KEY come secrets
