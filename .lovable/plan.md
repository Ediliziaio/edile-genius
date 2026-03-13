

# Render Tetto Doc 5/5 — Hub + DB Stili + Route Fix

## What's already done
- `RenderTettoNew` page + route at `/app/render-tetto/new` ✓
- Sidebar nav entry (currently pointing to `/app/render-tetto/new`) ✓
- Lazy import for `RenderTettoNew` ✓
- No `RenderTettoHub` page or `/app/render-tetto` route exists yet

## What's needed

### 1. Create `src/pages/app/RenderTettoHub.tsx`
Hub page following `RenderStanzaHub` pattern with:
- Hero section with amber theme, stats badges (12 manto types, lucernari, gronde)
- Two tabs: "gallery" (render history from `render_tetto_sessions`) and "info" (how it works, materials, use cases)
- Gallery fetches sessions with `result_url` not null, displays `RenderTettoResultCard` cards
- Empty state with CTA to create first render
- Uses `useAuth()` to gate gallery query

### 2. Update `src/App.tsx`
- Add lazy import for `RenderTettoHub`
- Add route `/app/render-tetto` before the existing `/app/render-tetto/new` route

### 3. Update `src/components/layout/SidebarNav.tsx`
- Change sidebar href from `/app/render-tetto/new` to `/app/render-tetto` (hub page)

### 4. Insert 8 preset styles into `render_tetto_stili_pronti`
The DB column is `config` (not `config_json`). Will insert 8 styles via data insert tool:
- Classico Toscano, Ardesia Nordica, Lamiera Contemporanea, Tetto Piano TPO, Solar Roof, Rame e Ardesia, Verde Alpino, Mansarda Luminosa

### Files
- **Create**: `src/pages/app/RenderTettoHub.tsx`
- **Edit**: `src/App.tsx` (add lazy import + route)
- **Edit**: `src/components/layout/SidebarNav.tsx` (fix href)
- **Data insert**: 8 rows into `render_tetto_stili_pronti`

