

# Piano: Sistema Template Agenti + Reportistica Serale Cantiere

Questo e un modulo molto grande. Lo suddivido in fasi implementabili, partendo dalle fondamenta (DB + catalogo) fino al wizard completo e le edge functions.

---

## Fase 1 — Database + Seed

**Migration SQL** che crea 4 tabelle:

| Tabella | Scopo |
|---------|-------|
| `agent_templates` | Catalogo template (gestiti da SuperAdmin) |
| `agent_template_instances` | Istanze per azienda (config compilata) |
| `agent_reports` | Report generati da ogni istanza |
| `company_channels` | Canali comunicazione per azienda (WA/Telegram/Email) |

- RLS con `has_role()` per superadmin e `my_company()` per aziende
- Seed del template "Reportistica Serale Cantiere" con prompt, config_schema, output_schema completi
- Le foreign key verso `agents` (non `ai_agents`) e `conversations` (non `ai_conversations`) per allinearsi allo schema esistente

**Nota**: i nomi tabella nel prompt (`ai_agents`, `ai_conversations`) non esistono nello schema attuale. Useremo `agents` e `conversations`.

---

## Fase 2 — Routing + Sidebar

**Sidebar** (`src/components/layout/Sidebar.tsx`):
- Aggiungere sezione "AUTOMAZIONI" con:
  - `🧩 Template Agenti` → `/app/templates` (con badge "NUOVO")
  - Rinominare "Agenti AI" resta com'e

**App.tsx** — nuove route:
- `/app/templates` — Catalogo
- `/app/templates/:slug` — Dettaglio template
- `/app/templates/:slug/setup` — Wizard 5 step

**SuperAdmin routes**:
- `/superadmin/templates` — Gestione catalogo
- `/superadmin/templates/new` — Crea template
- `/superadmin/templates/:id/edit` — Modifica

---

## Fase 3 — Catalogo Template (`/app/templates`)

Nuovo file: `src/pages/app/Templates.tsx`

- Hero header con titolo, descrizione, filtri per categoria (tabs) e ricerca
- Grid 3 colonne di TemplateCard
- Ogni card: preview header con gradiente brand, icona, nome, chips canali, difficolta, setup time, installs count, bottone "Configura →"
- Card "Presto disponibile" (opacity-60, disabled) per template pianificati
- Fetch da `agent_templates` dove `is_published = true`

Nuovo componente: `src/components/templates/TemplateCard.tsx`

---

## Fase 4 — Dettaglio Template (`/app/templates/:slug`)

Nuovo file: `src/pages/app/TemplateDetail.tsx`

Layout 2 colonne:
- **Sinistra**: flow visuale "Come funziona" (5 step con linea tratteggiata), preview report HTML mockup statico con dati esempio, mockup chat WhatsApp
- **Destra** (sticky): checklist feature, canali supportati, stima costo, bottone "Configura Questo Template", link workflow n8n

---

## Fase 5 — Wizard Configurazione (5 Step)

Nuovo file: `src/pages/app/TemplateSetup.tsx`

Componente wizard con progress bar e 5 step:

1. **Personalizza**: renderizza dinamicamente i campi dal `config_schema` del template (text, select, multiselect, time, number, slider). Anteprima primo messaggio live.

2. **Operai**: lista dinamica di card operaio (nome, telefono, cantiere). Bottone aggiungi/rimuovi. Validazione telefono internazionale.

3. **Destinatari**: lista destinatari (nome, ruolo, canali multi-checkbox con input condizionali email/telefono/telegram).

4. **Canali**: tabs WhatsApp/Telegram. Se gia configurato in `company_channels` mostra stato. Altrimenti form connessione (per ora placeholder, usa canali WA gia esistenti in `whatsapp_waba_config`).

5. **Riepilogo & Attivazione**: griglia riepilogo, stima costi, test invio, bottone attiva.

Ogni step salva progressivamente su `agent_template_instances` con status `setup`.

---

## Fase 6 — Edge Functions

### `deploy-template-instance`
- Carica istanza + template
- Sostituisce variabili `{{...}}` nel prompt
- Crea agente su ElevenLabs (usa `create-elevenlabs-agent` esistente come riferimento)
- Salva agente in tabella `agents`
- Crea workflow n8n via API (richiede secrets `N8N_BASE_URL`, `N8N_API_KEY`)
- Aggiorna istanza con `status: active`
- Log in `ai_audit_log`

### `generate-report`
- Riceve dati conversazione
- Usa Lovable AI Gateway (non Claude direttamente) per estrarre dati strutturati
- Genera HTML report
- Genera sommario testo per WhatsApp
- Restituisce tutto per i nodi n8n successivi

### `save-report`
- Salva record in `agent_reports`
- Aggiorna contatore `reports_generated` su istanza

---

## Fase 7 — SuperAdmin Templates Management

Nuovo file: `src/pages/superadmin/Templates.tsx`
- Tabella template con azioni CRUD
- Form creazione/modifica con editor config_schema JSON
- Toggle published/featured

---

## Secrets necessari

- `N8N_BASE_URL` — URL dell'istanza n8n
- `N8N_API_KEY` — API key n8n

(Saranno richiesti al momento del deploy, non subito)

---

## File da creare/modificare

| File | Azione |
|------|--------|
| Migration SQL | 4 tabelle + RLS + seed template |
| `src/pages/app/Templates.tsx` | Catalogo template |
| `src/pages/app/TemplateDetail.tsx` | Dettaglio template |
| `src/pages/app/TemplateSetup.tsx` | Wizard 5 step |
| `src/components/templates/TemplateCard.tsx` | Card template |
| `src/pages/superadmin/Templates.tsx` | Gestione SA |
| `src/components/layout/Sidebar.tsx` | Sezione AUTOMAZIONI |
| `src/App.tsx` | Nuove route |
| `supabase/functions/deploy-template-instance/index.ts` | Deploy |
| `supabase/functions/generate-report/index.ts` | Report AI |
| `supabase/functions/save-report/index.ts` | Salva report |
| `supabase/config.toml` | Nuove functions |
| `src/integrations/supabase/types.ts` | Auto-aggiornato |

---

## Approccio implementativo

Data la dimensione, implemento in ordine: DB → Routing/Sidebar → Catalogo → Dettaglio → Wizard → Edge Functions → SuperAdmin. Il primo messaggio coprira Fasi 1-4 (DB, routing, catalogo, dettaglio). Il wizard e le edge functions seguiranno.

