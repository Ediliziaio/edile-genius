

# Doc 7/7: Hub + Sidebar Integration

## Analysis

The codebase already has all the component pages needed:
- `PreventiviList` at `/app/preventivi`
- `NuovoPreventivo` at `/app/preventivi/nuovo`
- `KnowledgeBasePreventivo` at `/app/preventivo-kb`
- `PreventivoTemplateList` at `/app/preventivi/templates`
- `PreventivoTemplateBuilder` at `/app/preventivi/templates/:id` and `/nuovo`

What's missing is a **Hub page** that unifies KB + Templates + Stats into one entry point, and better **sidebar navigation** for the preventivo module.

No `progetti` or `azienda_members` tables exist -- the system uses `company_id` from profiles. The email edge function requires `RESEND_API_KEY` which is not configured, so it will be created but won't work until the user adds that secret.

## Plan

### 1. Create Hub page `src/pages/app/PreventivoHub.tsx`
- Three tabs: Overview, Knowledge Base, Template
- Overview: KPI cards (total, inviati, accettati, valore), recent preventivi list, quick action cards
- KB tab embeds existing `KnowledgeBasePreventivo` content inline
- Template tab embeds existing `PreventivoTemplateList` content inline
- "Nuovo preventivo" CTA button
- "Come funziona" onboarding section shown when no preventivi exist

### 2. Add route in `src/App.tsx`
- Add `/app/preventivo-hub` route pointing to new Hub page

### 3. Update sidebar navigation in `src/components/layout/SidebarNav.tsx`
- Replace the "VENDITE AVANZATE" section items with:
  - Hub Preventivi → `/app/preventivo-hub`
  - Tutti i Preventivi → `/app/preventivi`
  - Knowledge Base → `/app/preventivo-kb`
  - Template → `/app/preventivi/templates`

### 4. Create email edge function `supabase/functions/invia-preventivo-email/index.ts`
- Auth check, loads preventivo + company data
- Builds branded HTML email
- Sends via Resend API (requires `RESEND_API_KEY` secret)
- Updates preventivo stato to `inviato`

### Files
- **Create**: `src/pages/app/PreventivoHub.tsx`
- **Create**: `supabase/functions/invia-preventivo-email/index.ts`
- **Edit**: `src/App.tsx` (add hub route)
- **Edit**: `src/components/layout/SidebarNav.tsx` (update menu items)

