

# Piano: Database + Configurazione Piattaforma SuperAdmin

## Obiettivo
Creare le nuove tabelle database richieste dal documento e implementare la pagina **Impostazioni Piattaforma SuperAdmin** (`/superadmin/platform-settings`) con gestione centralizzata della API key ElevenLabs, configurazione LLM, markup crediti e pacchetti.

## Situazione Attuale
- La API key ElevenLabs è nel Supabase Secret `ELEVENLABS_API_KEY` e le edge functions la leggono da lì o da `companies.el_api_key`
- Non esiste `platform_config` — la configurazione è sparpagliata
- Non esistono le tabelle: `ai_credits`, `ai_credit_packages`, `ai_credit_purchases`, `ai_phone_numbers`, `ai_knowledge_docs`, `ai_conversations`, `ai_agent_workflows`, `ai_agent_tools`, `ai_audit_log`
- La pagina `/superadmin/settings` è un placeholder vuoto

## Database Migration

Nuove tabelle da creare:

1. **`platform_config`** — 1 riga, solo superadmin: `el_api_key_configured`, `el_api_key_tested_at`, `el_default_llm`, `el_default_voice_id`, `credit_markup`, `cost_per_min_real`, `cost_per_min_billed`, `updated_at`, `updated_by`

2. **`ai_credits`** — crediti per azienda: `company_id` (unique), `minutes_purchased`, `minutes_used`, `minutes_reserved`, `alert_threshold_pct`, `alert_email_sent_at`

3. **`ai_credit_packages`** — pacchetti acquistabili: `name`, `minutes`, `price_eur`, `price_per_min` (generated), `badge`, `is_active`, `sort_order` + seed 4 pacchetti default

4. **`ai_credit_purchases`** — storico acquisti: `company_id`, `minutes_added`, `amount_eur`, `cost_per_min`, `payment_ref`, `purchased_by`, `purchased_at`

5. **`ai_audit_log`** — log azioni: `company_id`, `user_id`, `action`, `entity_type`, `entity_id`, `details`, `ip_address`, `created_at`

RLS policies:
- `platform_config`: solo superadmin/superadmin_user (SELECT + UPDATE)
- `ai_credits`: superadmin ALL + company SELECT own
- `ai_credit_packages`: superadmin ALL + company SELECT active
- `ai_credit_purchases`: superadmin ALL + company SELECT own
- `ai_audit_log`: superadmin ALL + company SELECT own

Trigger: `init_company_credits()` — AFTER INSERT ON companies → crea riga ai_credits

## Edge Function: `platform-config`

Nuova edge function per gestire la configurazione piattaforma:
- **GET**: ritorna `platform_config` (solo superadmin)
- **POST action=test_api_key**: testa la API key ElevenLabs chiamando `/v1/voices` e ritorna il conteggio voci
- **POST action=update_config**: aggiorna `el_default_llm`, `credit_markup`, `cost_per_min_real`, ricalcola `cost_per_min_billed`

La API key ElevenLabs continua a vivere nel Supabase Secret `ELEVENLABS_API_KEY` (già configurato). La tabella `platform_config` traccia solo metadata (`el_api_key_configured`, `el_api_key_tested_at`).

## Aggiornamento Edge Functions Esistenti

Tutte le edge functions che oggi leggono `companies.el_api_key` verranno aggiornate per leggere **solo** da `Deno.env.get("ELEVENLABS_API_KEY")` (il secret centralizzato). Il campo `companies.el_api_key` diventa obsoleto — le aziende non configurano più la propria key.

File da aggiornare:
- `create-elevenlabs-agent/index.ts` — rimuovi lookup `companies.el_api_key`
- `elevenlabs-conversation-token/index.ts` — idem
- `elevenlabs-tts/index.ts` — idem
- `get-elevenlabs-voices/index.ts` — idem
- `update-agent/index.ts` — idem

## Pagina SuperAdmin: Platform Settings

Nuovo file `src/pages/superadmin/PlatformSettings.tsx` con layout a tab verticali:

### Tab 1: ElevenLabs API
- Status card: se configurata mostra ✅ con data ultimo test e N voci disponibili
- Se non configurata: messaggio warning con link a elevenlabs.io
- Bottone "Ri-testa Connessione" → chiama edge function `platform-config` action=test_api_key
- Info: "La API key è cifrata nel Supabase Vault e non è mai visibile"

### Tab 2: LLM & Modelli
- Radio cards per il modello LLM default (Gemini 2.5 Flash, GPT-4o Mini, GPT-4o, Claude Sonnet 4.5, Claude Haiku 4.5, Llama 3.3 70B)
- Ogni opzione mostra latenza e costo relativo
- Bottone "Salva"

### Tab 3: Markup & Prezzi
- Input: Costo reale ElevenLabs €/min
- Input: Moltiplicatore markup
- Preview live: costo cliente calcolato + margine %
- Bottone "Salva Configurazione"

### Tab 4: Pacchetti Crediti
- Lista pacchetti da `ai_credit_packages` con toggle attivo/inattivo
- Bottone "Aggiungi Pacchetto" → modal con nome, minuti, prezzo, badge, ordine
- Modifica/elimina per ogni pacchetto

## Routing & Sidebar

- Aggiornare `App.tsx`: aggiungere route `/superadmin/platform-settings` → `PlatformSettings`
- Aggiornare `Sidebar.tsx`: sostituire "Impostazioni" con "Impostazioni Piattaforma" href `/superadmin/platform-settings` nella sezione superadmin. Rimuovere "API Keys" (funzionalità assorbita)

## File da creare/modificare

| File | Azione |
|------|--------|
| Migration SQL | Crea 5 nuove tabelle + RLS + trigger + seed |
| `supabase/functions/platform-config/index.ts` | Nuovo |
| `supabase/config.toml` | Aggiungi `[functions.platform-config]` |
| `src/pages/superadmin/PlatformSettings.tsx` | Nuovo (~400 righe) |
| `src/App.tsx` | Aggiungi route |
| `src/components/layout/Sidebar.tsx` | Aggiorna nav superadmin |
| 5 edge functions esistenti | Rimuovi lookup `companies.el_api_key` |

