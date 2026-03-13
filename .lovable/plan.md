

# Render Persiane — Doc 4/5: Componenti Avanzati

## Current State
All 5 components exist as simple stubs. The Doc 4/5 prompt upgrades them with richer UI, filtering logic, and better data.

## Key Issues to Resolve

1. **Type mismatches**: The prompt introduces new `TipoPersoniana` values (`scuro_cornice`, `a_libro`, `griglia_sicurezza`, `brise_soleil`) and new `MaterialePersiana` values (`legno_naturale`, `legno_composito`, `fibra_vetro`) that don't exist in `persianePromptBuilder.ts`. Must update the types and prompt dictionaries.

2. **Prop interface changes**: The upgraded `PersianaColorSelector` has different props (`mode` vs `coloreMode`, `ralValue` vs `ralSelezionato`, adds `materialePersiana`). Must update the wizard's usage in `RenderPersianeNew.tsx` to match.

3. **`RalColorPicker` import path**: The prompt says `@/modules/render-infissi/components/RalColorPicker` but the actual component lives at `@/components/render/RalColorPicker.tsx`. Will use the correct path.

4. **`render_persiane_stili_pronti` table**: Doesn't exist in DB. `StiliProntiPersiane` will use fallback data (already the pattern from the prompt).

## Changes

### 1. Update `persianePromptBuilder.ts` — add new types
- Expand `TipoPersoniana`: add `scuro_cornice`, `a_libro`, `griglia_sicurezza`, `brise_soleil`
- Expand `MaterialePersiana`: add `legno_naturale`, `legno_composito`, `fibra_vetro`
- Add corresponding entries to `TIPO_PERSIANA_PROMPTS` and `MATERIALE_PROMPTS`

### 2. Rewrite `PersianaStylePicker.tsx`
- 9 types with tags, longer descriptions
- List layout (items-start gap-3) instead of 3-col grid

### 3. Rewrite `MaterialePicker.tsx`
- 6 materials with compatibility filtering by `tipoPersiana`
- Pro badge per material
- Warning when current material becomes incompatible

### 4. Rewrite `LamellaPicker.tsx`
- 5 discrete width options (25/50/63/80/100mm) with visual preview
- Slider mapped to discrete values
- 3 aperture options with ASCII visual preview

### 5. Rewrite `PersianaColorSelector.tsx`
- New props: `mode`, `ralValue`, `woodValue`, `materialePersiana`
- RAL quick-picks grid (12 popular shutter colors)
- Collapsible full `RalColorPicker` from `@/components/render/RalColorPicker`
- 8 wood effects with "suggested for material" filtering
- Disable wood tab for acciaio

### 6. Rewrite `StiliProntiPersiane.tsx`
- 8 presets with color preview dot, type badge
- Fallback static data (no DB table yet)

### 7. Update `RenderPersianeNew.tsx` — fix prop interfaces
- Update `PersianaColorSelector` usage to new props (`mode`, `ralValue`, `woodValue`, `materialePersiana`)
- Update state variable names to match

## Files
- **Edit**: `src/modules/render-persiane/lib/persianePromptBuilder.ts`
- **Rewrite**: `src/modules/render-persiane/components/PersianaStylePicker.tsx`
- **Rewrite**: `src/modules/render-persiane/components/MaterialePicker.tsx`
- **Rewrite**: `src/modules/render-persiane/components/LamellaPicker.tsx`
- **Rewrite**: `src/modules/render-persiane/components/PersianaColorSelector.tsx`
- **Rewrite**: `src/modules/render-persiane/components/StiliProntiPersiane.tsx`
- **Edit**: `src/pages/app/RenderPersianeNew.tsx` — update prop interfaces

