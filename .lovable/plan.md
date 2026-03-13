

# Render Stanza Completo — Doc 1/5: DB + Storage + Edge Functions + Routes

## Current State
Nothing exists for `render-stanza` — no tables, no storage buckets, no edge functions, no pages, no routes, no nav entry.

## Changes

### 1. DB Migration
Create 3 tables + 2 storage buckets + preset data + RLS + storage policies:
- `render_stanza_sessions` — tracks render jobs with analisi_json, interventi_selezionati, config_json, prompt fields, result URLs
- `render_stanza_gallery` — saved results with metadata and is_favorite
- `render_stanza_presets` — 60+ preset records (30 wall colors, 12 furniture styles, 10 furniture colors, 8 lighting types)
- Storage: `stanza-originals` (private, 15MB limit) and `stanza-results` (public, 25MB limit) with RLS policies

### 2. Edge Functions
- `supabase/functions/analyze-room-photo/index.ts` — calls Gemini Vision with detailed room analysis prompt, returns structured JSON (wall/floor/ceiling/furniture/lighting analysis), updates session
- `supabase/functions/generate-room-render/index.ts` — sends image + prompt to Gemini, resizes output, uploads to stanza-results bucket, updates session
- Register both in `supabase/config.toml` with `verify_jwt = false`

### 3. Placeholder Hub Page
- `src/pages/app/RenderStanzaHub.tsx` — minimal page with title and "Nuovo Render" button

### 4. Placeholder Wizard Page
- `src/pages/app/RenderStanzaNew.tsx` — minimal placeholder (full wizard comes in Doc 3/5)

### 5. Routing (App.tsx)
- Add lazy imports for `RenderStanzaHub` and `RenderStanzaNew`
- Add routes: `/app/render-stanza` and `/app/render-stanza/new`

### 6. Navigation (SidebarNav.tsx)
- Add "Render Stanza" entry under STRUMENTI AI section with `Wand2` icon

## Files
- **Migration**: 3 tables + 2 buckets + 60+ preset inserts + RLS + storage policies
- **New**: `supabase/functions/analyze-room-photo/index.ts`
- **New**: `supabase/functions/generate-room-render/index.ts`
- **New**: `src/pages/app/RenderStanzaHub.tsx`
- **New**: `src/pages/app/RenderStanzaNew.tsx`
- **Edit**: `src/App.tsx` — add lazy imports + routes
- **Edit**: `src/components/layout/SidebarNav.tsx` — add nav entry
- **Edit**: `supabase/config.toml` — register 2 new functions

