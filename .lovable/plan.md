

# Fix: Add Block N to Edge Function + Strengthen Handle Instructions

## Problems Identified

1. **Block N missing from edge function**: The `buildPromptFromConfig()` in `generate-render/index.ts` assembles blocks A-L (and M) but **never builds or includes Block N**. Block N only exists in the frontend `promptBuilder.ts` (used for the debug panel display). The actual prompt sent to the AI model has no final preservation checklist.

2. **Handle style not reinforced enough**: Block G correctly includes the Toulon description, but the AI model ignores it because there's no emphasis. The handle instruction needs reinforcement — specifically adding it to Block N as a verification item and making Block G more assertive.

## Changes

### 1. `supabase/functions/generate-render/index.ts` — Add Block N + reinforce handle

**Add Block N construction** (after line 376, before the `systemPrompt` assembly):

Build Block N dynamically using the same logic as the frontend `promptBuilder.ts`:
- Frame: REPLACE with `{materiale}` + `{color description}`
- Cassonetto: REPLACE/KEEP based on `sost.cassonetto` and `cassonetto.azione`
- Tapparella: REPLACE/KEEP based on `sost.tapparella` and `tapparella.azione`
- Handle: must be `{manigliaStile}` style in `{hwFinish}` finish — verify it is visible
- Wall/sill/surroundings: KEEP identical
- Image dimensions: match original

**Include Block N in userParts** (line 379): Add `blocks.N` as the last element before notes.

**Reinforce Block G**: Add a line: `CRITICAL: The handle MUST be clearly visible on the window sash. Do NOT omit the handle. The handle style MUST match the specification above exactly — do not substitute with a generic handle.`

### 2. Deploy edge function

Deploy and verify via logs.

## Summary

The root issue is a disconnect between the frontend debug prompt (which shows Block N) and the edge function's actual prompt (which omits it). Adding Block N to the edge function ensures the AI model gets the final preservation checklist as its last instruction, leveraging recency bias. Reinforcing Block G ensures the handle style is not ignored.

