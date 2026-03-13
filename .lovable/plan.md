

# Fix Render Template Routing Bugs

## Problem
Two routing bugs cause all render templates (except Infissi and Bagno) to open the wrong page:

1. **`CreateAgent.tsx` line 458-471**: `handleClick` only has explicit routes for `render-infissi` and `render-bagno`. The other 4 slugs (`render-facciate`, `render-persiane`, `render-pavimento`, `render-stanza`) fall through to the agent wizard (`/app/agents/new/${slug}`).

2. **`AgentTemplateWizard.tsx` line 192-194**: The wizard's fallback for render-type agents always redirects to `/app/render/new` (infissi) instead of the correct module URL.

## Fix

### Edit `src/pages/app/CreateAgent.tsx` (lines 458-471)
Replace the `handleClick` with a slug-to-route map for all 6 render modules:

```typescript
const RENDER_ROUTES: Record<string, string> = {
  "render-infissi": "/app/render/new",
  "render-bagno": "/app/render-bagno/new",
  "render-facciate": "/app/render-facciata/new",
  "render-persiane": "/app/render-persiane/new",
  "render-pavimento": "/app/render-pavimento/new",
  "render-stanza": "/app/render-stanza/new",
};
```

In `handleClick`, check `RENDER_ROUTES[t.slug]` first, navigate to it if found. Remove the individual `render-infissi`/`render-bagno` if-blocks.

### Edit `src/pages/app/AgentTemplateWizard.tsx` (lines 192-197)
Replace the single `/app/render/new` redirect with a slug-based route map (same as above), so if someone lands on `/app/agents/new/render-stanza` it redirects to `/app/render-stanza/new` instead of `/app/render/new`.

## Files Changed
- `src/pages/app/CreateAgent.tsx`
- `src/pages/app/AgentTemplateWizard.tsx`

