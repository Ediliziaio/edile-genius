

# Render Facciata — UI Wizard RenderFacciataNew.tsx (Doc 3/5)

## Key Deviations from User Prompt
The user prompt uses patterns inconsistent with the existing codebase. The implementation will follow established conventions:

- **Auth**: Use `useAuth()` + `useCompanyId()` (not `useSupabaseClient`/`useUser` from auth-helpers which aren't installed)
- **Supabase client**: Use `import { supabase } from "@/integrations/supabase/client"` (existing pattern)
- **Session insert**: Include `company_id` (required field in DB schema)
- **Analyze edge function**: Send `image_url` (signed URL), not `imageBase64` — matching the existing `analyze-facade-photo` implementation which expects `{ image_url }`
- **Generate edge function**: Send `session_id` + prompt fields matching `generate-facade-render` which reads session data server-side
- **Gallery save**: Include `company_id` + use signed URL for original (not blob URL)
- **Doc 4 components**: Since Doc 4 hasn't been created yet, inline simplified versions of `ColoreIntonacoSelector`, `RivestimentoPicker`, `CappottoConfigurator`, and `ElementiArchitettoniciPanel` directly in the wizard (or create placeholder stub components)

## Implementation Steps

### 1. Create stub components for Doc 4 imports
Create 4 minimal placeholder components in `src/modules/render-facciata/components/`:
- `ColoreIntonacoSelector.tsx` — grid of color swatches from DB presets (`colore_intonaco`) + finitura dropdown
- `RivestimentoPicker.tsx` — material cards from DB presets (`rivestimento_pietra` + `rivestimento_laterizio`) + zona selector
- `CappottoConfigurator.tsx` — spessore slider + sistema radio + colore selector (reuses ColoreIntonacoSelector)
- `ElementiArchitettoniciPanel.tsx` — toggle switches for cornici/marcapiani/davanzali/zoccolatura

Each component will be functional with basic UI, loading presets from `render_facciata_presets` table. Full polish deferred to Doc 4.

### 2. Rewrite `RenderFacciataNew.tsx`
Complete 5-step wizard following the RenderBagnoNew pattern:
- **Step 1**: Photo upload with drag-drop, dimension detection, auto-upload to `facciata-originals`
- **Step 2**: AI analysis via signed URL to `analyze-facade-photo`, display 21-field results
- **Step 3**: Configuration — tipo intervento cards, conditional sub-panels, note, debug panel
- **Step 4**: Generation with rotating status messages, calls `generate-facade-render` with `session_id` + prompts from `buildFacciataPrompt`
- **Step 5**: Result display with before/after toggle, download, save to gallery

### Files to create/modify
- `src/modules/render-facciata/components/ColoreIntonacoSelector.tsx` (new)
- `src/modules/render-facciata/components/RivestimentoPicker.tsx` (new)
- `src/modules/render-facciata/components/CappottoConfigurator.tsx` (new)
- `src/modules/render-facciata/components/ElementiArchitettoniciPanel.tsx` (new)
- `src/pages/app/RenderFacciataNew.tsx` (rewrite)

