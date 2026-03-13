

# Verification: Render Bagno Complete Flow — Issues Found

## Issues Identified

### Bug 1 (CRITICAL): Configuration never saved to session before render
The edge function `generate-bathroom-render` reads `session.configurazione` and `session.analisi_bagno` (line 85-87) to build prompts server-side. But `startRender()` in `RenderBagnoNew.tsx` never updates the session with the full configuration before invoking the edge function. The client builds prompts locally and sends them as `prompt_text`/`system_prompt`, but the edge function **ignores these body fields** entirely.

**Result**: The edge function always gets `configurazione: null/{}`, producing an empty/broken prompt.

**Fix**: In `startRender()`, before calling the edge function, update the session with the full `configurazione` object:
```typescript
await supabase.from("render_bagno_sessions").update({
  configurazione: cfg,
  stato: "pending",
}).eq("id", sessionId);
```

### Bug 2 (CRITICAL): Edge function prompt builder expects different config shape
The edge function's local `buildBathroomPrompt` (line 194-349) expects a flat config with keys like `config.piastrelle`, `config.doccia`, `config.vanity`, `config.rubinetteria`, `config.pareti`. But the client-side `ConfigurazioneBagno` uses different keys: `piastrelle_parete`, `parete` (not `pareti`). This mismatch means even if Bug 1 is fixed, several blocks would be empty.

**Fix**: Align the edge function's config key access to match the client-side shape (`piastrelle_parete` → wall tiles, `pavimento`, `doccia`, `vasca`, `vanity`, `rubinetteria`, `parete`, `layout`).

### Bug 3 (Medium): Gallery saves blob URL as `originale_url`
`saveToGallery()` saves `fotoPreview` (a `blob:` URL) as `originale_url`. Blob URLs are ephemeral and won't work after the session ends.

**Fix**: Generate a public/signed URL from the `originalPath` in storage and save that instead.

### Bug 4 (Minor): StiliProntiPicker config keys vs state keys
The stili pronti presets use keys like `piastrelle_parete` and `pavimento` which match the state, but the edge function's builder expects `piastrelle` and `pavimento`. This is related to Bug 2 — the edge function needs alignment.

## Plan

### 1. Update `startRender()` in `RenderBagnoNew.tsx`
- Save configuration to session before invoking edge function
- Get a public URL for the original photo to save in gallery instead of blob URL

### 2. Update edge function `generate-bathroom-render/index.ts`
- Align config key reads: `config.piastrelle_parete` instead of `config.piastrelle`, `config.parete` instead of `config.pareti`, etc.
- Add layout block support for `demolizione_completa`

### 3. Fix `saveToGallery()` in `RenderBagnoNew.tsx`
- Use storage public URL for `originale_url` instead of blob URL

