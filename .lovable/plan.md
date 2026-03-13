

# Doc 6/7: Generatore UI Wizard

## Analysis

The existing `NuovoPreventivo.tsx` is a 3-step wizard (client data, audio recording, voci editor) — all in one 730-line file. Doc 6/7 wants a 6-step wizard with new AI capabilities from Doc 4 (surface analysis, section generation, render selection).

Key adaptations needed:
- The prompt references `progetti` and `render_sessions` tables that don't exist. Will use `cantieri` for project context and skip render selection for now (no render tables with `progetto_id` exist).
- The prompt uses `Preventivo` as a stateful object passed through steps with `updateCampo`. The existing hook's `updateCampo` writes to DB immediately — will keep local state and save on step transitions instead.
- `PDFPreviewPanel` already exists — will reuse it in the final step.
- `usePreventivo` hook already has `analizzaSuperfici`, `generaSezione`, `generaTutte` — will wire these into steps 3 and 4.

## Plan

### 1. Rewrite `src/pages/app/NuovoPreventivo.tsx`
Replace the 730-line monolith with a 6-step wizard container:
- Step indicators with emoji labels
- AnimatePresence transitions (framer-motion already installed)
- Auto-save on step transitions via `usePreventivo.updateCampo`
- Creates preventivo record on first "Next" if no ID exists
- Loads existing preventivo if `?id=` param present

Steps: Cliente -> Progetto -> Superfici -> Contenuti -> Prezzi -> PDF

### 2. Create step components

**`src/components/preventivo/steps/StepDatiCliente.tsx`**
- Client name, email, phone, CF/PIVA
- Cantiere selection (from existing `cantieri` table)
- Work description, validity date with quick presets (15/30/60/90 days)
- Internal notes field

**`src/components/preventivo/steps/StepProgetto.tsx`**  
- Simplified: cantiere selector + oggetto lavori + render_ids text input
- Skip the `progetti` table (doesn't exist) — use cantiere as project context
- Show existing render gallery entries if any render_ids are set

**`src/components/preventivo/steps/StepSuperfici.tsx`**
- Photo upload (max 5) with drag-and-drop
- Uploads to `preventivo-kb` storage bucket
- Calls `analizzaSuperfici` from `usePreventivo`
- Displays results: surface list with confidence badges
- Skip-able step

**`src/components/preventivo/steps/StepSezioni.tsx`**
- Lists template sections from `SEZIONI_DEFAULT`
- Toggle active/inactive per section
- "Genera tutto" banner calling `generaTutte`
- Per-section "Genera con AI" / "Rigenera" buttons
- Inline preview/edit of generated text
- Progress indicators per section

**`src/components/preventivo/steps/StepVoci.tsx`**
- Existing voci editor (migrated from current step 3)
- Category-grouped table with inline editing
- AI-suggested badge for voci from surface analysis
- Totals section with discount/IVA controls

**`src/components/preventivo/steps/StepPDF.tsx`**
- Completeness checklist
- Embeds existing `PDFPreviewPanel`
- "Torna alla lista" link

### 3. Shared step types
Create `src/components/preventivo/steps/types.ts` with common `StepProps` interface that all steps share.

### Files
- **Rewrite**: `src/pages/app/NuovoPreventivo.tsx` (wizard container)
- **Create**: `src/components/preventivo/steps/types.ts`
- **Create**: `src/components/preventivo/steps/StepDatiCliente.tsx`
- **Create**: `src/components/preventivo/steps/StepProgetto.tsx`
- **Create**: `src/components/preventivo/steps/StepSuperfici.tsx`
- **Create**: `src/components/preventivo/steps/StepSezioni.tsx`
- **Create**: `src/components/preventivo/steps/StepVoci.tsx`
- **Create**: `src/components/preventivo/steps/StepPDF.tsx`

