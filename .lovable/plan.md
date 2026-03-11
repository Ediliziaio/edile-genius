

# Fix: Show KPI Cards Even With Zero Agents

## Problem
The dashboard hides the entire KPI section when `agents.length === 0`. The user only sees the onboarding card, which doesn't feel like a dashboard.

## Solution
Always show the 4 KPI cards regardless of agent count. They'll display zeros, but the user will see a real dashboard structure. The onboarding card stays visible below the KPIs when there are no agents.

## Changes — `src/pages/app/Dashboard.tsx`

1. **Remove the `{hasAgents && ...}` wrapper** around the KPI grid (line 203). Always render the 4 KPI cards.

2. **Remove the `{hasAgents && monthTotal > 0 && ...}` wrapper** around "Risultati del Mese" (line 344). Show it always — if all counts are 0, the pills will show zeros which is fine (it sets expectations).

3. **Remove the `{hasAgents && monthTotal === 0 && ...}` empty state block** (lines 357-366) — no longer needed since the results section always shows.

4. **Keep the onboarding checklist** visible when 0 agents (no change needed there).

Result: The user always sees Hero → 4 KPI Cards → Smart Actions/Onboarding → Results → Activity Table. A proper dashboard layout at all times.

