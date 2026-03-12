

# Render Infissi v6 — Fix Cassonetto + Image Dimensions + Debug Panel

## Summary

8 fixes across 3 files: cassonetto color not reaching prompt, missing NuovoInfisso fields, image dimensions not preserved, debug panel, and prompt v6 upgrades.

## Files to Change

### 1. `src/modules/render/lib/promptBuilder.ts`

**Interface `NuovoInfisso` (lines 182-198)** — Add 9 new fields:
- `cass_colore_mode`, `cass_colore`, `cass_wood_effect` (cassonetto color)
- `tap_colore_mode`, `tap_colore`, `tap_wood_effect` (tapparella color)
- `original_image_width`, `original_image_height`

**`buildBlock_C` (lines 353-415)** — Rewrite to use `formatColorPrompt()` for all 3 elements (infisso/cassonetto/tapparella), showing explicit ✅/🚫 with full color descriptions including wood-effect fragments.

**`buildBlock_H` (lines 561-595)** — Rewrite to read from `infisso.cass_colore_mode` / `cass_colore` / `cass_wood_effect` (new NuovoInfisso fields) instead of only `cassonetto.colore`. Add explicit wood-grain vs RAL rendering rules for the cassonetto face panel.

**`buildBlock_I` (lines 597-642)** — Update to read from `infisso.tap_colore_mode` / `tap_colore` / `tap_wood_effect` instead of only `tapparella.colore`. Add wood-grain vs RAL rules for slats.

**`promptVersion`** — Bump to `"6.0.0"` (line 786).

**Negative prompt** (lines 763-778) — Add: `"cassonetto unchanged when replacement requested"`, `"wrong cassonetto color"`, `"resized or cropped original photo"`, `"letterboxing"`, `"pillarboxing"`.

### 2. `src/pages/app/RenderNew.tsx`

**New state** — Add `imageNaturalWidth`/`imageNaturalHeight` (default 1024), `showDebugPrompt`/`debugPromptText`.

**`handleFile` (line 156)** — After validation, detect natural dimensions via `new Image()` and save to state.

**`startRender` (line 233)** — Add to `nuovoInfisso`:
- `cass_colore_mode`, `cass_colore` (with `name`/`ral`/`hex`), `cass_wood_effect`
- `tap_colore_mode`, `tap_colore`, `tap_wood_effect`
- `original_image_width`, `original_image_height`

**Edge function call (line 336)** — Add `target_width` and `target_height` to the body.

**Debug Panel** — Add collapsible panel (DEV only) before the "Genera Render" button showing system/user/negative prompts, image dimensions, and a copy-to-clipboard button. Set `debugPromptText` after building the prompt (using `buildRenderPromptV2`).

### 3. `supabase/functions/generate-render/index.ts`

**Block C (lines 146-181)** — Add full color descriptions using wood-effect `prompt_fragment` when `colore_mode === "legno"` for cassonetto and tapparella (reading from `nuovoInfisso.cass_colore_mode`/`tap_colore_mode`).

**Block H (lines 245-261)** — Also read from `nuovoInfisso.cass_colore_mode`/`cass_colore`/`cass_wood_effect` as fallback/override when `cassonetto.colore_mode` is not set.

**Block I (lines 263-289)** — Also read from `nuovoInfisso.tap_colore_mode`/`tap_colore`/`tap_wood_effect`.

**System prompt (Block A, line 139-140)** — Update to v6 with RULE 9 (cassonetto must change), RULE 10 (tapparella must change), RULE 11 (output dimensions = input dimensions).

**Negative prompt (line 330)** — Add cassonetto/dimension terms.

**Image dimensions** — Read `target_width`/`target_height` from request body. Add `calcOutputDimensions()` helper (max 2048, min 256, round to 8). Note: Gemini output matches input size; we don't resize the input since signed URL is used directly (not base64).

**`promptVersion`** — Update to `"6.0.0"`.

## Implementation Order

1. Update `promptBuilder.ts` (interface + blocks + version)
2. Update `RenderNew.tsx` (state + handleFile + startRender + debug panel)
3. Update `generate-render/index.ts` (blocks + system prompt + dimensions + deploy)

