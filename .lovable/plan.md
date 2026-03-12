

# Render Infissi v5 — RAL + Effetti Legno + Maniglie + Nodo Ridotto + Cinghia + Trasformazione

## Summary

The uploaded document defines 6 new macro-features for the Render configurator. This is a significant upgrade from v3 to v5.

## 6 Features to Implement

### Feature 1 — Unified Color Picker (RAL + Wood Effects)

**New file**: `src/components/render/RalColorPicker.tsx`
- Dual-tab picker: "Colori RAL" (58 colors, grouped/expandable) and "Effetti Legno" (15 wood laminate effects with CSS grain swatches)
- Exports: `RalColor`, `WoodEffect`, `ColorMode` types, `RAL_COLORS`, `WOOD_EFFECTS` catalogs, `formatColorPrompt()` helper
- Custom RAL input field option

**Update `RenderNew.tsx`**: Replace simple color preset selectors with 3 instances of `RalColorPicker` (infisso, cassonetto, tapparella), each with independent `colorMode`/`ralColor`/`woodEffect` state.

**Update `promptBuilder.ts`**: Add `colore_mode` and `colore_wood_effect` fields to `NuovoInfisso`. Update `buildBlock_D` to use `formatColorPrompt()` and emit wood-effect vs solid-color rendering rules.

### Feature 2 — Detailed Handle Selector (8 types + 8 finishes)

**New file**: `src/components/render/ManigliaSelector.tsx`
- 8 handle styles: Toulon, Classica, Vienna, Q Moderna, Con Rosetta, Pomolo, Alzante, Nessuna
- 8 hardware finishes: Cromo Lucido, Inox Spazzolato, Nero Opaco, Nero Lucido, Bronzo, Oro PVD, Ottone Spazzolato, Titanio
- Each with detailed AI prompt fragments

**Update `promptBuilder.ts`**: New `ManigliaStile` type, new `FerramentaConfig` with `maniglia_stile`/`colore_hardware_id`/`colore_hardware_finish`. Update `buildBlock_G` to use detailed handle prompt fragments.

**Update `RenderNew.tsx`**: Replace simple `maniglia`/`coloreFerratura` selects with `ManigliaSelector` component.

### Feature 3 — Nodo Ridotto + Central Handle Frame Styles

**Update `promptBuilder.ts`**: Add `stile_telaio` field to `NuovoInfisso`. Update `buildBlock_E` with `STILE_DESC` dictionary for 6 styles (nodo_ridotto, nodo_ridotto_maniglia_centrale, minimal_squadrato, classico_arrotondato, europeo_classico, arco_sagomato). Add central handle placement instructions when style is `nodo_ridotto_maniglia_centrale`.

**Update `RenderNew.tsx`**: Add frame style selector UI in the infissi config section.

### Feature 4 — Shutter Strap/Motor Configuration (Cinghia)

**Update `promptBuilder.ts`**: New `CinghiaMode` type (con_cinghia, senza_cinghia, con_catenella, con_manovella). Add `cinghia` field to `TapparellaConfig`. New `CINGHIA_DESC` dictionary. Update `buildBlock_I` to append strap/motor configuration.

**Update `RenderNew.tsx`**: Add 4-option cinghia selector in tapparella section (cinghia manuale, motorizzata, catenella, manovella).

### Feature 5 — Opening Type Transformation

**New file**: `src/modules/render/lib/trasformazioneCompatibility.ts`
- `TrasformazioneRule` type with from/to/label/feasibility/note
- `TRASFORMAZIONI_SUGGERITE` catalog (17 rules)
- `getTrasformazioniDisponibili()` filter function

**Update `promptBuilder.ts`**: New `TrasformazioneApertura` interface. New `buildBlock_M()` with transformation-specific instructions for 5 common conversions. Add Block M to prompt assembly in `buildRenderPromptV2`.

**Update `RenderNew.tsx`**: Add toggle "Trasforma Tipo Apertura" with feasibility badges (facile/media/complessa). Pass transformation config to `startRender()`.

### Feature 6 — General Prompt Improvements

**Update `generate-render/index.ts`**:
- System prompt v5 with 8 explicit rules (including wood-effect and RAL solid rules)
- Negative prompt v5 with specific anti-grain-on-RAL and anti-flat-on-wood terms
- `promptVersion: "5.0.0"`
- API params: `temperature: 1`, `max_tokens: 8192`
- Sync all inline dictionaries with new handle types, wood effects, cinghia, and transformation support

## Files Changed

| File | Action |
|------|--------|
| `src/components/render/RalColorPicker.tsx` | **CREATE** — Full color picker component |
| `src/components/render/ManigliaSelector.tsx` | **CREATE** — Handle selector component |
| `src/modules/render/lib/trasformazioneCompatibility.ts` | **CREATE** — Transformation rules |
| `src/modules/render/lib/promptBuilder.ts` | **UPDATE** — New types, Block D/E/G/I/M, v5 assembly |
| `src/pages/app/RenderNew.tsx` | **UPDATE** — New state, 3x RalColorPicker, ManigliaSelector, cinghia, transformation UI |
| `supabase/functions/generate-render/index.ts` | **UPDATE** — v5 system/negative prompts, inline dicts, Block M, API params |

## Implementation Order

1. Create `RalColorPicker.tsx` and `ManigliaSelector.tsx` (no dependencies)
2. Create `trasformazioneCompatibility.ts`
3. Update `promptBuilder.ts` with all new types, blocks, and assembly
4. Update `RenderNew.tsx` with all new UI components and state
5. Update `generate-render/index.ts` with v5 prompts and deploy

