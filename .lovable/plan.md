

# Real-Time Call Notifications + Dashboard Active Calls Widget

## 1. Real-Time Toast Notifications on Call Status Change

**Where**: New hook `src/hooks/useCallNotifications.ts` — mounted once in `Shell.tsx`.

Subscribes to Supabase Realtime `postgres_changes` on `outbound_call_log` filtered by `company_id`. On `UPDATE` events, compares old vs new `status` and shows a `sonner` toast:
- `initiated → ringing`: "📞 Chiamata a {contact} in corso..."
- `ringing → in_progress` or `initiated → in_progress`: "🟢 {contact} ha risposto!"
- `* → completed/ended`: "✅ Chiamata con {contact} completata"
- `* → failed`: "❌ Chiamata a {contact} fallita"

The hook fetches contact name from the payload's `contact_id` (join in the subscription or a quick lookup). Uses `sonner` toast (already in the project via `src/components/ui/sonner.tsx`).

**Mount point**: `Shell.tsx` — call `useCallNotifications()` inside the Shell component so it's active on all `/app/*` pages.

## 2. Dashboard "Chiamate Attive" Widget

**Where**: `src/pages/app/Dashboard.tsx` — new section between the KPI cards and the "Risultati del Mese" section.

A compact card that:
- Queries `outbound_call_log` for active calls (`status IN ('initiated','ringing','in_progress')`, last 2h) — same query pattern as CallMonitor
- Shows count with pulsing green dot when > 0
- Lists up to 3 active calls with contact name, agent, elapsed time
- "Vedi monitor completo →" link to `/app/call-monitor`
- Uses Realtime subscription to stay live (reuses the same channel pattern)
- Hidden entirely when 0 active calls (keeps dashboard clean per design memory)

## Files

| File | Action |
|------|--------|
| `src/hooks/useCallNotifications.ts` | **New** — Realtime subscription + toast |
| `src/components/layout/Shell.tsx` | Mount the hook |
| `src/pages/app/Dashboard.tsx` | Add active calls widget |

