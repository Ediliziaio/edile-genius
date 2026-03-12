

# Wood Effect Support for Cassonetto & Tapparella

## Problem
The UI already renders `RalColorPicker` (with wood-effect tab) for cassonetto and tapparella, but the config builder in `startRender()` ignores wood effects — it only reads RAL color values and hardcodes `finitura: "liscio_opaco"`. The prompt builder blocks H and I also only output RAL color text.

## Changes

### 1. `src/modules/render/lib/promptBuilder.ts` — Add `colore_mode` + `colore_wood_effect` to CassonettoConfig and TapparellaConfig

- **CassonettoConfig** (line 133): Add `colore_mode?: ColorMode` and `colore_wood_effect?: WoodEffect`
- **TapparellaConfig** (line 141): Add `colore_mode?: ColorMode` and `colore_wood_effect?: WoodEffect`
- **buildBlock_H** (line 569-574): When `c.colore_mode === "legno"` and `c.colore_wood_effect` exists, use `formatColorPrompt("legno", null, c.colore_wood_effect)` instead of RAL text. Add wood-grain rendering rules.
- **buildBlock_I** (line 605-606): Same logic — when `t.colore_mode === "legno"`, use wood effect prompt fragment for slat color description.

### 2. `src/pages/app/RenderNew.tsx` — Pass wood effect data in startRender config

- **Cassonetto color config** (lines 244-246): When `cassColorMode === "legno"`, set `colore_mode: "legno"`, `colore_wood_effect: cassWoodEffect`, and adjust `colore.nome`/`finitura` accordingly.
- **Tapparella color config** (lines 285-289): When `tapColorMode === "legno"`, set `colore_mode: "legno"`, `colore_wood_effect: tapWoodEffect`, and adjust similarly.

### 3. `supabase/functions/generate-render/index.ts` — Handle wood effect in Block H and I

- Update inline Block H builder to detect `colore_mode === "legno"` and use wood effect prompt fragment for cassonetto color.
- Update inline Block I builder to detect `colore_mode === "legno"` and use wood effect prompt fragment for slat color.

