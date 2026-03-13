

# Audit Render Modules — Redundancies, Bugs, Loading Issues

## Issues Found

### 1. STANZA — "Remove photo" button does NOT revoke object URL (memory leak)
**Line 890-893**: When user clicks the RotateCcw button to remove the photo, `setFotoPreview(null)` is called but `URL.revokeObjectURL(fotoPreview)` is never called. The blob URL leaks.

Similarly, **`handleReset`** (line 730-748) sets `setFotoPreview(null)` without revoking. The revoke only happens in `handleFotoSelect` (line 488).

**Fix**: Add `if (fotoPreview) URL.revokeObjectURL(fotoPreview)` before setting null in both the remove-photo button handler and `handleReset`.

### 2. STANZA — `fileToBase64` called TWICE for the same file
The file is read to base64 once in `handleFotoSelect` (line 494, for varianti), and then again in `handleAnalyzeRoom` (line 535), and again in `handleStartRender` (line 663). The first read stores it in `imageBase64` state, but the analysis and render functions re-read from disk instead of using the cached value.

**Fix**: Use the already-cached `imageBase64` in `handleAnalyzeRoom` and `handleStartRender` instead of calling `fileToBase64(foto)` again.

### 3. STANZA — `TipoStanza` type mismatch with prompt builder
The page defines `TipoStanza` locally (line 44) with `'corridoio'`, but the prompt builder's exported `TipoStanza` (line 7-10) uses `'ingresso'` and `'taverna'` which don't exist in the page's type, and the page uses `'corridoio'` which maps to the builder via `tipo_stanza` cast as `any`. This is fragile.

**Fix**: Import `TipoStanza` from the prompt builder instead of re-declaring it locally.

### 4. PERSIANE — Gallery missing `original_image_url`
`saveToGallery` (line 349-365) never saves the original image URL. The gallery record has no reference to the original photo for before/after comparison.

**Fix**: Generate a signed URL for the original and save it in the gallery insert.

### 5. PAVIMENTO — Gallery missing `original_image_url`
Same issue as Persiane. `saveToGallery` (line 192-213) saves `result_image_url` but no original.

**Fix**: Save a signed URL or public URL for the original in the gallery.

### 6. PERSIANE — No reset/new-render function
Unlike all other modules, RenderPersianeNew has no reset function. Once a render is complete, the user must navigate away and back to start over. There is no "Nuovo Render" or reset button.

**Fix**: Add a reset handler that clears all state.

### 7. BAGNO — `demolizione_parziale` sets same elements as nothing specific
`selectTipoIntervento` (line 362-373) handles `restyling_piastrelle`, `restyling_completo`, and `demolizione_completa`, but has no case for `demolizione_parziale`. It falls through without changing the default sostituzione, leaving the user with whatever was previously set — potentially confusing.

**Fix**: Add a `demolizione_parziale` case that sets a sensible default (e.g., all elements enabled, layout not forced).

### 8. INFISSI — `render-originals` bucket: `getPublicUrl` on potentially private bucket
`RenderNew.tsx` line 225 uses `getPublicUrl` for `render-originals`. If this bucket is private, the URL will return 403. Should use signed URL like other modules.

**Fix**: Check bucket access and use `createSignedUrl` if private.

### 9. STANZA — Redundant `STILI_TARGET` vs prompt builder's `StileArredo`
The page defines `STILI_TARGET` (line 88-98) with 9 values including `'nessuno'`, while the prompt builder exports `StileArredo` with 12 values. The page is missing `rustico`, `art_deco`, `provenzale`, `eclettico` and adds `nessuno` which isn't a real style. These are UI choices but the mismatch means some valid styles from presets can't be correctly displayed.

**Fix**: Align `STILI_TARGET` with the exported `StileArredo` type.

### 10. ALL MODULES — No error handling for 402 (credits exhausted) or 429 (rate limit)
All render modules show generic error toasts. Users don't get specific feedback about credit exhaustion or rate limiting.

**Fix**: Check error status/message for 402 and 429 and show targeted toast messages.

---

## Implementation Plan

### File changes

1. **`src/pages/app/RenderStanzaNew.tsx`**
   - Add `revokeObjectURL` in remove-photo handler and `handleReset`
   - Use cached `imageBase64` instead of re-reading file in `handleAnalyzeRoom` and `handleStartRender`
   - Import `TipoStanza` from prompt builder instead of re-declaring
   - Align `STILI_TARGET` with `StileArredo` from builder

2. **`src/pages/app/RenderPersianeNew.tsx`**
   - Save original image URL (signed) in `saveToGallery`
   - Add reset function and "Nuovo Render" button on result step

3. **`src/pages/app/RenderPavimentoNew.tsx`**
   - Save original image URL (signed) in `saveToGallery`

4. **`src/pages/app/RenderBagnoNew.tsx`**
   - Add `demolizione_parziale` case in `selectTipoIntervento`

5. **All render modules** — Add specific error handling for 402/429 in catch blocks

