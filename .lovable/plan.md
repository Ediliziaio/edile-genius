

# Piano: Refactor UX Navigazione Agenti AI — "Agent Hub"

Ristrutturazione completa del flusso agenti per scalabilità a 50+ tipi di agente.

---

## Riepilogo Modifiche

### 1. Sidebar — Rimuovere "STRUMENTI VENDITA" e "Render AI"
**File:** `src/components/layout/Sidebar.tsx`
- Eliminare la sezione `STRUMENTI VENDITA` con la voce `Render AI` dal `companyNav`
- Nel `superadminNav`, rinominare la sezione "RENDER AI" in qualcosa di piu generico o spostare "Config Provider" sotto "ACCOUNT" o "PRINCIPALE"
- Rimuovere import `Paintbrush` (non piu usato nel company nav)

### 2. `/app/agents/new` — Da wizard diretto a Template Hub
**File:** `src/pages/app/CreateAgent.tsx` — Riscrivere completamente

La pagina diventa il **Template Hub**: griglia di template con filtri per categoria, ricerca, card colorate per tipo.

- Header sticky con titolo "Scegli il tipo di agente", bottone "← Agenti", barra ricerca
- Filtri categoria come pill scrollabili: Tutti, Vocali, WhatsApp & Chat, Strumenti Vendita, Reportistica, Operativi, Prossimamente
- Griglia responsive (4 col desktop, 2 tablet, 1 mobile)
- Template card con striscia colorata in cima per categoria, icona, badges canale/difficolta, metriche, CTA "Configura →"
- Template caricati da `agent_templates` DB + hardcoded upcoming/static templates
- Click "Configura" → naviga a `/app/agents/new/:slug`

### 3. Nuova route `/app/agents/new/:slug` — Wizard per template specifico
**File:** `src/App.tsx` — Aggiungere route
**File:** `src/pages/app/AgentTemplateWizard.tsx` — Nuovo file

- Se slug = `vocale-custom` → mostra il wizard vocale esistente (logica da `CreateAgent.tsx` attuale)
- Se slug = `render-infissi` → redirect a wizard render (riuso `RenderNew` o wrapper)
- Se slug corrisponde a un template DB → carica template e mostra wizard configurazione (riuso logica `TemplateSetup`)
- Header con breadcrumb "← Scegli Template" e banner con tipo template

### 4. `/app/agents` — Refactor pagina lista agenti
**File:** `src/pages/app/Agents.tsx`

- Header con contatori "N agenti attivi · N in bozza"
- Filtri: Select tipo (Tutti/Vocale/WhatsApp/Render/Operativo) + Select stato
- Bottone "+ Nuovo Agente" → `/app/agents/new` (Template Hub)
- Empty state con 3 icone tipo + CTA "Scegli un Template"

### 5. AgentCard — Striscia colorata per tipo + badge tipo
**File:** `src/components/agents/AgentCard.tsx`

- Aggiungere striscia sinistra 4px colorata per tipo (brand=vocale, green=whatsapp, violet=render, teal=operativo)
- Badge tipo con emoji: "🎙️ VOCALE", "💬 WHATSAPP", "🎨 RENDER"
- Metriche contestuali per tipo (chiamate per vocale, render per render, conversazioni per whatsapp)
- Template di origine se disponibile

### 6. AgentDetail — Tab adattive per tipo
**File:** `src/pages/app/AgentDetail.tsx`

- Definire `TABS_BY_TYPE` map con tab diverse per vocal/render/whatsapp
- Per render: Configurazione, Avvia Render, Galleria, Preset, Analytics, Impostazioni
- Per whatsapp: Agente, Workflow, Scheduling, Conversazioni, Report, Impostazioni
- Per vocal: tab attuali (invariate)
- Determinare tipo da `agent.type`

### 7. Routing — Aggiornare App.tsx
**File:** `src/App.tsx`

- Aggiungere route `/app/agents/new/:slug` → `AgentTemplateWizard`
- Mantenere route render (`/app/render/*`) per ora come redirect/fallback ma non piu linkate dalla sidebar
- Route `/app/templates` resta invariata (e il catalogo separato per automazioni)

---

## File coinvolti

| File | Azione |
|---|---|
| `src/components/layout/Sidebar.tsx` | Rimuovere STRUMENTI VENDITA |
| `src/pages/app/CreateAgent.tsx` | Riscrivere come Template Hub |
| `src/pages/app/AgentTemplateWizard.tsx` | **Nuovo** — wizard per slug specifico |
| `src/pages/app/Agents.tsx` | Refactor con filtri tipo, empty state, contatori |
| `src/components/agents/AgentCard.tsx` | Striscia colorata + badge tipo |
| `src/pages/app/AgentDetail.tsx` | Tab adattive per tipo |
| `src/App.tsx` | Nuova route `/app/agents/new/:slug` |

---

## Note tecniche

- Il Template Hub carica template da DB (`agent_templates` dove `is_published = true`) + template statici hardcoded per "upcoming" e per template non ancora nel DB (es. `vocale-custom`)
- I template statici come "Agente Vocale Personalizzato" non sono nel DB — sono hardcoded nel Hub come entry point al wizard vocale esistente
- Le route `/app/render/*` restano funzionanti ma senza link dalla sidebar — accessibili dal dettaglio agente render
- Il campo `agents.type` nel DB (`vocal`, `render`, `whatsapp`, `operative`) determina la visualizzazione

