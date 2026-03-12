

# Fix: Render Uses Legacy v1 Prompt When Photo Analysis Fails

## Root Cause

The `foto_analisi` field is stored as `{}` (empty) in the render session. The edge function's `buildPromptFromConfig()` checks `analisi.tipo_apertura && nuovoInfisso.sostituzione` to decide between v5/v6 and legacy v1. Since `tipo_apertura` is undefined, **it falls back to the v1 legacy prompt** — a one-liner that says "replace windows with white PVC" — completely ignoring all v6 configuration (colors, cassonetto, wood effects, etc.).

This is why the output is a generic white window with no cassonetto.

## Two-Pronged Fix

### 1. Edge Function: Fix `hasV2` check (`supabase/functions/generate-render/index.ts`)

Change line 106 from:
```js
const hasV2 = analisi.tipo_apertura && (nuovoInfisso.materiale || nuovoInfisso.sostituzione);
```
to:
```js
const hasV2 = nuovoInfisso.sostituzione || (analisi.tipo_apertura && nuovoInfisso.materiale);
```

This way, if the user configured sostituzione (which they always do in the v5/v6 UI), the v6 prompt path is used **even if analysis data is missing**. All undefined analysis fields will show "undefined" but the prompt structure, color specs, and cassonetto instructions will be correct.

Additionally, add fallback defaults for missing analysis fields to avoid "undefined" in prompts:
```js
// After line 101
const analisi = {
  tipo_apertura: "battente_2_ante",
  materiale_attuale: "sconosciuto",
  colore_attuale: "sconosciuto",
  condizioni: "sconosciuto",
  num_ante_attuale: 2,
  spessore_telaio: "circa 70mm",
  tipo_vetro_attuale: "non identificabile",
  presenza_cassonetto: false,
  tipo_cassonetto: "non presente",
  presenza_tapparella: false,
  stile_edificio: "classico",
  materiale_muro: "intonaco",
  colore_muro: "chiaro",
  presenza_davanzale: false,
  presenza_inferriata: false,
  piano: "non identificabile",
  luce: "luce naturale",
  angolo_ripresa: "frontale",
  ...(session.foto_analisi || {}),  // override with actual data if available
};
```

### 2. Frontend: Block render if analysis failed + add retry (`src/pages/app/RenderNew.tsx`)

Since the user chose "Blocca render":
- Disable the "Genera Render AI" button when `analysisData` is null AND `analysisLoading` is false AND `analysisError` is not empty
- Add a "Riprova Analisi" button next to the error message in `PhotoAnalysisCard`
- Show a clear warning message: "L'analisi foto è necessaria per generare il render"

### 3. Deploy edge function

Deploy the updated `generate-render` function.

## Implementation Order

1. Fix `buildPromptFromConfig()` in edge function (hasV2 check + analysis defaults)
2. Add render blocking + retry in RenderNew.tsx
3. Deploy and test

