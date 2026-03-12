

# Render Infissi v3.0.0-r2 — Final Alignment

## Current State

The v3 system is already in place with selective replacement, cassonetti, tapparelle, and cerniere. The UI already uses full-width toggles and `border-l-2` layout. Most dictionaries match. However, several minor text/prompt gaps remain between the document and the implementation.

## Gaps Found

### 1. `promptBuilder.ts` — Minor Block Text Gaps

- **Block F (Glass)**: Missing bullet "Air gap line between panes invisible from exterior at normal viewing angle" and "low-iron or" prefix
- **Block G (Hardware)**: `leva_alluminio` missing "8mm square spindle"; `alzante` missing "panel weights up to 400kg" detail; `leva_acciaio` missing "premium minimalist aesthetic"; `pomolo` missing "typically used on fixed panels or low-use windows"
- **Block J (Sill)**: Missing ", any chips or weathering" after sill description

### 2. `generate-render/index.ts` — Inline Dictionary Alignment

- `CERNIERA_COLORE_DESC` uses abbreviated text (e.g., "silver chrome" vs "silver polished chrome finish") — should match promptBuilder.ts
- Block E inline: missing "Cast correct shadow of hinge knuckle onto frame face and wall rebate" instruction
- Block F inline: missing the 5 detailed technical rendering bullets
- Block G inline: already matches, but missing espagnolette/strikeplate/corner connector details in the same level of detail
- Block I inline: shutter removal should add "If guide channels were surface-mounted on wall: remove them and show clean wall face"

### 3. `analyze-window-photo/index.ts` — Already Updated

No changes needed — the prompt already contains all v3 fields with proper enums.

### 4. `RenderNew.tsx` — Already Updated  

UI already uses full-width toggles with checkboxes and `border-l-2 border-primary/20 pl-4`. No changes needed.

## Implementation

| File | Change |
|------|--------|
| `src/modules/render/lib/promptBuilder.ts` | Update Blocks F, G, J with missing technical details from document |
| `supabase/functions/generate-render/index.ts` | Align inline `CERNIERA_COLORE_DESC`, expand Blocks E/F/G/I inline text to match promptBuilder.ts detail level |

## Impact

Text-only updates to prompt content. No structural, type, or UI changes. Edge function redeploy required.

