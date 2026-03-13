

# Render Facciata — Doc 4/5: Componenti Avanzati

## Current State
All 4 sub-components already exist as functional stubs. The Doc 4 request upgrades them significantly and adds a 5th component (`StiliProntiFacciata`).

## Changes

### 1. Rewrite `ColoreIntonacoSelector.tsx`
- Add collapsible color groups (popolari, bianchi, beige, ocra, caldi, grigi, verdi) with inline static data (13+ colors already present, add missing ones: `avorio_caldo`, `beige_tortora`, `beige_rosa`, `sabbia_deserto`, `ocra_pallida`, `giallo_siena`, `giallo_limone`, `arancio_veneziano`, `rosso_pompeiano`, `grigio_cemento`, `grigio_tortora`, `grigio_chiaro`, `verde_bosco`, `giallo_limone`)
- Add expandable finitura picker with emoji and sub-description (replace plain Select dropdown)
- Add selected color preview swatch at top
- Keep static data approach (no DB query — `render_facciata_presets` table doesn't exist in schema)
- Accept optional `label` prop

### 2. Rewrite `RivestimentoPicker.tsx`
- Add tab switcher (Pietra / Laterizio) instead of two separate grids
- Add CSS pattern previews for materials via `getMaterialPattern()` helper
- Add 6 zone options with emoji + sub-description as selectable cards (replace plain Select)
- Add `marcapiano` zone option (missing from current)
- Add selected material preview at top
- Keep static data (no DB queries)

### 3. Rewrite `CappottoConfigurator.tsx`
- Replace Slider with discrete spessore buttons (6, 8, 10, 12, 14, 16 cm) with visual thickness bars
- Add info box explaining cappotto visual effects
- Add emoji to system buttons
- Keep `ColoreIntonacoSelector` integration for final color

### 4. Rewrite `ElementiArchitettoniciPanel.tsx`
- Make collapsible (start collapsed)
- Add predefined color swatches for cornici/marcapiani (10 colors) instead of free text input
- Show "no elements detected" message when nothing is present
- Show detected elements summary in header

### 5. Create `StiliProntiFacciata.tsx` (new)
- Grid of 8 preset styles from `STILI_PRONTI_FACCIATA`
- Color palette dots preview per style
- One-click apply callback

### 6. Integrate `StiliProntiFacciata` in `RenderFacciataNew.tsx`
- Import and render above the tipo intervento section in Step 3
- Wire `onApply` to set `tipoIntervento`, `coloreIntonaco`, `cappotto`, `rivestimento` state

## Technical Notes
- No DB queries needed — `render_facciata_presets` table is NOT in the Supabase schema, so all data stays static/inline (matching current pattern)
- All components use existing project imports (`@/components/ui/*`, lucide-react)
- No new dependencies needed

