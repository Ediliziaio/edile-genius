

## Analysis: What's Already Implemented vs What's Missing

After reviewing the entire codebase, **most of the 12 prompts are already fully implemented**:

- **Prompt 1** (KB file upload): Already working — `uploadFileToStorage()` uploads to `knowledge-docs`, inserts in DB, invokes `add-knowledge-doc`
- **Prompt 2** (Dashboard): Already has agent name joins, appointment rate, credits widget, next actions
- **Prompt 3** (Create Agent wizard): Already has multi-step wizard with StepAgent, StepVoice, StepConversation, StepReview
- **Prompt 4** (SuperAdmin Dashboard): Already has full economics dashboard with KPIs, charts, credit health table
- **Prompt 5** (BuyPhoneNumber): Already has 4-step Twilio import flow
- **Prompt 6** (AgentKnowledgeTab): Already has file upload + sync functionality
- **Prompt 7** (Campaigns): Already has 4-step wizard with scheduling
- **Prompt 8** (RenderHub): Already has hero section, steps, gallery, credits widget
- **Prompt 9** (Settings): Already has Profile, API, CRM, Webhooks, Notifications, Billing tabs
- **Prompt 11** (CRM Integration): Already implemented with HubSpot, Salesforce, Pipedrive
- **Prompt 12** (Templates): Static templates already exist in CreateAgent

### What's genuinely missing:

**Prompt 10 — Mobile responsive Shell + Global Search (Cmd+K)**

This is the only significant gap. Currently:
- Shell has no mobile responsiveness — sidebar is fixed at 240px with no hamburger menu
- Topbar has no hamburger trigger or mobile handling
- No Cmd+K global search dialog
- No breadcrumbs

---

## Implementation Plan

### 1. Mobile-responsive Shell + Sidebar drawer

**Shell.tsx**: Detect mobile via `useMobile()` hook. On mobile, hide sidebar, show it via `Sheet` (left side drawer).

**Topbar.tsx**: Add hamburger `Menu` icon on mobile (left side), pass `onMenuOpen` callback to trigger the Sheet. Add Cmd+K search trigger button.

**Sidebar.tsx**: Extract nav content into a shared component. On desktop: render as-is. On mobile: render inside Sheet.

### 2. Global Search (Cmd+K)

Create `src/components/layout/GlobalSearch.tsx` using the already-installed `cmdk` package:
- `Cmd+K` / `Ctrl+K` keyboard shortcut opens a `CommandDialog`
- Search across agents, contacts, campaigns, conversations using Supabase queries
- Results grouped by category with icons
- Navigate to selected result on Enter/click

### 3. Breadcrumbs

Add breadcrumb generation in Shell based on current route path, using shadcn `Breadcrumb` component. Map route segments to Italian labels.

---

### File Changes

| File | Change |
|------|--------|
| `src/components/layout/Shell.tsx` | Add mobile detection, Sheet for sidebar drawer, breadcrumb |
| `src/components/layout/Topbar.tsx` | Add hamburger button on mobile, Cmd+K trigger, low-credit badge |
| `src/components/layout/Sidebar.tsx` | Extract nav into reusable component, accept `onClose` prop for mobile |
| `src/components/layout/GlobalSearch.tsx` | New — CommandDialog with multi-entity search |
| `src/components/layout/AppBreadcrumb.tsx` | New — Route-based breadcrumb component |

No database changes needed. No edge functions needed.

