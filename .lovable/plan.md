

# Fix: Blank screen on Step 5 (Risultato) in Render Stanza

## Problem
Step 5 renders with `{step === 5 && renderUrl && (...)}`. If `renderUrl` is null (e.g., edge function returned data in an unexpected shape, or result_base64 was returned without a URL), the entire step content disappears — leaving a blank page.

## Fix

### Edit `src/pages/app/RenderStanzaNew.tsx`

1. **Add fallback UI for step 5 without renderUrl** — same pattern as the step 2 fix:
   - Show an error message: "Render non disponibile"
   - Provide "Torna agli interventi" button (back to step 3)
   - Provide "Riprova render" button that calls `handleStartRender`

2. **Change the existing step 5 block** from:
   ```tsx
   {step === 5 && renderUrl && (
   ```
   Keep this as-is for the success case.

3. **Add a new block before it**:
   ```tsx
   {step === 5 && !renderUrl && (
     <div className="text-center space-y-4 py-12">
       <AlertCircle ... />
       <h2>Render non disponibile</h2>
       <p>La generazione è terminata ma l'immagine non è stata ricevuta.</p>
       <Button onClick={() => setStep(3)}>Torna agli interventi</Button>
       <Button onClick={handleStartRender}>Riprova render</Button>
     </div>
   )}
   ```

### Single file change
- `src/pages/app/RenderStanzaNew.tsx` — add ~15 lines of fallback UI before the existing step 5 block.

