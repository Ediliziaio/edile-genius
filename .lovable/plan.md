
# Stato Implementazione — Blocco 1 Completato

## ✅ Completato in questo blocco

### DB Migration
- Aggiunte 17 colonne a `agents` (voice_stability, voice_similarity, voice_speed, tts_model, llm_model, llm_temperature, llm_max_tokens, llm_backup_enabled, llm_backup_model, additional_languages, post_call_summary, post_call_prompt, voicemail_detection, voicemail_message, evaluation_criteria, webhook_url, phone_number_id)
- Aggiunte 6 colonne a `conversations` (minutes_billed, collected_data, appointment_created, lead_created, eval_score, eval_notes)
- Creata tabella `ai_phone_numbers` con RLS
- Creata tabella `ai_knowledge_docs` con RLS
- Creata tabella `ai_agent_workflows` con RLS
- Creata tabella `ai_agent_tools` con RLS

### Pagina Crediti & Utilizzo (/app/credits)
- 4 KPI cards (acquistati, utilizzati, riservati, disponibili)
- Progress bar consumo
- Tab Pacchetti con cards acquistabili
- Tab Storico Acquisti con tabella
- Tab Utilizzo per Agente con grafico a barre

### Sidebar Aggiornata
- Aggiunta sezione "RISORSE" con: Numeri di Telefono, Knowledge Base, Crediti & Utilizzo

## ❌ Ancora da implementare

### Prossimi blocchi
1. **Pagine placeholder** — /app/phone-numbers, /app/knowledge-base
2. **Editor Agente completo** — Tab Workflow, Strumenti, Widget, Avanzato
3. **Wizard 4 step** — Riallineare al documento
4. **Edge functions** — elevenlabs-webhook, purchase-credits, add-knowledge-doc
5. **Integrazioni CRM** — Tool nativi
