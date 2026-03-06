

# Phase B: Database Schema Alignment

## Overview

Rename database columns to match the design document, create new tables (contacts, contact_lists, contact_list_members, campaigns, notes), and add new RLS helper functions (`my_role()`, `my_company()`). Then update all frontend and edge function references.

## Database Migration

### Column Renames
- `companies.elevenlabs_api_key` → `el_api_key`
- `agents.elevenlabs_voice_id` → `el_voice_id`
- `agents.elevenlabs_agent_id` → `el_agent_id`
- `agents.calls_this_month` → `calls_month`
- `conversations.elevenlabs_conv_id` → `el_conv_id`

### New Functions
```sql
-- Shorthand helpers replacing has_role/get_user_company_id in app code
CREATE OR REPLACE FUNCTION public.my_role()
  RETURNS app_role LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT role FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1 $$;

CREATE OR REPLACE FUNCTION public.my_company()
  RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT company_id FROM public.profiles WHERE id = auth.uid() $$;
```

Keep existing `has_role()` and `get_user_company_id()` intact (RLS policies depend on them).

### New Tables
- **contacts**: id, company_id, full_name, phone, email, source, status (lead/qualified/customer/lost), tags (jsonb), notes (text), created_at, updated_at
- **contact_lists**: id, company_id, name, description, created_at
- **contact_list_members**: id, list_id, contact_id (unique pair)
- **campaigns**: id, company_id, agent_id, contact_list_id, name, status (draft/running/paused/completed), type (outbound), scheduled_at, started_at, completed_at, config (jsonb), created_at
- **notes**: id, company_id, contact_id, conversation_id (nullable), author_id, content, created_at

All with RLS using existing `has_role()`/`get_user_company_id()` pattern.

### RLS for New Tables
Same PERMISSIVE pattern: superadmin full access + company users access their own company's data.

## Files to Modify (Column Renames)

### Edge Functions (5 files)
- `create-elevenlabs-agent/index.ts`: `elevenlabs_api_key` → `el_api_key`, `elevenlabs_voice_id` → `el_voice_id`, `elevenlabs_agent_id` → `el_agent_id`
- `update-agent/index.ts`: same renames in select/update fields and allowedFields
- `elevenlabs-conversation-token/index.ts`: `elevenlabs_api_key` → `el_api_key`
- `get-elevenlabs-voices/index.ts`: `elevenlabs_api_key` → `el_api_key`
- `create-company/index.ts`: `elevenlabs_api_key` → `el_api_key`

### Frontend Pages (8 files)
- `AgentDetail.tsx`: `elevenlabs_voice_id` → `el_voice_id`, `elevenlabs_agent_id` → `el_agent_id`, `calls_this_month` → `calls_month`
- `AgentCard.tsx`: `calls_this_month` → `calls_month`
- `Dashboard.tsx` (app): `calls_this_month` → `calls_month`
- `Settings.tsx`: `elevenlabs_api_key` → `el_api_key`
- `CompanyDetail.tsx` (superadmin): `elevenlabs_api_key` → `el_api_key`, `calls_this_month` → `calls_month`
- `Companies.tsx` (superadmin): `calls_this_month` → `calls_month`
- `SuperAdmin Dashboard.tsx`: `calls_this_month` → `calls_month`
- `VoiceTestPanel.tsx`: no column refs (uses props), no change needed

### Edge Function update-agent allowedFields
Replace `elevenlabs_voice_id` with `el_voice_id` in the allowed fields array, and update the ElevenLabs sync to read from `el_agent_id`.

## Order of Operations
1. Run migration (rename columns + create tables + create functions + RLS)
2. Update all 5 edge functions
3. Update all 8 frontend files

