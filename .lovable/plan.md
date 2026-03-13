

# Plan: Doc 5/5 — Demolizione Completa + Layout + Hub Gallery + Stili Pronti

## Overview

Complete the Render Bagno module with 5 additions: layout planner component, hub gallery update, prompt quality suffix, stili pronti DB table + picker, and integration into the wizard.

## Changes

### 1. Create `src/components/render-bagno/BathroomLayoutPlanner.tsx`
Layout planner for "demolizione completa" mode. Contains position selectors for shower, bathtub, vanity, WC with a schematic 2D preview. Accepts `ConfigLayout` value/onChange props.

### 2. Create `src/components/render-bagno/StiliProntiPicker.tsx`
Preset style picker that fetches from `render_bagno_stili_pronti` table. Shows color palette swatches + name/description. Calls `onApply(cfg)` to populate all configuration states at once. Uses `supabase` client directly (not auth-helpers).

### 3. Update `src/pages/app/RenderBagnoNew.tsx`
- Import `BathroomLayoutPlanner` and `StiliProntiPicker`
- Add `StiliProntiPicker` at top of Step 1 (tipo intervento) with `onApply` handler that sets all config states + sostituzione flags
- Add `BathroomLayoutPlanner` section in Step 2 (configurazione) when `tipoIntervento === "demolizione_completa"`

### 4. Update `src/pages/app/RenderBagnoHub.tsx`
Replace placeholder gallery with real gallery fetched from `render_bagno_gallery` (by `company_id`). Show gallery cards with thumbnail, title, date, download/delete actions. Keep existing hero + credits widget + steps grid.

### 5. Update `src/modules/render-bagno/lib/bathroomPromptBuilder.ts`
Add `QUALITY_SUFFIX` constant with detailed photorealism checklist, Italian bathroom proportions, lighting consistency rules, and grout line specs. Append it as last block in `buildBathroomPrompt()`.

### 6. DB Migration
- Create `render_bagno_stili_pronti` table (id, nome, descrizione, icon, tags, configurazione JSONB, preview_hex, sort_order, is_active)
- RLS: public SELECT for authenticated users
- Seed 8 preset styles (Minimalismo Nordico, Lusso Marmo, Industrial Dark, Naturale Botanico, Retrò Classico, Spa Giapponese, Mediterraneo Caldo, Contemporaneo Grigio)

## Order
1. DB migration (table + seed)
2. `BathroomLayoutPlanner.tsx`
3. `StiliProntiPicker.tsx`
4. Update `bathroomPromptBuilder.ts` (quality suffix)
5. Update `RenderBagnoNew.tsx` (integrate both components)
6. Update `RenderBagnoHub.tsx` (real gallery)

