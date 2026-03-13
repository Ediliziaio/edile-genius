

# Render Facciata v1 — Setup Route + Database + Edge Functions

## Overview
Implement the complete "Render Facciata" module for facade visualization (painting, thermal coating, stone/brick cladding). Follows existing patterns from Render Bagno and Render Infissi modules.

## Critical deviations from user prompt
The user prompt contains patterns that conflict with the existing codebase. The implementation will align with established conventions:

- **AI calls**: Use `LOVABLE_API_KEY` + Lovable AI Gateway (`ai.gateway.lovable.dev`), NOT direct `GEMINI_API_KEY` calls — matching `generate-bathroom-render` and `analyze-bathroom-photo` patterns
- **Credits**: Use `company_id`-based `render_credits` table (shared across all render modules), NOT a user-based `credits_remaining` field
- **DB schema**: Add `company_id` column to sessions/gallery tables (existing pattern) in addition to `user_id`
- **Edge function structure**: Use `_shared/utils.ts` (corsHeaders, generateRequestId, jsonOk, jsonError, etc.)

## Implementation Steps

### 1. Database Migration
Create tables with company_id pattern:

- **`render_facciata_sessions`** — `id, company_id, user_id, status, original_path, original_width, original_height, analisi (JSONB), tipo_intervento, configurazione (JSONB), render_path, render_url, prompt_used, prompt_version, generation_ms, credits_used`
- **`render_facciata_gallery`** — `id, company_id, user_id, session_id, original_url, render_url, thumbnail_url, title, tipo_intervento, colore_name, is_favorite, tags`
- **`render_facciata_presets`** — `id, category, name, value, hex_color, prompt_fragment, icon, sort_order, is_active`
- RLS policies using `auth.uid() = user_id` for sessions/gallery, authenticated SELECT for presets
- Storage buckets: `facciata-originals` (private, 15MB) and `facciata-results` (public, 25MB)

### 2. Insert Presets
58 presets across 6 categories: `colore_intonaco` (22), `finitura_intonaco` (9), `rivestimento_pietra` (8), `rivestimento_laterizio` (6), `cappotto_spessore` (7), `zona_rivestimento` (6)

### 3. Edge Function: `analyze-facade-photo`
- Auth via `supabase.auth.getUser(token)` pattern
- Calls Lovable AI Gateway with `google/gemini-2.5-flash` model
- Sends `image_url` (not base64) — matching analyze-bathroom-photo pattern
- Returns 25-field JSON analysis (building type, plaster color/finish, stone presence, thermal coat detection, etc.)
- Updates session status: `analyzing → analyzed`

### 4. Edge Function: `generate-facade-render`
- Auth + company verification (matching bathroom render pattern)
- Checks `render_credits.balance` by `company_id`
- Calls Lovable AI Gateway with `google/gemini-3.1-flash-image-preview` model + image_url
- Uploads result to `facciata-results` bucket
- Deducts render credit via `deduct_render_credit` RPC
- Updates session: `rendering → completed`

### 5. Routes + Pages
- Add lazy imports for `RenderFacciataHub` and `RenderFacciataNew` in `App.tsx`
- Add routes: `/app/render-facciata` and `/app/render-facciata/new`
- Create `RenderFacciataHub.tsx` placeholder with 4-step workflow cards and CTA
- Create empty `RenderFacciataNew.tsx` placeholder (full UI in Doc 2)

### 6. Sidebar Navigation
- Add `{ label: "Render Facciata", icon: Home, href: "/app/render-facciata" }` to the "STRUMENTI AI" section in `SidebarNav.tsx`

### Files to create/modify
- `src/pages/app/RenderFacciataHub.tsx` (new)
- `src/pages/app/RenderFacciataNew.tsx` (new placeholder)
- `src/App.tsx` (add lazy imports + routes)
- `src/components/layout/SidebarNav.tsx` (add nav item)
- `supabase/functions/analyze-facade-photo/index.ts` (new)
- `supabase/functions/generate-facade-render/index.ts` (new)
- `supabase/config.toml` (add function entries)
- DB migration (tables + RLS + storage + presets)

