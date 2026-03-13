

# Render Tetto Doc 4/5 — Advanced Components

## Key Adaptations

- The DB table `render_tetto_stili_pronti` uses column `config` (not `config_json`), plus has `emoji`, `preview_hex`, `tags` fields. The `StiliProntiTetto` component will use the actual DB schema.
- The prompt uses `date-fns` with `formatDistanceToNow` in `RenderTettoResultCard` — this library is already available in the project.
- The prompt's JSX is broken/incomplete HTML in many places — will reconstruct proper JSX from the intent described.

## Plan

### 1. Create `src/modules/render-tetto/components/TettoAnalisiCard.tsx`
Analysis card with compact and full modes. Full mode shows color bar at top, grid of info (tipo, falde, manto, pendenza, lucernari, gronde, note). Compact mode shows inline badges.

### 2. Create `src/modules/render-tetto/components/StiliProntiTetto.tsx`
React Query fetch from `render_tetto_stili_pronti` where `attivo = true`, ordered by `ordine`. Filters by `tipo_tetto` array compatibility. Uses actual DB column `config` (not `config_json`). Grid layout with preview images or color-based placeholders. Badge showing count of active modifications per style.

### 3. Create `src/modules/render-tetto/components/MantoQuickSelect.tsx`
Grid of emoji buttons for quick manto type selection. Filters options based on `tipoTetto` (piano vs falde). Amber-themed selection state.

### 4. Create `src/modules/render-tetto/components/RenderTettoResultCard.tsx`
Gallery card with aspect-video thumbnail, hover overlay with download/featured actions, before/after toggle, chips for active modifications (manto/gronde/lucernari), relative date display.

### 5. Create `src/modules/render-tetto/components/ModificheActiveBadge.tsx`
Horizontal row of colored badges for each active config section. Clickable with optional `onScrollTo` callback.

### 6. Create `src/modules/render-tetto/components/MaterialePreview.tsx`
CSS pattern-based visual preview for each of the 12 manto types. `adjustColor` utility for pattern variations. Finitura affects brightness/opacity.

### Files
- **Create**: 6 component files in `src/modules/render-tetto/components/`

