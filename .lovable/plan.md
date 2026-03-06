

# Phase 2: SuperAdmin Dashboard + Companies Management

## Overview

Build the full SuperAdmin experience: dashboard with live stats, companies table with search/filter/pagination, and a 3-step wizard to create new companies (including Supabase Auth user creation via edge function).

## RLS Issue Fix

Current RLS policies on `companies` and `agents` are set as `RESTRICTIVE` (Permissive: No). This means superadmin AND company policies must BOTH pass, which blocks all access. Need to fix these to be `PERMISSIVE` so that either policy passing grants access.

**Migration SQL:**
```sql
-- Drop restrictive policies and recreate as permissive
DROP POLICY IF EXISTS "superadmin_companies" ON public.companies;
DROP POLICY IF EXISTS "company_members_own" ON public.companies;
DROP POLICY IF EXISTS "superadmin_agents" ON public.agents;
DROP POLICY IF EXISTS "company_agents" ON public.agents;
DROP POLICY IF EXISTS "superadmin_conversations" ON public.conversations;
DROP POLICY IF EXISTS "company_conversations" ON public.conversations;
DROP POLICY IF EXISTS "users_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "users_own_roles" ON public.user_roles;

-- Recreate as PERMISSIVE
CREATE POLICY "superadmin_companies" ON public.companies FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'superadmin') OR has_role(auth.uid(), 'superadmin_user'));

CREATE POLICY "company_members_own" ON public.companies FOR SELECT TO authenticated
  USING (id = get_user_company_id(auth.uid()));

CREATE POLICY "superadmin_agents" ON public.agents FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'superadmin') OR has_role(auth.uid(), 'superadmin_user'));

CREATE POLICY "company_agents" ON public.agents FOR ALL TO authenticated
  USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "superadmin_conversations" ON public.conversations FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'superadmin') OR has_role(auth.uid(), 'superadmin_user'));

CREATE POLICY "company_conversations" ON public.conversations FOR ALL TO authenticated
  USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "users_own_profile" ON public.profiles FOR ALL TO authenticated
  USING (id = auth.uid() OR has_role(auth.uid(), 'superadmin'));

CREATE POLICY "users_own_roles" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR has_role(auth.uid(), 'superadmin'));
```

## Edge Function: `create-company`

Creates a new company + admin user (Supabase Auth) + assigns `company_admin` role + links profile to company. Uses service role key server-side.

## Files to Create

### 1. `src/pages/superadmin/Dashboard.tsx` (rewrite)
- 4 stat cards (companies count, active agents, calls this month, estimated MRR)
- Fetches aggregated data from Supabase
- Links to companies page

### 2. `src/pages/superadmin/Companies.tsx`
- Search input + sector/plan/status filter dropdowns
- DataTable with columns: Name, Sector, Plan, Status, Agents count, Calls/month, Created, Actions
- Pagination (10 per page)
- "Nuova Azienda" button → `/superadmin/companies/new`
- "Visualizza" → `/superadmin/companies/:id` (placeholder)
- "Accedi" → impersonation (future)

### 3. `src/pages/superadmin/CreateCompany.tsx`
- 3-step wizard with progress bar
- Step 1: Company info (name, sector, admin email, temp password, plan selection as radio cards)
- Step 2: ElevenLabs API key input + test connection button
- Step 3: Summary + confirm
- On submit: calls `create-company` edge function

### 4. `supabase/functions/create-company/index.ts`
- Receives: company name, slug, sector, plan, admin email, password, elevenlabs_api_key
- Creates company record
- Creates auth user via `supabase.auth.admin.createUser`
- Updates profile with company_id
- Inserts `company_admin` role in user_roles
- Returns created company

### 5. `src/components/superadmin/StatsCard.tsx`
- Reusable metric card: icon, value, label, delta chip

### 6. `src/components/superadmin/CompanyTable.tsx`
- Table component with company rows, status badges, action buttons

## Files to Modify

### `src/App.tsx`
Add routes:
- `/superadmin/companies` → Companies list
- `/superadmin/companies/new` → CreateCompany wizard

## Design Notes
- All components use the dark-app CSS variables
- Tables: bg-tertiary, header bg-elevated, rows with hover
- Wizard progress bar: 3 circles with connecting lines
- Status badges: active=green, suspended=red, trial=orange
- Plan radio cards: starter/professional/enterprise with pricing

