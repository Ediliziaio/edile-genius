

# Piano: Trasformazione AI Services in Agenti Autonomi

## FASE 1 — Funzioni AI Esistenti

| # | Funzione | Modulo | Automazione attuale |
|---|---|---|---|
| 1 | Agente Vocale AI | ElevenLabs ConvAI | Livello 4 — autonomo |
| 2 | Call Summary + Outcome AI | elevenlabs-webhook/summary.ts | Livello 3 — auto post-call |
| 3 | Post-Call Actions | elevenlabs-webhook/post-call-actions.ts | Livello 3 — auto-update contatti |
| 4 | Lead Score | lead-score.ts (client JS) | Livello 1 — solo analisi |
| 5 | Smart Actions Engine | Dashboard.tsx (client JS) | Livello 2 — analisi + suggerimenti |
| 6 | Follow-up AI | generate-followup edge fn | Livello 1 — genera testo, utente copia |
| 7 | Morning Briefing AI | ai-morning-briefing edge fn | Livello 2 — analisi + comunicazione |
| 8 | Preventivo da Audio | process-preventivo-audio | Livello 3 — auto-genera PDF |
| 9 | Campagne Outbound | run-campaign-batch | Livello 3 — batch calling |
| 10 | Report Cantiere | telegram-cantiere-webhook | Livello 3 — auto-genera report |
| 11 | Render AI | generate-render | Livello 2 — on demand |
| 12 | Analisi Foto | analyze-window-photo | Livello 3 — auto pre-fill |

---

## FASE 2 — 6 Agenti Autonomi da Implementare

### AGENTE 1: "Recupero Lead Dormienti" (Follow-up Automatico)
**Problema risolto**: Lead qualificati che nessuno ricontatta dopo 5+ giorni — vendite perse.

**Trasformazione**: Il follow-up oggi genera solo testo da copiare. L'agente deve:
- **Osservare**: Contatti con status `qualified` e `last_contact_at` > 5 giorni
- **Decidere**: Quale canale usare (outbound call se ha telefono, altrimenti segna per follow-up manuale)
- **Agire**: Lanciare automaticamente una chiamata outbound con l'agente vocale assegnato, oppure generare e loggare il messaggio di follow-up
- **Monitorare**: Aggiornare status contatto post-azione, registrare il tentativo

**Implementazione**:
1. Nuova edge function `auto-followup-agent` (cron-schedulabile) che:
   - Query contatti `qualified` con `last_contact_at < now() - 5 days`
   - Per ogni contatto, se ha un agente vocale assegnato (`assigned_agent`), chiama `elevenlabs-outbound-call`
   - Aggiorna `call_attempts` e `last_contact_at`
   - Limita a max 10 contatti per esecuzione (controllo costi)
2. Nuova tabella `agent_automations` per configurare on/off, soglie, limiti giornalieri per company
3. Card nella Dashboard che mostra "Agente Recupero Lead: attivo, 3 follow-up oggi"

**Livello autonomia**: 4 (analisi + decisione + azione autonoma)

---

### AGENTE 2: "Consulente Mattutino" (Briefing Intelligente Potenziato)
**Problema risolto**: L'imprenditore apre la dashboard e non sa cosa fare prima.

