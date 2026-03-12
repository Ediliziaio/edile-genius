

# PROMPT 5 — Stabilizzazione Backend Edge Functions

## Analisi reale vs prompt

Il prompt descrive problemi basati su codice ipotetico. Ho verificato il codice reale e adatto i fix di conseguenza:

| Fix | Prompt dice | Codice reale | Fix adattato |
|-----|-------------|--------------|--------------|
| 1. post-call-actions | 4 UPDATE separate su `call_logs`, `companies.credits` | Solo 1 UPDATE su `contacts` + campaign exclusion | RPC atomica per contact update + campaign exclusion |
| 2. ai-orchestrator dedup | Map in memoria | Gia usa `ai_orchestrator_log` con query dedup | Aggiungere backpressure + indice per performance |
| 3. campaign-batch lock | SQL injection | Nessuna SQL injection (usa PostgREST) | Advisory lock per prevenire batch concorrenti |
| 4. weekly-report | NaN su divisione | Gia gestito (riga 63-65) | Aggiungere email retry + log tabella |
| 5. auto-followup credits | Check non atomico | Confermato: check a riga 123, loop a riga 160 | RPC per riservare crediti pre-batch |

## Modifiche pianificate

### Migration SQL
- `process_post_call_atomic(...)` — RPC che aggiorna contact, action log, campaign exclusion in una transazione
- `try_acquire_campaign_lock` / `release_campaign_lock` — advisory lock functions
- `reserve_followup_credits` / `release_followup_credits` — riserva crediti atomica su `ai_credits` (usa `balance_eur`, non `credits_remaining` che non esiste)
- `weekly_reports_log` table con RLS
- Indice su `ai_orchestrator_log(company_id, entity_id, event_type, created_at)` per performance dedup

### Edge Functions

**post-call-actions.ts**: Sostituire le operazioni separate con singola RPC `process_post_call_atomic` che fa contact update + action log append + campaign exclusion atomicamente.

**ai-orchestrator/index.ts**: Aggiungere backpressure — contare azioni recenti per company nell'ultimo minuto via `ai_orchestrator_log`, saltare se > 10.

**run-campaign-batch/index.ts**: Wrappare `run_batch` con `try_acquire_campaign_lock` / `release_campaign_lock` in try/finally.

**weekly-report/index.ts**: Aggiungere `sendEmailWithRetry` (3 tentativi, backoff esponenziale) + logging su `weekly_reports_log`.

**auto-followup-agent/index.ts**: Prima del loop chiamate, riservare crediti con RPC atomica su `ai_credits.balance_eur`. Dopo il loop, rilasciare crediti non usati.

### File coinvolti

| File | Modifica |
|------|----------|
| Migration SQL | 5 RPC + 1 tabella + 1 indice |
| `supabase/functions/elevenlabs-webhook/post-call-actions.ts` | RPC atomica |
| `supabase/functions/ai-orchestrator/index.ts` | Backpressure |
| `supabase/functions/run-campaign-batch/index.ts` | Advisory lock |
| `supabase/functions/weekly-report/index.ts` | Retry email + log |
| `supabase/functions/auto-followup-agent/index.ts` | Crediti atomici |

### Note
- Non creo `call_logs`, `companies.credits_remaining` etc. perche non esistono nello schema. Il sistema usa `conversations` + `ai_credits.balance_eur` + `deduct_call_credits` RPC (gia esistente).
- Advisory lock: il pg_cron cleanup va configurato manualmente (vedi memory constraint).
- La riservazione crediti usa `balance_eur` su `ai_credits`, non su `companies`.

