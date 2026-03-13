

# Render Persiane — Doc 3/5: UI Wizard RenderPersianeNew.tsx

## Problem

The entire `render-persiane` module does not exist yet. There are:
- No `src/modules/render-persiane/` directory
- No `render_persiane_sessions`, `render_persiane_gallery` DB tables
- No `persiane-originals` storage bucket
- No `analyze-shutter-photo` or `generate-shutter-render` edge functions
- No `persianePromptBuilder.ts` with types/functions
- No sub-components (`PersianaStylePicker`, `MaterialePicker`, `LamellaPicker`, `PersianaColorSelector`, `StiliProntiPersiane`)

Doc 3/5 assumes Doc 1/5 (DB + edge functions) and Doc 2/5 (prompt builder) are already deployed. They are not.

## Approach

Create the wizard page with **stub sub-components** (Doc 4/5 will flesh them out later), a **minimal prompt builder** with the required types/exports, and the **route registration**. The edge functions and DB tables will need to be created — I will create the DB migration and stub edge functions as part of this implementation.

## Changes

### 1. DB Migration — Create persiane tables
- `render_persiane_sessions` (id, user_id, company_id, status, original_image_path, result_image_url, tipo_operazione, tipo_persiana, materiale_persiana, colore_mode, colore_ral_code, colore_ral_name, colore_ral_hex, colore_wood_id, colore_wood_name, stato_apertura, larghezza_lamella_mm, apertura_lamelle, note_aggiuntive, prompt_user, prompt_system, prompt_version, original_width, original_height, created_at)
- `render_persiane_gallery` (id, user_id, company_id, session_id, result_image_url, tipo_operazione, tipo_persiana, materiale, colore_mode, colore_ral_code, colore_wood_name, is_favorite, created_at)
- RLS policies for both tables
- Storage buckets: `persiane-originals` (private), `persiane-results` (public)

### 2. Create `src/modules/render-persiane/lib/persianePromptBuilder.ts`
- Export all required types: `TipoOperazione`, `TipoPersoniana`, `MaterialePersiana`, `StatoApertura`, `AperturaLamelle`, `AnalisiPersiana`, `ConfigurazionePersiana`
- Export `buildPersianaPrompt()` function (basic implementation)

### 3. Create stub sub-components in `src/modules/render-persiane/components/`
- `PersianaStylePicker.tsx` — simple selector for 9 persiana types
- `MaterialePicker.tsx` — simple selector for 6 materials
- `LamellaPicker.tsx` — width slider + aperture selector
- `PersianaColorSelector.tsx` — RAL/wood color mode toggle with basic picker
- `StiliProntiPersiane.tsx` — preset styles grid

### 4. Create `src/pages/app/RenderPersianeNew.tsx`
Full 5-step wizard as specified in the prompt, following the same pattern as `RenderFacciataNew.tsx` but adapted for persiane logic (4 operation types, lamelle config, color profile section).

### 5. Create stub `src/pages/app/RenderPersianeHub.tsx`
Minimal hub page matching the facciata hub pattern.

### 6. Update `src/App.tsx`
- Add lazy imports for `RenderPersianeHub` and `RenderPersianeNew`
- Add routes: `/app/render-persiane` and `/app/render-persiane/new`

### 7. Update `src/components/layout/SidebarNav.tsx`
- Add "Render Persiane" entry under STRUMENTI AI section

### 8. Create stub edge functions
- `supabase/functions/analyze-shutter-photo/index.ts`
- `supabase/functions/generate-shutter-render/index.ts`

## Files to create/modify
- **New**: `src/modules/render-persiane/lib/persianePromptBuilder.ts`
- **New**: `src/modules/render-persiane/components/PersianaStylePicker.tsx`
- **New**: `src/modules/render-persiane/components/MaterialePicker.tsx`
- **New**: `src/modules/render-persiane/components/LamellaPicker.tsx`
- **New**: `src/modules/render-persiane/components/PersianaColorSelector.tsx`
- **New**: `src/modules/render-persiane/components/StiliProntiPersiane.tsx`
- **New**: `src/pages/app/RenderPersianeNew.tsx`
- **New**: `src/pages/app/RenderPersianeHub.tsx`
- **New**: `supabase/functions/analyze-shutter-photo/index.ts`
- **New**: `supabase/functions/generate-shutter-render/index.ts`
- **Edit**: `src/App.tsx` — add routes
- **Edit**: `src/components/layout/SidebarNav.tsx` — add nav entry
- **Migration**: Create DB tables + storage buckets

