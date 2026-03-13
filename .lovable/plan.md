

# Render Stanza Doc 3/5 — UI Wizard (RenderStanzaNew.tsx)

## Problem
The current `RenderStanzaNew.tsx` is a placeholder. Doc 3/5 provides a complete 5-step wizard (~2000 lines) but uses a **different internal state model** than the Doc 2 `stanzaPromptBuilder.ts` types. The wizard needs adaptation to work with the existing codebase.

## Key Compatibility Issues

1. **Auth import**: Wizard uses `@/hooks/useAuth` — project uses `@/context/AuthContext`
2. **Config shape mismatch**: The wizard's `getDefaultConfigurazione()` uses fields like `tipo_pavimento`, `colore_mode`, `pattern_posa`, `tipo_fixture`, `colore_dominante`, nested objects for cucina/bagno (`frontali.cambia`, `rivestimento.cambia`) — none of which exist in the Doc 2 `ConfigurazioneStanza` type
3. **AnalisiStanza field paths**: Wizard accesses `analisi.pareti?.hex` but the type defines `analisi.pareti?.colore_hex`; similarly `analisi.soffitto?.altezza` vs `altezza_stimata`
4. **STANZA_STILI_PRONTI_FALLBACK**: Wizard references `.id` field but the exported array has no `id` — uses `nome` as key
5. **buildStanzaPrompt call**: Wizard calls `buildStanzaPrompt(config, analisi)` but the function signature is `buildStanzaPrompt(analisi, config)`
6. **Edge function body keys**: Wizard sends `imageBase64`/`mimeType` (camelCase) but edge functions expect `image_base64`/`mime_type` (snake_case)

## Approach

Replace the placeholder `RenderStanzaNew.tsx` with the full wizard from the uploaded doc, adapting it to match the existing types:
- Use `useAuth` from `@/context/AuthContext`
- The wizard will use its own **internal UI state types** (richer than the prompt builder types) and map to `ConfigurazioneStanza` only when calling `buildStanzaPrompt`
- Fix all field access paths to match `AnalisiStanza` from Doc 2
- Fix edge function body field names to snake_case
- Fix `buildStanzaPrompt` argument order
- Use `nome` as key for stili pronti instead of `.id`

## Changes

### 1. Replace `src/pages/app/RenderStanzaNew.tsx`
Full 5-step wizard with:
- **Step 1**: Photo upload + room type selection + quick style presets
- **Step 2**: AI analysis results display (walls, floor, furniture, lighting, ceiling, special features)
- **Step 3**: 10 intervention toggles with inline config panels (wall color grid, floor type, furniture style, ceiling, lighting, wallpaper, wall cladding, curtains, kitchen restyling, bathroom restyling) + global style/intensity selectors + free notes
- **Step 4**: Generation loading screen with active interventions display
- **Step 5**: Before/after result with download, reset, and gallery navigation

Key adaptations from uploaded doc:
- Import `useAuth` from `@/context/AuthContext`
- Internal state uses extended fields (e.g., `tipo_pavimento`, `frontali.cambia`) for UI richness
- Map to `ConfigurazioneStanza` when calling `buildStanzaPrompt` by translating field names
- Edge function calls use snake_case keys (`image_base64`, `mime_type`, `session_id`)
- `applyStile` maps from `STANZA_STILI_PRONTI_FALLBACK` using `nome` key
- Analysis display uses correct field paths (`colore_hex` not `hex`)

## Files
- **Replace**: `src/pages/app/RenderStanzaNew.tsx` — ~2000 lines, complete wizard

