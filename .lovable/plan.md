

# Add Missing Render Agent Templates

## Problem
The agent template gallery (`/app/agents/new`) only has 2 active render templates (Infissi and Bagno). Render Facciate exists but is marked as "PROSSIMAMENTE" with `disabled: true`. Render Persiane, Render Pavimento, and Render Stanza are completely missing.

## Changes

### Edit `src/pages/app/CreateAgent.tsx`

1. **Move "Render Facciate AI"** from the "prossimamente" section to "vendita" category, remove `disabled: true`, add proper KPI/result/settore fields

2. **Add 3 new templates** in the "Vendita Visiva" section (after Render Bagno):
   - **Render Persiane AI** — category: "vendita", settore: "serramenti", icon: "🪟", slug: "render-persiane"
   - **Render Pavimento AI** — category: "vendita", settore: "ristrutturazioni", icon: "🏗️", slug: "render-pavimento"
   - **Render Stanza AI** — category: "vendita", settore: "ristrutturazioni", icon: "🛋️", slug: "render-stanza", badge: "NUOVO"

Each template gets: description, kpi, result, estimated_setup_min, channel: ["visuale"], difficulty: "facile", `is_featured: true` for Stanza (flagship module).

