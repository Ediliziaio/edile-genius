

# Doc 6/7: Generatore UI Wizard — Gap Analysis & Plan

## Already Implemented

The project has a fully working wizard and list:

- **`NuovoPreventivo.tsx`** — 6-step wizard with AnimatePresence, auto-save on step transitions, load existing preventivo by URL param. Working.
- **`StepDatiCliente`** — Client data + project details + cantiere selector + validity presets. Working.
- **`StepProgetto`** — Audio recording/upload + AI extraction + render IDs. Working.
- **`StepSuperfici`** — Photo upload + AI surface analysis with confidence badges. Working.
- **`StepSezioni`** — "Generate all" banner, per-section generate/regenerate, toggle, inline edit. Working.
- **`StepVoci`** — Inline editable voci grouped by category, totals with discount/IVA. Working.
- **`StepPDF`** — Completion checklist + PDF preview panel. Working.
- **`PreventiviList.tsx`** — 4 KPI cards, search, stato filter tabs, list with badges. Working.

## What Doc 6 Proposes vs What Exists

Doc 6 proposes a 7-step wizard (adding StepTemplate), a project picker from a `progetti` table, and render selection from `render_interni`/`render_esterni` tables. **These tables do not exist in the database schema.** The existing implementation works with the actual schema (using `cantieri`, audio processing, and direct render ID input).

The doc also references non-existent imports (`@/constants/preventivo`, `@/types/preventivo`, `STATO_PREVENTIVO_CONFIG`, `VALIDITA_PRESETS`, `IVA_OPTIONS`). Implementing those would create broken imports.

## Gaps Worth Filling (UX Polish Only)

### 1. Upgrade step indicator to numbered circles with checkmarks
Current: flat progress bars. Doc proposes: numbered circles (1-6) with check icons for completed steps + a `Progress` bar underneath. Better visual feedback.

### 2. Add directional slide animation
Current: always slides from right. Doc proposes: `custom={direction}` variant so going back slides from left. Minor but polished.

### 3. Add "Tasso di conversione" KPI to PreventiviList
Current list has 4 KPIs (Totale, Bozze, In attesa, Valore accettati). Add conversion rate percentage (accettati / inviati+accettati+rifiutati).

## Files to Modify

| File | Action |
|------|--------|
| `src/pages/app/NuovoPreventivo.tsx` | Upgrade step indicator to circles with checkmarks, add directional slide, add Progress bar |
| `src/pages/app/PreventiviList.tsx` | Add conversion rate KPI card |

No new files, dependencies, or DB changes needed. Everything functional is already in place.

