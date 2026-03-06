

# Phase 3B: Agent Detail + Voice Test + Conversations + Analytics

## Overview

Build the remaining company-level experience: agent detail page with editable configuration, live voice test panel using ElevenLabs `useConversation`, conversations list, and analytics page.

## Critical RLS Issue (Still Present)

All RLS policies remain `Permissive: No` (RESTRICTIVE). This has been attempted twice but the policies are still restrictive. A new migration will drop and recreate them. This is blocking all data access for company users.

## New Dependency

Install `@elevenlabs/react` for the voice test panel (`useConversation` hook).

## Edge Function: `elevenlabs-conversation-token`

New edge function to generate a WebRTC conversation token for the voice test panel. Fetches the company's `elevenlabs_api_key` from DB, calls `https://api.elevenlabs.io/v1/convai/conversation/token?agent_id=X`, returns `{ token }`.

## Edge Function: `update-agent`

New edge function to update agent configuration both in Supabase and optionally sync changes to ElevenLabs (if `elevenlabs_agent_id` exists). Updates agent record in DB and calls ElevenLabs API to patch the agent config.

## Files to Create

### 1. `src/pages/app/AgentDetail.tsx`
Full agent detail page with tabs:
- **Overview tab**: Agent info card (name, description, status, use case, sector), stats (calls, avg duration), quick actions (activate/deactivate, test, edit)
- **Configuration tab**: Editable form (reuses same fields from CreateAgent) — name, description, sector, language, voice picker, system prompt, first message, temperature. Save button calls `update-agent` edge function
- **Test tab**: Voice test panel with `useConversation` hook. Shows connection status, speaking indicator, WaveformVisualizer, start/stop buttons. Requests mic permission and conversation token from edge function
- **Conversations tab**: Filtered list of conversations for this agent (mini version of the full conversations page)

### 2. `src/pages/app/Conversations.tsx`
Full conversations list page:
- Filter by agent (dropdown), status, outcome, date range
- Table: Agent name, caller number, duration, status, outcome, date, action (view transcript)
- Click row → dialog with transcript viewer (JSON rendered as chat bubbles)
- Empty state when no conversations

### 3. `src/pages/app/Analytics.tsx`
Analytics dashboard:
- Date range selector (7d / 30d / 90d)
- Stats row: total calls, avg duration, success rate, top outcome
- Charts (using recharts): calls over time (area chart), outcome distribution (bar chart), calls by agent (horizontal bar)
- All data from `conversations` table aggregated client-side

### 4. `src/components/agents/VoiceTestPanel.tsx`
Standalone voice test component:
- Uses `@elevenlabs/react` `useConversation` hook
- Requests mic permission with UX explanation
- Fetches conversation token from edge function
- Displays connection status, speaking state, WaveformVisualizer
- Start/Stop conversation buttons
- Transcript display (user + agent messages via `onMessage`)

### 5. `src/components/agents/AgentConfigForm.tsx`
Extracted editable agent config form (shared between CreateAgent step 2+3 and AgentDetail config tab). Fields: name, description, sector, language, voice picker, system prompt, first message, temperature slider.

### 6. `src/components/conversations/TranscriptViewer.tsx`
Dialog component that renders conversation transcript JSONB as chat-style bubbles (user messages left, agent messages right).

### 7. `supabase/functions/elevenlabs-conversation-token/index.ts`
- Auth check via `getClaims`
- Receives `agent_id` (the ElevenLabs agent ID) and `company_id`
- Fetches company's API key from DB
- Calls ElevenLabs token endpoint
- Returns `{ token }`

### 8. `supabase/functions/update-agent/index.ts`
- Auth check via `getClaims`
- Receives agent `id` + updated fields
- Updates DB record
- If agent has `elevenlabs_agent_id`, syncs config to ElevenLabs via PATCH API

## Files to Modify

### `src/App.tsx`
Add routes:
- `/app/agents/:id` → AgentDetail
- `/app/conversations` → Conversations
- `/app/analytics` → Analytics

### `src/components/agents/AgentCard.tsx`
Add `Link` to `/app/agents/${agent.id}` on click.

### `supabase/config.toml`
Add function configs for `elevenlabs-conversation-token` and `update-agent`.

## Database Migration

Fix RLS policies (third attempt — drop all and recreate as explicitly PERMISSIVE):

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

Note: Adding explicit `AS PERMISSIVE` which was missing in previous migrations. The `rls_auto_enable` event trigger may be forcing RESTRICTIVE mode — the migration will use explicit `AS PERMISSIVE` to override.

## Design Notes
- Agent detail uses tabbed layout (Radix Tabs), same dark theme variables
- Voice test panel: large centered mic button with pulse animation, WaveformVisualizer when speaking, transcript below
- Analytics charts use brand/success/info colors from CSS variables
- Transcript viewer: chat bubble style, timestamps, scrollable

