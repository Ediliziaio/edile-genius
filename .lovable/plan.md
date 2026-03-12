

# Fix: AI Not Preserving Cassonetto in Renders

## Root Cause Analysis

The edge function code and prompt construction are correct. The issue is the AI model (Gemini 2.5 Flash Image) not following the prompt instructions properly. Two problems:

1. **Model quality**: `google/gemini-2.5-flash-image` is the lowest-tier image model. The newer models (`google/gemini-3.1-flash-image-preview` or `google/gemini-3-pro-image-preview`) produce significantly better results and follow instructions more faithfully.

2. **Prompt reinforcement**: The current prompt tells the AI to "KEEP" the cassonetto but doesn't repeat this instruction forcefully enough in the user prompt. Gemini models respond better to repeated, direct constraints placed close to the image.

## Changes

### 1. `supabase/functions/generate-render/index.ts` — Upgrade model + reinforce prompt

**Model upgrade** (line 434): Change from `google/gemini-2.5-flash-image` to `google/gemini-3.1-flash-image-preview` (faster + better quality).

**Add preservation summary block** (after Block L, before notes): Add a new Block N that summarizes all 🚫 KEEP elements as a final reminder right before the image is processed. This "last instruction" pattern is more effective with LLMs.

```text
[BLOCK N – FINAL PRESERVATION CHECKLIST]
BEFORE generating output, verify:
- Cassonetto: [KEEP unchanged / REPLACE with X]
- Tapparella: [KEEP unchanged / REPLACE with X]
- Wall, sill, surroundings: MUST be identical to original
- Image dimensions: MUST match original
DO NOT remove any element that is marked 🚫 KEEP.
```

**Increase max_tokens** (line 441): Bump from 8192 to 16384 to give the model more room for complex scenes.

### 2. Deploy updated edge function

Deploy and verify logs.

## Technical Details

- The `sostituzione` defaults to `{ cassonetto: false }`, meaning if the user didn't explicitly toggle cassonetto replacement, the prompt correctly says "KEEP". The AI model is simply ignoring this.
- Switching to `gemini-3.1-flash-image-preview` provides better instruction following at similar speed, per the AI gateway docs.

