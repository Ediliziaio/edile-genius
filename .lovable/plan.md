

# "Chiama Contatto" — Full Call System Implementation

## Overview
End-to-end call system: click "Chiama" on a contact → select agent → pass dynamic variables → initiate call via ElevenLabs → auto-update CRM post-call. Includes scheduled calls and call history.

## 1. Database Migration

**New table**: `scheduled_calls` with FK to contacts, agents, outbound_call_log. RLS by company.

**Alter `contacts`**: Add columns `last_call_at`, `last_call_outcome`, `last_call_duration_sec`, `last_call_agent_id`, `call_count`, `best_call_time`, `do_not_call`, `do_not_call_reason`, `ai_call_notes`. Note: `next_call_at` already exists.

**Alter `outbound_call_log`**: Add columns `contact_id`, `el_conversation_id`, `outcome`, `sentiment`, `ai_summary`, `transcript`, `dynamic_variables`.

**New RPC**: `update_contact_after_call()` — atomically updates contact fields after a call completes.

**RLS**: `scheduled_calls` policy using `my_company()`.

**Note**: The pg_cron job for `execute-scheduled-calls` must be configured manually via SQL Editor (per project constraint).

## 2. New Component: `CallContactModal.tsx`

Full-featured modal with:
- Agent selector (only outbound-enabled agents with phone numbers)
- Auto-populated dynamic variables from contact data (name, company, city, sector, etc.)
- Editable variable overrides
- Operator notes field
- Toggle: call now vs schedule for later (with calendar + time picker)
- DNC guard (shows warning if `do_not_call = true`)
- Calls `elevenlabs-outbound-call` Edge Function with `contact_id` and `dynamic_variables`
- Schedule mode inserts into `scheduled_calls` table

## 3. Update `Contacts.tsx`

- Import and mount `CallContactModal`
- Add green Phone button in table row actions (between checkbox and name, or in actions column)
- Add "Ultima chiamata" column showing relative time
- State: `callModalContact` to control the modal
- DNC contacts show red PhoneOff icon

## 4. Update `elevenlabs-outbound-call/index.ts`

- Accept `contact_id` from request body
- DNC check: if `contact_id` provided, verify `do_not_call !== true`
- Save `contact_id`, `el_conversation_id`, `dynamic_variables` in `outbound_call_log` insert
- Return `call_log_id` in response for frontend tracking

## 5. Update `elevenlabs-webhook/post-call-actions.ts`

Enhance post-call pipeline:
- After existing `process_post_call_atomic`, also look up `outbound_call_log` by conversation_id
- If `contact_id` found, call `update_contact_after_call` RPC with outcome, duration, sentiment, AI summary
- Update `outbound_call_log` with outcome, sentiment, ai_summary, transcript, duration
- Add helper functions: `analyzeSentiment()`, `determineOutcome()`, `suggestNextCallTime()`

## 6. Update `elevenlabs-webhook/summary.ts`

Add `generateItalianCallSummary()` function for CRM-oriented summaries (shorter, action-focused, Italian).

## 7. New Edge Function: `execute-scheduled-calls`

- Picks up pending scheduled calls where `scheduled_at <= now()`
- Optimistic locking: update status to 'calling' with `eq('status', 'pending')` guard
- DNC check before calling
- Calls `elevenlabs-outbound-call` internally via fetch
- Updates scheduled_call status to completed/failed
- Add to `config.toml` with `verify_jwt = false`

## 8. Update `ContactDetailPanel.tsx`

Add "Storico chiamate" section:
- Query `outbound_call_log` filtered by `contact_id`
- Show outcome badge, sentiment emoji, duration, AI summary, agent name
- Show next scheduled call if `next_call_at` is future

## Files Created/Modified

| File | Action |
|------|--------|
| Migration SQL | Create `scheduled_calls`, alter `contacts` + `outbound_call_log`, create RPC |
| `src/components/contacts/CallContactModal.tsx` | **New** — call modal component |
| `src/pages/app/Contacts.tsx` | Add call button + modal integration |
| `src/components/contacts/ContactDetailPanel.tsx` | Add call history section |
| `supabase/functions/elevenlabs-outbound-call/index.ts` | Accept contact_id, DNC check |
| `supabase/functions/elevenlabs-webhook/post-call-actions.ts` | CRM auto-update pipeline |
| `supabase/functions/elevenlabs-webhook/summary.ts` | Add Italian summary function |
| `supabase/functions/execute-scheduled-calls/index.ts` | **New** — scheduled call executor |
| `supabase/config.toml` | Add execute-scheduled-calls entry |
| `src/integrations/supabase/types.ts` | Auto-updated after migration |

