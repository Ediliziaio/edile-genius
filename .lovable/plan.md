

# Piano: Prossimi Blocchi — Completamento Funzionalita

Dalla roadmap in `.lovable/plan.md`, restano da implementare:

1. **RLS Policies → PERMISSIVE** (tutte le tabelle principali)
2. **Editor Agente 8 tab** (AgentDetail.tsx — attualmente ha 7 tab)
3. **SuperAdmin Dashboard economics** (gia parziale, migliorare)
4. **Edge function: add-knowledge-doc**
5. **Configurazione N8N secrets**

---

## 1. Fix RLS: Convertire TUTTE le policy a PERMISSIVE

Tutte le tabelle nel DB usano policy `Permissive: No` (RESTRICTIVE). Questo causa problemi quando un superadmin tenta di accedere a dati con policy company-scoped perche TUTTE le policy devono passare contemporaneamente.

**Migration SQL**: Drop e ricreazione di tutte le RLS policies per le tabelle principali (`agents`, `conversations`, `contacts`, `campaigns`, `companies`, `ai_credits`, `ai_credit_usage`, `ai_credit_topups`, `ai_phone_numbers`, `ai_knowledge_docs`, `ai_agent_workflows`, `ai_agent_tools`, `ai_audit_log`, `knowledge_base_files`, `notes`, `contact_lists`, `contact_list_members`, `ai_credit_packages`, `ai_credit_purchases`, `platform_config`, `platform_pricing`, `webhooks`) come PERMISSIVE (default PostgreSQL).

## 2. AgentDetail — Aggiungere tab "Numero" (8a tab)

Attualmente ci sono 7 tab: Panoramica, Configurazione, Test Vocale, Conversazioni, Analytics, Integrazione, Knowledge Base. Manca il tab **Numero di Telefono** per assegnare/gestire il numero collegato all'agente.

- Mostrare numero assegnato (da `ai_phone_numbers` dove `agent_id = current`)
- Form per collegare/scollegare numero
- Orari attivi e giorni

## 3. Edge Function: `add-knowledge-doc`

Nuova edge function per aggiungere documenti alla knowledge base via URL o testo:
- Accetta `{ company_id, agent_id?, name, type: "url"|"text"|"file", source_url?, content_preview?, file_path? }`
- Inserisce in `ai_knowledge_docs` con `status: "processing"`
- Se ElevenLabs agent_id disponibile, chiama API ElevenLabs per aggiungere doc alla knowledge base dell'agente
- Aggiorna status a "ready" o "error"

## 4. SuperAdmin Dashboard — Miglioramenti economics

Aggiungere:
- Conteggio render generati (da `render_sessions`)
- Revenue render (costi addebitati)
- Render credits overview

## 5. N8N Secrets Configuration

Aggiungere secrets `N8N_BASE_URL` e `N8N_API_KEY` tramite tool. Necessari per il deploy dei workflow n8n dal template system.

---

## Stima file coinvolti

| File | Azione |
|---|---|
| Migration SQL | Fix RLS PERMISSIVE per ~20 tabelle |
| `src/pages/app/AgentDetail.tsx` | Aggiungere tab Numero |
| `supabase/functions/add-knowledge-doc/index.ts` | Nuova edge function |
| `supabase/config.toml` | Aggiungere config per `add-knowledge-doc` |
| `src/pages/superadmin/Dashboard.tsx` | Aggiungere stats render |

