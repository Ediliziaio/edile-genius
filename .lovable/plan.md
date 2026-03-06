

# Phase 1: Database + Auth + Login + Role-Based Routing

Build the foundational layer for the EdiliziaInCloud SaaS platform.

## What We Build

1. **Database schema** — 5 tables with RLS and a security definer function for role checks
2. **Auth system** — Supabase auth with session management
3. **Login page** — Dark themed, fullscreen centered
4. **Role-based routing** — AuthGuard redirecting superadmin vs company users
5. **Basic shell layout** — Sidebar + Topbar skeleton for both roles (placeholder content)

## Database Migration

Create tables: `companies`, `profiles`, `user_roles` (separate table per security guidelines), `agents`, `conversations`.

Key design decisions:
- `user_roles` table with `app_role` enum (`superadmin`, `superadmin_user`, `company_admin`, `company_user`)
- `has_role()` security definer function to avoid RLS recursion
- `profiles` table linked to `auth.users` with trigger for auto-creation on signup
- `companies` table with `elevenlabs_api_key` stored server-side only (RLS hides it from non-admins)

```sql
-- Enum for roles
CREATE TYPE public.app_role AS ENUM ('superadmin', 'superadmin_user', 'company_admin', 'company_user');

-- Companies table
CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  sector TEXT,
  plan TEXT DEFAULT 'starter',
  status TEXT DEFAULT 'active',
  trial_ends_at TIMESTAMPTZ,
  settings JSONB DEFAULT '{}',
  elevenlabs_api_key TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID
);

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  company_id UUID REFERENCES public.companies(id),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User roles table (separate for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- Agents table
CREATE TABLE public.agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT DEFAULT 'vocal',
  status TEXT DEFAULT 'inactive',
  elevenlabs_agent_id TEXT,
  elevenlabs_voice_id TEXT,
  system_prompt TEXT,
  first_message TEXT,
  language TEXT DEFAULT 'it',
  sector TEXT,
  use_case TEXT,
  calls_total INTEGER DEFAULT 0,
  calls_this_month INTEGER DEFAULT 0,
  avg_duration_sec INTEGER DEFAULT 0,
  last_call_at TIMESTAMPTZ,
  config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID
);

-- Conversations table
CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id),
  elevenlabs_conv_id TEXT,
  caller_number TEXT,
  duration_sec INTEGER,
  status TEXT,
  transcript JSONB,
  outcome TEXT,
  metadata JSONB DEFAULT '{}',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ
);

-- Security definer function for role checks
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

-- Helper to get user's company_id
CREATE OR REPLACE FUNCTION public.get_user_company_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT company_id FROM public.profiles WHERE id = _user_id
$$;

-- Auto-create profile on signup trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'company_user');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS policies
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Profiles: users see own, superadmins see all
CREATE POLICY "users_own_profile" ON public.profiles
  FOR ALL TO authenticated
  USING (id = auth.uid() OR public.has_role(auth.uid(), 'superadmin'));

-- User roles: users see own, superadmins see all
CREATE POLICY "users_own_roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'superadmin'));

-- Companies: superadmin all, company members see own
CREATE POLICY "superadmin_companies" ON public.companies
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'superadmin') OR public.has_role(auth.uid(), 'superadmin_user'));

CREATE POLICY "company_members_own" ON public.companies
  FOR SELECT TO authenticated
  USING (id = public.get_user_company_id(auth.uid()));

-- Agents: superadmin all, company members own
CREATE POLICY "superadmin_agents" ON public.agents
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'superadmin') OR public.has_role(auth.uid(), 'superadmin_user'));

CREATE POLICY "company_agents" ON public.agents
  FOR ALL TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()));

-- Conversations: superadmin all, company members own
CREATE POLICY "superadmin_conversations" ON public.conversations
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'superadmin') OR public.has_role(auth.uid(), 'superadmin_user'));

CREATE POLICY "company_conversations" ON public.conversations
  FOR ALL TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()));
```

## Frontend Files to Create

### Auth Layer
- `src/context/AuthContext.tsx` — AuthProvider with `onAuthStateChange`, exposes user, profile, roles, company, loading state
- `src/hooks/useAuth.ts` — Re-export from context
- `src/components/auth/AuthGuard.tsx` — Checks auth + role, redirects accordingly

### Login Page
- `src/pages/Login.tsx` — Dark fullscreen login (bg `#0A0A0A`), centered card with email/password, Supabase `signInWithPassword`, error toasts, loading spinner

### Layout Shell (placeholder)
- `src/components/layout/Shell.tsx` — Sidebar + Topbar wrapper, renders `<Outlet />`
- `src/components/layout/Sidebar.tsx` — Nav items based on role (superadmin vs company)
- `src/components/layout/Topbar.tsx` — Logo, avatar dropdown with logout

### Dashboard Placeholders
- `src/pages/superadmin/Dashboard.tsx` — "SuperAdmin Dashboard" placeholder
- `src/pages/app/Dashboard.tsx` — "Company Dashboard" placeholder

### CSS
- Add dark theme CSS variables to `src/index.css` under a `.dark-app` class (platform pages only, landing stays light)

## Files to Modify

### `src/App.tsx`
Add routes:
- `/login` → Login page
- `/superadmin/*` → AuthGuard (superadmin) → Shell → nested routes
- `/app/*` → AuthGuard (company) → Shell → nested routes

### `src/components/sections/Navbar.tsx`
Update "Accedi" link to point to `/login`.

## What This Does NOT Include (future phases)
- ElevenLabs integration (voice picker, agent test panel)
- Agent creation wizard
- Conversations/Analytics pages
- Company creation wizard (SuperAdmin)
- Impersonation mode
- Edge functions
- Settings pages

