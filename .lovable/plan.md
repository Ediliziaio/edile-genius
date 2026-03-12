

# Bulk Calling + Contact Call Analytics

## Overview

Two additions: (1) a "Chiama X contatti" bulk action button in the existing bulk toolbar on Contacts.tsx, with a new BulkCallModal component, and (2) a call analytics section in ContactDetailPanel showing KPIs, outcome distribution, and sentiment breakdown.

## 1. Database Migration

**RPC function `launch_bulk_calls`**: Accepts array of contact IDs, agent_id, optional scheduled_at, notes. Loops through contacts, skips DNC and duplicates (pending scheduled_calls within 1 hour), inserts into `scheduled_calls` with staggered timing (30s apart for immediate, 1min for scheduled). Returns JSON with queued/skipped counts. `SECURITY DEFINER`, max 200 contacts.

No view needed — analytics will be queried directly from `outbound_call_log` with aggregation on the client side (simpler, avoids view + `my_company()` issues in migrations).

## 2. New Component: `BulkCallModal.tsx`

- Dialog showing selected contact count, DNC/no-phone breakdown
- Agent selector (outbound-enabled agents with `el_phone_number_id`)
- Schedule toggle with datetime-local input
- Optional notes field
- Calls `launch_bulk_calls` RPC
- Shows result screen with queued/skipped/error counts

Key adaptation from prompt: Uses `agents` table (not `elevenlabs_agents`), `full_name` (not `name`), `useCompanyId()` hook, existing `supabase` client.

## 3. Update `Contacts.tsx`

- Import `BulkCallModal`
- Add `showBulkCallModal` state
- Add a green "Chiama X contatti" button in the existing bulk action bar (line ~497, after "Pianifica Chiamata")
- Mount `BulkCallModal` at bottom of return

Minimal change — the selection system and bulk toolbar already exist.

## 4. Update `ContactDetailPanel.tsx`

Add a "Statistiche Chiamate" section after the existing `CallHistorySection`. Query `outbound_call_log` for the contact with aggregation computed client-side:
- Total calls, calls last 30d/7d
- Avg/max duration
- Outcome counts (answered, no_answer, busy, voicemail, failed)
- Sentiment counts (positive, neutral, negative)
- Conversion rate, best call hour
- Outcome distribution bars + sentiment summary

This avoids creating a DB view and keeps it simple.

## 5. Update `execute-scheduled-calls`

Increase batch to 10, process in parallel chunks of 5 with `Promise.allSettled`, add 1s pause between chunks.

## Files

| File | Action |
|------|--------|
| Migration SQL | Create `launch_bulk_calls` RPC |
| `src/components/contacts/BulkCallModal.tsx` | **New** |
| `src/pages/app/Contacts.tsx` | Add bulk call button + mount modal |
| `src/components/contacts/ContactDetailPanel.tsx` | Add analytics section |
| `supabase/functions/execute-scheduled-calls/index.ts` | Parallel batch processing |