**Trasformazione**: Il briefing attuale è informativo. L'agente deve diventare decisionale:
- **Osservare**: KPI, trend settimanali, conversioni, lead pipeline, costi
- **Analizzare**: Confronto settimana corrente vs precedente, anomalie
- **Decidere**: Le 3 azioni più urgenti della giornata, ordinate per impatto
- **Output**: Briefing con azioni cliccabili (link diretto all'azione)

**Implementazione**:
1. Estendere `ai-morning-briefing` per includere:
   - Confronto settimana corrente vs precedente (trend)
   - Preventivi in attesa di risposta con importo totale
   - Tasso di conversione campagne
2. Aggiungere campo `actions` al JSON response: array di `{ label, href, priority }` 
3. Nella dashboard, le azioni del briefing diventano bottoni cliccabili

**Livello autonomia**: 2→3 (aggiunge azioni suggerite cliccabili)

---

### AGENTE 3: "Gestore Pipeline Automatico" (Post-Call Actions Evoluto)
**Problema risolto**: Dopo ogni chiamata l'utente deve leggere il summary e agire manualmente.

**Trasformazione**: Post-call-actions oggi aggiorna solo lo status. L'agente deve:
- **Osservare**: Outcome AI, collected_data, next_step di ogni chiamata
- **Decidere**: Azioni specifiche per outcome
- **Agire**:
  - `appointment` → creare evento/reminder nel contatto con data raccolta
  - `qualified` → se non ha preventivo, segnare come "da preventivare" 
  - `callback` → schedulare richiamata automatica con l'agente vocale
  - `not_interested` → archiviare con motivo, escludere da campagne attive
- **Monitorare**: Loggare ogni azione nella timeline del contatto

**Implementazione**:
1. Estendere `post-call-actions.ts`:
   - Estrarre dati strutturati da `collected_data` (data appuntamento, tipo intervento, budget)
   - Per `callback`: inserire il contatto in coda per `auto-followup-agent`
   - Per `appointment`: aggiornare `next_call_at` con la data raccolta dall'AI
   - Per `not_interested`: rimuovere da `campaign_contacts` attivi
2. Nuova colonna `contacts.ai_actions_log` (jsonb array) per tracciare azioni automatiche
3. Mostrare timeline azioni AI nella scheda contatto

**Livello autonomia**: 4

---

### AGENTE 4: "Campagne Auto-Pilota"
**Problema risolto**: Le campagne outbound richiedono monitoraggio manuale costante.

**Trasformazione**:
- **Osservare**: Tasso conversione per campagna, costo per appuntamento, contatti rimanenti
- **Decidere**: 
  - Se conversione < 3% dopo 30+ contatti → pausa automatica + notifica
  - Se ci sono contatti `pending` e il budget lo consente → suggerire lancio batch
  - Se tutti i contatti sono stati chiamati → completare campagna automaticamente
- **Agire**: Auto-pause, auto-complete, suggerimento riavvio con prompt diverso

**Implementazione**:
1. Aggiungere logica in `run-campaign-batch` per:
   - Check conversione dopo ogni batch completato
   - Auto-pause se sotto soglia configurabile
   - Auto-complete se 0 contatti pending
2. Smart Action dedicata in Dashboard: "Campagna X sotto il 3% — pausa suggerita"
3. Campo `campaigns.auto_pilot` (boolean) per abilitare il comportamento

**Livello autonomia**: 3

---

### AGENTE 5: "Sentinella Crediti e Costi"
**Problema risolto**: L'imprenditore non monitora i costi e rischia blocchi improvvisi.

**Trasformazione**:
- **Osservare**: Balance, burn rate (consumo medio giornaliero), trend costi
- **Analizzare**: Calcolare "giorni rimanenti" al ritmo attuale
- **Decidere**: Se giorni rimanenti < 3 → alert urgente
- **Agire**: Mostrare proiezione nella Dashboard, suggerire ricarica

**Implementazione**:
1. Calcolare `burn_rate` = `total_spent_eur / giorni_da_prima_ricarica` nella Dashboard
2. Mostrare "Crediti sufficienti per ~X giorni" nel KPI card crediti
3. Smart Action se giorni < 3: "Al ritmo attuale, i crediti finiranno tra 2 giorni"

**Livello autonomia**: 2 (analisi + alert con suggerimento d'azione)

---

### AGENTE 6: "Qualificatore Intelligente" (Lead Score Evoluto)
**Problema risolto**: Il lead score è uguale per tutti, non impara dai risultati reali dell'azienda.

**Trasformazione**:
- **Osservare**: Storico conversioni dell'azienda (contatti che sono diventati `qualified` o `appointment`)
- **Analizzare**: Quali fattori hanno più peso nelle conversioni reali di QUESTA azienda
- **Decidere**: Aggiustare i pesi del lead score per company
- **Output**: Score personalizzato e più accurato

**Implementazione**:
1. Nuova edge function `recalculate-lead-weights` che:
   - Analizza i contatti convertiti vs non convertiti
   - Calcola correlazione per source, sector, call_attempts, tempo di risposta
   - Salva pesi personalizzati in `companies.settings.lead_score_weights`
2. `lead-score.ts` legge i pesi custom se disponibili, altrimenti usa i default
3. Esecuzione mensile o on-demand dal SuperAdmin

**Livello autonomia**: 3 (analisi + decisione + auto-aggiornamento pesi)

---

## FASE 3 — Struttura Tecnica

### Nuova tabella: `agent_automations`
```sql
CREATE TABLE agent_automations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id),
  automation_type text NOT NULL, -- 'followup_agent', 'campaign_autopilot', 'pipeline_manager'
  is_enabled boolean DEFAULT false,
  config jsonb DEFAULT '{}', -- soglie, limiti, canali
  last_run_at timestamptz,
  total_actions integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
```

### Nuova colonna su contacts
```sql
ALTER TABLE contacts ADD COLUMN ai_actions_log jsonb DEFAULT '[]';
```

### Edge Functions da creare/modificare
1. **Creare**: `auto-followup-agent` — cron per follow-up autonomo
2. **Estendere**: `ai-morning-briefing` — aggiungere actions cliccabili + trend
3. **Estendere**: `post-call-actions.ts` — azioni specifiche per outcome
4. **Estendere**: `run-campaign-batch` — auto-pilot logic
5. **Creare**: `recalculate-lead-weights` — lead score dinamico

### UI da modificare
1. **Dashboard.tsx**: Card "Agenti Autonomi" con stato on/off e contatore azioni
2. **Dashboard.tsx**: Briefing con bottoni azione cliccabili
3. **Dashboard.tsx**: KPI crediti con proiezione giorni rimanenti
4. **ContactDetailPanel**: Timeline azioni AI automatiche
5. **Settings.tsx** o nuova pagina: Toggle per abilitare/disabilitare ogni agente autonomo

---

## FASE 7-8 — Classifica e Valore Commerciale

### AGENTI CORE
1. **Recupero Lead Dormienti** — il più vendibile, ROI immediato
2. **Gestore Pipeline** — elimina il lavoro manuale post-chiamata
3. **Campagne Auto-Pilota** — scalabilità vendite senza supervisione

### AGENTI DI SUPPORTO
4. **Consulente Mattutino** — differenziante forte, percezione "AI vera"
5. **Sentinella Crediti** — protezione business, previene blocchi

### AGENTI AVANZATI
6. **Qualificatore Intelligente** — valore a medio termine, richiede storico dati

---

## Priorità di Implementazione

| Ordine | Agente | Effort | Impatto |
|---|---|---|---|
| 1 | Sentinella Crediti (burn rate) | Basso (solo UI) | Alto — previene blocchi |
| 2 | Briefing con azioni cliccabili | Medio | Alto — percezione AI |
| 3 | Pipeline Manager evoluto | Medio | Alto — elimina lavoro manuale |
| 4 | Recupero Lead Dormienti | Alto | Molto alto — recupera vendite |
| 5 | Campagne Auto-Pilota | Medio | Alto — scalabilità |
| 6 | Lead Score Dinamico | Alto | Medio — richiede storico |

Implementerò nell'ordine 1→4 in questa sessione, partendo dalla Sentinella Crediti e dal Briefing potenziato, poi il Pipeline Manager evoluto, e infine l'Agente Follow-up Autonomo con la tabella `agent_automations`.

