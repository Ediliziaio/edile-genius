

# Phase 3: Company Dashboard + Agents + ElevenLabs Integration

## Critical Fix: RLS Policies Still RESTRICTIVE

The RLS policies on `companies`, `agents`, `conversations`, `profiles`, and `user_roles` are all marked `Permissive: No` (RESTRICTIVE). This means ALL policies must pass simultaneously, which blocks all data access. The Phase 2 migration may not have executed properly. A new migration will drop and recreate all policies as PERMISSIVE.

## ElevenLabs Connection

An ElevenLabs connection ("ElevenLabs Edilizia.io") exists in the workspace but is not linked to this project. Will connect it to make the `ELEVENLABS_API_KEY` available as a secret for edge functions.

## Scope

Due to the size of this phase, I recommend splitting into two sub-phases:

**Phase 3A (this build):**
1. Fix RLS policies (migration)
2. Connect ElevenLabs
3. Company Dashboard with real stats
4. Agents list page with search/filter
5. Create Agent wizard (4 steps, saves to Supabase)
6. Edge functions: `get-elevenlabs-voices`, `create-elevenlabs-agent`

**Phase 3B (next build):**
- Agent detail page with config editing
- Agent test panel with live voice (`@elevenlabs/react` useConversation)
- Conversations page
- Analytics page

## Database Migration

```sql
-- Fix RESTRICTIVE policies → PERMISSIVE
DROP POLICY IF EXISTS "superadmin_companies" ON public.companies;
DROP POLICY IF EXISTS "company_members_own" ON public.companies;
DROP POLICY IF EXISTS "superadmin_agents" ON public.agents;
DROP POLICY IF EXISTS "company_agents" ON public.agents;
DROP POLICY IF EXISTS "superadmin_conversations" ON public.conversations;
DROP POLICY IF EXISTS "company_conversations" ON public.conversations;
DROP POLICY IF EXISTS "users_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "users_own_roles" ON public.user_roles;

-- Recreate as PERMISSIVE (default)
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

## Edge Functions

### `get-elevenlabs-voices`
- Receives `company_id`, fetches company's `elevenlabs_api_key` from DB
- Proxies `GET https://api.elevenlabs.io/v1/voices` with that key
- Returns voice list (name, voice_id, preview_url, labels)

### `create-elevenlabs-agent`
- Receives `company_id` + agent config (name, voice_id, system_prompt, first_message, language, temperature)
- Fetches company's API key from DB
- Creates agent via `POST https://api.elevenlabs.io/v1/convai/agents/create`
- Updates `agents` table with `elevenlabs_agent_id`
- Returns the created agent data

## Files to Create

### Pages
- `src/pages/app/Dashboard.tsx` — Rewrite with stats (active agents, calls, appointments, leads), quick actions, recent agents list, recent conversations mini-table
- `src/pages/app/Agents.tsx` — Agent grid with search/status/type filters, agent cards with status dots, empty state
- `src/pages/app/CreateAgent.tsx` — 4-step wizard:
  - Step 1: Type selection (vocal only, operational coming soon) + use case chips
  - Step 2: Name, description, sector, language, voice picker (fetches from ElevenLabs edge function)
  - Step 3: System prompt (pre-filled templates by use case), first message, advanced settings (temperature slider, silence timeout, max duration)
  - Step 4: Summary + publish mode (active/draft)

### Components
- `src/components/agents/AgentCard.tsx` — Card with status dot, type badge, metrics, action buttons
- `src/components/agents/VoicePicker.tsx` — Fetches voices via edge function, play preview, select
- `src/components/agents/UseCaseSelector.tsx` — Grid of selectable use case chips
- `src/components/agents/PromptTemplates.ts` — Template system prompts per use case

### Edge Functions
- `supabase/functions/get-elevenlabs-voices/index.ts`
- `supabase/functions/create-elevenlabs-agent/index.ts`

## Files to Modify

### `src/App.tsx`
Add routes: `/app/agents`, `/app/agents/new`

### `supabase/config.toml`
Add function configs with `verify_jwt = false`

## Design Notes
- All components use `hsl(var(--app-*))` CSS variables (dark theme)
- Agent cards: 2-column grid on desktop, status dot with pulse animation for active
- Voice picker: horizontal scrollable cards with play button, selected state with brand border
- Wizard progress: 4 circles with connecting lines, same pattern as CreateCompany wizard
- Use case chips: pill-shaped, bg-tertiary, selected = bg brand-dim + border brand
- System prompt textarea: JetBrains Mono font, min-height 200px

