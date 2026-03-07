

# Verifica Completezza: Documento vs Stato Attuale

Analisi sistematica di cosa è presente e cosa manca rispetto al documento "VERSIONE MASTER DEFINITIVA".

---

## ✅ GIÀ IMPLEMENTATO

### Database
| Tabella | Stato |
|---------|-------|
| companies | ✅ Esiste |
| profiles | ✅ Esiste |
| user_roles | ✅ Esiste (con enum app_role) |
| platform_config | ✅ Esiste |
| agents | ✅ Esiste (ma schema diverso dal doc — vedi gap) |
| ai_credits | ✅ Esiste |
| ai_credit_packages | ✅ Esiste (con seed) |
| ai_credit_purchases | ✅ Esiste |
| ai_audit_log | ✅ Esiste |
| contacts | ✅ Esiste |
| contact_lists | ✅ Esiste |
| contact_list_members | ✅ Esiste |
| campaigns | ✅ Esiste |
| conversations | ✅ Esiste |
| notes | ✅ Esiste |
| webhooks / webhook_logs | ✅ Esiste |
| knowledge_base_files | ✅ Esiste |

### Edge Functions
| Funzione | Stato |
|----------|-------|
| platform-config | ✅ (GET config, test_api_key, update_config) |
| create-elevenlabs-agent | ✅ (usa ELEVENLABS_API_KEY centralizzato) |
| update-agent | ✅ |
| elevenlabs-tts | ✅ |
| elevenlabs-conversation-token | ✅ |
| get-elevenlabs-voices | ✅ |
| create-company | ✅ |
| dispatch-webhook | ✅ |

### Pagine/Route
| Pagina | Stato |
|--------|-------|
| /login | ✅ |
| /superadmin | ✅ Dashboard |
| /superadmin/companies | ✅ |
| /superadmin/companies/new | ✅ |
| /superadmin/companies/:id | ✅ |
| /superadmin/team | ✅ |
| /superadmin/platform-settings | ✅ (4 tab: API, LLM, Markup, Pacchetti) |
| /app (dashboard) | ✅ |
| /app/agents | ✅ |
| /app/agents/new | ✅ (wizard 5 step) |
| /app/agents/:id | ✅ (editor con tab) |
| /app/conversations | ✅ |
| /app/contacts | ✅ |
| /app/contacts/import | ✅ |
| /app/lists | ✅ |
| /app/campaigns | ✅ |
| /app/campaigns/new | ✅ |
| /app/settings | ✅ |

### Sidebar
- ✅ SuperAdmin nav con "Impostazioni Piattaforma"
- ✅ Company nav con sezioni principali

---

## ❌ MANCANTE — Da Implementare

### 1. DATABASE — Tabelle Mancanti

| Tabella | Descrizione |
|---------|-------------|
| **ai_agents** (nuova) | Il doc richiede `ai_agents` con ~30 colonne specifiche (voice_stability, voice_similarity, tts_model, llm_model, llm_temperature, llm_max_tokens, llm_backup_enabled, additional_languages[], post_call_summary, etc.). L'attuale `agents` ha schema diverso e meno campi. |
| **ai_knowledge_docs** | KB docs con el_doc_id, type (url/file/text), source_url, content_preview, size_bytes, status (processing/ready/error), created_by. Diverso dal semplice `knowledge_base_files` esistente. |
| **ai_phone_numbers** | Numeri telefono con el_phone_id, provider, country_code, active_hours, out_of_hours_msg, monthly_cost, voicemail_enabled. **Completamente mancante.** |
| **ai_conversations** | Conversazioni con minutes_billed, collected_data, appointment_created, lead_created, eval_score, eval_notes. L'attuale `conversations` manca molti di questi campi. |
| **ai_agent_workflows** | Workflow canvas (nodes JSONB, edges JSONB). **Completamente mancante.** |
| **ai_agent_tools** | Tool personalizzati per agente (type: native_crm/native_calendar/custom_api/mcp). **Completamente mancante.** |

### 2. Schema `agents` vs `ai_agents`
Il documento richiede `ai_agents` con colonne dedicate per voice settings, LLM config, backup LLM, TTS model, etc. L'attuale `agents` usa un campo `config` JSONB generico. Occorre decidere se:
- A) Migrare `agents` → aggiungere colonne mancanti
- B) Creare `ai_agents` separata e migrare i dati

### 3. PAGINE MANCANTI

