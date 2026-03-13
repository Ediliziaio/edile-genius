

# Render Facciata — Doc 5/5: Integrazioni Finali

## Changes

### 1. Upgrade `RenderFacciataHub.tsx`
Rewrite with tab switcher ("Come funziona" / "Galleria"), keeping existing patterns (`useCompanyId`, `supabase` client import). Add:
- Tab state switching between how-it-works and gallery views
- Gallery grid with hover overlay (download + delete)
- Supported intervention types list in how-it-works tab
- Keep existing credits widget and hero section

### 2. Add `FACADE_QUALITY_SUFFIX` to `facciataPromptBuilder.ts`
- Export new `FACADE_QUALITY_SUFFIX` constant with photorealism checklist and Italian building reference dimensions
- Add it to `buildFacciataPrompt()` after `buildBlock_H_QualityRules()` and before notes

### 3. Keep `StiliProntiFacciata.tsx` as-is
The `render_facciata_stili_pronti` DB table doesn't exist in the schema and creating it requires a migration. The component already works with static data from `facciataPresets.ts`. No change needed — the DB table from the prompt is aspirational for future migration.

### 4. Sidebar already has Render Facciata
Line 53 of `SidebarNav.tsx` already includes `{ label: "Render Facciata", icon: Home, href: "/app/render-facciata" }`. No change needed.

## Files to modify
- `src/pages/app/RenderFacciataHub.tsx` — rewrite with tabs
- `src/modules/render-facciata/lib/facciataPromptBuilder.ts` — add quality suffix + update buildFacciataPrompt

