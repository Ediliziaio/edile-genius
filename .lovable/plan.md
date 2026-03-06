

# Gap Analysis & Implementation Plan

After comparing the PDF specification against the current codebase, here are the missing features organized by priority.

## Already Implemented (Confirmed)
- Login page, Shell layout, Sidebar navigation
- Dashboard (company + superadmin) with quick actions, stats, trial info, contacts by status, upcoming calls
- Agent CRUD: list, create wizard (4 steps), detail page with tabs (Config, Voice Test, Conversations, Analytics, Integration, Knowledge Base)
- Contacts: table view, filters (status/priority/sector), search, pagination, bulk actions (delete/status/assign agent/add to list), side panel detail (Info/Calls/Notes/Activity), CSV export
- Contact Lists: CRUD with color picker
- Import Contacts: 3-step wizard with CSV upload, column mapping, batch insert
- Campaigns: list, 4-step creation wizard, detail page with live stats and controls
- Conversations: table with filters, transcript viewer
- Settings: Profile, API Key, Webhooks, Notifications tabs
- Impersonation system
- Webhook system (DB + Edge Function + UI)

## Missing Features to Implement

### 1. Contacts Page Enhancements
- **View toggle** (Table / Kanban / Cards) as specified in the document
- **Kanban view**: 5 columns by status, drag-and-drop to change status, contact cards with name/phone/sector/priority badges
- **Card view**: 3-column grid with richer contact cards
- **Per-row action menu** (dropdown with: Modifica, Aggiungi a Lista, Pianifica Chiamata, Vedi Chiamate, Segna Non Chiamare, Elimina)
- **"Pianifica Chiamata"** bulk action (set `next_call_at`)
- **Priority "urgent" level** with colored indicators (🔴 Urgente, 🟠 Alta, ⚪ Normale/Media, 🔵 Bassa)
- **Source badge** display in table rows
- **Subtitle stats**: "N contatti · N da chiamare · N qualificati"

### 2. Contact Lists Enhancements
- **Icon/emoji picker** in create dialog (📋📞🏠☀🪟🏢🎯⭐🔥💼🔑📊)
- **"Vedi Contatti"** and **"Crea Campagna →"** action buttons on each list card
- **List detail page** (`/app/lists/:id`) showing list members with ability to add/remove contacts

### 3. Missing SuperAdmin Pages (stub/placeholder)
- `/superadmin/team` — Team management page
- `/superadmin/settings` — SuperAdmin settings
- `/superadmin/analytics` — Global analytics
- `/superadmin/api-keys` — API keys management
- `/superadmin/logs` — System logs

### 4. Minor UI Fixes
- Dashboard subtitle: show company name + plan + trial days remaining
- Settings: add "Piano & Fatturazione" placeholder tab

---

## Implementation Details

### Task 1: Contacts View Toggle + Kanban + Cards
**Files**: `src/pages/app/Contacts.tsx`

- Add `viewMode` state: `"table" | "kanban" | "cards"`
- Add 3 toggle buttons in the filter bar area
- **Kanban**: Render columns for each status, each column scrollable, cards showing name/phone/badges. On card drop (simple onClick status change for now since drag-and-drop libraries aren't installed), update contact status
- **Cards**: 3-column grid with richer card layout showing all contact info
- Add per-row dropdown menu with actions (Modifica opens detail panel, Pianifica Chiamata sets `next_call_at`, Segna Non Chiamare updates status)
- Add "Pianifica Chiamata" bulk action with datetime picker
- Update priority to include "urgent" with visual indicators
- Add source badge chips in table

### Task 2: Contact Lists Enhancements
**Files**: `src/pages/app/ContactLists.tsx`, new `src/pages/app/ContactListDetail.tsx`

- Add emoji icon picker to create dialog
- Add "Vedi Contatti" and "Crea Campagna" buttons to list cards
- Create list detail page showing members with remove capability
- Register route `/app/lists/:id` in `App.tsx`

### Task 3: SuperAdmin Stub Pages
**Files**: New pages in `src/pages/superadmin/`

- Create `Team.tsx`, `SASettings.tsx`, `GlobalAnalytics.tsx`, `ApiKeys.tsx`, `SystemLogs.tsx` as placeholder pages
- Register all routes in `App.tsx`

### Task 4: Dashboard + Settings Minor Enhancements
**Files**: `src/pages/app/Dashboard.tsx`, `src/pages/app/Settings.tsx`

- Dashboard: Add company name and trial days to subtitle
- Settings: Add "Piano & Fatturazione" placeholder tab

---

## Estimated Scope
- ~4 files modified, ~6 new files created
- No database migrations needed (all columns already exist)
- No new Edge Functions needed

