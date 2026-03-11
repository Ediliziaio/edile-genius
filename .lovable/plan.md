

## UX Overhaul — Dashboard & Navigation

### Current Problems

**Dashboard:**
1. **Information overload** — 5 KPI cards + 4 quick actions + 3 usage cards + next actions + contacts by status + upcoming calls + recent agents + conversations table = too many blocks competing for attention
2. **No clear hierarchy** — Quick actions (colored blocks) visually dominate over KPIs; the user sees "what to click" before understanding "what's happening"
3. **Redundant sections** — "Contacts by Status" and "Upcoming Calls" are CRM-level detail that doesn't belong on a command center dashboard
4. **Weak empty state** — Just a Bot icon + "Crea il tuo primo agente →" link. No guidance, no value proposition, no onboarding path
5. **Technical metrics** — "Lead Qualificati" shows last-5-conversations count (not monthly), "Tasso Appuntamenti" is a % without context
6. **Trial/Credits block is 3 equal cards** — Credit balance buried alongside trial info with equal visual weight

**Navigation (Sidebar):**
1. **7 sections, 20 items** — Cognitive overload. "AUTOMAZIONI" has 5 sub-items mixing templates, documents, timesheets
2. **Technical jargon** — "Knowledge Base", "Template PDF", "Configura Bot", "Analytics"
3. **Scattered related features** — Phone numbers under "COMUNICAZIONE", campaigns under "CONTATTI", WhatsApp separate from conversations
4. **"CANTIERI" section** feels disconnected — 2 items that could be grouped differently
5. **Section headers are developer categories** — "AUTOMAZIONI", "COMUNICAZIONE", "CONTATTI" don't map to user mental models

### Plan

#### 1. Sidebar Navigation — Simplified to 4 macro-areas

**New structure (13 items, down from 20):**

```text
PANORAMICA
  · Pannello di Controllo        (was: Dashboard)

I MIEI AGENTI
  · Tutti gli Agenti             (was: Agenti AI)
  · Crea Nuovo                   (was: scattered)
  · Conversazioni                (was: under COMUNICAZIONE)

CONTATTI & VENDITE
  · Rubrica                      (kept)
  · Campagne                     (kept)
  · Preventivi                   (kept)

CANTIERI
  · Gestione Cantieri            (was: I Cantieri)
  · Documenti e Scadenze         (was: Documenti)
  · Presenze                     (kept)

RISULTATI
  · Report e Statistiche         (was: Analytics)

IMPOSTAZIONI
  · Telefono e WhatsApp          (merge Phone + WhatsApp)
  · Knowledge Base → renamed "Archivio Conoscenze"
  · Crediti e Piano              (was: Crediti & Utilizzo)
  · Account                      (was: Impostazioni)
```

Items removed from primary nav (moved to Settings or removed):
- "Template Agenti" → accessible from "Crea Nuovo" flow
- "Template PDF" → moved inside Account/Settings
- "Liste & Gruppi" → merged into Rubrica page as a tab
- "Configura Bot" (cantieri) → merged into Gestione Cantieri

#### 2. Dashboard — Restructured into 4 clear zones

**Zone A — Hero Welcome + Status Bar** (top)
- Greeting + company name
- 3 inline status pills: `X agenti attivi` · `Y conversazioni questo mese` · `€Z.ZZ crediti`
- If credits blocked: red alert banner

**Zone B — Azioni Consigliate** (prominent, right after hero)
- Smart action cards based on account state
- Empty state: full-width onboarding card with illustration, steps, and primary CTA
- Existing users: "Completa configurazione agente X", "Ricarica crediti", etc.

**Zone C — I Tuoi Agenti** (main content)
- Grid of agent cards (reuses AgentCard component) with score badge
- Shows ALL agents (not just 3), with status dots prominent
- If no agents: onboarding empty state with guided steps

**Zone D — Attività Recente** (bottom)
- Compact list of last 5 conversations (simplified table, no "Stato" column)
- Link to full conversations page

**Removed from dashboard:**
- Quick Actions bar (4 colored blocks) — replaced by contextual actions in Zone B
- 5 KPI cards — replaced by 3 inline status pills
- Usage/Trial/Credits triple card — replaced by status pills + sidebar credit widget
- Contacts by Status — belongs in Contacts page
- Upcoming Calls — belongs in Contacts page

#### 3. Empty State / First-Time Experience

When `agents.length === 0`:
- Dashboard shows a single full-width onboarding card
- Headline: "Benvenuto in Edile Genius"
- Subtitle: "Crea il tuo primo agente AI in 3 minuti"
- 3 visual steps: "Scegli un template → Configura la voce → Attiva"
- Primary CTA button: "Crea il Primo Agente"
- Secondary: "Scopri i Template"

#### 4. Microcopy Improvements

| Location | Before | After |
|----------|--------|-------|
| Sidebar section | PRINCIPALE | PANORAMICA |
| Sidebar item | Agenti AI | Tutti gli Agenti |
| Sidebar section | AUTOMAZIONI | (removed) |
| Sidebar item | Knowledge Base | Archivio Conoscenze |
| Sidebar item | Analytics | Report e Statistiche |
| Sidebar item | Crediti & Utilizzo | Crediti e Piano |
| Dashboard heading | Agenti Recenti | I Tuoi Agenti |
| Dashboard heading | Conversazioni Recenti | Attività Recente |
| Dashboard heading | Prossime Azioni | Da Fare Adesso |
| Breadcrumb | Analytics | Report |
| Breadcrumb | Knowledge Base | Archivio |

#### 5. Files Modified

1. **`src/components/layout/SidebarNav.tsx`** — Restructure `companyNav` sections, rename labels
2. **`src/pages/app/Dashboard.tsx`** — Rewrite layout into 4 zones, add onboarding empty state, simplify KPIs to status pills, remove low-value sections
3. **`src/components/layout/AppBreadcrumb.tsx`** — Update `labelMap` with new names
4. **`src/components/layout/Topbar.tsx`** — Minor: add page title display on mobile

