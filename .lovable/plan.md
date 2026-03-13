

# Plan: Add "Render Bagno AI" template to the Agent Hub

## Problem
The Render Bagno module exists (`/app/render-bagno/new`) but there's no template card in the Agent Hub (`/app/agents/new`) to discover it. Only "Render Infissi AI" appears under "Vendita Visiva".

## Fix
Add a new entry to `STATIC_TEMPLATES` in `src/pages/app/CreateAgent.tsx`:

```typescript
{
  slug: "render-bagno", name: "Render Bagno AI",
  description: "Trasforma una foto del bagno in un render fotorealistico con nuove piastrelle, sanitari e finiture. Il cliente vede il risultato prima di ristrutturare.",
  icon: "🛁", category: "vendita", channel: ["visuale"], difficulty: "facile",
  estimated_setup_min: 5, installs_count: 0, is_featured: true, badge: "NUOVO",
  settore: "ristrutturazioni", kpi: "Conversione +35%",
  result: "→ Il cliente decide più velocemente vedendo il bagno finito",
}
```

Then in the `TemplateHubCard` click handler (~line 480+), add a routing rule so that clicking this card navigates to `/app/render-bagno/new` (similar to how "render-infissi" routes to `/app/render/new`).

## Scope
Single file change: `src/pages/app/CreateAgent.tsx` — add template entry + routing case.

