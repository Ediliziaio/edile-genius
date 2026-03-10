

## Piano: Integrazione ElevenLabs Completa al 100%

Questo è un intervento molto ampio che tocca DB, 6+ Edge Functions e 8+ componenti frontend. Lo suddivido in fasi ordinate per dipendenza.

---

### FASE 1 — Migrazione Database

Una singola migration SQL che:

- **agents**: aggiunge `el_phone_number_id`, `asr_quality`, `asr_keywords`, `vad_enabled`, `silence_end_call_timeout`, `speculative_turn`, `evaluation_prompt`, `post_call_webhook_url`, `dynamic_variables`, `built_in_tools`, `transfer_number`, `monitoring_enabled`, `outbound_enabled`, `el_webhook_secret`. I campi `tts_model`, `llm_model`, `llm_backup_model`, `evaluation_criteria`, `pii_redaction`, `blocked_topics` esistono già.
- **conversations**: aggiunge `cost_billed_eur`. I campi `el_conv_id`, `collected_data`, `eval_score`, `eval_notes`, `minutes_billed`, `caller_number`, `call_direction` esistono già (verificato dallo schema).
- **ai_phone_numbers**: aggiunge `el_phone_number_id`, `twilio_sid`, `provider_type`, `inbound_enabled`, `outbound_enabled`.
- **ai_knowledge_docs**: aggiunge `el_sync_status`, `el_sync_at`. Il campo `el_doc_id` esiste già.
- **Nuova tabella `outbound_call_log`** con RLS company + superadmin.

---

### FASE 2 — Edge Functions (6 funzioni)

**2A. Riscrittura `create-elevenlabs-agent`**
- Invio configurazione completa a ElevenLabs: agent prompt con built-in tools (end_call, transfer, voicemail), TTS model/settings, turn detection (timeout, eagerness, silence_end_call_timeout, speculative_turn), ASR (quality, keywords), conversation (max_duration, monitoring), safety (PII, blocked_topics), evaluation criteria, dynamic variables.
- Salvataggio in DB di tutti i nuovi campi diretti (non solo in `config` JSONB).

**2B. Aggiornamento `update-agent`**
- Estendere `allowedFields` con tutti i nuovi campi DB diretti.
- Sync a ElevenLabs: aggiungere sezioni ASR, turn (silence_end_call_timeout, speculative_turn), safety, evaluation, built_in_tools nel body PATCH.

**2C. Aggiornamento `elevenlabs-webhook`**
- Aggiungere verifica HMAC-SHA256 della firma ElevenLabs.
- Estrarre `collected_data`, `eval_score`, `eval_notes`, `cost_billed_eur` dall'evento.
- Gestire evento `conversation.started` con upsert in `conversations`.

**2D. Nuova `elevenlabs-outbound-call`**
- Verifica crediti, verifica `outbound_enabled` e `el_phone_number_id`.
- Chiama `POST /v1/convai/twilio/outbound-call`.
- Log in `outbound_call_log`.

**2E. Nuova `elevenlabs-import-phone-number`**
- Riceve credenziali Twilio + numero, chiama `POST /v1/convai/phone-numbers` su ElevenLabs.
- Salva in `ai_phone_numbers` con `el_phone_number_id`.
- Aggiorna `agents.el_phone_number_id` se associato.

**2F. Aggiornamento `add-knowledge-doc`**
- Download file da storage e upload come multipart a ElevenLabs.
- Aggiornare `el_sync_status` e `el_sync_at`.

**2G. Aggiornamento `get-elevenlabs-voices`**
- Arricchire risposta con `category`, `description`, `gender`, `accent`, `age`, `use_case`, `supported_languages`.

Registrare le nuove funzioni in `supabase/config.toml`.

---

### FASE 3 — Frontend

**3A. BuyPhoneNumber — Flusso Twilio reale (4 step)**
- Step 1: "Hai già un numero Twilio?" con CTA per creare account Twilio.
- Step 2: Form credenziali (phone_number E.164, label, Twilio SID, Auth Token con toggle visibilità). Info box "dati non salvati".
- Step 3: Configurazione post-importazione (associa agente, inbound/outbound toggle, orari, giorni).
- Step 4: Conferma con riepilogo e CTA.

**3B. AgentConfigForm — Nuovi campi avanzati**
- Estendere `AgentConfigData` con: `tts_model`, `llm_backup_model`, `asr_quality`, `asr_keywords`, `silence_end_call_timeout`, `speculative_turn`, `evaluation_prompt`, `dynamic_variables`, `built_in_tools`, `transfer_number`, `monitoring_enabled`, `pii_redaction`, `blocked_topics`.
- Aggiungere selettore TTS Model accanto a LLM Model.
- 3 nuove sezioni collapsible in "Avanzate": ASR, Strumenti Integrati, Sicurezza & Valutazione.

**3C. AgentDetail — Aggiornamenti**
- Estendere `ConfigState` e `buildConfigState` con tutti i nuovi campi.
- Aggiungere tab "Chiamate Uscenti" (se `outbound_enabled`).
- Nella tab Conversazioni: colonna eval_score con badge colorato; nel dettaglio mostrare collected_data e eval_notes.

**3D. Nuovo componente `AgentOutboundTab`**
- Toggle abilitazione outbound.
- Form chiamata singola (numero + variabili dinamiche) → chiama `elevenlabs-outbound-call`.
- Lista ultime chiamate da `outbound_call_log`.

**3E. AgentIntegrationTab — Webhook info**
- Sezione "Webhook Post-Chiamata" con URL del nostro webhook copiabile.
- Campo webhook aziendale custom con salvataggio.

**3F. VoicePickerEnhanced — Filtri avanzati**
- Dropdown genere, lingua, categoria oltre alla ricerca testo.
- Badge categoria/genere/lingua/use_case per ogni voce.

**3G. CreateAgent.types.ts — Nuovi campi**
- Aggiungere `tts_model`, `llm_backup_model`, `asr_quality`, `asr_keywords`, `silence_end_call_timeout`, `speculative_turn`, `evaluation_prompt`, `dynamic_variables`, `built_in_tools`, `transfer_number`, `monitoring_enabled`, `outbound_enabled`.

**3H. PlatformSettings — Tab ElevenLabs potenziato**
- La tab ElevenLabs esistente è già funzionale. Aggiungere sezione "Webhook Secret" con campo per `ELEVENLABS_WEBHOOK_SECRET` e istruzioni di registrazione.

---

### Secret da aggiungere

- `ELEVENLABS_WEBHOOK_SECRET` — da richiedere all'utente dopo il deploy del webhook.

---

### Note

- L'ordine di implementazione sarà: Migration → Edge Functions → Frontend.
- I campi già esistenti nello schema DB verranno saltati nella migration (`ADD COLUMN IF NOT EXISTS`).
- Il `config` JSONB resta come backup, ma i campi importanti vengono ora salvati come colonne dirette per query e filtraggio.