| Pagina | Descrizione |
|--------|-------------|
| **/app/knowledge-base** | KB globale workspace (condivisa tra agenti). Completamente mancante. |
| **/app/phone-numbers** | Lista numeri telefono acquistati. Completamente mancante. |
| **/app/phone-numbers/buy** | Wizard acquisto numero (3 step: paese, numero, agente). Mancante. |
| **/app/credits** | Crediti & Utilizzo (barra consumo, pacchetti, storico, chart per agente). Mancante. |
| **/app/contacts/:id** | Scheda contatto singola. Mancante. |

### 4. EDITOR AGENTE — Tab Mancanti
L'attuale AgentDetail ha alcune tab, ma il documento ne richiede 8:

| Tab | Stato |
|-----|-------|
| Agente (prompt, voce, LLM) | ⚠️ Parziale — manca TTS model selector, backup LLM, post_call_summary, voicemail detection |
| Workflow (canvas nodi) | ❌ Completamente mancante |
| Knowledge Base (per agente) | ⚠️ Parziale |
| Analisi (conversazioni) | ⚠️ Parziale — manca eval_score, collected_data, criteri valutazione |
| Strumenti (nativi + custom + sistema) | ❌ Completamente mancante |
| Test (live con @elevenlabs/react) | ⚠️ Parziale — manca modalità testo |
| Widget (embed code) | ❌ Completamente mancante |
| Avanzato (timeout, rate limit, errori) | ❌ Completamente mancante |

### 5. WIZARD AGENTE — Differenze
Il doc richiede 4 step, l'attuale ne ha 5. Struttura doc:
- Step 1: Tipo & Caso d'Uso (vocale/operativo + 7 use case)
- Step 2: Identità & Voce (nome, settore, voce, TTS model, expressiveness)
- Step 3: Comportamento & Prompt (prompt, LLM, temperatura, silenzio, interruzione, durata, post-call summary)
- Step 4: Numero & Pubblicazione (collega numero telefono + pubblica/bozza)

### 6. SIDEBAR — Voci Mancanti (Company)
Il doc richiede queste sezioni nella sidebar company:

| Voce | Stato |
|------|-------|
| Numeri di Telefono | ❌ |
| Knowledge Base (globale) | ❌ |
| Crediti (con badge min rimanenti) | ❌ |

### 7. EDGE FUNCTIONS MANCANTI

| Funzione | Scopo |
|----------|-------|
| elevenlabs-proxy | Proxy generico sicuro per tutte le API EL |
| elevenlabs-webhook | Riceve eventi post-conversazione, aggiorna DB, triggera integrazioni CRM |
| add-knowledge-doc | Aggiunge doc alla KB (URL scraping, file upload, testo) |
| get-available-numbers | Fetch numeri disponibili da Twilio/EL |
| purchase-number | Acquista numero |
| purchase-credits | Acquista pacchetto crediti |

### 8. DESIGN SYSTEM — Differenze Minori
- Il doc specifica `el_default_llm: 'gemini-2.5-flash'`, il DB ha `'gemini-2.0-flash'`
- Il doc specifica `cost_per_min_real: 0.05`, il DB ha `0.07`
- `platform_config.cost_per_min_billed` nel doc non è GENERATED ALWAYS AS, nel DB sì

### 9. INTEGRAZIONI CRM/CALENDARIO
Il doc richiede tool nativi edilizia.io:
- create_lead() → INSERT contacts
- create_appointment() → calendario
- update_lead_status() → UPDATE contacts.status
- search_knowledge() → cerca KB
- transfer_call() → trasferisci a umano

Nessuna di queste è implementata.

---

## PRIORITÀ DI IMPLEMENTAZIONE SUGGERITA

1. **DB: Allineare schema** — Aggiungere colonne mancanti a `agents` e `conversations`, creare `ai_phone_numbers`, `ai_agent_workflows`, `ai_agent_tools`, `ai_knowledge_docs`
2. **Pagine nuove** — /app/credits, /app/phone-numbers, /app/knowledge-base, /app/contacts/:id
3. **Sidebar aggiornata** — Aggiungere voci mancanti (Numeri, KB, Crediti)
4. **Editor Agente completo** — Tab Workflow, Strumenti, Widget, Avanzato
5. **Wizard 4 step** — Riallineare al doc (aggiungere Step 4 numero/pubblicazione)
6. **Edge functions** — elevenlabs-webhook, purchase-credits, add-knowledge-doc
7. **Integrazioni CRM** — Tool nativi

Data la complessità (~15+ file nuovi, 5+ migrazioni, 6+ edge functions), suggerisco di procedere per blocchi. Il primo blocco sarebbe: **migration DB per allineare lo schema + pagina Crediti & Utilizzo + sidebar aggiornata**.

