

# Phase 4: SuperAdmin Company Detail + Company Settings

## Overview

Two new pages: (1) SuperAdmin company detail page at `/superadmin/companies/:id` showing full company info, agents list, stats, and ElevenLabs config; (2) Company Settings page at `/app/settings` for company users to manage profile, API key, and notification preferences.

## Critical: RLS Policies Still RESTRICTIVE

All RLS policies remain `Permissive: No` (RESTRICTIVE) despite 3 previous migration attempts. This blocks all data access. Will include another migration with `AS PERMISSIVE` explicit clause. If it still fails, the `rls_auto_enable` event trigger may need investigation.

## Files to Create

### 1. `src/pages/superadmin/CompanyDetail.tsx`
- Fetches company by `:id` param from `companies` table
- Fetches agents for that company from `agents` table
- Fetches conversations count for that company
- **Header**: Company name, status badge, plan badge, back button
- **Stats row**: 4 StatsCards (agents count, active agents, calls this month, total conversations)
- **Tabs** (Radix Tabs):
  - **Panoramica**: Company info card (name, sector, plan, status, created_at, slug), ElevenLabs API key status (configured/not), admin user info
  - **Agenti**: Table of agents for this company (name, status, use_case, calls, last_call_at) with link to agent detail
  - **Configurazione**: Edit company fields (name, sector, plan, status, ElevenLabs API key) with save button that updates `companies` table directly via Supabase client (superadmin has full access)

### 2. `src/pages/app/Settings.tsx`
- Fetches company data using `profile.company_id`
- **Tabs**:
  - **Profilo**: Edit full_name, email (read-only), avatar_url. Save updates `profiles` table
  - **API & Integrazioni**: Show/edit ElevenLabs API key (masked input with show/hide toggle). Save updates `companies.elevenlabs_api_key`. Test connection button calls `get-elevenlabs-voices` to verify key works
  - **Notifiche**: Toggle switches for email notifications preferences (stored in `companies.settings` JSONB): new_conversation, daily_report, weekly_report. Save updates `companies.settings`

## Files to Modify

### `src/App.tsx`
Add routes:
- `/superadmin/companies/:id` → CompanyDetail (inside superadmin AuthGuard)
- `/app/settings` → Settings (inside company AuthGuard)

### No sidebar changes needed
Sidebar already has links to `/superadmin/companies/:id` (via CompanyTable Eye button) and `/app/settings`.

## Database Migration

Fix RLS one more time with explicit `AS PERMISSIVE`:

```sql
DROP POLICY IF EXISTS "superadmin_companies" ON public.companies;
DROP POLICY IF EXISTS "company_members_own" ON public.companies;
DROP POLICY IF EXISTS "superadmin_agents" ON public.agents;
DROP POLICY IF EXISTS "company_agents" ON public.agents;
DROP POLICY IF EXISTS "superadmin_conversations" ON public.conversations;
DROP POLICY IF EXISTS "company_conversations" ON public.conversations;
DROP POLICY IF EXISTS "users_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "users_own_roles" ON public.user_roles;

CREATE POLICY "superadmin_companies" ON public.companies AS PERMISSIVE FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'superadmin') OR has_role(auth.uid(), 'superadmin_user'));
CREATE POLICY "company_members_own" ON public.companies AS PERMISSIVE FOR SELECT TO authenticated
  USING (id = get_user_company_id(auth.uid()));
CREATE POLICY "company_update_own" ON public.companies AS PERMISSIVE FOR UPDATE TO authenticated
  USING (id = get_user_company_id(auth.uid()));

CREATE POLICY "superadmin_agents" ON public.agents AS PERMISSIVE FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'superadmin') OR has_role(auth.uid(), 'superadmin_user'));
CREATE POLICY "company_agents" ON public.agents AS PERMISSIVE FOR ALL TO authenticated
  USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "superadmin_conversations" ON public.conversations AS PERMISSIVE FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'superadmin') OR has_role(auth.uid(), 'superadmin_user'));
CREATE POLICY "company_conversations" ON public.conversations AS PERMISSIVE FOR ALL TO authenticated
  USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "users_own_profile" ON public.profiles AS PERMISSIVE FOR ALL TO authenticated
  USING (id = auth.uid() OR has_role(auth.uid(), 'superadmin'));
CREATE POLICY "users_own_roles" ON public.user_roles AS PERMISSIVE FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR has_role(auth.uid(), 'superadmin'));
```

Note: Added `company_update_own` policy so company admins can update their own company record (for settings/API key changes).

## Design Notes
- Same dark theme with `hsl(var(--app-*))` variables
- CompanyDetail reuses `StatsCard` component
- Settings uses card-based layout with sections
- API key input: password type with eye toggle to reveal, masked by default
- Test connection button shows success/error toast
- Notification toggles use Switch components

