

# Real-Time Call Monitor + Scheduled Calls Management

## Overview

Two new pages: `/app/call-monitor` (live dashboard of active calls with Supabase Realtime) and `/app/scheduled-calls` (manage/reschedule/cancel scheduled calls with mini calendar). Plus sidebar entries and DB changes.

## Important Adaptations from Prompt

The prompt references `elevenlabs_agents` and `contacts.name` — these don't exist. The actual schema uses:
- `agents` table with `agents.name`
- `contacts.full_name` (not `name`)
- No `active_calls_view` or `scheduled_calls_view` — we'll query directly instead of using SQL views (views with `my_company()` can't be created via migrations, and direct queries are simpler)
- The prompt uses `useSupabaseClient()` and `useCompany()` hooks that don't exist — we'll use `useCompanyId()` and the existing `supabase` client

## 1. Database Migration

- Add `rescheduled_at TIMESTAMPTZ` and `cancelled_reason TEXT` to `scheduled_calls`
- Add index `idx_call_log_status_company` on `outbound_call_log(company_id, status)` for active calls queries
- Add index `idx_call_log_started_at` on `outbound_call_log(started_at DESC)`
- Create `cancel_scheduled_call(p_call_id, p_reason)` and `reschedule_call(p_call_id, p_new_scheduled_at)` as `SECURITY DEFINER` functions using `my_company()` for isolation

## 2. `CallMonitor.tsx` — `/app/call-monitor`

**Active calls section**: Query `outbound_call_log` where `status IN ('initiated','ringing','in_progress')` and `started_at > now() - 2h`, joined with `contacts(full_name, company_name)` and `agents(name)`. Poll every 10s + Supabase Realtime subscription on `outbound_call_log` changes for the company.

Each active call card shows:
- Status badge (initiated/ringing/in_progress) with color coding
- Live elapsed timer (useEffect with setInterval)
- Contact name, company, phone number
- Agent name
- Dynamic variables preview (first 4)

**Recent calls section**: Query today's completed calls (last 20), showing outcome badges, sentiment emojis, duration, agent name.

**Header**: Live counter badge showing number of active calls.

## 3. `ScheduledCalls.tsx` — `/app/scheduled-calls`

**Mini calendar**: Shows current month, dots on days with pending calls, click to filter list by day.

**Calls list**: Query `scheduled_calls` joined with `contacts(full_name, phone, company_name)` and `agents(name)`. Filter by status (pending/all/completed/failed/cancelled). Each card shows:
- Contact name, scheduled date/time, agent, notes
- Status badge, overdue warning if past due
- Actions: Reschedule (opens dialog with datetime-local input) and Cancel (with confirmation)

**Stats box**: Count of pending/completed/failed calls.

**Mutations**: Call `cancel_scheduled_call` and `reschedule_call` RPCs.

## 4. Routing & Sidebar

- Add lazy imports and routes in `App.tsx` for both pages
- Add "Monitor Chiamate" (Activity icon) and "Chiamate Programmate" (CalendarClock icon) to `companyNav` in `SidebarNav.tsx` under the "VENDITE" section

## Files

| File | Action |
|------|--------|
| Migration SQL | Add columns, indexes, RPC functions |
| `src/pages/app/CallMonitor.tsx` | **New** |
| `src/pages/app/ScheduledCalls.tsx` | **New** |
| `src/App.tsx` | Add 2 lazy imports + 2 routes |
| `src/components/layout/SidebarNav.tsx` | Add 2 nav items |

