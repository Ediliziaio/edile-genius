

# Render Tetto Doc 2/5 — Edge Functions + Hook

## Key Adaptations from Prompt

The prompt specifies direct Gemini API calls — the project standard uses **Lovable AI Gateway** via `_shared/utils.ts` helpers (`corsHeaders`, `jsonOk`, `jsonError`, `fetchWithTimeout`, `errorResponse`). Both edge functions will follow the `generate-room-render` / `analyze-room-photo` pattern exactly.

The prompt creates a standalone `useRenderTetto` hook, but existing modules (stanza, facciata, persiane) have their logic **inline in the page component**. I'll create the hook as requested since it cleanly encapsulates the logic and the page (Doc 3) can consume it.

The DB requires `company_id` (non-nullable) on `render_tetto_sessions` — the hook must fetch it via `useCompanyId()`.

## Plan

### 1. Edge Function: `analyze-roof-photo`
**File**: `supabase/functions/analyze-roof-photo/index.ts`

Following `analyze-room-photo` pattern:
- Uses `corsHeaders`, `jsonOk`, `jsonError`, `errorResponse`, `fetchWithTimeout` from `_shared/utils.ts`
- Auth via `supabase.auth.getUser(token)`
- Calls Lovable AI Gateway (`google/gemini-2.5-flash`) with the tetto analysis prompt (inline, not imported from shared)
- Parses JSON response (handles markdown code blocks)
- Updates `render_tetto_sessions.analisi_json` via service role client
- Returns `{ ok: true, data: { analisi } }`

### 2. Edge Function: `generate-roof-render`
**File**: `supabase/functions/generate-roof-render/index.ts`

Following `generate-room-render` pattern:
- Uses shared utils, Lovable AI Gateway with `google/gemini-2.5-flash-image` model
- Receives `image_base64`, `mime_type`, `prompt`, `system_prompt`, `session_id`
- Extracts image from response (base64 or URL, same parsing logic)
- Uploads result to `tetto-results` bucket
- Updates `render_tetto_sessions` with `result_url`, `status: 'completed'`
- Returns `{ ok: true, data: { result_url } }`

### 3. Hook: `src/hooks/useRenderTetto.ts`
- States: foto, fotoPreview, imageBase64, sessionId, analisi, config, rendering, renderUrl
- `handleFotoChange`: validates file, creates session in DB (with `company_id` from `useCompanyId`), uploads to `tetto-originals`, captures base64/dimensions
- `analizzaTetto`: invokes `analyze-roof-photo`, unwraps with `unwrapEdge`, prefills config from analysis colors
- `updateConfig`: generic section updater for manto/gronde/lucernari
- `applyStile`: merges preset config
- `generaRender`: builds prompt via `buildTettoPrompt`, invokes `generate-roof-render`, saves to `render_tetto_gallery`, updates session
- `reset`: clears all state
- `countAttive`: computed count of active modifications

### 4. Config: `supabase/config.toml`
Add entries for `analyze-roof-photo` and `generate-roof-render` with `verify_jwt = false`.

### Files
- **Create**: `supabase/functions/analyze-roof-photo/index.ts`
- **Create**: `supabase/functions/generate-roof-render/index.ts`
- **Create**: `src/hooks/useRenderTetto.ts`
- **Edit**: `supabase/config.toml` (add 2 entries)

