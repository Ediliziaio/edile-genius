

# Dashboard "Chiamate Attive" Widget

## Status

- **Real-time toast notifications**: Already fully implemented (`useCallNotifications` hook mounted in `Shell.tsx`). No changes needed.
- **Dashboard active calls widget**: Not yet added. This is the only remaining work.

## Plan

Add a live "Chiamate Attive" widget to `src/pages/app/Dashboard.tsx`, inserted before the "Risultati del Mese" section (line ~872).

**What it does:**
- Queries `outbound_call_log` for calls with `status IN ('initiated','ringing','in_progress')` in the last 2 hours (same pattern as CallMonitor)
- Subscribes to Supabase Realtime for live updates
- Shows a card with pulsing green dot, count of active calls, and up to 3 call summaries (contact name, agent, status)
- "Vedi monitor completo →" link to `/app/call-monitor`
- Hidden when no active calls (keeps dashboard clean)

**Changes to `Dashboard.tsx`:**
1. Add a `useQuery` for active calls + a Realtime `useEffect` subscription (reuses existing `companyId` and `queryClient`)
2. Insert widget JSX before the "ZONA D" section
3. No new files needed — self-contained in Dashboard

| File | Action |
|------|--------|
| `src/pages/app/Dashboard.tsx` | Add active calls query + Realtime + widget UI |

