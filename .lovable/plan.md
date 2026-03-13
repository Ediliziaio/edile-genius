

# Render Pavimento — Doc 5/5: Hub + Galleria + Stili Pronti + Menu

## Problem

The entire `render-pavimento` module does not exist. Docs 1-4 were never implemented:
- No DB tables (`render_pavimento_sessions`, `render_pavimento_gallery`, `render_pavimento_stili_pronti`)
- No storage buckets (`pavimento-originals`, `pavimento-results`)
- No edge functions (`analyze-floor-photo`, `generate-floor-render`)
- No `pavimentoPromptBuilder.ts`
- No UI components or pages
- No routes in `App.tsx` or sidebar nav

## Approach

Build the full module foundation alongside Doc 5/5 deliverables. Follow the same pattern used for persiane (where we bootstrapped everything in one pass).

## Changes

### 1. DB Migration
Create all three tables + storage buckets + stili pronti data:
- `render_pavimento_sessions` — tracks render jobs (user_id, company_id, status, image paths, config fields, prompts, dimensions)
- `render_pavimento_gallery` — saved results (user_id, company_id, session_id, result_image_url, tipo/pattern/finitura/colore metadata, is_favorite)
- `render_pavimento_stili_pronti` — 8 preset styles with JSONB config
- RLS policies for all tables
- Storage buckets: `pavimento-originals` (private), `pavimento-results` (public)

### 2. Edge Functions (stubs)
- `supabase/functions/analyze-floor-photo/index.ts` — stub returning demo analysis
- `supabase/functions/generate-floor-render/index.ts` — stub returning 501

### 3. Prompt Builder
- `src/modules/render-pavimento/lib/pavimentoPromptBuilder.ts` — types and `buildPavimentoPrompt()` function

### 4. UI Components (stubs for Doc 4 components)
- `TipoPavimentoPicker.tsx` — 10 floor types
- `PatternPosaPicker.tsx` — 11 laying patterns
- `FinituraSelector.tsx` — finish selector
- `PavimentoColorSelector.tsx` — color picker (palette/RAL/wood/free)
- `DimensioniPavimento.tsx` — tile/plank dimensions
- `FugaConfigurator.tsx` — grout config
- `StiliProntiPavimento.tsx` — 8 presets from DB with fallback

### 5. Pages
- `RenderPavimentoHub.tsx` — full hub with info/gallery tabs as specified in the prompt
- `RenderPavimentoNew.tsx` — 5-step wizard (upload → analysis → config → render → result)

### 6. Routing & Navigation
- `App.tsx` — add lazy imports and routes for `/app/render-pavimento` and `/app/render-pavimento/new`
- `SidebarNav.tsx` — add "Render Pavimento" under STRUMENTI AI section

## Files
- **Migration**: 3 tables + 2 buckets + 8 preset inserts
- **New**: `supabase/functions/analyze-floor-photo/index.ts`
- **New**: `supabase/functions/generate-floor-render/index.ts`
- **New**: `src/modules/render-pavimento/lib/pavimentoPromptBuilder.ts`
- **New**: 7 components in `src/modules/render-pavimento/components/`
- **New**: `src/pages/app/RenderPavimentoHub.tsx`
- **New**: `src/pages/app/RenderPavimentoNew.tsx`
- **Edit**: `src/App.tsx`
- **Edit**: `src/components/layout/SidebarNav.tsx`

