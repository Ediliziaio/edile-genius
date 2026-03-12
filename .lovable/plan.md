

# Render Infissi v5 — Edge Function Update

## Current State

All frontend files are already implemented with v5 features:
- `RalColorPicker.tsx` — created with 58 RAL colors + 15 wood effects
- `ManigliaSelector.tsx` — created with 8 handle styles + 8 finishes
- `trasformazioneCompatibility.ts` — created with 17 transformation rules
- `promptBuilder.ts` — updated to v5 with Block M, stile telaio, cinghia, wood effects
- `RenderNew.tsx` — updated with all v5 UI components

**Only `generate-render/index.ts` remains at v3** and needs alignment to v5.

## Changes to `supabase/functions/generate-render/index.ts`

### 1. Add missing v5 dictionaries (after existing ones, ~line 58)
- `CINGHIA_DESC` — 4 strap/motor modes
- `STILE_TELAIO_DESC` — 6 frame styles
- `MANIGLIE_V5` — 8 handle types with prompt fragments (from ManigliaSelector)
- `HARDWARE_COLORS_V5` — 8 finish descriptions

### 2. Update Block D (~line 144-150)
- Detect `colore_mode === "legno"` and use wood effect prompt fragment
- Add wood-grain vs solid RAL rendering rules

### 3. Update Block E (~line 153-162)
- Add stile telaio instructions from `STILE_TELAIO_DESC`
- Add central handle placement when `nodo_ridotto_maniglia_centrale`

### 4. Update Block G (~line 172-176)
- Use v5 handle types (`maniglia_stile` + `colore_hardware_finish`) when available
- Fall back to legacy fields for backward compat

### 5. Update Block I (~line 189-202)
- Append cinghia/motor instructions from `CINGHIA_DESC` when tapparella is replaced
- Add guide channel removal on shutter removal

### 6. Add Block M (new, after Block L)
- Transformation-specific rendering instructions when `trasformazione.attiva === true`
- Include in prompt assembly

### 7. Update prompt metadata (~line 218)
- `promptVersion: "5.0.0"`
- Enhanced system prompt with wood-effect and RAL rules
- Enhanced negative prompt with anti-grain-on-RAL terms

### 8. Update API params (~line 289-296)
- Add `temperature: 1`, `max_tokens: 8192`

## Impact
Edge function text-only update + redeploy. No DB or frontend changes needed.

