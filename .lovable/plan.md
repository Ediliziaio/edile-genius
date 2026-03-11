

# Piano: AI Orchestrator — Cervello Centrale degli Agenti

## Analisi dello stato attuale

La piattaforma ha gia 6 agenti autonomi funzionanti, ma ognuno opera in modo isolato:
- **auto-followup-agent**: cron per lead dormienti
- **post-call-actions**: reagisce a fine chiamata
- **ai-morning-briefing**: genera briefing LLM
- **Smart Actions Engine**: regole JS nella dashboard
- **Campaign Auto-Pilot**: logica in run-campaign-batch
- **recalculate-lead-weights**: lead score dinamico

Mancano: coordinamento, deduplicazione, memoria, prioritizzazione centralizzata, e una UI unificata per il controllo.

---

## Cosa costruire

### 1. Edge Function `ai-orchestrator` — Il Cervello Centrale

Una singola edge function schedulabile (cron ogni 30min o invocabile manualmente) che per ogni company:

1. **Raccoglie stato** — query parallele su: contacts (callback scaduti, dormienti, nuovi), conversations (ultime 24h), campaigns (attive, performance), credits (saldo, burn rate), preventivi (stale), agent_automations (config)
2. **Genera eventi** — identifica situazioni che richiedono azione:
   - `lead_dormant` (qualified, >N giorni senza contatto)
   - `callback_overdue` (next_call_at passato)
   - `preventivo_stale` (inviato >10gg senza risposta)
   - `campaign_low_perf` (conversione <3%)
   - `credits_critical` (giorni rimanenti <3)
   - `new_lead_unassigned` (creato <24h, nessun agente assegnato)
3. **Consulta memoria** — controlla `ai_orchestrator_log` per evitare azioni duplicate (es. non richiamare lo stesso contatto 2 volte in 48h)
4. **Decide e delega** — per ogni evento:
   - Se `followup_agent` abilitato e lead ha telefono → invoca `auto-followup-agent` per quel contatto
   - Se callback scaduto → logga azione suggerita (non chiama, solo notifica)
   - Se preventivo stale → genera follow-up suggerito via `generate-followup`
   - Se credits critici → logga alert
5. **Scrive log** — ogni decisione va in `ai_orchestrator_log` con timestamp, tipo evento, azione presa, contatto coinvolto

### 2. Nuova tabella `ai_orchestrator_log`

```sql
CREATE TABLE ai_orchestrator_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  event_type text NOT NULL,        -- 'lead_dormant', 'callback_overdue', etc.
  entity_type text,                -- 'contact', 'preventivo', 'campaign'
  entity_id uuid,
  action_taken text NOT NULL,      -- 'outbound_call', 'followup_suggested', 'alert', 'skipped'
  action_details jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);
```

Con indice su `(company_id, entity_id, event_type, created_at)` per query di deduplicazione rapide.

RLS: company-scoped SELECT + superadmin ALL.

### 3. Pagina `/app/automations` — Centro di Controllo AI

Nuova pagina con 3 sezioni:

**Sezione 1: I tuoi agenti** — Grid di card per ogni agente autonomo:
- Toggle on/off (scrive su `agent_automations`)
- Ultimo run + totale azioni
- Config inline (soglie modificabili: giorni dormienza, max chiamate/run, soglia conversione)
- 3 agenti "sempre attivi" (Pipeline Manager, Briefing, Sentinella) con badge fisso
- Bottone "Ricalcola" per Lead Score Dinamico

**Sezione 2: Attivita recente** — Lista cronologica da `ai_orchestrator_log` (ultime 20 azioni) con icone per tipo evento, link all'entita coinvolta

**Sezione 3: Impostazioni globali** — Toggle "AI Orchestrator attivo" + frequenza (ogni 30min/1h/2h)

### 4. Route + Sidebar

- Aggiungere route `/app/automations` in `App.tsx`
- Aggiungere voce "Automazioni AI" nella sidebar (icona `Zap`) nella sezione "I miei agenti"

### 5. Integrazione Dashboard

- Aggiungere card "Agenti Autonomi" nella dashboard con: N agenti attivi, N azioni oggi, link a `/app/automations`

---

## File da creare/modificare

| File | Azione |
|---|---|
| `supabase/functions/ai-orchestrator/index.ts` | Creare — cervello centrale |
| `supabase/migrations/XXXXXX_orchestrator.sql` | Creare — tabella `ai_orchestrator_log` + RLS |
| `src/pages/app/Automations.tsx` | Creare — pagina centro di controllo |
| `src/App.tsx` | Aggiungere route `/app/automations` |
| `src/components/layout/SidebarNav.tsx` | Aggiungere voce menu |
| `src/integrations/supabase/types.ts` | Aggiornare tipi |
| `supabase/config.toml` | Aggiungere funzione |
| `src/pages/app/Dashboard.tsx` | Aggiungere card agenti autonomi |

---

## Logica di deduplicazione (memoria operativa)

Prima di ogni azione, l'orchestrator controlla:
```sql
SELECT 1 FROM ai_orchestrator_log
WHERE company_id = $1
  AND entity_id = $2
  AND event_type = $3
  AND created_at > now() - interval '48 hours'
  AND action_taken != 'skipped'
```
Se esiste → skip. Questo evita spam e azioni duplicate.

---

## Prioritizzazione

L'orchestrator ordina gli eventi per priorita:
1. `credits_critical` (danger)
2. `callback_overdue` (high)
3. `lead_dormant` (high)
4. `preventivo_stale` (medium)
5. `campaign_low_perf` (medium)
6. `new_lead_unassigned` (low)

Processa max 20 eventi per company per run (controllo costi).

---

## Ordine di implementazione

1. Migration DB (`ai_orchestrator_log`)
2. Edge function `ai-orchestrator`
3. Pagina `Automations.tsx` con card agenti + log attivita
4. Route + sidebar + dashboard card

