

# Piano: Fase 5-7 — Wizard Configurazione + Edge Functions + SuperAdmin

## Fase 5 — Wizard 5 Step (`TemplateSetup.tsx`)

Riscrivere completamente il placeholder attuale con un wizard completo.

### Struttura
- Header fisso con progress bar 5 segmenti e labels
- State management: `currentStep`, `configValues`, `responders[]`, `recipients[]`, `instanceId`
- Al mount: fetch template da DB per slug, crea/carica `agent_template_instances` con status `setup`
- Navigazione avanti/indietro con validazione per step

### Step 1 — Personalizza
- Input nome agente (default dal template)
- Renderizzazione dinamica dei campi dal `config_schema` del template:
  - `text` → Input
  - `select` → Select dropdown
  - `multiselect` → pill toggle buttons
  - `time` → Input type time
  - `number` → Slider con label live
- Raggruppati per `section` (Azienda, Scheduling, Comportamento)
- Anteprima primo messaggio live (sostituisce variabili `{{...}}`)

### Step 2 — Operai (Responders)
- Lista dinamica di card con: nome, telefono (+39), cantiere
- Bottone aggiungi/rimuovi
- Validazione: almeno 1 operaio, nome e telefono obbligatori

### Step 3 — Destinatari (Recipients)
- Card con: nome, ruolo (dropdown), canali (multi-checkbox: Email/WhatsApp/Telegram)
- Input condizionale per email/telefono/telegram in base ai canali selezionati
- Toggle "Ricevi report incompleti"

### Step 4 — Canali
- Mostra stato canali gia configurati in `company_channels` o `whatsapp_waba_config`
- Se WhatsApp gia collegato tramite il modulo WA esistente → mostra stato verde
- Se non configurato → link a `/app/whatsapp` per configurare
- Telegram: form bot token + nome bot (salva in `company_channels`)

### Step 5 — Riepilogo & Attiva
- Griglia riepilogo con link "Modifica" per tornare allo step
- Stima costi (N operai x 4 min x costo/min)
- Bottone "Attiva Agente" → chiama edge function `deploy-template-instance`
- Bottone "Salva bozza"
- Salvataggio progressivo su `agent_template_instances` ad ogni cambio step

## Fase 6 — Edge Functions

### `deploy-template-instance`
1. Carica istanza + template dal DB
2. Sostituisce variabili `{{...}}` nel prompt_template
3. Crea agente ElevenLabs (riusa logica di `create-elevenlabs-agent`)
4. Inserisce in tabella `agents`
5. Se configurato `N8N_BASE_URL` + `N8N_API_KEY`: crea workflow n8n via API (altrimenti skip con log)
6. Aggiorna istanza: `status: active`, `agent_id`, `n8n_workflow_id`
7. Incrementa `installs_count` sul template

### `generate-report`
- Riceve dati conversazione, usa `ELEVENLABS_API_KEY` o AI per estrarre dati strutturati
- Genera HTML report e sommario testo
- Placeholder per ora — la logica AI vera verra implementata quando i flussi n8n saranno attivi

### `save-report`
- Inserisce in `agent_reports`
- Aggiorna contatori su istanza

## Fase 7 — SuperAdmin Templates (`/superadmin/templates`)

- Tabella con tutti i template (pubblicati e bozze)
- Toggle published/featured inline
- Bottone "Nuovo Template" → dialog/pagina con form:
  - slug, name, description, category, icon, channel, difficulty
  - prompt_template (textarea grande)
  - first_message_template
  - config_schema (JSON editor semplice - textarea con validazione JSON)
- Edit inline o pagina dedicata
- Delete con conferma

## File da creare/modificare

| File | Azione |
|------|--------|
| `src/pages/app/TemplateSetup.tsx` | Riscrivere — wizard 5 step completo |
| `supabase/functions/deploy-template-instance/index.ts` | Nuovo |
| `supabase/functions/generate-report/index.ts` | Nuovo |
| `supabase/functions/save-report/index.ts` | Nuovo |
| `src/pages/superadmin/Templates.tsx` | Riscrivere — CRUD completo |
| `supabase/config.toml` | Aggiungere 3 nuove functions |

